// backend/routes/escolaRoutes.js

/**
 * Visão Geral:
 * Este módulo define as rotas da API para o recurso "escolas".
 * Ele lida com operações CRUD (Create, Read, Update, Delete) para escolas,
 * utilizando a conexão com o banco de dados (`dbConnection.js`) e middlewares
 * de autorização (`authMiddleware.js`) para controlar o acesso.
 *
 * Middlewares Aplicados:
 * - `authenticateToken` (aplicado globalmente em `server.js` para `/api/escolas`):
 *   Garante que todas as rotas neste módulo sejam acessadas apenas por usuários autenticados.
 * - `authorizeAdmin`: Restringe o acesso a administradores para rotas específicas
 *   (criar e excluir escolas).
 * - `authorizeSchoolAccess`: Controla o acesso para visualização e atualização de escolas
 *   específicas, permitindo que:
 *     - Admins acessem/modifiquem qualquer escola.
 *     - Usuários 'escola' acessem/modifiquem apenas sua própria escola.
 *     - Usuários 'user' (SME) visualizem (GET) qualquer escola, mas não modifiquem.
 *
 * Interação com o Frontend:
 * Este conjunto de rotas interage principalmente com:
 * - `PainelControleView.vue` (frontend/src/views/Escolas/PainelControleView.vue):
 *   - Para listar todas as escolas (`GET /`).
 *   - Para cadastrar uma nova escola (`POST /`, acessível por admin).
 *   - Para iniciar a edição de uma escola (que levará à busca dos detalhes da escola e,
 *     posteriormente, à submissão de `PUT /:id`).
 *   - Para excluir uma escola (`DELETE /:id`, acessível por admin).
 * - `EscolaDetalhesView.vue` (frontend/src/views/Escolas/EscolaDetalhesView.vue):
 *   - Para buscar os detalhes de uma escola específica (`GET /:id`).
 *   - Potencialmente para atualizar dados da escola (`PUT /:id`, se essa funcionalidade
 *     for implementada diretamente nesta view).
 * - `RegisterUserView.vue` (frontend/src/views/admin/RegisterUserView.vue):
 *   - Para listar as escolas no dropdown ao cadastrar um novo usuário com o papel 'escola' (`GET /`).
 * - `apiService.js` (frontend/src/services/apiService.js):
 *   - O `apiService` do frontend encapsulará as chamadas a estes endpoints.
 *
 * Estrutura das Rotas:
 * - `POST /`: Cadastra uma nova escola (Admin).
 * - `GET /`: Lista todas as escolas cadastradas (Admin, User, Escola).
 * - `GET /:id`: Obtém os detalhes de uma escola específica (Admin, User para GET, Escola para sua própria escola).
 * - `PUT /:id`: Atualiza os dados de uma escola existente (Admin, Escola para sua própria escola).
 * - `DELETE /:id`: Exclui uma escola (Admin).
 */

const express = require('express');
const db = require('../database/dbConnection'); // Importa a conexão com o banco de dados
// Importa os middlewares de autorização. `authenticateToken` é aplicado globalmente em server.js.
const { authorizeAdmin, authorizeSchoolAccess } = require('../middleware/authMiddleware');

const router = express.Router(); // Cria uma nova instância do roteador do Express

