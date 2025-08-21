// backend/routes/produtoRoutes.js

/**
 * Visão Geral:
 * Este módulo define as rotas da API para o recurso "produtos".
 * Ele lida com operações CRUD (Create, Read, Update, Delete) para os produtos
 * do estoque central (SME). Todas as rotas neste módulo são protegidas e requerem
 * autenticação, garantida pelo middleware `authenticateToken` aplicado
 * em `server.js` para o prefixo `/api/produtos`.
 *
 * Interação com o Banco de Dados:
 * - Todas as rotas interagem com a tabela `produtos` no banco de dados SQLite.
 *
 * Interação com o Frontend:
 * - `ProdutosView.vue` (frontend/src/views/Produtos/ProdutosView.vue):
 *   - Para listar todos os produtos (`GET /`).
 *   - Para cadastrar um novo produto (`POST /`).
 *   - Para atualizar um produto existente (`PUT /:id`).
 *   - Para excluir um produto (`DELETE /:id`).
 * - `apiService.js` (frontend/src/services/apiService.js):
 *   - O `apiService` do frontend encapsula as chamadas a estes endpoints,
 *     adicionando automaticamente o token de autenticação.
 *
 * Estrutura das Rotas:
 * - `POST /`: Cadastra um novo produto no estoque da SME.
 * - `GET /`: Lista todos os produtos do estoque da SME, ordenados pela data de modificação decrescente.
 * - `PUT /:id`: Atualiza os dados de um produto existente.
 * - `DELETE /:id`: Exclui um produto do estoque da SME.
 *
 * Validações e Respostas:
 * - As rotas de `POST` e `PUT` incluem validações para campos obrigatórios e tipos de dados.
 * - As respostas seguem os códigos de status HTTP padrão (200 OK, 201 Created, 204 No Content,
 *   400 Bad Request, 404 Not Found, 409 Conflict, 500 Internal Server Error).
 * - Em operações de criação e atualização bem-sucedidas, a rota tenta retornar o objeto
 *   completo do produto (recém-criado ou atualizado) do banco de dados.
 * - O campo `data_modificacao` é atualizado automaticamente em operações de `POST` e `PUT`.
 *   (Nota: O trigger no `server.js` também pode cuidar disso para `UPDATE` se outras colunas forem
 *   alteradas e não explicitamente a `data_modificacao` aqui).
 */

const express = require('express');
const db = require('../database/dbConnection'); // Importa a conexão com o banco de dados
// `authenticateToken` é aplicado globalmente no server.js para o prefixo /api/produtos,
// mas pode ser reafirmado aqui para clareza ou se houver necessidade de lógica específica
// antes dele em alguma rota futura dentro deste arquivo (atualmente não é o caso).
const { authorizeRole } = require('../middleware/authMiddleware');
const { registrarAcaoProduto } = require('../services/historicoService');
const router = express.Router(); // Cria uma nova instância do roteador do Express

// NOVO: Defina o mapa de categorias no topo do arquivo para fácil acesso e manutenção.
const categoriasMap = {
    graos_cereais: 'Grãos/Cereais',
    laticinios: 'Laticínios',
    carnes_ovos: 'Carnes/Ovos',
    frutas: 'Frutas',
    verduras_legumes: 'Verduras/Legumes', // A chave que queremos traduzir
    nao_pereciveis: 'Não Perecíveis',
    congelados: 'Congelados',
    limpeza: 'Limpeza',
    outros: 'Outros'
};

