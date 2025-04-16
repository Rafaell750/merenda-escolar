// backend/routes/produtoRoutes.js
const express = require('express');
const db = require('../database/dbConnection');
const router = express.Router();

// POST /api/produtos - Cadastrar (já protegido por authenticateToken no server.js)
router.post('/', (req, res) => {
   // Sua lógica de cadastro de produto aqui...
    const { nome, descricao, unidadeMedida, categoria } = req.body;
    // ... validação ...
    const insertSql = `INSERT INTO produtos (nome, descricao, unidade_medida, categoria) VALUES (?, ?, ?, ?)`;
    // ... db.run ... e db.get para retornar completo ...
    db.run(insertSql, [nome, descricao, unidadeMedida, categoria], function(err) {
         if (err) { /* ... tratamento de erro ... */ return res.status(500).json({ error: 'Erro interno.' }); }
         db.get("SELECT * FROM produtos WHERE id = ?", [this.lastID], (selectErr, row) => {
             if (selectErr) { /* ... tratamento erro select ... */ }
             console.log(`Produto ${row.nome} cadastrado por ${req.user?.username || 'usuário desconhecido (sem auth?)'}`); // Adiciona log de quem cadastrou
             res.status(201).json(row);
         });
     });
});

// GET /api/produtos - Listar (já protegido por authenticateToken no server.js)
router.get('/', (req, res) => {
    const sql = "SELECT * FROM produtos ORDER BY id DESC";
    db.all(sql, [], (err, rows) => {
        // ... tratamento de erro ...
        res.status(200).json(rows);
    });
});

// Adicione DELETE /api/produtos/:id etc. aqui, também estarão protegidos.
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM produtos WHERE id = ?";
    db.run(sql, id, function(err) {
        if (err) {
            console.error(`Erro ao excluir produto ${id}:`, err.message);
            return res.status(500).json({ error: 'Erro interno ao excluir produto.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Produto não encontrado.' });
        }
        console.log(`Produto ${id} excluído por ${req.user?.username || 'usuário desconhecido'}`);
        res.status(204).send(); // No Content
    });
});


module.exports = router;