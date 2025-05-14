<!-- /frontend/src/components/ConfirmarRecebimentoModal.vue -->
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
            <p class="info-text">Selecione as transferências que foram efetivamente recebidas pela escola.</p>
            <div v-for="transferencia in transferenciasPendentes" :key="transferencia.transferencia_id" class="transferencia-item">
              <div class="transferencia-info">
                <input
                  type="checkbox"
                  :id="'transferencia-' + transferencia.transferencia_id"
                  :value="transferencia.transferencia_id"
                  v-model="transferenciasSelecionadasIds"
                  class="checkbox-transferencia"
                />
                <label :for="'transferencia-' + transferencia.transferencia_id">
                  <strong>Envio de {{ transferencia.data_formatada }}</strong> (por {{ transferencia.nome_usuario }})
                </label>
              </div>
              <ul v-if="transferencia.itens && transferencia.itens.length > 0" class="itens-preview-lista">
                <li v-for="(item, index) in transferencia.itens.slice(0, 3)" :key="index">
                  {{ item.nome_produto }} (Qtd: {{ item.quantidade_enviada }})
                </li>
                <li v-if="transferencia.itens.length > 3" class="mais-itens">... e mais {{ transferencia.itens.length - 3 }} itens.</li>
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
            :disabled="isSubmitting || transferenciasSelecionadasIds.length === 0"
          >
            <span v-if="isSubmitting" class="spinner"></span>
            {{ isSubmitting ? 'Confirmando...' : 'Confirmar Recebimento Selecionado(s)' }}
          </button>
        </footer>
      </form>
    </dialog>
  </template>
  
  <script setup>
  import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
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
  const transferenciasSelecionadasIds = ref([]); // Array de IDs das transferências selecionadas
  const isLoading = ref(false);
  const error = ref(null);
  const isSubmitting = ref(false);
  
  async function fetchTransferenciasPendentes() {
    if (!props.escolaId) return;
    isLoading.value = true;
    error.value = null;
    transferenciasPendentes.value = [];
    transferenciasSelecionadasIds.value = []; // Limpa seleção
    const token = localStorage.getItem('authToken');
  
    if (!token) {
      error.value = "Não autenticado.";
      isLoading.value = false;
      return;
    }
  
    try {
      // Futura API: GET /api/transferencias/pendentes/por-escola/:escolaId
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
    if (transferenciasSelecionadasIds.value.length === 0 || isSubmitting.value) {
      return;
    }
    isSubmitting.value = true;
    error.value = null; // Limpa erro anterior de submit
    const token = localStorage.getItem('authToken');
  
    try {
      // Futura API: POST /api/transferencias/confirmar-recebimento
      const payload = {
          transferencia_ids: transferenciasSelecionadasIds.value,
          escola_id: props.escolaId // Pode ser útil para validação no backend
      };
      await axios.post(`${API_URL}/transferencias/confirmar-recebimento`, payload, {
          headers: { Authorization: `Bearer ${token}` }
      });
      emit('recebimento-confirmado'); // Informa o pai para recarregar os dados
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
        fetchTransferenciasPendentes(); // Busca ao abrir
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

    /* O overflow (scroll) do conteúdo é gerenciado pelo .modal-body.
       A dialog em si não deve ter scroll, apenas o .modal-body.
       overflow: visible é o padrão, mas para garantir que não esteja impedindo algo. */
    overflow: visible;
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

    justify-content: flex-end; /* alinha os botões à direita */
    align-items: center;
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