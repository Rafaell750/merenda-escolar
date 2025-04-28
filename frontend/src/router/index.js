// /frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue'; // Importar Login
import RegisterUserView from '../views/admin/RegisterUserView.vue'; // Importar Cadastro
import EscolaDetalhesView from '../views/Escolas/EscolaDetalhesView.vue'; // <<< NOVO

// --- Função Helper para verificar Auth (exemplo com localStorage) ---
function isAuthenticated() {
  return !!localStorage.getItem('authToken'); // Verifica se o token existe
}

function getUserRole() {
    const userStr = localStorage.getItem('authUser');
    if (!userStr) return null;
    try {
        const user = JSON.parse(userStr);
        return user?.role;
    } catch (e) {
        return null;
    }
}



const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'painelControle',
      component: () => import('../views/Escolas/PainelControleView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/produtos', // Rota para a nova view
      name: 'produtos',
      component: () => import('../views/Produtos/ProdutosView.vue'), // Aponta para o novo componente
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
      meta: { requiresGuest: true } // Para redirecionar se já estiver logado
    },
    {
      path: '/escolas/:id', // Rota dinâmica para cada escola
      name: 'EscolaDetalhes',
      component: EscolaDetalhesView,
      props: true, // Passa o :id como prop para o componente
      meta: { requiresAuth: true }
    },
     // --- Rota de Não Autorizado (opcional mas recomendado) ---
     {
        path: '/unauthorized',
        name: 'Unauthorized',
        component: () => import('../views/UnauthorizedView.vue') // Crie esta view simples
     },
    {
      path: '/admin/register-user', // Rota de cadastro
      name: 'RegisterUser',
      component: RegisterUserView,
      meta: {
          requiresAuth: true, // Precisa estar logado
          requiresAdmin: true // Precisa ser admin
      }
    }
  ]
});

// --- Navigation Guard (Controle de Acesso) ---
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest);
  const loggedIn = isAuthenticated();
  const isAdmin = getUserRole() === 'admin';

  console.log(`Navegando para: ${to.path}, Requer Auth: ${requiresAuth}, Requer Admin: ${requiresAdmin}, Logado: ${loggedIn}, É Admin: ${isAdmin}`);


  if (requiresAuth && !loggedIn) {
    console.log('Guard: Redirecionando para /login (requer auth, não logado)');
    next({ name: 'Login' }); // Redireciona para login se rota protegida e não logado
  } else if (requiresAdmin && !isAdmin) {
      console.log('Guard: Redirecionando para /unauthorized (requer admin, não é admin)');
      // Redireciona para uma página 'Não autorizado' ou para o painel
      next({ name: 'Unauthorized' }); // Ou next({ name: 'Painel' });
  } else if (requiresGuest && loggedIn) {
      console.log('Guard: Redirecionando para / (rota de guest, já logado)');
      next({ name: 'Painel' }); // Se tentar acessar login/register já logado, vai para o painel
  }
  else {
    console.log('Guard: Acesso permitido.');
    next(); // Permite a navegação
  }
});

export default router;