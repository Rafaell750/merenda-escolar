// backend/routes/notificacaoRoutes.js

const express = require('express');
const router = express.Router();
const db = require('../database/dbConnection');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Define um array com os papéis que podem acessar as notificações
const rolesPermitidasParaNotificacoes = ['admin', 'user'];

// GET /api/notificacoes - Busca notificações com paginação
router.get('/', authenticateToken, authorizeRole(rolesPermitidasParaNotificacoes), (req, res) => {
    // Define o número de itens por página. Pode vir da query ou ter um padrão.
    const limit = parseInt(req.query.limit) || 10; // Padrão de 10 notificações por página
    // Pega o número da página da query, com padrão 1.
    const page = parseInt(req.query.page) || 1;
    // Calcula o offset para a consulta SQL.
    const offset = (page - 1) * limit;

// Usamos Promise.all para executar as consultas de contagem em paralelo para mais eficiência
    const countAllPromise = new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as total FROM notificacoes`, [], (err, row) => {
            if (err) return reject(err);
            resolve(row.total);
        });
    });

    const countUnreadPromise = new Promise((resolve, reject) => {
        // Nova consulta para contar apenas as notificações não lidas (lida = 0 ou lida = false)
        db.get(`SELECT COUNT(*) as total FROM notificacoes WHERE lida = 0`, [], (err, row) => {
            if (err) return reject(err);
            resolve(row.total);
        });
    });

    Promise.all([countAllPromise, countUnreadPromise])
        .then(([totalItems, totalUnread]) => {
            const totalPages = Math.ceil(totalItems / limit);

            // 2. Segunda consulta: Buscar a página específica de notificações.
            const dataSql = `
                SELECT id, message, tipo, lida, createdAt, context_data 
                FROM notificacoes 
                ORDER BY createdAt DESC
                LIMIT ? OFFSET ?
            `;
            db.all(dataSql, [limit, offset], (err, rows) => {
                if (err) {
                    console.error("Erro ao buscar notificações paginadas:", err.message);
                    return res.status(500).json({ error: "Erro interno do servidor ao buscar notificações." });
                }
                
                // 3. Enviar a resposta com os dados e as informações de paginação.
                res.json({
                    data: rows, // Os itens da página atual
                    pagination: {
                        currentPage: page,
                        totalPages: totalPages,
                        totalItems: totalItems,
                        itemsPerPage: limit
                    },
                    // contagem total de não lidos
                    totalUnreadCount: totalUnread
                });
            });
        });
    });


// Rota para confirmar uma devolução e reabastecer o estoque
router.post('/confirmar-devolucao', authenticateToken, authorizeRole(rolesPermitidasParaNotificacoes), (req, res) => {
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
router.put('/:id/marcar-lida', authenticateToken, authorizeRole(rolesPermitidasParaNotificacoes), (req, res) => {
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