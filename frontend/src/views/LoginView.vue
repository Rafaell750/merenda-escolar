<!--
  /frontend/src/views/LoginView.vue

  Visão Geral:
  Este componente Vue.js é responsável por apresentar o formulário de login
  para os usuários da aplicação. Ele coleta as credenciais (usuário e senha),
  envia-as para o backend para autenticação e, em caso de sucesso, armazena
  o token de autenticação e os dados do usuário no localStorage, redirecionando
  o usuário para a página principal.

  Funcionalidades Principais:
  1.  FORMULÁRIO DE LOGIN:
      - Apresenta campos para "Usuário" e "Senha".
      - Ambos os campos são obrigatórios.
  2.  SUBMISSÃO E AUTENTICAÇÃO:
      - Ao submeter o formulário, a função `handleLogin` é chamada.
      - Utiliza o `apiService` para enviar uma requisição de login ao backend.
  3.  GERENCIAMENTO DE TOKEN E DADOS DO USUÁRIO:
      - Em caso de login bem-sucedido, o token de acesso (`accessToken`) e os dados
        do usuário (`user`) retornados pela API são armazenados no `localStorage`.
  4.  REDIRECIONAMENTO PÓS-LOGIN:
      - Após um login bem-sucedido, o usuário é redirecionado para a página inicial (`/`).
        Atualmente, isso é feito com `window.location.href = '/'`, o que causa uma
        recarregamento completo da página, garantindo que o `App.vue` leia os novos dados
        do `localStorage`.
  5.  FEEDBACK AO USUÁRIO:
      - Exibe um indicador de carregamento (spinner) no botão "Entrar" durante a
        tentativa de login.
      - Mostra mensagens de erro específicas (ex: "Usuário ou senha inválidos") ou
        genéricas em caso de falha na autenticação ou problemas na comunicação com a API.
  6.  LIMPEZA EM CASO DE ERRO:
      - Se o login falhar, qualquer `authToken` ou `authUser` preexistente no `localStorage`
        é removido para garantir um estado limpo.
  7.  ESTILIZAÇÃO:
      - Importa e utiliza estilos CSS definidos em `auth-styles.css` para a aparência
        do formulário e da view.

  Estrutura do Template:
  - `auth-view-container`: Container principal para centralizar o conteúdo.
  - `auth-card`: Card que envolve o formulário de login.
  - `auth-title`: Título "Login".
  - `auth-form`: Formulário HTML.
  - `form-group`: Agrupa label e input.
  - `form-label`: Rótulo dos campos.
  - `form-input`: Campos de texto para usuário e senha.
  - `feedback-message error-message`: Div para exibir mensagens de erro.
  - `submit-button`: Botão para submeter o formulário.
  - `spinner`: Indicador visual de carregamento.
-->
<template>
  <!-- 1. CONTAINER PRINCIPAL DA VIEW DE AUTENTICAÇÃO -->
  <!-- Centraliza o conteúdo de login na tela. -->
  <div class="auth-view-container">
    <!-- 2. CARD DE AUTENTICAÇÃO -->
    <!-- Elemento visual que agrupa o formulário de login. -->
    <div class="auth-card">
      <!-- 3. TÍTULO DO CARD -->
      <h2 class="auth-title">Login</h2>
      <!-- 4. FORMULÁRIO DE LOGIN -->
      <!-- `@submit.prevent="handleLogin"`: Chama a função handleLogin ao submeter, prevenindo o comportamento padrão do formulário. -->
      <form class="auth-form" @submit.prevent="handleLogin">
        <!-- 5. GRUPO DE CAMPO: USUÁRIO -->
        <div class="form-group">
          <!-- 6. RÓTULO DO CAMPO -->
          <label for="username" class="form-label">Usuário:</label>
          <!-- 7. CAMPO DE ENTRADA (INPUT) -->
          <!-- `v-model="username"`: Vincula o valor do input à variável reativa `username`. -->
          <input type="text" id="username" class="form-input" v-model="username" required placeholder="Digite seu usuário">
        </div>
        <!-- 5. GRUPO DE CAMPO: SENHA -->
        <div class="form-group">
          <label for="password" class="form-label">Senha:</label>
          <!-- `v-model="password"`: Vincula o valor do input à variável reativa `password`. -->
          <input type="password" id="password" class="form-input" v-model="password" required placeholder="Digite sua senha">
        </div>
        <!-- 8. MENSAGEM DE FEEDBACK/ERRO -->
        <!-- Exibida condicionalmente se `errorMessage` tiver valor. -->
        <div v-if="errorMessage" class="feedback-message error-message">{{ errorMessage }}</div>
        <!-- 9. BOTÃO DE SUBMISSÃO -->
        <!-- `:disabled="isLoading"`: Desabilita o botão durante o carregamento. -->
        <button type="submit" class="submit-button" :disabled="isLoading">
          <!-- Spinner de carregamento, visível se `isLoading` for true. -->
          <span v-if="isLoading" class="spinner" role="status" aria-hidden="true"></span>
          <!-- Texto do botão muda com base no estado de `isLoading`. -->
          <span v-if="isLoading"> Entrando...</span>
          <span v-else>Entrar</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
