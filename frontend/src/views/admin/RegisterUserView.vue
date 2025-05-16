<!--
  /frontend/src/views/admin/RegisterUserView.vue
  (Nota: A estrutura de pastas no seu pedido original era /frontend/src/views/admin/RegisterUserView.vue,
  mas o arquivo foi fornecido como /frontend/src/views/RegisterUserView.vue.
  Estou usando o nome do arquivo fornecido para a documentação.)

  Visão Geral:
  Este componente Vue.js é destinado a administradores para cadastrar novos usuários
  no sistema. Ele apresenta um formulário para inserir dados do novo usuário (nome de usuário,
  senha, permissão/role) e, condicionalmente, permite associar o usuário a uma escola
  se a permissão for 'escola'. Adicionalmente, exibe uma lista dos usuários já existentes.

  Funcionalidades Principais:
  1.  FORMULÁRIO DE CADASTRO DE USUÁRIO:
      - Campos para Nome de Usuário, Senha e Permissão (Role).
      - Validação básica para o comprimento do nome de usuário e senha.
      - O campo "Permissão" é um select com as opções: Usuário Padrão, Administrador, Escola.
  2.  SELEÇÃO DE ESCOLA CONDICIONAL:
      - Se a permissão selecionada for 'escola', um campo select adicional aparece para
        associar o novo usuário a uma escola existente.
      - A lista de escolas disponíveis é carregada da API.
      - Exibe mensagens de carregamento e erro para a busca de escolas.
      - Validação para garantir que uma escola seja selecionada se a permissão for 'escola'.
  3.  SUBMISSÃO E CADASTRO:
      - Ao submeter o formulário, a função `handleRegister` é chamada.
      - Utiliza o `apiService` para enviar uma requisição de cadastro de usuário ao backend.
      - O payload enviado inclui `school_id` apenas se a permissão for 'escola'.
  4.  FEEDBACK AO USUÁRIO:
      - Exibe um indicador de carregamento (spinner) no botão "Cadastrar Usuário" durante
        a tentativa de cadastro.
      - Mostra mensagens de sucesso ou erro após a tentativa de cadastro.
      - Limpa o formulário após um cadastro bem-sucedido.
  5.  LISTAGEM DE USUÁRIOS EXISTENTES (PARA ADMIN):
      - Se o usuário logado for um administrador (`isAdmin`), uma lista dos usuários
        existentes é exibida ao lado do formulário.
      - A lista mostra o nome de usuário e a permissão de cada usuário.
      - Exibe um indicador de carregamento enquanto a lista de usuários é buscada.
      - A lista é atualizada após um novo usuário ser cadastrado com sucesso.
  6.  CONTROLE DE ACESSO:
      - A funcionalidade de listar usuários e, implicitamente, o acesso a esta view
        deveria ser restrito a administradores (a lógica de `isAdmin` já está presente).
  7.  ESTILIZAÇÃO:
      - Importa e utiliza estilos CSS de `auth-styles.css` (para o formulário) e
        `register-view.css` (para o layout da página com lista de usuários).

  Estrutura do Template:
  - `auth-view-container register-container`: Container principal com classes para layout.
  - `page-main-title`: Título principal da página.
  - `register-content-wrapper`: Wrapper para organizar formulário e lista lado a lado.
  - `auth-card`: Card para o formulário de cadastro.
  - `auth-title`: Título do formulário.
  - `auth-form`: Formulário HTML.
  - `form-group`, `form-label`, `form-input`, `form-select`: Elementos padrão do formulário.
  - `feedback-message`: Div para mensagens de sucesso/erro do formulário.
  - `submit-button`: Botão de cadastro com spinner.
  - `user-list-card`: Card para a lista de usuários existentes.
  - `user-list-title`: Título da lista de usuários.
  - `loading-users`: Mensagem de carregamento para a lista de usuários.
  - `user-list`: Container da lista `<ul>`.
  - `user-info`, `role-tag`: Spans para formatar informações do usuário na lista.
