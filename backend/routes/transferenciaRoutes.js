// backend/routes/transferenciaRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../database/dbConnection');

// --- ROTA 1: POST /api/transferencias ---
// Registra uma nova transferência de estoque (quando o estoque é ENVIADO para a escola)
router.post('/', (req, res) => {
    const { escola_id, itens } = req.body;
    const userId = req.user.id; // ID do usuário que está ENVIANDO

    // Validação de Entrada
    if (!escola_id || !Number.isInteger(escola_id) || escola_id <= 0) {
        return res.status(400).json({ error: 'ID da escola inválido ou ausente.' });
    }
    if (!Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ error: 'Lista de itens inválida ou vazia.' });
    }
    for (const item of itens) {
        if (!item.produto_id || !Number.isInteger(item.produto_id) || item.produto_id <= 0 ||
            !item.quantidade || typeof item.quantidade !== 'number' || item.quantidade <= 0) {
            return res.status(400).json({ error: `Item inválido na lista: ${JSON.stringify(item)}` });
        }
    }

    // Transação do Banco de Dados
    db.serialize(() => {
        db.run('BEGIN TRANSACTION;', (errBegin) => {
            if (errBegin) {
                console.error("Erro ao iniciar transação (POST /transferencias):", errBegin.message);
                return res.status(500).json({ error: 'Erro interno do servidor ao iniciar transação.' });
            }

            const promises = [];
            let rollbackNeeded = false;
            let detailedError = null;

            // 1. Verificar estoque
            itens.forEach(item => {
                promises.push(new Promise((resolve, reject) => {
                    const sqlCheck = 'SELECT nome, quantidade FROM produtos WHERE id = ?';
                    db.get(sqlCheck, [item.produto_id], (errCheck, produto) => {
                        if (errCheck) {
                            rollbackNeeded = true;
                            detailedError = detailedError || 'Erro ao verificar produto.';
                            return reject(errCheck);
                        }
                        if (!produto) {
                            rollbackNeeded = true;
                            detailedError = `Produto ID ${item.produto_id} não encontrado.`;
                            return reject(new Error(detailedError));
                        }
                        if (produto.quantidade === null || produto.quantidade < item.quantidade) {
                            rollbackNeeded = true;
                            detailedError = `Estoque insuficiente para "${produto.nome}". Disponível: ${produto.quantidade ?? 0}, Solicitado: ${item.quantidade}.`;
                            return reject(new Error(detailedError));
                        }
                        resolve();
                    });
                }));
            });

            Promise.all(promises)
                .then(() => {
                    if (rollbackNeeded) throw new Error(detailedError || 'Erro na verificação de estoque.');

                    // 2. Inserir registro da transferência principal
                    // data_recebimento_confirmado será NULL por padrão (indicando pendente)
                    const sqlInsertTransferencia = 'INSERT INTO transferencias (escola_id, usuario_id, data_transferencia) VALUES (?, ?, CURRENT_TIMESTAMP)';
                    db.run(sqlInsertTransferencia, [escola_id, userId], function (errInsertTransf) {
                        if (errInsertTransf) {
                            detailedError = 'Erro ao registrar a transferência.';
                            throw errInsertTransf; // Será pego pelo .catch da transação
                        }
                        const transferenciaId = this.lastID;

                        // 3. Atualizar produtos e inserir itens da transferência
                        const updateAndInsertPromises = itens.map(item => {
                            return new Promise((resolve, reject) => {
                                const sqlUpdateProduto = 'UPDATE produtos SET quantidade = quantidade - ?, data_modificacao = CURRENT_TIMESTAMP WHERE id = ?';
                                db.run(sqlUpdateProduto, [item.quantidade, item.produto_id], (errUpdate) => {
                                    if (errUpdate) return reject(errUpdate);

                                    const sqlInsertItem = 'INSERT INTO transferencia_itens (transferencia_id, produto_id, quantidade_enviada) VALUES (?, ?, ?)';
                                    db.run(sqlInsertItem, [transferenciaId, item.produto_id, item.quantidade], (errInsertItem) => {
                                        if (errInsertItem) return reject(errInsertItem);
                                        resolve();
                                    });
                                });
                            });
                        });

                        return Promise.all(updateAndInsertPromises)
                            .then(() => {
                                db.run('COMMIT;', (errCommit) => {
                                    if (errCommit) throw errCommit;
                                    console.log(`Transferência ID ${transferenciaId} ENVIADA para escola ID ${escola_id} por usuário ID ${userId}.`);
                                    res.status(201).json({ message: 'Transferência de estoque registrada com sucesso!', transferenciaId: transferenciaId });
                                });
                            });
                    });
                })
                .catch(transactionError => {
                    console.error("Erro na transação (POST /transferencias):", transactionError.message);
                    db.run('ROLLBACK;', (errRollback) => {
                        if (errRollback) console.error("Erro no rollback (POST /transferencias):", errRollback.message);
                    });
                    // Retorna o erro mais específico se disponível, senão um genérico
                    res.status(detailedError ? 400 : 500).json({ error: detailedError || 'Falha ao processar a transferência.' });
                });
        });
    });
});


