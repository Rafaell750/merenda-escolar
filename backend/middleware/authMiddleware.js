// backend/middleware/authMiddleware.js

/**
 * Visão Geral:
 * Este módulo define middlewares Express para lidar com autenticação e autorização
 * na aplicação. Middlewares são funções que têm acesso aos objetos de requisição (req),
 * resposta (res), e à próxima função de middleware no ciclo de requisição-resposta
 * da aplicação (next).
 *
 * Funcionalidades Principais:
 * 1.  `authenticateToken(req, res, next)`:
 *     - OBJETIVO: Verificar se a requisição contém um token JWT (JSON Web Token) válido
 *       e, se sim, decodificá-lo e adicionar os dados do usuário ao objeto `req.user`.
 *     - FUNCIONAMENTO:
 *         - Extrai o token do cabeçalho `Authorization` (formato "Bearer TOKEN").
 *         - Se não houver token, retorna um status 401 (Unauthorized).
 *         - Se houver token, tenta verificá-lo usando `jwt.verify` e a `JWT_SECRET`
 *           (definida em `process.env.JWT_SECRET`).
 *         - Se a verificação falhar (token inválido ou expirado), retorna 403 (Forbidden).
 *         - Se a verificação for bem-sucedida, o payload do token (contendo dados do usuário
 *           como id, username, role, school_id) é anexado a `req.user`.
 *         - Chama `next()` para passar o controle para o próximo middleware ou rota.
 *     - INTERAÇÃO COM FRONTEND:
 *       - O token JWT é geralmente enviado pelo frontend (ex: `apiService.js`) no cabeçalho
 *         `Authorization` de cada requisição a endpoints protegidos.
 *       - Se o frontend receber um status 401 ou 403, ele deve tratar isso
 *         (ex: redirecionar para login, como feito no interceptor de resposta do `apiService.js`).
 *
 * 2.  `authorizeAdmin(req, res, next)`:
 *     - OBJETIVO: Verificar se o usuário autenticado (cujos dados estão em `req.user`,
 *       preenchido por `authenticateToken`) tem o papel (role) de 'admin'.
 *     - FUNCIONAMENTO:
 *         - DEVE ser usado DEPOIS do middleware `authenticateToken`.
 *         - Se `req.user` não estiver definido (indicando falha na autenticação prévia),
 *           retorna 401.
 *         - Se `req.user.role` não for 'admin', retorna 403 com uma mensagem de erro.
 *         - Se `req.user.role` for 'admin', chama `next()` para permitir o acesso.
 *     - INTERAÇÃO COM FRONTEND:
 *       - Usado em rotas de backend que devem ser acessíveis apenas por administradores
 *         (ex: `POST /api/users/register`, `GET /api/admin/painel`).
 *       - O frontend geralmente controla a visibilidade de links/botões para funcionalidades
 *         de admin com base no papel do usuário logado, mas a proteção no backend é crucial.
 *
 * 3.  `authorizeSchoolAccess(req, res, next)`:
 *     - OBJETIVO: Controlar o acesso a recursos específicos de uma escola, com base no
 *       papel do usuário e, para usuários do tipo 'escola', se eles estão tentando
 *       acessar dados da sua própria escola.
 *     - FUNCIONAMENTO:
 *         - DEVE ser usado DEPOIS de `authenticateToken`.
 *         - Tenta obter o `targetSchoolId` (ID da escola alvo da requisição) a partir de:
 *           `req.params.id`, `req.params.schoolId`, `req.body.escola_id`, ou `req.query.escola_id`.
 *           Isso permite flexibilidade para diferentes tipos de rotas (GET, POST, PUT, etc.).
 *         - Se `targetSchoolId` não for encontrado ou for inválido, retorna 400 (Bad Request).
 *         - PERMISSÕES:
 *             - Se `req.user.role` for 'admin': Acesso permitido a qualquer escola.
 *             - Se `req.user.role` for 'escola': Acesso permitido apenas se `req.user.school_id`
 *               (ID da escola do usuário logado) for igual ao `targetSchoolId`. Caso contrário,
 *               retorna 403.
 *             - Se `req.user.role` for 'user' (usuário padrão da SME):
 *                 - Acesso permitido para requisições `GET` (visualização de dados da escola).
 *                 - Acesso negado (403) para outros métodos (POST, PUT, DELETE).
 *             - Outros papéis: Acesso negado (403).
 *         - Se o acesso for permitido, chama `next()`.
 *     - INTERAÇÃO COM FRONTEND:
 *       - Usado em rotas de backend que manipulam ou retornam dados de uma escola específica
 *         (ex: `GET /api/escolas/:id`, `POST /api/transferencias` onde `escola_id` está no corpo,
 *         `GET /api/transferencias/pendentes/por-escola/:id`).
 *       - O frontend (`EscolaDetalhesView.vue`, modais de estoque) depende dessas permissões
 *         para buscar e modificar dados de escolas.
 *
 * Uso:
 * Estes middlewares são aplicados às rotas no arquivo `server.js` ou nos arquivos
 * de definição de rotas (ex: `escolaRoutes.js`).
 * Exemplo em `server.js`:
 *   `app.use('/api/produtos', authenticateToken, produtoRoutes);`
 *   `app.get('/api/admin/painel', authenticateToken, authorizeAdmin, (req, res) => { ... });`
 * Exemplo em `escolaRoutes.js`:
 *   `router.get('/:id', authenticateToken, authorizeSchoolAccess, getEscolaById);`
 */