// --- ROTA POST /api/produtos - Cadastrar Novo Produto ---
// Protegida por `authenticateToken` aplicado globalmente em server.js.
router.post('/', (req, res) => { // `authenticateToken` já foi aplicado em server.js para /api/produtos
    // Extrai os dados do produto do corpo da requisição.
    const { nome, descricao, unidade_medida, categoria, quantidade, valor, data_vencimento } = req.body;

    // 1. Validação dos dados de entrada.
    if (!nome || !unidade_medida || !categoria) {
        return res.status(400).json({ error: 'Nome, Unidade de Medida e Categoria são obrigatórios.' });
    }
    // Valida se quantidade, se fornecida, é um número não negativo.
    const parsedQuantidade = parseFloat(quantidade);
    if (isNaN(parsedQuantidade) || parsedQuantidade < 0) { // Quantidade deve ser >= 0
        return res.status(400).json({ error: 'Quantidade inválida. Deve ser um número não negativo.' });
    }
    // Valida se valor, se fornecido, é um número não negativo.
    if (valor !== undefined && valor !== null && (isNaN(parseFloat(valor)) || parseFloat(valor) < 0)) {
        return res.status(400).json({ error: 'Valor inválido. Deve ser um número não negativo.' });
    }

// VERIFICAÇÃO DE NOME DUPLICADO (CASE-INSENSITIVE)
    const checkNameSql = "SELECT id FROM produtos WHERE LOWER(nome) = LOWER(?)";
    db.get(checkNameSql, [nome], (err, row) => {
        if (err) {
            console.error(`[POST /api/produtos] Erro ao verificar nome duplicado para "${nome}":`, err.message);
            return res.status(500).json({ error: 'Erro interno do servidor ao verificar o nome do produto.' });
        }
        if (row) {
            // Já existe um produto com este nome
            return res.status(409).json({ error: `Já existe um produto cadastrado com o nome "${nome}".` });
        }

    // 2. Define a data de modificação atual para o novo produto.
    // Esta dataModificacaoAtual é usada no INSERT. O SELECT de retorno usará strftime.
    const parsedValor = (valor === '' || valor === undefined || valor === null) ? null : parseFloat(valor);
    const dataModificacaoAtualParaInsert = new Date().toISOString(); // Formato ISO8601 (YYYY-MM-DDTHH:mm:ss.sssZ)

    // 3. Prepara a query SQL para inserção.
    const insertSql = `
        INSERT INTO produtos (nome, descricao, unidade_medida, categoria, quantidade, quantidade_referencia_alerta, valor, data_vencimento, data_modificacao, data_cadastro)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    // 4. Executa a query de inserção.
    db.run(insertSql, [
        nome,
        descricao,
        unidade_medida,
        categoria,
        parsedQuantidade,
        parsedQuantidade,
        (valor === '' || valor === undefined || valor === null) ? null : parseFloat(valor),
        (data_vencimento === '' || data_vencimento === undefined || data_vencimento === null) ? null : data_vencimento,
        dataModificacaoAtualParaInsert // Usa a data definida na aplicação para data_modificacao no INSERT
    ], function (err) { // Usa `function` para ter acesso a `this.lastID`.
        if (err) {
            console.error(`[POST /api/produtos] Erro ao cadastrar produto "${nome}":`, err.message);
             // Trata erros específicos do banco.
             if (err.message.includes('NOT NULL constraint failed')) {
                 return res.status(400).json({ error: 'Erro nos dados fornecidos: Verifique se todos os campos obrigatórios foram preenchidos corretamente.' });
             }
             if (err.message.includes('UNIQUE constraint failed')) { // Ex: se 'nome' fosse UNIQUE
                  return res.status(409).json({ error: 'Erro: Já existe um produto com este nome.' }); // 409 Conflict
             }
            return res.status(500).json({ error: 'Erro interno do servidor ao cadastrar o produto.' });
        }

        // 5. Produto inserido com sucesso. Busca o produto recém-inserido para retorná-lo completo.
        const newProductId = this.lastID;

        // Busca o nome legível da categoria no mapa. Se não encontrar, usa a própria chave.
        const categoriaLegivel = categoriasMap[categoria] || categoria;

        const detalhesCriacao = [
                `Produto criado.`,
                `Nome: ${nome}.`,
                `Categoria: ${categoriaLegivel}.`,
                `Unidade: ${unidade_medida}.`,
                `Qtd: ${parsedQuantidade}.`
            ];

            // Adiciona valor e vencimento apenas se foram fornecidos.
            if (parsedValor !== null) {
                detalhesCriacao.push(`Valor: R$ ${parsedValor.toFixed(2).replace('.', ',')}.`);
            }
            if (data_vencimento) {
                // Formata a data para DD/MM/YYYY para ser mais legível no log
                try {
                    const [ano, mes, dia] = data_vencimento.split('-');
                    detalhesCriacao.push(`Vencimento: ${dia}/${mes}/${ano}.`);
                } catch (e) {
                    detalhesCriacao.push(`Vencimento: ${data_vencimento}.`);
                }
            }
            
            // Junta tudo em uma única string.
            const detalhesCompletos = detalhesCriacao.join(' ');

            // Chama o serviço de histórico com os novos detalhes.
            registrarAcaoProduto(
                newProductId,
                nome,
                'CRIACAO',
                detalhesCompletos,
                req.user.id,
                req.user.username
            );      

        // MODIFICAÇÃO: Formatar APENAS data_modificacao
        const selectSql = `
            SELECT
                id, nome, descricao, unidade_medida, categoria, quantidade, quantidade_referencia_alerta, valor, data_vencimento,
                strftime('%Y-%m-%dT%H:%M:%SZ', data_modificacao) AS data_modificacao,
                data_cadastro  -- data_cadastro permanece como o banco retorna
            FROM produtos
            WHERE id = ?
        `;
        db.get(selectSql, [newProductId], (selectErr, newProductRow) => { // Renomeado para newProductRow
            if (selectErr || !newProductRow) {
                console.error(`[POST /api/produtos] Produto ID ${newProductId} cadastrado, mas houve erro ao buscar os dados completos:`, selectErr?.message);
                 return res.status(201).json({
                    message: "Produto cadastrado com sucesso, mas houve um erro ao recuperar todos os seus dados atualizados.",
                    id: newProductId,
                    nome: nome,
                    categoria: categoria,
                    unidade_medida: unidade_medida,
                    quantidade: parsedQuantidade,
                    quantidade_referencia_alerta: parsedQuantidade, // Retorna o valor que foi inserido
                    data_modificacao: dataModificacaoAtualParaInsert
                 });
            }
            console.log(`[POST /api/produtos] Produto "${newProductRow.nome}" (ID: ${newProductRow.id}) cadastrado por ${req.user?.username || 'usuário'}.`);
            res.status(201).json(newProductRow);
        });
    });
});
});


// --- ROTA GET /api/produtos - Listar Todos os Produtos ---
// Protegida por `authenticateToken` aplicado globalmente.
router.get('/', (req, res) => { // `authenticateToken` já foi aplicado
    // Ordena os produtos pela data de modificação mais recente primeiro.
    // MODIFICAÇÃO: Formatar APENAS data_modificacao
    const sql = `
        SELECT
            id, nome, descricao, unidade_medida, categoria, quantidade, quantidade_referencia_alerta, valor, data_vencimento,
            strftime('%Y-%m-%dT%H:%M:%SZ', data_modificacao) AS data_modificacao,
            data_cadastro
        FROM produtos
        ORDER BY data_modificacao DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("[GET /api/produtos] Erro ao listar produtos:", err.message);
            return res.status(500).json({ error: 'Erro interno do servidor ao buscar produtos.' });
        }
        res.status(200).json(rows || []);
    });
});

