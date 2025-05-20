<!--
  /frontend/src/views/Produtos/EnviarEstoqueModal.vue

  Visão Geral:
  Este componente Vue.js implementa um modal para o envio de estoque de produtos
  do estoque central (SME) para uma escola específica. Ele utiliza o elemento `<dialog>`
  HTML5 para a funcionalidade de modal.

  Funcionalidades Principais:
  1.  SELEÇÃO DE ESCOLA:
      - Permite ao usuário selecionar uma escola de destino a partir de uma lista.
      - A lista de escolas é carregada da store Pinia `useEscolasStore`.
      - Exibe estados de carregamento e erro para a busca de escolas.
  2.  SELEÇÃO DE PRODUTOS E QUANTIDADES:
      - Exibe uma lista dos produtos disponíveis no estoque central (recebidos via props).
      - Para cada produto, mostra o nome, unidade de medida e a quantidade em estoque.
      - Permite ao usuário inserir a quantidade a ser enviada para cada produto.
      - A entrada de quantidade é validada para não exceder o estoque atual e não ser negativa.
      - Inputs de quantidade para produtos sem estoque são desabilitados.
      - Exibe mensagens de erro de validação por produto.
  3.  SUBMISSÃO DO ENVIO:
      - Um botão "Confirmar Envio" fica habilitado apenas se:
          - Uma escola de destino for selecionada.
          - Não houver erros de validação nas quantidades.
          - Pelo menos um produto tiver uma quantidade maior que zero para envio.
      - Ao confirmar, emite o evento `confirmar-envio` para o componente pai,
        passando o ID da escola selecionada e uma lista de itens (produto_id, quantidade).
  4.  CONTROLE DE VISIBILIDADE E ESTADO:
      - A visibilidade do modal é controlada pela prop `show`.
      - Utiliza `watch` para abrir/fechar o `<dialog>` programaticamente.
      - Reseta o estado interno (escola selecionada, quantidades, erros) ao abrir.
  5.  FEEDBACK AO USUÁRIO:
      - Indicador de carregamento (spinner) no botão de submissão durante o processamento.
      - Mensagens de erro para o formulário (ex: falha na submissão, passada pelo pai).
      - Mensagens de validação em tempo real para os inputs de quantidade.
  6.  COMUNICAÇÃO COM COMPONENTE PAI:
      - Emite o evento `close` quando o modal é fechado (via botão "Cancelar", "X" ou tecla ESC).
      - Emite o evento `confirmar-envio` com os dados da transferência.
  7.  INTEGRAÇÃO COM STORE:
      - Utiliza `useEscolasStore` para buscar e exibir a lista de escolas.
  8.  ESTILIZAÇÃO:
      - Importa um arquivo CSS dedicado (`EnviarEstoqueModal.css`) para sua aparência.

  Observações de Implementação:
  - O componente não realiza a chamada API de transferência diretamente. Ele delega
    essa responsabilidade ao componente pai através do evento `confirmar-envio`.
  - O estado `isSubmitting` é resetado implicitamente pelo componente pai ao
    processar o evento `confirmar-envio` e, potencialmente, fechar o modal.
