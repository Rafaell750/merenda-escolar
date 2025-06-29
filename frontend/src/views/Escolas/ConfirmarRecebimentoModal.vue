<!-- /frontend/src/views/Escolas/ConfirmarRecebimentoModal.vue --> 
<template>
  <dialog ref="dialogRef" class="confirmar-recebimento-modal" @close="onDialogClose">
    <form method="dialog" @submit.prevent="handleFormSubmit">
      <header class="modal-header">
        <h2>Confirmar Recebimento de Estoque</h2>
        <button type="button" @click="closeModal" class="close-button" aria-label="Fechar">×</button>
      </header>

      <div class="modal-body">
        <p v-if="escolaNome">Confirmação para a escola: <strong>{{ escolaNome }}</strong></p>

        <div v-if="isLoading" class="loading-message">Carregando transferências pendentes...</div>
        <div v-if="error" class="error-message">{{ error }}</div>

        <div v-if="!isLoading && transferenciasPendentes.length === 0 && !error" class="empty-message">
          Nenhuma transferência pendente de confirmação para esta escola.
        </div>

        <div v-if="transferenciasPendentes.length > 0" class="transferencias-pendentes-lista">
          <p class="info-text">Selecione os itens que foram efetivamente recebidos pela escola.</p>
          
          <!-- NOVO: Loop por transferência -->
          <div v-for="transferencia in transferenciasPendentes" :key="transferencia.transferencia_id" class="transferencia-item">
            
            <!-- NOVO: Checkbox "mestre" para a transferência -->
            <div class="transferencia-info">
              <input
                type="checkbox"
                :id="'transferencia-master-' + transferencia.transferencia_id"
                @change="toggleTransferenciaSelection(transferencia)"
                :checked="isTransferenciaTotalmenteSelecionada(transferencia)"
                :indeterminate="isTransferenciaParcialmenteSelecionada(transferencia)"
                class="checkbox-transferencia"
              />
              <label :for="'transferencia-master-' + transferencia.transferencia_id">
                <strong>Envio de {{ transferencia.data_formatada }}</strong> (por {{ transferencia.nome_usuario }})
              </label>
            </div>
            
            <!-- NOVO: Lista de itens individuais para seleção -->
            <ul v-if="transferencia.itens && transferencia.itens.length > 0" class="itens-selecao-lista">
              <li v-for="item in transferencia.itens" :key="item.produto_id">
                <input
                  :id="'item-' + transferencia.transferencia_id + '-' + item.produto_id"
                  type="checkbox"
                  :checked="isItemSelected(transferencia.transferencia_id, item.produto_id)"
                  @change="toggleItemSelection(item, transferencia.transferencia_id)"
                  :disabled="!!item.data_recebimento" 
                  class="checkbox-item"
                />
                <label :for="'item-' + transferencia.transferencia_id + '-' + item.produto_id" :class="{ 'item-confirmado': !!item.data_recebimento }">
                  {{ item.nome_produto }} (Quantidade: {{ item.quantidade_enviada }})
                  <span v-if="item.data_recebimento" class="confirmado-badge">(Já Confirmado)</span>
                </label>
              </li>
            </ul>
            <div v-else class="sem-itens">Nenhum item detalhado neste envio.</div>
          </div>
        </div>
      </div>

      <footer class="modal-footer">
        <button type="button" @click="closeModal" class="cancel-button">Cancelar</button>
        <button
          type="submit"
          class="submit-button"
          :disabled="isSubmitting || itensSelecionados.length === 0"
        >
          <span v-if="isSubmitting" class="spinner"></span>
          {{ isSubmitting ? 'Confirmando...' : 'Confirmar Item(ns) Selecionado(s)' }}
        </button>
      </footer>
    </form>
  </dialog>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'; // Adicionado computed
import axios from 'axios';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  escolaId: {
    type: [Number, String],
    required: true
  },
  escolaNome: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'recebimento-confirmado']);

