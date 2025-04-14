<!-- /frontend/src/App.vue-->
<template>
  <!-- Adiciona classe dinâmica ao layout raiz -->
  <div class="app-layout" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">

    <!-- Adiciona classe dinâmica e transição -->
    <div class="sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
      <div class="sidebar-header">
         <div class="logo" :class="{ 'collapsed': isSidebarCollapsed }">
           <!-- Ícone pequeno para quando estiver recolhido (opcional) -->
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
        <!-- Link para o Painel de Controle -->
        <router-link to="/" class="menu-item" :class="{ 'active': $route.path === '/' }" title="Painel">
          <!-- Ícone Painel -->
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-speedometer2 menu-icon" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V4.5A.5.5 0 0 1 8 4M3.732 5.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707M2 10a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 10m9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5m.754-4.246a.39.39 0 0 0-.527-.02L7.547 7.31A.91.91 0 1 0 8.85 8.54l3.434-4.297a.39.39 0 0 0-.029-.518z"/>
            <path fill-rule="evenodd" d="M0 10a8 8 0 1 1 15.547 2.661c-.442 1.253-1.845 1.602-2.932 1.25C11.309 13.488 9.475 13 8 13c-1.474 0-3.31.488-4.615.911-1.087.352-2.49.003-2.932-1.25A8 8 0 0 1 0 10m8-7a7 7 0 0 0-6.603 9.329c.203.575.923.876 1.68.63C4.397 12.533 6.358 12 8 12s3.604.532 4.923.96c.757.245 1.477-.056 1.68-.631A7 7 0 0 0 8 3"/>
          </svg>
          <span class="menu-item-text">Painel</span>
        </router-link>

        <router-link to="/produtos" class="menu-item" :class="{ 'active': $route.path === '/produtos' }" title="Produtos">
          <!-- Ícone Produtos -->
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-box-seam menu-icon" viewBox="0 0 16 16">
            <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2l-2.218-.887zm3.564 1.426L5.596 5 8 5.961 14.154 3.5l-2.404-.961zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464z"/>
          </svg>
          <span class="menu-item-text">Produtos</span>
        </router-link>

        <router-link to="/movimentacoes" class="menu-item" :class="{ 'active': $route.path === '/movimentacoes' }" title="Movimentações">
           <!-- Ícone Movimentações -->
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-arrow-down-up menu-icon" viewBox="0 0 16 16">
             <path fill-rule="evenodd" d="M11.5 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L11 2.707V14.5a.5.5 0 0 0 .5.5m-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5"/>
           </svg>
          <span class="menu-item-text">Movimentações</span>
        </router-link>
        <!-- Adicione outros links de menu aqui com seus ícones -->
      </nav>

       <!-- (Opcional) Rodapé do Sidebar -->
       <div class="sidebar-footer">
         <!-- Pode adicionar info do usuário, botão de logout, etc. -->
       </div>
    </div>

    <!-- Adiciona classe dinâmica à área de conteúdo -->
    <div class="main-content-area" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <router-view v-slot="{ Component }">
  <transition name="fade"> <!-- Remova mode="out-in" -->
    <component :is="Component" />
  </transition>
</router-view>
</div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isSidebarCollapsed = ref(false); // Começa expandido

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};
</script>

<style>
/* --- Variáveis CSS Globais --- */
:root {
  --sidebar-width-expanded: 260px; /* Um pouco mais largo */
  --sidebar-width-collapsed: 80px;  /* Largura quando recolhido */
  --sidebar-bg-color: #1f2937;     /* Cor de fundo mais escura */
  --sidebar-text-color: #d1d5db;   /* Cor do texto padrão */
  --sidebar-hover-bg: #374151;    /* Fundo do item no hover */
  --sidebar-active-bg: #4b5563;    /* Fundo do item ativo */
  --sidebar-active-border: #34d399; /* Cor da borda ativa (verde esmeralda) */
  --content-bg-color: #f9fafb;    /* Fundo do conteúdo mais claro */
  --header-text-color: #111827;   /* Cor do título principal */
  --sidebar-transition-duration: 0.3s;
}

