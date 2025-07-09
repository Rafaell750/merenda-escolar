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

// NOVO: Rota para confirmar uma devolução e reabastecer o estoque
router.post('/confirmar-devolucao', authorizeAdmin, (req, res) => {
    const { notificacao_id } = req.body;

    if (!notificacao_id) {
        return res.status(400).json({ error: 'ID da notificação é obrigatório.' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION;');

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
                return res.status(400).json({ error: 'Esta devolução já foi confirmada.' });
            }
            if (notificacao.tipo !== 'devolucao' || !notificacao.context_data) {
                db.run('ROLLBACK;');
                return res.status(400).json({ error: 'Notificação inválida para esta ação.' });
            }
            
            const itensParaReabastecer = JSON.parse(notificacao.context_data);

            // 2. Itera sobre os itens para reabastecer o estoque
            const restockPromises = itensParaReabastecer.map(item => {
                return new Promise((resolve, reject) => {
                    const sqlGetQtd = `SELECT quantidade_enviada FROM transferencia_itens WHERE transferencia_id = ? AND produto_id = ? AND status = 'devolvido'`;
                    db.get(sqlGetQtd, [item.transferencia_id, item.produto_id], (errQtd, itemDevolvido) => {
                        if (errQtd || !itemDevolvido) return reject(new Error(`Item devolvido ${item.produto_id} não encontrado.`));
                        
                        const sqlRestock = `UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?`;
                        db.run(sqlRestock, [itemDevolvido.quantidade_enviada, item.produto_id], (errRestock) => {
                            if (errRestock) return reject(errRestock);
                            resolve();
                        });
                    });
                });
            });

            Promise.all(restockPromises)
                .then(() => {
                    // 3. Marca a notificação como lida
                    const sqlMarkAsRead = `UPDATE notificacoes SET lida = 1 WHERE id = ?`;
                    db.run(sqlMarkAsRead, [notificacao_id], (errMark) => {
                        if (errMark) throw errMark;
                        db.run('COMMIT;');
                        res.status(200).json({ message: 'Devolução confirmada e estoque reabastecido com sucesso!' });
                    });
                })
                .catch(err => {
                    console.error("Erro ao confirmar devolução:", err.message);
                    db.run('ROLLBACK;');
                    res.status(500).json({ error: 'Falha ao processar a confirmação da devolução.' });
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