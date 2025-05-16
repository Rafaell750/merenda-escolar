// backend/routes/userRoutes.js

/**
 * Visão Geral:
 * Este módulo define as rotas da API para o gerenciamento de usuários.
 * Ele permite o registro de novos usuários (uma ação restrita a administradores)
 * e a listagem de todos os usuários existentes (também restrita a administradores).
 * Utiliza os middlewares `authenticateToken` para garantir que o solicitante esteja
 * autenticado e `authorizeAdmin` para restringir certas operações apenas a usuários
 * com o papel 'admin'.
 *
 * Interação com o Banco de Dados:
 * - A rota de registro (`POST /register`) insere um novo registro na tabela `usuarios`.
 *   - Realiza uma verificação para garantir que o `username` não esteja em uso.
 *   - Se o `role` for 'escola', associa o `school_id` fornecido.
 *   - Opcionalmente, poderia verificar se o `school_id` fornecido corresponde a uma
 *     escola existente antes de inserir.
 * - A rota de listagem (`GET /`) consulta a tabela `usuarios` e faz um `LEFT JOIN`
 *   com a tabela `escolas` para incluir o nome da escola associada, se houver.
 *
 * Interação com o Frontend:
 * - `RegisterUserView.vue` (frontend/src/views/admin/RegisterUserView.vue):
 *   - Utiliza a rota `POST /register` para cadastrar novos usuários. O formulário
 *     nesta view coleta `username`, `password`, `role` e, condicionalmente, `school_id`.
 *   - Utiliza a rota `GET /` para exibir a lista de usuários existentes ao administrador.
 * - `apiService.js` (frontend/src/services/apiService.js):
 *   - Encapsula as chamadas a estes endpoints, incluindo o token de autenticação.
 *
 * Funcionalidades das Rotas:
 * 1.  `POST /register` (Registrar Novo Usuário - Apenas Admin):
 *     - Protegida por `authenticateToken` e `authorizeAdmin`.
 *     - Recebe `username`, `password`, `role` (padrão 'user') e `school_id` (opcional,
 *       obrigatório se `role` for 'escola') no corpo da requisição.
 *     - Valida os dados de entrada (campos obrigatórios, comprimento da senha,
 *       papéis válidos, `school_id` válido se `role` for 'escola').
 *     - Verifica se o `username` já existe. Se sim, retorna 409 (Conflict).
 *     - Gera o hash da senha usando `bcrypt`.
 *     - Insere o novo usuário no banco de dados, incluindo `school_id` se aplicável.
 *     - Retorna os dados básicos do usuário recém-criado (sem o hash da senha) com status 201 (Created).
 *
 * 2.  `GET /` (Listar Usuários - Apenas Admin):
 *     - Protegida por `authenticateToken` e `authorizeAdmin`.
 *     - Busca todos os usuários do banco de dados.
 *     - Inclui o nome da escola associada (se houver) através de um `LEFT JOIN`.
 *     - Ordena os usuários pelo `username`.
 *     - Retorna a lista de usuários (array de objetos).
 *
 * Segurança:
 * - As senhas são armazenadas como hashes usando `bcrypt`.
 * - O acesso às rotas é controlado por autenticação e autorização baseada em papéis.
 */

const express = require('express');
const bcrypt = require('bcrypt'); // Para hashing de senhas
const db = require('../database/dbConnection'); // Conexão com o banco de dados
// Middlewares para autenticação e autorização de admin
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router(); // Cria uma nova instância do roteador do Express

