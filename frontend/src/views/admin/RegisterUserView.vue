<!-- /frontend/src/views/RegisterUserView.vue-->
<template>
  <!-- 1. Container principal da view (adiciona a classe 'register-container' para o layout específico) -->
  <div class="auth-view-container register-container">

    <!-- **** NOVO TÍTULO PRINCIPAL DA PÁGINA **** -->
    <h1 class="page-main-title">Autenticação de Usuários</h1>

      <!-- 2. Wrapper para conteúdo lado a lado (form + lista) -->
      <div class="register-content-wrapper">

          <!-- 3. Card do Formulário -->
          <div class="auth-card">
              <!-- 4. Título -->
              <h2 class="auth-title">Cadastrar Novo Usuário</h2>
              <!-- 5. Formulário -->
              <form class="auth-form" @submit.prevent="handleRegister">
                  <div class="form-group">
                      <label for="newUsername" class="form-label">Nome de Usuário:</label>
                      <input type="text" id="newUsername" class="form-input" v-model="newUser.username" required placeholder="Mínimo 3 caracteres">
                  </div>
                  <div class="form-group">
                      <label for="newPassword" class="form-label">Senha:</label>
                      <input type="password" id="newPassword" class="form-input" v-model="newUser.password" required placeholder="Mínimo 6 caracteres">
                  </div>
                  <div class="form-group">
                      <label for="role" class="form-label">Permissão (Role):</label>
                      <!-- 6. Select com a classe correta -->
                      <select id="role" class="form-select" v-model="newUser.role">
                          <option value="user">Usuário Padrão</option>
                          <option value="admin">Administrador</option>
                      </select>
                  </div>
                  <!-- 7. Mensagem de feedback com classes base e dinâmica -->
                  <div v-if="feedbackMessage"
                       class="feedback-message"
                       :class="isError ? 'error-message' : 'success-message'">
                      {{ feedbackMessage }}
                  </div>
                  <!-- 8. Botão com classe e spinner -->
                  <button type="submit" class="submit-button" :disabled="isLoading">
                     <span v-if="isLoading" class="spinner" role="status" aria-hidden="true"></span>
                     <span v-if="isLoading"> Cadastrando...</span> <!-- Adicionei espaço -->
                     <span v-else>Cadastrar Usuário</span>
                  </button>
              </form>
          </div> <!-- Fim do auth-card (formulário) -->

          <!-- 9. Card da Lista de Usuários (só aparece se for admin) -->
          <div class="user-list-card" v-if="isAdmin">
              <!-- 10. Título da lista -->
              <h3 class="user-list-title">Usuários Existentes</h3>
              <!-- 11. Mensagem de carregamento -->
              <div v-if="isLoadingUsers" class="loading-users">
                  Carregando usuários... <span class="spinner"></span>
              </div>
              <!-- 12. Lista de usuários -->
              <div class="user-list" v-else-if="users.length > 0">
                   <ul>
                       <li v-for="user in users" :key="user.id">
                           <!-- 13. Span para info do usuário (opcional, mas ajuda a estilizar) -->
                           <span class="user-info">{{ user.username }}</span>
                           <!-- 14. Tag de role com classe dinâmica -->
                           <span class="role-tag" :class="user.role === 'admin' ? 'admin' : 'user'">
                               {{ user.role }}
                           </span>
                           <!-- Adicionar botões de editar/excluir aqui se desejar -->
                       </li>
                   </ul>
              </div>
              <!-- 15. Mensagem se não houver usuários -->
              <div v-else class="loading-users"> <!-- Reusa estilo de loading para mensagem -->
                  Nenhum outro usuário cadastrado.
              </div>
          </div> <!-- Fim do user-list-card -->

      </div> <!-- Fim do register-content-wrapper -->
  </div> <!-- Fim do auth-view-container -->
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import apiService from '@/services/apiService';
// CSS importado (correto)
import '@/styles/auth-styles.css';
import '@/styles/register-view.css'; // Específico para o layout da lista

const newUser = reactive({
  username: '',
  password: '',
  role: 'user'
});
const isLoading = ref(false); // Loading do formulário de cadastro
const feedbackMessage = ref('');
const isError = ref(false);

// Para listar usuários
const users = ref([]);
const isAdmin = ref(false);
const isLoadingUsers = ref(false); // Loading específico da lista de usuários

const fetchUsers = async () => {
    isLoadingUsers.value = true; // Inicia loading da lista
    try {
        const response = await apiService.getUsers();
        // Ordena para mostrar admins primeiro ou alfabeticamente (opcional)
        users.value = response.data.sort((a, b) => a.username.localeCompare(b.username));
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        feedbackMessage.value = 'Erro ao carregar lista de usuários.'; // Informa erro no feedback geral
        isError.value = true;
    } finally {
        isLoadingUsers.value = false; // Finaliza loading da lista
    }
}

onMounted(() => {
    const userStr = localStorage.getItem('authUser');
    if (userStr) {
        try {
            const currentUser = JSON.parse(userStr);
            if (currentUser.role === 'admin') {
                isAdmin.value = true;
                fetchUsers();
            }
        } catch (e) { console.error("Erro ao parsear usuário do localStorage", e); }
    }
});

const handleRegister = async () => {
  isLoading.value = true; // Loading do formulário
  feedbackMessage.value = '';
  isError.value = false;

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

  try {
    const response = await apiService.registerUser(newUser);
    feedbackMessage.value = `Usuário "${response.data.username}" cadastrado com sucesso!`;
    newUser.username = '';
    newUser.password = '';
    newUser.role = 'user';
    if(isAdmin.value) fetchUsers(); // Atualiza a lista após cadastro
  } catch (error) {
    console.error("Erro no cadastro:", error);
    isError.value = true;
    feedbackMessage.value = error.response?.data?.error || 'Erro ao cadastrar usuário.';
  } finally {
    isLoading.value = false; // Finaliza loading do formulário
  }
};
</script>