-->
<template>
  <!-- 1. ELEMENTO DIALOG HTML5 -->
  <!--
    - `ref="dialogRef"`: Referência para interagir com o dialog programaticamente.
    - `@close="onDialogClose"`: Evento disparado quando o dialog é fechado (ex: tecla ESC).
  -->
  <dialog ref="dialogRef" class="enviar-estoque-modal" @close="onDialogClose">
    <!-- 2. FORMULÁRIO INTERNO DO MODAL -->
    <!--
      - `method="dialog"`: Permite que botões type="submit" fechem o dialog.
      - `@submit.prevent="confirmarEnvio"`: Captura a submissão para lógica customizada.
    -->
    <form method="dialog" @submit.prevent="confirmarEnvio">
      <!-- 2.1. CABEÇALHO DO MODAL -->
      <header class="modal-header">
        <h2>Enviar Estoque para Escola</h2>
        <!-- Botão para fechar o modal manualmente -->
        <button type="button" @click="closeModal" class="close-button" aria-label="Fechar">×</button>
      </header>

      <!-- 2.2. CORPO DO MODAL -->
      <div class="modal-body">
        <!-- 2.2.1. SELEÇÃO DA ESCOLA DE DESTINO -->
        <div class="form-group">
          <label for="escolaSelect">Selecione a Escola de Destino:</label>
          <select id="escolaSelect" v-model="selectedEscolaId" required class="form-select">
            <option disabled :value="null">-- Selecione uma Escola --</option>
            <!-- Opção de carregamento enquanto as escolas são buscadas -->
            <option v-if="escolasStore.isLoading">Carregando escolas...</option>
            <!-- Itera sobre a lista de escolas da store -->
            <option v-for="escola in escolasStore.listaEscolas" :key="escola.id" :value="escola.id">
              {{ escola.nome }}
            </option>
          </select>
          <!-- Mensagem de erro se a busca de escolas falhar -->
          <div v-if="escolasStore.error" class="error-message small">
            Erro ao carregar escolas: {{ escolasStore.error }}
          </div>
        </div>

        <!-- 2.2.2. LISTA DE PRODUTOS PARA SELEÇÃO DE QUANTIDADE -->
        <h3 class="produtos-title">Produtos Disponíveis em Estoque</h3>
        <!-- Indicador de carregamento para produtos (se aplicável) -->
        <div v-if="isLoadingProdutos" class="loading-message small">Carregando produtos...</div>
        <!-- Mensagem se não houver produtos para exibir -->
        <div v-else-if="produtosParaExibir.length === 0" class="empty-message small">Nenhum produto disponível no estoque.</div>
        <!-- Container da lista de produtos e tabela -->
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
                <!-- Itera sobre os produtos disponíveis (filtrados ou não) -->
                <tr v-for="produto in produtosParaExibir" :key="produto.id">
                  <td>{{ produto.nome }} ({{ produto.unidade_medida }})</td>
                  <td class="text-right">{{ produto.quantidade ?? 0 }}</td>
                  <td class="quantity-input-cell">
                    <!-- Input para a quantidade a ser enviada -->
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
                    <!-- Mensagem de erro de validação para este input -->
                     <small v-if="validationErrors[produto.id]" class="error-message quantity-error">
                         {{ validationErrors[produto.id] }}
                     </small>
                  </td>
                </tr>
              </tbody>
            </table>
        </div>

        <!-- Mensagem de erro geral da submissão -->
        <div v-if="submitError" class="error-message submit-error">
          {{ submitError }}
        </div>

      </div>

      <!-- 2.3. RODAPÉ DO MODAL -->
      <footer class="modal-footer">
        <button type="button" @click="closeModal" class="cancel-button">Cancelar</button>
        <button type="submit" class="submit-button" :disabled="!isFormValid || isSubmitting">
           <!-- Indicador de carregamento (spinner) -->
           <span v-if="isSubmitting" class="spinner"></span>
           {{ isSubmitting ? 'Enviando...' : 'Confirmar Envio' }}
        </button>
      </footer>
    </form>
  </dialog>
</template>

