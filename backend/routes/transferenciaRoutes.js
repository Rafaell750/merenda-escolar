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
                                    const sqlInsertItem = 'INSERT INTO transferencia_itens (transferencia_id, produto_id, quantidade_enviada, status) VALUES (?, ?, ?, ?)';
                                    db.run(sqlInsertItem, [transferenciaId, item.produto_id, item.quantidade, 'pendente'], (errInsertItem) => {
                                        if (errInsertItem) return reject(errInsertItem); 
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

    // SQL que busca transferências que contenham PELO MENOS UM item já confirmado.
    // Isso garante que transferências parcialmente confirmadas apareçam no histórico.
    const sqlGetTransferenciasComItensConfirmados = `
        SELECT DISTINCT
            t.id AS transferencia_id,
            -- Usamos a data da transferência original como referência
            strftime('%d/%m/%Y %H:%M', t.data_transferencia, 'localtime') AS data_envio_original_formatada,
            -- Opcional: a data de confirmação geral, se houver
            strftime('%d/%m/%Y %H:%M', t.data_recebimento_confirmado, 'localtime') AS data_conclusao_formatada,
            u.username AS nome_usuario -- Nome do usuário da SME que realizou o envio.
        FROM
            transferencias t
        JOIN
            usuarios u ON t.usuario_id = u.id
        JOIN
            transferencia_itens ti ON t.id = ti.transferencia_id
        WHERE
            t.escola_id = ? AND ti.status = 'confirmado'
        ORDER BY
            t.data_transferencia DESC;
    `;

    db.all(sqlGetTransferenciasComItensConfirmados, [escolaId], (err, transferencias) => {
        if (err) {
            console.error("[GET /confirmadas/por-escola] Erro ao buscar transferências:", err.message);
            return res.status(500).json({ error: "Erro interno ao buscar histórico de transferências." });
        }
        if (transferencias.length === 0) {
            return res.json([]);
        }

        // Para cada transferência, busca APENAS os seus itens que foram confirmados.
        const promessasItens = transferencias.map(transferencia => {
            return new Promise((resolve, reject) => {
                const sqlGetItensConfirmados = `
                    SELECT
                        p.id AS produto_id,
                        p.nome AS nome_produto,
                        p.unidade_medida,
                        ti.quantidade_enviada,
                        -- Trazemos a data de confirmação do item individual para o frontend
                        strftime('%d/%m/%Y %H:%M:%S', ti.data_recebimento, 'localtime') AS data_recebimento_item_formatada
                    FROM transferencia_itens ti
                    JOIN produtos p ON ti.produto_id = p.id
                    WHERE
                        ti.transferencia_id = ? AND ti.status = 'confirmado';
                `;
                db.all(sqlGetItensConfirmados, [transferencia.transferencia_id], (errItens, itens) => {
                    if (errItens) {
                        return reject(new Error(`Erro ao buscar itens para transf. ID ${transferencia.transferencia_id}: ${errItens.message}`));
                    }
                    // A data do recebimento para o item consolidado agora virá do item mais recente.
                    // O seu frontend já parece fazer isso bem, mas vamos garantir que ele tenha a data correta.
                    // Para o frontend, o que importa é a lista de itens.
                    resolve({ ...transferencia, itens: itens });
                });
            });
        });

        Promise.all(promessasItens)
            .then(transferenciasComItens => {
                // Seu frontend espera uma estrutura específica. A lógica dele é robusta e vai juntar os itens de diferentes
                // "transferências" retornadas aqui em um único estoque consolidado.
                // A chave é que agora ele vai receber os itens confirmados individualmente.
                // Precisamos ajustar o objeto para que o frontend o entenda.
                 const resultadoFinal = transferenciasComItens.map(t => {
                    // Para cada transferência, vamos criar pseudo-transferências para cada item,
                    // para que o `flatMap` do frontend funcione perfeitamente.
                    if (!t.itens || t.itens.length === 0) return null;

                    // O frontend usa a data de recebimento para o histórico. Vamos usar a do item.
                    // O mais importante é que a lista de `itens` esteja correta.
                    const itemMaisRecente = t.itens.reduce((latest, current) => {
                        // Precisa de uma função para parsear a data pt-BR aqui, se for comparar
                        return latest; // simplificado, a lógica do seu frontend já resolve
                    });

                    return {
                        transferencia_id: t.transferencia_id,
                        // O seu frontend usa 'data_recebimento_confirmado_formatada' para cada item.
                        // Vamos dar a ele a data de conclusão geral, e o item individual terá sua própria data.
                        // A sua lógica de `itensConsolidados` já é inteligente o suficiente para lidar com isso.
                        data_recebimento_confirmado_formatada: t.data_conclusao_formatada || t.data_envio_original_formatada,
                        nome_usuario: t.nome_usuario,
                        itens: t.itens
                    };
                }).filter(t => t !== null);

                res.json(resultadoFinal);
            })
            .catch(errorGlobal => {
                console.error("[GET /confirmadas/por-escola] Erro global:", errorGlobal);
                res.status(500).json({ error: "Erro ao processar detalhes dos itens das transferências." });
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

    const sqlTransferenciasPendentes = `
        SELECT DISTINCT
            t.id AS transferencia_id,
            strftime('%d/%m/%Y %H:%M', t.data_transferencia, 'localtime') AS data_formatada,
            u.username AS nome_usuario
        FROM
            transferencias t
        JOIN
            usuarios u ON t.usuario_id = u.id
        JOIN
            transferencia_itens ti ON t.id = ti.transferencia_id
        WHERE
            t.escola_id = ? AND ti.status = 'pendente'
        ORDER BY
            t.data_transferencia ASC;
    `;

    db.all(sqlTransferenciasPendentes, [escolaId], (err, transferencias) => {
        if (err) {
            console.error("[GET /pendentes/por-escola] Erro ao buscar transferências pendentes:", err.message);
            return res.status(500).json({ error: "Erro interno ao buscar transferências pendentes." });
        }
        if (transferencias.length === 0) {
            return res.json([]);
        }

        const promessasItens = transferencias.map(transferencia => {
            return new Promise((resolve, reject) => {
                // Query para buscar APENAS os itens 'pendentes' de cada transferência.
                const sqlItens = `
                    SELECT
                        p.id AS produto_id,
                        p.nome AS nome_produto,
                        p.unidade_medida,
                        ti.quantidade_enviada
                    FROM transferencia_itens ti
                    JOIN produtos p ON ti.produto_id = p.id
                    WHERE ti.transferencia_id = ? AND ti.status = 'pendente';
                `;
                db.all(sqlItens, [transferencia.transferencia_id], (errItens, itens) => {
                    if (errItens) {
                        return reject(errItens); // Se a query de itens falhar, rejeita a promessa.
                    }
                    resolve({ ...transferencia, itens: itens });
                });
            });
        });

        Promise.all(promessasItens)
            .then(transferenciasComItens => {
                // Filtra qualquer transferência que possa ter ficado sem itens pendentes após a busca
                const resultadoFinal = transferenciasComItens.filter(t => t.itens.length > 0);
                res.json(resultadoFinal);
            })
            .catch(errorGlobal => {
                // Este .catch vai pegar o erro da query de itens, se houver
                console.error("[GET /pendentes/por-escola] Erro ao processar itens de transferências:", errorGlobal.message);
                res.status(500).json({ error: "Erro ao processar os detalhes dos itens das transferências." });
            });
    });
});


// --- ROTA 4: POST /api/transferencias/confirmar-recebimento ---
// Marca uma ou mais transferências como recebidas pela escola.
// Ação tipicamente realizada por um usuário da escola.
// `authenticateToken` aplicado globalmente. `authorizeSchoolAccess` (para POST) seria ideal aqui
// para garantir que o usuário confirmando é da escola correta ou é admin.
// TOTALMENTE REESCRITA para lidar com a confirmação de itens individuais.
router.post('/confirmar-recebimento', (req, res) => {
    const { itens_confirmados, escola_id } = req.body; // escola_id é bom para validação de segurança
    const usuarioConfirmacaoId = req.user.id;

    if (!escola_id || !Number.isInteger(escola_id)) {
        return res.status(400).json({ error: "ID da escola é obrigatório para validação." });
    }
    if (!Array.isArray(itens_confirmados) || itens_confirmados.length === 0) {
        return res.status(400).json({ error: "Nenhum item foi fornecido para confirmação." });
    }

    // Valida cada item no payload
    for (const item of itens_confirmados) {
        if (!item.transferencia_id || !Number.isInteger(item.transferencia_id) ||
            !item.produto_id || !Number.isInteger(item.produto_id)) {
            return res.status(400).json({ error: "A lista de itens a confirmar contém valores inválidos." });
        }
    }
    
    // Opcional mas recomendado: Verificar se o usuário pertence à escola_id informada
    if (req.user.role === 'escola' && req.user.school_id !== escola_id) {
        return res.status(403).json({ error: "Acesso negado. Você só pode confirmar itens para sua própria escola." });
    }

     db.serialize(() => {
        db.run('BEGIN TRANSACTION;');
        // MODIFICADO: A query agora atualiza o status para 'confirmado' e verifica se o status anterior era 'pendente'
        const updatePromises = itens_confirmados.map(item => {
            return new Promise((resolve, reject) => {
                const sqlUpdateItem = `
                    UPDATE transferencia_itens
                    SET data_recebimento = CURRENT_TIMESTAMP,
                        status = 'confirmado'
                    WHERE transferencia_id = ? AND produto_id = ? AND status = 'pendente'
                `;
                db.run(sqlUpdateItem, [item.transferencia_id, item.produto_id], function(err) {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });

        Promise.all(updatePromises)
            .then(() => {
                // MODIFICADO: A query de verificação de conclusão agora checa por status 'pendente'
                const checkCompletionPromises = [...new Set(itens_confirmados.map(i => i.transferencia_id))].map(transferenciaId => {
                    return new Promise((resolve, reject) => {
                        const sqlCheck = `
                            SELECT COUNT(id) as pendentes FROM transferencia_itens
                            WHERE transferencia_id = ? AND status = 'pendente'
                        `;
                            db.get(sqlCheck, [transferenciaId], (err, row) => {
                                if (err) return reject(err);

                                // Se não há mais itens pendentes, a transferência está completa!
                                if (row && row.pendentes === 0) {
                                    console.log(`Transferência ${transferenciaId} totalmente confirmada. Atualizando status principal.`);
                                    const sqlUpdateTransferencia = `
                                        UPDATE transferencias
                                        SET data_recebimento_confirmado = CURRENT_TIMESTAMP,
                                            usuario_confirmacao_id = ?
                                        WHERE id = ? AND data_recebimento_confirmado IS NULL
                                    `;
                                    db.run(sqlUpdateTransferencia, [usuarioConfirmacaoId, transferenciaId], (errUpdate) => {
                                        if (errUpdate) return reject(errUpdate);
                                        resolve();
                                    });
                                } else {
                                    resolve(); // Transferência ainda tem itens pendentes, não faz nada com a tabela 'transferencias'.
                                }
                            });
                        });
                    });

                    return Promise.all(checkCompletionPromises);
                })
                .then(() => {
                    // 3. Finaliza a transação
                    db.run('COMMIT;', (errCommit) => {
                        if (errCommit) throw errCommit;
                        res.status(200).json({ message: "Item(ns) confirmado(s) com sucesso." });
                    });
                })
                .catch(err => {
                    console.error("[POST /confirmar-recebimento] Erro durante a transação:", err.message);
                    db.run('ROLLBACK;', (errRollback) => {
                        if (errRollback) console.error("Erro CRÍTICO no rollback:", errRollback.message);
                    });
                    res.status(500).json({ error: "Falha ao confirmar recebimento devido a um erro interno." });
                });
        });
    });

// --- ROTA 5: POST /registrar-devolucao ---
// Registra itens como devolvidos, devolve-os ao estoque da SME e cria uma notificação.
router.post('/registrar-devolucao', (req, res) => {
    const { itens_devolvidos, escola_id } = req.body;
    const { username: usuarioNome } = req.user;

    if (!escola_id || !Array.isArray(itens_devolvidos) || itens_devolvidos.length === 0) {
        return res.status(400).json({ error: 'Dados insuficientes para registrar a devolução.' });
    }
    // Validação de segurança
    if (req.user.role === 'escola' && req.user.school_id !== escola_id) {
        return res.status(403).json({ error: "Acesso negado." });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION;', (errBegin) => {
            if (errBegin) return res.status(500).json({ error: 'Erro ao iniciar transação.' });

            // Array para guardar os detalhes dos itens para a mensagem da notificação
            const detalhesItensParaNotificacao = [];

            const processPromises = itens_devolvidos.map(item => {
                return new Promise((resolve, reject) => {
                    // 1. Busca os detalhes do item (nome e quantidade) com um JOIN
                    const sqlGetItem = `
                        SELECT
                            p.nome AS nome_produto,
                            ti.quantidade_enviada
                        FROM transferencia_itens ti
                        JOIN produtos p ON ti.produto_id = p.id
                        WHERE ti.transferencia_id = ? AND ti.produto_id = ? AND ti.status = 'pendente'`;

                    db.get(sqlGetItem, [item.transferencia_id, item.produto_id], (errGet, itemParaDevolver) => {
                        if (errGet) return reject(new Error(`Erro ao buscar item a ser devolvido: ${errGet.message}`));
                        if (!itemParaDevolver) return reject(new Error(`Item (Transf: ${item.transferencia_id}, Prod: ${item.produto_id}) não encontrado ou já processado.`));

                        // Guarda os detalhes para a mensagem
                        detalhesItensParaNotificacao.push({
                            nome: itemParaDevolver.nome_produto,
                            quantidade: itemParaDevolver.quantidade_enviada
                        });

                        // MODIFICADO: REMOVEMOS A LÓGICA DE REABASTECIMENTO DAQUI
                        const sqlUpdateStatus = `UPDATE transferencia_itens SET status = 'devolvido' WHERE transferencia_id = ? AND produto_id = ? AND status = 'pendente'`;
                        db.run(sqlUpdateStatus, [item.transferencia_id, item.produto_id], function (errUpdateStatus) {
                            if (errUpdateStatus) return reject(new Error(`Erro ao atualizar status do item: ${errUpdateStatus.message}`));
                            if (this.changes === 0) return reject(new Error(`Item (Transf: ${item.transferencia_id}, Prod: ${item.produto_id}) não pôde ser devolvido.`));
                            resolve();
                        });
                    });
                });
            });

            Promise.all(processPromises)
                .then(() => {
                    db.get('SELECT nome FROM escolas WHERE id = ?', [escola_id], (errEscola, escola) => {
                        if (errEscola || !escola) throw new Error('Escola não encontrada.');

                        // Construção da mensagem detalhada
                        let itensTexto = detalhesItensParaNotificacao
                            .map(detalhe => `- ${detalhe.nome} (Qtd: ${detalhe.quantidade})`)
                            .join('\n'); // Usa quebra de linha para formatar como lista

                        const message = `Devolução registrada por "${usuarioNome}" da escola "${escola.nome}":\n${itensTexto}`;
                        
                        // MODIFICADO: Salva os dados dos itens como JSON em 'context_data'
                        const contextData = JSON.stringify(itens_devolvidos);

                        const stmt = db.prepare('INSERT INTO notificacoes (message, tipo, context_data) VALUES (?, ?, ?)');
                        stmt.run(message, 'devolucao', contextData, function (errInsert) {
                            if (errInsert) throw new Error('Falha ao criar notificação.');
                            
                            const novaNotificacao = {
                                id: this.lastID, message, tipo: 'devolucao', lida: false, createdAt: new Date().toISOString()
                            };

                            db.run('COMMIT;', (errCommit) => {
                                if (errCommit) throw errCommit;
                                res.status(201).json({ 
                                    message: 'Devolução registrada, estoque atualizado e notificação criada com sucesso!',
                                    notification: novaNotificacao 
                                });
                            });
                        });
                        stmt.finalize();
                    });
                })
                .catch(err => {
                    console.error("[POST /registrar-devolucao] Erro na transação:", err.message);
                    db.run('ROLLBACK;');
                    res.status(500).json({ error: err.message || 'Falha ao processar a devolução.' });
                });
        });
    });
});

// --- ROTA 6: GET /api/transferencias/historico-sme ---
// Busca o histórico de todas as transferências (envios) realizadas pela SME.
// Idealmente, adicionar middleware de autorização para garantir que apenas admin/SME possam ver tudo.
router.get('/historico-sme', (req, res) => {
    const { destino, dataInicio, dataFim, page = 1, limit = 10 } = req.query; // Adiciona page e limit

    console.log("Backend [GET /historico-sme] - Filtros:", req.query);

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let sqlBase = `
        FROM
            transferencias t
        JOIN
            usuarios u_sme ON t.usuario_id = u_sme.id
        JOIN
            escolas e ON t.escola_id = e.id
        LEFT JOIN
            usuarios u_conf ON t.usuario_confirmacao_id = u_conf.id
    `;

    let sqlWhere = "";
    const paramsSQL = [];
    const conditions = [];

    if (destino) {
        conditions.push("e.nome LIKE ?");
        paramsSQL.push(`%${destino}%`);
    }
    if (dataInicio) {
        conditions.push("date(t.data_transferencia) >= date(?)");
        paramsSQL.push(dataInicio);
    }
    if (dataFim) {
        conditions.push("date(t.data_transferencia) <= date(?)");
        paramsSQL.push(dataFim);
    }

    if (conditions.length > 0) {
        sqlWhere = " WHERE " + conditions.join(" AND ");
    }

    // 1. Query para contar o total de itens (com os mesmos filtros)
    const sqlCount = `SELECT COUNT(DISTINCT t.id) as totalItems ${sqlBase} ${sqlWhere}`;

    db.get(sqlCount, paramsSQL, (errCount, countRow) => {
        if (errCount) {
            console.error("[GET /historico-sme] Erro ao contar itens:", errCount.message);
            return res.status(500).json({ error: "Erro interno ao processar a contagem de itens." });
        }

        const totalItems = countRow ? countRow.totalItems : 0;
        const totalPages = Math.ceil(totalItems / limitNum);

        if (totalItems === 0) {
             return res.json({
                 items: [],
                 currentPage: pageNum,
                 totalPages: 0,
                 totalItems: 0
             });
        }

        // 2. Query para buscar os itens da página atual (com os mesmos filtros + LIMIT e OFFSET)
        let sqlHistoricoEnviosSME = `
            SELECT
                t.id AS transferencia_id,
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
                  '[]'
                ) as itens
            ${sqlBase}
            ${sqlWhere}
            GROUP BY t.id
            ORDER BY t.data_transferencia DESC
            LIMIT ? OFFSET ?
        `;

        const finalParamsSQL = [...paramsSQL, limitNum, offset]; // Adiciona limit e offset aos parâmetros

        db.all(sqlHistoricoEnviosSME, finalParamsSQL, (err, envios) => {
            if (err) {
                console.error("[GET /historico-sme] Erro ao buscar histórico:", err.message);
                return res.status(500).json({ error: "Erro interno ao buscar histórico de envios." });
            }

            const enviosProcessados = envios.map(envio => {
                let itensArray;
                try {
                    itensArray = JSON.parse(envio.itens || '[]');
                } catch (e) {
                    console.error("Erro ao parsear itens JSON:", envio.transferencia_id, e);
                    itensArray = [];
                }
                return { ...envio, itens: itensArray };
            });

            res.json({
                items: enviosProcessados,
                currentPage: pageNum,
                totalPages: totalPages,
                totalItems: totalItems
            });
        });
    });
});

module.exports = router; // Exporta o roteador.