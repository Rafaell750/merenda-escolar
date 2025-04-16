<!-- /frontend/src/views/LoginView.vue-->
<template>
    <!-- 1. Container principal da view -->
    <div class="auth-view-container">
      <!-- 2. Card que envolve o conteúdo -->
      <div class="auth-card">
        <!-- 3. Título com a classe correta -->
        <h2 class="auth-title">Login</h2>
        <!-- 4. Formulário com a classe correta -->
        <form class="auth-form" @submit.prevent="handleLogin">
          <!-- 5. Grupo de formulário -->
          <div class="form-group">
            <!-- 6. Label com a classe correta -->
            <label for="username" class="form-label">Usuário:</label>
            <!-- 7. Input com a classe correta -->
            <input type="text" id="username" class="form-input" v-model="username" required placeholder="Digite seu usuário">
          </div>
          <div class="form-group">
            <label for="password" class="form-label">Senha:</label>
            <!-- 7. Input com a classe correta -->
            <input type="password" id="password" class="form-input" v-model="password" required placeholder="Digite sua senha">
          </div>
          <!-- 8. Mensagem de feedback com as classes corretas -->
          <div v-if="errorMessage" class="feedback-message error-message">{{ errorMessage }}</div>
          <!-- 9. Botão com a classe correta e spinner -->
          <button type="submit" class="submit-button" :disabled="isLoading">
            <span v-if="isLoading" class="spinner" role="status" aria-hidden="true"></span>
            <span v-if="isLoading"> Entrando...</span>
            <span v-else>Entrar</span>
          </button>
        </form>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import apiService from '@/services/apiService';
  import '@/styles/auth-styles.css';
  
  const username = ref('');
  const password = ref('');
  const isLoading = ref(false);
  const errorMessage = ref('');
  const router = useRouter();
  
  const handleLogin = async () => {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      const response = await apiService.login(username.value, password.value);
      localStorage.setItem('authToken', response.data.accessToken);
      localStorage.setItem('authUser', JSON.stringify(response.data.user));
      window.location.href = '/'; // Ou use router.push e gerencie estado global
    } catch (error) {
      console.error("Erro no login:", error);
      errorMessage.value = error.response?.status === 401
        ? 'Usuário ou senha inválidos.'
        : 'Erro ao tentar fazer login. Tente novamente mais tarde.';
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    } finally {
      isLoading.value = false;
    }
  };
  </script>