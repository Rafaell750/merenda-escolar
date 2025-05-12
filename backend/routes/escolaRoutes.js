// backend/routes/escolaRoutes.js
const express = require('express');
const db = require('../database/dbConnection'); // Ajuste o caminho se necessário
// const { authorizeAdmin } = require('../middleware/authMiddleware'); // Descomente se apenas admin puder manipular

const router = express.Router();

// --- ROTA POST /api/escolas - Cadastrar Nova Escola ---
router.post('/', async (req, res) => {
    const { nome, endereco, responsavel } = req.body;

    // Validação básica
    if (!nome || typeof nome !== 'string' || nome.trim() === '') {
        return res.status(400).json({ message: 'O nome da escola é obrigatório.' });
    }

    const sql = `INSERT INTO escolas (nome, endereco, responsavel) VALUES (?, ?, ?)`;
    // Salva null se os campos opcionais estiverem vazios/undefined
    const params = [
        nome.trim(),
        endereco || null,
        responsavel || null
    ];

    db.run(sql, params, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed: escolas.nome')) {
                 return res.status(409).json({ message: `A escola com o nome "${nome.trim()}" já existe.` });
            }
            console.error('Erro ao inserir escola:', err.message);
            return res.status(500).json({ message: 'Erro interno ao cadastrar a escola.' });
        }
        // Retorna a escola recém-criada com dados consistentes
        res.status(201).json({
            id: this.lastID,
            nome: nome.trim(),
            endereco: endereco || null,
            responsavel: responsavel || null
        });
    });
});

// --- ROTA GET /api/escolas - Listar Todas as Escolas ---
// *** MODIFICADO: Retorna mais campos para edição ***
router.get('/', (req, res) => {
    // Seleciona todas as colunas necessárias para a lista e edição
    const sql = "SELECT id, nome, endereco, responsavel FROM escolas ORDER BY nome";

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar escolas:', err.message);
            return res.status(500).json({ message: 'Erro interno ao buscar escolas.' });
        }
        // Retorna o array completo de escolas
        res.status(200).json(rows || []); // Retorna array vazio se não houver escolas
    });
});

// --- ROTA GET /api/escolas/:id - Obter detalhes de uma escola ---
// (Mantido - pode ser útil para outras funcionalidades)
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
     if (isNaN(id)) {
        return res.status(400).json({ message: "ID da escola inválido." });
    }
    const sql = "SELECT * FROM escolas WHERE id = ?";

    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error(`Erro ao buscar escola por ID ${id}:`, err.message);
            return res.status(500).json({ message: 'Erro interno ao buscar escola.' });
        }
        if (!row) {
            return res.status(404).json({ message: 'Escola não encontrada.' });
        }
        res.status(200).json(row);
    });
});

// --- ROTA DELETE /api/escolas/:id - Excluir uma Escola ---
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);

     if (isNaN(id)) {
        return res.status(400).json({ message: "ID da escola inválido." });
    }

    const sql = 'DELETE FROM escolas WHERE id = ?';

    db.run(sql, [id], function (err) {
        if (err) {
            console.error(`Erro ao excluir escola com ID ${id}:`, err.message);
            return res.status(500).json({ message: 'Erro interno ao excluir a escola.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Escola não encontrada para exclusão.' });
        }
        console.log(`Escola com ID ${id} excluída com sucesso.`);
        res.status(200).json({ message: 'Escola excluída com sucesso.' });
    });
});

// --- ROTA PUT /api/escolas/:id - Atualizar uma Escola ---
// *** IMPLEMENTADO/REFINADO ***
router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { nome, endereco, responsavel } = req.body;

    // Validação
    if (isNaN(id)) {
        return res.status(400).json({ message: "ID da escola inválido." });
    }
    if (!nome || typeof nome !== 'string' || nome.trim() === '') {
        return res.status(400).json({ message: 'O nome da escola é obrigatório e não pode ser vazio.' });
    }

    const sql = `UPDATE escolas SET
                    nome = ?,
                    endereco = ?,
                    responsavel = ?
                 WHERE id = ?`;
    const params = [
        nome.trim(),
        endereco || null,
        responsavel || null,
        id
    ];

    db.run(sql, params, function(err) {
         if (err) {
            if (err.message.includes('UNIQUE constraint failed: escolas.nome')) {
                 return res.status(409).json({ message: `Já existe outra escola com o nome "${nome.trim()}".` });
            }
            console.error(`Erro ao atualizar escola com ID ${id}:`, err.message);
            return res.status(500).json({ message: 'Erro interno ao atualizar a escola.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Escola não encontrada para atualização.' });
        }
         // Sucesso - Retorna o objeto atualizado
         console.log(`Escola com ID ${id} atualizada com sucesso.`);
         res.status(200).json({
             id: id,
             nome: nome.trim(),
             endereco: endereco || null,
             responsavel: responsavel || null
            });
    });
});


module.exports = router;