<!-- /frontend/src/viws/Escolas/Historico/HistoricoRetiradasModal.vue -->
<template>
    <div v-if="show" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content historico-modal-content">
        <header class="modal-header">
          <h3>Histórico de Retiradas da {{ escolaNome }}:</h3>
          <button @click="closeModal" class="close-button" aria-label="Fechar modal">×</button>
        </header>
        <div class="modal-body">
          <p v-if="loading" class="loading-message">Carregando histórico de retiradas...</p>
          <p v-else-if="error" class="error-message">{{ error }}</p>
          <p v-else-if="!historicoRetiradas || historicoRetiradas.length === 0" class="empty-message">
            Nenhuma retirada registrada para esta escola.
          </p>
          <table v-else class="tabela-historico-retiradas">
            <thead>
              <tr>
                <th>Data/Hora da Retirada</th>
                <th>Produto</th>
                <th>Unidade</th>
                <th class="text-right">Qtd. Retirada</th>
                <th>Usuário que retirou</th>
              </tr>
            </thead>
            <tbody>
              <!-- ALTERAÇÃO: Iterar sobre 'paginatedHistorico' em vez de 'historicoRetiradas' -->
              <tr v-for="retirada in paginatedHistorico" :key="retirada.id || `${retirada.data_retirada_formatada}-${retirada.produto_id}-${Math.random()}`">
                <td>{{ formatarDataParaBrasilia(retirada.data_retirada) }}</td>
                <td>{{ retirada.nome_produto }}</td>
                <td>{{ retirada.unidade_medida }}</td>
                <td class="text-right">{{ retirada.quantidade_retirada }}</td>
                <td>{{ retirada.nome_usuario_retirada }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer class="modal-footer">
          <!-- INÍCIO: Seção de Paginação Adicionada -->
          <div v-if="totalPages > 1" class="pagination-controls">
            <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="pagination-button">
              « Anterior
            </button>
            <template v-for="(page, index) in pagesToDisplay">
            <!-- A chave para a elipse usa o índice para garantir unicidade -->
            <span v-if="page === '...'" :key="'ellipsis-' + index" class="pagination-ellipsis">...</span>
            <!-- A chave para o botão usa o número da página, que já é único -->
            <button
              v-else
              :key="page"
              @click="goToPage(page)"
              :class="['pagination-button', { active: page === currentPage }]"
            >
              {{ page }}
            </button>
          </template>
            <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" class="pagination-button">
              Próxima »
            </button>
          </div>
          <!-- FIM: Seção de Paginação Adicionada -->
          <button @click="closeModal" class="btn btn-primary">Fechar</button>
        </footer>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch, computed } from 'vue'; // ADIÇÃO: Importar 'computed'
  
  const props = defineProps({
    show: Boolean,
    escolaId: [String, Number],
    escolaNome: String,
    historicoRetiradas: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: null
    }
  });
  
  const emit = defineEmits(['close']);

  const formatarDataParaBrasilia = (dataStringUTC) => {
  if (!dataStringUTC) return 'Data Indisponível';
  try {
    const dataUTC = new Date(dataStringUTC + 'Z');
    if (isNaN(dataUTC.getTime())) {
      console.warn("Data inválida recebida:", dataStringUTC);
      return dataStringUTC;
    }
    return dataUTC.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    console.error("Erro ao formatar data:", dataStringUTC, e);
    return dataStringUTC;
  }
};
  
  function closeModal() {
    emit('close');
  }
  
  // --- INÍCIO: Lógica de Paginação ---
  
  const currentPage = ref(1);
  const itemsPerPage = 15;
  
  // Reseta a página para 1 sempre que o modal é aberto ou os dados mudam
  watch(() => props.historicoRetiradas, () => {
    currentPage.value = 1;
  });
  
  // Calcula o número total de páginas
  const totalPages = computed(() => {
    if (!props.historicoRetiradas || props.historicoRetiradas.length === 0) {
      return 0;
    }
    return Math.ceil(props.historicoRetiradas.length / itemsPerPage);
  });
  
  // Retorna apenas os itens da página atual
  const paginatedHistorico = computed(() => {
    if (!props.historicoRetiradas || props.historicoRetiradas.length === 0) {
      return [];
    }
    const startIndex = (currentPage.value - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return props.historicoRetiradas.slice(startIndex, endIndex);
  });
  
  // Gera a lista de páginas para exibição com elipses "..."
  const pagesToDisplay = computed(() => {
    if (totalPages.value <= 5) { // Se houver 7 ou menos páginas, mostra todas
      return Array.from({ length: totalPages.value }, (_, i) => i + 1);
    }
  
    const pages = [];
    // Lógica para mostrar 1, 2, ..., atual-1, atual, atual+1, ..., última_página
    if (currentPage.value < 4) {
      // Caso: estamos no início (ex: 1, 2, 3, 4, 5, ..., 10)
      pages.push(1, 2, 3, 4, '...', totalPages.value);
    } else if (currentPage.value > totalPages.value - 4) {
      // Caso: estamos no final (ex: 1, ..., 7, 8, 9, 10)
      pages.push(1, '...', totalPages.value - 4, totalPages.value - 3, totalPages.value - 2, totalPages.value - 1, totalPages.value);
    } else {
      // Caso: estamos no meio (ex: 1, ..., 4, 5, 6, ..., 10)
      pages.push(1, '...', currentPage.value - 1, currentPage.value, currentPage.value + 1, '...', totalPages.value);
    }
    return pages;
  });
  
  // Função para mudar de página
  function goToPage(pageNumber) {
    if (pageNumber >= 1 && pageNumber <= totalPages.value) {
      currentPage.value = pageNumber;
    }
  }
  
  // --- FIM: Lógica de Paginação ---
  
  </script>
  
  <style scoped>
  /* Estilos básicos do modal - sem alterações */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: #fff;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #eee;
    padding-bottom: 15px;
    margin-bottom: 15px;
  }
  
  .modal-header h3 {
    margin: 0;
    font-size: 1.4em;
    color: #333;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 1.8em;
    cursor: pointer;
    color: #888;
  }
  .close-button:hover {
    color: #333;
  }
  
  .modal-body {
    overflow-y: auto;
    padding: 10px 0;
    flex-grow: 1;
  }
  
  .tabela-historico-retiradas {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }
  
  .tabela-historico-retiradas th,
  .tabela-historico-retiradas td {
    border: 1px solid #ddd;
    padding: 10px;
    text-align: left;
    font-size: 0.9em;
  }
  
  .tabela-historico-retiradas th {
    background-color: #f8f9fa;
    font-weight: 600;
  }
  
  .text-right {
    text-align: right !important;
  }
  
  .empty-message, .loading-message, .error-message {
    padding: 20px;
    text-align: center;
    color: #666;
    font-style: italic;
  }
  .error-message {
    color: #dc3545;
    font-style: normal;
    font-weight: bold;
  }
  
  .modal-footer {
    /* ALTERAÇÃO: Ajustar o footer para acomodar a paginação e o botão */
    display: flex;
    justify-content: space-between; /* Alinha a paginação à esquerda e o botão à direita */
    align-items: center;
    border-top: 1px solid #eee;
    padding-top: 15px;
    margin-top: 20px;
  }
  
  .btn {
    padding: 10px 18px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    font-weight: 500;
  }
  
  .btn-primary {
    background-color: #007bff;
    color: white;
  }
  .btn-primary:hover {
    background-color: #0056b3;
  }
  
  /* --- INÍCIO: Estilos da Paginação --- */
  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .pagination-button {
    background-color: #fff;
    border: 1px solid #ddd;
    color: #007bff;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
    transition: background-color 0.2s, color 0.2s;
  }
  
  .pagination-button:hover:not(:disabled) {
    background-color: #e9ecef;
  }
  
  .pagination-button.active {
    background-color: #007bff;
    color: white;
    border-color: #007bff;
    font-weight: bold;
  }
  
  .pagination-button:disabled {
    color: #6c757d;
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  .pagination-ellipsis {
    padding: 8px 4px;
    color: #6c757d;
  }
  /* --- FIM: Estilos da Paginação --- */
  </style>