// --- ROTA 2: GET /api/transferencias/confirmadas/por-escola/:escolaId ---
// Busca transferências JÁ CONFIRMADAS para exibir na tabela principal da página da escola
router.get('/confirmadas/por-escola/:escolaId', (req, res) => {
    console.log(`[API] Rota GET /confirmadas/por-escola/${req.params.escolaId} acessada`);
    const { escolaId } = req.params;

    if (!escolaId || isNaN(parseInt(escolaId))) {
        return res.status(400).json({ error: "ID da escola inválido." });
    }

    const sqlTransferenciasConfirmadas = `
        SELECT
            t.id AS transferencia_id,
            strftime('%d/%m/%Y %H:%M', t.data_recebimento_confirmado) AS data_recebimento_confirmado_formatada, -- Data da CONFIRMAÇÃO
            strftime('%d/%m/%Y %H:%M', t.data_transferencia) AS data_envio_original_formatada, -- Data do ENVIO original
            u.username AS nome_usuario
        FROM
            transferencias t
        JOIN
            usuarios u ON t.usuario_id = u.id -- Usuário que ENVIOU
        WHERE
            t.escola_id = ? AND t.data_recebimento_confirmado IS NOT NULL -- Filtro para CONFIRMADAS
        ORDER BY
            t.data_recebimento_confirmado DESC; -- Ordena pela data de confirmação
    `;

    db.all(sqlTransferenciasConfirmadas, [escolaId], (err, transferencias) => {
        if (err) {
            console.error("Erro ao buscar transferências confirmadas:", err.message);
            return res.status(500).json({ error: "Erro interno ao buscar transferências confirmadas." });
        }
        if (transferencias.length === 0) { return res.json([]); }

        const promessasItens = transferencias.map(transferencia => {
            return new Promise((resolve, reject) => {
                const sqlItens = `
                    SELECT p.nome AS nome_produto, p.unidade_medida, ti.quantidade_enviada
                    FROM transferencia_itens ti
                    JOIN produtos p ON ti.produto_id = p.id
                    WHERE ti.transferencia_id = ?;
                `;
                db.all(sqlItens, [transferencia.transferencia_id], (errItens, itens) => {
                    if (errItens) {
                        console.error(`Erro ao buscar itens para transf. confirmada ID ${transferencia.transferencia_id}:`, errItens.message);
                        resolve({ ...transferencia, itens: [], error_itens: "Erro ao buscar itens" });
                    } else {
                        resolve({ ...transferencia, itens: itens });
                    }
                });
            });
        });
        Promise.all(promessasItens)
            .then(transferenciasComItens => res.json(transferenciasComItens))
            .catch(errorGlobal => {
                console.error("Erro global ao processar itens (confirmadas):", errorGlobal);
                res.status(500).json({ error: "Erro ao processar detalhes das transferências confirmadas." });
            });
    });
});