const dialogRef = ref(null);
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const transferenciasPendentes = ref([]);
// ALTERADO: A estrutura de seleção agora armazena objetos de item.
const itensSelecionados = ref([]); // Ex: [{ transferencia_id: 1, produto_id: 10 }, ...]
const isLoading = ref(false);
const error = ref(null);
const isSubmitting = ref(false);

// --- NOVAS FUNÇÕES E LÓGICA DE SELEÇÃO ---

// Verifica se um item específico está selecionado
const isItemSelected = (transferencia_id, produto_id) => {
  return itensSelecionados.value.some(
    item => item.transferencia_id === transferencia_id && item.produto_id === produto_id
  );
};

// Adiciona ou remove um item da seleção
const toggleItemSelection = (item, transferencia_id) => {
  const itemParaAdicionar = {
    transferencia_id: transferencia_id,
    produto_id: item.produto_id
  };
  
  const index = itensSelecionados.value.findIndex(
    i => i.transferencia_id === itemParaAdicionar.transferencia_id && i.produto_id === itemParaAdicionar.produto_id
  );

  if (index > -1) {
    itensSelecionados.value.splice(index, 1); // Remove se já existe
  } else {
    itensSelecionados.value.push(itemParaAdicionar); // Adiciona se não existe
  }
};

// Seleciona ou desmarca todos os itens (não confirmados) de uma transferência
const toggleTransferenciaSelection = (transferencia) => {
  const itensPendentesNaoSelecionados = transferencia.itens.filter(
      item => !item.data_recebimento && !isItemSelected(transferencia.transferencia_id, item.produto_id)
  );

  if (itensPendentesNaoSelecionados.length > 0) {
    // Se há itens pendentes para selecionar, seleciona todos
    itensPendentesNaoSelecionados.forEach(item => {
        itensSelecionados.value.push({
            transferencia_id: transferencia.transferencia_id,
            produto_id: item.produto_id
        });
    });
  } else {
    // Se todos os itens pendentes já estão selecionados, desmarca todos
    const itensPendentesDaTransferencia = transferencia.itens
        .filter(item => !item.data_recebimento)
        .map(item => item.produto_id);
    
    itensSelecionados.value = itensSelecionados.value.filter(
        sel => sel.transferencia_id !== transferencia.transferencia_id || !itensPendentesDaTransferencia.includes(sel.produto_id)
    );
  }
};

// Computado para o estado do checkbox "mestre"
const isTransferenciaTotalmenteSelecionada = (transferencia) => {
    const itensPendentes = transferencia.itens.filter(item => !item.data_recebimento);
    if (itensPendentes.length === 0) return false; // Não pode ser "totalmente selecionada" se não há nada para selecionar
    return itensPendentes.every(item => isItemSelected(transferencia.transferencia_id, item.produto_id));
};

const isTransferenciaParcialmenteSelecionada = (transferencia) => {
    const itensPendentes = transferencia.itens.filter(item => !item.data_recebimento);
    const selecionadosNestaTransferencia = itensSelecionados.value.filter(sel => sel.transferencia_id === transferencia.transferencia_id).length;
    return selecionadosNestaTransferencia > 0 && selecionadosNestaTransferencia < itensPendentes.length;
};


// --- LÓGICA EXISTENTE (MODIFICADA ONDE NECESSÁRIO) ---

