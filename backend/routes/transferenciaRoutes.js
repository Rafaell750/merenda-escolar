// backend/routes/transferenciaRoutes.js

/**
 * Visão Geral:
 * Este módulo define as rotas da API para gerenciar transferências de estoque
 * entre o estoque central (SME) e as escolas. Ele lida com o registro de novas
 * transferências (envios), a busca de transferências pendentes e confirmadas,
 * e a confirmação do recebimento de transferências pelas escolas.
 *
 * Todas as rotas neste módulo são protegidas e requerem autenticação,
 * garantida pelo middleware `authenticateToken` aplicado globalmente em `server.js`
 * para o prefixo `/api/transferencias`.
 *
 * Interação com o Banco de Dados:
 * - Interage com as tabelas `transferencias`, `transferencia_itens`, `produtos`, e `usuarios`.
 * - Utiliza transações do SQLite para garantir a atomicidade em operações complexas
 *   como o registro de uma nova transferência (que envolve inserção em `transferencias`,
 *   inserção em `transferencia_itens` e atualização de `produtos`).
 *
 * Interação com o Frontend:
 * - `ProdutosView.vue` (através do `EnviarEstoqueModal.vue`):
 *   - Para registrar um novo envio de estoque para uma escola (`POST /`).
 * - `EscolaDetalhesView.vue`:
 *   - Para buscar transferências já confirmadas como recebidas pela escola
 *     (`GET /confirmadas/por-escola/:escolaId`).
 *   - Para buscar transferências pendentes de confirmação para a escola
 *     (`GET /pendentes/por-escola/:escolaId`), usado no `ConfirmarRecebimentoModal.vue`.
 * - `ConfirmarRecebimentoModal.vue` (via `EscolaDetalhesView.vue`):
 *   - Para marcar uma ou mais transferências como recebidas (`POST /confirmar-recebimento`).
 * - `apiService.js`: Encapsula as chamadas a estes endpoints.
 *
 * Estrutura das Rotas:
 * - `POST /`: Registra uma nova transferência de estoque da SME para uma escola.
 *   - Valida entrada, verifica estoque disponível, e atualiza as quantidades dos produtos.
 * - `GET /confirmadas/por-escola/:escolaId`: Lista todas as transferências que já foram
 *   confirmadas como recebidas por uma escola específica.
 * - `GET /pendentes/por-escola/:escolaId`: Lista todas as transferências enviadas para uma
 *   escola específica que ainda estão pendentes de confirmação de recebimento.
 * - `POST /confirmar-recebimento`: Permite que uma escola confirme o recebimento de uma
 *   ou mais transferências, atualizando seu status no banco.
 *
 * Considerações de Segurança e Permissões:
 * - O middleware `authenticateToken` já está aplicado globalmente.
 * - Para rotas que envolvem dados de uma escola específica (ex: `/confirmadas/por-escola/:escolaId`),
 *   o middleware `authorizeSchoolAccess` (se aplicado globalmente ou diretamente aqui)
 *   controlaria o acesso para que usuários 'escola' só vejam dados da sua escola.
 *   Atualmente, a lógica de permissão para essas rotas de GET está mais focada
 *   na autenticação, mas `authorizeSchoolAccess` poderia ser adicionado para refinar
 *   quem pode ver o quê, especialmente para os endpoints de POST.
 *   A rota `POST /` (enviar estoque) é tipicamente uma ação da SME (admin/user).
 *   A rota `POST /confirmar-recebimento` é tipicamente uma ação da Escola.
 *   Essas permissões mais granulares podem ser implementadas adicionando os middlewares
 *   `authorizeAdmin` ou `authorizeSchoolAccess` (modificado para POST) a rotas específicas.
 */

const express = require('express');
const router = express.Router();
const db = require('../database/dbConnection'); // Conexão com o banco de dados

