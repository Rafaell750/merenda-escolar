<!-- /frontend/src/views/Escolas/ConfirmarRecebimentoModal.vue --> 
<template>
  <!-- O <div> raiz é opcional se você não tiver mais nada no template, 
       mas vamos manter por segurança. -->
  <div>
    <!-- Modal Principal de Recebimento -->
    <dialog ref="dialogRef" class="confirmar-recebimento-modal" @close="onDialogClose">
      <form method="dialog" @submit.prevent>
        <header class="modal-header">
          <h2>Confirmar Recebimento de Estoque</h2>
          <button type="button" @click="closeModal" class="close-button" aria-label="Fechar">×</button>
        </header>

        <div class="modal-body">
          <p v-if="escolaNome">Confirmação para a escola: <strong>{{ escolaNome }}</strong></p>

          <div v-if="isLoading" class="loading-message">Carregando transferências pendentes...</div>
          <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
          <div v-if="error" class="error-message">{{ error }}</div>

          <div v-if="!isLoading && transferenciasPendentes.length === 0 && !error" class="empty-message">
            Nenhuma transferência pendente de confirmação para esta escola.
          </div>

          <div v-if="transferenciasPendentes.length > 0" class="transferencias-pendentes-lista">
            <p class="info-text">Selecione os itens que foram efetivamente recebidos pela escola.</p>
            
            <div v-for="transferencia in transferenciasPendentes" :key="transferencia.transferencia_id" class="transferencia-item">
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
              
              <ul v-if="transferencia.itens && transferencia.itens.length > 0" class="itens-selecao-lista">
                <li v-for="item in transferencia.itens" :key="item.produto_id" class="item-selecao-container">
                  <div class="item-checkbox-label">
                    <input
                      :id="'item-' + transferencia.transferencia_id + '-' + item.produto_id"
                      type="checkbox"
                      :checked="isItemSelected(transferencia.transferencia_id, item.produto_id)"
                      @change="toggleItemSelection(item, transferencia.transferencia_id)"
                      class="checkbox-item"
                    />
                    <label :for="'item-' + transferencia.transferencia_id + '-' + item.produto_id">
                      {{ item.nome_produto }} (Qtd. Enviado: {{ item.quantidade_enviada }} )
                    </label>
                  </div>
                  <div v-if="isItemSelected(transferencia.transferencia_id, item.produto_id)" class="quantidade-input-container">
                    <label :for="'qty-' + transferencia.transferencia_id + '-' + item.produto_id">Selecione a Qtd:</label>
                    <input
                      :id="'qty-' + transferencia.transferencia_id + '-' + item.produto_id"
                      type="number"
                      v-model.number="getItemSelecionado(transferencia.transferencia_id, item.produto_id).quantidade"
                      :max="item.quantidade_enviada"
                      min="0.01"
                      step="any"
                      class="quantidade-input"
                      @input="validarQuantidade(transferencia.transferencia_id, item.produto_id, item.quantidade_enviada)"
                    />
                  </div>
                </li>
              </ul>
              <div v-else class="sem-itens">Nenhum item detalhado neste envio.</div>
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <button type="button" @click="closeModal" class="cancel-button">Cancelar</button>
          <button type="button" @click="abrirModalConfirmacao('devolucao')" class="return-button" :disabled="isSubmittingDevolucao || itensValidosParaSubmissao.length === 0">Devolver Item(ns)</button>
          <button type="button" @click="abrirModalConfirmacao('recebimento')" class="submit-button" :disabled="isSubmitting || itensValidosParaSubmissao.length === 0">Confirmar Item(ns)</button>
        </footer>
      </form>
    </dialog>

    <!--
      NOVA MODAL DE CONFIRMAÇÃO INTERNA E DEDICADA
      Controlada por 'showInternalConfirmationModal'
    -->
<dialog v-if="showInternalConfirmationModal" ref="internalConfirmDialog" class="internal-confirm-modal">
  <div class="internal-confirm-content">
    <header class="internal-confirm-header">
      <span class="internal-confirm-icon" :class="internalConfirmationConfig.iconClass">
        <svg v-if="internalConfirmationConfig.actionToExecute === handleFormSubmit" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
        </svg>

        <!-- Ícone para Devolução (alerta amarelo) -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
          <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
        </svg>
      </span>
      <h3 class="internal-confirm-title">{{ internalConfirmationConfig.title }}</h3>
    </header>
    <div class="internal-confirm-body">
      <p class="internal-confirm-message">{{ internalConfirmationConfig.message }}</p>
    </div>
    <footer class="internal-confirm-footer">
      <button @click="showInternalConfirmationModal = false" class="btn-internal-cancel">
        Cancelar
      </button>
      <button @click="executarAcaoConfirmada" :class="internalConfirmationConfig.confirmButtonClass" class="btn-internal-confirm">
        {{ internalConfirmationConfig.confirmText }}
      </button>
    </footer>
  </div>
</dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed, reactive, nextTick } from 'vue';
import axios from 'axios';
import { useNotificationsStore } from '@/stores/notifications';

const props = defineProps({
  show: Boolean,
  escolaId: [Number, String],
  escolaNome: String
});

const emit = defineEmits(['close', 'recebimento-confirmado', 'devolucao-registrada']);

const dialogRef = ref(null);
const API_URL = import.meta.env.VITE_API_BASE_URL;

const notificationsStore = useNotificationsStore();
const transferenciasPendentes = ref([]);
const itensSelecionados = ref([]);
const isLoading = ref(false);
const error = ref(null);
const successMessage = ref(null);
const isSubmitting = ref(false);
const isSubmittingDevolucao = ref(false);

// --- LÓGICA PARA A NOVA MODAL DE CONFIRMAÇÃO INTERNA ---
const showInternalConfirmationModal = ref(false);
const internalConfirmDialog = ref(null); // Ref para o novo <dialog>
const internalConfirmationConfig = reactive({
  title: '',
  message: '',
  confirmText: 'Confirmar',
  confirmButtonClass: 'confirm-recebimento',
  iconClass: 'icon-recebimento',
  actionToExecute: null,
});

async function abrirModalConfirmacao(tipo) {
  if (itensValidosParaSubmissao.value.length === 0) return;

  if (tipo === 'recebimento') {
    internalConfirmationConfig.title = 'Confirmar Recebimento';
    internalConfirmationConfig.message = `Você tem certeza que deseja confirmar o recebimento de ${itensValidosParaSubmissao.value.length} item(ns) selecionado(s)?`;
    internalConfirmationConfig.confirmText = 'Sim, Confirmar';
    internalConfirmationConfig.confirmButtonClass = 'confirm-recebimento';
    internalConfirmationConfig.iconClass = 'icon-recebimento';
    internalConfirmationConfig.actionToExecute = handleFormSubmit;
  } else {
    internalConfirmationConfig.title = 'Confirmar Devolução';
    internalConfirmationConfig.message = `Você tem certeza que deseja registrar a devolução de ${itensValidosParaSubmissao.value.length} item(ns) selecionado(s)?`;
    internalConfirmationConfig.confirmText = 'Sim, Devolver';
    internalConfirmationConfig.confirmButtonClass = 'confirm-devolucao';
    internalConfirmationConfig.iconClass = 'icon-devolucao';
    internalConfirmationConfig.actionToExecute = handleDevolucaoSubmit;
  }

  showInternalConfirmationModal.value = true;
  await nextTick(); // Espera o <dialog> ser renderizado pelo v-if
  internalConfirmDialog.value?.showModal(); // Abre o novo dialog na top layer
}

const executarAcaoConfirmada = () => {
  if (typeof internalConfirmationConfig.actionToExecute === 'function') {
    internalConfirmationConfig.actionToExecute();
  }
  showInternalConfirmationModal.value = false;
  internalConfirmDialog.value?.close();
};

watch(showInternalConfirmationModal, (newValue) => {
    // Se a modal for fechada com ESC, o v-if a remove do DOM.
    // Isso evita a necessidade de um listener 'close' complexo.
    if (!newValue && internalConfirmDialog.value?.open) {
        internalConfirmDialog.value.close();
    }
});
// --- FIM DA LÓGICA DA MODAL INTERNA ---

