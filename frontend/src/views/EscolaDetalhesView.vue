<template>
    <div class="escola-detalhes-container">
      <h1>Escola: {{ escolaNome || 'Carregando...' }}</h1>
      <p>ID da Escola: {{ $route.params.id }}</p>
      <p><em>(Conteúdo específico da escola será adicionado aqui)</em></p>
  
      <!-- Exemplo: buscar detalhes da escola (opcional agora) -->
      <div v-if="loading">Carregando detalhes...</div>
      <div v-if="error" class="error-message">{{ error }}</div>
      <pre v-if="detalhesEscola">{{ detalhesEscola }}</pre>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from 'vue';
  import { useRoute } from 'vue-router';
  import axios from 'axios'; // Ou seu cliente HTTP
  
  const route = useRoute();
  const escolaId = computed(() => route.params.id); // Pega o ID da URL
  const escolaNome = ref(''); // Para exibir o nome rapidamente (pode vir do store ou fetch)
  const detalhesEscola = ref(null);
  const loading = ref(false);
  const error = ref(null);
  
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  
  // Função para buscar o nome (pode vir do store se já carregado) ou detalhes completos
  async function fetchDetalhesEscola() {
    loading.value = true;
    error.value = null;
    detalhesEscola.value = null; // Limpa detalhes anteriores
    const token = localStorage.getItem('authToken');
  
     if (!token) {
        error.value = 'Não autenticado.';
        loading.value = false;
        return;
     }
  
    try {
        // Busca detalhes completos da escola usando a rota /api/escolas/:id
        const response = await axios.get(`${API_URL}/escolas/${escolaId.value}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        detalhesEscola.value = response.data;
        escolaNome.value = response.data.nome; // Atualiza o nome
    } catch (err) {
        console.error('Erro ao buscar detalhes da escola:', err);
        error.value = err.response?.data?.message || 'Falha ao carregar detalhes da escola.';
        // Se não encontrar, pode setar um nome padrão ou mensagem de erro
        if (err.response?.status === 404) {
            escolaNome.value = "Escola não encontrada";
        }
    } finally {
        loading.value = false;
    }
  }
  
  // Buscar os detalhes quando o componente for montado ou o ID mudar
  onMounted(() => {
    fetchDetalhesEscola();
  });
  
  // Observar mudanças no parâmetro da rota (caso navegue entre escolas sem sair da view)
  // import { watch } from 'vue';
  // watch(escolaId, fetchDetalhesEscola); // Descomente se precisar
  </script>
  
  <style scoped>
  .escola-detalhes-container {
    padding: 2rem;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  h1 {
    color: #333;
    margin-bottom: 1rem;
  }
  p {
    color: #555;
    margin-bottom: 0.5rem;
  }
  em {
      color: #777;
  }
  pre {
      background-color: #f8f9fa;
      padding: 1rem;
      border-radius: 4px;
      border: 1px solid #e9ecef;
      white-space: pre-wrap; /* Quebra linha no JSON */
      word-wrap: break-word;
  }
  .error-message {
    color: #dc3545;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    padding: 0.8rem;
    border-radius: 4px;
    margin-top: 1rem;
  }
  </style>