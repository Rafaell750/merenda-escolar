// backend/routes/authRoutes.js

/**
 * Visão Geral:
 * Este módulo define as rotas relacionadas à autenticação de usuários na API.
 * Atualmente, ele implementa a rota de login (`POST /api/auth/login`).
 * Utiliza `bcrypt` para comparar senhas (hash) e `jsonwebtoken` para gerar
 * tokens JWT (JSON Web Tokens) após uma autenticação bem-sucedida.
 *
 * Interação com o Banco de Dados:
 * - A rota de login consulta a tabela `usuarios` para encontrar um usuário
 *   pelo `username` fornecido e, em seguida, compara o hash da senha.
 *
 * Interação com o Frontend:
 * - `LoginView.vue`: Envia uma requisição POST para `/api/auth/login` com
 *   `username` e `password` no corpo da requisição.
 *   - Em caso de sucesso, o frontend recebe um `accessToken` (JWT) e um objeto `user`
 *     (contendo id, username, role, e school_id se aplicável), que são armazenados
 *     no `localStorage` para autenticar requisições subsequentes e para controle
 *     de UI baseado no papel do usuário.
 *   - Em caso de falha (usuário não encontrado, senha incorreta, erro no servidor),
 *     o frontend recebe um status de erro apropriado (400, 401, 500) e uma mensagem
 *     de erro em JSON, que é exibida para o usuário.
 *
 * Funcionalidades da Rota de Login (`POST /login`):
 * 1.  RECEBIMENTO DE CREDENCIAIS:
 *     - Espera `username` e `password` no corpo da requisição (`req.body`).
 *     - Valida se ambos os campos foram fornecidos; caso contrário, retorna 400 (Bad Request).
 * 2.  CONSULTA AO BANCO DE DADOS:
 *     - Busca na tabela `usuarios` por um usuário com o `username` fornecido.
 *     - Se houver erro na consulta, retorna 500 (Internal Server Error).
 *     - Se o usuário não for encontrado, retorna 401 (Unauthorized) com uma mensagem genérica
 *       de "Credenciais inválidas" para não revelar se o usuário existe ou não.
 * 3.  VERIFICAÇÃO DE SENHA:
 *     - Se o usuário for encontrado, compara a senha fornecida com o `password_hash`
 *       armazenado no banco usando `bcrypt.compare`.
 *     - Se a comparação falhar (senha incorreta), retorna 401 com "Credenciais inválidas".
 *     - Se houver erro durante a comparação de senhas, retorna 500.
 * 4.  GERAÇÃO DE TOKEN JWT:
 *     - Se a senha corresponder, um token JWT é gerado.
 *     - O payload do token (`userPayload`) inclui `id`, `username` e `role` do usuário.
 *       Se o `role` for 'escola', o `school_id` também é incluído no payload.
 *     - O token é assinado com a `JWT_SECRET` (do `process.env.JWT_SECRET`) e tem um
 *       tempo de expiração configurado (ex: '2h').
 * 5.  RESPOSTA DE SUCESSO:
 *     - Retorna um JSON contendo o `accessToken` e o objeto `userPayload` (com os dados
 *       básicos do usuário, excluindo o hash da senha).
 *
 * Segurança:
 * - As senhas são comparadas usando `bcrypt`, que é seguro contra ataques de força bruta
 *   e rainbow tables, pois compara hashes.
 * - O token JWT permite que o frontend faça requisições autenticadas sem reenviar
 *   as credenciais a cada vez. A `JWT_SECRET` deve ser mantida em segredo.
 * - A expiração do token ajuda a mitigar os riscos caso um token seja comprometido.
 */

const express = require('express');
const bcrypt = require('bcrypt'); // Biblioteca para hashing e comparação de senhas
const jwt = require('jsonwebtoken'); // Biblioteca para criar e verificar JSON Web Tokens
const db = require('../database/dbConnection'); // Conexão com o banco de dados SQLite

const router = express.Router(); // Cria uma nova instância do roteador do Express

