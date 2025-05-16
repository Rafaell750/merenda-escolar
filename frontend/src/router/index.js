// /frontend/src/router/index.js

/**
 * Visão Geral:
 * Este arquivo configura o roteador Vue (Vue Router) para a aplicação.
 * Ele define todas as rotas, associa componentes a essas rotas e implementa
 * "navigation guards" (guardas de navegação) para controlar o acesso às rotas
 * com base no estado de autenticação e no papel (role) do usuário.
 *
 * Funcionalidades Principais:
 * 1.  CRIAÇÃO DO ROTEADOR:
 *     - Utiliza `createRouter` e `createWebHistory` do Vue Router.
 *     - `createWebHistory` habilita o modo de histórico HTML5 (URLs limpas sem '#').
 * 2.  DEFINIÇÃO DE ROTAS:
 *     - Um array `routes` define cada rota da aplicação, incluindo:
 *         - `path`: O caminho da URL.
 *         - `name`: Um nome único para a rota (útil para navegação programática).
 *         - `component`: O componente Vue a ser renderizado para essa rota.
 *         - `props`: (Opcional) Se `true`, os parâmetros da rota (ex: `:id`) são passados
 *           como props para o componente.
 *         - `meta`: Um objeto para armazenar metadados da rota, como:
 *             - `requiresAuth` (boolean): Indica se a rota requer autenticação.
 *             - `allowedRoles` (Array<string>): Lista de papéis permitidos para acessar a rota.
 *             - `requiresAdmin` (boolean): Indica se a rota requer privilégios de administrador.
 *             - `requiresSchoolAccess` (boolean): Indica que a rota é relacionada a uma escola
 *               e requer verificação de acesso específico (admin pode ver todas,
 *               usuário 'escola' só pode ver a sua, usuário 'user' pode ver todas para visualização).
 * 3.  ROTAS PÚBLICAS E PROTEGIDAS:
 *     - Rotas como `/login` são públicas.
 *     - A maioria das outras rotas (`/`, `/produtos`, `/escolas/:id`, etc.) são protegidas
 *       e requerem autenticação e, em alguns casos, papéis específicos.
 * 4.  ROTAS DINÂMICAS:
 *     - A rota `/escolas/:id` é dinâmica, onde `:id` é um parâmetro que representa o ID da escola.
 * 5.  ROTAS DE UTILIDADE:
 *     - `/unauthorized`: Para usuários que tentam acessar recursos sem permissão.
 *     - `/:pathMatch(.*)*`: Rota "catch-all" para URLs não encontradas (NotFoundView).
 * 6.  FUNÇÃO HELPER `getCurrentUser()`:
 *     - Obtém e parseia os dados do usuário logado do `localStorage`.
 *     - Retorna o objeto do usuário ou `null` se não estiver logado ou se houver erro.
 * 7.  GUARDA DE NAVEGAÇÃO (`router.beforeEach`):
 *     - Este é o principal mecanismo de controle de acesso. É executado antes de cada
 *       navegação.
 *     - Lógica de verificação:
 *         - Se a rota requer autenticação e o usuário não está logado, redireciona para `/login`.
 *         - Se o usuário está logado e tenta acessar `/login`, redireciona para uma página
 *           apropriada com base no seu papel (Painel ou sua página de escola).
 *         - Se a rota requer privilégios de admin e o usuário não é admin, redireciona
 *           para `/unauthorized` ou para sua página de escola se for usuário 'escola'.
 *         - Se a rota tem `allowedRoles` e o papel do usuário não está na lista, redireciona
 *           para `/unauthorized` ou sua página de escola.
 *         - Se a rota `requiresSchoolAccess`:
 *             - Admin pode acessar qualquer rota de escola.
 *             - Usuário 'escola' só pode acessar a rota correspondente ao ID da sua própria escola.
 *               Se tentar acessar outra, é redirecionado para a sua.
 *             - Usuário 'user' (padrão SME) pode acessar qualquer página de escola para visualização.
 *             - Outros papéis (futuros) são bloqueados.
 *         - Se um usuário 'escola' tentar acessar uma rota genérica (que não seja a página da sua escola),
 *           ele é redirecionado para a página da sua escola.
 *     - Se todas as verificações passarem, a navegação é permitida (`next()`).
 *
 * Estrutura das Definições de Rota (Exemplo):
 *   {
 *     path: '/caminho-da-rota',
 *     name: 'NomeDaRota',
 *     component: ComponenteView,
 *     meta: { requiresAuth: true, allowedRoles: ['admin', 'user'] }
 *   }
 */