<script setup>
// --- BLOCO 1: IMPORTAÇÕES E DEFINIÇÕES GERAIS ---
import { ref, onMounted, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { useEscolasStore } from '@/stores/escolas'; // Store Pinia para escolas.
import { useToast } from "vue-toastification"; // Para feedback visual.


// Definição das props recebidas pelo componente.
const props = defineProps({
  produtos: { // Lista de produtos disponíveis no estoque central.
    type: Array,
    required: true
  },
  show: { // Controla a visibilidade do modal a partir do componente pai.
    type: Boolean,
    default: false
  }
});

// Definição dos eventos emitidos pelo componente.
const emit = defineEmits(['close', 'confirmar-envio']);

const toast = useToast(); // Instância do serviço de toast.
const escolasStore = useEscolasStore(); // Instância da store de escolas.
const dialogRef = ref(null); // Referência para o elemento <dialog>.

// --- BLOCO 2: ESTADO INTERNO DO MODAL (REFS) ---
const selectedEscolaId = ref(null);            // ID da escola de destino selecionada.
const quantidadesEnvio = ref({});              // Objeto: { produtoId: quantidade, ... }
const validationErrors = ref({});              // Objeto: { produtoId: 'Mensagem de erro', ... }
const isSubmitting = ref(false);               // Indica se o formulário está em processo de submissão.
const submitError = ref('');                   // Mensagem de erro geral para a submissão.
const isLoadingProdutos = ref(false);          // Estado de carregamento para a lista de produtos (se fosse carregada aqui).

// --- BLOCO 3: WATCHERS (OBSERVADORES) ---

/**
 * @watcher props.produtos
 * @description Observa mudanças na prop `produtos`. Quando os produtos mudam E o modal está visível,
 * reinicializa `quantidadesEnvio` com 0 para cada produto e limpa `validationErrors`.
 * `immediate: true` garante que seja executado na montagem inicial.
 */
watch(() => props.produtos, (newProdutos) => {
  if (props.show) { // Apenas reinicializa se o modal estiver visível/sendo preparado para abrir
      quantidadesEnvio.value = newProdutos.reduce((acc, produto) => {
          acc[produto.id] = 0; // Começa com 0 para todos os produtos
          return acc;
      }, {});
      validationErrors.value = {}; // Limpa erros de validação anteriores
  }
}, { immediate: true });

/**
 * @watcher props.show
 * @description Observa mudanças na prop `show` para controlar a abertura e fechamento do dialog.
 * Se `show` se torna `true`, abre o dialog e busca escolas se necessário.
 * Se `show` se torna `false`, fecha o dialog.
 */
watch(() => props.show, (newValue) => {
  const dialog = dialogRef.value;
  if (dialog) {
    if (newValue && !dialog.open) { // Se deve mostrar e não está aberto
        resetModalState(); // Garante que o estado do modal seja limpo antes de abrir
        dialog.showModal(); // Método nativo para abrir o <dialog>
        fetchEscolasIfNeeded(); // Busca escolas ao abrir, se ainda não carregadas
    } else if (!newValue && dialog.open) { // Se não deve mostrar e está aberto
        dialog.close(); // Método nativo para fechar o <dialog>
    }
  }
});

// --- BLOCO 4: PROPRIEDADES COMPUTADAS ---

/**
 * @computed produtosParaExibir
 * @description Retorna a lista de produtos a serem exibidos no modal.
 * Atualmente, retorna todos os produtos recebidos via props. A lógica de desabilitar
 * o input para produtos sem estoque é feita diretamente no template.
 * Poderia ser usado para filtrar produtos com quantidade zero, se desejado.
 */
const produtosParaExibir = computed(() => {
    return props.produtos;
    // Exemplo de filtro para mostrar apenas produtos com estoque > 0:
    // return props.produtos.filter(p => p.quantidade !== null && p.quantidade !== undefined && p.quantidade > 0);
});

/**
 * @computed isFormValid
 * @description Verifica se o formulário está em um estado válido para submissão.
 * Condições:
 * 1. Uma escola de destino deve estar selecionada.
 * 2. Não pode haver erros de validação nas quantidades dos produtos.
 * 3. Pelo menos um produto deve ter uma quantidade maior que 0 para envio.
 * @returns {boolean} True se o formulário for válido, false caso contrário.
 */
const isFormValid = computed(() => {
  if (!selectedEscolaId.value) return false;
  if (Object.keys(validationErrors.value).length > 0) return false;
  const algumItemSelecionado = Object.values(quantidadesEnvio.value).some(qty => qty > 0);
  return algumItemSelecionado;
});

// --- BLOCO 5: MÉTODOS ---

/**
 * @function fetchEscolasIfNeeded
 * @description Verifica se a lista de escolas já foi carregada na store.
 * Se não, dispara a action `fetchEscolas` da store.
 * Trata erros localmente, embora a store também possa gerenciar seu estado de erro.
 */
const fetchEscolasIfNeeded = () => {
  if (escolasStore.listaEscolas.length === 0 && !escolasStore.isLoading) {
    escolasStore.fetchEscolas().catch(err => {
      console.error("Erro ao buscar escolas no modal:", err);
      // A store de escolas (`escolasStore`) já deve atualizar sua propriedade `error`,
      // que é usada no template para exibir a mensagem de erro.
    });
  }
};

/**
 * @function resetModalState
 * @description Reseta o estado interno do modal para seus valores iniciais.
 * Chamado antes de o modal ser exibido para garantir um estado limpo.
 */
const resetModalState = () => {
    selectedEscolaId.value = null;
    submitError.value = '';
    isSubmitting.value = false;
    // Reinicializa `quantidadesEnvio` e `validationErrors` com base nos produtos atuais
    quantidadesEnvio.value = props.produtos.reduce((acc, produto) => {
        acc[produto.id] = 0; // Zera a quantidade para cada produto
        return acc;
    }, {});
    validationErrors.value = {}; // Limpa quaisquer erros de validação anteriores
}

/**
 * @function onDialogClose
 * @description Manipulador para o evento `close` do elemento `<dialog>`.
 * Este evento é disparado quando o dialog é fechado (ex: pela tecla ESC).
 * Emite o evento `close` para o componente pai, sinalizando que o modal foi fechado.
 */
const onDialogClose = () => {
    emit('close'); // Notifica o componente pai para atualizar a prop `show`
}

/**
 * @function closeModal
 * @description Fecha o modal quando o botão "Cancelar" ou o "X" de fechar é clicado.
 * Chama `dialogRef.value.close()` que, por sua vez, dispara `onDialogClose`.
 */
const closeModal = () => {
    if (dialogRef.value && dialogRef.value.open) {
        dialogRef.value.close(); // Dispara o evento 'close' do dialog
    } else {
        // Caso o dialog não esteja sincronizado ou precise de um fallback
        emit('close');
    }
};

/**
 * @function updateQuantidade
 * @param {number|string} productId - O ID do produto cuja quantidade está sendo atualizada.
 * @param {string} value - O novo valor do input (como string).
 * @param {number|null} maxQuantity - A quantidade máxima em estoque para este produto.
 * @description Atualiza a quantidade no `quantidadesEnvio` para o produto especificado.
 * Realiza validação:
 * - Se o valor for inválido ou negativo, reseta para 0 e define erro.
 * - Se o valor exceder `maxQuantity`, limita ao máximo e define erro (temporariamente).
 * - Converte o valor para número e arredonda se necessário.
 */
const updateQuantidade = (productId, value, maxQuantity) => {
  const numValue = parseFloat(value); // Permite decimais se `step="any"`

  delete validationErrors.value[productId]; // Limpa erro anterior para este produto

  if (isNaN(numValue) || numValue < 0) {
    quantidadesEnvio.value[productId] = 0;
    validationErrors.value[productId] = 'Inválido';
  } else if (maxQuantity !== null && numValue > maxQuantity) {
    quantidadesEnvio.value[productId] = maxQuantity; // Limita ao estoque
    validationErrors.value[productId] = `Máx: ${maxQuantity}`;
    // Remove a mensagem de erro após um tempo se o valor foi corrigido para o máximo
    setTimeout(() => {
        if (quantidadesEnvio.value[productId] === maxQuantity && validationErrors.value[productId]) {
           delete validationErrors.value[productId];
        }
    }, 1500);
  } else {
     // Arredonda para um número de casas decimais (ex: 2) se necessário.
     // Ajustar lógica de arredondamento conforme a unidade de medida do produto, se preciso.
     const roundedValue = Math.round(numValue * 100) / 100; // Exemplo para 2 casas decimais
     quantidadesEnvio.value[productId] = roundedValue;
  }
  // Não é usualmente necessário forçar re-renderização (`quantidadesEnvio.value = { ... }`)
  // pois o Vue deve detectar a mudança na propriedade do objeto.
};

/**
 * @function confirmarEnvio
 * @description Manipulador para a submissão do formulário.
 * Se o formulário for válido e não estiver submetendo:
 * - Define `isSubmitting` para `true`.
 * - Prepara o payload com `escola_id` e `itens` (produtos com quantidade > 0).
 * - Emite o evento `confirmar-envio` com o payload para o componente pai.
 * O componente pai é responsável por fazer a chamada API e resetar `isSubmitting`
 * (geralmente ao fechar o modal ou receber resposta da API).
 */
const confirmarEnvio = () => {
  if (!isFormValid.value || isSubmitting.value) {
    return; // Impede submissão se inválido ou já em progresso
  }

  submitError.value = ''; // Limpa erro de submissão anterior
  isSubmitting.value = true;

  // Filtra e formata os itens para envio (apenas os com quantidade > 0)
  const itensParaEnvio = Object.entries(quantidadesEnvio.value)
    .filter(([/* productId */, quantidade]) => quantidade > 0) // Filtra itens com quantidade > 0
    .map(([productId, quantidade]) => ({
      produto_id: parseInt(productId), // Garante que produto_id seja número
      quantidade: quantidade
    }));

  const payload = {
    escola_id: selectedEscolaId.value,
    itens: itensParaEnvio
  };

  emit('confirmar-envio', payload); // Devolve os dados para o componente pai

  // O reset de `isSubmitting` e o fechamento do modal são geralmente controlados pelo
  // componente pai após a conclusão da operação assíncrona (chamada API).
};

// --- BLOCO 6: HOOKS DE CICLO DE VIDA ---

/**
 * @hook onMounted
 * @description Executado quando o componente é montado.
 * Adiciona um ouvinte de evento 'close' ao elemento `<dialog>`.
 * Se o modal for montado já visível (prop `show` = true), busca escolas e reseta o estado.
 */
onMounted(() => {
    const dialog = dialogRef.value;
    if (dialog) {
        dialog.addEventListener('close', onDialogClose); // Ouve o evento 'close' nativo do dialog
    }
    // Se o modal já estiver definido para ser exibido na montagem
    if (props.show) {
        fetchEscolasIfNeeded();
        resetModalState(); // Garante estado limpo se montado visível
    }
});

/**
 * @hook onBeforeUnmount
 * @description Executado antes de o componente ser desmontado.
 * Remove o ouvinte de evento 'close' do elemento `<dialog>` para evitar memory leaks.
 */
onBeforeUnmount(() => {
  const dialog = dialogRef.value;
  if (dialog) {
      dialog.removeEventListener('close', onDialogClose);
  }
});

</script>

<style scoped>
@import '../CSS/EnviarEstoqueModal.css'; /* Estilos específicos do modal. */
</style>