// backend/routes/userRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../database/dbConnection'); // Supondo export de 'db'
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Rota para registrar um novo usuário (APENAS ADMIN)
// Note a ordem: primeiro autentica, depois verifica se é admin
router.post('/register', authenticateToken, authorizeAdmin, async (req, res) => {
    const { username, password, role = 'user' } = req.body; // Default role é 'user'

    // Validação básica
    if (!username || !password) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }
    if (password.length < 6) { // Exemplo de regra de senha
       return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    }
    if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Role inválida. Use "admin" ou "user".' });
    }

    // Verificar se usuário já existe
    const checkUserSql = "SELECT id FROM usuarios WHERE username = ?";
    db.get(checkUserSql, [username], async (err, existingUser) => {
        if (err) {
            console.error("Erro no DB ao verificar usuário existente:", err.message);
            return res.status(500).json({ error: 'Erro interno ao verificar usuário.' });
        }
        if (existingUser) {
            return res.status(409).json({ error: 'Nome de usuário já está em uso.' }); // Conflict
        }

        // Usuário não existe, hashear senha e inserir
        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const insertSql = `
                INSERT INTO usuarios (username, password_hash, role)
                VALUES (?, ?, ?)
            `;
            // Usar function() para ter acesso ao 'this' (lastID)
            db.run(insertSql, [username, hashedPassword, role], function(insertErr) {
                if (insertErr) {
                    console.error('Erro ao inserir novo usuário:', insertErr.message);
                    return res.status(500).json({ error: 'Erro interno ao cadastrar usuário.' });
                }
                console.log(`Usuário ${username} (role: ${role}) cadastrado com sucesso pelo admin ${req.user.username}. ID: ${this.lastID}`);
                // Retornar dados básicos do usuário criado (sem a senha!)
                res.status(201).json({
                    id: this.lastID,
                    username: username,
                    role: role
                });
            });
        } catch (hashError) {
            console.error("Erro ao gerar hash da senha:", hashError);
            return res.status(500).json({ error: 'Erro interno durante o cadastro.' });
        }
    });
});


// Adicione outras rotas de usuário aqui se necessário (ex: listar usuários para admin)
// Exemplo: GET /api/users (protegido para admin)
router.get('/', authenticateToken, authorizeAdmin, (req, res) => {
    const sql = "SELECT id, username, role, data_cadastro FROM usuarios ORDER BY username";
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Erro ao buscar usuários:", err.message);
            return res.status(500).json({ error: 'Erro interno ao buscar usuários.'});
        }
        res.json(rows);
    });
});


module.exports = router;