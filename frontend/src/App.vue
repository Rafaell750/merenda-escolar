<!--
  /frontend/src/App.vue

  Visão Geral:
  Este é o componente raiz da aplicação Vue.js. Ele define o layout principal,
  incluindo a barra lateral de navegação (sidebar) e a área de conteúdo onde
  as diferentes visualizações (rotas) são renderizadas. A sidebar é condicionalmente
  exibida e seu conteúdo varia de acordo com o tipo de usuário logado (admin, escola, user padrão).

  Funcionalidades Principais:
  1.  LAYOUT RESPONSIVO:
      - Implementa um layout com uma sidebar à esquerda e uma área de conteúdo principal à direita.
      - A sidebar pode ser recolhida/expandida.
      - A sidebar é ocultada na página de login.
  2.  BARRA LATERAL (SIDEBAR):
      - Cabeçalho com o logo da aplicação e um botão para recolher/expandir.
      - Menu de navegação principal com links (`<router-link>`).
      - Os links do menu são exibidos condicionalmente com base no papel (role) do usuário logado:
          - 'admin': Acesso a Painel, Produtos, Movimentações (se rota existir), lista de todas as Escolas Cadastradas, Cadastro de Usuário.
          - 'user' (padrão): Acesso a Painel, Produtos, Movimentações (se rota existir), lista de todas as Escolas Cadastradas.
          - 'escola': Acesso ao link "Minha Escola" (detalhes da sua própria escola).
      - O item de menu ativo é destacado visualmente.
      - Exibe um indicador de carregamento enquanto as escolas são buscadas (para admin/user).
      - Rodapé com um botão de "Sair" (logout).
  3.  GERENCIAMENTO DE ESTADO DO USUÁRIO:
      - Carrega informações do usuário logado (incluindo seu papel e ID da escola, se aplicável)
        do `localStorage` ao ser montado e em mudanças de rota.
      - As permissões de visualização de links são baseadas nesses dados.
  4.  ROTEAMENTO:
      - Utiliza `<router-view>` para renderizar o componente correspondente à rota atual.
      - Aplica uma transição de "fade" na troca de rotas.
  5.  AÇÕES:
      - `toggleSidebar()`: Alterna o estado recolhido/expandido da sidebar.
      - `logout()`: Remove informações de autenticação do `localStorage`, limpa dados de usuário
        e redireciona para a página de login forçando uma recarga.
  6.  INTEGRAÇÃO COM STORE (PINIA):
      - Utiliza `useEscolasStore` para buscar e exibir a lista de escolas na sidebar (para admin/user).
      - Limpa a lista de escolas na store ao fazer logout.
  7.  ESTILIZAÇÃO:
      - Utiliza CSS global e scoped (dentro da tag `<style>`) para definir a aparência do layout.
      - Define variáveis CSS para fácil customização.

  Observações de Implementação:
  - A lógica de permissões é implementada diretamente no template usando `v-if` e propriedades computadas.
  - O estado de autenticação e os dados do usuário são gerenciados localmente (via `localStorage` e `ref`),
    mas poderiam ser centralizados em uma store Pinia de autenticação para maior robustez.
  - A checagem `movimentacoesRouteExists` permite adicionar/remover a rota "Movimentações" sem
    quebrar o menu.
-->
<template>
  <!-- 1. LAYOUT PRINCIPAL DA APLICAÇÃO -->
  <!--
    Classes dinâmicas controlam a aparência baseada na visibilidade e estado da sidebar,
    e se a página atual é a de login.
    - `sidebar-visible`: Adicionada se não for a página de login, para aplicar margem ao conteúdo.
    - `sidebar-collapsed`: Adicionada se a sidebar estiver recolhida (e não for login).
  -->
  <div class="app-layout" :class="{ 'sidebar-visible': !isLoginPage, 'sidebar-collapsed': isSidebarCollapsed && !isLoginPage }">

    <!-- 2. BARRA LATERAL (SIDEBAR) -->
    <!--
      - `v-if="!isLoginPage"`: A sidebar só é renderizada se não estivermos na página de login.
      - `:class="{ 'collapsed': isSidebarCollapsed }"`: Aplica classe para o estado recolhido.
    -->
    <div class="sidebar" :class="{ 'collapsed': isSidebarCollapsed }" v-if="!isLoginPage">
      <!-- 2.1. CABEÇALHO DA SIDEBAR -->
      <div class="sidebar-header">
         <!-- Logo da aplicação -->
         <div class="logo" :class="{ 'collapsed': isSidebarCollapsed }">
           <!-- Ícone pequeno quando recolhido -->
           <svg v-if="isSidebarCollapsed" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-box-seam-fill small-logo-icon" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M15.528 2.973a.75.75 0 0 1 .472.696v8.662a.75.75 0 0 1-.472.696l-7.25 2.9a.75.75 0 0 1-.557 0l-7.25-2.9A.75.75 0 0 1 0 12.331V3.669a.75.75 0 0 1 .471-.696L7.75.073a.75.75 0 0 1 .5-.001l7.278 2.9zm-1.808.816L8 1.511 2.28 4.237v8.166l5.72 2.288 5.72-2.288V3.79z"/>