// --- BLOCO 1: IMPORTAÇÕES ---
import { ref } from 'vue'; // Para criar variáveis reativas.
import { useRouter } from 'vue-router'; // Para navegação programática.
import apiService from '@/services/apiService'; // Serviço para chamadas à API.
import '@/styles/auth-styles.css'; // Estilos CSS específicos para autenticação.

// --- BLOCO 2: ESTADO LOCAL DO COMPONENTE (REFS) ---
const username = ref('');       // Armazena o nome de usuário inserido.
const password = ref('');       // Armazena a senha inserida.
const isLoading = ref(false);   // Controla o estado de carregamento (ex: para o spinner).
const errorMessage = ref('');   // Armazena mensagens de erro a serem exibidas.
const router = useRouter();     // Instância do roteador Vue.

// --- BLOCO 3: FUNÇÃO DE LOGIN ---
/**
 * @function handleLogin
 * @description Processa a tentativa de login.
 * Define `isLoading` para true, limpa `errorMessage`.
 * Chama `apiService.login` com as credenciais.
 * Em caso de sucesso:
 *   - Armazena 'authToken' e 'authUser' no localStorage.
 *   - Redireciona para a página inicial ('/') usando `window.location.href`
 *     (causa uma recarga completa da página, o que é útil para App.vue ler o novo localStorage).
 * Em caso de erro:
 *   - Define `errorMessage` com uma mensagem apropriada.
 *   - Remove 'authToken' e 'authUser' do localStorage.
 * Finalmente, define `isLoading` para false.
 */
const handleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = ''; // Limpa mensagens de erro anteriores
  try {
    // Chama o serviço de API para realizar o login
    const response = await apiService.login(username.value, password.value);
    
    // Armazena o token de autenticação e os dados do usuário no localStorage
    localStorage.setItem('authToken', response.data.accessToken);
    localStorage.setItem('authUser', JSON.stringify(response.data.user));
    
    // Redireciona para a página inicial.
    // Usar window.location.href força uma recarga da página,
    // o que garante que o App.vue e outras partes da aplicação
    // leiam o novo estado do localStorage (token e usuário).
    // Uma alternativa seria usar router.push('/') e gerenciar o estado do usuário
    // de forma mais reativa globalmente (ex: com Pinia para autenticação).
    window.location.href = '/';
  } catch (error) {
    console.error("Erro no login:", error);
    // Define uma mensagem de erro com base no status da resposta ou um erro genérico.
    errorMessage.value = error.response?.status === 401 // Código 401 (Unauthorized)
      ? 'Usuário ou senha inválidos.'
      : 'Erro ao tentar fazer login. Tente novamente mais tarde.';
    
    // Limpa o localStorage em caso de falha no login para garantir consistência.
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  } finally {
    // Garante que o estado de carregamento seja desativado, independentemente do resultado.
    isLoading.value = false;
  }
};
</script>