// --- FUNÇÕES E LÓGICA DE SELEÇÃO (sem alterações) ---
const isItemSelected = (transferencia_id, produto_id) => itensSelecionados.value.some(item => item.transferencia_id === transferencia_id && item.produto_id === produto_id);
const getItemSelecionado = (transferencia_id, produto_id) => itensSelecionados.value.find(item => item.transferencia_id === transferencia_id && item.produto_id === produto_id);
const toggleItemSelection = (item, transferencia_id) => {
  const index = itensSelecionados.value.findIndex(i => i.transferencia_id === transferencia_id && i.produto_id === item.produto_id);
  if (index > -1) {
    itensSelecionados.value.splice(index, 1);
  } else {
    itensSelecionados.value.push({
      transferencia_id: transferencia_id,
      produto_id: item.produto_id,
      quantidade: item.quantidade_enviada,
    });
  }
};
const validarQuantidade = (transferencia_id, produto_id, max_quantidade) => {
    const item = getItemSelecionado(transferencia_id, produto_id);
    if (item) {
        if (item.quantidade > max_quantidade) item.quantidade = max_quantidade;
        if (item.quantidade < 0) item.quantidade = 0;
    }
}
const itensValidosParaSubmissao = computed(() => itensSelecionados.value.filter(item => item.quantidade && item.quantidade > 0));
const toggleTransferenciaSelection = (transferencia) => {
  const itensPendentesNaoSelecionados = transferencia.itens.filter(item => !isItemSelected(transferencia.transferencia_id, item.produto_id));
  if (itensPendentesNaoSelecionados.length > 0) {
    itensPendentesNaoSelecionados.forEach(item => {
      if (!isItemSelected(transferencia.transferencia_id, item.produto_id)) {
        itensSelecionados.value.push({
            transferencia_id: transferencia.transferencia_id,
            produto_id: item.produto_id,
            quantidade: item.quantidade_enviada
        });
      }
    });
  } else {
    const itensDaTransferencia = transferencia.itens.map(item => item.produto_id);
    itensSelecionados.value = itensSelecionados.value.filter(sel => sel.transferencia_id !== transferencia.transferencia_id || !itensDaTransferencia.includes(sel.produto_id));
  }
};
const isTransferenciaTotalmenteSelecionada = (transferencia) => {
    const itensPendentes = transferencia.itens.filter(item => !item.data_recebimento);
    if (itensPendentes.length === 0) return false;
    return itensPendentes.every(item => isItemSelected(transferencia.transferencia_id, item.produto_id));
};
const isTransferenciaParcialmenteSelecionada = (transferencia) => {
    const itensPendentes = transferencia.itens.filter(item => !item.data_recebimento);
    const selecionadosNestaTransferencia = itensSelecionados.value.filter(sel => sel.transferencia_id === transferencia.transferencia_id).length;
    return selecionadosNestaTransferencia > 0 && selecionadosNestaTransferencia < itensPendentes.length;
};

