<!--
  /frontend/src/views/LoginView.vue

  Visão Geral:
  Componente de login com design moderno, fundo com imagem, card com efeito 
  "glassmorphism", ícones nos inputs e funcionalidade de mostrar/ocultar senha.
-->
<template>
  <div class="auth-view-container login-page-theme">
    
    <!-- 1. LOGO OU NOME DA APLICAÇÃO -->
    <!-- Adiciona identidade visual à página. -->
    <div class="app-branding">
      <!-- Substitua por seu componente de logo ou simplemente um h1 -->
      <!-- <img src="/logo.svg" alt="Logo da Aplicação" class="app-logo"> -->
      <h1 class="page-main-title">Sistema de Estoque Escolar</h1>
    </div>

    <!-- 2. CARD DE AUTENTICAÇÃO -->
    <div class="auth-card">
      <h2 class="auth-title">Login</h2>
      
      <form class="auth-form" @submit.prevent="handleLogin">
        
        <!-- 3. CAMPO USUÁRIO COM ÍCONE -->
        <div class="form-group">
          <label for="username" class="form-label">Usuário:</label>
          <div class="input-wrapper">
            <!-- Ícone de Usuário (SVG Heroicons) -->
            <svg xmlns="http://www.w3.org/2000/svg" class="input-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
            </svg>
            <input type="text" id="username" class="form-input" v-model="username" required placeholder="Digite seu usuário">
          </div>
        </div>
        
        <!-- 4. CAMPO SENHA COM ÍCONE E TOGGLE DE VISIBILIDADE -->
        <div class="form-group">
          <label for="password" class="form-label">Senha:</label>
          <div class="input-wrapper">
            <!-- Ícone de Cadeado (SVG Heroicons) -->
            <svg xmlns="http://www.w3.org/2000/svg" class="input-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2h2v-1h1v-1l.293-.293A6 6 0 0118 8zm-6-3a4 4 0 100 8 4 4 0 000-8z" clip-rule="evenodd" />
            </svg>
            <input :type="passwordFieldType" id="password" class="form-input" v-model="password" required placeholder="Digite sua senha">
            <!-- Botão para mostrar/ocultar senha -->
            <button type="button" @click="togglePasswordVisibility" class="password-toggle-btn" aria-label="Mostrar ou ocultar senha">
              <!-- Ícone de Olho Aberto -->
              <svg v-if="passwordFieldType === 'password'" xmlns="http://www.w3.org/2000/svg" class="password-toggle-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
              </svg>
              <!-- Ícone de Olho Fechado -->
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="password-toggle-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.742L2.303 3.546A10.048 10.048 0 00.458 10c1.274 4.057 5.022 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 5. MENSAGEM DE ERRO -->
        <div v-if="errorMessage" class="feedback-message error-message">{{ errorMessage }}</div>
        
        <!-- 6. BOTÃO DE SUBMISSÃO -->
        <button type="submit" class="submit-button" :disabled="isLoading">
          <span v-if="isLoading" class="spinner" role="status" aria-hidden="true"></span>
          <span>{{ isLoading ? 'Entrando...' : 'Entrar' }}</span>
        </button>

        <!-- 7. INFORMAÇÃO ADICIONAL -->
        <div class="auth-links">
          <!-- A tag <a> foi trocada por <p> para remover o link -->
          <p class="auth-info-text">
            Não tem uma conta? <strong>Contate o administrador</strong>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import apiService from '@/services/apiService';


const username = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const router = useRouter();

// --- NOVO: Estado para controlar o tipo do campo de senha ---
const passwordFieldType = ref('password');

/**
 * @function togglePasswordVisibility
 * @description Alterna a visibilidade da senha entre 'password' e 'text'.
 */
const togglePasswordVisibility = () => {
  passwordFieldType.value = passwordFieldType.value === 'password' ? 'text' : 'password';
};

const handleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await apiService.login(username.value, password.value);
    localStorage.setItem('authToken', response.data.accessToken);
    localStorage.setItem('authUser', JSON.stringify(response.data.user));
    window.location.href = '/';
  } catch (error) {
    console.error("Erro no login:", error);
    errorMessage.value = error.response?.status === 401
      ? 'Usuário ou senha inválidos.'
      : 'Erro ao tentar fazer login. Tente novamente.';
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* /frontend/src/styles/auth-styles.css */
/* Estilos modernos e aprimorados para autenticação (Login e Cadastro) */

.login-page-theme {
    /* --- Variáveis do Tema de Login --- */
    --auth-primary-color: #6d28d9;
    --auth-primary-color-dark: #5b21b6;
    --auth-text-color-light: #f9fafb;
    --auth-text-muted-color-light: #d1d5db;
    --auth-border-color-light: rgba(255, 255, 255, 0.2);
    --auth-input-bg: rgba(0, 0, 0, 0.3);
    --auth-card-bg: rgba(30, 41, 59, 0.4);
    --auth-error-color: #fca5a5;
    --auth-error-bg: rgba(220, 38, 38, 0.3);
    --auth-border-radius-lg: 16px;
    --auth-border-radius-md: 10px;
    --auth-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    --auth-font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.auth-view-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    width: 100%;
    padding: 2rem 1rem;
    box-sizing: border-box;
    font-family: var(--auth-font-family);
    background-image: linear-gradient(rgba(17, 24, 39, 0.3), rgba(17, 24, 39, 0.3)), url('/images/login-background.jpg');
    background-size: cover;
    background-position: center;
}

.app-branding {
    text-align: center;
    margin-bottom: 2rem;
}

.page-main-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--auth-text-color-light);
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.auth-card {
    background: var(--auth-card-bg);
    backdrop-filter: blur(12px); /* Aumentei um pouco o blur para o efeito da imagem */
    -webkit-backdrop-filter: blur(12px);
    border-radius: var(--auth-border-radius-lg);
    border: 1px solid var(--auth-border-color-light);
    box-shadow: var(--auth-shadow);
    padding: 2.5rem 3rem;
    max-width: 450px;
    width: 100%;
    text-align: center;
}

.auth-title {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--auth-text-color-light);
    margin-bottom: 2rem;
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    text-align: left;
}

.form-label {
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--auth-text-muted-color-light);
    font-size: 0.875rem;
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}
.input-icon {
    position: absolute;
    left: 1rem;
    width: 1.25rem;
    height: 1.25rem;
    color: var(--auth-text-muted-color-light);
    transition: color 0.2s ease;
}

.form-input {
    width: 100%;
    padding: 0.9rem 1rem 0.9rem 3rem;
    background-color: var(--auth-input-bg);
    border: 1px solid transparent;
    border-radius: var(--auth-border-radius-md);
    font-size: 1rem;
    color: var(--auth-text-color-light);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.form-input::placeholder {
    color: var(--auth-text-muted-color-light);
    opacity: 0.7;
}

.input-wrapper:focus-within .input-icon {
    color: var(--auth-primary-color);
}
.input-wrapper:focus-within .form-input {
    outline: none;
    border-color: var(--auth-primary-color);
    box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.4);
}

.password-toggle-btn {
    position: absolute;
    right: 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}
.password-toggle-icon {
    width: 1.25rem;
    height: 1.25rem;
    color: var(--auth-text-muted-color-light);
    transition: color 0.2s ease;
}
.password-toggle-btn:hover .password-toggle-icon {
    color: var(--auth-text-color-light);
}

.feedback-message.error-message {
    background-color: var(--auth-error-bg);
    color: var(--auth-error-color);
    border: 1px solid rgba(220, 38, 38, 0.5);
    padding: 0.9rem 1.2rem;
    border-radius: var(--auth-border-radius-md);
    font-size: 0.9rem;
    text-align: center;
}

.submit-button {
    background-color: var(--auth-primary-color);
    color: white;
    padding: 0.9rem 1.5rem;
    border: none;
    border-radius: var(--auth-border-radius-md);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease;
    width: 100%;
    margin-top: 0.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
}
.submit-button:hover:not(:disabled) {
    background-color: var(--auth-primary-color-dark);
    transform: translateY(-2px);
}
.submit-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.auth-links {
    display: flex;
    justify-content: center;
    text-align: center;
    margin-top: 1rem;
}

.auth-info-text {
    color: var(--auth-text-muted-color-light);
    font-size: 0.875rem;
}

.auth-info-text strong {
    color: var(--auth-text-color-light);
    font-weight: 600;
}

@keyframes spinner-border { to { transform: rotate(360deg); } }
.spinner {
    display: inline-block;
    width: 1.1em;
    height: 1.1em;
    vertical-align: -0.125em;
    border: 0.18em solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spinner-border .75s linear infinite;
}

@media (max-width: 480px) {
    .auth-view-container {
        padding-top: 2rem;
        justify-content: flex-start;
    }
    .auth-card { padding: 2rem 1.5rem; }
    .page-main-title { font-size: 2rem; }
    .auth-title { font-size: 1.5rem; }
}
</style>