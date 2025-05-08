<!-- src/views/Produtos/EnviarEstoqueModal.vue -->
<template>
    <dialog ref="dialogRef" class="enviar-estoque-modal" @close="onDialogClose">
      <form method="dialog" @submit.prevent="confirmarEnvio">
        <header class="modal-header">
          <h2>Enviar Estoque para Escola</h2>
          <button type="button" @click="closeModal" class="close-button" aria-label="Fechar">×</button>
        </header>
  
        <div class="modal-body">
          <!-- Seleção da Escola -->
          <div class="form-group">
            <label for="escolaSelect">Selecione a Escola de Destino:</label>
            <select id="escolaSelect" v-model="selectedEscolaId" required class="form-select">
              <option disabled :value="null">-- Selecione uma Escola --</option>
              <option v-if="escolasStore.isLoading">Carregando escolas...</option>
              <option v-for="escola in escolasStore.listaEscolas" :key="escola.id" :value="escola.id">
                {{ escola.nome }}
              </option>
            </select>
            <div v-if="escolasStore.error" class="error-message small">
              Erro ao carregar escolas: {{ escolasStore.error }}
            </div>
          </div>
  
          <!-- Lista de Produtos para Seleção -->
          <h3 class="produtos-title">Produtos Disponíveis em Estoque</h3>
          <div v-if="isLoadingProdutos" class="loading-message small">Carregando produtos...</div>
          <div v-else-if="produtosParaExibir.length === 0" class="empty-message small">Nenhum produto disponível no estoque.</div>
          <div v-else class="produtos-list-container">
             <p class="info-text">Informe a quantidade a ser enviada para cada produto selecionado.</p>
             <table class="produtos-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th class="text-right">Estoque Atual</th>
                    <th class="text-center">Qtd. a Enviar</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="produto in produtosParaExibir" :key="produto.id">
                    <td>{{ produto.nome }} ({{ produto.unidade_medida }})</td>
                    <td class="text-right">{{ produto.quantidade ?? 0 }}</td>
                    <td class="quantity-input-cell">
                      <input
                        type="number"
                        :value="quantidadesEnvio[produto.id] || 0"
                        @input="updateQuantidade(produto.id, $event.target.value, produto.quantidade)"
                        min="0"
                        :max="produto.quantidade ?? 0"
                        step="any"
                        class="form-input quantity-input"
                        :disabled="!produto.quantidade || produto.quantidade <= 0"
                        :placeholder="(!produto.quantidade || produto.quantidade <= 0) ? 'Sem estoque' : '0'"
                      />
                       <small v-if="validationErrors[produto.id]" class="error-message quantity-error">
                           {{ validationErrors[produto.id] }}
                       </small>
                    </td>
                  </tr>
                </tbody>
              </table>
          </div>
  
          <div v-if="submitError" class="error-message submit-error">
            {{ submitError }}
          </div>
  
        </div>
  
        <footer class="modal-footer">
          <button type="button" @click="closeModal" class="cancel-button">Cancelar</button>
          <button type="submit" class="submit-button" :disabled="!isFormValid || isSubmitting">
             <span v-if="isSubmitting" class="spinner"></span>
             {{ isSubmitting ? 'Enviando...' : 'Confirmar Envio' }}
          </button>
        </footer>
      </form>
    </dialog>
  </template>
  
  <script setup>
  import { ref, onMounted, computed, watch, nextTick, onBeforeUnmount } from 'vue';
  import { useEscolasStore } from '@/stores/escolas'; // Certifique-se que o caminho está correto
  import { useToast } from "vue-toastification";
  import '../CSS/EnviarEstoqueModal.css';
  
  const props = defineProps({
    produtos: {
      type: Array,
      required: true
    },
    show: { // Controla a visibilidade externamente
      type: Boolean,
      default: false
    }
  });
  
  const emit = defineEmits(['close', 'confirmar-envio']);
  
  const toast = useToast();
  const escolasStore = useEscolasStore();
  const dialogRef = ref(null);
  
  // Estado interno
  const selectedEscolaId = ref(null);
  const quantidadesEnvio = ref({}); // { productId: quantidade, ... }
  const validationErrors = ref({}); // { productId: 'Erro msg', ... }
  const isSubmitting = ref(false);
  const submitError = ref('');
  const isLoadingProdutos = ref(false); // Pode ser útil se a lista for muito grande
  
  // Inicializa quantidadesEnvio quando os produtos mudam ou o modal abre
  watch(() => props.produtos, (newProdutos) => {
    if (props.show) {
        quantidadesEnvio.value = newProdutos.reduce((acc, produto) => {
            acc[produto.id] = 0; // Começa com 0 para todos
            return acc;
        }, {});
        validationErrors.value = {}; // Limpa erros
    }
  }, { immediate: true });
  
  // Exibe o modal programaticamente
  watch(() => props.show, (newValue) => {
    const dialog = dialogRef.value;
    if (dialog) {
      if (newValue && !dialog.open) {
          resetModalState(); // Limpa o estado ao abrir
          dialog.showModal();
          fetchEscolasIfNeeded();
      } else if (!newValue && dialog.open) {
          dialog.close();
      }
    }
  });
  
  // Filtra produtos com quantidade maior que zero para exibição
  const produtosParaExibir = computed(() => {
      return props.produtos; // Mostra todos, a lógica de desabilitar o input cuida do estoque 0
      // Poderia filtrar se quisesse esconder os sem estoque:
      // return props.produtos.filter(p => p.quantidade !== null && p.quantidade !== undefined && p.quantidade > 0);
  });
  
  // Busca escolas se não estiverem carregadas
  const fetchEscolasIfNeeded = () => {
    if (escolasStore.listaEscolas.length === 0 && !escolasStore.isLoading) {
      escolasStore.fetchEscolas().catch(err => {
        console.error("Erro ao buscar escolas no modal:", err);
        // O store já deve lidar com o estado de erro, que é exibido no template
      });
    }
  };
  
  // Limpa o estado do modal
  const resetModalState = () => {
      selectedEscolaId.value = null;
      submitError.value = '';
      isSubmitting.value = false;
      // Reinicializa quantidades e erros baseado nos produtos atuais
      quantidadesEnvio.value = props.produtos.reduce((acc, produto) => {
          acc[produto.id] = 0;
          return acc;
      }, {});
      validationErrors.value = {};
  }
  
  // Função chamada quando o diálogo é fechado (pelo ESC ou botão de fechar nativo, se houver)
  const onDialogClose = () => {
      emit('close'); // Informa o componente pai para atualizar o estado `show`
  }
  
  // Função para fechar o modal via botão "Cancelar" ou "X"
  const closeModal = () => {
      // Não chama resetModalState aqui, pois onDialogClose já faz isso indiretamente
      // ao emitir 'close', que fará o watch de `props.show` chamar `resetModalState` na próxima abertura.
      if (dialogRef.value && dialogRef.value.open) {
          dialogRef.value.close(); // Isso vai disparar o evento 'close' do dialog
      } else {
          emit('close'); // Caso o dialog não esteja aberto mas precise sincronizar
      }
  };
  
  // Atualiza a quantidade para um produto e valida
  const updateQuantidade = (productId, value, maxQuantity) => {
    const numValue = parseFloat(value); // Usar parseFloat para permitir decimais se necessário
  
    // Limpa erro anterior para este produto
    delete validationErrors.value[productId];
  
    if (isNaN(numValue) || numValue < 0) {
      quantidadesEnvio.value[productId] = 0; // Reseta para 0 se inválido ou negativo
      validationErrors.value[productId] = 'Inválido';
    } else if (maxQuantity !== null && numValue > maxQuantity) {
      quantidadesEnvio.value[productId] = maxQuantity; // Limita ao máximo
      validationErrors.value[productId] = `Máx: ${maxQuantity}`;
      // Pequeno delay para remover a mensagem de erro após correção automática
      setTimeout(() => {
          if (quantidadesEnvio.value[productId] === maxQuantity) {
             delete validationErrors.value[productId];
          }
      }, 1500);
    } else {
       // Arredonda para um número razoável de casas decimais se necessário (ex: 2)
       // Se for unidade, não deve ter decimal. Adapte conforme a unidade se precisar.
       const roundedValue = Math.round(numValue * 100) / 100; // Exemplo com 2 casas decimais
       quantidadesEnvio.value[productId] = roundedValue;
    }
    // Força a re-renderização se necessário (raramente preciso)
    // quantidadesEnvio.value = { ...quantidadesEnvio.value };
  };
  
  // Validação do formulário geral
  const isFormValid = computed(() => {
    // Verifica se uma escola foi selecionada
    if (!selectedEscolaId.value) return false;
  
    // Verifica se há algum erro de validação de quantidade
    if (Object.keys(validationErrors.value).length > 0) return false;
  
    // Verifica se pelo menos um produto tem quantidade > 0 para envio
    const algumItemSelecionado = Object.values(quantidadesEnvio.value).some(qty => qty > 0);
    return algumItemSelecionado;
  });
  
  // Confirma o envio
  const confirmarEnvio = () => {
    if (!isFormValid.value || isSubmitting.value) {
      return;
    }
  
    submitError.value = ''; // Limpa erro anterior
    isSubmitting.value = true;
  
    // Prepara os dados para emitir
    const itensParaEnvio = Object.entries(quantidadesEnvio.value)
      .filter(([productId, quantidade]) => quantidade > 0)
      .map(([productId, quantidade]) => ({
        produto_id: parseInt(productId), // Garante que seja número
        quantidade: quantidade
      }));
  
    const payload = {
      escola_id: selectedEscolaId.value,
      itens: itensParaEnvio
    };
  
    // Emite o evento para o componente pai lidar com a API
    emit('confirmar-envio', payload);
  
    // O componente pai será responsável por fechar o modal e resetar o isSubmitting
    // Se houver erro na API, o pai pode passar o erro de volta ou o modal pode resetar o isSubmitting
    // Por enquanto, vamos assumir que o pai cuida disso
    // isSubmitting.value = false; // REMOVIDO - O Pai controla
  };
  
  // Ciclo de vida
  onMounted(() => {
      // Adiciona ouvinte para o evento 'close' do diálogo nativo
      const dialog = dialogRef.value;
      if (dialog) {
          dialog.addEventListener('close', onDialogClose);
      }
      // Fetch inicial das escolas se o modal for montado já visível (pouco comum)
      if (props.show) {
          fetchEscolasIfNeeded();
          resetModalState(); // Garante estado limpo ao montar visível
      }
  });
  
  // Limpa o ouvinte ao desmontar
  onBeforeUnmount(() => {
    const dialog = dialogRef.value;
    if (dialog) {
        dialog.removeEventListener('close', onDialogClose);
    }
});
  
  </script>