</svg>
           <!-- Título visível quando expandido -->
           <h2 v-show="!isSidebarCollapsed">Merenda Escolar</h2>
         </div>
         <!-- Botão para recolher/expandir a sidebar -->
         <button @click="toggleSidebar" class="toggle-sidebar-btn" title="Recolher/Expandir Menu">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-layout-sidebar-inset" viewBox="0 0 16 16">
             <path d="M14 2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2z"/>
             <path d="M3 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>
           </svg>
         </button>
      </div>

      <!-- 2.2. NAVEGAÇÃO PRINCIPAL (MENU) -->
      <nav class="menu">
        <!-- 2.2.1. LINKS PARA ADMIN E USER PADRÃO -->
        <!-- Link para o Painel -->
        <router-link
            v-if="isUserAdminOrStandard"
            to="/"
            class="menu-item"
            :class="{ 'active': $route.name === 'PainelControle' || ($route.path === '/' && $route.name !== 'Login') }"
            title="Painel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-speedometer2 menu-icon" viewBox="0 0 16 16">
             <path d="M8 4a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V4.5A.5.5 0 0 1 8 4M3.732 5.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707M2 10a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 10m9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5m.754-4.246a.39.39 0 0 0-.527-.02L7.547 7.31A.91.91 0 1 0 8.85 8.54l3.434-4.297a.39.39 0 0 0-.029-.518z"/>
            <path fill-rule="evenodd" d="M0 10a8 8 0 1 1 15.547 2.661c-.442 1.253-1.845 1.602-2.932 1.25C11.309 13.488 9.475 13 8 13c-1.474 0-3.31.488-4.615.911-1.087.352-2.49.003-2.932-1.25A8 8 0 0 1 0 10m8-7a7 7 0 0 0-6.603 9.329c.203.575.923.876 1.68.63C4.397 12.533 6.358 12 8 12s3.604.532 4.923.96c.757.245 1.477-.056 1.68-.631A7 7 0 0 0 8 3"/>
          </svg>
          <span class="menu-item-text">Painel</span>
        </router-link>

        <!-- Link para Produtos -->
        <router-link
            v-if="isUserAdminOrStandard"
            to="/produtos"
            class="menu-item"
            :class="{ 'active': $route.name === 'Produtos' }"
            title="Produtos"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-box-seam menu-icon" viewBox="0 0 16 16">
             <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2l-2.218-.887zm3.564 1.426L5.596 5 8 5.961 14.154 3.5l-2.404-.961zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464z"/>
           </svg>
          <span class="menu-item-text">Produtos</span>
        </router-link>

        <!-- Link para Movimentações (se a rota existir) -->
        <router-link
            v-if="isUserAdminOrStandard && movimentacoesRouteExists"
            to="/movimentacoes"
            class="menu-item"
            :class="{ 'active': $route.name === 'Movimentacoes' }"
            title="Movimentações"
        >
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-arrow-down-up menu-icon" viewBox="0 0 16 16">
               <path fill-rule="evenodd" d="M11.5 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L11 2.707V14.5a.5.5 0 0 0 .5.5m-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5"/>
           </svg>
          <span class="menu-item-text">Movimentações</span>
        </router-link>

        <!-- 2.2.2. SEÇÃO DE ESCOLAS -->
        <!-- Divisor e título da seção visível para ADMIN ou USER PADRÃO e se houver escolas -->
        <hr v-if="(isAdminUser || isStandardUser) && !escolasStore.loading && escolasStore.listaEscolas.length > 0" class="sidebar-divider">
        <div
            v-if="(isAdminUser || isStandardUser) && !isSidebarCollapsed && !escolasStore.loading && escolasStore.listaEscolas.length > 0"
            class="menu-section-title with-toggle"
        >
            <span>Escolas Cadastradas</span>
            <button @click="toggleEscolasLista" class="toggle-section-btn" :title="escolasListaVisivel ? 'Recolher lista' : 'Expandir lista'">
                <svg v-if="escolasListaVisivel" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
                </svg>
            </button>
        </div>

        <!-- Indicador de carregamento de escolas (para Admin OU User Padrão) -->
        <div v-if="escolasStore.isLoading && (isAdminUser || isStandardUser)" class="menu-item loading-item">
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <span class="menu-item-text" style="margin-left: 5px;">Carregando Escolas...</span>
        </div>

        <!-- Lista de links para cada escola (para Admin e User Padrão) -->
        <!-- Adiciona 'escolasListaVisivel' à condição e garante que só mostre se a sidebar não estiver colapsada -->
        <transition name="expand-collapse-list">
            <div
                v-if="(isAdminUser || isStandardUser) && !escolasStore.isLoading && escolasStore.listaEscolas.length > 0 && escolasListaVisivel"
                class="escolas-sub-list-container"
            >
                <router-link
                    v-for="escola in escolasStore.listaEscolas"
                    :key="escola.id"
                    :to="{ name: 'EscolaDetalhes', params: { id: escola.id } }"
                    class="menu-item sub-item"
                    :class="{ 'active': $route.name === 'EscolaDetalhes' && $route.params.id == escola.id }"
                    :title="escola.nome"
                >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-mortarboard menu-icon" viewBox="0 0 16 16">
                  <path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L16 6.464a.5.5 0 0 0 .025-.917zM8 8.464 1.758 5.964 8 3.052l6.242 2.912z"/>
                  <path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.466zm-.068 1.873.22-.748 3.496 1.311a.5.5 0 0 0 .352 0l3.496-1.311.22.748L8 12.46l-3.892-1.556z"/>
                </svg>
                    <span class="menu-item-text">{{ escola.nome }}</span>
                </router-link>
            </div>
        </transition>

        <!-- 2.2.3. LINK "MINHA ESCOLA" PARA USUÁRIO DO TIPO ESCOLA -->
        <router-link
            v-if="isEscolaUser && userSchoolId"
            :to="{ name: 'EscolaDetalhes', params: { id: userSchoolId } }"
            class="menu-item"
            :class="{ 'active': $route.name === 'EscolaDetalhes' && $route.params.id == userSchoolId }"
            title="Minha Escola"
        >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-bank menu-icon" viewBox="0 0 16 16">
               <path d="m8 0 6.61 3h.89a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H15v7a.5.5 0 0 1 .485.38l.5 2a.498.498 0 0 1-.485.62H.5a.498.498 0 0 1-.485-.62l.5-2A.5.5 0 0 1 1 13V6H.5a.5.5 0 0 1-.5-.5v-2A.5.5 0 0 1 .5 3h.89zM3.777 3h8.447L8 1zM2 6v7h1V6zm2 0v7h1V6zm2 0v7h1V6zm2 0v7h1V6zm2 0v7h1V6zm2 0v7h1V6zM1 4h14V3H1z"/>
             </svg>
            <span class="menu-item-text">Minha Escola</span>
        </router-link>

        <!-- 2.2.4. LINK PARA CADASTRO DE USUÁRIO (APENAS ADMIN) -->
         <router-link
            v-if="isAdminUser"
            to="/admin/register-user"
            class="menu-item"
            :class="{ 'active': $route.name === 'RegisterUser' }"
            title="Cadastrar Usuário"
          >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-person-plus menu-icon" viewBox="0 0 16 16">
                <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/>
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m1-1a.5.5 0 0 1 .5.5v1h1a.5.5 0 0 1 0 1h-1v1a.5.5 0 0 1-1 0v-1h-1a.5.5 0 0 1 0-1h1v-1a.5.5 0 0 1 .5-.5"/>
                <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0M5.904 8.274c-.025.16-.048.326-.069.494H1.25a.25.25 0 0 0-.25.25v1.5c0 .138.112.25.25.25h4.013c.118.706.305 1.362.573 1.94H1.25a1.25 1.25 0 0 1-1.25-1.25V9.5A1.25 1.25 0 0 1 1.25 8.25zM11 8.25a.25.25 0 0 1 .25.25v1.5c0 .138-.112.25-.25.25h-4.013c-.118.706-.305 1.362-.573 1.94h4.586a1.25 1.25 0 0 0 1.25-1.25V9.5A1.25 1.25 0 0 0 11 8.25z"/>
              </svg>
              <span class="menu-item-text">Cadastrar Usuário</span>
         </router-link>
      </nav>

      <!-- 2.3. RODAPÉ DA SIDEBAR -->
      <div class="sidebar-footer">
           <!-- INÍCIO: Bloco para exibir nome do usuário logado -->
           <div v-if="currentUser && currentUser.username && !isLoginPage" class="logged-user-info-container">
             <div v-show="!isSidebarCollapsed" class="logged-user-details">
               <span class="user-greeting">Logado como:</span>
               <strong class="user-name" :title="currentUser.username">{{ currentUser.username }}</strong>
             </div>
             <div v-show="isSidebarCollapsed" class="logged-user-icon" :title="`Logado como: ${currentUser.username}`">
               <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="bi bi-person-circle" viewBox="0 0 16 16">
                 <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                 <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
               </svg>
             </div>
           </div>
           <!-- FIM: Bloco para exibir nome do usuário logado -->

           <!-- Botão de Logout -->
           <button v-if="!isLoginPage" @click="logout" class="logout-button" title="Sair">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-box-arrow-left menu-icon" viewBox="0 0 16 16">
                 <path fill-rule="evenodd" d="M6 12.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v2a.5.5 0 0 1-1 0v-2A1.5 1.5 0 0 1 6.5 2h8A1.5 1.5 0 0 1 16 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 5 12.5v-2a.5.5 0 0 1 1 0z"/>
                 <path fill-rule="evenodd" d="M.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L1.707 7.5H10.5a.5.5 0 0 1 0 1H1.707l2.147 2.146a.5.5 0 0 1-.708.708z"/>
               </svg>
               <span class="menu-item-text">Sair</span>
           </button>
       </div>
    </div>

    <!-- 3. ÁREA DE CONTEÚDO PRINCIPAL -->
    <!--
      - Onde as visualizações (componentes de rota) são renderizadas.
      - Classes dinâmicas ajustam a margem esquerda com base na sidebar.
      - `login-page` remove a margem se for a página de login.
    -->
    <div class="main-content-area" :class="{ 'sidebar-visible': !isLoginPage, 'sidebar-collapsed': isSidebarCollapsed && !isLoginPage, 'login-page': isLoginPage }">
      <!--
        `<router-view>`: Ponto de montagem para os componentes de rota.
        `v-slot="{ Component }"`: Permite o uso de transições em componentes de rota.
      -->
      <router-view v-slot="{ Component }">
        <transition name="fade">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup>
