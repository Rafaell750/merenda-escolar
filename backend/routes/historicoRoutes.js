// backend/routes/historicoRoutes.js

const express = require('express');
const db = require('../database/dbConnection');
const router = express.Router();

// MODIFICADO: GET /api/historico/produtos - Agora com suporte a paginação
router.get('/produtos', (req, res) => {
    // 1. Pega os parâmetros de paginação da query string. Define valores padrão.
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // 10 itens por página por padrão
    const offset = (page - 1) * limit;

    // 2. Query para buscar o número total de registros.
    const countSql = `SELECT COUNT(*) AS total FROM produto_historico`;

    // 3. Query para buscar os itens da página atual, com LIMIT e OFFSET.
    const dataSql = `
        SELECT 
            id, produto_id, produto_nome_snapshot, acao,
            detalhes, usuario_username_snapshot,
            data_acao 
        FROM produto_historico
        ORDER BY data_acao DESC
        LIMIT ? 
        OFFSET ?
    `;

    // 4. Executa as duas queries em paralelo.
    Promise.all([
        new Promise((resolve, reject) => {
            db.get(countSql, [], (err, row) => {
                if (err) reject(err);
                else resolve(row.total);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(dataSql, [limit, offset], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        })
    ]).then(([totalItems, items]) => {
        // 5. Retorna uma resposta estruturada com os dados da paginação.
        res.status(200).json({
            items: items,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems: totalItems,
                limit: limit
            }
        });
    }).catch(err => {
        console.error('Erro ao buscar histórico geral de produtos com paginação:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar histórico.' });
    });
});


// Rota antiga para histórico de um produto específico (pode ser mantida ou removida)
router.get('/produtos/:produtoId', (req, res) => {
    const { produtoId } = req.params;

    const sql = `
        SELECT 
            id,
            acao,
            detalhes,
            usuario_username_snapshot,
            data_acao 
        FROM produto_historico
        WHERE produto_id = ?
        ORDER BY data_acao DESC
    `;

    db.all(sql, [produtoId], (err, rows) => {
        if (err) {
            console.error(`Erro ao buscar histórico para produto ID ${produtoId}:`, err.message);
            return res.status(500).json({ error: 'Erro interno do servidor ao buscar histórico.' });
        }
        res.status(200).json(rows || []);
    });
});

module.exports = router;