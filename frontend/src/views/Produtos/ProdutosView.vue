<template>
  <div class="produtos-view">
      <header class="page-header">
          <h1>Gestão de Produtos - SME</h1>
      </header>

      <div class="content-area">
          <!-- Card do Formulário -->
          <div class="card form-card" :class="{ 'is-editing-mode': isEditing }">
              <!-- Cabeçalho Dinâmico -->
              <div class="form-card-header" @click="toggleForm">
                  <h2 class="card-title">{{ isEditing ? `Editando: ${produtoEmEdicao?.nome || ''}` : 'Adicionar Novo Produto' }}</h2>
                  <button type="button" class="toggle-form-button icon-only" aria-label="Mostrar/Ocultar Formulário">
                      <svg v-if="isFormExpanded" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16">
                          <path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/>
                      </svg>
                      <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
                          <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
                      </svg>
                  </button>
              </div>

              <!-- Conteúdo Colapsável do Formulário -->
              <Transition name="collapse">
                  <div v-if="isFormExpanded" class="form-collapsible-content">
                      <!-- **** FORMULÁRIO UNIFICADO **** -->
                      <form @submit.prevent="salvarProduto" class="form-cadastro">
                          <!-- Feedback -->
                          <div v-if="validationError" class="feedback-message error form-feedback">
                              {{ validationError }}
                          </div>

                          <!-- === LINHA 1: Nome e Unidade === -->
                          <div class="form-row">
                              <div class="form-group col-grow">
                                  <label for="nomeProduto" class="form-label">Nome:</label>
                                  <input type="text" id="nomeProduto" v-model="formData.nome" class="form-input" required placeholder="Nome do Produto" />
                              </div>
                              <div class="form-group col-small">
                                  <label for="unidadeMedida" class="form-label">Unidade:</label>
                                  <select id="unidadeMedida" v-model="formData.unidade_medida" class="form-select" required>
                                      <option disabled value="">Selecione</option>
                                      <option value="kg">Kg</option>
                                      <option value="g">g</option>
                                      <option value="L">L</option>
                                      <option value="ml">ml</option>
                                      <option value="unidade">Un</option>
                                      <option value="pacote">Pct</option>
                                      <option value="caixa">Cx</option>
                                      <option value="lata">Lata</option>
                                  </select>
                              </div>
                          </div>

                          <!-- === LINHA 2: Categoria, Quantidade, Valor e Vencimento === -->
                          <div class="form-row">
                              <div class="form-group col-1-of-4">
                                  <label for="categoriaProduto" class="form-label">Categoria:</label>
                                  <select id="categoriaProduto" v-model="formData.categoria" class="form-select" required>
                                      <option disabled value="">Selecione a categoria</option>
                                      <option value="graos_cereais">Grãos/Cereais</option>
                                      <option value="laticinios">Laticínios</option>
                                      <option value="carnes_ovos">Carnes/Ovos</option>
                                      <option value="frutas">Frutas</option>
                                      <option value="verduras_legumes">Verduras/Legumes</option>
                                      <option value="nao_pereciveis">Não Perecíveis</option>
                                      <option value="congelados">Congelados</option>
                                      <option value="limpeza">Limpeza</option>
                                      <option value="outros">Outros</option>
                                  </select>
                              </div>
                              <div class="form-group col-1-of-4">
                                  <label for="quantidadeProduto" class="form-label">Quantidade:</label>
                                  <input type="number" id="quantidadeProduto" v-model.number="formData.quantidade" class="form-input" placeholder="Ex: 10" step="any" min="0"/>
                              </div>
                              <div class="form-group col-1-of-4">
                                  <label for="valorProduto" class="form-label">Valor (R$):</label>
                                  <input type="number" id="valorProduto" v-model.number="formData.valor" class="form-input" placeholder="Ex: 15,50" step="0.01" min="0"/>
                              </div>
                              <div class="form-group col-1-of-4">
                                  <label for="vencimentoProduto" class="form-label">Vencimento:</label>
                                  <input type="date" id="vencimentoProduto" v-model="formData.data_vencimento" class="form-input"/>
                              </div>
                          </div>

                          <!-- === LINHA 4: Descrição === -->
                          <div class="form-row">
                              <div class="form-group">
                                  <label for="descricaoProduto" class="form-label optional">Descrição (Opcional):</label>
                                  <input type="text" id="descricaoProduto" v-model="formData.descricao" class="form-input" placeholder="Detalhes adicionais..." />
                              </div>
                          </div>

                          <!-- Botões de Ação -->
                          <div class="form-actions">
                              <button type="submit" class="submit-button" :disabled="isLoading">
                                  <span v-if="isLoading" class="spinner"></span>
                                  <span>{{ isLoading ? (isEditing ? 'Salvando...' : 'Adicionando...') : (isEditing ? 'Salvar Alterações' : 'Adicionar Produto') }}</span>
                              </button>
                              <button type="button" v-if="isEditing" @click="cancelarEdicao" class="cancel-button" :disabled="isLoading">
                                  Cancelar
                              </button>
                          </div>
                      </form>
                       <!-- **** FIM DO FORMULÁRIO UNIFICADO **** -->
                  </div>
              </Transition>
          </div> <!-- Fim de .card.form-card -->

          <!-- Área da Lista e Filtros -->
          <div class="list-filter-container">
              <!-- CARD DA LISTA DE PRODUTOS -->
              <div class="card product-list-card">
                  <!-- ** CABEÇALHO PARA LISTA COM BOTÃO DE FILTRO ** -->
                  <div class="list-card-header">
                      <h2 class="card-title list-title">Produtos em Estoque - SME</h2>
                      <div class="list-header-actions">
                           <button
                              type="button"
                              @click="openEnviarEstoqueModal"
                              class="action-button send-stock-button"
                              title="Enviar Estoque para Escola"
                              :disabled="produtos.length === 0 || isLoadingList"
                            >
                               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-truck" viewBox="0 0 16 16">
                                 <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5zm1.294 7.456A2 2 0 0 1 4.732 11h5.536a2 2 0 0 1 .732-.732V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .294.456M12 10a2 2 0 0 1 1.732 1h.768a.5.5 0 0 0 .5-.5V8.35a.5.5 0 0 0-.11-.312l-1.48-1.85A.5.5 0 0 0 13.02 6H12zm-9 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
                               </svg>
                               <span>Enviar Estoque</span>
                           </button>
                           <button
                              type="button"
                              @click="toggleFilters"
                              class="toggle-filter-button icon-only"
                              :aria-expanded="isFilterExpanded"
                              aria-label="Mostrar/Ocultar Filtros"
                              title="Mostrar/Ocultar Filtros"
                            >
                          <!-- Ícone de Filtro -->
                          <svg v-if="!isFilterExpanded" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-funnel" viewBox="0 0 16 16">
                              <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.74.439L7 12.439a.5.5 0 0 1-.26-.439V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5zM2 2v1.586l3.999 4.667a.5.5 0 0 1 .26.439v3.561l1.406.937a.5.5 0 0 1 .26.439V8.692L12 3.586V2z"/>
                          </svg>
                          <!-- Ícone de Filtro Ativo -->
                          <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-funnel-fill" viewBox="0 0 16 16">
                             <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.74.439L7 12.439a.5.5 0 0 1-.26-.439V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5z"/>
                          </svg> 
                      </button>
                  </div>
                </div>
                  <!-- **** FIM DO CABEÇALHO MODIFICADO **** -->

                  <!-- Conteúdo da Lista (Tabela, etc.) -->
                  <div v-if="isLoadingList" class="loading-list">Carregando produtos...</div>
                  <div v-else-if="!produtos || produtos.length === 0" class="empty-list">Nenhum produto cadastrado ainda.</div>
                  <div v-else-if="produtosFiltrados.length === 0" class="empty-list">Nenhum produto encontrado com os filtros atuais.</div>

                  <div class="table-responsive" v-else>
                      <table class="product-table">
                          <thead>
                              <tr>
                                  <th scope="col">Nome</th>
                                  <th scope="col">Categoria</th>
                                  <th scope="col">Unidade</th>
                                  <th scope="col" class="text-right">Qtd.</th>
                                  <th scope="col" class="text-right">Valor Unit.</th>
                                  <th scope="col">Vencimento</th>
                                  <th scope="col">Última Modificação</th>
                                  <th scope="col" class="text-center">Ações</th>
                              </tr>
                          </thead>
                          <TransitionGroup name="list" tag="tbody">
                              <tr v-for="produto in produtosFiltrados" :key="produto.id">
                                  <td data-label="Nome:">{{ produto.nome }}</td>
                                  <td data-label="Categoria:">{{ getCategoriaLabel(produto.categoria) }}</td>
                                  <td data-label="Unidade:">{{ produto.unidade_medida }}</td>
                                  <td data-label="Qtd:" class="text-right">
                                      {{ (produto.quantidade !== null && produto.quantidade !== undefined) ? produto.quantidade : '-' }}
                                  </td>
                                  <td data-label="Valor:" class="text-right">
                                      {{ (produto.valor !== null && produto.valor !== undefined) ? formatCurrency(produto.valor) : '-' }}
                                  </td>
                                  <td data-label="Vencimento:">
                                      {{ produto.data_vencimento ? formatDate(produto.data_vencimento) : '-' }}
                                  </td>
                                  <td data-label="Modificado em:">
                                      {{ formatDateTime(produto.data_modificacao) }}
                                  </td>
                                  <td data-label="Ações:" class="actions-cell">
                                    <div class="action-menu-container">
                                          <button @click.stop="toggleActionMenu(produto.id)" class="action-menu-trigger icon-only" title="Mais Ações">
                                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots-vertical" viewBox="0 0 16 16">
                                                  <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
                                              </svg>
                                          </button>
                                          <!-- O Menu Dropdown -->
                                          <Transition name="fade">
                                              <div v-if="openedActionMenuId === produto.id" class="action-dropdown" v-click-outside="() => closeActionMenu(produto.id)">
                                                  <button @click="executarEdicao(produto)" class="action-dropdown-item">
                                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-pencil-square action-icon" viewBox="0 0 16 16">
                                                        <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                                                        <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
                                                      </svg>
                                                      Editar
                                                  </button>
                                                  <button @click="executarExclusao(produto.id)" class="action-dropdown-item delete">
                                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-trash3 action-icon" viewBox="0 0 16 16">
                                                        <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm-1 .72h-6.97l-.8-10.047a.5.5 0 0 1 .498-.554h8.974a.5.5 0 0 1 .498.554l-.8 10.047zM9 5.5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0v-5a.5.5 0 0 1 .5-.5m-3 0a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0v-5a.5.5 0 0 1 .5-.5"/>
                                                      </svg>
                                                      Excluir
                                                  </button>
                                              </div>
                                          </Transition>
                                      </div>
                                  </td>
                              </tr>
                          </TransitionGroup>
                      </table>
                  </div>
              </div> <!-- Fim de .card.product-list-card -->

              <!-- **** FILTROS - AGORA CONDICIONAL E COM TRANSIÇÃO **** -->
              <Transition name="filter-collapse">
                  <ProdutoFiltros
                      v-if="isFilterExpanded"
                      :categorias="categoriasMap"
                      @filtros-atualizados="handleFiltrosAtualizados"
                      class="filter-card" />
                      <!-- A classe 'filter-card' ainda é usada para estilização base e layout flex -->
              </Transition>
               <!-- **** FIM DOS FILTROS **** -->

          </div> <!-- Fim de .list-filter-container -->
      </div> <!-- Fim de .content-area -->
        <!-- **** MODAL DE ENVIO DE ESTOQUE **** -->
        <EnviarEstoqueModal
        :show="showEnviarModal"
        :produtos="produtos"
        @close="showEnviarModal = false"
        @confirmar-envio="handleConfirmarEnvio"
      />
      <!-- **** FIM DO MODAL **** -->
  </div> <!-- Fim de .produtos-view -->
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { useToast } from "vue-toastification";
import ProdutoFiltros from './ProdutoFiltros.vue'; // Componente de Filtro
import EnviarEstoqueModal from './EnviarEstoqueModal.vue'; // Importar o modal
import { useEscolasStore } from '@/stores/escolas'; // Importar store de escolas

