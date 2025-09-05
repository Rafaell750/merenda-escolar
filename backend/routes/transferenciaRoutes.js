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
                        Promise.all(updateAndInsertPromises)
                            .then(() => {
                                // SUCESSO: Commita e busca dados para resposta
                                db.run('COMMIT;', (errCommit) => {
                                    if (errCommit) {
                                        db.run('ROLLBACK;');
                                        return res.status(500).json({ error: 'Erro crítico ao finalizar a transação.' });
                                    }

                                    // Query SQL completa para buscar os dados (corrigida)
                                    const sqlBuscaCompleta = `
                                        SELECT
                                            t.id AS transferencia_id,
                                            t.data_transferencia AS data_envio, 
                                            u_sme.username AS usuario_sme_nome,
                                            e.nome AS nome_escola,
                                            e.id AS escola_id,
                                            COALESCE(
                                                (
                                                    SELECT JSON_GROUP_ARRAY(
                                                        JSON_OBJECT(
                                                            'produto_id', p_sub.id,
                                                            'nome_produto', p_sub.nome,
                                                            'unidade_medida', p_sub.unidade_medida,
                                                            'quantidade_enviada', ti_sub.quantidade_enviada,
                                                            'status', ti_sub.status,
                                                            'data_processamento', ti_sub.data_recebimento 
                                                        )
                                                    )
                                                    FROM transferencia_itens ti_sub
                                                    JOIN produtos p_sub ON ti_sub.produto_id = p_sub.id
                                                    WHERE ti_sub.transferencia_id = t.id
                                                ),
                                                '[]'
                                            ) as itens
                                        FROM
                                            transferencias t
                                        JOIN
                                            usuarios u_sme ON t.usuario_id = u_sme.id
                                        JOIN
                                            escolas e ON t.escola_id = e.id
                                        WHERE
                                            t.id = ?
                                    `;

                                    db.get(sqlBuscaCompleta, [transferenciaId], (errBusca, transferenciaCompleta) => {
                                        if (errBusca || !transferenciaCompleta) {
                                            console.error("[POST /api/transferencias] Sucesso, mas falha ao buscar dados:", errBusca ? errBusca.message : "Não encontrado");
                                            return res.status(201).json({
                                                message: 'Transferência registrada com sucesso!',
                                                transferenciaId: transferenciaId
                                            });
                                        }

                                        transferenciaCompleta.itens = JSON.parse(transferenciaCompleta.itens || '[]');
                                        transferenciaCompleta.status_geral = 'Pendente';

                                        res.status(201).json({
                                            message: 'Transferência de estoque registrada com sucesso!',
                                            transferenciaId: transferenciaId,
                                            transferencia: transferenciaCompleta
                                        });
                                    });
                                });
                            })
                            .catch(errItens => {
                                // ERRO: Falha ao atualizar/inserir itens
                                console.error("[POST /api/transferencias] Erro ao processar itens:", errItens.message);
                                db.run('ROLLBACK;');
                                res.status(500).json({ error: 'Falha ao processar os itens da transferência.' });
                            });
                    });
                })
                .catch(errEstoque => {
                    // ERRO: Falha na verificação de estoque
                    console.error("[POST /api/transferencias] Erro de verificação de estoque:", errEstoque.message);
                    db.run('ROLLBACK;');
                    res.status(detailedError ? 400 : 500).json({ error: detailedError || 'Falha ao verificar o estoque.' });
                });
        });
    });
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
            t.data_transferencia AS data_envio_original, 
            t.data_recebimento_confirmado AS data_conclusao, 
            u.username AS nome_usuario
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
                        ti.data_recebimento AS data_recebimento_item 
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
                // ALTERADO: Simplificamos a resposta, o frontend agora faz a formatação
                 const resultadoFinal = transferenciasComItens.map(t => {
                    if (!t.itens || t.itens.length === 0) return null;
                    return t; // Retorna o objeto completo com as datas cruas
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
            t.data_transferencia, 
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
    // ALTERADO: O payload agora é 'itens_processados' e contém a quantidade.
    const { itens_processados, escola_id } = req.body;
    const usuarioConfirmacaoId = req.user.id;

    if (!escola_id || !Number.isInteger(escola_id)) {
        return res.status(400).json({ error: "ID da escola é obrigatório." });
    }
    if (!Array.isArray(itens_processados) || itens_processados.length === 0) {
        return res.status(400).json({ error: "Nenhum item válido foi fornecido para confirmação." });
    }

    // Validação de cada item no payload
    for (const item of itens_processados) {
        if (!item.transferencia_id || !Number.isInteger(item.transferencia_id) ||
            !item.produto_id || !Number.isInteger(item.produto_id) ||
            !item.quantidade || typeof item.quantidade !== 'number' || item.quantidade <= 0) {
            return res.status(400).json({ error: `O item ${JSON.stringify(item)} é inválido. Verifique os dados.` });
        }
    }
    
    if (req.user.role === 'escola' && req.user.school_id !== escola_id) {
        return res.status(403).json({ error: "Acesso negado. Você só pode confirmar itens para sua própria escola." });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION;', (errBegin) => {
            if (errBegin) return res.status(500).json({ error: 'Erro ao iniciar a transação.' });

            const processPromises = itens_processados.map(item => {
                return new Promise((resolve, reject) => {
                    const sqlGetPendente = `
                        SELECT id, quantidade_enviada 
                        FROM transferencia_itens 
                        WHERE transferencia_id = ? AND produto_id = ? AND status = 'pendente'`;
                    
                    db.get(sqlGetPendente, [item.transferencia_id, item.produto_id], (errGet, pendente) => {
                        if (errGet) return reject(new Error(`Erro ao buscar item pendente: ${errGet.message}`));
                        if (!pendente) return reject(new Error(`Item pendente (Transf ${item.transferencia_id}, Prod ${item.produto_id}) não encontrado ou já processado.`));
                        if (item.quantidade > pendente.quantidade_enviada) {
                            return reject(new Error(`Tentativa de confirmar ${item.quantidade} unidades, mas apenas ${pendente.quantidade_enviada} estão pendentes.`));
                        }

                        const quantidadeConfirmada = item.quantidade;
                        const quantidadeRestante = pendente.quantidade_enviada - quantidadeConfirmada;

                        if (quantidadeRestante > 0) {
                            // Confirmação PARCIAL: Atualiza o item pendente e cria um novo item confirmado.
                            const sqlUpdatePendente = `UPDATE transferencia_itens SET quantidade_enviada = ? WHERE id = ?`;
                            db.run(sqlUpdatePendente, [quantidadeRestante, pendente.id], (errUpdate) => {
                                if (errUpdate) return reject(new Error(`Erro ao atualizar item pendente: ${errUpdate.message}`));

                                const sqlInsertConfirmado = `
                                    INSERT INTO transferencia_itens (transferencia_id, produto_id, quantidade_enviada, data_recebimento, status) 
                                    VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'confirmado')`;
                                db.run(sqlInsertConfirmado, [item.transferencia_id, item.produto_id, quantidadeConfirmada], (errInsert) => {
                                    if (errInsert) return reject(new Error(`Erro ao inserir item confirmado: ${errInsert.message}`));
                                    resolve();
                                });
                            });
                        } else {
                            // Confirmação TOTAL: Apenas atualiza o status do item pendente.
                            const sqlUpdateTotal = `
                                UPDATE transferencia_itens 
                                SET data_recebimento = CURRENT_TIMESTAMP, status = 'confirmado' 
                                WHERE id = ?`;
                            db.run(sqlUpdateTotal, [pendente.id], (errUpdate) => {
                                if (errUpdate) return reject(new Error(`Erro ao confirmar totalmente o item: ${errUpdate.message}`));
                                resolve();
                            });
                        }
                    });
                });
            });

            Promise.all(processPromises)
                .then(() => {
                    // Após processar todos os itens, verifica se alguma transferência foi totalmente concluída.
                    const transferenciaIdsUnicas = [...new Set(itens_processados.map(i => i.transferencia_id))];
                    const checkCompletionPromises = transferenciaIdsUnicas.map(transferenciaId => {
                        return new Promise((resolve, reject) => {
                            const sqlCheck = `SELECT COUNT(id) as pendentes FROM transferencia_itens WHERE transferencia_id = ? AND status = 'pendente'`;
                            db.get(sqlCheck, [transferenciaId], (err, row) => {
                                if (err) return reject(err);
                                if (row && row.pendentes === 0) {
                                    const sqlUpdateTransferencia = `UPDATE transferencias SET data_recebimento_confirmado = CURRENT_TIMESTAMP, usuario_confirmacao_id = ? WHERE id = ? AND data_recebimento_confirmado IS NULL`;
                                    db.run(sqlUpdateTransferencia, [usuarioConfirmacaoId, transferenciaId], (errUpdate) => {
                                        if (errUpdate) return reject(errUpdate);
                                        resolve();
                                    });
                                } else {
                                    resolve();
                                }
                            });
                        });
                    });
                    return Promise.all(checkCompletionPromises);
                })
                .then(() => {
                    db.run('COMMIT;', (errCommit) => {
                        if (errCommit) throw errCommit;
                        res.status(200).json({ message: "Item(ns) confirmado(s) com sucesso." });
                    });
                })
                .catch(err => {
                    console.error("[POST /confirmar-recebimento] Erro na transação:", err.message);
                    db.run('ROLLBACK;');
                    res.status(500).json({ error: err.message || 'Falha ao confirmar recebimento.' });
                });
        });
    });
});