// --- ROTA 1: POST /api/transferencias ---
// Registra uma nova transferência de estoque (quando o estoque é ENVIADO da SME para a escola).
// Ação tipicamente realizada por um usuário da SME (admin ou user padrão).
// O middleware `authenticateToken` já foi aplicado em server.js.
// Poderia-se adicionar `authorizeAdmin` ou uma lógica similar se apenas certos papéis da SME podem enviar.
router.post('/', (req, res) => {
    const { escola_id, itens } = req.body; // ID da escola destino e lista de itens { produto_id, quantidade }
    const userId = req.user.id; // ID do usuário autenticado (SME) que está realizando o envio.

    // 1. Validação rigorosa da entrada.
    if (!escola_id || !Number.isInteger(escola_id) || escola_id <= 0) {
        return res.status(400).json({ error: 'ID da escola de destino é inválido ou está ausente.' });
    }
    if (!Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ error: 'A lista de itens para transferência é inválida ou está vazia.' });
    }
    for (const item of itens) {
        if (!item.produto_id || !Number.isInteger(item.produto_id) || item.produto_id <= 0 ||
            !item.quantidade || typeof item.quantidade !== 'number' || item.quantidade <= 0) {
            // Valida cada item na lista.
            return res.status(400).json({ error: `Item inválido na lista de transferência: ${JSON.stringify(item)}. Verifique ID do produto e quantidade.` });
        }
    }

    // 2. Utiliza uma transação do SQLite para garantir a atomicidade das operações.
    // Ou todas as operações (verificar estoque, inserir transferência, atualizar produtos, inserir itens)
    // são bem-sucedidas, ou nenhuma delas é aplicada (rollback).
    db.serialize(() => {
        db.run('BEGIN TRANSACTION;', (errBegin) => {
            if (errBegin) {
                console.error("[POST /api/transferencias] Erro ao iniciar transação:", errBegin.message);
                return res.status(500).json({ error: 'Erro interno do servidor ao iniciar a transação.' });
            }

            let rollbackNeeded = false; // Flag para indicar se um rollback é necessário.
            let detailedError = null;   // Mensagem de erro específica para o cliente.

            // 2.1. Promessas para verificar o estoque de todos os itens.
            const stockCheckPromises = itens.map(item => {
                return new Promise((resolve, reject) => {
                    const sqlCheck = 'SELECT nome, quantidade FROM produtos WHERE id = ?';
                    db.get(sqlCheck, [item.produto_id], (errCheck, produto) => {
                        if (errCheck) {
                            rollbackNeeded = true;
                            detailedError = detailedError || 'Erro ao verificar o estoque de um produto.';
                            return reject(errCheck); // Rejeita a promessa, o que acionará o .catch() do Promise.all
                        }
                        if (!produto) {
                            rollbackNeeded = true;
                            detailedError = `Produto com ID ${item.produto_id} não encontrado no estoque.`;
                            return reject(new Error(detailedError));
                        }
                        if (produto.quantidade === null || produto.quantidade < item.quantidade) {
                            rollbackNeeded = true;
                            detailedError = `Estoque insuficiente para o produto "${produto.nome}". Disponível: ${produto.quantidade ?? 0}, Solicitado para envio: ${item.quantidade}.`;
                            return reject(new Error(detailedError));
                        }
                        resolve(); // Estoque OK para este item.
                    });
                });
            });

            // Executa todas as verificações de estoque.
            Promise.all(stockCheckPromises)
                .then(() => {
                    // Se `rollbackNeeded` foi setado por alguma das promessas (embora o `reject` já devesse ter parado).
                    if (rollbackNeeded) throw new Error(detailedError || 'Erro na verificação de estoque. A transação será revertida.');

                    // 2.2. Insere o registro da transferência principal na tabela `transferencias`.
                    // `data_recebimento_confirmado` fica NULL, indicando que a escola ainda não confirmou.
                    const sqlInsertTransferencia = 'INSERT INTO transferencias (escola_id, usuario_id, data_transferencia) VALUES (?, ?, CURRENT_TIMESTAMP)';
                    db.run(sqlInsertTransferencia, [escola_id, userId], function (errInsertTransf) {
                        if (errInsertTransf) {
                            detailedError = 'Erro ao registrar a transferência principal.';
                            throw errInsertTransf; // Aciona o .catch() da transação.
                        }
                        const transferenciaId = this.lastID; // ID da transferência recém-criada.

                        // 2.3. Para cada item, atualiza a quantidade no estoque central (`produtos`)
                        // e insere o item na tabela `transferencia_itens`.
                        const updateAndInsertPromises = itens.map(item => {
                            return new Promise((resolve, reject) => {
                                // Deduz a quantidade do estoque central.
                                const sqlUpdateProduto = 'UPDATE produtos SET quantidade = quantidade - ?, data_modificacao = CURRENT_TIMESTAMP WHERE id = ?';
                                db.run(sqlUpdateProduto, [item.quantidade, item.produto_id], (errUpdate) => {
                                    if (errUpdate) return reject(errUpdate); // Aciona o .catch()

                                    // Insere o item na tabela de itens da transferência.
                                    const sqlInsertItem = 'INSERT INTO transferencia_itens (transferencia_id, produto_id, quantidade_enviada) VALUES (?, ?, ?)';
                                    db.run(sqlInsertItem, [transferenciaId, item.produto_id, item.quantidade], (errInsertItem) => {
                                        if (errInsertItem) return reject(errInsertItem); // Aciona o .catch()
                                        resolve(); // Operações para este item concluídas.
                                    });
                                });
                            });
                        });

                        // Executa as atualizações de produto e inserções de itens.
                        return Promise.all(updateAndInsertPromises)
                            .then(() => {
                                // Todas as operações foram bem-sucedidas, commita a transação.
                                db.run('COMMIT;', (errCommit) => {
                                    if (errCommit) throw errCommit; // Aciona o .catch()
                                    console.log(`[POST /api/transferencias] Transferência ID ${transferenciaId} ENVIADA para escola ID ${escola_id} por usuário ID ${userId}.`);
                                    res.status(201).json({ message: 'Transferência de estoque registrada com sucesso!', transferenciaId: transferenciaId });
                                });
                            });
                    }); // Fim do db.run para inserir transferência principal
                })
                .catch(transactionError => { // Captura erros de qualquer parte da cadeia de promessas.
                    console.error("[POST /api/transferencias] Erro durante a transação:", transactionError.message);
                    db.run('ROLLBACK;', (errRollback) => { // Tenta reverter a transação.
                        if (errRollback) console.error("[POST /api/transferencias] Erro CRÍTICO no rollback:", errRollback.message);
                    });
                    // Retorna o erro mais específico (se `detailedError` foi setado) ou um erro genérico.
                    res.status(detailedError ? 400 : 500).json({ error: detailedError || 'Falha ao processar a transferência devido a um erro interno.' });
                });
        }); // Fim do db.serialize -> BEGIN TRANSACTION
    }); // Fim do db.serialize
});