// --- ROTA PUT /api/produtos/:id - Atualizar um Produto Existente ---
// Protegida por `authenticateToken` aplicado globalmente.
router.put('/:id', (req, res) => { // `authenticateToken` já foi aplicado
    const { id } = req.params; // ID do produto a ser atualizado.
    const { nome, descricao, unidade_medida, categoria, quantidade, valor, data_vencimento } = req.body;

    // 1. Validação dos dados de entrada (similar à rota POST).
    if (!nome || !unidade_medida || !categoria) {
        return res.status(400).json({ error: 'Nome, Unidade de Medida e Categoria são obrigatórios para atualização.' });
    }
    if (quantidade === undefined || quantidade === null || quantidade === '' || isNaN(parseFloat(quantidade)) || parseFloat(quantidade) < 0) {
        return res.status(400).json({ error: 'Quantidade inválida. Deve ser um número não negativo.' });
    }
    if (valor !== undefined && valor !== null && (isNaN(parseFloat(valor)) || parseFloat(valor) < 0)) {
        return res.status(400).json({ error: 'Valor inválido. Deve ser um número não negativo.' });
    }

    // NOVO: Precisamos buscar o estado atual do produto ANTES de atualizá-lo para registrar as mudanças.
    const getProdutoAtualSql = "SELECT * FROM produtos WHERE id = ?";
    db.get(getProdutoAtualSql, [id], (getErr, produtoAntigo) => {
        if (getErr) {
            console.error(`[PUT /api/produtos/:id] Erro ao buscar produto antigo ID ${id}:`, getErr.message);
            return res.status(500).json({ error: 'Erro interno ao preparar a atualização do produto.' });
        }
        if (!produtoAntigo) {
            return res.status(404).json({ error: 'Produto não encontrado para atualização.' });
        }

        // VERIFICAÇÃO DE NOME DUPLICADO (CASE-INSENSITIVE), EXCLUINDO O PRÓPRIO PRODUTO ATUAL
        const checkNameSql = "SELECT id FROM produtos WHERE LOWER(nome) = LOWER(?) AND id != ?";
        db.get(checkNameSql, [nome, id], (err, row) => {
            if (err) {
                console.error(`[PUT /api/produtos/:id] Erro ao verificar nome duplicado para "${nome}" (ID: ${id}):`, err.message);
                return res.status(500).json({ error: 'Erro interno do servidor ao verificar o nome do produto.' });
            }
            if (row) {
                // Já existe OUTRO produto com este nome
                return res.status(409).json({ error: `Já existe outro produto cadastrado com o nome "${nome}".` });
            }

    // 2. Define a data de modificação atual para o UPDATE.
    const dataModificacaoAtualParaUpdate = new Date().toISOString();

    // 3. Prepara a query SQL para atualização.
    const updateSql = `
        UPDATE produtos
        SET nome = ?,
            descricao = ?,
            unidade_medida = ?,
            categoria = ?,
            quantidade = ?,
            valor = ?,
            data_vencimento = ?,
            data_modificacao = ?  -- Atualiza explicitamente a data de modificação
        WHERE id = ?
    `;

    // 4. Executa a query de atualização.
    db.run(updateSql, [
        nome,
        descricao,
        unidade_medida,
        categoria,
        parseFloat(quantidade),
        (valor === '' || valor === undefined || valor === null) ? null : parseFloat(valor),
        (data_vencimento === '' || data_vencimento === undefined || data_vencimento === null) ? null : data_vencimento,
        dataModificacaoAtualParaUpdate, // Usa a data definida na aplicação para data_modificacao no UPDATE
        id
    ], function (err) { // Usa `function` para ter acesso a `this.changes`.
        if (err) {
            console.error(`[PUT /api/produtos/:id] Erro ao atualizar produto ID ${id}:`, err.message);
             if (err.message.includes('UNIQUE constraint failed')) { // Ex: se 'nome' for UNIQUE
                  return res.status(409).json({ error: 'Erro: Já existe outro produto com este nome.' });
             }
            return res.status(500).json({ error: 'Erro interno do servidor ao atualizar o produto.' });
        }

        // NOVO: Se a atualização teve efeito, registra no histórico.
                if (this.changes > 0) {
const detalhes = [];
                    const novoValorParsed = (valor === '' || valor === undefined || valor === null) ? null : parseFloat(valor);
                    const novaDataVencimento = (data_vencimento === '' || data_vencimento === undefined || data_vencimento === null) ? null : data_vencimento;

                    // 1. Compara Nome
                    if (produtoAntigo.nome !== nome) {
                        detalhes.push(`Nome alterado de "${produtoAntigo.nome}" para "${nome}".`);
                    }
                    // 2. Compara Descrição (tratando nulos e vazios)
                    if ((produtoAntigo.descricao || '') !== (descricao || '')) {
                        detalhes.push(`Descrição alterada.`); // Mensagem simples para não poluir o log
                    }
                    // 3. Compara Unidade de Medida
                    if (produtoAntigo.unidade_medida !== unidade_medida) {
                        detalhes.push(`Unidade alterada de "${produtoAntigo.unidade_medida}" para "${unidade_medida}".`);
                    }
                    // 4. Compara Categoria (usando o mapa para nomes legíveis)
                    if (produtoAntigo.categoria !== categoria) {
                        const categoriaAntigaLegivel = categoriasMap[produtoAntigo.categoria] || produtoAntigo.categoria;
                        const categoriaNovaLegivel = categoriasMap[categoria] || categoria;
                        detalhes.push(`Categoria alterada de "${categoriaAntigaLegivel}" para "${categoriaNovaLegivel}".`);
                    }
                    // 5. Compara Quantidade
                    if (produtoAntigo.quantidade != quantidade) { // Usar != para comparar número com string 'número'
                        detalhes.push(`Quantidade alterada de ${produtoAntigo.quantidade} para ${quantidade}.`);
                    }
                    // 6. Compara Valor
                    if (produtoAntigo.valor !== novoValorParsed) {
                        const valorAntigoStr = produtoAntigo.valor !== null ? `R$ ${Number(produtoAntigo.valor).toFixed(2).replace('.', ',')}` : 'N/A';
                        const valorNovoStr = novoValorParsed !== null ? `R$ ${novoValorParsed.toFixed(2).replace('.', ',')}` : 'N/A';
                        detalhes.push(`Valor alterado de ${valorAntigoStr} para ${valorNovoStr}.`);
                    }
                    // 7. Compara Data de Vencimento
                    if (produtoAntigo.data_vencimento !== novaDataVencimento) {
                        const dataAntigaStr = produtoAntigo.data_vencimento ? produtoAntigo.data_vencimento.split('-').reverse().join('/') : 'N/A';
                        const dataNovaStr = novaDataVencimento ? novaDataVencimento.split('-').reverse().join('/') : 'N/A';
                        detalhes.push(`Vencimento alterado de ${dataAntigaStr} para ${dataNovaStr}.`);
                    }

                    // Só registra se houve alguma mudança detectada.
                    if (detalhes.length > 0) {
                        registrarAcaoProduto(
                            id,
                            nome, // Usa o novo nome como snapshot
                            'EDICAO',
                            detalhes.join(' '), // Junta todas as mudanças em uma única string
                            req.user.id,
                            req.user.username
                        );
                    }
                }

        // SQL para buscar o produto (seja após alteração ou para o caso de "dados idênticos")
        // MODIFICAÇÃO: Formatar APENAS data_modificacao
        const selectProdutoSql = `
            SELECT
                    id, nome, descricao, unidade_medida, categoria, quantidade, quantidade_referencia_alerta, valor, data_vencimento,
                    strftime('%Y-%m-%dT%H:%M:%SZ', data_modificacao) AS data_modificacao,
                    data_cadastro
                FROM produtos
                WHERE id = ?
            `;

        // 5. Verifica se alguma linha foi realmente alterada.
        if (this.changes === 0) {
            // Nenhuma linha alterada. Verifica se o produto existe para diferenciar de "dados idênticos".
            db.get(selectProdutoSql, [id], (findErr, productRow) => { // Renomeado para productRow
                if (findErr || !productRow) { // Erro ao buscar ou produto não encontrado.
                     // Se row é null, o produto não existe.
                     console.error(`[PUT /api/produtos/:id] Erro ao buscar produto ID ${id} após tentativa de atualização (sem alterações) ou produto não encontrado:`, findErr?.message);
                     return res.status(productRow ? 500 : 404).json({ error: productRow ? 'Erro ao buscar dados do produto.' : 'Produto não encontrado para atualização.' });
                    }
                // Produto existe, mas os dados enviados eram idênticos aos do banco.
                console.log(`[PUT /api/produtos/:id] Produto ID ${id} solicitado para atualização, mas nenhum dado foi efetivamente alterado (ou já estava atualizado).`);
                res.status(200).json(productRow); // Retorna o estado atual do produto, com data_modificacao formatada.
             });
        } else {
             // 6. Produto atualizado com sucesso. Busca o produto atualizado para retornar.
             db.get(selectProdutoSql, [id], (selectErr, updatedProductRow) => { // Renomeado para updatedProductRow
                if (selectErr || !updatedProductRow) {
                    console.error(`[PUT /api/produtos/:id] Produto ID ${id} atualizado, mas erro ao buscar os dados completos:`, selectErr?.message);
                    return res.status(200).json({
                       message: "Produto atualizado com sucesso, mas houve um erro ao recuperar todos os seus dados atualizados.",
                       id: id,
                       data_modificacao: dataModificacaoAtualParaUpdate // Retorna o que foi setado
                   });
                }
                console.log(`[PUT /api/produtos/:id] Produto "${updatedProductRow.nome}" (ID: ${id}) atualizado por ${req.user?.username || 'usuário'}.`);
                res.status(200).json(updatedProductRow);
                });
            }
        });
    });
  });
});