// --- BLOCO 1: IMPORTAÇÕES E INICIALIZAÇÕES ---
import { ref, computed, onMounted, watch, toRaw } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // Para interagir com o sistema de rotas.
import { useEscolasStore } from '@/stores/escolas'; // Store Pinia para dados das escolas.

const route = useRoute(); // Informações sobre a rota atual.
const router = useRouter(); // Instância do roteador Vue.
const escolasStore = useEscolasStore(); // Instância da store de escolas.

// --- BLOCO 2: ESTADO LOCAL DO COMPONENTE (REFS) ---
const isSidebarCollapsed = ref(false); // Controla se a sidebar está recolhida ou expandida.
const currentUser = ref(null);         // Armazena os dados do usuário logado (obtidos do localStorage).
const escolasListaVisivel = ref(true);

// --- BLOCO 3: PROPRIEDADES COMPUTADAS PARA CONTROLE DE UI E PERMISSÕES ---

// `isLoginPage`: Verifica se a rota atual é a página de login.
const isLoginPage = computed(() => route.name === 'Login');

// `userRole`: Retorna o papel (role) do usuário logado.
const userRole = computed(() => currentUser.value?.role);
// `userSchoolId`: Retorna o ID da escola associada ao usuário logado (se aplicável).
const userSchoolId = computed(() => currentUser.value?.school_id);