// --- ROTA 2: GET /api/transferencias/confirmadas/por-escola/:escolaId ---
// Busca transferências que JÁ FORAM CONFIRMADAS como recebidas por uma escola.
// Usado para exibir o histórico de estoque na página de detalhes da escola.
// O middleware `authenticateToken` já foi aplicado. `authorizeSchoolAccess` poderia ser usado aqui.
router.get('/confirmadas/por-escola/:escolaId', (req, res) => {
    const { escolaId } = req.params;

    if (!escolaId || isNaN(parseInt(escolaId))) {
        return res.status(400).json({ error: "ID da escola inválido." });
    }

    // SQL para buscar transferências confirmadas e dados do usuário que enviou.
    const sqlTransferenciasConfirmadas = `
        SELECT
            t.id AS transferencia_id,
            -- Formata a data de confirmação para o padrão brasileiro.
            strftime('%d/%m/%Y %H:%M', t.data_recebimento_confirmado, 'localtime') AS data_recebimento_confirmado_formatada,
            -- Formata a data de envio original (pode ser útil para referência).
            strftime('%d/%m/%Y %H:%M', t.data_transferencia, 'localtime') AS data_envio_original_formatada,
            u.username AS nome_usuario -- Nome do usuário da SME que realizou o envio.
        FROM
            transferencias t
        JOIN
            usuarios u ON t.usuario_id = u.id
        WHERE
            t.escola_id = ? AND t.data_recebimento_confirmado IS NOT NULL -- Filtro crucial: apenas confirmadas.
        ORDER BY
            t.data_recebimento_confirmado DESC; -- Mais recentes primeiro.
    `;

    db.all(sqlTransferenciasConfirmadas, [escolaId], (err, transferencias) => {
        if (err) {
            console.error("[GET /confirmadas/por-escola] Erro ao buscar transferências confirmadas:", err.message);
            return res.status(500).json({ error: "Erro interno ao buscar histórico de transferências confirmadas." });
        }
        if (transferencias.length === 0) {
            return res.json([]); // Retorna array vazio se não houver transferências confirmadas.
        }

        // Para cada transferência, busca seus itens correspondentes.
        const promessasItens = transferencias.map(transferencia => {
            return new Promise((resolve, reject) => {
                const sqlItens = `
                    SELECT
                        p.id AS produto_id,  
                        p.nome AS nome_produto,
                        p.unidade_medida,
                        ti.quantidade_enviada
                    FROM transferencia_itens ti
                    JOIN produtos p ON ti.produto_id = p.id
                    WHERE ti.transferencia_id = ?;
                `;
                db.all(sqlItens, [transferencia.transferencia_id], (errItens, itens) => {
                    if (errItens) {
                        console.error(`[GET /confirmadas/por-escola] Erro ao buscar itens para transf. confirmada ID ${transferencia.transferencia_id}:`, errItens.message);
                        // Resolve com erro nos itens, mas continua processando outras transferências.
                        resolve({ ...transferencia, itens: [], error_itens: "Erro ao buscar itens desta transferência" });
                    } else {
                        resolve({ ...transferencia, itens: itens });
                    }
                });
            });
        });

        // Espera todas as buscas de itens terminarem.
        Promise.all(promessasItens)
            .then(transferenciasComItens => res.json(transferenciasComItens))
            .catch(errorGlobal => {
                console.error("[GET /confirmadas/por-escola] Erro global ao processar itens de transferências confirmadas:", errorGlobal);
                res.status(500).json({ error: "Erro ao processar detalhes dos itens das transferências confirmadas." });
            });
    });
});


