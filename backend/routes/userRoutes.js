// backend/routes/userRoutes.js
const bcrypt = require('bcrypt');
const db = require('../database/dbConnection');
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Rota para registrar um novo usuário (APENAS ADMIN)
router.post('/register', authenticateToken, authorizeAdmin, async (req, res) => {
    // Adicionar school_id ao destructuring
    const { username, password, role = 'user', school_id = null } = req.body;

    // Validação básica
    if (!username || !password) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }
    if (password.length < 6) {
       return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    }
    // Permitir o novo role 'escola'
    if (!['admin', 'user', 'escola'].includes(role)) {
        return res.status(400).json({ error: 'Role inválida. Use "admin", "user" ou "escola".' });
    }

    // Validação específica para o role 'escola'
    let finalSchoolId = null;
    if (role === 'escola') {
        if (!school_id) {
            return res.status(400).json({ error: 'Para o role "escola", é obrigatório fornecer o ID da escola (school_id).' });
        }
        // Tentar converter para número e validar
        const parsedSchoolId = parseInt(school_id, 10);
        if (isNaN(parsedSchoolId) || parsedSchoolId <= 0) {
             return res.status(400).json({ error: 'O ID da escola fornecido é inválido.' });
        }
        finalSchoolId = parsedSchoolId;
        // Opcional: Verificar se a escola realmente existe no banco antes de inserir
        // db.get("SELECT id FROM escolas WHERE id = ?", [finalSchoolId], (err, school) => { ... });
    } else {
        // Se o role não for 'escola', garantir que school_id seja NULL no banco
        finalSchoolId = null;
    }

    // Verificar se usuário já existe
    const checkUserSql = "SELECT id FROM usuarios WHERE username = ?";
    db.get(checkUserSql, [username], async (err, existingUser) => {
        if (err) {
            console.error("Erro no DB ao verificar usuário existente:", err.message);
            return res.status(500).json({ error: 'Erro interno ao verificar usuário.' });
        }
        if (existingUser) {
            return res.status(409).json({ error: 'Nome de usuário já está em uso.' });
        }

        // Usuário não existe, hashear senha e inserir
        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Atualizar SQL para incluir school_id
            const insertSql = `
                INSERT INTO usuarios (username, password_hash, role, school_id)
                VALUES (?, ?, ?, ?)
            `;
            // Passar finalSchoolId como quarto parâmetro
            db.run(insertSql, [username, hashedPassword, role, finalSchoolId], function(insertErr) {
                if (insertErr) {
                    console.error('Erro ao inserir novo usuário:', insertErr.message);
                    // Verificar erro de chave estrangeira (escola inválida)
                     if (insertErr.message.includes('FOREIGN KEY constraint failed')) {
                         return res.status(400).json({ error: `Erro: A escola com ID ${finalSchoolId} não existe.` });
                     }
                    return res.status(500).json({ error: 'Erro interno ao cadastrar usuário.' });
                }
                console.log(`Usuário ${username} (role: ${role}${role === 'escola' ? ', school_id: ' + finalSchoolId : ''}) cadastrado com sucesso pelo admin ${req.user.username}. ID: ${this.lastID}`);

                // Retornar dados básicos do usuário criado (sem a senha!)
                 const createdUser = {
                     id: this.lastID,
                     username: username,
                     role: role,
                     // Incluir school_id se for usuário escola
                     ...(role === 'escola' && { school_id: finalSchoolId })
                 };
                res.status(201).json(createdUser);
            });
        } catch (hashError) {
            console.error("Erro ao gerar hash da senha:", hashError);
            return res.status(500).json({ error: 'Erro interno durante o cadastro.' });
        }
    });
});


// GET /api/users (protegido para admin) - Listar usuários
router.get('/', authenticateToken, authorizeAdmin, (req, res) => {
    // Fazer JOIN com a tabela escolas para pegar o nome da escola
    const sql = `
        SELECT
            u.id,
            u.username,
            u.role,
            u.data_cadastro,
            u.school_id,
            e.nome as school_name -- Pegar o nome da escola
        FROM usuarios u
        LEFT JOIN escolas e ON u.school_id = e.id -- LEFT JOIN para incluir usuários sem escola
        ORDER BY u.username
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Erro ao buscar usuários:", err.message);
            return res.status(500).json({ error: 'Erro interno ao buscar usuários.'});
        }
        // Opcional: Mapear para garantir que school_name seja null se não houver escola
        const usersWithSchoolName = rows.map(user => ({
            ...user,
            school_name: user.school_name || null // Garante null em vez de undefined
        }));
        res.json(usersWithSchoolName);
    });
});


module.exports = router;