const toast = useToast();
const escolasStore = useEscolasStore(); // Instanciar o store
const isFormExpanded = ref(false); // Controla o formulário de add/edit
const editandoProdutoId = ref(null);
const produtoEmEdicao = ref(null);
const isEditing = computed(() => editandoProdutoId.value !== null);
const openedActionMenuId = ref(null); // Controla qual menu de ação está aberto

// NOVO ESTADO PARA CONTROLAR VISIBILIDADE DO FILTRO
const isFilterExpanded = ref(false); // Começa fechado por padrão

// ESTADO PARA O MODAL
const showEnviarModal = ref(false); // Controla a visibilidade do modal de envio

// Diretiva v-click-outside (simplificada)
const vClickOutside = {
beforeMount(el, binding) {
  el.clickOutsideEvent = function(event) {
    // Verifica se o clique foi fora do elemento 'el'
    if (!(el === event.target || el.contains(event.target))) {
      binding.value(event); // Chama a função passada (closeActionMenu)
    }
  };
  // Adiciona o listener um pouco depois para evitar fechar imediatamente ao abrir
  nextTick(() => document.addEventListener('click', el.clickOutsideEvent));
},
unmounted(el) {
  // Remove o listener ao desmontar
  document.removeEventListener('click', el.clickOutsideEvent);
}
};

