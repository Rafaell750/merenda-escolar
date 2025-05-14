// /frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';

// --- Importe suas Views ---
import LoginView from '../views/LoginView.vue';
import PainelControleView from '../views/Escolas/PainelControleView.vue';
import ProdutosView from '../views/Produtos/ProdutosView.vue';
import RegisterUserView from '../views/admin/RegisterUserView.vue';
import EscolaDetalhesView from '../views/Escolas/EscolaDetalhesView.vue';
import UnauthorizedView from '../views/UnauthorizedView.vue';
import NotFoundView from '../views/NotFoundView.vue'; // Certifique-se que este arquivo existe e tem conteúdo

// --- Funções Helper para obter dados do usuário (Exemplo com localStorage) ---
function getCurrentUser() {
    const userStr = localStorage.getItem('authUser');
    if (!userStr) {
        // console.log('[Auth Helper] Nenhum usuário encontrado no localStorage.');
        return null;
    }
    try {
        const user = JSON.parse(userStr);
        // console.log('[Auth Helper] Usuário encontrado:', user);
        return user; // Deve ter id, username, role, e school_id se role === 'escola'
    } catch (e) {
        console.error('[Auth Helper] Erro ao parsear usuário do localStorage:', e);
        return null;
    }
}

// --- Definição das Rotas com Meta atualizado ---
const routes = [
    // --- Rotas Públicas ---
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
      meta: { requiresAuth: false }
    },

    // --- Rotas Protegidas ---
    {
      path: '/',
      name: 'PainelControle', // Painel geral para Admin e User padrão
      component: PainelControleView,
      meta: {
          requiresAuth: true,
          allowedRoles: ['admin', 'user']
      }
    },
    {
      path: '/produtos',
      name: 'Produtos', // Lista geral de produtos para Admin e User padrão
      component: ProdutosView,
      meta: {
          requiresAuth: true,
          allowedRoles: ['admin', 'user']
      }
    },

    // --- Rotas de Escola (Usando :id como parâmetro) ---
    {
      path: '/escolas/:id', // << Parâmetro é :id
      name: 'EscolaDetalhes',
      component: EscolaDetalhesView,
      props: true, // Passa :id como prop para o componente EscolaDetalhesView
      meta: {
          requiresAuth: true,
          requiresSchoolAccess: true // Indica que a verificação de escola é necessária
      }
    },
    // Se você tiver outras rotas específicas de escola, elas também usarão :id
    // Exemplo:
    // {
    //   path: '/escolas/:id/estoque',
    //   name: 'SchoolInventory',
    //   component: () => import('../views/school/SchoolInventoryView.vue'), // Crie esta view
    //   props: true,
    //   meta: { requiresAuth: true, requiresSchoolAccess: true }
    // },

    // --- Rotas de Admin ---
    {
      path: '/admin/register-user',
      name: 'RegisterUser',
      component: RegisterUserView,
      meta: {
          requiresAuth: true,
          requiresAdmin: true // APENAS Admin
      }
    },

    // --- Rotas de Utilidade ---
    {
      path: '/unauthorized',
      name: 'Unauthorized',
      component: UnauthorizedView,
      meta: { requiresAuth: false }
    },
    {
      path: '/:pathMatch(.*)*', // Catch-all para Página Não Encontrada
      name: 'NotFound',
      component: NotFoundView,
      meta: { requiresAuth: false }
    }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// --- Navigation Guard (Controle de Acesso Refinado) ---