// --- ROTA 3: GET /api/transferencias/pendentes/por-escola/:escolaId ---
// Busca transferências PENDENTES de confirmação de recebimento para uma escola.
// Usado para popular o modal de "Confirmar Recebimento" no frontend.
// `authenticateToken` aplicado globalmente. `authorizeSchoolAccess` poderia ser usado.
router.get('/pendentes/por-escola/:escolaId', (req, res) => {
    const { escolaId } = req.params;

    if (!escolaId || isNaN(parseInt(escolaId))) {
        return res.status(400).json({ error: "ID da escola inválido." });
    }

    // SQL para buscar transferências pendentes e dados do usuário que enviou.
    const sqlTransferenciasPendentes = `
        SELECT
            t.id AS transferencia_id,
            -- Formata a data de ENVIO original (já que não há data de confirmação ainda).
            strftime('%d/%m/%Y %H:%M', t.data_transferencia, 'localtime') AS data_formatada,
            u.username AS nome_usuario
        FROM
            transferencias t
        JOIN
            usuarios u ON t.usuario_id = u.id
        WHERE
            t.escola_id = ? AND t.data_recebimento_confirmado IS NULL -- Filtro crucial: apenas PENDENTES.
        ORDER BY
            t.data_transferencia ASC; -- Mais antigas primeiro, para serem confirmadas prioritariamente.
    `;

    db.all(sqlTransferenciasPendentes, [escolaId], (err, transferencias) => {
        if (err) {
            console.error("[GET /pendentes/por-escola] Erro ao buscar transferências pendentes:", err.message);
            return res.status(500).json({ error: "Erro interno ao buscar transferências pendentes." });
        }
        if (transferencias.length === 0) {
            return res.json([]); // Retorna array vazio se não houver pendências.
        }

        // Para cada transferência pendente, busca seus itens.
        const promessasItens = transferencias.map(transferencia => {
            return new Promise((resolve, reject) => {
                const sqlItens = `
                    SELECT
                        p.id AS produto_id,
                        p.nome AS nome_produto,
                        p.unidade_medida,
                        ti.quantidade_enviada
                    FROM transferencia_itens ti
                    JOIN produtos p ON ti.produto_id = p.id
                    WHERE ti.transferencia_id = ?;
                `;
                db.all(sqlItens, [transferencia.transferencia_id], (errItens, itens) => {
                    if (errItens) {
                        console.error(`[GET /pendentes/por-escola] Erro ao buscar itens para transf. pendente ID ${transferencia.transferencia_id}:`, errItens.message);
                        resolve({ ...transferencia, itens: [], error_itens: "Erro ao buscar itens desta transferência" });
                    } else {
                        resolve({ ...transferencia, itens: itens });
                    }
                });
            });
        });

        Promise.all(promessasItens)
            .then(transferenciasComItens => res.json(transferenciasComItens))
            .catch(errorGlobal => {
                console.error("[GET /pendentes/por-escola] Erro global ao processar itens de transferências pendentes:", errorGlobal);
                res.status(500).json({ error: "Erro ao processar detalhes dos itens das transferências pendentes." });
            });
    });
});