import { createRouter, createWebHistory } from 'vue-router';

// --- BLOCO 1: IMPORTAÇÃO DOS COMPONENTES DE VIEW ---
// Cada componente aqui representa uma "página" da aplicação.
import LoginView from '../views/LoginView.vue';
import PainelControleView from '../views/Escolas/PainelControleView.vue'; // Renomeado de HomeView no exemplo anterior
import ProdutosView from '../views/Produtos/ProdutosView.vue';
import RegisterUserView from '../views/admin/RegisterUserView.vue'; // Caminho conforme o pedido original
import EscolaDetalhesView from '../views/Escolas/EscolaDetalhesView.vue';
import UnauthorizedView from '../views/UnauthorizedView.vue';
import NotFoundView from '../views/NotFoundView.vue'; // Componente para páginas não encontradas

// --- BLOCO 2: FUNÇÃO HELPER PARA OBTER DADOS DO USUÁRIO LOGADO ---
/**
 * @function getCurrentUser
 * @description Obtém os dados do usuário autenticado do localStorage.
 * @returns {object|null} O objeto do usuário parseado ou null se não houver usuário
 *                        ou ocorrer um erro no parse.
 * O objeto do usuário deve conter `id`, `username`, `role`, e `school_id` se `role === 'escola'`.
 */
function getCurrentUser() {
    const userStr = localStorage.getItem('authUser');
    if (!userStr) {
        // console.log('[Router Guard Helper] Nenhum usuário encontrado no localStorage.');
        return null;
    }
    try {
        const user = JSON.parse(userStr);
        // console.log('[Router Guard Helper] Usuário encontrado:', user);
        return user;
    } catch (e) {
        console.error('[Router Guard Helper] Erro ao parsear usuário do localStorage:', e);
        // Em caso de erro no parse, é prudente limpar os dados inválidos.
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken'); // Pode ser uma boa ideia limpar o token também.
        return null;
    }
}

// --- BLOCO 3: DEFINIÇÃO DAS ROTAS DA APLICAÇÃO ---
const routes = [
    // --- ROTAS PÚBLICAS --- (Não requerem autenticação)
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
      meta: { requiresAuth: false } // `requiresAuth: false` indica que é pública
    },

    // --- ROTAS PROTEGIDAS --- (Requerem autenticação e, possivelmente, papéis específicos)
    {
      path: '/', // Rota raiz
      name: 'PainelControle', // Painel de controle geral para Admin e Usuário padrão (SME)
      component: PainelControleView,
      meta: {
          requiresAuth: true,                // Requer autenticação
          allowedRoles: ['admin', 'user']    // Apenas admin e user (SME) podem acessar
      }
    },
    {
      path: '/produtos',
      name: 'Produtos', // Gestão de produtos para Admin e Usuário padrão (SME)
      component: ProdutosView,
      meta: {
          requiresAuth: true,
          allowedRoles: ['admin', 'user']
      }
    },

    // --- ROTAS DE ESCOLA (DINÂMICAS COM PARÂMETRO :id) ---
    {
      path: '/escolas/:id', // O parâmetro `:id` captura o ID da escola da URL
      name: 'EscolaDetalhes',
      component: EscolaDetalhesView,
      props: true, // Permite que o parâmetro `:id` seja passado como prop para o componente
      meta: {
          requiresAuth: true,
          requiresSchoolAccess: true // Flag especial para lógica de acesso a escolas no guard
      }
    },
    // Exemplo de outra rota específica de escola (se necessário no futuro):
    // {
    //   path: '/escolas/:id/estoque',
    //   name: 'SchoolInventory',
    //   component: () => import('../views/school/SchoolInventoryView.vue'), // Lazy loading para esta rota
    //   props: true,
    //   meta: { requiresAuth: true, requiresSchoolAccess: true }
    // },

    // --- ROTAS DE ADMINISTRAÇÃO ---
    {
      path: '/admin/register-user',
      name: 'RegisterUser', // Cadastro de novos usuários
      component: RegisterUserView,
      meta: {
          requiresAuth: true,
          requiresAdmin: true // Flag que indica que APENAS 'admin' pode acessar
      }
    },

    // --- ROTAS DE UTILIDADE ---
    {
      path: '/unauthorized', // Página para acesso não autorizado
      name: 'Unauthorized',
      component: UnauthorizedView,
      meta: { requiresAuth: false } // Pública, mas geralmente acessada por redirecionamento
    },
    {
      path: '/:pathMatch(.*)*', // Rota "catch-all" para URLs não encontradas
      name: 'NotFound',
      component: NotFoundView,
      meta: { requiresAuth: false }
    }
];