// Estado inicial do formulário
const getInitialFormData = () => ({
id: null,
nome: '',
descricao: '',
unidade_medida: '',
categoria: '',
quantidade: null,
valor: null,
data_vencimento: '',
});

// Refs reativas
const formData = ref(getInitialFormData());
const produtos = ref([]);
const isLoading = ref(false); // Para o formulário
const isLoadingList = ref(true); // Para a lista
const validationError = ref(''); // Erro de validação do formulário
const filtrosAtivos = ref({ nome: '', categoria: '' }); // Estado dos filtros

// Mapeamento de categorias para exibição
const categoriasMap = {
graos_cereais: 'Grãos/Cereais', laticinios: 'Laticínios', carnes_ovos: 'Carnes/Ovos',
frutas: 'Frutas', verduras_legumes: 'Verduras/Legumes', nao_pereciveis: 'Não Perecíveis',
congelados: 'Congelados', limpeza: 'Limpeza', outros: 'Outros'
};

// --- FUNÇÕES DO FORMULÁRIO ---
const toggleForm = () => {
isFormExpanded.value = !isFormExpanded.value;
// Se fechar o formulário enquanto edita, cancela a edição
if (!isFormExpanded.value && isEditing.value) {
    cancelarEdicao();
}
};

// --- FUNÇÕES DOS FILTROS ---
const toggleFilters = () => {
  isFilterExpanded.value = !isFilterExpanded.value;
};