// --- ROTA DELETE /api/produtos/:id - Excluir um Produto ---
// Protegida por `authenticateToken` aplicado globalmente.
router.delete('/:id', (req, res) => { // `authenticateToken` já foi aplicado
    const { id } = req.params; // ID do produto a ser excluído.
    // NOVO: Buscar os dados do produto ANTES de excluí-lo para termos o nome para o log.
    const getProdutoSql = "SELECT nome FROM produtos WHERE id = ?";
    db.get(getProdutoSql, [id], (getErr, produtoParaExcluir) => {
        if (getErr) {
            console.error(`[DELETE /api/produtos/:id] Erro ao buscar produto para exclusão ID ${id}:`, getErr.message);
            return res.status(500).json({ error: 'Erro interno ao preparar a exclusão do produto.' });
        }
        if (!produtoParaExcluir) {
            return res.status(404).json({ error: 'Produto não encontrado para exclusão.' });
        }

        const deleteSql = "DELETE FROM produtos WHERE id = ?";
        db.run(deleteSql, id, function(err) {
            if (err) {
                // ... (tratamento de erro existente)
                return res.status(500).json({ error: 'Erro interno do servidor ao excluir o produto.' });
            }

            // NOVO: Se a exclusão teve sucesso, registra no histórico.
            if (this.changes > 0) {
                registrarAcaoProduto(
                    id,
                    produtoParaExcluir.nome, // Usamos o nome que buscamos antes de deletar
                    'EXCLUSAO',
                    `Produto "${produtoParaExcluir.nome}" foi permanentemente excluído.`,
                    req.user.id,
                    req.user.username
                );
                res.status(204).send();
            } else {
                // Este caso é redundante por causa da verificação anterior, mas é bom manter por segurança.
                return res.status(404).json({ error: 'Produto não encontrado para exclusão.' });
            }
        });
    });
});