// --- ROTA 5: POST /registrar-devolucao ---
// Registra itens como devolvidos, devolve-os ao estoque da SME e cria uma notificação.
router.post('/registrar-devolucao', (req, res) => {
    // ALTERADO: Payload agora é 'itens_processados' e contém a quantidade.
    const { itens_processados, escola_id } = req.body;
    const { username: usuarioNome, id: usuarioId } = req.user;

    if (!escola_id || !Array.isArray(itens_processados) || itens_processados.length === 0) {
        return res.status(400).json({ error: 'Dados insuficientes para registrar a devolução.' });
    }
    if (req.user.role === 'escola' && req.user.school_id !== escola_id) {
        return res.status(403).json({ error: "Acesso negado." });
    }

    // Validação
    for (const item of itens_processados) {
        if (!item.transferencia_id || !item.produto_id || !item.quantidade || item.quantidade <= 0) {
             return res.status(400).json({ error: `Item de devolução inválido: ${JSON.stringify(item)}.` });
        }
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION;', (errBegin) => {
            if (errBegin) return res.status(500).json({ error: 'Erro ao iniciar transação.' });

            const detalhesItensParaNotificacao = [];
            
            const processPromises = itens_processados.map(item => {
                return new Promise((resolve, reject) => {
                    const sqlGetPendente = `
                        SELECT ti.id, ti.quantidade_enviada, p.nome as nome_produto
                        FROM transferencia_itens ti
                        JOIN produtos p ON ti.produto_id = p.id
                        WHERE ti.transferencia_id = ? AND ti.produto_id = ? AND ti.status = 'pendente'`;

                    db.get(sqlGetPendente, [item.transferencia_id, item.produto_id], (errGet, pendente) => {
                        if (errGet) return reject(new Error(`Erro ao buscar item para devolver: ${errGet.message}`));
                        if (!pendente) return reject(new Error(`Item (Transf: ${item.transferencia_id}, Prod: ${item.produto_id}) não encontrado ou já processado.`));
                        if (item.quantidade > pendente.quantidade_enviada) {
                            return reject(new Error(`Tentativa de devolver ${item.quantidade}, mas apenas ${pendente.quantidade_enviada} estão pendentes.`));
                        }

                        detalhesItensParaNotificacao.push({ nome: pendente.nome_produto, quantidade: item.quantidade });

                        const quantidadeDevolvida = item.quantidade;
                        const quantidadeRestante = pendente.quantidade_enviada - quantidadeDevolvida;

                        if (quantidadeRestante > 0) {
                            // Devolução PARCIAL
                            const sqlUpdatePendente = `UPDATE transferencia_itens SET quantidade_enviada = ? WHERE id = ?`;
                            db.run(sqlUpdatePendente, [quantidadeRestante, pendente.id], function(errUpdate) {
                                if (errUpdate) return reject(new Error(`Erro ao atualizar item pendente na devolução: ${errUpdate.message}`));
                                const sqlInsertDevolvido = `INSERT INTO transferencia_itens (transferencia_id, produto_id, quantidade_enviada, status, data_recebimento) VALUES (?, ?, ?, 'devolvido', CURRENT_TIMESTAMP)`;
                                db.run(sqlInsertDevolvido, [item.transferencia_id, item.produto_id, quantidadeDevolvida], (errInsert) => {
                                    if (errInsert) return reject(new Error(`Erro ao inserir item devolvido: ${errInsert.message}`));
                                    resolve();
                                });
                            });
                        } else {
                            // Devolução TOTAL
                            const sqlUpdateTotal = `UPDATE transferencia_itens SET status = 'devolvido', data_recebimento = CURRENT_TIMESTAMP WHERE id = ?`;
                            db.run(sqlUpdateTotal, [pendente.id], function(errUpdate) {
                                if (errUpdate) return reject(new Error(`Erro ao devolver totalmente o item: ${errUpdate.message}`));
                                if(this.changes === 0) return reject(new Error(`Nenhuma linha alterada para devolução total do item.`));
                                resolve();
                            });
                        }
                    });
                });
            });

            Promise.all(processPromises)
                .then(() => {
                    // Lógica de notificação permanece, mas agora é mais precisa.
                    db.get('SELECT nome FROM escolas WHERE id = ?', [escola_id], (errEscola, escola) => {
                        if (errEscola || !escola) throw new Error('Escola não encontrada para notificação.');

                        let itensTexto = detalhesItensParaNotificacao.map(d => `- ${d.nome} (Qtd: ${d.quantidade})`).join('\n');
                        const message = `Devolução registrada por "${usuarioNome}" da escola "${escola.nome}":\n${itensTexto}`;
                        
                        // O contexto agora são os itens que foram efetivamente devolvidos
                        const contextData = JSON.stringify(itens_processados.map(i => ({ produto_id: i.produto_id, quantidade: i.quantidade })));

                        const stmt = db.prepare('INSERT INTO notificacoes (message, tipo, context_data) VALUES (?, ?, ?)');
                        stmt.run(message, 'devolucao', contextData, function (errInsert) {
                            if (errInsert) throw new Error('Falha ao criar notificação.');
                            
                            const novaNotificacao = { id: this.lastID, message, tipo: 'devolucao', lida: false, createdAt: new Date().toISOString() };

                            db.run('COMMIT;', (errCommit) => {
                                if (errCommit) throw errCommit;
                                res.status(201).json({ 
                                    message: 'Devolução registrada e notificação criada com sucesso!',
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
router.get('/historico-sme', (req, res) => {
    const { destino, dataInicio, dataFim, page = 1, limit = 10 } = req.query;

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

    const sqlCount = `SELECT COUNT(DISTINCT t.id) as totalItems ${sqlBase} ${sqlWhere}`;

    db.get(sqlCount, paramsSQL, (errCount, countRow) => {
        if (errCount) {
            console.error("[GET /historico-sme] Erro ao contar itens:", errCount.message);
            return res.status(500).json({ error: "Erro interno ao processar a contagem de itens." });
        }
        const totalItems = countRow ? countRow.totalItems : 0;
        const totalPages = Math.ceil(totalItems / limitNum);

        if (totalItems === 0) {
             return res.json({ items: [], currentPage: pageNum, totalPages: 0, totalItems: 0 });
        }

        // ALTERADO: A query de itens agora busca todos os itens e seus status.
        let sqlHistoricoEnviosSME = `
            SELECT
                t.id AS transferencia_id,
                t.data_transferencia AS data_envio, 
                u_sme.username AS usuario_sme_nome,
                e.nome AS nome_escola,
                e.id AS escola_id,
                COALESCE(
                  (
                    SELECT JSON_GROUP_ARRAY(
                              JSON_OBJECT(
                                'produto_id', p_sub.id,
                                'nome_produto', p_sub.nome,
                                'unidade_medida', p_sub.unidade_medida,
                                'quantidade_enviada', ti_sub.quantidade_enviada,
                                'status', ti_sub.status,
                                'data_processamento', ti_sub.data_recebimento 
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

        const finalParamsSQL = [...paramsSQL, limitNum, offset];

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
                
                // LÓGICA DE STATUS GERAL CORRIGIDA
                const totalItens = itensArray.length;
                const statusCounts = itensArray.reduce((acc, item) => {
                    acc[item.status] = (acc[item.status] || 0) + 1;
                    return acc;
                }, {});

                let statusGeral = 'Pendente'; // Começa com Pendente como padrão

                const pendentes = statusCounts.pendente || 0;
                const confirmados = statusCounts.confirmado || 0;
                const devolvidos = statusCounts.devolvido || 0;

                if (pendentes === 0) {
                    // Se não há itens pendentes, está tudo processado.
                    if (confirmados === totalItens) {
                        statusGeral = 'Totalmente Confirmado';
                    } else if (devolvidos === totalItens) {
                        statusGeral = 'Totalmente Devolvido';
                    } else {
                        statusGeral = 'Concluído'; // Mix de confirmado e devolvido
                    }
                } else if (pendentes < totalItens) {
                    // Se há pendentes, mas não são todos, então é parcial.
                    statusGeral = 'Parcialmente Confirmado/Devolvido';
                }
                // Se pendentes === totalItens, o statusGeral permanece como 'Pendente' (o valor padrão).

                return { ...envio, itens: itensArray, status_geral: statusGeral };
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