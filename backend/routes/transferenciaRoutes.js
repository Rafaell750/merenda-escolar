// backend/routes/transferenciaRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../database/dbConnection');


// --- POST /api/transferencias ---
// Registra uma nova transferência de estoque
router.post('/', (req, res) => {
    const { escola_id, itens } = req.body; // itens = [{ produto_id, quantidade }, ...]
    const userId = req.user.id; // Obtido do middleware authenticateToken

    // --- Validação de Entrada ---
    if (!escola_id || !Number.isInteger(escola_id) || escola_id <= 0) {
        return res.status(400).json({ error: 'ID da escola inválido ou ausente.' });
    }
    if (!Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ error: 'Lista de itens inválida ou vazia.' });
    }

    // Validação mais detalhada dos itens
    for (const item of itens) {
        if (!item.produto_id || !Number.isInteger(item.produto_id) || item.produto_id <= 0 ||
            !item.quantidade || typeof item.quantidade !== 'number' || item.quantidade <= 0) {
            return res.status(400).json({ error: `Item inválido na lista: ${JSON.stringify(item)}` });
        }
    } //ok



    // --- Transação do Banco de Dados ---
    // Usando db.serialize para garantir a ordem e db.run para transação manual com callbacks
    db.serialize(() => {
        db.run('BEGIN TRANSACTION;', (errBegin) => {
            if (errBegin) {
                console.error("Erro ao iniciar transação:", errBegin.message);
                return res.status(500).json({ error: 'Erro interno do servidor ao iniciar transação.' });
            }

            // Promises para controlar o fluxo assíncrono dentro da transação serializada
            const promises = [];
            let rollbackNeeded = false;
            let detailedError = null;

            // 1. Verificar estoque e preparar updates
            itens.forEach(item => {
                promises.push(new Promise((resolve, reject) => {
                    const sqlCheck = 'SELECT nome, quantidade FROM produtos WHERE id = ?';
                    db.get(sqlCheck, [item.produto_id], (errCheck, produto) => {
                        if (errCheck) {
                            console.error(`Erro ao verificar produto ID ${item.produto_id}:`, errCheck.message);
                            rollbackNeeded = true;
                            detailedError = detailedError || 'Erro ao verificar produto no estoque.';
                            return reject(errCheck); // Rejeita a promise individual
                        }
                        if (!produto) {
                            rollbackNeeded = true;
                            detailedError = `Produto com ID ${item.produto_id} não encontrado.`;
                            return reject(new Error(detailedError));
                        }
                        if (produto.quantidade === null || produto.quantidade < item.quantidade) {
                            rollbackNeeded = true;
                            detailedError = `Estoque insuficiente para "${produto.nome}" (ID: ${item.produto_id}). Disponível: ${produto.quantidade ?? 0}, Solicitado: ${item.quantidade}.`;
                            return reject(new Error(detailedError));
                        }
                        // Se chegou aqui, o estoque é suficiente para este item
                        resolve(); // Resolve a promise individual
                    });
                }));
            });

            // Executa todas as verificações
            Promise.all(promises)
                .then(() => {
                    // Se todas as verificações passaram e não precisa de rollback
                    if (rollbackNeeded) {
                        // Um erro ocorreu em algum callback, mas Promise.all não pegou (improvável com reject)
                        throw new Error(detailedError || 'Erro durante a verificação de estoque.');
                    }

                    // 2. Inserir registro da transferência principal
                    const sqlInsertTransferencia = 'INSERT INTO transferencias (escola_id, usuario_id) VALUES (?, ?)';
                    db.run(sqlInsertTransferencia, [escola_id, userId], function (errInsertTransf) { // Usar function para ter acesso a this.lastID
                        if (errInsertTransf) {
                            console.error("Erro ao inserir transferência:", errInsertTransf.message);
                            rollbackNeeded = true;
                            detailedError = 'Erro ao registrar a transferência.';
                            // Forçar rollback manual aqui
                            db.run('ROLLBACK;', (errRollback) => {
                                if(errRollback) console.error("Erro no rollback forçado 1:", errRollback.message);
                                return res.status(500).json({ error: detailedError });
                            });
                            return; // Impede a execução do resto
                        }

                        const transferenciaId = this.lastID; // Obtém o ID da transferência inserida

                        // 3. Atualizar produtos e inserir itens da transferência
                        const updateAndInsertPromises = [];
                        itens.forEach(item => {
                            // Atualiza produto
                            updateAndInsertPromises.push(new Promise((resolve, reject) => {
                                const sqlUpdateProduto = 'UPDATE produtos SET quantidade = quantidade - ?, data_modificacao = CURRENT_TIMESTAMP WHERE id = ?';
                                db.run(sqlUpdateProduto, [item.quantidade, item.produto_id], (errUpdate) => {
                                    if (errUpdate) {
                                        console.error(`Erro ao atualizar produto ID ${item.produto_id}:`, errUpdate.message);
                                        detailedError = `Erro ao atualizar estoque do produto ID ${item.produto_id}.`;
                                        return reject(errUpdate); // Rejeita promise do item
                                    }
                                    resolve();
                                });
                            }));
                            // Insere item da transferência
                            updateAndInsertPromises.push(new Promise((resolve, reject) => {
                                const sqlInsertItem = 'INSERT INTO transferencia_itens (transferencia_id, produto_id, quantidade_enviada) VALUES (?, ?, ?)';
                                db.run(sqlInsertItem, [transferenciaId, item.produto_id, item.quantidade], (errInsertItem) => {
                                    if (errInsertItem) {
                                        console.error(`Erro ao inserir item de transferência para produto ID ${item.produto_id}:`, errInsertItem.message);
                                        detailedError = `Erro ao registrar item da transferência (Produto ID: ${item.produto_id}).`;
                                        return reject(errInsertItem); // Rejeita promise do item
                                    }
                                    resolve();
                                });
                            }));
                        });

                        // Executa todas as atualizações e inserções de itens
                        Promise.all(updateAndInsertPromises)
                            .then(() => {
                                // 4. Se tudo deu certo, commita a transação
                                db.run('COMMIT;', (errCommit) => {
                                    if (errCommit) {
                                        console.error("Erro ao commitar transação:", errCommit.message);
                                        // Tenta fazer rollback se o commit falhou (melhor esforço)
                                        db.run('ROLLBACK;', (errRb) => {if(errRb) console.error("Erro no rollback pós-falha-commit:", errRb.message);});
                                        return res.status(500).json({ error: 'Erro interno do servidor ao finalizar transação.' });
                                    }
                                    console.log(`Transferência ID ${transferenciaId} para escola ID ${escola_id} registrada com sucesso por usuário ID ${userId}.`);
                                    res.status(201).json({ message: 'Transferência de estoque registrada com sucesso!', transferenciaId: transferenciaId });
                                });
                            })
                            .catch(updateError => {
                                // Erro durante atualização ou inserção de item
                                console.error("Erro na fase de atualização/inserção:", updateError.message);
                                rollbackNeeded = true;
                                db.run('ROLLBACK;', (errRollback) => {
                                     if(errRollback) console.error("Erro no rollback pós-falha-update:", errRollback.message);
                                     return res.status(500).json({ error: detailedError || 'Erro ao atualizar estoque ou registrar itens.' });
                                });
                            });
                    }); // Fim db.run insert transferencia
                })
                .catch(checkError => {
                    // Erro pego na fase de verificação inicial
                    console.error("Erro na fase de verificação:", checkError.message);
                    rollbackNeeded = true; // Garante que o rollback seja tentado
                     db.run('ROLLBACK;', (errRollback) => {
                        if(errRollback) console.error("Erro no rollback pós-falha-verificação:", errRollback.message);
                        // Retorna o erro detalhado que causou o rollback
                        return res.status(400).json({ error: detailedError || 'Erro ao processar itens da transferência.' });
                     });
                }); // Fim Promise.all verificações

        }); // Fim db.run BEGIN TRANSACTION
    }); // Fim db.serialize
});//ok

    // --- GET /api/transferencias/por-escola/:escolaId ---  <<< NOVA ROTA >>>
    router.get('/por-escola/:escolaId', (req, res) => {
        const { escolaId } = req.params;
    
        if (!escolaId || isNaN(parseInt(escolaId))) {
            return res.status(400).json({ error: "ID da escola inválido." });
        }
    
        // SQL principal para buscar as transferências da escola e o nome do usuário
        const sqlTransferencias = `
            SELECT
                t.id AS transferencia_id,
                strftime('%d/%m/%Y %H:%M', t.data_transferencia) AS data_formatada,
                u.username AS nome_usuario
            FROM
                transferencias t
            JOIN
                usuarios u ON t.usuario_id = u.id
            WHERE
                t.escola_id = ?
            ORDER BY
                t.data_transferencia DESC;
        `;
    
        db.all(sqlTransferencias, [escolaId], (err, transferencias) => {
            if (err) {
                console.error("Erro ao buscar transferências da escola:", err.message);
                return res.status(500).json({ error: "Erro interno ao buscar transferências da escola." });
            }
    
            if (transferencias.length === 0) {
                return res.json([]); // Retorna array vazio se não houver transferências
            }
    
            // Para cada transferência, buscar seus itens
            const promessasItens = transferencias.map(transferencia => {
                return new Promise((resolve, reject) => {
                    const sqlItens = `
                        SELECT
                            p.nome AS nome_produto,
                            p.unidade_medida,
                            ti.quantidade_enviada
                        FROM
                            transferencia_itens ti
                        JOIN
                            produtos p ON ti.produto_id = p.id
                        WHERE
                            ti.transferencia_id = ?;
                    `;
                    db.all(sqlItens, [transferencia.transferencia_id], (errItens, itens) => {
                        if (errItens) {
                            console.error(`Erro ao buscar itens para transferência ID ${transferencia.transferencia_id}:`, errItens.message);
                            // Não rejeita a promise principal, apenas anexa erro ou array vazio
                            resolve({ ...transferencia, itens: [], error_itens: "Erro ao buscar itens" });
                        } else {
                            resolve({ ...transferencia, itens: itens });
                        }
                    });
                });
            });
    
            Promise.all(promessasItens)
                .then(transferenciasComItens => {
                    res.json(transferenciasComItens);
                })
                .catch(errorGlobal => { // Pouco provável de cair aqui se os rejects internos forem tratados
                    console.error("Erro global ao processar itens das transferências:", errorGlobal);
                    res.status(500).json({ error: "Erro ao processar detalhes das transferências." });
                });
        });
    });

module.exports = router;