async function fetchTransferenciasPendentes() {
  if (!props.escolaId) return;
  isLoading.value = true;
  error.value = null;
  transferenciasPendentes.value = [];
  itensSelecionados.value = []; // Limpa seleção de itens
  const token = localStorage.getItem('authToken');

  if (!token) {
    error.value = "Não autenticado.";
    isLoading.value = false;
    return;
  }

  try {
    const response = await axios.get(`${API_URL}/transferencias/pendentes/por-escola/${props.escolaId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    transferenciasPendentes.value = response.data;
  } catch (err) {
    console.error("Erro ao buscar transferências pendentes:", err);
    error.value = err.response?.data?.error || "Falha ao carregar transferências pendentes.";
  } finally {
    isLoading.value = false;
  }
}

async function handleFormSubmit() {
  // ALTERADO: Verifica a nova estrutura de seleção
  if (itensSelecionados.value.length === 0 || isSubmitting.value) {
    return;
  }
  isSubmitting.value = true;
  error.value = null;
  const token = localStorage.getItem('authToken');

  try {
    // ALTERADO: Envia o novo payload com os itens selecionados
    const payload = {
        itens_confirmados: itensSelecionados.value,
        escola_id: props.escolaId
    };
    await axios.post(`${API_URL}/transferencias/confirmar-recebimento`, payload, {
        headers: { Authorization: `Bearer ${token}` }
    });
    emit('recebimento-confirmado');
    closeModal();
  } catch (err) {
    console.error("Erro ao confirmar recebimento:", err);
    error.value = err.response?.data?.error || "Falha ao confirmar recebimento. Faça login novamente";
  } finally {
    isSubmitting.value = false;
  }
}

watch(() => props.show, (newValue) => {
  const dialog = dialogRef.value;
  if (dialog) {
    if (newValue && !dialog.open) {
      dialog.showModal();
      fetchTransferenciasPendentes();
    } else if (!newValue && dialog.open) {
      dialog.close();
    }
  }
});

const onDialogClose = () => {
  emit('close');
};

const closeModal = () => {
  if (dialogRef.value && dialogRef.value.open) {
    dialogRef.value.close();
  } else {
    emit('close');
  }
};

onMounted(() => {
    const dialog = dialogRef.value;
    if (dialog) {
        dialog.addEventListener('close', onDialogClose);
    }
});

onBeforeUnmount(() => {
    const dialog = dialogRef.value;
    if (dialog) {
        dialog.removeEventListener('close', onDialogClose);
    }
});
</script>
  
  <style scoped>
  .confirmar-recebimento-modal {
    /* Aparência */
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    padding: 0; /* Padding interno é nos filhos (header, body, footer) */

    /* Dimensionamento e Limites */
    /* Usamos clamp para uma largura responsiva: mínimo 300px, idealmente 90% da viewport, máximo 750px */
    width: clamp(300px, 90vw, 750px);
    max-height: calc(100vh - 40px); /* Deixa 20px de margem em cima e embaixo */

    /* Centralização:
       Uma <dialog> com .showModal() é posicionada como 'fixed' na camada superior.
       'margin: auto' deve centralizá-la. Se foi sobrescrito, vamos tentar reforçar. */
    margin: auto;
  }

  .confirmar-recebimento-modal::backdrop {
    background-color: rgba(0,0,0,0.5);
    backdrop-filter: blur(3px);
  }

  /* O form é o container principal do conteúdo da modal e é o FLEX CONTAINER */
  .confirmar-recebimento-modal form {
    display: flex;
    flex-direction: column;
    width: 100%; /* Ocupa toda a largura da dialog */
    /* height: 100% faz o form ter a mesma altura da dialog.
       Crucial para flex-grow no modal-body funcionar quando a dialog atinge max-height. */
    height: 100%;
    overflow: hidden; /* Para que os border-radius da dialog sejam respeitados pelo form */
    border-radius: inherit; /* Herda o border-radius da dialog pai */
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
    flex-shrink: 0; /* Header não encolhe */
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #333;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.8rem;
    line-height: 1;
    color: #6c757d;
    cursor: pointer;
    padding: 0 0.5rem;
  }
  .close-button:hover {
    color: #333;
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto; /* Permite scroll SÓ no body */
    flex-grow: 1; /* Faz o body ocupar o espaço vertical disponível */
  }

  /* ... (copie o restante dos seus estilos para .modal-body > p, transferencias, itens, footer, botões, spinner, mensagens de erro/loading/empty, etc. daqui para baixo) ... */
  .modal-body > p:first-of-type { /* Parágrafo com nome da escola */
      margin-bottom: 1.2rem;
      font-size: 1rem;
      color: #495057;
  }

  .transferencias-pendentes-lista {
      display: flex;
      flex-direction: column;
      gap: 1rem;
  }
  
  /* NOVO: Estilos para a lista de seleção de itens */
.itens-selecao-lista {
    list-style: none;
    padding-left: 0.5rem; /* Leve indentação */
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
}

.itens-selecao-lista li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.checkbox-item {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    accent-color: #28a745;
}

.itens-selecao-lista label {
    font-size: 0.9rem;
    color: #444;
    cursor: pointer;
    line-height: 1.4;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.itens-selecao-lista label.item-confirmado {
    color: #6c757d;
    cursor: not-allowed;
}

.confirmado-badge {
    font-size: 0.7rem;
    font-weight: bold;
    color: #1e7e34;
    background-color: #d4edda;
    padding: 2px 5px;
    border-radius: 4px;
}

  .info-text {
      font-size: 0.85rem;
      color: #6c757d;
      margin-bottom: 0.5rem;
      background-color: #e9ecef;
      padding: 0.5rem 0.8rem;
      border-radius: 4px;
  }

  .transferencia-item {
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 0.8rem 1rem;
      background-color: #fdfdfd;
  }

  .transferencia-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
  }

  .checkbox-transferencia {
      width: 18px;
      height: 18px;
      accent-color: #007bff;
      flex-shrink: 0;
  }

  .transferencia-info label {
      font-size: 0.95rem;
      color: #333;
      cursor: pointer;
      line-height: 1.4;
  }

  .transferencia-info label strong {
      font-weight: 600;
  }

  .itens-preview-lista {
      list-style: none;
      padding-left: calc(18px + 0.75rem); /* Alinha com o texto do label (largura checkbox + gap) */
      margin: 0.3rem 0 0 0;
      font-size: 0.8rem;
      color: #555;
  }

  .itens-preview-lista li {
      padding: 0.1rem 0;
  }

  .mais-itens, .sem-itens {
      font-style: italic;
      color: #777;
      padding-left: calc(18px + 0.75rem); /* Mesmo alinhamento se estiver fora da lista */
  }
  .sem-itens {
      margin-top: 0.5rem;
  }


  .modal-footer {
    display: flex;
    justify-content: flex-end; /* alinha os botões à direita */
    align-items: baseline;
    padding: 1rem 1.5rem;
    border-top: 1px solid #dee2e6;
    background-color: #f8f9fa;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .modal-footer button {
    padding: 0.5rem 1rem; /* tamanho mais compacto */
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    line-height: 1.2;
    border: 1px solid transparent;
    transition: all 0.2s ease;
    width: auto; /* largura automática conforme o texto */
    min-width: unset; /* remove a largura mínima fixa */
    height: auto; /* altura automática */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  .cancel-button {
    background-color: #6c757d;
    color: white;
    border-color: #6c757d;
  }
  .cancel-button:hover {
    background-color: #5a6268;
    border-color: #545b62;
  }

  .submit-button {
    background-color: #28a745;
    color: white;
    border-color: #28a745;

  }
  .submit-button:hover:not(:disabled) {
    background-color: #218838;
    border-color: #1e7e34;
  }

  .submit-button:disabled {
    background-color: #a5d6a7;
    border-color: #a5d6a7;
    color: #6c757d;
    cursor: not-allowed;
  }

  .spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    vertical-align: -0.125em;
    border: .2em solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spinner-border .75s linear infinite;
    margin-right: 0.6rem;
  }

  @keyframes spinner-border {
    to { transform: rotate(360deg); }
  }

  .loading-message, .empty-message, .error-message {
    text-align: center;
    padding: 1.5rem 1rem;
    color: #6c757d;
    font-style: italic;
    font-size: 0.95rem;
  }

  .error-message {
    color: #721c24;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    font-style: normal;
  }
</style>