/* Reset e estilos globais básicos */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; /* Fonte moderna */
  background-color: var(--content-bg-color);
  overflow-x: hidden;
  color: #374151; /* Cor de texto padrão do body */
}

/* Layout Principal */
.app-layout {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  overflow: hidden;
  /* Transição para o padding/margin da área de conteúdo */
  transition: padding-left var(--sidebar-transition-duration) ease-in-out;
}

/* --- Estilos da Sidebar --- */
.sidebar {
  width: var(--sidebar-width-expanded);
  background: var(--sidebar-bg-color);
  color: var(--sidebar-text-color);
  min-height: 100vh;
  box-shadow: 3px 0 15px rgba(0, 0, 0, 0.1);
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Esconde conteúdo que transborda durante a transição */
  /* Transição de largura */
  transition: width var(--sidebar-transition-duration) ease-in-out;
}

.sidebar.collapsed {
  width: var(--sidebar-width-collapsed);
}

/* Cabeçalho da Sidebar */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Espaça logo e botão */
  padding: 1rem 1.25rem; /* Padding ajustado */
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  min-height: 65px; /* Altura mínima para consistência */
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem; /* Espaço entre ícone e texto */
  overflow: hidden; /* Essencial para esconder o texto na transição */
  transition: opacity var(--sidebar-transition-duration) ease;
}
.logo.collapsed {
   justify-content: center; /* Centraliza o ícone pequeno quando recolhido */
}

.logo h2 {
  margin: 0;
  font-size: 1.25rem; /* Tamanho ajustado */
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap; /* Impede quebra de linha */
  opacity: 1;
  transition: opacity 0.2s ease, width 0.2s ease; /* Transição suave do texto */
}
.sidebar.collapsed .logo h2 {
  opacity: 0;
  width: 0; /* Some com o texto */
}
.small-logo-icon {
    color: #e5e7eb;
}


/* Botão de Toggle */
.toggle-sidebar-btn {
  background: transparent;
  border: none;
  color: #9ca3af; /* Cinza claro */
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.toggle-sidebar-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}
/* Rotação suave do ícone (opcional) */
.sidebar.collapsed .toggle-sidebar-btn svg {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}
.sidebar:not(.collapsed) .toggle-sidebar-btn svg {
  transform: rotate(0deg);
  transition: transform 0.3s ease;
}

/* Menu e Itens */
.menu {
  padding: 1rem 0;
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden; /* Esconde scroll horizontal se houver */
  /* Estilização da barra de scroll (opcional, webkit) */
    scrollbar-width: thin;
    scrollbar-color: #4b5563 var(--sidebar-bg-color);
}
.menu::-webkit-scrollbar {
  width: 6px;
}
.menu::-webkit-scrollbar-track {
  background: var(--sidebar-bg-color);
}
.menu::-webkit-scrollbar-thumb {
  background-color: #4b5563;
  border-radius: 3px;
}

.menu-item {
  display: flex;
  align-items: center;
  /* Padding ajustado para acomodar ícone e texto */
  padding: 0.8rem 1.5rem; /* Padding padrão (expandido) */
  color: var(--sidebar-text-color);
  text-decoration: none;
  margin: 0.2rem 0.5rem; /* Margem lateral para espaçamento e borda */
  border-radius: 6px; /* Bordas arredondadas */
  border-left: 4px solid transparent; /* Remove borda esquerda antiga */
  white-space: nowrap; /* Impede quebra de linha */
  overflow: hidden; /* Esconde texto durante a transição */
  transition: background-color 0.2s ease, color 0.2s ease, padding var(--sidebar-transition-duration) ease-in-out;
}
.sidebar.collapsed .menu-item {
    /* Centraliza o ícone quando recolhido */
    padding: 0.8rem 0; /* Remove padding lateral, mantém vertical */
    justify-content: center;
    margin: 0.2rem 0.5rem;
}

.menu-item:hover {
  background: var(--sidebar-hover-bg);
  color: #ffffff;
}