const jwt = require('jsonwebtoken'); // Biblioteca para trabalhar com JSON Web Tokens

/**
 * @middleware authenticateToken
 * @description Verifica a validade do token JWT presente no cabeçalho Authorization.
 * Se o token for válido, adiciona os dados do usuário decodificados (payload do token)
 * ao objeto `req.user`. Caso contrário, envia uma resposta de erro (401 ou 403).
 *
 * @param {object} req - Objeto de requisição do Express.
 * @param {object} res - Objeto de resposta do Express.
 * @param {function} next - Função callback para passar o controle para o próximo middleware.
 */
function authenticateToken(req, res, next) {
    // O cabeçalho Authorization geralmente vem no formato "Bearer TOKEN_STRING".
    const authHeader = req.headers['authorization'];
    // Extrai o token da string "Bearer TOKEN_STRING", se o cabeçalho existir.
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        // Se nenhum token for fornecido na requisição.
        console.log('[Middleware Auth]: Token não fornecido na requisição para', req.originalUrl);
        return res.status(401).json({ error: 'Token de autenticação não fornecido.' }); // 401 Unauthorized
    }

    // Verifica o token usando a chave secreta (JWT_SECRET do .env).
    jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
        if (err) {
            // Se houver um erro na verificação (ex: token expirado, assinatura inválida).
            console.log(`[Middleware Auth]: Token inválido ou expirado para ${req.originalUrl}. Erro: ${err.message}`);
            // 403 Forbidden é mais apropriado aqui, pois um token foi fornecido, mas não é válido.
            return res.status(403).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
        }
        // Se o token for válido, o objeto 'userPayload' contém os dados que foram embutidos no token durante o login.
        // Esses dados são então anexados ao objeto `req` para uso posterior nas rotas ou outros middlewares.
        // console.log('[Middleware Auth]: Token verificado com sucesso. Usuário:', userPayload.username, 'Role:', userPayload.role, 'URL:', req.originalUrl);
        req.user = userPayload; // Contém id, username, role, e school_id (se aplicável)
        next(); // Passa o controle para a próxima função no pipeline de middlewares/rotas.
    });
}

/**
 * @middleware authorizeAdmin
 * @description Verifica se o usuário autenticado (identificado por `req.user`)
 * possui o papel (role) de 'admin'. Este middleware DEVE ser usado após `authenticateToken`.
 *
 * @param {object} req - Objeto de requisição do Express (espera-se que `req.user` esteja definido).
 * @param {object} res - Objeto de resposta do Express.
 * @param {function} next - Função callback para passar o controle para o próximo middleware.
 */
function authorizeAdmin(req, res, next) {
    // Verifica se `req.user` foi populado pelo `authenticateToken`.
    if (!req.user) {
         console.log('[Middleware Admin]: Tentativa de autorização de admin sem req.user definido (authenticateToken falhou ou não foi executado antes). URL:', req.originalUrl);
         // Se não houver `req.user`, significa que a autenticação falhou ou não ocorreu.
         return res.status(401).json({ error: 'Não autenticado. Falha ao verificar permissões de administrador.' });
    }

    // Verifica se o papel do usuário é 'admin'.
    if (req.user.role !== 'admin') {
        console.log(`[Middleware Admin]: Acesso negado para usuário ${req.user.username} (Role: ${req.user.role}) à rota ${req.originalUrl}. Acesso restrito a administradores.`);
        return res.status(403).json({ error: 'Acesso restrito a administradores.' }); // 403 Forbidden
    }

    // Se o usuário é admin, permite o prosseguimento.
    // console.log(`[Middleware Admin]: Acesso permitido para admin ${req.user.username} à rota ${req.originalUrl}.`);
    next();
}

/**
 * @middleware authorizeSchoolAccess
 * @description Middleware para autorizar acesso a recursos de uma escola específica.
 * Verifica se o usuário autenticado tem permissão para acessar/modificar dados
 * da escola alvo da requisição.
 * - Admin: acesso total.
 * - Usuário 'escola': acesso apenas à sua própria escola.
 * - Usuário 'user' (SME): acesso GET (visualização) a qualquer escola, mas não pode modificar.
 *
 * @param {object} req - Objeto de requisição do Express.
 * @param {object} res - Objeto de resposta do Express.
 * @param {function} next - Função callback.
 */
