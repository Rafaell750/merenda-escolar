<template>
    <div class="cadastro-escolas-container">
      <h1>Cadastro de Nova Escola</h1>
  
      <form @submit.prevent="submitForm" class="cadastro-form">
        <div class="form-group">
          <label for="nome">Nome da Escola <span class="required">*</span></label>
          <input type="text" id="nome" v-model="formData.nome" required>
        </div>
  
        <div class="form-group">
          <label for="endereco">Endereço</label>
          <input type="text" id="endereco" v-model="formData.endereco">
        </div>
  
        <div v-if="escolasStore.getError" class="error-message">
          {{ escolasStore.getError }}
        </div>
         <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>
  
        <button type="submit" :disabled="escolasStore.isLoading" class="submit-button">
          {{ escolasStore.isLoading ? 'Cadastrando...' : 'Cadastrar Escola' }}
        </button>
      </form>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { useEscolasStore } from '@/stores/escolas'; // Ajuste o caminho se necessário
  
  const escolasStore = useEscolasStore();
  const successMessage = ref('');
  
  const formData = ref({
    nome: '',
    endereco: '',
  });
  
  const submitForm = async () => {
    successMessage.value = ''; // Limpa mensagem de sucesso anterior
    try {
      await escolasStore.addEscola(formData.value);
      successMessage.value = `Escola "${formData.value.nome}" cadastrada com sucesso!`;
      // Limpar o formulário após o sucesso
      formData.value = { nome: '', endereco: ''};
      // O menu lateral será atualizado automaticamente pela reatividade do Pinia
    } catch (error) {
      // O erro já está sendo tratado no store e exibido pelo getError
      console.error("Falha no cadastro:", error);
      // Você pode adicionar lógica extra aqui se necessário
    }
  };
  </script>
  
  <style scoped>
  .cadastro-escolas-container {
    max-width: 600px;
    margin: 2rem auto;
    padding: 2rem;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  h1 {
    text-align: center;
    margin-bottom: 1.5rem;
    color: #333;
  }
  
  .cadastro-form {
    display: flex;
    flex-direction: column;
    gap: 1rem; /* Espaçamento entre os grupos */
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
  }
  
  .form-row {
    display: flex;
    gap: 1rem;
  }
  
  .form-row .form-group {
    flex: 1; /* Faz os campos na linha ocuparem espaço igual */
  }
  
  
  label {
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #555;
  }
  
  input[type="text"] {
    padding: 0.8rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  input[type="text"]:focus {
    outline: none;
    border-color: #007bff; /* Ou a cor primária do seu app */
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
  
  .required {
    color: red;
    margin-left: 2px;
  }
  
  .submit-button {
    padding: 0.8rem 1.5rem;
    background-color: #28a745; /* Verde */
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: background-color 0.2s ease;
    margin-top: 1rem; /* Espaço antes do botão */
  }
  
  .submit-button:hover:not(:disabled) {
    background-color: #218838; /* Verde mais escuro */
  }
  
  .submit-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .error-message {
    color: #dc3545; /* Vermelho */
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    padding: 0.8rem;
    border-radius: 4px;
    margin-top: 1rem;
    text-align: center;
  }
  .success-message {
    color: #155724; /* Verde escuro */
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    padding: 0.8rem;
    border-radius: 4px;
    margin-top: 1rem;
    text-align: center;
  }
  </style>