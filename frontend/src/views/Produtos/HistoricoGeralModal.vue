<!-- frontend/src/views/Produtos/HistoricoGeralModal.vue -->
<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-title-geral">
        <header class="modal-header">
          <!-- Título alterado -->
          <h2 id="modal-title-geral" class="modal-title">Histórico Geral de Produtos</h2>
          <button @click="$emit('close')" class="close-button" aria-label="Fechar modal">&times;</button>
        </header>

        <main class="modal-body">
          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Carregando histórico...</p>
          </div>
          <div v-else-if="error" class="error-state">
            <p>{{ error }}</p>
          </div>
          <div v-else-if="historico.length === 0" class="empty-state">
            <p>Nenhum registro de histórico encontrado.</p>
          </div>
          <ul v-else class="history-list">
            <li v-for="item in historico" :key="item.id" class="history-item" :class="`action-${item.acao.toLowerCase()}`">
              <div class="history-item-header">
                <span class="action-badge">{{ formatAction(item.acao) }}</span>
                <span class="action-date">{{ formatDateTime(item.data_acao) }}</span>
              </div>
              <!-- Exibindo o nome do produto para cada item do histórico -->
              <h4 class="product-name-snapshot">Produto: {{ item.produto_nome_snapshot }}</h4>
              <div class="history-item-body">
                <p class="action-details">{{ item.detalhes }}</p>
              </div>
              <div class="history-item-footer">
                <span class="action-user">Por: {{ item.usuario_username_snapshot || 'Sistema' }}</span>
              </div>
            </li>
          </ul>
        </main>
        <!-- NOVO: Adiciona o componente de paginação no rodapé do modal -->
        <footer class="modal-footer">
            <PaginationControls
                v-if="pagination.totalPages > 1"
                :current-page="pagination.currentPage"
                :total-pages="pagination.totalPages"
                @page-changed="handlePageChange"
            />
        </footer>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useToast } from 'vue-toastification';
import PaginationControls from '@/components/PaginationControls.vue';

const API_URL = import.meta.env.VITE_API_BASE_URL;
const toast = useToast();

const props = defineProps({
  show: Boolean,
});

defineEmits(['close']);

const historico = ref([]);
const isLoading = ref(false);
const error = ref('');

const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  limit: 10 // Deve corresponder ao padrão do backend
});

const fetchHistorico = async (page = 1) => {
  isLoading.value = true;
  error.value = '';
  // Não limpa o histórico aqui para uma transição mais suave entre páginas
  
  try {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error("Autenticação necessária.");

    // MODIFICADO: Adiciona parâmetros de paginação à URL
    const url = new URL(`${API_URL}/historico/produtos`);
    url.searchParams.append('page', page);
    url.searchParams.append('limit', pagination.value.limit);

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Falha ao buscar o histórico.');
    }

    const data = await response.json();

    historico.value = data.items;
    pagination.value = data.pagination;

  } catch (err) {
    console.error("Erro ao buscar histórico geral:", err);
    error.value = `Não foi possível carregar o histórico: ${err.message}`;
    toast.error(error.value);
  } finally {
    isLoading.value = false;
  }
};

// NOVO: Handler para o evento do componente de paginação
const handlePageChange = (newPage) => {
    fetchHistorico(newPage);
};

// MODIFICADO: O watch agora chama fetchHistorico com a página 1 quando o modal é aberto
watch(() => props.show, (newValue) => {
  if (newValue) {
    fetchHistorico(1); // Sempre busca a primeira página ao abrir
  }
});

const formatAction = (acao) => {
  const map = {
    'CRIACAO': 'Criação', 'EDICAO': 'Edição',
    'EXCLUSAO': 'Exclusão', 'REABASTECIMENTO': 'Reabastecimento'
  };
  return map[acao] || acao;
};

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return '-';
  return new Date(dateTimeString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
};
</script>

<style scoped>

.modal-footer {
    border-top: 1px solid #eee;
    padding-top: 1rem;
    margin-top: 1rem;
}

/* Adicione este novo estilo para o nome do produto */
.product-name-snapshot {
    font-size: 1rem;
    font-weight: 600;
    color: #0056b3; /* Cor de destaque para o nome do produto */
    margin: 0.5rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px dashed #ccc;
}
/* Estilos para o Modal, Overlay, Spinner, etc. - Pode reusar estilos de outros modais */
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
.modal-container {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  width: 90%;
  max-width: 750px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}
.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}
.close-button {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  line-height: 1;
  color: #888;
}
.modal-body {
  overflow-y: auto;
  flex-grow: 1;
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}
.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.history-item {
  border: 1px solid #e0e0e0;
  border-left-width: 5px;
  border-radius: 4px;
  padding: 0.8rem 1rem;
  margin-bottom: 0.75rem;
}
.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.action-badge {
  font-weight: bold;
  padding: 0.2em 0.6em;
  border-radius: 10px;
  font-size: 0.8rem;
  color: white;
}
.action-date {
  font-size: 0.8rem;
  color: #777;
}
.action-details {
  font-size: 0.95rem;
  color: #333;
  margin: 0 0 0.5rem 0;
}
.history-item-footer {
  text-align: right;
}
.action-user {
  font-size: 0.8rem;
  font-style: italic;
  color: #555;
}

/* Cores por ação */
.action-criacao { border-left-color: #28a745; }
.action-criacao .action-badge { background-color: #28a745; }

.action-edicao { border-left-color: #ffc107; }
.action-edicao .action-badge { background-color: #ffc107; color: #333;}

.action-reabastecimento { border-left-color: #17a2b8; }
.action-reabastecimento .action-badge { background-color: #17a2b8; }

.action-exclusao { border-left-color: #dc3545; }
.action-exclusao .action-badge { background-color: #dc3545; }

.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
</style>