// Propriedades computadas booleanas para verificar o papel do usuário.
const isAdminUser = computed(() => userRole.value === 'admin');
const isEscolaUser = computed(() => userRole.value === 'escola');
const isStandardUser = computed(() => userRole.value === 'user'); // Usuário padrão (SME)
const isUserAdminOrStandard = computed(() => isAdminUser.value || isStandardUser.value);

// `movimentacoesRouteExists`: Verifica se a rota '/movimentacoes' está definida no roteador.
// Permite ocultar o link do menu se a rota não existir.
const movimentacoesRouteExists = computed(() => {
     return router.getRoutes().some(r => r.path === '/movimentacoes');
});

// --- BLOCO 4: MÉTODOS ---

/**
 * 
 * @function toggleSidebar
 * @description Alterna o estado de recolhimento da sidebar.
*/

 const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
 };

/** 
 * @function toggleEscolasLista
 * @description Alterna a visibilidade da lista de escolas na sidebar.
 */
 const toggleEscolasLista = () => {
  escolasListaVisivel.value = !escolasListaVisivel.value;
};

/**
 * @function logout
 * @description Realiza o logout do usuário.
 * Remove 'authToken' e 'authUser' do localStorage.
 * Limpa `currentUser.value` e a lista de escolas na store.
 * Redireciona para '/login' com recarga da página para limpar completamente o estado.
 */
const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    currentUser.value = null;
    escolasStore.escolas = []; // Limpa a lista de escolas na store Pinia.
    // Força a recarga para garantir que todo o estado da aplicação seja limpo.
    window.location.href = '/login';
};