// --- LÓGICA DE API (sem alterações) ---
async function fetchTransferenciasPendentes() {
  if (!props.escolaId) return;
  isLoading.value = true;
  error.value = null;
  successMessage.value = null;
  transferenciasPendentes.value = [];
  itensSelecionados.value = [];
  const token = localStorage.getItem('authToken');
  try {
    const response = await axios.get(`${API_URL}/transferencias/pendentes/por-escola/${props.escolaId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    transferenciasPendentes.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.error || "Falha ao carregar transferências.";
  } finally {
    isLoading.value = false;
  }
}

async function handleFormSubmit() {
  if (itensValidosParaSubmissao.value.length === 0 || isSubmitting.value) return;
  isSubmitting.value = true;
  error.value = null;
  successMessage.value = null;
  const token = localStorage.getItem('authToken');
  try {
    await axios.post(`${API_URL}/transferencias/confirmar-recebimento`, {
        itens_processados: itensValidosParaSubmissao.value,
        escola_id: props.escolaId
    }, { headers: { Authorization: `Bearer ${token}` } });
    successMessage.value = "Itens confirmados com sucesso!";
    emit('recebimento-confirmado');
    setTimeout(() => closeModal(), 1500);
  } catch (err) {
    error.value = err.response?.data?.error || "Falha ao confirmar recebimento.";
  } finally {
    isSubmitting.value = false;
  }
}

async function handleDevolucaoSubmit() {
  if (itensValidosParaSubmissao.value.length === 0 || isSubmittingDevolucao.value) return;
  isSubmittingDevolucao.value = true;
  error.value = null;
  successMessage.value = null;
  const token = localStorage.getItem('authToken');
  try {
    const response = await axios.post(`${API_URL}/transferencias/registrar-devolucao`, {
        itens_processados: itensValidosParaSubmissao.value,
        escola_id: props.escolaId
    }, { headers: { Authorization: `Bearer ${token}` } });
    if (response.data.notification) {
      notificationsStore.addNotificacao(response.data.notification);
    }
    successMessage.value = response.data.message || "Devolução registrada com sucesso!";
    emit('devolucao-registrada');
    setTimeout(() => {
        fetchTransferenciasPendentes();
    }, 1500);
  } catch (err) {
    error.value = err.response?.data?.error || "Falha ao registrar devolução.";
  } finally {
    isSubmittingDevolucao.value = false;
  }
}

// --- CONTROLE DA MODAL PRINCIPAL (sem alterações) ---
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

const onDialogClose = () => emit('close');
const closeModal = () => emit('close');
onMounted(() => dialogRef.value?.addEventListener('close', onDialogClose));
onBeforeUnmount(() => dialogRef.value?.removeEventListener('close', onDialogClose));
</script>

<style scoped>
/* ========================================= */
/* ESTILOS PARA A NOVA MODAL DE CONFIRMAÇÃO  */
/* ========================================= */
.internal-confirm-modal {
  border: none;
  border-radius: 8px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.25);
  padding: 0;
  width: 90%;
  max-width: 450px;
  margin: auto;
  overflow: hidden; /* Garante que os cantos arredondados sejam aplicados aos filhos */
  z-index: 10000; /* Z-index alto para garantir que fique por cima */
}

.internal-confirm-modal::backdrop {
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(3px);
}

.internal-confirm-content {
  display: flex;
  flex-direction: column;
}

.internal-confirm-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.internal-confirm-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.internal-confirm-icon svg {
  width: 24px;
  height: 24px;
}

/* ADICIONE ESTAS DUAS CLASSES */
.icon-recebimento {
  color: #28a745; /* Verde para confirmação */
}

.icon-devolucao {
  color: #ffc107; /* Amarelo para alerta/devolução */
}

.icon-recebimento { color: #28a745; } /* Verde */
.icon-devolucao { color: #ffc107; } /* Amarelo */

.internal-confirm-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #343a40;
}

.internal-confirm-body {
  padding: 1.5rem;
}

.internal-confirm-message {
  margin: 0;
  line-height: 1.6;
  color: #495057;
  font-size: 0.95rem;
}

.internal-confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.internal-confirm-footer button {
  padding: 0.6rem 1.2rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.btn-internal-cancel {
  background-color: #6c757d;
  border-color: #6c757d;
  color: white;
}
.btn-internal-cancel:hover {
  background-color: #5a6268;
  border-color: #545b62;
}

.btn-internal-confirm.confirm-recebimento {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
}
.btn-internal-confirm.confirm-recebimento:hover {
  background-color: #218838;
  border-color: #1e7e34;
}

.btn-internal-confirm.confirm-devolucao {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #212529;
}
.btn-internal-confirm.confirm-devolucao:hover {
  background-color: #e0a800;
  border-color: #d39e00;
}


/* ================================================= */
/* SEUS ESTILOS ANTIGOS PARA A MODAL PRINCIPAL       */
/* ================================================= */
.confirmar-recebimento-modal {
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    padding: 0;
    width: clamp(300px, 90vw, 750px);
    max-height: calc(100vh - 40px);
    margin: auto;
}
.confirmar-recebimento-modal::backdrop {
    background-color: rgba(0,0,0,0.5);
    backdrop-filter: blur(3px);
}
.confirmar-recebimento-modal form {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: inherit;
}
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
    flex-shrink: 0;
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
    overflow-y: auto;
    flex-grow: 1;
}
.modal-body > p:first-of-type {
    margin-bottom: 1.2rem;
    font-size: 1rem;
    color: #495057;
}
.transferencias-pendentes-lista {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
.itens-selecao-lista {
    list-style: none;
    padding-left: 0.5rem;
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
    padding-left: calc(18px + 0.75rem);
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
    padding-left: calc(18px + 0.75rem);
}
.sem-itens {
    margin-top: 0.5rem;
}
.modal-footer {
    display: flex;
    justify-content: flex-end;
    align-items: baseline;
    padding: 1rem 1.5rem;
    border-top: 1px solid #dee2e6;
    background-color: #f8f9fa;
    gap: 0.75rem;
    flex-shrink: 0;
}
.modal-footer button {
    padding: 0.5rem 1rem;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    line-height: 1.2;
    border: 1px solid transparent;
    transition: all 0.2s ease;
    width: auto;
    min-width: unset;
    height: auto;
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
.return-button {
    background-color: #ffc107;
    color: #212529;
    border-color: #ffc107;
}
.return-button:hover:not(:disabled) {
    background-color: #e0a800;
    border-color: #d39e00;
}
.return-button:disabled {
    background-color: #ffeeba;
    border-color: #ffeeba;
    color: #6c757d;
    cursor: not-allowed;
}
.success-message {
    text-align: center;
    padding: 0.75rem 1rem;
    color: #155724;
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    border-radius: 4px;
    font-style: normal;
    margin-bottom: 1rem;
}
.item-selecao-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s;
}
.item-selecao-container:hover {
    background-color: #f8f9fa;
}
.item-checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-grow: 1;
}
.item-checkbox-label label {
    cursor: pointer;
}
.quantidade-input-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.quantidade-input-container label {
    font-size: 0.85rem;
    color: #495057;
}
.quantidade-input {
    width: 80px;
    padding: 0.3rem 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.9rem;
    text-align: right;
}
.quantidade-input:focus {
    outline: none;
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
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