.menu-item.active {
  background: var(--sidebar-active-bg);
  /* Borda superior/inferior ou lateral sutil para indicar ativo */
  border-left: 4px solid var(--sidebar-active-border);
  color: #ffffff;
  font-weight: 500;
}
/* Ajuste da borda ativa quando recolhido */
.sidebar.collapsed .menu-item.active {
    border-left-width: 0; /* Remove borda lateral */
    /* Adiciona uma borda sutil no topo ou fundo se desejar */
     position: relative; /* Para pseudo-elemento */
}
/* Exemplo de indicador ativo diferente quando recolhido */
.sidebar.collapsed .menu-item.active::before {
    content: '';
    position: absolute;
    left: 5px;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 4px;
    background-color: var(--sidebar-active-border);
    border-radius: 50%;
}


.menu-icon {
  flex-shrink: 0; /* Impede que o ícone encolha */
  width: 20px;
  height: 20px;
  /* Margem à direita quando expandido */
  margin-right: 0.9rem;
  transition: margin-right var(--sidebar-transition-duration) ease-in-out;
}
.sidebar.collapsed .menu-icon {
  margin-right: 0; /* Remove margem quando recolhido */
}

.menu-item-text {
  opacity: 1;
  transition: opacity 0.2s ease;
  margin-left: 0px; /* Reset margin-left */
}
.sidebar.collapsed .menu-item-text {
  opacity: 0;
  width: 0; /* Some com o texto */
}


/* Rodapé (opcional) */
.sidebar-footer {
    padding: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
}

/* --- Estilos da Área de Conteúdo Principal --- */
.main-content-area {
  flex: 1;
  /* Margin inicial (expandido) */
  margin-left: var(--sidebar-width-expanded);
  background-color: var(--content-bg-color);
  display: flex;
  flex-direction: column;
  /* Remover centralização daqui, aplicar às views se necessário */
  /* justify-content: center; */
  /* align-items: center; */
  padding: 2rem; /* Padding geral */
  overflow-y: auto; /* Permite scroll no conteúdo */
  min-height: 100vh;
  /* Transição da margem */
  transition: margin-left var(--sidebar-transition-duration) ease-in-out;
}

.main-content-area.sidebar-collapsed {
  /* Margin quando recolhido */
  margin-left: var(--sidebar-width-collapsed);
}

/* Animação de Fade para troca de rotas */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}


/* --- Responsividade (Simplificada) --- */
/* Em telas menores, forçar sidebar recolhida ou mudar layout */
@media (max-width: 992px) { /* Ajuste o breakpoint conforme necessário */
    /* Forçar recolhimento */
    .sidebar:not(.collapsed) {
        width: var(--sidebar-width-collapsed);
    }
     .sidebar:not(.collapsed) .logo h2,
     .sidebar:not(.collapsed) .menu-item-text {
        opacity: 0;
        width: 0;
     }
     .sidebar:not(.collapsed) .menu-icon {
        margin-right: 0;
     }
     .sidebar:not(.collapsed) .menu-item {
         justify-content: center;
         padding: 0.8rem 0;
     }
      .sidebar:not(.collapsed) .toggle-sidebar-btn {
          /* Esconder ou desabilitar botão se não quiser que expanda */
          /* display: none; */
      }


    .main-content-area:not(.sidebar-collapsed) {
        margin-left: var(--sidebar-width-collapsed);
    }
     /* Esconder o botão de toggle para não permitir expansão manual */
     /* .toggle-sidebar-btn { display: none; } */

     /* Remover a classe dinâmica do app-layout para não ter efeito */
     /* .app-layout { transition: none; } */

     /* OU: Voltar ao comportamento anterior de empilhar */
     /* .sidebar { width: 100%; position: relative; min-height: auto; } */
     /* .app-layout { flex-direction: column; } */
     /* .main-content-area { margin-left: 0; } */
     /* .menu { display: flex; overflow-x: auto; } ... etc */
}

@media (max-width: 768px) {
     /* Manter forçado recolhido ou empilhar (decidir estratégia) */
     .main-content-area {
         padding: 1.5rem;
     }
}

@media (max-width: 480px) {
    .main-content-area {
      padding: 1rem;
    }
}

</style>