const handleFiltrosAtualizados = (novosFiltros) => {
filtrosAtivos.value = novosFiltros;
};

// --- FUNÇÕES DE FORMATAÇÃO ---
const getCategoriaLabel = (key) => categoriasMap[key] || key;

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '';
  const numValue = Number(value);
  if (isNaN(numValue)) return '-';
  return numValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString) => { // Apenas Data
  if (!dateString) return '-';
  try {
      // Adiciona T00:00:00 para evitar problemas de fuso horário ao converter só data
      const date = new Date(dateString + 'T00:00:00');
      if (isNaN(date.getTime())) return dateString; // Retorna original se inválida
      return date.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch (e) {
      console.error("Erro ao formatar data:", dateString, e);
      return dateString; // Retorna original em caso de erro
  }
};

const formatDateTime = (dateTimeString) => { // Data e Hora
  if (!dateTimeString) return '-';
  try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) {
           console.warn("Data/Hora inválida recebida:", dateTimeString);
           return dateTimeString;
      }
      return date.toLocaleString('pt-BR', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit',
          // second: '2-digit' // Opcional
      });
  } catch (e) {
      console.error("Erro ao formatar data/hora:", dateTimeString, e);
      return dateTimeString;
  }
};

// Formata data para o input type="date" (AAAA-MM-DD)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
      // Novamente, T00:00:00 para consistência
      const date = new Date(dateString + 'T00:00:00');
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
  } catch (e) {
      console.error("Erro ao formatar data para input:", dateString, e);
      return '';
  }
};