/**
 * @function loadUserFromStorage
 * @description Carrega os dados do usuário do `localStorage` para `currentUser.value`.
 * Se os dados não existirem ou forem inválidos, `currentUser.value` é definido como `null`
 * e os itens inválidos são removidos do `localStorage`.
 */
function loadUserFromStorage() {
    const userStr = localStorage.getItem('authUser');
    if (userStr) {
        try {
            currentUser.value = JSON.parse(userStr);
        } catch (e) {
            console.error('Erro ao carregar usuário do localStorage:', e);
            currentUser.value = null;
            localStorage.removeItem('authUser'); // Limpa dado inválido
            localStorage.removeItem('authToken'); // Considera remover token também por segurança
        }
    } else {
        currentUser.value = null;
    }
}

// --- BLOCO 5: HOOKS DE CICLO DE VIDA E WATCHERS ---

/**
 * @hook onMounted
 * @description Executado quando o componente é montado.
 * Carrega os dados do usuário do localStorage.
 * Se não for a página de login e o usuário for admin ou padrão, busca a lista de escolas.
 * Adiciona um aviso se um usuário 'escola' não tiver `school_id`.
 */
onMounted(() => {
    loadUserFromStorage();
    if (!isLoginPage.value) {
        // Usuários admin e padrão (SME) precisam da lista completa de escolas para o menu.
        // Usuários do tipo 'escola' têm um link direto "Minha Escola" baseado no `userSchoolId`.
        if (isAdminUser.value || isStandardUser.value) {
          escolasStore.fetchEscolas();
        } else if (isEscolaUser.value && !userSchoolId.value) {
            // Situação anômala: usuário do tipo 'escola' sem um ID de escola associado.
            console.warn("Usuário 'escola' logado sem 'school_id' associado.");
        }
    }
});

/**
 * @watcher route.fullPath
 * @description Observa mudanças na rota completa.
 * Ao mudar de rota, recarrega os dados do usuário do localStorage.
 * (Opcional: Poderia buscar escolas se o usuário logar e for admin/padrão, mas `onMounted` já cobre isso).
 * Essa recarga de usuário é útil se o estado de login puder mudar sem uma recarga completa (ex: Single Sign-On).
 */
watch(() => route.fullPath, () => {
    loadUserFromStorage();
    // A lógica de buscar escolas com base no novo usuário/rota já é coberta pelo `onMounted`
    // ou por lógicas dentro das próprias views. Evita chamadas duplicadas.
    // Exemplo de lógica que poderia ser reativada se necessário:
    // if (!isLoginPage.value && (isAdminUser.value || isStandardUser.value) && escolasStore.listaEscolas.length === 0) {
    //     escolasStore.fetchEscolas();
    // }
});

</script>


<style>
/* --- Variáveis CSS Globais --- */
/* Definem cores, tamanhos e durações de transição para a sidebar e layout. */
:root {
  --sidebar-width-expanded: 260px;    /* Largura da sidebar expandida */
  --sidebar-width-collapsed: 80px;   /* Largura da sidebar recolhida */
  --sidebar-bg-color: #1f2937;       /* Cor de fundo da sidebar */
  --sidebar-text-color: #d1d5db;    /* Cor do texto na sidebar */
  --sidebar-hover-bg: #374151;       /* Cor de fundo ao passar o mouse em itens da sidebar */
  --sidebar-active-bg: #4b5563;      /* Cor de fundo do item ativo na sidebar */
  --sidebar-active-border: #34d399;  /* Cor da borda esquerda do item ativo */
  --content-bg-color: #f9fafb;       /* Cor de fundo da área de conteúdo principal */
  --header-text-color: #111827;      /* Cor do texto para cabeçalhos (não usado diretamente aqui) */
  --sidebar-transition-duration: 0.3s; /* Duração da transição da sidebar */
}

/* Reset e estilos globais básicos */
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Inter', sans-serif; /* Fonte padrão */
  background-color: var(--content-bg-color); /* Cor de fundo do corpo */
  overflow-x: hidden; /* Evita scroll horizontal */
  color: #374151; /* Cor de texto padrão para o conteúdo */
}

/* Layout Principal da Aplicação */
.app-layout {
  display: flex; /* Layout flexível para sidebar e conteúdo */
  min-height: 100vh; /* Altura mínima de toda a viewport */
  width: 100vw; /* Largura de toda a viewport */
  overflow: hidden; /* Esconde overflow para evitar barras de rolagem indesejadas no nível do app */
}