// --- ROTA 4: POST /api/transferencias/confirmar-recebimento ---
// Marca uma ou mais transferências como recebidas pela escola.
// Ação tipicamente realizada por um usuário da escola.
// `authenticateToken` aplicado globalmente. `authorizeSchoolAccess` (para POST) seria ideal aqui
// para garantir que o usuário confirmando é da escola correta ou é admin.
router.post('/confirmar-recebimento', (req, res) => {
    // `transferencia_ids`: array de IDs das transferências a serem confirmadas.
    // `escola_id`: ID da escola que está confirmando (opcional, mas bom para validação extra se o usuário não for 'escola').
    const { transferencia_ids, escola_id } = req.body;
    const usuarioConfirmacaoId = req.user.id; // ID do usuário (da escola) que está CONFIRMANDO.

    // Validação da entrada.
    if (!Array.isArray(transferencia_ids) || transferencia_ids.length === 0) {
        return res.status(400).json({ error: "Nenhuma ID de transferência foi fornecida para confirmação." });
    }
    const idsValidos = transferencia_ids.every(id => Number.isInteger(id) && id > 0);
    if (!idsValidos) {
        return res.status(400).json({ error: "A lista de IDs de transferência contém valores inválidos." });
    }

    // Cria placeholders ( ?, ?, ... ) para a cláusula IN da query SQL.
    const placeholdersParaIn = transferencia_ids.map(() => '?').join(',');

    // Query SQL base
    let sqlConfirmar = `
    UPDATE transferencias
    SET data_recebimento_confirmado = CURRENT_TIMESTAMP,
        usuario_confirmacao_id = ?  -- Este é o primeiro '?' na query
    WHERE id IN (${placeholdersParaIn}) -- Seguido por N '?' para os IDs
    AND data_recebimento_confirmado IS NULL
    `;

    // Monta a lista de parâmetros na ordem correta
    const queryParams = [];
    queryParams.push(usuarioConfirmacaoId); // 1º Parâmetro: para usuario_confirmacao_id = ?

    transferencia_ids.forEach(id => {   // Próximos N Parâmetros: para o IN (?, ?, ...)
        queryParams.push(id);
    });

    // Validação opcional: Se `escola_id` foi fornecido e o usuário não é 'admin',
    // garante que a transferência pertence à escola do usuário logado.
    // O middleware `authorizeSchoolAccess` cuidaria disso de forma mais robusta.
    // Se `req.user.role === 'escola'`, `req.user.school_id` deve ser igual a `escola_id` (se fornecido)
    // ou, se `escola_id` não for fornecido no body, usar `req.user.school_id` na query.
    if (req.user.role === 'escola') {
        if (escola_id && req.user.school_id !== parseInt(escola_id, 10)) {
            return res.status(403).json({ error: "Usuário da escola tentando confirmar recebimento para outra escola." });
        }
        sqlConfirmar += ` AND escola_id = ?`;
        queryParams.push(req.user.school_id); // Garante que o usuário só confirme para sua própria escola.
    } else if (req.user.role === 'admin' && escola_id && Number.isInteger(parseInt(escola_id, 10)) && parseInt(escola_id, 10) > 0) {
        // Se admin e escola_id é fornecido, adiciona ao filtro (útil se admin estiver confirmando para uma escola específica)
        sqlConfirmar += ` AND escola_id = ?`;
        queryParams.push(parseInt(escola_id, 10));
    }
    // Se for admin e escola_id não for fornecido, ele pode confirmar qualquer transferência (cuidado com essa lógica).

    db.run(sqlConfirmar, queryParams, function(err) { // Usa `function` para ter acesso a `this.changes`.
        if (err) {
            console.error("[POST /confirmar-recebimento] Erro ao confirmar recebimento de transferências:", err.message);
            return res.status(500).json({ error: "Erro interno do servidor ao confirmar o recebimento." });
        }
        if (this.changes === 0) {
            console.warn(`[POST /confirmar-recebimento] Nenhuma transferência foi atualizada para confirmação. IDs: ${transferencia_ids.join(', ')}, Escola ID no body: ${escola_id}, UserSchoolID: ${req.user.school_id}. Possivelmente já confirmadas, inválidas ou não pertencem à escola (se ID da escola foi usado na query).`);
            // Pode ser que os IDs não existam, já foram confirmados, ou não pertencem à escola (se o filtro de escola_id foi aplicado).
            return res.status(404).json({ error: "Nenhuma transferência pendente encontrada para os IDs fornecidos, ou elas já foram confirmadas, ou não pertencem à escola especificada." });
        }
        console.log(`[POST /confirmar-recebimento] ${this.changes} transferência(s) marcada(s) como recebida(s). Confirmado por Usuário ID: ${usuarioConfirmacaoId}.`);
        res.status(200).json({ message: `${this.changes} transferência(s) confirmada(s) com sucesso.` });
    });
});

