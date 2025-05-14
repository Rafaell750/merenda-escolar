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

// --- NOVO MIDDLEWARE ---
// Middleware para autorizar acesso a recursos de uma escola específica
// Espera que o ID da escola esteja em req.params.schoolId (ou outra fonte)
function authorizeSchoolAccess(req, res, next) {
    if (!req.user) {
        return res.sendStatus(401); // Não autenticado
    }

// Tentar obter o ID da escola de params, query ou body
let targetSchoolId;
if (req.params.id) {
    targetSchoolId = parseInt(req.params.id, 10);
} else if (req.params.schoolId) { // Outro nome comum para o parâmetro
    targetSchoolId = parseInt(req.params.schoolId, 10);
} else if (req.body && req.body.escola_id) { // Para ações como confirmar recebimento que podem enviar ID no corpo
    targetSchoolId = parseInt(req.body.escola_id, 10);
} else if (req.query && req.query.escola_id) { // Para filtros em GET
    targetSchoolId = parseInt(req.query.escola_id, 10);
}


if (isNaN(targetSchoolId)) {
    console.log('Middleware School: ID da escola inválido ou não fornecido no parâmetro da rota, query ou body.');
    return res.status(400).json({ error: 'ID da escola inválido ou faltando.' });
}

    // Admin tem acesso a tudo
    if (req.user.role === 'admin') {
        console.log(`Middleware School: Admin ${req.user.username} acessando recursos da escola ${targetSchoolId}. Acesso permitido.`);
        return next();
    }

    // Usuário do tipo 'escola' só pode acessar sua própria escola
    if (req.user.role === 'escola') {
        if (req.user.school_id && req.user.school_id === targetSchoolId) {
            console.log(`Middleware School: Usuário ${req.user.username} (Escola ID: ${req.user.school_id}) acessando seus próprios recursos (Escola ${targetSchoolId}). Acesso permitido.`);
            return next(); // Acesso permitido
        } else {
            console.log(`Middleware School: Acesso negado para ${req.user.username} (Escola ID: ${req.user.school_id}) tentando acessar recursos da escola ${targetSchoolId}.`);
            return res.status(403).json({ error: 'Acesso não autorizado para esta escola.' }); // Forbidden
        }
    }

        // Usuário do tipo 'user' pode visualizar (GET) dados de qualquer escola, mas não modificar
        if (req.user.role === 'user') {
            if (req.method === 'GET') {
                console.log(`Middleware School: Usuário ${req.user.username} (Role: user) realizando GET na escola ${targetSchoolId}. Acesso permitido para visualização.`);
                return next(); // Permitir GET para visualização
            } else {
                // Bloquear POST, PUT, DELETE, etc. para 'user'
                console.log(`Middleware School: Acesso negado para ${req.user.username} (Role: user) tentando ${req.method} na escola ${targetSchoolId}.`);
                return res.status(403).json({ error: 'Usuários com perfil "User" podem apenas visualizar dados da escola, não realizar esta ação.' });
            }
        }

    // Outros roles (como 'user' padrão) não têm acesso a rotas específicas de escola
    console.log(`Middleware School: Acesso negado para ${req.user.username} (Role: ${req.user.role}) tentando acessar recursos da escola ${targetSchoolId}.`);
    return res.status(403).json({ error: 'Você não tem permissão para acessar recursos de escolas.' });
}

module.exports = {
    authenticateToken,
    authorizeAdmin,
    authorizeSchoolAccess
};