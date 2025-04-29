// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        console.log('Middleware Auth: Token não fornecido.');
        return res.sendStatus(401); // Se não há token, não autorizado
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Middleware Auth: Token inválido ou expirado.', err.message);
            return res.sendStatus(403); // Token inválido ou expirado
        }
        console.log('Middleware Auth: Token verificado para usuário:', user.username, 'Role:', user.role);
        req.user = user; // Adiciona os dados do usuário decodificados à requisição
        next(); // Passa para a próxima rota/middleware
    });
}

function authorizeAdmin(req, res, next) {
    // Este middleware DEVE rodar DEPOIS de authenticateToken
    if (!req.user) {
         console.log('Middleware Admin: req.user não definido (authenticateToken falhou ou não rodou antes).');
         return res.sendStatus(401); // Não autenticado
    }
    if (req.user.role !== 'admin') {
        console.log(`Middleware Admin: Acesso negado para usuário ${req.user.username}. Role: ${req.user.role}`);
        return res.status(403).json({ error: 'Acesso restrito a administradores.' }); // Não autorizado (Forbidden)
    }
    console.log(`Middleware Admin: Acesso permitido para admin ${req.user.username}.`);
    next(); // Usuário é admin, pode prosseguir
}

module.exports = {
    authenticateToken,
    authorizeAdmin
};