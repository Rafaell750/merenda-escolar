<template>
    <Transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
          <header class="modal-header">
            <h2 id="modalTitle" class="modal-title">Reabastecer Estoque Central</h2>
            <button @click="closeModal" class="close-button icon-only" aria-label="Fechar modal">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
              </svg>
            </button>
          </header>
  
          <main class="modal-body">
            <div v-if="isLoadingProdutos" class="loading-state">Carregando produtos...</div>
            <div v-else-if="!itensParaReabastecer || itensParaReabastecer.length === 0" class="empty-state">
              Nenhum produto disponível para reabastecimento.
            </div>
            <form v-else @submit.prevent="handleSubmit">
              <div class="table-responsive">
                <table class="reabastecimento-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th class="text-right">Estoque Atual</th>
                      <th class="text-center math-operator-header" aria-label="Operação de adição"></th>
                      <th class="text-center">Adicionar</th>
                      <th class="text-right">Estoque Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in itensParaReabastecer" :key="item.produto_id">
                      <td :data-label="item.nome">{{ item.nome }} <small>({{ item.unidade_medida }})</small></td>
                      <td data-label="Estoque Atual:" class="text-right">{{ item.quantidade_atual }}</td>
                      <td data-label="Operador:" class="text-center math-operator-cell">+</td>
                      <td data-label="Adicionar:" class="input-cell">
                        <input
                          type="number"
                          v-model.number="item.quantidade_adicionar"
                          min="0"
                          step="any"
                          class="form-input-small"
                          placeholder="0"
                          @input="validarQuantidadeAdicionar(item)"
                        />
                      </td>
                      <td data-label="Estoque Final:"
                        class="text-right"
                        :class="{ 'highlight-final-stock': item.quantidade_adicionar && Number(item.quantidade_adicionar) > 0 }">
                        {{ calcularEstoqueFinal(item) }}
                    </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="errorMessage" class="feedback-message error">
                {{ errorMessage }}
              </div>
            </form>
          </main>
  
          <footer class="modal-footer">
            <button @click="closeModal" type="button" class="button-secondary">Cancelar</button>
            <button
              @click="handleSubmit"
              type="button"
              class="button-primary"
              :disabled="isLoading || !hasItensParaConfirmar"
            >
              <span v-if="isLoading" class="spinner"></span>
              {{ isLoading ? 'Confirmando...' : 'Confirmar Reabastecimento' }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </template>
  
  <script setup>
  import { ref, watch, computed } from 'vue';
  import { useToast } from 'vue-toastification';
  
  const props = defineProps({
    show: Boolean,
    produtos: Array, // Lista de produtos do estoque central
  });
  
  const emit = defineEmits(['close', 'confirmar-reabastecimento']);
  
  const toast = useToast();
  const itensParaReabastecer = ref([]);
  const isLoading = ref(false);
  const isLoadingProdutos = ref(false); // Para simular carregamento se necessário
  const errorMessage = ref('');
  
  // Popula a lista de itens para reabastecimento quando o modal é aberto ou produtos mudam
  watch(() => props.show, (newVal) => {
    if (newVal && props.produtos) {
      errorMessage.value = '';
      isLoadingProdutos.value = true;
      // Simula um pequeno delay para UX, se desejar
      setTimeout(() => {
        itensParaReabastecer.value = props.produtos.map(p => ({
          produto_id: p.id,
          nome: p.nome,
          unidade_medida: p.unidade_medida,
          quantidade_atual: p.quantidade !== null && p.quantidade !== undefined ? Number(p.quantidade) : 0,
          quantidade_adicionar: null, // Ou 0, dependendo da preferência
        })).sort((a, b) => a.nome.localeCompare(b.nome)); // Ordena por nome
        isLoadingProdutos.value = false;
      }, 100); // Pequeno delay para o "carregando"
    } else if (!newVal) {
      // Limpa ao fechar
      itensParaReabastecer.value = [];
      errorMessage.value = '';
    }
  }, { immediate: true });
  
  
  const validarQuantidadeAdicionar = (item) => {
    if (item.quantidade_adicionar < 0 || item.quantidade_adicionar === null) {
      item.quantidade_adicionar = null; // ou 0, se preferir não permitir nulo
    }
  };
  
  const calcularEstoqueFinal = (item) => {
    const atual = Number(item.quantidade_atual) || 0;
    const adicionar = Number(item.quantidade_adicionar) || 0;
    return atual + adicionar;
  };
  
  const hasItensParaConfirmar = computed(() => {
    return itensParaReabastecer.value.some(item => item.quantidade_adicionar !== null && Number(item.quantidade_adicionar) > 0);
  });
  
  const closeModal = () => {
    emit('close');
  };
  
  const handleSubmit = async () => {
    if (!hasItensParaConfirmar.value) {
      errorMessage.value = 'Nenhuma quantidade a ser adicionada foi informada.';
      toast.info('Informe a quantidade a ser adicionada para pelo menos um produto.');
      return;
    }
    errorMessage.value = '';
    isLoading.value = true;
  
    const payload = itensParaReabastecer.value
      .filter(item => item.quantidade_adicionar !== null && Number(item.quantidade_adicionar) > 0)
      .map(item => ({
        produto_id: item.produto_id,
        quantidade_adicionada: Number(item.quantidade_adicionar),
      }));
  
    if (payload.length === 0) {
      toast.info('Nenhum item com quantidade válida para reabastecer.');
      isLoading.value = false;
      return;
    }
  
    emit('confirmar-reabastecimento', payload);
    // isLoading será resetado no componente pai após a chamada da API
  };
  
  // Para permitir que o componente pai controle o estado de loading
  // (caso a chamada API seja feita no pai)
  const setLoading = (status) => {
    isLoading.value = status;
  };
  defineExpose({ setLoading });
  
  </script>
  
  <style scoped>
  /* Estilos básicos do modal (semelhantes aos de EnviarEstoqueModal) */
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
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    width: 90%;
    max-width: 700px; /* Ajuste conforme necessário */
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden; /* Para conter o scroll do body */
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #eee;
    padding-bottom: 15px;
    margin-bottom: 20px;
  }
  
  .modal-title {
    font-size: 1.4rem;
    font-weight: 600;
    color: #333;
    margin: 0;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #777;
    padding: 5px;
    line-height: 1;
  }
  .close-button:hover {
    color: #333;
  }
  .icon-only { /* reuso de ProdutosView */
      padding: 0.3rem;
      line-height: 1;
  }
  
  .modal-body {
    overflow-y: auto; /* Permite scroll se o conteúdo for grande */
    flex-grow: 1; /* Faz o corpo ocupar o espaço disponível */
    padding-right: 10px; /* Espaço para a barra de rolagem */
  }
  
  .modal-footer {
    border-top: 1px solid #eee;
    padding-top: 15px;
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  
  /* Estilos da tabela */
  .table-responsive {
    overflow-x: auto;
    margin-bottom: 1rem;
  }
  .reabastecimento-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  .reabastecimento-table th,
  .reabastecimento-table td {
    border: 1px solid #ddd;
    padding: 10px 12px;
    text-align: left;
    vertical-align: middle;
  }
  .reabastecimento-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    white-space: nowrap;
  }
  .reabastecimento-table tr:nth-child(even) {
    background-color: #f9f9f9;
  }
  .reabastecimento-table td small {
    color: #6c757d;
    font-size: 0.8em;
    display: block;
  }
  
  .text-right { text-align: right !important; }
  .text-center { text-align: center !important; }
  
  .input-cell {
    min-width: 100px; /* Garante espaço para o input */
    text-align: center;
  }
  .form-input-small {
    width: 80px;
    padding: 0.375rem 0.5rem;
    font-size: 0.9rem;
    border: 1px solid #ced4da;
    border-radius: 0.25rem;
    box-sizing: border-box;
    text-align: right;
  }
  .form-input-small:focus {
    border-color: #86b7fe;
    outline: 0;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  }
  
  /* Feedback e Loading States */
  .loading-state, .empty-state {
    text-align: center;
    padding: 20px;
    color: #6c757d;
    font-style: italic;
  }
  .feedback-message {
    padding: 10px;
    margin-top: 15px;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  .feedback-message.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  /* Botões (reutilize ou adapte dos seus estilos globais) */
  .button-primary, .button-secondary {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    border: 1px solid transparent;
    transition: background-color 0.15s ease-in-out;
  }
  .button-primary {
    background-color: #007bff;
    color: white;
    border-color: #007bff;
  }
  .button-primary:hover:not(:disabled) {
    background-color: #0056b3;
    border-color: #0056b3;
  }
  .button-primary:disabled {
    background-color: #007bff;
    opacity: 0.65;
    cursor: not-allowed;
  }
  .button-secondary {
    background-color: #6c757d;
    color: white;
    border-color: #6c757d;
  }
  .button-secondary:hover {
    background-color: #5a6268;
    border-color: #545b62;
  }
  .spinner { /* Mesmo spinner de ProdutosView */
      display: inline-block;
      width: 1em;
      height: 1em;
      border: 2px solid rgba(255,255,255,.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 1s ease-infinite;
      margin-right: 0.5em;
      vertical-align: middle;
  }

  .highlight-final-stock {
  background-color: #e6ffed; /* Um verde bem clarinho */
  color: #006400; /* Verde escuro para o texto, para bom contraste */
  font-weight: bold; /* Opcional: deixar o texto em negrito também */
  transition: background-color 0.3s ease, color 0.3s ease; /* Transição suave */
}

  @keyframes spin { to { transform: rotate(360deg); } }
  
  /* Animação de fade para o modal */
  .modal-fade-enter-active, .modal-fade-leave-active {
    transition: opacity 0.3s ease;
  }
  .modal-fade-enter-from, .modal-fade-leave-to {
    opacity: 0;
  }
  
  /* Responsividade para a tabela no modal */
  @media (max-width: 600px) {
    .reabastecimento-table thead {
      display: none; /* Oculta cabeçalho da tabela em telas pequenas */
    }
    .reabastecimento-table, .reabastecimento-table tbody, .reabastecimento-table tr, .reabastecimento-table td {
      display: block; /* Faz cada célula ocupar uma linha */
      width: 100%;
    }
    .reabastecimento-table tr {
      margin-bottom: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
    }
    .reabastecimento-table td {
      text-align: right; /* Alinha o conteúdo da célula à direita */
      padding-left: 50%; /* Cria espaço para o "label" */
      position: relative;
      border: none; /* Remove bordas internas das células */
      padding-bottom: 8px;
      padding-top: 8px;
    }
    .reabastecimento-table td:before {
      content: attr(data-label); /* Usa o data-label como pseudo-elemento */
      position: absolute;
      left: 10px;
      width: calc(50% - 20px); /* Largura do label */
      padding-right: 10px;
      font-weight: bold;
      text-align: left;
      white-space: nowrap;
    }
    .reabastecimento-table td.input-cell input {
        width: 100px; /* Ajusta o tamanho do input */
    }
     .reabastecimento-table td small {
      display: inline; /* Para não quebrar linha no mobile */
      margin-left: 5px;
    }
  }
  </style>