// --- ROTA POST /api/users/register - Registrar um Novo Usuário ---
// Esta rota é protegida e só pode ser acessada por usuários autenticados (`authenticateToken`)
// que também sejam administradores (`authorizeAdmin`).
router.post('/register', authenticateToken, authorizeAdmin, async (req, res) => {
    // Extrai os dados do novo usuário do corpo da requisição.
    // `role` tem 'user' como padrão, e `school_id` tem `null` como padrão.
    const { username, password, role = 'user', school_id = null } = req.body;

    // 1. Validação básica dos dados de entrada.
    if (!username || !password) {
        return res.status(400).json({ error: 'Nome de usuário e senha são obrigatórios.' });
    }
    if (password.length < 6) { // Requisito de comprimento mínimo para a senha.
       return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    }
    // Valida se o `role` fornecido é um dos permitidos.
    if (!['admin', 'user', 'escola'].includes(role)) {
        return res.status(400).json({ error: 'Papel (role) inválido. Valores permitidos são "admin", "user" ou "escola".' });
    }

    // 2. Validação específica para o `role` 'escola'.
    let finalSchoolId = null; // Variável para armazenar o ID da escola validado.
    if (role === 'escola') {
        if (!school_id) { // Se o papel é 'escola', `school_id` é obrigatório.
            return res.status(400).json({ error: 'Para o papel "escola", é obrigatório fornecer o ID da escola (school_id).' });
        }
        // Tenta converter `school_id` para número e verifica se é válido.
        const parsedSchoolId = parseInt(school_id, 10);
        if (isNaN(parsedSchoolId) || parsedSchoolId <= 0) {
             return res.status(400).json({ error: 'O ID da escola fornecido é inválido (deve ser um número positivo).' });
        }
        finalSchoolId = parsedSchoolId;

        // Opcional, mas recomendado: Verificar se a escola com `finalSchoolId` realmente existe.
        // Esta verificação pode ser feita aqui antes de tentar inserir o usuário.
        // Exemplo:
        // const checkSchoolExistsSql = "SELECT id FROM escolas WHERE id = ?";
        // db.get(checkSchoolExistsSql, [finalSchoolId], (err, schoolRow) => {
        //     if (err) { /* Tratar erro de DB */ }
        //     if (!schoolRow) {
        //         return res.status(400).json({ error: `A escola com ID ${finalSchoolId} não foi encontrada.` });
        //     }
        //     // Prosseguir com a criação do usuário se a escola existir...
        // });
        // Por simplicidade, a verificação de chave estrangeira no INSERT tratará isso,
        // mas uma verificação explícita aqui daria um erro mais amigável.
    } else {
        // Se o papel não for 'escola', `school_id` deve ser NULL no banco.
        finalSchoolId = null;
    }

    // 3. Verificar se o nome de usuário já está em uso.
    const checkUserSql = "SELECT id FROM usuarios WHERE username = ?";
    db.get(checkUserSql, [username], async (err, existingUser) => {
        if (err) {
            console.error("[POST /users/register] Erro no banco de dados ao verificar usuário existente:", err.message);
            return res.status(500).json({ error: 'Erro interno do servidor ao verificar a disponibilidade do nome de usuário.' });
        }
        if (existingUser) { // Se o usuário já existe.
            console.log(`[POST /users/register] Tentativa de registrar usuário com username já existente: "${username}"`);
            return res.status(409).json({ error: 'Este nome de usuário já está em uso. Por favor, escolha outro.' }); // 409 Conflict
        }

        // 4. Usuário não existe, prosseguir com o hashing da senha e inserção.
        try {
            const saltRounds = 10; // Custo do algoritmo de hashing.
            const hashedPassword = await bcrypt.hash(password, saltRounds); // Gera o hash da senha.

            // SQL para inserir o novo usuário, incluindo `school_id`.
            const insertSql = `
                INSERT INTO usuarios (username, password_hash, role, school_id)
                VALUES (?, ?, ?, ?)
            `;
            // Executa a inserção.
            db.run(insertSql, [username, hashedPassword, role, finalSchoolId], function(insertErr) {
                if (insertErr) {
                    console.error('[POST /users/register] Erro ao inserir novo usuário no banco:', insertErr.message);
                    // Verifica especificamente erro de chave estrangeira (se `finalSchoolId` não corresponder a uma escola existente).
                     if (insertErr.message.includes('FOREIGN KEY constraint failed')) {
                         return res.status(400).json({ error: `Erro ao cadastrar usuário: A escola com ID ${finalSchoolId} não existe ou é inválida.` });
                     }
                    return res.status(500).json({ error: 'Erro interno do servidor ao cadastrar o usuário.' });
                }
                // Usuário cadastrado com sucesso.
                const newUserId = this.lastID;
                console.log(`[POST /users/register] Usuário "${username}" (ID: ${newUserId}, Role: ${role}${role === 'escola' ? ', School ID: ' + finalSchoolId : ''}) cadastrado com sucesso pelo admin ${req.user.username}.`);

                // Prepara o objeto do usuário criado para retornar na resposta (sem a senha!).
                 const createdUser = {
                     id: newUserId,
                     username: username,
                     role: role,
                     // Inclui `school_id` na resposta apenas se o papel for 'escola'.
                     ...(role === 'escola' && { school_id: finalSchoolId })
                 };
                res.status(201).json(createdUser); // 201 Created
            });
        } catch (hashError) {
            // Se houver erro durante o hashing da senha.
            console.error("[POST /users/register] Erro ao gerar hash da senha:", hashError);
            return res.status(500).json({ error: 'Erro interno durante o processo de cadastro (hashing).' });
        }
    });
});


// --- ROTA GET /api/users - Listar Todos os Usuários ---
// Protegida por `authenticateToken` e `authorizeAdmin`. Apenas administradores podem listar usuários.
router.get('/', authenticateToken, authorizeAdmin, (req, res) => {
    // SQL para buscar todos os usuários e fazer um LEFT JOIN com a tabela `escolas`
    // para obter o nome da escola associada, se houver (`school_name`).
    const sql = `
        SELECT
            u.id,
            u.username,
            u.role,
            u.data_cadastro,
            u.school_id,
            e.nome as school_name -- Nome da escola associada
        FROM usuarios u
        LEFT JOIN escolas e ON u.school_id = e.id -- LEFT JOIN para incluir usuários mesmo que não tenham escola associada
        ORDER BY u.username ASC -- Ordena por nome de usuário
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("[GET /api/users] Erro ao buscar lista de usuários:", err.message);
            return res.status(500).json({ error: 'Erro interno do servidor ao buscar usuários.'});
        }
        // Mapeia os resultados para garantir que `school_name` seja `null` se não houver escola,
        // em vez de `undefined`, para consistência na resposta JSON.
        const usersWithSchoolName = rows.map(user => ({
            ...user,
            school_name: user.school_name || null
        }));
        res.json(usersWithSchoolName); // Retorna a lista de usuários.
    });
});

// TODO: Adicionar rotas para ATUALIZAR e EXCLUIR usuários, se necessário.
// Essas rotas também precisariam de `authenticateToken` e `authorizeAdmin`.
// Exemplo (PUT /api/users/:id):
// router.put('/:id', authenticateToken, authorizeAdmin, (req, res) => { ... });
// Exemplo (DELETE /api/users/:id):
// router.delete('/:id', authenticateToken, authorizeAdmin, (req, res) => { ... });

module.exports = router; // Exporta o roteador.