// --- ROTA POST /api/escolas - Cadastrar Nova Escola ---
// Requer que o usuário esteja autenticado (via `authenticateToken` em server.js)
// E que o usuário seja um administrador (via `authorizeAdmin` middleware).
router.post('/', authorizeAdmin, async (req, res) => {
    // Extrai os dados da escola do corpo da requisição.
    const { nome, endereco, responsavel } = req.body;

    // 1. Validação básica dos dados de entrada.
    if (!nome || typeof nome !== 'string' || nome.trim() === '') {
        return res.status(400).json({ message: 'O nome da escola é obrigatório.' });
    }

    // 2. Prepara a query SQL e os parâmetros para inserção.
    const sql = `INSERT INTO escolas (nome, endereco, responsavel) VALUES (?, ?, ?)`;
    const params = [
        nome.trim(),         // Remove espaços em branco extras do nome.
        endereco || null,    // Usa null se o endereço não for fornecido.
        responsavel || null  // Usa null se o responsável não for fornecido.
    ];

    // 3. Executa a query de inserção no banco de dados.
    db.run(sql, params, function (err) { // `function` é usado para ter acesso a `this.lastID`.
        if (err) {
            // Trata erro de constraint de unicidade para o nome da escola.
            if (err.message.includes('UNIQUE constraint failed: escolas.nome')) {
                 console.log(`[POST /api/escolas] Tentativa de cadastrar escola com nome duplicado: "${nome.trim()}"`);
                 return res.status(409).json({ message: `A escola com o nome "${nome.trim()}" já existe.` }); // 409 Conflict
            }
            // Outros erros de banco.
            console.error('[POST /api/escolas] Erro ao inserir escola no banco:', err.message);
            return res.status(500).json({ message: 'Erro interno do servidor ao cadastrar a escola.' });
        }
        // 4. Resposta de sucesso.
        // `this.lastID` contém o ID da linha recém-inserida.
        console.log(`[POST /api/escolas] Escola "${nome.trim()}" (ID: ${this.lastID}) cadastrada com sucesso por ${req.user.username}.`);
        res.status(201).json({ // 201 Created
            id: this.lastID,
            nome: nome.trim(),
            endereco: endereco || null,
            responsavel: responsavel || null,
            // data_cadastro é gerada automaticamente pelo banco, mas poderia ser buscada e retornada se necessário.
        });
    });
});

// --- ROTA GET /api/escolas - Listar Todas as Escolas ---
// Requer autenticação (aplicada globalmente).
// Não requer autorização específica de papel (admin, user, escola podem listar).
router.get('/', (req, res) => {
    const sql = "SELECT id, nome, endereco, responsavel FROM escolas ORDER BY nome ASC"; // Ordena por nome

    db.all(sql, [], (err, rows) => { // `db.all` busca todas as linhas que correspondem à query.
        if (err) {
            console.error('[GET /api/escolas] Erro ao buscar lista de escolas:', err.message);
            return res.status(500).json({ message: 'Erro interno do servidor ao buscar escolas.' });
        }
        // Retorna a lista de escolas (pode ser um array vazio se não houver escolas).
        res.status(200).json(rows || []);
    });
});

// --- NOVA ROTA GET /api/escolas/com-status-estoque ---
// ## COLOCADA AQUI, ANTES DA ROTA /:id ##
router.get('/com-status-estoque', (req, res) => {
    const sqlEscolas = `SELECT id, nome, endereco, responsavel FROM escolas ORDER BY nome ASC`;
    const sqlTransacoes = `
        SELECT
            t.escola_id,
            ti.produto_id,
            ti.quantidade_enviada AS quantidade,
            t.data_recebimento_confirmado AS data_transacao,
            'entrada' as tipo
        FROM transferencia_itens ti
        JOIN transferencias t ON ti.transferencia_id = t.id
        -- CORREÇÃO AQUI: Garante que o produto da transação ainda existe.
        INNER JOIN produtos p ON ti.produto_id = p.id
        WHERE ti.status = 'confirmado' AND t.data_recebimento_confirmado IS NOT NULL

        UNION ALL

        SELECT
            rei.escola_id,
            rei.produto_id,
            rei.quantidade_retirada AS quantidade,
            rei.data_retirada AS data_transacao,
            'saida' as tipo
        FROM retiradas_escola_itens rei
        -- CORREÇÃO AQUI: Garante que o produto da transação ainda existe.
        INNER JOIN produtos p ON rei.produto_id = p.id;
    `;

    db.all(sqlEscolas, [], (errEscolas, escolas) => {
        if (errEscolas) {
            console.error("[GET /com-status-estoque] Erro ao buscar escolas:", errEscolas.message);
            return res.status(500).json({ error: "Erro ao buscar escolas." });
        }

        db.all(sqlTransacoes, [], (errTransacoes, transacoes) => {
            if (errTransacoes) {
                console.error("[GET /com-status-estoque] Erro ao buscar transações de estoque:", errTransacoes.message);
                return res.status(500).json({ error: "Erro ao processar estoque." });
            }

            // O restante da lógica JavaScript permanece exatamente o mesmo.
            // A mágica acontece na filtragem feita pela nova query SQL.
            const transacoesPorEscola = transacoes.reduce((acc, t) => {
                (acc[t.escola_id] = acc[t.escola_id] || []).push(t);
                return acc;
            }, {});

            const escolasComStatus = escolas.map(escola => {
                const suasTransacoes = transacoesPorEscola[escola.id] || [];
                let statusEstoque = 'ok';

                if (suasTransacoes.length > 0) {
                    const transacoesPorProduto = suasTransacoes.reduce((acc, t) => {
                        (acc[t.produto_id] = acc[t.produto_id] || []).push(t);
                        return acc;
                    }, {});

                    let temEstoqueZerado = false;
                    let temEstoqueBaixo = false;

                    for (const produtoId in transacoesPorProduto) {
                        const transacoesDoProduto = transacoesPorProduto[produtoId]
                            .sort((a, b) => new Date(a.data_transacao) - new Date(b.data_transacao));

                        let estoqueAtual = 0;
                        let picoDeEstoque = 0;

                        transacoesDoProduto.forEach(t => {
                            estoqueAtual += (t.tipo === 'entrada' ? t.quantidade : -t.quantidade);
                            if (estoqueAtual > picoDeEstoque) {
                                picoDeEstoque = estoqueAtual;
                            }
                        });
                        
                        if (estoqueAtual <= 0) {
                            temEstoqueZerado = true;
                        } else if (picoDeEstoque > 0 && estoqueAtual <= picoDeEstoque / 2) {
                            temEstoqueBaixo = true;
                        }
                    }

                    if (temEstoqueZerado) {
                        statusEstoque = 'zerado';
                    } else if (temEstoqueBaixo) {
                        statusEstoque = 'baixo';
                    }
                }
                return { ...escola, statusEstoque };
            });

            res.json(escolasComStatus);
        });
    });
});

