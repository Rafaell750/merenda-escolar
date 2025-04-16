<template>
  <!-- Adiciona classe dinâmica ao layout raiz (pode ser útil para estilização global) -->
  <div class="app-layout" :class="{ 'sidebar-visible': !isLoginPage, 'sidebar-collapsed': isSidebarCollapsed && !isLoginPage }">

    <!-- RENDERIZAÇÃO CONDICIONAL DA SIDEBAR -->
    <!-- Adiciona classe dinâmica e transição -->
    <div class="sidebar" :class="{ 'collapsed': isSidebarCollapsed }" v-if="!isLoginPage">
      <div class="sidebar-header">
         <div class="logo" :class="{ 'collapsed': isSidebarCollapsed }">
           <!-- Ícone pequeno para quando estiver recolhido -->
           <svg v-if="isSidebarCollapsed" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-box-seam-fill small-logo-icon" viewBox="0 0 16 16">
             <path fill-rule="evenodd" d="M15.528 2.973a.75.75 0 0 1 .472.696v8.662a.75.75 0 0 1-.472.696l-7.25 2.9a.75.75 0 0 1-.557 0l-7.25-2.9A.75.75 0 0 1 0 12.331V3.669a.75.75 0 0 1 .471-.696L7.75.073a.75.75 0 0 1 .5-.001zM10.4 M1.811 4.237v8.166l6.717 2.687 6.718-2.687V4.237L8.53 1.511z"/>
           </svg>
           <!-- Título normal -->
           <h2 v-show="!isSidebarCollapsed">Merenda Escolar</h2>
         </div>
         <!-- Botão de Toggle -->
         <button @click="toggleSidebar" class="toggle-sidebar-btn" title="Recolher/Expandir Menu">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-layout-sidebar-inset" viewBox="0 0 16 16">
             <path d="M14 2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2z"/>
             <path d="M3 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>
           </svg>
         </button>
      </div>

      <nav class="menu">
        <!-- Links do Menu (Painel, Produtos, Movimentacoes) -->
        <router-link to="/" class="menu-item" :class="{ 'active': $route.path === '/' }" title="Painel">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-speedometer2 menu-icon" viewBox="0 0 16 16">
             <!-- path do ícone -->
             <path d="M8 4a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V4.5A.5.5 0 0 1 8 4M3.732 5.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707M2 10a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 10m9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5m.754-4.246a.39.39 0 0 0-.527-.02L7.547 7.31A.91.91 0 1 0 8.85 8.54l3.434-4.297a.39.39 0 0 0-.029-.518z"/>
            <path fill-rule="evenodd" d="M0 10a8 8 0 1 1 15.547 2.661c-.442 1.253-1.845 1.602-2.932 1.25C11.309 13.488 9.475 13 8 13c-1.474 0-3.31.488-4.615.911-1.087.352-2.49.003-2.932-1.25A8 8 0 0 1 0 10m8-7a7 7 0 0 0-6.603 9.329c.203.575.923.876 1.68.63C4.397 12.533 6.358 12 8 12s3.604.532 4.923.96c.757.245 1.477-.056 1.68-.631A7 7 0 0 0 8 3"/>
          </svg>
          <span class="menu-item-text">Painel</span>
        </router-link>

        <router-link to="/produtos" class="menu-item" :class="{ 'active': $route.path === '/produtos' }" title="Produtos">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-box-seam menu-icon" viewBox="0 0 16 16">
             <!-- path do ícone -->
             <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2l-2.218-.887zm3.564 1.426L5.596 5 8 5.961 14.154 3.5l-2.404-.961zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464z"/>
           </svg>
          <span class="menu-item-text">Produtos</span>
        </router-link>

        <!-- Adicionar link para /movimentacoes se existir -->
        <router-link v-if="movimentacoesRouteExists" to="/movimentacoes" class="menu-item" :class="{ 'active': $route.path === '/movimentacoes' }" title="Movimentações">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-arrow-down-up menu-icon" viewBox="0 0 16 16">
               <!-- path do ícone -->
               <path fill-rule="evenodd" d="M11.5 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L11 2.707V14.5a.5.5 0 0 0 .5.5m-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5"/>
           </svg>
          <span class="menu-item-text">Movimentações</span>
        </router-link>

        <!-- Adicionar link para Cadastro de Usuário se for Admin -->
         <router-link v-if="isAdmin" to="/admin/register-user" class="menu-item" :class="{ 'active': $route.name === 'RegisterUser' }" title="Cadastrar Usuário">
              <!-- Ícone de Usuário -->
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-person-plus menu-icon" viewBox="0 0 16 16">
                <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/>
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m1-1a.5.5 0 0 1 .5.5v1h1a.5.5 0 0 1 0 1h-1v1a.5.5 0 0 1-1 0v-1h-1a.5.5 0 0 1 0-1h1v-1a.5.5 0 0 1 .5-.5"/>
                <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0M5.904 8.274c-.025.16-.048.326-.069.494H1.25a.25.25 0 0 0-.25.25v1.5c0 .138.112.25.25.25h4.013c.118.706.305 1.362.573 1.94H1.25a1.25 1.25 0 0 1-1.25-1.25V9.5A1.25 1.25 0 0 1 1.25 8.25zM11 8.25a.25.25 0 0 1 .25.25v1.5c0 .138-.112.25-.25.25h-4.013c-.118.706-.305 1.362-.573 1.94h4.586a1.25 1.25 0 0 0 1.25-1.25V9.5A1.25 1.25 0 0 0 11 8.25z"/>
              </svg>
              <span class="menu-item-text">Cadastrar Usuário</span>
         </router-link>
      </nav>

       <!-- Rodapé do Sidebar -->
       <div class="sidebar-footer">
           <button v-if="!isLoginPage" @click="logout" class="logout-button" title="Sair">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-box-arrow-left menu-icon" viewBox="0 0 16 16">
                 <path fill-rule="evenodd" d="M6 12.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v2a.5.5 0 0 1-1 0v-2A1.5 1.5 0 0 1 6.5 2h8A1.5 1.5 0 0 1 16 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 5 12.5v-2a.5.5 0 0 1 1 0z"/>
                 <path fill-rule="evenodd" d="M.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L1.707 7.5H10.5a.5.5 0 0 1 0 1H1.707l2.147 2.146a.5.5 0 0 1-.708.708z"/>
               </svg>
               <span class="menu-item-text">Sair</span>
           </button>
       </div>
    </div>

    <!-- AJUSTE NA CLASSE DA ÁREA DE CONTEÚDO -->
    <div class="main-content-area" :class="{ 'sidebar-visible': !isLoginPage, 'sidebar-collapsed': isSidebarCollapsed && !isLoginPage, 'login-page': isLoginPage }">
      <router-view v-slot="{ Component }">
        <transition name="fade"> <!-- Removi mode="out-in" para testar, pode voltar se preferir -->
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // Importa useRoute e useRouter