// --- ROTA DE LOGIN (POST /api/auth/login) ---
/**
 * @route POST /login
 * @description Autentica um usuário com base no nome de usuário e senha.
 *              Se as credenciais forem válidas, retorna um token JWT e informações básicas do usuário.
 * @param {object} req - Objeto de requisição do Express. Espera `username` e `password` no `req.body`.
 * @param {object} res - Objeto de resposta do Express.
 * @returns {object} JSON com `accessToken` e `user` em caso de sucesso, ou um objeto de erro.
 */
router.post('/login', (req, res) => {
    // Extrai username e password do corpo da requisição.
    const { username, password } = req.body;

    // 1. Validação básica dos campos de entrada.
    if (!username || !password) {
        // Se username ou password não forem fornecidos, retorna um erro 400 (Bad Request).
        console.log('[Auth Route - /login]: Tentativa de login com campos faltando.');
        return res.status(400).json({ error: 'Nome de usuário e senha são obrigatórios.' });
    }

    // 2. Consulta ao banco de dados para encontrar o usuário.
    // Seleciona campos importantes, incluindo o hash da senha, papel e ID da escola.
    const sql = "SELECT id, username, password_hash, role, school_id FROM usuarios WHERE username = ?";
    db.get(sql, [username], async (err, user) => { // `db.get` busca uma única linha
        if (err) {
            // Se ocorrer um erro durante a consulta ao banco.
            console.error("[Auth Route - /login]: Erro no banco de dados ao buscar usuário:", err.message);
            return res.status(500).json({ error: 'Erro interno do servidor ao processar o login.' });
        }
        if (!user) {
            // Se nenhum usuário for encontrado com o username fornecido.
            // É uma boa prática de segurança retornar uma mensagem genérica para não indicar se o usuário existe.
            console.log(`[Auth Route - /login]: Tentativa de login falhou. Usuário "${username}" não encontrado.`);
            return res.status(401).json({ error: 'Credenciais inválidas.' }); // 401 Unauthorized
        }

        // 3. Usuário encontrado, agora compara a senha fornecida com o hash armazenado.
        try {
            // `bcrypt.compare` compara a senha em texto plano com o hash.
            const match = await bcrypt.compare(password, user.password_hash);
            if (match) {
                // Senha correta!
                console.log(`[Auth Route - /login]: Login bem-sucedido para o usuário: ${user.username} (Role: ${user.role}).`);

                // 4. Prepara o payload do token JWT com informações essenciais do usuário.
                // Não inclua informações sensíveis como o hash da senha no token.
                const userPayload = {
                    id: user.id,
                    username: user.username,
                    role: user.role
                    // `school_id` é adicionado condicionalmente abaixo
                };

                // Adiciona `school_id` ao payload APENAS se o papel do usuário for 'escola'.
                // Isso é importante para que o frontend e outros middlewares possam usar essa informação.
                if (user.role === 'escola') {
                    userPayload.school_id = user.school_id;
                }

                // 5. Gera o token JWT.
                const accessToken = jwt.sign(
                    userPayload, // Dados a serem incluídos no token (payload)
                    process.env.JWT_SECRET, // Chave secreta para assinar o token (deve estar no .env)
                    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' } // Tempo de expiração do token (ex: '1h', '2d')
                );

                // 6. Retorna o token e os dados básicos do usuário.
                res.json({
                    accessToken: accessToken,
                    user: userPayload // Enviar os dados do usuário (sem o hash da senha) para o frontend
                });
            } else {
                // Senha incorreta.
                console.log(`[Auth Route - /login]: Tentativa de login falhou. Senha incorreta para o usuário "${username}".`);
                return res.status(401).json({ error: 'Credenciais inválidas.' }); // 401 Unauthorized
            }
        } catch (compareError) {
            // Se ocorrer um erro durante a comparação das senhas (ex: problema com bcrypt).
            console.error("[Auth Route - /login]: Erro ao comparar senhas:", compareError);
            return res.status(500).json({ error: 'Erro interno do servidor ao verificar a senha.' });
        }
    });
});

// Exporta o roteador para ser usado no arquivo principal do servidor (server.js).
module.exports = router;