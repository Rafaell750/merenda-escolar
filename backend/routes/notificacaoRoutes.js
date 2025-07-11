// backend/routes/notificacaoRoutes.js

const express = require('express');
const router = express.Router();
const db = require('../database/dbConnection');
const { authorizeAdmin } = require('../middleware/authMiddleware');

// GET /api/notificacoes - Busca todas as notificações (apenas para admin)
router.get('/', authorizeAdmin, (req, res) => {
    const sql = `
        SELECT id, message, tipo, lida, createdAt 
        FROM notificacoes 
        ORDER BY createdAt DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Erro ao buscar notificações:", err.message);
            return res.status(500).json({ error: "Erro interno do servidor." });
        }
        res.json(rows);
    });
});

// Rota para confirmar uma devolução e reabastecer o estoque
router.post('/confirmar-devolucao', authorizeAdmin, (req, res) => {
    const { notificacao_id } = req.body;

    if (!notificacao_id) {
        return res.status(400).json({ error: 'ID da notificação é obrigatório.' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION;', (errBegin) => {
            if (errBegin) {
                console.error("[CONFIRMAR DEVOLUÇÃO] Erro ao iniciar transação:", errBegin.message);
                return res.status(500).json({ error: 'Falha ao iniciar a transação.' });
            }

            // 1. Busca a notificação e seus dados de contexto
            const sqlGetNotificacao = `SELECT context_data, lida, tipo FROM notificacoes WHERE id = ?`;
            db.get(sqlGetNotificacao, [notificacao_id], (err, notificacao) => {
                if (err) {
                    db.run('ROLLBACK;');
                    return res.status(500).json({ error: 'Erro ao buscar notificação.' });
                }
                if (!notificacao) {
                    db.run('ROLLBACK;');
                    return res.status(404).json({ error: 'Notificação não encontrada.' });
                }
                if (notificacao.lida) {
                    db.run('ROLLBACK;');
                    return res.status(409).json({ error: 'Esta devolução já foi confirmada anteriormente.' });
                }
                if (notificacao.tipo !== 'devolucao' || !notificacao.context_data) {
                    db.run('ROLLBACK;');
                    return res.status(400).json({ error: 'Notificação inválida ou sem dados para esta ação.' });
                }
                
                try {
                    // 2. Parseia o JSON do context_data. Ele já contém a quantidade a ser devolvida.
                    const itensParaReabastecer = JSON.parse(notificacao.context_data);

                    if (!Array.isArray(itensParaReabastecer) || itensParaReabastecer.length === 0) {
                        throw new Error("Dados de devolução no contexto estão vazios ou mal formatados.");
                    }

                    // 3. Itera sobre os itens para reabastecer o estoque, usando a quantidade do contexto.
                    const restockPromises = itensParaReabastecer.map(item => {
                        return new Promise((resolve, reject) => {
                            // VALIDAÇÃO: Garante que o item tem os dados necessários
                            if (!item.produto_id || typeof item.quantidade !== 'number' || item.quantidade <= 0) {
                                return reject(new Error(`Item inválido no contexto da notificação: ${JSON.stringify(item)}`));
                            }

                            // LÓGICA SIMPLIFICADA: Usa diretamente a quantidade do item do contexto.
                            const sqlRestock = `UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?`;
                            db.run(sqlRestock, [item.quantidade, item.produto_id], function(errRestock) {
                                if (errRestock) return reject(errRestock);
                                // Validação para garantir que o produto foi encontrado e atualizado
                                if (this.changes === 0) {
                                    return reject(new Error(`Produto com ID ${item.produto_id} não encontrado para reabastecimento.`));
                                }
                                resolve();
                            });
                        });
                    });

                    Promise.all(restockPromises)
                        .then(() => {
                            // 4. Marca a notificação como lida
                            const sqlMarkAsRead = `UPDATE notificacoes SET lida = 1 WHERE id = ?`;
                            db.run(sqlMarkAsRead, [notificacao_id], (errMark) => {
                                if (errMark) throw errMark; // Joga para o catch

                                // 5. Commita a transação
                                db.run('COMMIT;', (errCommit) => {
                                    if (errCommit) throw errCommit; // Joga para o catch
                                    res.status(200).json({ message: 'Devolução confirmada e estoque reabastecido com sucesso!' });
                                });
                            });
                        })
                        .catch(err => {
                            // Este catch agora pega erros de validação, do Promise.all ou do db.run
                            console.error("Erro na transação de confirmação de devolução:", err.message);
                            db.run('ROLLBACK;');
                            // Retorna a mensagem de erro específica para o cliente, se for um erro de validação
                            res.status(500).json({ error: err.message || 'Falha ao processar a confirmação da devolução.' });
                        });
                } catch (parseError) {
                    console.error("[CONFIRMAR DEVOLUÇÃO] Erro ao parsear context_data:", parseError.message);
                    db.run('ROLLBACK;');
                    res.status(500).json({ error: 'Dados de devolução na notificação estão corrompidos.' });
                }
            });
        });
    });
});

// PUT /api/notificacoes/:id/marcar-lida - Marca uma notificação como lida (apenas para admin)
router.put('/:id/marcar-lida', authorizeAdmin, (req, res) => {
    const { id } = req.params;
    const sql = `UPDATE notificacoes SET lida = 1 WHERE id = ?`;

    db.run(sql, [id], function (err) {
        if (err) {
            console.error(`Erro ao marcar notificação ${id} como lida:`, err.message);
            return res.status(500).json({ error: "Erro interno do servidor." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Notificação não encontrada." });
        }
        res.status(200).json({ message: `Notificação ${id} marcada como lida.` });
    });
});

module.exports = router;