// /frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'painelControle',
      component: () => import('../views/PainelControleView.vue')
    },
    {
      path: '/produtos', // Rota para a nova view
      name: 'produtos',
      component: () => import('../views/ProdutosView.vue') // Aponta para o novo componente
    }
  ]
});

export default router;