// --- FUNÇÕES API (Interação com Backend) ---
const fetchProdutos = async () => {
  isLoadingList.value = true;
  try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("Token de autenticação não encontrado.");

      const response = await fetch('http://localhost:3000/api/produtos', {
          headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
           localStorage.removeItem('authToken');
           toast.error("Sessão inválida ou expirada. Faça login novamente.");
           // Idealmente, redirecionar para login aqui: router.push('/login');
           produtos.value = []; isLoadingList.value = false; return;
      }
      if (!response.ok) {
          let errorMsg = `Falha ao buscar produtos (Status: ${response.status})`;
          try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch(e) { /* Ignora erro ao parsear json */ }
          throw new Error(errorMsg);
      }
      // A API deve retornar 'data_modificacao' para cada produto
      produtos.value = await response.json();
  } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      toast.error(`Erro ao carregar produtos: ${error.message}`);
      produtos.value = []; // Limpa em caso de erro
  } finally {
      isLoadingList.value = false;
  }
};

const salvarProduto = () => {
  if (isEditing.value) {
      atualizarProduto();
  } else {
      cadastrarProduto();
  }
};

// Validação básica antes de enviar
const validarFormulario = () => {
  validationError.value = '';
  if (!formData.value.nome || !formData.value.unidade_medida || !formData.value.categoria) {
      validationError.value = 'Preencha os campos obrigatórios (Nome, Unidade, Categoria).';
      toast.warning(validationError.value);
      return false;
  }
  if ((formData.value.quantidade !== null && formData.value.quantidade !== '' && Number(formData.value.quantidade) < 0) ||
      (formData.value.valor !== null && formData.value.valor !== '' && Number(formData.value.valor) < 0)) {
      validationError.value = 'Quantidade e Valor não podem ser negativos.';
      toast.warning(validationError.value);
      return false;
  }
  return true;
};

const cadastrarProduto = async () => {
if (!validarFormulario()) return;

isLoading.value = true;
try {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error("Token de autenticação não encontrado.");

    // Prepara payload, tratando campos numéricos e data vazios como null
    const payload = {
        ...formData.value,
        quantidade: (formData.value.quantidade === '' || formData.value.quantidade === null) ? null : Number(formData.value.quantidade),
        valor: (formData.value.valor === '' || formData.value.valor === null) ? null : Number(formData.value.valor),
        data_vencimento: formData.value.data_vencimento === '' ? null : formData.value.data_vencimento
    };
    delete payload.id; // ID não é enviado na criação

    const response = await fetch('http://localhost:3000/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
    });
    const responseData = await response.json();
    if (!response.ok) {
        throw new Error(responseData.error || `Falha ao cadastrar produto (Status: ${response.status})`);
    }
    // Adiciona o novo produto no início da lista (assumindo que a API retorna o produto criado com ID e data_modificacao)
    produtos.value.unshift(responseData);
    toast.success(`Produto "${responseData.nome}" adicionado com sucesso!`);
    resetForm(); // Limpa o formulário
    isFormExpanded.value = false; // Fecha o formulário
} catch (error) {
    console.error("Erro ao cadastrar produto:", error);
    toast.error(`Erro ao cadastrar: ${error.message}`);
} finally {
    isLoading.value = false;
}
};