// --- ROTA GET /api/escolas/:id - Obter detalhes de uma escola específica ---
// Requer autenticação (global) e autorização específica via `authorizeSchoolAccess`.
// `authorizeSchoolAccess` verifica se:
//   - Admin pode ver qualquer escola.
//   - User (SME) pode ver qualquer escola (para visualização, pois é GET).
//   - Usuário 'escola' pode ver apenas os detalhes da sua própria escola.
router.get('/:id', authorizeSchoolAccess, (req, res) => {
    const id = parseInt(req.params.id, 10); // Converte o ID da rota para número.
     if (isNaN(id)) { // Validação básica do ID.
        return res.status(400).json({ message: "ID da escola fornecido é inválido." });
    }

    // `authorizeSchoolAccess` já validou se o `req.user` tem permissão para esta ação GET nesta escola.
    const sql = `
        SELECT
            id,
            nome,
            endereco,
            responsavel,
            strftime('%Y-%m-%dT%H:%M:%SZ', data_cadastro) AS data_cadastro
        FROM escolas
        WHERE id = ?
    `;

    db.get(sql, [id], (err, row) => { // `db.get` busca uma única linha.
        if (err) {
            console.error(`[GET /api/escolas/:id] Erro ao buscar escola por ID ${id}:`, err.message);
            return res.status(500).json({ message: 'Erro interno do servidor ao buscar a escola.' });
        }
        if (!row) {
            // Se `authorizeSchoolAccess` permitiu o acesso, mas a escola não foi encontrada, é um 404 genuíno.
            console.log(`[GET /api/escolas/:id] Escola com ID ${id} não encontrada.`);
            return res.status(404).json({ message: 'Escola não encontrada.' });
        }
        res.status(200).json(row);
    });
});