function authorizeSchoolAccess(req, res, next) {
    // Garante que o usuário está autenticado (req.user deve existir).
    if (!req.user) {
        console.log('[Middleware School]: Tentativa de autorização de acesso à escola sem req.user definido. URL:', req.originalUrl);
        return res.status(401).json({ error: 'Não autenticado. Falha ao verificar permissões de acesso à escola.' });
    }

    // Tenta extrair o ID da escola alvo da requisição de diferentes fontes:
    // 1. Parâmetros da rota (ex: /escolas/:id ou /escolas/:schoolId)
    // 2. Corpo da requisição (ex: para POST /transferencias com { escola_id: ... })
    // 3. Query string (ex: para GET /transferencias?escola_id=...)
    let targetSchoolId;
    if (req.params.id) { // Comum para GET /recursos/:id
        targetSchoolId = parseInt(req.params.id, 10);
    } else if (req.params.schoolId) { // Nome alternativo para parâmetro de rota
        targetSchoolId = parseInt(req.params.schoolId, 10);
    } else if (req.body && req.body.escola_id !== undefined) { // Para POST/PUT requests
        targetSchoolId = parseInt(req.body.escola_id, 10);
    } else if (req.query && req.query.escola_id !== undefined) { // Para GET requests com query params
        targetSchoolId = parseInt(req.query.escola_id, 10);
    }
    // Adicione mais verificações se o ID da escola puder vir de outras fontes.

    // Valida se o targetSchoolId foi encontrado e é um número.
    if (isNaN(targetSchoolId)) {
        console.log('[Middleware School]: ID da escola alvo inválido ou não fornecido na requisição. URL:', req.originalUrl, 'Params:', req.params, 'Body:', req.body, 'Query:', req.query);
        return res.status(400).json({ error: 'ID da escola alvo da operação é inválido ou não foi fornecido.' });
    }

    // Caso 1: Usuário é 'admin' -> Acesso total permitido.
    if (req.user.role === 'admin') {
        // console.log(`[Middleware School]: Admin ${req.user.username} acessando recursos da escola ${targetSchoolId} na URL ${req.originalUrl}. Acesso permitido.`);
        return next();
    }

    // Caso 2: Usuário é 'escola' -> Só pode acessar sua própria escola.
    if (req.user.role === 'escola') {
        if (req.user.school_id && req.user.school_id === targetSchoolId) {
            // console.log(`[Middleware School]: Usuário ${req.user.username} (Escola ID: ${req.user.school_id}) acessando seus próprios recursos (Escola ${targetSchoolId}) na URL ${req.originalUrl}. Acesso permitido.`);
            return next(); // Acesso permitido
        } else {
            console.log(`[Middleware School]: Acesso NEGADO para usuário ${req.user.username} (Escola ID: ${req.user.school_id}) tentando acessar recursos da escola ${targetSchoolId} na URL ${req.originalUrl}.`);
            return res.status(403).json({ error: 'Acesso não autorizado para os recursos desta escola.' }); // Forbidden
        }
    }

    // Caso 3: Usuário é 'user' (padrão SME) -> Pode visualizar (GET) dados de qualquer escola.
    if (req.user.role === 'user') {
        if (req.method === 'GET') { // Permite apenas requisições GET
            // console.log(`[Middleware School]: Usuário ${req.user.username} (Role: user) realizando GET na escola ${targetSchoolId} (URL: ${req.originalUrl}). Acesso permitido para visualização.`);
            return next();
        } else {
            // Bloqueia outros métodos (POST, PUT, DELETE) para o role 'user' em rotas de escola.
            console.log(`[Middleware School]: Acesso NEGADO para usuário ${req.user.username} (Role: user) tentando realizar ${req.method} na escola ${targetSchoolId} (URL: ${req.originalUrl}).`);
            return res.status(403).json({ error: 'Usuários com perfil "User" podem apenas visualizar dados da escola, não realizar esta ação.' });
        }
    }

    // Fallback: Se o papel não for 'admin', 'escola' ou 'user' (ou se alguma lógica acima falhar em cobrir um caso).
    console.log(`[Middleware School]: Acesso NEGADO para usuário ${req.user.username} (Role: ${req.user.role}) tentando acessar recursos da escola ${targetSchoolId} na URL ${req.originalUrl}. Papel não coberto pelas regras de acesso à escola.`);
    return res.status(403).json({ error: 'Você não tem permissão para acessar os recursos desta escola com seu perfil atual.' });
}

// Exporta os middlewares para serem usados em outros lugares (ex: server.js ou arquivos de rotas).
module.exports = {
    authenticateToken,
    authorizeAdmin,
    authorizeSchoolAccess
};