-->
<template>
    <!-- 1. CONTAINER PRINCIPAL DA VIEW DE REGISTRO -->
    <!-- `register-container` pode adicionar estilos específicos para este layout que inclui a lista. -->
    <div class="auth-view-container register-container">
  
      <!-- TÍTULO PRINCIPAL DA PÁGINA (nível mais alto) -->
      <h1 class="page-main-title">Autenticação de Usuários</h1>
  
        <!-- 2. WRAPPER PARA CONTEÚDO LADO A LADO -->
        <!-- Organiza o formulário de cadastro e a lista de usuários (se visível). -->
        <div class="register-content-wrapper">
  
            <!-- 3. CARD DO FORMULÁRIO DE CADASTRO -->
            <div class="auth-card">
                <!-- 4. TÍTULO DO FORMULÁRIO -->
                <h2 class="auth-title">Cadastrar Novo Usuário</h2>
                <!-- 5. FORMULÁRIO HTML -->
                <!-- `@submit.prevent="handleRegister"`: Chama a função de cadastro ao submeter. -->
                <form class="auth-form" @submit.prevent="handleRegister">
                    <!-- Grupo: Nome de Usuário -->
                    <div class="form-group">
                        <label for="newUsername" class="form-label">Nome de Usuário:</label>
                        <input type="text" id="newUsername" class="form-input" v-model="newUser.username" required placeholder="Mínimo 3 caracteres">
                    </div>
                    <!-- Grupo: Senha -->
                    <div class="form-group">
                        <label for="newPassword" class="form-label">Senha:</label>
                        <input type="password" id="newPassword" class="form-input" v-model="newUser.password" required placeholder="Mínimo 6 caracteres">
                    </div>
                    <!-- Grupo: Permissão (Role) -->
                    <div class="form-group">
                        <label for="role" class="form-label">Permissão (Role):</label>
                        <!-- 6. SELECT PARA PERMISSÃO -->
                        <select id="role" class="form-select" v-model="newUser.role">
                            <option value="user">Usuário Padrão</option>
                            <option value="admin">Administrador</option>
                            <option value="escola">Escola</option>
                        </select>
                    </div>
  
                      <!-- Grupo: Seletor de Escola (Condicional) -->
                      <!-- Visível apenas se `newUser.role` for 'escola'. -->
                      <div class="form-group" v-if="newUser.role === 'escola'">
                          <label for="school" class="form-label">Escola Associada:</label>
                              <select id="school" class="form-select" v-model="newUser.school_id" required>
                                  <option disabled value="">Selecione uma escola</option>
                                  <!-- Itera sobre as escolas disponíveis carregadas da API -->
                                  <option v-for="school in availableSchools" :key="school.id" :value="school.id">
                                  {{ school.nome }}
                                  </option>
                              </select>
                          <!-- Feedback de carregamento/erro para a lista de escolas -->
                          <div v-if="isLoadingSchools" class="loading-inline">Carregando escolas...</div>
                          <div v-if="!isLoadingSchools && availableSchools.length === 0" class="error-inline">
                              Nenhuma escola encontrada. Cadastre escolas primeiro.
                          </div>
                      </div>
  
                    <!-- 7. MENSAGEM DE FEEDBACK (SUCESSO/ERRO) -->
                    <!-- Classes dinâmicas para estilizar a mensagem. -->
                    <div v-if="feedbackMessage"
                         class="feedback-message"
                         :class="isError ? 'error-message' : 'success-message'">
                        {{ feedbackMessage }}
                    </div>
                    <!-- 8. BOTÃO DE CADASTRO -->
                    <!-- Desabilitado e com spinner durante o carregamento. -->
                    <button type="submit" class="submit-button" :disabled="isLoading">
                       <span v-if="isLoading" class="spinner" role="status" aria-hidden="true"></span>
                       <span v-if="isLoading"> Cadastrando...</span>
                       <span v-else>Cadastrar Usuário</span>
                    </button>
                </form>
            </div> <!-- Fim do auth-card (formulário) -->
  
            <!-- 9. CARD DA LISTA DE USUÁRIOS -->
            <!-- Visível apenas se o usuário logado for administrador (`isAdmin`). -->
            <div class="user-list-card" v-if="isAdmin">
                <!-- 10. TÍTULO DA LISTA -->
                <h3 class="user-list-title">Usuários Existentes</h3>
                <!-- 11. MENSAGEM DE CARREGAMENTO DA LISTA -->
                <div v-if="isLoadingUsers" class="loading-users">
                    Carregando usuários... <span class="spinner"></span>
                </div>
                <!-- 12. LISTA DE USUÁRIOS -->
                <!-- Exibida se não estiver carregando e houver usuários. -->
                <div class="user-list" v-else-if="users.length > 0">
                     <ul>
                         <!-- Itera sobre a lista de usuários carregada -->
                         <li v-for="user in users" :key="user.id">
                             <!-- 13. INFORMAÇÃO DO USUÁRIO (NOME) -->
                             <span class="user-info">{{ user.username }}</span>
                             <!-- 14. TAG DE PERMISSÃO (ROLE) -->
                             <!-- Classe dinâmica para estilizar a tag da permissão. -->
                             <span class="role-tag" :class="user.role === 'admin' ? 'admin' : 'user'">
                                 {{ user.role }}
                             </span>
                             <!-- TODO: Adicionar botões de editar/excluir usuário se necessário. -->
                         </li>
                     </ul>
                </div>
                <!-- 15. MENSAGEM SE NÃO HOUVER USUÁRIOS -->
                <div v-else class="loading-users"> <!-- Reutiliza estilo de 'loading-users' para consistência. -->
                    Nenhum outro usuário cadastrado.
                </div>
            </div> <!-- Fim do user-list-card -->
  
        </div> <!-- Fim do register-content-wrapper -->
    </div> <!-- Fim do auth-view-container -->
  </template>
  
  <script setup>
  // --- BLOCO 1: IMPORTAÇÕES ---
  import { ref, reactive, onMounted, watch } from 'vue'; // Funções do Vue para reatividade e ciclo de vida.
  import apiService from '@/services/apiService'; // Serviço para chamadas à API.
  import '@/styles/auth-styles.css'; // Estilos compartilhados com a tela de login.
  import '@/styles/register-view.css'; // Estilos específicos para esta view (ex: layout da lista).
  
  // --- BLOCO 2: ESTADO DO FORMULÁRIO DE NOVO USUÁRIO (REACTIVE) ---
  // `reactive` é usado para o objeto `newUser` pois tem múltiplas propriedades aninhadas.
  const newUser = reactive({
    username: '',
    password: '',
    role: 'user',   // Valor padrão para a permissão.
    school_id: ''   // ID da escola, preenchido se role for 'escola'.
  });
  
  // --- BLOCO 3: ESTADO LOCAL DO COMPONENTE (REFS) ---
  // Estado para o formulário de cadastro
  const isLoading = ref(false);           // Controla o estado de carregamento do formulário.
  const feedbackMessage = ref('');      // Mensagem de sucesso ou erro após submissão.
  const isError = ref(false);             // Flag para estilizar `feedbackMessage` como erro.
  
  // Estado para a lista de usuários existentes
  const users = ref([]);                  // Array para armazenar os usuários carregados.
  const isAdmin = ref(false);             // Flag para verificar se o usuário logado é admin.
  const isLoadingUsers = ref(false);      // Controla o estado de carregamento da lista de usuários.
  
  // Estado para a lista de escolas (usada no select condicional)
  const availableSchools = ref([]);       // Array para armazenar as escolas disponíveis.
  const isLoadingSchools = ref(false);    // Controla o estado de carregamento da lista de escolas.
  
  // --- BLOCO 4: FUNÇÕES DE BUSCA DE DADOS (API) ---
  /**
   * @async
   * @function fetchUsers
   * @description Busca a lista de usuários existentes da API.
   * Usado para popular a lista de usuários exibida para o administrador.
   * Atualiza `users`, `isLoadingUsers` e `feedbackMessage`/`isError` em caso de falha.
   */
  const fetchUsers = async () => {
      isLoadingUsers.value = true;
      try {
          const response = await apiService.getUsers();
          // Ordena os usuários (opcional, ex: alfabeticamente)
          users.value = response.data.sort((a, b) => a.username.localeCompare(b.username));
      } catch (error) {
          console.error("Erro ao buscar usuários:", error);
          feedbackMessage.value = 'Erro ao carregar lista de usuários.';
          isError.value = true;
      } finally {
          isLoadingUsers.value = false;
      }
  }
  
  /**
   * @async
   * @function fetchSchools
   * @description Busca a lista de escolas disponíveis da API.
   * Usado para popular o select de "Escola Associada" quando a permissão é 'escola'.
   * Atualiza `availableSchools`, `isLoadingSchools` e `feedbackMessage`/`isError` em caso de falha.
   */
  const fetchSchools = async () => {
      isLoadingSchools.value = true;
      try {
          const response = await apiService.getSchools(); // Assume que existe um método getSchools no apiService
          availableSchools.value = response.data;
      } catch (error) {
           console.error("Erro ao buscar escolas:", error);
           feedbackMessage.value = 'Erro ao carregar lista de escolas.';
           isError.value = true;
           availableSchools.value = []; // Limpa a lista em caso de erro.
      } finally {
           isLoadingSchools.value = false;
      }
  };
  
  // --- BLOCO 5: HOOK DE CICLO DE VIDA (onMounted) ---
  /**
   * @hook onMounted
   * @description Executado quando o componente é montado.
   * Verifica se o usuário logado é administrador. Se for, busca a lista de usuários
   * e a lista de escolas.
   */
  onMounted(() => {
      const userStr = localStorage.getItem('authUser');
      if (userStr) {
          try {
              const currentUser = JSON.parse(userStr);
              if (currentUser.role === 'admin') {
                  isAdmin.value = true; // Define que o usuário é admin
                  fetchUsers();       // Busca usuários para a lista
                  fetchSchools();     // Busca escolas para o select
              }
          } catch (e) { console.error("Erro ao parsear usuário do localStorage", e); }
      }
  });
  
  // --- BLOCO 6: WATCHER (OBSERVADOR) ---
  /**
   * @watcher newUser.role
   * @description Observa mudanças na propriedade `newUser.role`.
   * Se a permissão selecionada não for 'escola', limpa o valor de `newUser.school_id`.
   */
  watch(() => newUser.role, (newRole) => {
      if (newRole !== 'escola') {
          newUser.school_id = ''; // Reseta a escola selecionada
      }
  });
  
  // --- BLOCO 7: FUNÇÃO DE CADASTRO (handleRegister) ---
  /**
   * @async
   * @function handleRegister
   * @description Processa o cadastro de um novo usuário.
   * Realiza validações básicas.
   * Prepara o payload (removendo `school_id` se não for permissão 'escola').
   * Chama `apiService.registerUser`.
   * Atualiza `feedbackMessage`, `isError` e `isLoading`.
   * Limpa o formulário e atualiza a lista de usuários em caso de sucesso.
   */
  const handleRegister = async () => {
    isLoading.value = true;
    feedbackMessage.value = '';
    isError.value = false;
  
    // Validações básicas
    if (newUser.username.length < 3) {
       feedbackMessage.value = 'O nome de usuário deve ter pelo menos 3 caracteres.';
       isError.value = true;
       isLoading.value = false;
       return;
     }
     if (newUser.password.length < 6) {
       feedbackMessage.value = 'A senha deve ter pelo menos 6 caracteres.';
       isError.value = true;
       isLoading.value = false;
       return;
     }
  
    // Validação específica: se a permissão é 'escola', `school_id` deve ser selecionado.
    if (newUser.role === 'escola' && !newUser.school_id) {
        feedbackMessage.value = 'Selecione uma escola para o usuário do tipo "Escola".';
        isError.value = true;
        isLoading.value = false;
        return;
    }
  
    try {
      // Prepara o payload para a API.
      // Cria uma cópia de `newUser` para não modificar o objeto reativo diretamente de forma indesejada.
      const payload = { ...newUser };
      // Remove `school_id` do payload se a permissão não for 'escola'.
      if (payload.role !== 'escola') {
        delete payload.school_id;
      }
  
      const response = await apiService.registerUser(payload);
      feedbackMessage.value = `Usuário "${response.data.username}" (Role: ${response.data.role}) cadastrado com sucesso!`;
      isError.value = false; // Sucesso
  
      // Limpa o formulário
      newUser.username = '';
      newUser.password = '';
      newUser.role = 'user'; // Reseta para o valor padrão
      newUser.school_id = '';
  
      // Se o usuário logado for admin, atualiza a lista de usuários exibida.
      if (isAdmin.value) {
          fetchUsers();
      }
    } catch (error) {
      console.error("Erro no cadastro:", error);
      isError.value = true;
      // Usa a mensagem de erro da API, se disponível, ou uma mensagem genérica.
      feedbackMessage.value = error.response?.data?.error || 'Erro ao cadastrar usuário.';
    } finally {
      isLoading.value = false; // Finaliza o estado de carregamento do formulário
    }
  };
  </script>