/* --- Estilos da Sidebar --- */
.sidebar {
  width: var(--sidebar-width-expanded);
  background: var(--sidebar-bg-color);
  color: var(--sidebar-text-color);
  min-height: 100vh; /* Ocupa toda a altura */
  box-shadow: 3px 0 15px rgba(0, 0, 0, 0.1); /* Sombra sutil */
  position: fixed; /* Fixa na tela */
  left: 0; top: 0; bottom: 0;
  z-index: 1000; /* Garante que fique acima de outros conteúdos */
  display: flex;
  flex-direction: column; /* Organiza itens verticalmente */
  overflow: hidden; /* Esconde conteúdo que transborda (texto do menu quando recolhido) */
  transition: width var(--sidebar-transition-duration) ease-in-out; /* Animação da largura */
}
.sidebar.collapsed { width: var(--sidebar-width-collapsed); } /* Estilo para sidebar recolhida */

/* Cabeçalho da Sidebar (Logo e botão de toggle) */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Espaça logo e botão */
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08); /* Linha divisória sutil */
  min-height: 65px; /* Altura mínima */
  flex-shrink: 0; /* Impede que encolha */
}
.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem; /* Espaço entre ícone e texto do logo */
  overflow: hidden; /* Para animar o texto do logo */
  transition: opacity var(--sidebar-transition-duration) ease;
}
.logo.collapsed { justify-content: center; } /* Centraliza o ícone quando recolhido */
.logo h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap; /* Impede quebra de linha */
  opacity: 1;
  transition: opacity 0.2s ease, width 0.2s ease; /* Animação para ocultar o texto */
}
.sidebar.collapsed .logo h2 { opacity: 0; width: 0; } /* Oculta o texto do logo ao recolher */
.small-logo-icon { color: #e5e7eb; } /* Cor do ícone do logo */

/* Botão de Toggle da Sidebar */
.toggle-sidebar-btn {
  background: transparent;
  border: none;
  color: #9ca3af; /* Cor do ícone do botão */
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.toggle-sidebar-btn:hover {
  background-color: rgba(255, 255, 255, 0.1); /* Feedback visual no hover */
  color: #ffffff;
}
/* Rotação do ícone do botão de toggle */
.sidebar.collapsed .toggle-sidebar-btn svg { transform: rotate(180deg); transition: transform 0.3s ease; }
.sidebar:not(.collapsed) .toggle-sidebar-btn svg { transform: rotate(0deg); transition: transform 0.3s ease; }

/* Menu e Itens de Navegação */
.menu {
  padding: 1rem 0; /* Espaçamento vertical do menu */
  flex-grow: 1; /* Faz o menu ocupar o espaço vertical disponível */
  overflow-y: auto; /* Habilita scroll vertical se necessário */
  overflow-x: hidden; /* Esconde scroll horizontal */
  scrollbar-width: thin; /* Para Firefox */
  scrollbar-color: #4b5563 var(--sidebar-bg-color); /* Cor da barra de rolagem (Firefox) */
}
.menu::-webkit-scrollbar { width: 6px; } /* Para Chrome/Safari/Edge */
.menu::-webkit-scrollbar-track { background: var(--sidebar-bg-color); }
.menu::-webkit-scrollbar-thumb { background-color: #4b5563; border-radius: 3px; }

.menu-item {
  display: flex;
  align-items: center;
  padding: 0.8rem 1.5rem; /* Espaçamento interno do item */
  color: var(--sidebar-text-color);
  text-decoration: none; /* Remove sublinhado do link */
  margin: 0.2rem 0.5rem; /* Margem entre itens */
  border-radius: 6px;
  border-left: 4px solid transparent; /* Borda para indicar item ativo */
  white-space: nowrap; /* Impede quebra de linha do texto do item */
  overflow: hidden; /* Para animar o texto */
  transition: background-color 0.2s ease, color 0.2s ease, padding var(--sidebar-transition-duration) ease-in-out;
}
.sidebar.collapsed .menu-item {
  padding: 0.8rem 0; /* Ajusta padding quando recolhido */
  justify-content: center; /* Centraliza ícone */
  margin: 0.2rem 0.5rem;
}
.menu-item:hover {
  background: var(--sidebar-hover-bg);
  color: #ffffff;
}
.menu-item.active {
  background: var(--sidebar-active-bg);
  border-left: 4px solid var(--sidebar-active-border);
  color: #ffffff;
  font-weight: 500;
}
.sidebar.collapsed .menu-item.active {
  border-left-width: 0; /* Remove borda esquerda quando recolhido */
  position: relative; /* Para o pseudo-elemento ::before */
}
/* Indicador de item ativo quando recolhido (pequeno círculo) */
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
  margin-right: 0.9rem; /* Espaço entre ícone e texto */
  transition: margin-right var(--sidebar-transition-duration) ease-in-out;
}
.sidebar.collapsed .menu-icon { margin-right: 0; } /* Remove margem do ícone quando recolhido */
.menu-item-text {
  opacity: 1;
  transition: opacity 0.2s ease;
  margin-left: 0px; /* Ajuste se necessário para alinhar com ícone */
}
.sidebar.collapsed .menu-item-text { opacity: 0; width: 0; } /* Oculta o texto ao recolher */

/* Rodapé da Sidebar e Botão de Logout */
.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08); /* Linha divisória */
  flex-shrink: 0; /* Impede que encolha */
  margin-top: auto; /* Empurra o rodapé para baixo */
}
.logout-button {
    background: none;
    border: 1px solid #4b5563; /* Borda sutil */
    color: var(--sidebar-text-color);
    padding: 0.5rem 0;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    text-align: center;
    transition: all 0.2s ease;
    font-size: 0.9rem;
}
.sidebar.collapsed .logout-button { padding: 0.5rem 0; justify-content: center; }
.logout-button:hover { background-color: var(--sidebar-hover-bg); border-color: var(--sidebar-hover-bg); color: #ffffff; }
.logout-button .menu-icon { margin-right: 0.9rem; }
.sidebar.collapsed .logout-button .menu-icon { margin-right: 0; }
.sidebar.collapsed .logout-button .menu-item-text { display: none; } /* Esconde texto do logout ao recolher */


.main-content-area {
  flex: 1;
  background-color: var(--content-bg-color);
  display: flex;
  flex-direction: column;
  padding: 2rem; /* Padding padrão para páginas com sidebar */
  overflow-y: auto;
  min-height: 100vh;
  transition: margin-left var(--sidebar-transition-duration) ease-in-out, padding 0s, background-color 0s; /* Adicionar padding e bg-color à transição para evitar "saltos" se quiser */
  margin-left: var(--sidebar-width-expanded);
}
/* Ajuste da margem quando a sidebar está visível E recolhida */
.main-content-area.sidebar-visible.sidebar-collapsed {
  margin-left: var(--sidebar-width-collapsed);
}
/* Ajuste COMPLETO para a página de login */
.main-content-area.login-page {
  margin-left: 0 !important; /* Garante que não haja margem */
  padding: 0 !important; /* REMOVE O PADDING */
  background-color: transparent !important; /* TORNA O FUNDO TRANSPARENTE */
  /* Se a imagem de fundo do LoginView ainda não preencher,
     garantir que LoginView (auth-view-container) também tenha 100% de altura/largura */
  /* overflow-y: hidden; */ /* Pode ser útil para evitar barras de rolagem apenas na página de login, se necessário */
}

/* Animação de Fade para transição de rotas */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

/* Estilo para o divisor na sidebar (opcional) */
.sidebar-divider {
    border: 0;
    height: 1px;
    background-color: rgba(255, 255, 255, 0.1);
    margin: 1rem 1rem;
}

/* Estilo para o título da seção na sidebar (opcional) */
.menu-section-title {
    padding: 0.5rem 1.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #9ca3af; /* Cinza claro */
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 0.5rem;
    white-space: nowrap;
    overflow: hidden;
}
.sidebar.collapsed .menu-section-title { display: none; } /* Esconde título da seção quando recolhido */

/* Novo: Estilo para o título da seção com botão de toggle */
.menu-section-title.with-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between; /* Para colocar o botão no lado direito */
    /* padding-right: 1rem; */ /* Reduzir padding direito se o botão tiver o seu próprio */
}