const iniciarEdicao = (produto) => {
  validationError.value = ''; // Limpa erros anteriores
  editandoProdutoId.value = produto.id;
  produtoEmEdicao.value = { ...produto }; // Guarda cópia original para o título

  // Preenche o formData com os dados do produto para edição
  formData.value = {
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao || '',
      unidade_medida: produto.unidade_medida,
      categoria: produto.categoria,
      quantidade: produto.quantidade ?? null, // Usa ?? para tratar null/undefined
      valor: produto.valor ?? null,
      data_vencimento: formatDateForInput(produto.data_vencimento), // Formata data para input
  };

  isFormExpanded.value = true; // Abre o formulário
  // Rola a tela para o formulário
  nextTick(() => {
      document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
};

const atualizarProduto = async () => {
  if (!editandoProdutoId.value || !validarFormulario()) return;

  isLoading.value = true;
  try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("Token de autenticação não encontrado.");

      // Prepara payload para atualização
      const payload = {
        ...formData.value,
        quantidade: (formData.value.quantidade === '' || formData.value.quantidade === null) ? null : Number(formData.value.quantidade),
        valor: (formData.value.valor === '' || formData.value.valor === null) ? null : Number(formData.value.valor),
        data_vencimento: formData.value.data_vencimento === '' ? null : formData.value.data_vencimento
      };
      // O ID já está em formData.value.id

      const response = await fetch(`http://localhost:3000/api/produtos/${editandoProdutoId.value}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      if (!response.ok) {
          throw new Error(responseData.error || `Falha ao atualizar produto (Status: ${response.status})`);
      }

      // Atualiza o produto na lista local com os dados retornados pela API (que deve incluir a nova data_modificacao)
      const index = produtos.value.findIndex(p => p.id === editandoProdutoId.value);
      if (index !== -1) {
          produtos.value[index] = responseData;
      } else {
          // Fallback: recarrega a lista se não encontrar o índice (menos ideal)
          fetchProdutos();
      }

      toast.success(`Produto "${responseData.nome}" atualizado com sucesso!`);
      resetForm(); // Limpa e reseta o estado de edição
      isFormExpanded.value = false; // Fecha o formulário

  } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      toast.error(`Erro ao atualizar: ${error.message}`);
  } finally {
      isLoading.value = false;
  }
};

const cancelarEdicao = () => {
  resetForm(); // Limpa o formulário e o estado de edição
  isFormExpanded.value = false; // Fecha o formulário
};

// Reseta o formulário e o estado de edição
const resetForm = () => {
  formData.value = getInitialFormData();
  editandoProdutoId.value = null;
  produtoEmEdicao.value = null;
  validationError.value = '';
  isLoading.value = false; // Garante que o spinner pare
};

const confirmarExclusao = async (id) => {
const produtoParaExcluir = produtos.value.find(p => p.id === id);
const nomeProduto = produtoParaExcluir ? `"${produtoParaExcluir.nome}"` : `de ID ${id}`;

// Se estiver editando o produto que será excluído, cancela a edição primeiro
if (isEditing.value && editandoProdutoId.value === id) {
  cancelarEdicao();
  await nextTick(); // Espera a UI atualizar antes do confirm
}

// Pede confirmação ao usuário
if (!confirm(`Tem certeza que deseja excluir o produto ${nomeProduto}? Esta ação não pode ser desfeita.`)) {
    return; // Aborta se o usuário cancelar
}

try {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error("Token de autenticação não encontrado.");

    const response = await fetch(`http://localhost:3000/api/produtos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    // Tratamento de respostas HTTP
    if (response.status === 401 || response.status === 403) { /* ... tratamento de erro auth ... */ return; }
    if (response.status === 404) { throw new Error('Produto não encontrado no servidor.'); }
    // 204 No Content é sucesso para DELETE, mas verificamos !response.ok para outros erros
    if (!response.ok && response.status !== 204) {
        let errorMsg = `Falha ao excluir produto (Status: ${response.status})`;
        try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch(e) {}
        throw new Error(errorMsg);
    }

    // Remove o produto da lista local
    produtos.value = produtos.value.filter(p => p.id !== id);
    toast.success(`Produto ${nomeProduto} excluído com sucesso.`);
} catch (error) {
    console.error("Erro ao excluir produto:", error);
    toast.error(`Erro ao excluir: ${error.message}`);
} finally {
    // Fecha qualquer menu de ação que possa estar aberto
    openedActionMenuId.value = null;
}
};

// --- Lógica da Lista e Filtragem ---
const produtosFiltrados = computed(() => {
if (!produtos.value) return [];

let listaFiltrada = [...produtos.value];

// Filtrar por nome (case-insensitive)
const nomeFiltro = filtrosAtivos.value.nome?.trim().toLowerCase();
if (nomeFiltro) {
    listaFiltrada = listaFiltrada.filter(p =>
        p.nome.toLowerCase().includes(nomeFiltro)
    );
}

// Filtrar por categoria
const categoriaFiltro = filtrosAtivos.value.categoria;
if (categoriaFiltro) {
    listaFiltrada = listaFiltrada.filter(p => p.categoria === categoriaFiltro);
}

// Ordenar por data de modificação (mais recente primeiro)
// Trata datas inválidas ou ausentes como mais antigas
listaFiltrada.sort((a, b) => {
    const dateA = a.data_modificacao ? new Date(a.data_modificacao).getTime() : 0;
    const dateB = b.data_modificacao ? new Date(b.data_modificacao).getTime() : 0;
    // Coloca itens sem data de modificação ou inválida no final
    if (isNaN(dateA) && isNaN(dateB)) return 0;
    if (isNaN(dateA)) return 1; // a é inválido/nulo, vai pro fim
    if (isNaN(dateB)) return -1; // b é inválido/nulo, vai pro fim
    return dateB - dateA; // Ordena decrescente (mais recente primeiro)
});

return listaFiltrada;
});

// --- Funções do Menu de Ações (Dropdown) ---

// Abre/Fecha o menu para um produto específico
const toggleActionMenu = (produtoId) => {
  // Se o menu clicado já está aberto, fecha. Senão, abre o clicado.
  openedActionMenuId.value = openedActionMenuId.value === produtoId ? null : produtoId;
};

// Fecha o menu (usado pela diretiva v-click-outside)
const closeActionMenu = () => {
  // Fecha qualquer menu que esteja aberto
  openedActionMenuId.value = null;
};

// Função chamada pelo botão Editar do dropdown
const executarEdicao = (produto) => {
  iniciarEdicao(produto);
  closeActionMenu(); // Fecha o menu após clicar em editar
};

// Função chamada pelo botão Excluir do dropdown
const executarExclusao = (produtoId) => {
  // A função confirmarExclusao já fecha o menu no finally
  confirmarExclusao(produtoId);
  // Não precisa fechar aqui explicitamente se confirmarExclusao já faz
};

// **** LÓGICA DO MODAL DE ENVIO DE ESTOQUE ****

// Abre o modal de envio
const openEnviarEstoqueModal = () => {
  // Poderia pré-carregar escolas aqui se necessário, mas o modal já faz isso
  // escolasStore.fetchEscolas(); // Opcional
  showEnviarModal.value = true;
};

// Lida com a confirmação do envio vinda do modal
const handleConfirmarEnvio = async (payload) => {
  // payload = { escola_id: number, itens: [{ produto_id: number, quantidade: number }, ...] }
  console.log("Payload recebido para envio:", payload);

  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error("Sessão expirada. Faça login novamente.");
      showEnviarModal.value = false; // Fecha o modal
      // Idealmente redirecionar para login
      return;
    }

    // **NOVO ENDPOINT NO BACKEND:** Presume-se um endpoint POST /api/transferencias
    const response = await fetch('http://localhost:3000/api/transferencias', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
        // Tenta pegar a mensagem de erro do backend
        throw new Error(responseData.error || `Falha ao registrar a transferência (Status: ${response.status})`);
    }

    // Sucesso!
    toast.success(responseData.message || "Estoque enviado com sucesso!"); // Usa a mensagem do backend se existir

    // Atualizar as quantidades na lista local para refletir o envio
    payload.itens.forEach(itemEnviado => {
        const index = produtos.value.findIndex(p => p.id === itemEnviado.produto_id);
        if (index !== -1) {
            const produtoOriginal = produtos.value[index];
            const novaQuantidade = (produtoOriginal.quantidade ?? 0) - itemEnviado.quantidade;
            // Atualiza o produto diretamente na lista
            // É importante criar um novo objeto para garantir reatividade se necessário
            produtos.value[index] = {
                ...produtoOriginal,
                quantidade: novaQuantidade < 0 ? 0 : novaQuantidade, // Garante não ficar negativo
                // A API de transferência PODE retornar a nova data de modificação,
                // se sim, atualize aqui também:
                // data_modificacao: responseData.produtos_atualizados?.[itemEnviado.produto_id]?.data_modificacao || produtoOriginal.data_modificacao
            };

            // Atualiza diretamente no DOM para feedback visual imediato (opcional, Vue deve cuidar disso)
             nextTick(() => {
                 const qtySpan = document.getElementById(`produto-qty-${itemEnviado.produto_id}`);
                 if (qtySpan) {
                     qtySpan.textContent = novaQuantidade < 0 ? '0' : novaQuantidade.toString();
                     // Adiciona uma classe de highlight temporária (opcional)
                     qtySpan.classList.add('highlight-update');
                     setTimeout(() => qtySpan.classList.remove('highlight-update'), 1500);
                 }
             });
        }
    });

    showEnviarModal.value = false; // Fecha o modal

  } catch (error) {
      console.error("Erro ao enviar estoque:", error);
      toast.error(`Erro ao enviar: ${error.message}`);
      // Mantém o modal aberto em caso de erro? Ou passa o erro para o modal exibir?
      // Por enquanto, apenas logamos e mostramos toast. O modal já tem seu próprio
      // estado `isSubmitting` que deve ser resetado pelo componente pai (neste caso,
      // como o erro ocorreu aqui, o modal continua com isSubmitting=true).
      // Idealmente, o modal deveria ter uma prop ou método para resetar o estado de envio.
      // Solução simples: fechar o modal mesmo em erro.
      showEnviarModal.value = false; // Fecha em caso de erro também por simplicidade inicial
  }
  // O finally não é ideal aqui porque o estado `isSubmitting` está no modal.
  // A comunicação para resetar o estado do modal em caso de erro precisaria ser mais robusta.
};