const route = useRoute(); // Hook para acessar a rota atual
const router = useRouter(); // Hook para navegação programática (logout)

const isSidebarCollapsed = ref(false);

// COMPUTED: Verifica se a rota atual é a de Login
const isLoginPage = computed(() => route.name === 'Login');

// COMPUTED: Verifica se o usuário atual é admin (baseado no localStorage)
const isAdmin = computed(() => {
     const userStr = localStorage.getItem('authUser');
     if (!userStr) return false;
     try {
         const user = JSON.parse(userStr);
         return user?.role === 'admin';
     } catch (e) {
         return false;
     }
 });

 // COMPUTED: Verifica se a rota /movimentacoes existe (para renderizar o link)
 const movimentacoesRouteExists = computed(() => {
     // Verifica se existe uma rota definida com o path /movimentacoes
     return router.getRoutes().some(r => r.path === '/movimentacoes');
 });

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

// Função de Logout
const logout = () => {
    console.log("Executando logout...");
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    // Força recarga completa para garantir limpeza de estado e ir para login
    window.location.href = '/login';
    // Ou usar router.push, mas a recarga é mais garantida:
    // router.push({ name: 'Login' }).then(() => { router.go(0); }); // Tenta navegar e recarregar
}

</script>

<style>
/* --- Variáveis CSS Globais --- */
:root {
  --sidebar-width-expanded: 260px;
  --sidebar-width-collapsed: 80px;
  --sidebar-bg-color: #1f2937;
  --sidebar-text-color: #d1d5db;
  --sidebar-hover-bg: #374151;
  --sidebar-active-bg: #4b5563;
  --sidebar-active-border: #34d399;
  --content-bg-color: #f9fafb;
  --header-text-color: #111827;
  --sidebar-transition-duration: 0.3s;
}

