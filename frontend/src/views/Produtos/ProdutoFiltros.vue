<!-- /frontend/src/views/Produtos/ProdutoFiltros.vue -->
<template>
    <div class="card filter-card">
      <h3 class="card-title filter-title">Opções de Filtro</h3>
      <!-- A tag form ainda é útil semanticamente -->
      <form @submit.prevent class="form-filtros">
        <!-- Filtro por Nome -->
        <div class="form-group">
          <label for="filtroNome" class="form-label">Nome:</label>
          <!-- O v-model já atualiza filtros.value.nome -->
          <input type="text" id="filtroNome" v-model="filtros.nome" class="form-input" placeholder="Buscar por nome...">
        </div>
  
        <!-- Filtro por Categoria -->
        <div class="form-group">
          <label for="filtroCategoria" class="form-label">Categoria:</label>
           <!-- O v-model já atualiza filtros.value.categoria -->
          <select id="filtroCategoria" v-model="filtros.categoria" class="form-select">
            <option value="">Todas</option>
            <option v-for="(label, key) in categorias" :key="key" :value="key">
              {{ label }}
            </option>
          </select>
        </div>
  
        <!-- Adicione mais filtros aqui... eles funcionarão da mesma forma -->
  
        <!-- Botões de Ação -->
        <div class="form-actions filter-actions">
          <!-- Botão Aplicar removido -->
          <!-- Botão Limpar mantido, pois sua ação (resetar filtros) é útil -->
          <button type="button" @click="limparFiltros" class="clear-button filter-button">Limpar Filtros</button>
        </div>
      </form>
    </div>
  </template>
  
  <script setup>
  // **** Importar watch ****
  import { ref, defineProps, defineEmits, watch } from 'vue';
  
  // Props (inalterado)
  const props = defineProps({
    categorias: {
      type: Object,
      required: true
    }
  });
  
  // Emits (inalterado)
  const emit = defineEmits(['filtros-atualizados']);
  
  // Estado reativo local (inalterado)
  const getInitialFiltros = () => ({
    nome: '',
    categoria: '',
  });
  const filtros = ref(getInitialFiltros());
  
  // --- Debounce --- (Simples implementação)
  let debounceTimer;
  const DEBOUNCE_DELAY = 300; // Milissegundos de espera após parar de digitar
  
  // **** Watch para emitir automaticamente ****
  watch(filtros, (novosValores) => {
    // Limpa o timer anterior se o usuário digitar novamente rápido
    clearTimeout(debounceTimer);
  
    // Define um novo timer
    debounceTimer = setTimeout(() => {
      // Emite uma cópia dos filtros após o delay
      // console.log('Emitindo filtros (debounced):', novosValores); // Para debug
      emit('filtros-atualizados', { ...novosValores });
    }, DEBOUNCE_DELAY); // Aplica delay apenas aqui
  
  }, { deep: true }); // 'deep: true' é crucial para observar mudanças dentro do objeto 'filtros'
  
  
  // Função para limpar os filtros (inalterada, mas o watch vai pegar a mudança)
  const limparFiltros = () => {
    // Limpa qualquer debounce pendente para evitar emissão atrasada do estado anterior
    clearTimeout(debounceTimer);
    filtros.value = getInitialFiltros();
    // O 'watch' será acionado pela linha acima,
    // e como o valor mudou instantaneamente, o debounce fará
    // com que a emissão ocorra após 300ms (ou imediatamente se preferir)
    // Para emissão imediata no limpar:
    // emit('filtros-atualizados', { ...filtros.value });
  };
  
  </script>
  
  <style scoped>
  /* Estilos específicos para o card de filtros (mantidos) */
  .filter-card {
    padding: 20px;
    background-color: #fdfdff;
    border: 1px solid #e8e8f3;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    align-self: flex-start;
  }
  
  .filter-title {
    margin-top: 0;
    margin-bottom: 25px;
    font-size: 1.25em;
    font-weight: 600;
    color: #333;
    text-align: center;
    border-bottom: 1px solid #eee;
    padding-bottom: 12px;
  }
  
  .form-filtros .form-group {
    margin-bottom: 18px;
  }
  
  .form-filtros .form-label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    font-size: 0.9em;
    color: #555;
  }
  
  .form-filtros .form-input,
  .form-filtros .form-select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-sizing: border-box;
    font-size: 0.95em;
    background-color: #fff;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  
  .form-filtros .form-input::placeholder {
      color: #aaa;
      opacity: 1;
  }
  
  
  .form-filtros .form-input:focus,
  .form-filtros .form-select:focus {
    outline: none;
    border-color: #80bdff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
  }
  
  .filter-actions {
    display: flex;
    justify-content: flex-end; /* Alinha o botão limpar à direita */
    margin-top: 25px;
  }
  
  /* Estilo do botão Limpar (agora pode ocupar menos espaço) */
  .filter-button.clear-button {
    background-color: #6c757d;
    color: white;
    flex-grow: 0; /* Não estica mais para preencher */
    padding: 10px 20px; /* Ajuste padding se necessário */
     /* Mantém hover/active */
     cursor: pointer;
     font-weight: 500;
     font-size: 0.95em;
     transition: background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
     border: none;
     border-radius: 5px;
  }
  .filter-button.clear-button:hover {
     opacity: 0.9;
     box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }
  .filter-button.clear-button:active {
      transform: scale(0.98);
      box-shadow: none;
  }
  
  </style>