// --- Ciclo de Vida ---
onMounted(() => {
fetchProdutos(); // Busca os produtos ao montar o componente
// Opcional: Iniciar com filtros abertos?
// isFilterExpanded.value = true;
});

</script>

<!-- Links CSS -->
<style scoped src="../CSS/ProdutosView.css"></style>
<style scoped src="../CSS/ProdutosEditView.css"></style>

<!-- Adiciona estilos específicos para o botão de envio e highlight -->
<style scoped>
.list-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap; /* Permite quebrar linha em telas menores */
    gap: 1rem; /* Espaço entre título e botões */
}

.list-title {
    margin-bottom: 0; /* Remove margem inferior padrão do título */
    flex-grow: 1; /* Faz o título ocupar espaço disponível */
}

.list-header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem; /* Espaço entre os botões de ação */
    flex-shrink: 0; /* Impede que os botões encolham demais */
}

.action-button { /* Estilo base para botões de ação no cabeçalho */
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    color: #495057;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.2s ease;
}
.action-button:hover:not(:disabled) {
    background-color: #e9ecef;
    border-color: #adb5bd;
    color: #212529;
}
.action-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
.action-button svg {
    width: 1em;
    height: 1em;
}

.send-stock-button { /* Estilo específico para o botão Enviar Estoque */
    background-color: #17a2b8; /* Cor info */
    border-color: #17a2b8;
    color: white;
}
.send-stock-button:hover:not(:disabled) {
    background-color: #138496;
    border-color: #117a8b;
    color: white;
}

.toggle-filter-button {
    /* Ajuste se necessário para alinhar com o novo botão */
}

/* Highlight para quantidade atualizada (opcional) */
@keyframes highlight {
  from { background-color: #ffc107; } /* Amarelo */
  to { background-color: transparent; }
}
.highlight-update {
  animation: highlight 1.5s ease-out;
  display: inline-block; /* Necessário para background funcionar bem */
  padding: 0 2px; /* Pequeno padding para o highlight */
  border-radius: 3px;
}

/* Ajuste responsivo para o cabeçalho da lista, se necessário */
@media (max-width: 600px) {
    .list-card-header {
        flex-direction: column;
        align-items: flex-start;
    }
    .list-header-actions {
        width: 100%;
        justify-content: flex-end; /* Alinha botões à direita */
    }
    .list-title {
        width: 100%; /* Ocupa toda a largura */
        margin-bottom: 0.5rem; /* Adiciona espaço abaixo do título */
    }
}

</style>