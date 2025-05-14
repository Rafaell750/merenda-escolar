// backend/routes/escolaRoutes.js
const express = require('express');
const db = require('../database/dbConnection');
const { authorizeAdmin, authorizeSchoolAccess } = require('../middleware/authMiddleware'); // Importar middlewares de autorização

const router = express.Router();

// --- ROTA POST /api/escolas - Cadastrar Nova Escola ---
// Apenas Admin pode cadastrar novas escolas.
// authenticateToken já é aplicado globalmente (via server.js).
router.post('/', authorizeAdmin, async (req, res) => { // Adicionado authorizeAdmin
    const { nome, endereco, responsavel } = req.body;

    if (!nome || typeof nome !== 'string' || nome.trim() === '') {
        return res.status(400).json({ message: 'O nome da escola é obrigatório.' });
    }

    const sql = `INSERT INTO escolas (nome, endereco, responsavel) VALUES (?, ?, ?)`;
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
        res.status(201).json({
            id: this.lastID,
            nome: nome.trim(),
            endereco: endereco || null,
            responsavel: responsavel || null,
            // data_cadastro é gerado pelo DB, mas pode ser útil buscar e retornar se necessário.
        });
    });
});

// --- ROTA GET /api/escolas - Listar Todas as Escolas ---
// Todos os usuários autenticados (admin, user, escola) podem listar as escolas.
// authenticateToken já é aplicado globalmente. Nenhuma autorização adicional específica aqui.
router.get('/', (req, res) => {
    const sql = "SELECT id, nome, endereco, responsavel FROM escolas ORDER BY nome";

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar escolas:', err.message);
            return res.status(500).json({ message: 'Erro interno ao buscar escolas.' });
        }
        res.status(200).json(rows || []);
    });
});

// --- ROTA GET /api/escolas/:id - Obter detalhes de uma escola ---
// Admin pode ver qualquer escola.
// User (genérico) pode ver qualquer escola (para visualização).
// Escola pode ver sua própria escola.
// O middleware authorizeSchoolAccess lida com essa lógica para GET.
// authenticateToken já é aplicado globalmente.
router.get('/:id', authorizeSchoolAccess, (req, res) => { // Adicionado authorizeSchoolAccess
    const id = parseInt(req.params.id, 10);
     if (isNaN(id)) {
        return res.status(400).json({ message: "ID da escola inválido." });
    }
    // req.user já foi validado por authenticateToken e authorizeSchoolAccess
    // authorizeSchoolAccess garante que o acesso é permitido para o req.user.role e req.method
    const sql = "SELECT * FROM escolas WHERE id = ?"; // Pode selecionar colunas específicas se desejar

    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error(`Erro ao buscar escola por ID ${id}:`, err.message);
            return res.status(500).json({ message: 'Erro interno ao buscar escola.' });
        }
        if (!row) {
            // authorizeSchoolAccess já teria retornado 403/401 se o usuário não tivesse permissão
            // para uma escola existente. Se chega aqui e não encontra, é um 404 genuíno.
            return res.status(404).json({ message: 'Escola não encontrada.' });
        }
        res.status(200).json(row);
    });
});

// --- ROTA PUT /api/escolas/:id - Atualizar uma Escola ---
// Admin pode atualizar qualquer escola.
// Escola pode atualizar sua própria escola.
// User (genérico) não pode atualizar.
// O middleware authorizeSchoolAccess lida com essa lógica para PUT.
// authenticateToken já é aplicado globalmente.
router.put('/:id', authorizeSchoolAccess, (req, res) => { // Adicionado authorizeSchoolAccess
    const id = parseInt(req.params.id, 10);
    const { nome, endereco, responsavel } = req.body;

    if (isNaN(id)) {
        return res.status(400).json({ message: "ID da escola inválido." });
    }
    if (!nome || typeof nome !== 'string' || nome.trim() === '') {
        return res.status(400).json({ message: 'O nome da escola é obrigatório e não pode ser vazio.' });
    }
    // authorizeSchoolAccess já garantiu que o usuário tem permissão para modificar esta escola
    // ou é um admin.

    const sql = `UPDATE escolas SET
                    nome = ?,
                    endereco = ?,
                    responsavel = ?,
                    data_modificacao = CURRENT_TIMESTAMP -- Exemplo, se você tiver essa coluna
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
            // Se authorizeSchoolAccess funcionou, isso significa que a escola não foi encontrada
            return res.status(404).json({ message: 'Escola não encontrada para atualização.' });
        }
         console.log(`Escola com ID ${id} atualizada com sucesso pelo usuário ${req.user.username}.`);
         // Para retornar o objeto atualizado, você precisaria de outra query SELECT
         // ou confiar nos dados do request. Por simplicidade, retornamos o que foi enviado (com ID).
         res.status(200).json({
             id: id,
             nome: nome.trim(),
             endereco: endereco || null,
             responsavel: responsavel || null
            });
    });
});

// --- ROTA DELETE /api/escolas/:id - Excluir uma Escola ---
// Apenas Admin pode excluir escolas.
// authenticateToken já é aplicado globalmente.
router.delete('/:id', authorizeAdmin, (req, res) => { // Adicionado authorizeAdmin
    const id = parseInt(req.params.id, 10);

     if (isNaN(id)) {
        return res.status(400).json({ message: "ID da escola inválido." });
    }
    // authorizeAdmin já garantiu que req.user.role === 'admin'

    const sql = 'DELETE FROM escolas WHERE id = ?';

    db.run(sql, [id], function (err) {
        if (err) {
            console.error(`Erro ao excluir escola com ID ${id}:`, err.message);
            // Considere verificar se o erro é por FOREIGN KEY constraint
            // (ex: usuários ou transferências vinculados a esta escola)
            // e retornar uma mensagem mais específica (409 Conflict).
            return res.status(500).json({ message: 'Erro interno ao excluir a escola.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Escola não encontrada para exclusão.' });
        }
        console.log(`Escola com ID ${id} excluída com sucesso pelo admin ${req.user.username}.`);
        res.status(200).json({ message: 'Escola excluída com sucesso.' }); // Ou status 204 No Content
    });
});

module.exports = router;