router.beforeEach((to, from, next) => {
  const user = getCurrentUser();
  const loggedIn = !!user;
  const userRole = user?.role;
  // Se o usuário 'escola' tiver school_id no objeto user, pegue-o.
  // No seu backend, ao fazer login, certifique-se de que o campo que armazena o ID da escola associada
  // ao usuário 'escola' é retornado e armazenado no objeto 'authUser' no localStorage.
  // Vamos assumir que este campo é `school_id` no objeto user.
  const userAssociatedSchoolId = user?.school_id;

  const requiresAuth = to.meta.requiresAuth;
  const requiresAdmin = to.meta.requiresAdmin;
  const allowedRoles = to.meta.allowedRoles;
  const requiresSchoolAccess = to.meta.requiresSchoolAccess;

  // console.log(`[Guard] Navegando para: ${to.path}`);
  // console.log(`[Guard] Meta: Auth=${requiresAuth}, Admin=${requiresAdmin}, Roles=${allowedRoles}, SchoolAccess=${requiresSchoolAccess}`);
  // console.log(`[Guard] Usuário: Logado=${loggedIn}, Role=${userRole}, UserSchoolId=${userAssociatedSchoolId}`);

  // 1. Rota requer autenticação, mas usuário não está logado
  if (requiresAuth && !loggedIn) {
    // console.log('[Guard] Acesso negado: Requer login.');
    return next({ name: 'Login', query: { redirect: to.fullPath } });
  }

  // 2. Usuário logado tentando acessar rota pública (como /login) - Redirecionar
  if (!requiresAuth && loggedIn && to.name === 'Login') {
    //   console.log('[Guard] Usuário logado tentando acessar /login. Redirecionando...');
      if (userRole === 'admin' || userRole === 'user') {
          return next({ name: 'PainelControle' });
      } else if (userRole === 'escola' && userAssociatedSchoolId) {
          // Redireciona usuário escola para a página da SUA escola
          return next({ name: 'EscolaDetalhes', params: { id: userAssociatedSchoolId } }); // << Usa :id
      } else {
          return next({ name: 'PainelControle' }); // Fallback genérico
      }
  }

  // --- Verificações para usuários LOGADOS ---
  if (loggedIn) {
    // 3. Rota de Admin
    if (requiresAdmin && userRole !== 'admin') {
      if (userRole === 'escola' && userAssociatedSchoolId) {
        return next({ name: 'EscolaDetalhes', params: { id: userAssociatedSchoolId } });
      }
      return next({ name: 'Unauthorized' });
    }

    // 4. Rota tem roles permitidos, mas role do usuário não está na lista
    if (allowedRoles && !allowedRoles.includes(userRole)) {
    //    console.warn(`[Guard] Acesso negado: Role '${userRole}' não permitido. Rota: ${to.path}`);
       if (userRole === 'escola' && userAssociatedSchoolId) {
           return next({ name: 'EscolaDetalhes', params: { id: userAssociatedSchoolId } }); // << Usa :id
       } else {
           return next({ name: 'Unauthorized' });
       }
    }

    // 5. Rota requer acesso específico de escola
    if (requiresSchoolAccess) {
      // 5.1 Admin pode acessar qualquer rota de escola
      if (userRole === 'admin') {
        // console.log(`[Guard] Acesso de Admin à rota de escola ${to.path}. Permitido.`);
        return next();
      }
      // 5.2 Usuário 'escola' só pode acessar a SUA escola
      else if (userRole === 'escola' && userAssociatedSchoolId) {
        const targetSchoolRouteParamId = parseInt(to.params.id, 10); // << Pega :id da URL

        if (isNaN(targetSchoolRouteParamId)) {
            //  console.error(`[Guard] ID da escola inválido na URL: ${to.params.id}`);
             return next({ name: 'NotFound' }); // Certifique-se que 'NotFound' existe
        }

        if (targetSchoolRouteParamId === userAssociatedSchoolId) {
        //   console.log(`[Guard] Usuário escola ${user.username} acessando SUA escola (${targetSchoolRouteParamId}). Permitido.`);
          return next();
        } else {
        //   console.warn(`[Guard] Acesso negado: Usuário escola ${user.username} (Escola ${userAssociatedSchoolId}) tentando acessar escola ${targetSchoolRouteParamId}. Redirecionando.`);
          return next({ name: 'EscolaDetalhes', params: { id: userAssociatedSchoolId } }); // << Usa :id
        }
      }
      // 5.3 <<<< NOVA CONDIÇÃO: Usuário 'user' (padrão) PODE ACESSAR QUALQUER página de escola (para visualização) >>>>
      else if (userRole === 'user') {
        // console.log(`[Guard] Standard User '${user.username}' accessing school route ${to.path}. Allowed for viewing.`);
        return next(); // Permite acesso para visualização
      }
      // 5.4 Outros roles (se houver algum no futuro) são bloqueados
      else {
        // console.warn(`[Guard] Redirect: /unauthorized (Role '${userRole}' cannot access school routes)`);
        return next({ name: 'Unauthorized' });
      }
    }
  // 6. Verificação final para 'escola' em rotas genéricas (para garantir que não fiquem lá)
  if (userRole === 'escola' && !requiresSchoolAccess && to.name !== 'EscolaDetalhes') {
    if (userAssociatedSchoolId) {
        return next({ name: 'EscolaDetalhes', params: { id: userAssociatedSchoolId } });
    } else {
        return next({ name: 'Unauthorized' });
    }
}
}

  // Se passou por todas as verificações, permite a navegação
  // console.log('[Guard] Acesso permitido.');
  next();
});

export default router;