// --- ROTA 3: GET /api/transferencias/pendentes/por-escola/:escolaId ---
// Busca transferências PENDENTES de confirmação para exibir no MODAL de confirmação
router.get('/pendentes/por-escola/:escolaId', (req, res) => {
    console.log(`[API] Rota GET /pendentes/por-escola/${req.params.escolaId} acessada`);
    const { escolaId } = req.params;

    if (!escolaId || isNaN(parseInt(escolaId))) {
        return res.status(400).json({ error: "ID da escola inválido." });
    }

    const sqlTransferenciasPendentes = `
        SELECT
            t.id AS transferencia_id,
            strftime('%d/%m/%Y %H:%M', t.data_transferencia) AS data_formatada, -- Data do ENVIO original
            u.username AS nome_usuario -- Usuário que ENVIOU
        FROM
            transferencias t
        JOIN
            usuarios u ON t.usuario_id = u.id
        WHERE
            t.escola_id = ? AND t.data_recebimento_confirmado IS NULL -- Filtro para PENDENTES
        ORDER BY
            t.data_transferencia ASC; -- Mais antigas primeiro para confirmação
    `;
    db.all(sqlTransferenciasPendentes, [escolaId], (err, transferencias) => {
        if (err) {
            console.error("Erro ao buscar transferências pendentes:", err.message);
            return res.status(500).json({ error: "Erro interno ao buscar transferências pendentes." });
        }
        if (transferencias.length === 0) { return res.json([]); }

        const promessasItens = transferencias.map(transferencia => {
            return new Promise((resolve, reject) => {
                const sqlItens = `
                    SELECT p.nome AS nome_produto, p.unidade_medida, ti.quantidade_enviada
                    FROM transferencia_itens ti
                    JOIN produtos p ON ti.produto_id = p.id
                    WHERE ti.transferencia_id = ?;
                `;
                db.all(sqlItens, [transferencia.transferencia_id], (errItens, itens) => {
                    if (errItens) {
                        console.error(`Erro ao buscar itens para transf. pendente ID ${transferencia.transferencia_id}:`, errItens.message);
                        resolve({ ...transferencia, itens: [], error_itens: "Erro ao buscar itens" });
                    } else {
                        resolve({ ...transferencia, itens: itens });
                    }
                });
            });
        });
        Promise.all(promessasItens)
            .then(transferenciasComItens => res.json(transferenciasComItens))
            .catch(errorGlobal => {
                console.error("Erro global ao processar itens (pendentes):", errorGlobal);
                res.status(500).json({ error: "Erro ao processar detalhes das transferências pendentes." });
            });
    });
});


// --- ROTA 4: POST /api/transferencias/confirmar-recebimento ---
// Marca uma ou mais transferências como recebidas
router.post('/confirmar-recebimento', (req, res) => {
    const { transferencia_ids, escola_id } = req.body; // escola_id é opcional, mas bom para validação extra
    const usuarioConfirmacaoId = req.user.id; // ID do usuário que está CONFIRMANDO o recebimento

    console.log(`[API] Rota POST /confirmar-recebimento acessada. IDs: ${transferencia_ids}, Escola: ${escola_id}, Usuário Conf: ${usuarioConfirmacaoId}`);


    if (!Array.isArray(transferencia_ids) || transferencia_ids.length === 0) {
        return res.status(400).json({ error: "Nenhuma ID de transferência fornecida para confirmação." });
    }

    const idsValidos = transferencia_ids.every(id => Number.isInteger(id) && id > 0);
    if (!idsValidos) {
        return res.status(400).json({ error: "IDs de transferência inválidos." });
    }

    const placeholders = transferencia_ids.map(() => '?').join(',');
    const params = [...transferencia_ids];

    let sqlConfirmar = `
        UPDATE transferencias
        SET data_recebimento_confirmado = CURRENT_TIMESTAMP
        -- Se você adicionar uma coluna 'usuario_confirmacao_id', descomente e adicione o parâmetro:
        -- , usuario_confirmacao_id = ?
        WHERE id IN (${placeholders})
          AND data_recebimento_confirmado IS NULL -- Só atualiza as que estão pendentes
    `;
    // Se você adicionar 'usuario_confirmacao_id', adicione-o aos params:
    // params.unshift(usuarioConfirmacaoId); // Adiciona no início se for o primeiro '?' após SET

    // Validação opcional extra: se escola_id for fornecido, garante que a transferência pertence a essa escola
    if (escola_id && Number.isInteger(escola_id) && escola_id > 0) {
        sqlConfirmar += ` AND escola_id = ?`;
        params.push(escola_id);
    }


    db.run(sqlConfirmar, params, function(err) { // Usar function para 'this'
        if (err) {
            console.error("Erro ao confirmar recebimento de transferências:", err.message);
            return res.status(500).json({ error: "Erro interno ao confirmar recebimento." });
        }
        if (this.changes === 0) {
            console.warn(`Nenhuma transferência atualizada para confirmação. IDs: ${transferencia_ids.join(', ')}, Escola ID: ${escola_id}. Possivelmente já confirmadas, inválidas ou não pertencem à escola (se ID da escola foi usado na query).`);
            return res.status(404).json({ error: "Nenhuma transferência pendente encontrada para os IDs fornecidos ou já foram confirmadas." });
        }
        console.log(`${this.changes} transferência(s) marcada(s) como recebida(s). Confirmado por Usuário ID: ${usuarioConfirmacaoId}`);
        res.status(200).json({ message: `${this.changes} transferência(s) confirmada(s) com sucesso.` });
    });
});


module.exports = router;