.toggle-section-btn {
    background: none;
    border: none;
    color: #9ca3af; /* Mesma cor do texto do título */
    cursor: pointer;
    padding: 0.25rem; /* Pequeno padding para área de clique */
    border-radius: 4px;
    display: inline-flex; /* Para alinhar o SVG corretamente */
    align-items: center;
    justify-content: center;
}

.toggle-section-btn:hover {
    color: #d1d5db; /* Cor mais clara no hover */
    background-color: rgba(255, 255, 255, 0.05);
}

.toggle-section-btn svg {
    width: 14px; /* Ajuste o tamanho do ícone conforme necessário */
    height: 14px;
}

/* --- Transição para expandir/recolher lista de escolas --- */
.expand-collapse-list-enter-active,
.expand-collapse-list-leave-active {
  transition: all 0.4s ease-in-out; /* Duração e easing da transição */
  max-height: 500px; /* Um valor alto o suficiente para acomodar sua lista. Ajuste se necessário. */
  overflow: hidden; /* Importante para que o conteúdo não vaze durante a animação de max-height */
}

.expand-collapse-list-enter-from,
.expand-collapse-list-leave-to {
  opacity: 0;
  max-height: 0;
  /* Você pode adicionar transformações aqui também, como um leve slide vertical: */
  /* transform: translateY(-10px); */
}

.expand-collapse-list-enter-to,
.expand-collapse-list-leave-from {
  opacity: 1;
  max-height: 500px; /* Mesmo valor de max-height que o -active */
  /* transform: translateY(0); */
}