// --- BLOCO 4: CRIAÇÃO DA INSTÂNCIA DO ROTEADOR ---
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // Modo de histórico HTML5
  routes // Array de definições de rotas
});

// --- BLOCO 5: GUARDA DE NAVEGAÇÃO GLOBAL (NAVIGATION GUARD) ---
// `beforeEach` é executado antes de cada transição de rota.
router.beforeEach((to, from, next) => {
  const user = getCurrentUser(); // Obtém o usuário atual do localStorage
  const loggedIn = !!user;       // Boolean: true se o usuário estiver logado
  const userRole = user?.role;   // Papel do usuário (admin, escola, user)
  // ID da escola associada ao usuário, se o papel for 'escola'.
  // É crucial que o backend retorne `school_id` no objeto do usuário durante o login
  // e que isso seja armazenado no 'authUser' no localStorage.
  const userAssociatedSchoolId = user?.school_id;

  // Metadados da rota de destino (`to`)
  const requiresAuth = to.meta.requiresAuth;
  const requiresAdmin = to.meta.requiresAdmin;
  const allowedRoles = to.meta.allowedRoles;
  const requiresSchoolAccess = to.meta.requiresSchoolAccess;

  // Logs para depuração (podem ser removidos em produção)
  // console.log(`[Router Guard] Navegando de ${from.path} para: ${to.path}`);
  // console.log(`[Router Guard] Meta da rota destino: Auth=${requiresAuth}, Admin=${requiresAdmin}, Roles=${allowedRoles}, SchoolAccess=${requiresSchoolAccess}`);
  // console.log(`[Router Guard] Estado do usuário: Logado=${loggedIn}, Role=${userRole}, UserSchoolId=${userAssociatedSchoolId}`);

  // 1. ROTA REQUER AUTENTICAÇÃO, MAS USUÁRIO NÃO ESTÁ LOGADO
  if (requiresAuth && !loggedIn) {
    // console.log('[Router Guard] Acesso negado: Rota requer login. Redirecionando para /login.');
    // Redireciona para a página de login, incluindo a URL original na query `redirect`
    // para que o usuário possa ser redirecionado de volta após o login.
    return next({ name: 'Login', query: { redirect: to.fullPath } });
  }

  // 2. USUÁRIO LOGADO TENTANDO ACESSAR ROTA PÚBLICA (EX: /login)
  if (!requiresAuth && loggedIn && to.name === 'Login') {
    //   console.log('[Router Guard] Usuário logado tentando acessar /login. Redirecionando para página inicial apropriada.');
      // Redireciona para uma página inicial baseada no papel do usuário.
      if (userRole === 'admin' || userRole === 'user') {
          return next({ name: 'PainelControle' }); // Admin e User padrão vão para o painel
      } else if (userRole === 'escola' && userAssociatedSchoolId) {
          // Usuário 'escola' vai para a página de detalhes da SUA escola.
          return next({ name: 'EscolaDetalhes', params: { id: userAssociatedSchoolId } });
      } else {
          // Fallback genérico se o papel for 'escola' mas não tiver ID associado (situação anômala)
          // ou para outros papéis futuros não previstos.
          return next({ name: 'PainelControle' });
      }
  }

  // --- VERIFICAÇÕES ADICIONAIS PARA USUÁRIOS JÁ LOGADOS ---
  if (loggedIn) {
    // 3. ROTA REQUER PRIVILÉGIOS DE ADMIN
    if (requiresAdmin && userRole !== 'admin') {
      // console.warn(`[Router Guard] Acesso negado: Rota ${to.path} requer Admin. Usuário é ${userRole}.`);
      // Se for um usuário 'escola' tentando acessar rota de admin, redireciona para sua escola.
      if (userRole === 'escola' && userAssociatedSchoolId) {
        return next({ name: 'EscolaDetalhes', params: { id: userAssociatedSchoolId } });
      }
      // Outros papéis (ex: 'user' padrão) são redirecionados para 'Unauthorized'.
      return next({ name: 'Unauthorized' });
    }

    // 4. ROTA TEM `allowedRoles` DEFINIDO, E O PAPEL DO USUÁRIO NÃO ESTÁ NA LISTA
    if (allowedRoles && !allowedRoles.includes(userRole)) {
    //    console.warn(`[Router Guard] Acesso negado: Role '${userRole}' não está em allowedRoles [${allowedRoles.join(', ')}] para a rota ${to.path}.`);
       // Se for um usuário 'escola' tentando acessar rota não permitida, redireciona para sua escola.
       if (userRole === 'escola' && userAssociatedSchoolId) {
           return next({ name: 'EscolaDetalhes', params: { id: userAssociatedSchoolId } });
       } else {
           // Outros papéis são redirecionados para 'Unauthorized'.
           return next({ name: 'Unauthorized' });
       }
    }

    // 5. ROTA REQUER ACESSO ESPECÍFICO A UMA ESCOLA (`requiresSchoolAccess`)
    if (requiresSchoolAccess) {
      // 5.1. ADMIN: Pode acessar qualquer rota de escola.
      if (userRole === 'admin') {
        // console.log(`[Router Guard] Acesso de Admin à rota de escola ${to.path} (ID: ${to.params.id}). Permitido.`);
        return next(); // Permite acesso
      }
      // 5.2. USUÁRIO 'ESCOLA': Só pode acessar a página da SUA escola.
      else if (userRole === 'escola' && userAssociatedSchoolId) {
        const targetSchoolRouteParamId = parseInt(to.params.id, 10); // ID da escola da URL

        if (isNaN(targetSchoolRouteParamId)) {
            //  console.error(`[Router Guard] ID da escola inválido na URL da rota ${to.path}: ${to.params.id}. Redirecionando para NotFound.`);
             return next({ name: 'NotFound' }); // Se o ID na URL for inválido.
        }

        if (targetSchoolRouteParamId === userAssociatedSchoolId) {
        //   console.log(`[Router Guard] Usuário 'escola' ${user.username} acessando SUA escola (ID: ${targetSchoolRouteParamId}). Permitido.`);
          return next(); // Permite acesso à sua própria escola
        } else {
        //   console.warn(`[Router Guard] Acesso negado: Usuário 'escola' ${user.username} (Escola ID ${userAssociatedSchoolId}) tentando acessar escola ID ${targetSchoolRouteParamId}. Redirecionando para sua escola.`);
          // Redireciona para a página da sua própria escola se tentar acessar outra.
          return next({ name: 'EscolaDetalhes', params: { id: userAssociatedSchoolId } });
        }
      }
      // 5.3. USUÁRIO 'USER' (PADRÃO SME): PODE ACESSAR QUALQUER página de escola para visualização.
      else if (userRole === 'user') {
        // console.log(`[Router Guard] Usuário padrão (SME) '${user.username}' acessando rota de escola ${to.path} (ID: ${to.params.id}). Permitido para visualização.`);
        return next(); // Permite acesso
      }
      // 5.4. OUTROS PAPÉIS: Bloqueados de rotas de escola.
      else {
        // console.warn(`[Router Guard] Acesso negado: Role '${userRole}' não pode acessar rotas de escola. Redirecionando para /unauthorized.`);
        return next({ name: 'Unauthorized' });
      }
    }

    // 6. VERIFICAÇÃO ADICIONAL PARA USUÁRIO 'ESCOLA' EM ROTAS GENÉRICAS
    // Se um usuário 'escola' está logado e tenta acessar uma rota que NÃO é `requiresSchoolAccess`
    // e NÃO é a página de detalhes da sua própria escola, redireciona-o para a página da sua escola.
    // Isso evita que usuários 'escola' fiquem em rotas genéricas como '/' ou '/produtos'.
    if (userRole === 'escola' && !requiresSchoolAccess && to.name !== 'EscolaDetalhes') {
      if (userAssociatedSchoolId) {
        //   console.log(`[Router Guard] Usuário 'escola' em rota genérica (${to.path}). Redirecionando para sua escola (ID: ${userAssociatedSchoolId}).`);
          return next({ name: 'EscolaDetalhes', params: { id: userAssociatedSchoolId } });
      } else {
          // Se for 'escola' mas não tiver ID associado (anomalia), vai para 'Unauthorized'.
        //   console.warn(`[Router Guard] Usuário 'escola' sem ID associado em rota genérica (${to.path}). Redirecionando para /unauthorized.`);
          return next({ name: 'Unauthorized' });
      }
    }
  } // Fim das verificações para usuários LOGADOS

  // Se nenhuma das condições anteriores foi atendida, permite a navegação.
  // console.log('[Router Guard] Acesso permitido para a rota: ' + to.path);
  next();
});

// --- BLOCO 6: EXPORTAÇÃO DA INSTÂNCIA DO ROTEADOR ---
export default router;