// --- ROTA PUT /api/escolas/:id - Atualizar uma Escola Existente ---
// Requer autenticação (global) e autorização específica via `authorizeSchoolAccess`.
// `authorizeSchoolAccess` para métodos como PUT verifica se:
//   - Admin pode atualizar qualquer escola.
//   - Usuário 'escola' pode atualizar apenas sua própria escola.
//   - User (SME) NÃO pode atualizar (o middleware bloqueará).
router.put('/:id', authorizeSchoolAccess, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { nome, endereco, responsavel } = req.body; // Dados para atualização

    if (isNaN(id)) {
        return res.status(400).json({ message: "ID da escola fornecido é inválido." });
    }
    if (!nome || typeof nome !== 'string' || nome.trim() === '') {
        return res.status(400).json({ message: 'O nome da escola é obrigatório e não pode ser vazio.' });
    }
    // `authorizeSchoolAccess` já garantiu que o usuário tem permissão para MODIFICAR esta escola.

    // SQL para atualizar a escola. Pode incluir um campo `data_modificacao` se existir.
    const sql = `UPDATE escolas SET
                    nome = ?,
                    endereco = ?,
                    responsavel = ?
                    -- data_modificacao = CURRENT_TIMESTAMP -- Se sua tabela tiver este campo
                 WHERE id = ?`;
    const params = [
        nome.trim(),
        endereco || null,
        responsavel || null,
        id
    ];

    db.run(sql, params, function(err) {
         if (err) {
            // Trata erro de constraint de unicidade para o nome.
            if (err.message.includes('UNIQUE constraint failed: escolas.nome')) {
                 console.log(`[PUT /api/escolas/:id] Tentativa de atualizar escola ID ${id} com nome duplicado: "${nome.trim()}"`);
                 return res.status(409).json({ message: `Já existe outra escola com o nome "${nome.trim()}".` });
            }
            console.error(`[PUT /api/escolas/:id] Erro ao atualizar escola com ID ${id}:`, err.message);
            return res.status(500).json({ message: 'Erro interno do servidor ao atualizar a escola.' });
        }
        if (this.changes === 0) {
            // Se `authorizeSchoolAccess` passou, mas nenhuma linha foi alterada,
            // significa que a escola com o ID fornecido não existe.
            console.log(`[PUT /api/escolas/:id] Escola com ID ${id} não encontrada para atualização.`);
            return res.status(404).json({ message: 'Escola não encontrada para atualização.' });
        }
         console.log(`[PUT /api/escolas/:id] Escola com ID ${id} atualizada com sucesso pelo usuário ${req.user.username}.`);
         // Retorna o objeto atualizado (ou os dados enviados, por simplicidade).
         // Para retornar o objeto completo do banco, seria necessário um SELECT após o UPDATE.
         res.status(200).json({
             id: id,
             nome: nome.trim(),
             endereco: endereco || null,
             responsavel: responsavel || null
            });
    });
});

// --- ROTA DELETE /api/escolas/:id - Excluir uma Escola ---
// Requer autenticação (global) e que o usuário seja um administrador (`authorizeAdmin`).
router.delete('/:id', authorizeAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);

     if (isNaN(id)) {
        return res.status(400).json({ message: "ID da escola fornecido é inválido." });
    }
    // `authorizeAdmin` já garantiu que `req.user.role === 'admin'`.

    const sql = 'DELETE FROM escolas WHERE id = ?';

    db.run(sql, [id], function (err) {
        if (err) {
            console.error(`[DELETE /api/escolas/:id] Erro ao excluir escola com ID ${id}:`, err.message);
            // TODO: Considerar tratamento de erro para FOREIGN KEY constraint.
            // Se houver usuários ou transferências vinculados à escola, a exclusão pode ser bloqueada
            // dependendo da configuração `ON DELETE` das chaves estrangeiras (ex: RESTRICT).
            // Nesse caso, um status 409 Conflict com uma mensagem explicativa seria apropriado.
            return res.status(500).json({ message: 'Erro interno do servidor ao excluir a escola.' });
        }
        if (this.changes === 0) {
            // Nenhuma linha foi afetada, significa que a escola não foi encontrada.
            console.log(`[DELETE /api/escolas/:id] Escola com ID ${id} não encontrada para exclusão.`);
            return res.status(404).json({ message: 'Escola não encontrada para exclusão.' });
        }
        console.log(`[DELETE /api/escolas/:id] Escola com ID ${id} excluída com sucesso pelo admin ${req.user.username}.`);
        // Sucesso. Pode retornar 200 com mensagem ou 204 No Content.
        res.status(200).json({ message: 'Escola excluída com sucesso.' });
    });
});

module.exports = router; // Exporta o roteador para ser usado em server.js