/* Estilo para item de carregamento na sidebar (opcional) */
.loading-item {
    display: flex;
    align-items: center;
    padding: 0.8rem 1.5rem;
    color: var(--sidebar-text-color);
    opacity: 0.7;
    cursor: default; /* Indica que não é clicável */
}
.sidebar.collapsed .loading-item {
    justify-content: center;
    padding: 0.8rem 0;
}
.sidebar.collapsed .loading-item .menu-item-text { display: none; }

/* Estilos para o spinner (usado no carregamento de escolas) */
.spinner-border {
    display: inline-block;
    width: 1rem; /* Tamanho do spinner */
    height: 1rem;
    vertical-align: text-bottom;
    border: .2em solid currentColor; /* Espessura da borda */
    border-right-color: transparent; /* Cria o efeito de rotação */
    border-radius: 50%;
    -webkit-animation: spinner-border .75s linear infinite;
    animation: spinner-border .75s linear infinite;
}
@keyframes spinner-border {
  to { transform: rotate(360deg); }
}

/* --- Estilos para Informação do Usuário Logado no Rodapé --- */
.logged-user-info-container {
  padding: 0.5rem 0.75rem; /* Reduzir padding horizontal para menos espaço nas laterais */
  margin-bottom: 0.75rem; /* Espaço antes do botão de logout */
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.05); /* Linha sutil de separação opcional */
  border-bottom: 1px solid rgba(255, 255, 255, 0.05); /* Linha sutil de separação opcional */
  margin-left: 0.5rem; /* Pequena margem lateral */
  margin-right: 0.5rem; /* Pequena margem lateral */
  border-radius: 4px;
}

.sidebar.collapsed .logged-user-info-container {
  padding: 0.5rem 0; /* Ajustar padding vertical quando colapsado */
  border-top: none;
  border-bottom: none;
  margin-left: 0;
  margin-right: 0;
}

.logged-user-details {
  color: var(--sidebar-text-color);
  font-size: 0.8rem;
  line-height: 1.3;
}

.user-greeting {
  display: block;
  font-size: 0.7rem;
  color: #a0aec0; /* Um tom mais claro */
}

.user-name {
  display: block;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(var(--sidebar-width-expanded) - 60px); /* Ajustar para não vazar */
}

.sidebar.collapsed .user-name {
   max-width: calc(var(--sidebar-width-collapsed) - 20px); /* Ajustar para não vazar */
}

.logged-user-icon {
  color: var(--sidebar-text-color);
  display: flex;
  justify-content: center;
  align-items: center;
}

.logged-user-icon svg {
  width: 22px; /* Tamanho do ícone */
  height: 22px;
}

/* Ajuste no rodapé para melhor espaçamento se necessário */
.sidebar-footer {
  padding-top: 0.5rem; /* Reduzir um pouco o padding superior do footer */
  padding-bottom: 0.5rem; /* Reduzir um pouco o padding inferior do footer */
}


/* --- Media Queries para Responsividade --- */
/* Em telas menores (ex: tablets), força a sidebar a estar recolhida se visível (não na tela de login) */
@media (max-width: 992px) {
    /* Oculta o texto e centraliza ícones como se estivesse recolhida, mesmo que o estado `isSidebarCollapsed` seja false */
    .sidebar:not(.collapsed) .logo h2,
    .sidebar:not(.collapsed) .menu-item-text { opacity: 0; width: 0; }
    .sidebar:not(.collapsed) .menu-icon { margin-right: 0; }
    .sidebar:not(.collapsed) .menu-item { justify-content: center; padding: 0.8rem 0; }
    /* Oculta o botão de toggle para impedir expansão manual */
    .sidebar:not(.collapsed) .toggle-sidebar-btn { display: none; }

    /* Ajusta a margem do conteúdo para a largura da sidebar recolhida, se ela estiver visível */
    .main-content-area.sidebar-visible {
        margin-left: var(--sidebar-width-collapsed);
    }
    /* Garante que na tela de login a margem seja zero */
    .main-content-area.login-page {
        margin-left: 0;
    }
}

@media (max-width: 768px) {
     /* Ajusta o padding do conteúdo principal em telas menores */
     .main-content-area { padding: 1.5rem; }
     /* Exemplo de como poderia ser se a sidebar empilhasse em vez de recolher */
     /* .app-layout { flex-direction: column; } */
     /* .sidebar { position: relative; width: 100%; min-height: auto; } */
     /* .main-content-area { margin-left: 0 !important; } */
}
@media (max-width: 480px) {
    /* Mais ajustes de padding para telas bem pequenas */
    .main-content-area { padding: 1rem; }
}
</style>