/* Reset e estilos globais básicos */
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', sans-serif; background-color: var(--content-bg-color); overflow-x: hidden; color: #374151; }

/* Layout Principal */
.app-layout { display: flex; min-height: 100vh; width: 100vw; overflow: hidden; }

/* --- Estilos da Sidebar --- */
.sidebar {
  width: var(--sidebar-width-expanded);
  background: var(--sidebar-bg-color);
  color: var(--sidebar-text-color);
  min-height: 100vh;
  box-shadow: 3px 0 15px rgba(0, 0, 0, 0.1);
  position: fixed;
  left: 0; top: 0; bottom: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width var(--sidebar-transition-duration) ease-in-out;
}
.sidebar.collapsed { width: var(--sidebar-width-collapsed); }

/* Cabeçalho da Sidebar */
.sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08); min-height: 65px; flex-shrink: 0; }
.logo { display: flex; align-items: center; gap: 0.75rem; overflow: hidden; transition: opacity var(--sidebar-transition-duration) ease; }
.logo.collapsed { justify-content: center; }
.logo h2 { margin: 0; font-size: 1.25rem; font-weight: 600; color: #ffffff; white-space: nowrap; opacity: 1; transition: opacity 0.2s ease, width 0.2s ease; }
.sidebar.collapsed .logo h2 { opacity: 0; width: 0; }
.small-logo-icon { color: #e5e7eb; }

/* Botão de Toggle */
.toggle-sidebar-btn { background: transparent; border: none; color: #9ca3af; cursor: pointer; padding: 0.5rem; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s ease, color 0.2s ease; }
.toggle-sidebar-btn:hover { background-color: rgba(255, 255, 255, 0.1); color: #ffffff; }
.sidebar.collapsed .toggle-sidebar-btn svg { transform: rotate(180deg); transition: transform 0.3s ease; }
.sidebar:not(.collapsed) .toggle-sidebar-btn svg { transform: rotate(0deg); transition: transform 0.3s ease; }

/* Menu e Itens */
.menu { padding: 1rem 0; flex-grow: 1; overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; scrollbar-color: #4b5563 var(--sidebar-bg-color); }
.menu::-webkit-scrollbar { width: 6px; }
.menu::-webkit-scrollbar-track { background: var(--sidebar-bg-color); }
.menu::-webkit-scrollbar-thumb { background-color: #4b5563; border-radius: 3px; }
.menu-item { display: flex; align-items: center; padding: 0.8rem 1.5rem; color: var(--sidebar-text-color); text-decoration: none; margin: 0.2rem 0.5rem; border-radius: 6px; border-left: 4px solid transparent; white-space: nowrap; overflow: hidden; transition: background-color 0.2s ease, color 0.2s ease, padding var(--sidebar-transition-duration) ease-in-out; }
.sidebar.collapsed .menu-item { padding: 0.8rem 0; justify-content: center; margin: 0.2rem 0.5rem; }
.menu-item:hover { background: var(--sidebar-hover-bg); color: #ffffff; }
.menu-item.active { background: var(--sidebar-active-bg); border-left: 4px solid var(--sidebar-active-border); color: #ffffff; font-weight: 500; }
.sidebar.collapsed .menu-item.active { border-left-width: 0; position: relative; }
.sidebar.collapsed .menu-item.active::before { content: ''; position: absolute; left: 5px; top: 50%; transform: translateY(-50%); width: 4px; height: 4px; background-color: var(--sidebar-active-border); border-radius: 50%; }
.menu-icon { flex-shrink: 0; width: 20px; height: 20px; margin-right: 0.9rem; transition: margin-right var(--sidebar-transition-duration) ease-in-out; }
.sidebar.collapsed .menu-icon { margin-right: 0; }
.menu-item-text { opacity: 1; transition: opacity 0.2s ease; margin-left: 0px; }
.sidebar.collapsed .menu-item-text { opacity: 0; width: 0; }

/* Rodapé e Botão de Logout */
.sidebar-footer { padding: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.08); flex-shrink: 0; margin-top: auto; /* Empurra para baixo */ }
.logout-button {
    background: none;
    border: 1px solid #4b5563; /* Borda sutil */
    color: var(--sidebar-text-color);
    padding: 0.5rem 0; /* Padding vertical, sem horizontal para centralizar */
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center; /* Centraliza conteúdo */
    width: 100%; /* Ocupa toda a largura */
    text-align: center;
    transition: all 0.2s ease;
    font-size: 0.9rem;
}
/* Ajusta padding e justificação quando colapsado */
.sidebar.collapsed .logout-button {
    padding: 0.5rem 0;
    justify-content: center;
}
.logout-button:hover { background-color: var(--sidebar-hover-bg); border-color: var(--sidebar-hover-bg); color: #ffffff; }
.logout-button .menu-icon { margin-right: 0.9rem; /* Mantém margem quando expandido */ }
.sidebar.collapsed .logout-button .menu-icon { margin-right: 0; }
.sidebar.collapsed .logout-button .menu-item-text { display: none; /* Esconde texto quando colapsado */ }


/* --- Estilos da Área de Conteúdo Principal --- */
.main-content-area {
  flex: 1;
  background-color: var(--content-bg-color);
  display: flex;
  flex-direction: column;
  padding: 2rem;
  overflow-y: auto;
  min-height: 100vh;
  /* Transição da margem */
  transition: margin-left var(--sidebar-transition-duration) ease-in-out;
  /* Margem padrão quando a sidebar está visível e expandida */
  margin-left: var(--sidebar-width-expanded);
}

/* Ajuste da margem quando a sidebar está visível e colapsada */
.main-content-area.sidebar-visible.sidebar-collapsed {
  margin-left: var(--sidebar-width-collapsed);
}

/* AJUSTE PARA TELA DE LOGIN (Sem sidebar) */
.main-content-area.login-page {
  margin-left: 0; /* Remove a margem esquerda */
  /* Opcional: remover transição para evitar animação ao entrar/sair do login */
  /* transition: none; */
}

/* Animação de Fade para troca de rotas */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }


/* --- Responsividade --- */
/* Forçar recolhimento em telas menores, MAS AINDA ESCONDER NO LOGIN */
@media (max-width: 992px) {
    /* Esconde texto e centraliza ícones quando não está colapsado (mas deveria estar) */
     .sidebar:not(.collapsed) .logo h2,
     .sidebar:not(.collapsed) .menu-item-text { opacity: 0; width: 0; }
     .sidebar:not(.collapsed) .menu-icon { margin-right: 0; }
     .sidebar:not(.collapsed) .menu-item { justify-content: center; padding: 0.8rem 0; }
     /* Esconder botão de toggle para não expandir manualmente */
     .sidebar:not(.collapsed) .toggle-sidebar-btn { display: none; }

     /* Ajusta a margem do conteúdo para a largura colapsada se a sidebar estiver visível */
    .main-content-area.sidebar-visible {
        margin-left: var(--sidebar-width-collapsed);
    }
     /* Garante margem 0 na tela de login */
     .main-content-area.login-page {
        margin-left: 0;
     }
}

@media (max-width: 768px) {
     .main-content-area { padding: 1.5rem; }
     /* Se decidir empilhar em vez de forçar colapso em telas muito pequenas: */
     /* .app-layout { flex-direction: column; } */
     /* .sidebar { position: relative; width: 100%; min-height: auto; } */
     /* .main-content-area { margin-left: 0 !important; } */ /* Remover margem sempre */
}
@media (max-width: 480px) {
    .main-content-area { padding: 1rem; }
}
</style>