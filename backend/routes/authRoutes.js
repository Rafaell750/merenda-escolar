// backend/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/dbConnection'); // Supondo que você exporte 'db' de um arquivo central

const router = express.Router();

// Rota de Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }

    const sql = "SELECT * FROM usuarios WHERE username = ?";
    db.get(sql, [username], async (err, user) => {
        if (err) {
            console.error("Erro no DB ao buscar usuário:", err.message);
            return res.status(500).json({ error: 'Erro interno do servidor.' });
        }
        if (!user) {
            console.log(`Tentativa de login falhou: Usuário "${username}" não encontrado.`);
            return res.status(401).json({ error: 'Credenciais inválidas.' }); // Usuário não encontrado
        }

        // Usuário encontrado, comparar a senha
        try {
            const match = await bcrypt.compare(password, user.password_hash);
            if (match) {
                // Senha correta! Gerar JWT
                console.log(`Login bem-sucedido para: ${user.username}`);
                const userPayload = {
                    id: user.id,
                    username: user.username,
                    role: user.role
                };
                const accessToken = jwt.sign(
                    userPayload,
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' } // Token expira em 1 hora (ajuste conforme necessário)
                );
                res.json({
                    accessToken: accessToken,
                    user: userPayload // Envia dados básicos do usuário também
                 });
            } else {
                console.log(`Tentativa de login falhou: Senha incorreta para "${username}".`);
                return res.status(401).json({ error: 'Credenciais inválidas.' }); // Senha incorreta
            }
        } catch (compareError) {
            console.error("Erro ao comparar senhas:", compareError);
            return res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    });
});

module.exports = router;