// --- ROTA POST /api/produtos/reabastecer-multiplos - Reabastecer Estoque de Múltiplos Produtos ---
// Protegida por `authenticateToken` (global) e `authorizeRole` (específico)
router.post('/reabastecer-multiplos', authorizeRole(['admin', 'user']), async (req, res) => {
    const { itens } = req.body; // Espera um array [{ produto_id, quantidade_adicionada }]
    const userId = req.user?.id; // ou req.user.username para log
    const username = req.user?.username || 'usuário desconhecido';

    if (!Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ error: 'Nenhum item fornecido para reabastecimento.' });
    }

    const produtosAtualizados = [];
    let erroValidacao = null;

    // Validar todos os itens antes de iniciar a transação
    for (const item of itens) {
        if (!item.produto_id || typeof item.quantidade_adicionada !== 'number' || item.quantidade_adicionada <= 0) {
            erroValidacao = `Dados inválidos para o produto ID ${item.produto_id || 'desconhecido'}. Quantidade a adicionar deve ser um número positivo.`;
            break;
        }
    }

    if (erroValidacao) {
        return res.status(400).json({ error: erroValidacao });
    }

    // Função auxiliar para executar queries com Promises (para melhor controle do fluxo assíncrono)
    const runQuery = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) { // Usar function para this
                if (err) return reject(err);
                resolve(this); // Resolve com o contexto (this.lastID, this.changes)
            });
        });
    };

    const getQuery = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    };

    const produtosAtualizadosParaRetorno = [];
    
    // Iniciar transação
    try {
        await runQuery('BEGIN TRANSACTION');
        console.log(`[POST /reabastecer-multiplos] Transação iniciada por ${username}.`);

        for (const item of itens) {
            const produtoExistente = await getQuery("SELECT id, nome, quantidade FROM produtos WHERE id = ?", [item.produto_id]);
            
            if (!produtoExistente) {
                // Este erro fará o catch ser acionado e a transação ser revertida.
                throw new Error(`Produto com ID ${item.produto_id} não encontrado.`);
            }

            const quantidadeAdicionadaNum = Number(item.quantidade_adicionada);
            const quantidadeAtualNum = Number(produtoExistente.quantidade) || 0;
            const novaQuantidadeTotal = quantidadeAtualNum + quantidadeAdicionadaNum;
            const dataModificacaoAtual = new Date().toISOString();

            await runQuery(
                "UPDATE produtos SET quantidade = ?, quantidade_referencia_alerta = ?, data_modificacao = ? WHERE id = ?",
                [novaQuantidadeTotal, novaQuantidadeTotal, dataModificacaoAtual, item.produto_id]
            );

            // NOVO: Registrar a ação de reabastecimento no histórico para cada item.
            registrarAcaoProduto(
                item.produto_id,
                produtoExistente.nome,
                'REABASTECIMENTO',
                `Estoque reabastecido com ${item.quantidade_adicionada} unidade(s). Quantidade anterior: ${produtoExistente.quantidade}. Nova quantidade: ${novaQuantidadeTotal}.`,
                userId,
                username
            );

// Buscar o produto totalmente atualizado para retornar
const produtoAtualizadoComReferencia = await getQuery(`
    SELECT id, nome, descricao, unidade_medida, categoria, quantidade, quantidade_referencia_alerta, valor, data_vencimento,
           strftime('%Y-%m-%dT%H:%M:%SZ', data_modificacao) AS data_modificacao,
           data_cadastro
    FROM produtos WHERE id = ?
`, [item.produto_id]);

if (produtoAtualizadoComReferencia) {
    produtosAtualizadosParaRetorno.push(produtoAtualizadoComReferencia);
} else {
     console.warn(`[POST /reabastecer-multiplos] Produto ID ${item.produto_id} não encontrado APÓS update para reabastecimento por ${username}. Isso não deveria acontecer.`);
     // Poderia lançar um erro aqui para reverter a transação se isso for crítico.
}
}

        await runQuery('COMMIT');
        res.status(200).json({ 
            message: 'Estoque reabastecido com sucesso!',
            produtos_atualizados: produtosAtualizadosParaRetorno 
        });

    } catch (error) {
        console.error(`[POST /reabastecer-multiplos] Erro na transação de reabastecimento para ${username}:`, error.message);
        try {
            await runQuery('ROLLBACK');
            console.log(`[POST /reabastecer-multiplos] Transação ROLLBACK para ${username} devido a erro.`);
        } catch (rollbackError) {
            console.error("[POST /reabastecer-multiplos] Erro CRÍTICO ao tentar reverter a transação (ROLLBACK):", rollbackError.message);
            // Se o rollback falhar, o estado do banco pode ser inconsistente.
            // É um erro grave, talvez necessite de intervenção manual ou log mais detalhado.
        }
        res.status(500).json({ error: error.message || 'Erro interno ao reabastecer estoque.' });
    }
});
// --- FIM DA NOVA SEÇÃO ---

module.exports = router; // Exporta o roteador.