// --- NOVA ROTA: GET /api/transferencias/historico-sme ---
// Busca o histórico de todas as transferências (envios) realizadas pela SME.
// Idealmente, adicionar middleware de autorização para garantir que apenas admin/SME possam ver tudo.
router.get('/historico-sme', (req, res) => {
    const { destino, dataInicio, dataFim } = req.query; // 1. LER OS PARÂMETROS DA QUERY
    // SQL para buscar o histórico de envios da SME
    let sqlHistoricoEnviosSME = `
        SELECT
            t.id AS transferencia_id,
            -- As datas já estão sendo formatadas aqui. Se o frontend também formatar, pode haver redundância,
            -- mas não é um grande problema. A store também está preparada para formatar se não vier formatado.
            strftime('%d/%m/%Y %H:%M', t.data_transferencia, 'localtime') AS data_envio_formatada,
            CASE
                WHEN t.data_recebimento_confirmado IS NOT NULL
                THEN strftime('%d/%m/%Y %H:%M', t.data_recebimento_confirmado, 'localtime')
                ELSE NULL
            END AS data_recebimento_confirmado_formatada,
            u_sme.username AS usuario_sme_nome,
            e.nome AS nome_escola,
            e.id AS escola_id,
            u_conf.username AS nome_usuario_confirmacao,
            -- Importante: Alias para os itens deve ser 'itens' se a store frontend espera 'envio.itens'
            -- O JSON_GROUP_ARRAY é mais robusto para SQLite moderno.
            COALESCE(
              (
                SELECT JSON_GROUP_ARRAY(
                          JSON_OBJECT(
                            'produto_id', p_sub.id,
                            'nome_produto', p_sub.nome,
                            'unidade_medida', p_sub.unidade_medida,
                            'quantidade_enviada', ti_sub.quantidade_enviada
                          )
                        )
                FROM transferencia_itens ti_sub
                JOIN produtos p_sub ON ti_sub.produto_id = p_sub.id
                WHERE ti_sub.transferencia_id = t.id
              ),
              '[]' -- Retorna um array JSON vazio se não houver itens
            ) as itens -- Alias para os itens da transferência
        FROM
            transferencias t
        JOIN
            usuarios u_sme ON t.usuario_id = u_sme.id
        JOIN
            escolas e ON t.escola_id = e.id
        LEFT JOIN
            usuarios u_conf ON t.usuario_confirmacao_id = u_conf.id
    `;

    const paramsSQL = [];
    const conditions = [];

    // 2. CONSTRUIR A SQL DINAMICAMENTE
    if (destino) {
        conditions.push("e.nome LIKE ?");
        paramsSQL.push(`%${destino}%`);
    }
    if (dataInicio) {
        // A função date() do SQLite compara apenas a parte da data
        // Assumindo que data_transferencia é DATETIME e dataInicio é YYYY-MM-DD
        conditions.push("date(t.data_transferencia) >= date(?)");
        paramsSQL.push(dataInicio);
    }
    if (dataFim) {
        conditions.push("date(t.data_transferencia) <= date(?)");
        paramsSQL.push(dataFim);
    }

    if (conditions.length > 0) {
        sqlHistoricoEnviosSME += " WHERE " + conditions.join(" AND ");
    }

    // GROUP BY é necessário se o JSON_GROUP_ARRAY estiver no select principal,
    // mas como está numa subquery correlacionada, o GROUP BY t.id pode não ser
    // estritamente necessário aqui para o propósito do JSON, mas não prejudica.
    // É bom para garantir uma linha por transferência se houvesse outros JOINs que pudessem duplicar.
    sqlHistoricoEnviosSME += " GROUP BY t.id ORDER BY t.data_transferencia DESC;";

    db.all(sqlHistoricoEnviosSME, paramsSQL, (err, envios) => { // 3. PASSAR OS PARÂMETROS PARA DB.ALL
        if (err) {
            console.error("[GET /api/transferencias/historico-sme] Erro ao buscar histórico de envios da SME:", err.message);
            return res.status(500).json({ error: "Erro interno ao buscar histórico de envios." });
        }

        // O SQL já monta o array de 'itens' como JSON. O frontend/store fará o parse.
        // Se o SQLite for muito antigo e JSON_GROUP_ARRAY não funcionar, a abordagem anterior
        // de buscar itens em um loop de promessas seria necessária.
        // A store no frontend está preparada para parsear `envio.itens` se for uma string JSON.
        const enviosProcessados = envios.map(envio => {
            let itensArray;
            try {
                itensArray = JSON.parse(envio.itens || '[]'); // Parseia a string JSON dos itens
            } catch (e) {
                console.error("Erro ao parsear itens JSON do backend para envio ID:", envio.transferencia_id, e);
                itensArray = []; // Fallback para array vazio
            }
            return {
                ...envio,
                itens: itensArray
            };
        });

        res.json(enviosProcessados);
    });
});

module.exports = router; // Exporta o roteador.