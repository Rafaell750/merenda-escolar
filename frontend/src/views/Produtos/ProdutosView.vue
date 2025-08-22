<!--
  /frontend/src/views/Produtos/ProdutosView.vue

  Visão Geral:
  Este componente Vue.js é responsável pela gestão completa dos produtos da Secretaria Municipal de Educação (SME).
  Ele permite visualizar, cadastrar, editar, excluir produtos, filtrar a lista de produtos e iniciar o processo
  de envio de estoque para escolas através de um modal.

  Funcionalidades Principais:
  1.  FORMULÁRIO DE PRODUTO:
      - Um formulário colapsável permite adicionar novos produtos ou editar existentes.
      - Campos: Nome, Unidade de Medida, Categoria, Quantidade, Valor, Data de Vencimento, Descrição.
      - Validação de campos obrigatórios e valores numéricos.
      - O título do formulário muda dinamicamente para "Adicionar Novo Produto" ou "Editando: [Nome do Produto]".
  2.  LISTAGEM DE PRODUTOS:
      - Exibe os produtos em uma tabela com informações relevantes (Nome, Categoria, Unidade, Quantidade, Valor, Vencimento, Última Modificação).
      - Inclui estados de carregamento, lista vazia e nenhum resultado para filtros.
      - Produtos são ordenados pela data de modificação (mais recentes primeiro).
      - Utiliza `TransitionGroup` para animações na lista.
  3.  AÇÕES POR PRODUTO:
      - Um menu de ações (dropdown) para cada produto permite:
          - Editar: Preenche o formulário com os dados do produto selecionado.
          - Excluir: Solicita confirmação antes de remover o produto.
      - A diretiva customizada `v-click-outside` fecha o dropdown ao clicar fora dele.
  4.  FILTRAGEM DE PRODUTOS:
      - Um componente `ProdutoFiltros` (colapsável) permite filtrar a lista por nome e categoria.
      - O botão de filtro no cabeçalho da lista alterna a visibilidade dos filtros.
  5.  ENVIO DE ESTOQUE:
      - Um botão "Enviar Estoque" no cabeçalho da lista abre o modal `EnviarEstoqueModal`.
      - Este modal permite selecionar uma escola e as quantidades dos produtos a serem enviados.
      - Após a confirmação no modal, uma requisição é feita para registrar a transferência, e as
        quantidades dos produtos na lista local são atualizadas.
  6.  INTERAÇÃO COM API:
      - Realiza chamadas à API para buscar (GET), cadastrar (POST), atualizar (PUT) e excluir (DELETE) produtos.
      - Gerencia o token de autenticação e trata erros de autorização (401/403).
  7.  FEEDBACK AO USUÁRIO:
      - Utiliza `vue-toastification` para exibir mensagens de sucesso, erro e aviso.
      - Indicadores de carregamento para o formulário e para a lista.
  8.  FORMATAÇÃO DE DADOS:
      - Funções para formatar moeda (BRL), datas (DD/MM/AAAA) e data/hora.
  9.  GERENCIAMENTO DE ESTADO LOCAL:
      - Usa `ref` e `computed` para gerenciar o estado do formulário, lista, filtros, modal, menus de ação, etc.
  10. ESTILIZAÇÃO:
      - Utiliza CSS `scoped` e importa arquivos CSS externos para estilização.
-->
<template>
  <div class="produtos-view">
    <!-- 1. CABEÇALHO DA PÁGINA -->
    <header class="page-header">
      <h1>Gestão de Produtos - SME</h1>
      <p class="page-subtitle">Gerencie o estoque central, adicione novos itens e distribua para as escolas.</p>
    </header>

    <!-- 2. ÁREA DE CONTEÚDO PRINCIPAL -->
    <div class="content-area">
      <!-- 3. CARD DO FORMULÁRIO DE ADIÇÃO/EDIÇÃO DE PRODUTO -->
      <div class="card form-card" :class="{ 'is-editing': isEditing }">
        <div class="card-header" @click="toggleForm">
          <h2 class="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-box-seam-fill card-title-icon" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M15.528 2.973a.75.75 0 0 1 .472.696v8.662a.75.75 0 0 1-.472.696l-7.25 2.9a.75.75 0 0 1-.557 0l-7.25-2.9A.75.75 0 0 1 0 12.331V3.669a.75.75 0 0 1 .471-.696L7.723.023a.75.75 0 0 1 .557 0zM10.404 2 4.25 4.461 1.846 3.5 8 1.039zM15 4.461 8.596 2 8 2.236 8 8.11 15 5.376zM7.5 8.11v-5.874L1 4.461 1 11.383zM1.5 4.931 7.5 7.421v6.244L1.5 11.083z"/>
            </svg>
            {{ isEditing ? `Editando: ${produtoEmEdicao?.nome || ''}` : 'Adicionar Novo Produto' }}
          </h2>
          <button type="button" class="toggle-button icon-only" aria-label="Mostrar/Ocular Formulário">
            <svg v-if="isFormExpanded" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
            </svg>
          </button>
        </div>
        
        <Transition name="collapse">
          <div v-if="isFormExpanded" class="card-body">
            <form @submit.prevent="salvarProduto" class="product-form">
              <div v-if="validationError" class="feedback-message error form-feedback">{{ validationError }}</div>
              
              <div class="form-row">
                <div class="form-group col-grow">
                  <label for="nomeProduto">Nome do Produto</label>
                  <input type="text" id="nomeProduto" v-model="formData.nome" required placeholder="Ex: Arroz" />
                </div>
                <div class="form-group col-small">
                  <label for="unidadeMedida">Unidade</label>
                  <select id="unidadeMedida" v-model="formData.unidade_medida" required>
                    <option disabled value="">Selecione</option>
                    <option value="unidade">Unidade</option>
                    <option value="kg">Kg</option>
                    <option value="g">g</option>
                    <option value="L">Litro</option>
                    <option value="ml">ml</option>
                    <option value="pacote">Pacote</option>
                    <option value="caixa">Caixa</option>
                    <option value="lata">Lata</option>
                  </select>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="categoriaProduto">Categoria</label>
                  <select id="categoriaProduto" v-model="formData.categoria" required>
                    <option disabled value="">Selecione a categoria</option>
                    <option value="graos_cereais">Grãos e Cereais</option>
                    <option value="laticinios">Laticínios</option>
                    <option value="carnes_ovos">Carnes e Ovos</option>
                    <option value="frutas">Frutas</option>
                    <option value="verduras_legumes">Verduras e Legumes</option>
                    <option value="nao_pereciveis">Não Perecíveis</option>
                    <option value="congelados">Congelados</option>
                    <option value="limpeza">Limpeza</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="quantidadeProduto">Quantidade</label>
                  <input type="number" id="quantidadeProduto" v-model.number="formData.quantidade" placeholder="Ex: 50" step="any" min="0" required />
                </div>
                <div class="form-group">
                  <label for="valorProduto">Valor Unitário <span class="optional-label">(Opcional)</span></label>
                  <input type="number" id="valorProduto" v-model.number="formData.valor" placeholder="R$ 0,00" step="0.01" min="0"/>
                </div>
                <div class="form-group">
                  <label for="vencimentoProduto">Vencimento <span class="optional-label">(Opcional)</span></label>
                  <input type="date" id="vencimentoProduto" v-model="formData.data_vencimento"/>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" v-if="isEditing" @click="cancelarEdicao" class="btn btn-tertiary" :disabled="isLoading">Cancelar</button>
                <button type="button" @click="limparCampos" class="btn btn-secondary" :disabled="isLoading">Limpar</button>
                <button type="submit" class="btn btn-primary" :disabled="isLoading">
                  <span v-if="isLoading" class="spinner"></span>
                  <span>{{ isLoading ? (isEditing ? 'Salvando...' : 'Adicionando...') : (isEditing ? 'Salvar Alterações' : 'Adicionar Produto') }}</span>
                </button>
              </div>
            </form>
          </div>
        </Transition>
      </div>

      <!-- 4. CONTAINER PARA A LISTA DE PRODUTOS E FILTROS -->
      <div class="list-container">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-list-ul card-title-icon" viewBox="0 0 16 16">
                  <path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-2-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-2-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3.854-1.354a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 1 1 .708-.708L2 3.293l1.146-1.147a.5.5 0 0 1 .708 0m-2.146 4.354a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 1 1 .708-.708L2 7.293l1.146-1.147a.5.5 0 0 1 .708 0m-2.146 4.354a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 0 1 .708-.708L2 11.293l1.146-1.147a.5.5 0 0 1 .708 0"/>
              </svg>
              Estoque da SME
            </h2>
            <div class="header-actions">
              <button @click="openEnviarEstoqueModal" class="btn btn-secondary" title="Enviar Estoque para Escola" :disabled="produtos.length === 0 || isLoadingList">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-truck" viewBox="0 0 16 16">
                  <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5zm1.294 7.456A2 2 0 0 1 4.732 11h5.536a2 2 0 0 1 .732-.732V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .294.456M12 10a2 2 0 0 1 1.732 1h.768a.5.5 0 0 0 .5-.5V8.35a.5.5 0 0 0-.11-.312l-1.48-1.85A.5.5 0 0 0 13.02 6H12zm-9 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
                </svg>
                <span>Enviar</span>
              </button>
              <button @click="openReabastecerEstoqueModal" class="btn btn-primary" title="Reabastecer Estoque" :disabled="isLoadingList">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle-fill" viewBox="0 0 16 16">
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z"/>
                </svg>
                <span>Reabastecer</span>
              </button>
              <button @click="openHistoricoGeralModal" class="btn btn-tertiary" title="Ver Histórico Geral">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
                    <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.126.342zM13.5 2.344a7 7 0 0 0-.642-.339l.361-.92c.317.12.63.251.938.399l-.73.73zm1.368 1.368a7 7 0 0 0-.4-.935l.73-.73c.15.305.283.617.399.938l-.92.36zM8.5 7.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H6a.5.5 0 0 1 0-1h2.5z"/>
                    <path d="M8 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m0 1.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m0 1.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0"/>
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2"/>
                </svg>
              </button>
              <button @click="toggleFilters" class="toggle-button icon-only" :class="{ 'active': isFilterExpanded }" title="Filtros">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-funnel-fill" viewBox="0 0 16 16">
                  <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.74.439L7 12.439a.5.5 0 0 1-.26-.439V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5z"/>
                </svg>
              </button>
            </div>
          </div>

          <Transition name="filter-collapse">
            <ProdutoFiltros
                v-if="isFilterExpanded"
                :categorias="categoriasMap"
                @filtros-atualizados="handleFiltrosAtualizados"
                class="filter-area" />
          </Transition>

          <EstoqueAlertas v-if="!isLoadingList && produtosComAlerta.length > 0" :produtosComAlerta="produtosComAlerta" />
          
          <div class="card-body no-padding">
            <div v-if="isLoadingList" class="status-message">
                <div class="spinner-large"></div>
                Carregando produtos...
            </div>
            <div v-else-if="!produtos || produtos.length === 0" class="status-message">Nenhum produto cadastrado.</div>
            <div v-else-if="produtosFiltrados.length === 0" class="status-message">Nenhum produto encontrado com os filtros atuais.</div>
            
            <div class="table-responsive" v-else>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th class="text-center">Qtd.</th>
                    <th class="text-center">Un.</th>
                    <th class="text-right">Valor Unit.</th>
                    <th>Vencimento</th>
                    <th>Última Modificação</th>
                    <th class="text-center">Ações</th>
                  </tr>
                </thead>
                <TransitionGroup name="list" tag="tbody">
                  <tr v-for="produto in produtosFiltrados" :key="produto.id" :class="getRowClass(produto)">
                    <td data-label="Produto:">{{ produto.nome }}</td>
                    <td data-label="Categoria:">{{ getCategoriaLabel(produto.categoria) }}</td>
                    <td data-label="Qtd:" class="text-center" :id="`produto-qty-${produto.id}`">
                      <span class="quantity-tag" :class="getQuantityClass(produto)">
                        {{ produto.quantidade ?? '-' }}
                      </span>
                    </td>
                    <td data-label="Un.:" class="text-center">{{ produto.unidade_medida }}</td>
                    <td data-label="Valor:" class="text-right">{{ formatCurrency(produto.valor) }}</td>
                    <td data-label="Vencimento:">{{ formatDate(produto.data_vencimento) }}</td>
                    <td data-label="Modificado:">{{ formatDateTime(produto.data_modificacao) }}</td>
                    <td data-label="Ações:" class="actions-cell">
                      <div class="action-menu-container" v-click-outside="() => closeActionMenu(produto.id)">
                        <button @click.stop="toggleActionMenu(produto.id)" class="action-menu-trigger" title="Mais Ações">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
                          </svg>
                        </button>
                        <Transition name="fade">
                          <div v-if="openedActionMenuId === produto.id" class="action-dropdown">
                            <button @click="executarEdicao(produto)" class="action-dropdown-item">
                               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/></svg>
                              Editar
                            </button>
                            <button @click="executarExclusao(produto.id)" class="action-dropdown-item delete">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16"><path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/></svg>
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
          </div>
        </div>
      </div>
    </div>

    <!-- Modais (não alterados) -->
    <EnviarEstoqueModal :show="showEnviarModal" :produtos="produtos" @close="showEnviarModal = false" @confirmar-envio="handleConfirmarEnvio" />
    <ReabastecerEstoqueModal ref="reabastecerModalRef" :show="showReabastecerModal" :produtos="produtos" @close="showReabastecerModal = false" @confirmar-reabastecimento="handleConfirmarReabastecimento" />
    <ConfirmationModal :show="confirmationState.isVisible.value" :title="confirmationState.title.value" :message="confirmationState.message.value" :confirm-text="confirmationState.options.value.confirmText" :cancel-text="confirmationState.options.value.cancelText" :variant="confirmationState.options.value.variant" @confirm="confirmationState.handleConfirm" @close="confirmationState.handleCancel" />
    <HistoricoGeralModal :show="showHistoricoGeralModal" @close="showHistoricoGeralModal = false" />
  </div>
</template>

<script setup>
// SEU SCRIPT SETUP PERMANECE EXATAMENTE O MESMO
// --- BLOCO 1: IMPORTAÇÕES E INICIALIZAÇÕES ---
  import { ref, onMounted, computed, nextTick } from 'vue';
  import { useToast } from "vue-toastification"; // Para feedback visual ao usuário.
  import ProdutoFiltros from './ProdutoFiltros.vue'; // Componente filho para filtros.
  import EnviarEstoqueModal from './EnviarEstoqueModal.vue'; // Componente filho para o modal de envio.
  import { useEscolasStore } from '@/stores/escolas'; // Store Pinia (instanciada mas não usada diretamente neste arquivo).
  import ReabastecerEstoqueModal from './ReabastecerEstoqueModal.vue';
  import EstoqueAlertas from './EstoqueAlertas.vue';
  import ConfirmationModal from '@/components/ConfirmationModal.vue'; 
  import { useConfirmation } from '@/composables/useConfirmation';
  import HistoricoGeralModal from './HistoricoGeralModal.vue'; 

  const API_URL = import.meta.env.VITE_API_BASE_URL;
  
  const toast = useToast(); // Instância do serviço de toast.
  const escolasStore = useEscolasStore(); // Instância da store de escolas (uso potencial pelo modal ou futuras features).

  // Instancia o composable de confirmação
  const confirmationState = useConfirmation();
  const { confirm } = confirmationState;
  
  // --- BLOCO 2: ESTADO LOCAL DO COMPONENTE (REFS) ---
  // Controla a visibilidade e estado de elementos da UI e dados.
  const isFormExpanded = ref(false);      // Controla se o formulário de add/edit está expandido.
  const editandoProdutoId = ref(null);    // ID do produto atualmente em edição (null se não estiver editando).
  const produtoEmEdicao = ref(null);      // Cópia do produto sendo editado (usado para o título do formulário).
  const openedActionMenuId = ref(null);   // ID do produto cujo menu de ações está aberto.
  const isFilterExpanded = ref(false);    // Controla se o painel de filtros está expandido.
  const showEnviarModal = ref(false);     // Controla a visibilidade do modal de envio de estoque.
  const showReabastecerModal = ref(false); // Adicione esta linha
  const showHistoricoGeralModal = ref(false);
  const reabastecerModalRef = ref(null); // Para controlar o loading do modal filho
  
  // Estrutura inicial para o `formData` (usado para v-model no formulário).
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
  const formData = ref(getInitialFormData()); // Dados do formulário de produto.
  
  const produtos = ref([]);               // Array para armazenar a lista de produtos vinda da API.
  const isLoading = ref(false);           // Estado de carregamento para operações do formulário (cadastro/atualização).
  const isLoadingList = ref(true);        // Estado de carregamento para a busca inicial da lista de produtos.
  const validationError = ref('');        // Mensagem de erro de validação para o formulário.
  const filtrosAtivos = ref({ nome: '', categoria: '' }); // Objeto para armazenar os filtros ativos.
  
  // Mapeamento de chaves de categoria para rótulos legíveis.
  const categoriasMap = {
    graos_cereais: 'Grãos/Cereais', laticinios: 'Laticínios', carnes_ovos: 'Carnes/Ovos',
    frutas: 'Frutas', verduras_legumes: 'Verduras/Legumes', nao_pereciveis: 'Não Perecíveis',
    congelados: 'Congelados', limpeza: 'Limpeza', outros: 'Outros'
  };
  
  // --- BLOCO 3: PROPRIEDADES COMPUTADAS ---
  // `isEditing`: Determina se o componente está em modo de edição baseado em `editandoProdutoId`.
  const isEditing = computed(() => editandoProdutoId.value !== null);
  
  // `produtosFiltrados`: Computa a lista de produtos a ser exibida, aplicando filtros e ordenação.
  const produtosFiltrados = computed(() => {
    if (!produtos.value) return [];
    let listaFiltrada = [...produtos.value];
  
    // Filtro por nome (case-insensitive)
    const nomeFiltro = filtrosAtivos.value.nome?.trim().toLowerCase();
    if (nomeFiltro) {
        listaFiltrada = listaFiltrada.filter(p => p.nome.toLowerCase().includes(nomeFiltro));
    }
    // Filtro por categoria
    const categoriaFiltro = filtrosAtivos.value.categoria;
    if (categoriaFiltro) {
        listaFiltrada = listaFiltrada.filter(p => p.categoria === categoriaFiltro);
    }
    // Ordenação por data_modificacao (mais recente primeiro)
    listaFiltrada.sort((a, b) => {
        const dateA = a.data_modificacao ? new Date(a.data_modificacao).getTime() : 0;
        const dateB = b.data_modificacao ? new Date(b.data_modificacao).getTime() : 0;
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateB - dateA;
    });
    return listaFiltrada;
  });

    // Computado para os produtos que necessitam de alerta.
    const produtosComAlerta = computed(() => {
        return produtosFiltrados.value.filter(produto => {
            // Verifica se a quantidade é um número, senão considera 0 para segurança
            const quantidadeAtual = Number(produto.quantidade);
            if (isNaN(quantidadeAtual)) return false; // Se não for número, não alerta

            if (quantidadeAtual === 0) return true; // Alerta para estoque zerado

            const referencia = Number(produto.quantidade_referencia_alerta);
            // Alerta de metade apenas se a referência for positiva e estoque atual <= 50%
            // e quantidade atual > 0 (para não duplicar o alerta de estoque zerado)
            return !isNaN(referencia) && referencia > 0 && quantidadeAtual > 0 && quantidadeAtual <= referencia / 2;
        });
    });
  
  
  // --- BLOCO 4: DIRETIVA CUSTOMIZADA v-click-outside ---
  // Usada para fechar o menu de ações ao clicar fora dele.
  const vClickOutside = {
    beforeMount(el, binding) {
      el.clickOutsideEvent = function(event) {
        if (!(el === event.target || el.contains(event.target))) {
          binding.value(event); // Chama a função passada (ex: closeActionMenu)
        }
      };
      nextTick(() => document.addEventListener('click', el.clickOutsideEvent));
    },
    unmounted(el) {
      document.removeEventListener('click', el.clickOutsideEvent);
    }
  };
  
  // --- BLOCO 5: FUNÇÕES DE CONTROLE DA UI (FORMULÁRIO, FILTROS, MENUS) ---
  
  /**
   * @function toggleForm
   * @description Alterna a visibilidade (expandido/recolhido) do formulário de produto.
   * Se o formulário for fechado durante uma edição, a edição é cancelada.
   */
  const toggleForm = () => {
    isFormExpanded.value = !isFormExpanded.value;
    if (!isFormExpanded.value && isEditing.value) {
        cancelarEdicao();
    }
  };
  
  /**
   * @function toggleFilters
   * @description Alterna a visibilidade (expandido/recolhido) do painel de filtros.
   */
  const toggleFilters = () => {
    isFilterExpanded.value = !isFilterExpanded.value;
  };
  
  /**
   * @function handleFiltrosAtualizados
   * @param {object} novosFiltros - Objeto contendo os novos valores dos filtros.
   * @description Atualiza o estado `filtrosAtivos` com os novos filtros recebidos do componente `ProdutoFiltros`.
   */
  const handleFiltrosAtualizados = (novosFiltros) => {
    filtrosAtivos.value = novosFiltros;
  };
  
  /**
   * @function toggleActionMenu
   * @param {number|string} produtoId - O ID do produto cujo menu de ações deve ser alternado.
   * @description Abre ou fecha o menu de ações para um produto específico.
   */
  const toggleActionMenu = (produtoId) => {
    openedActionMenuId.value = openedActionMenuId.value === produtoId ? null : produtoId;
  };
  
  /**
   * @function closeActionMenu
   * @description Fecha qualquer menu de ação que esteja aberto. Usado por `v-click-outside`.
   */
  const closeActionMenu = () => {
    openedActionMenuId.value = null;
  };
  
  // --- BLOCO 6: FUNÇÕES DE FORMATAÇÃO DE DADOS ---
  
  /**
   * @function getCategoriaLabel
   * @param {string} key - A chave da categoria (ex: 'graos_cereais').
   * @returns {string} O rótulo legível da categoria ou a própria chave se não encontrada.
   */
  const getCategoriaLabel = (key) => categoriasMap[key] || key;
  
  /**
   * @function formatCurrency
   * @param {number|null|undefined} value - O valor numérico a ser formatado.
   * @returns {string} O valor formatado como moeda (BRL) ou '-' se inválido/nulo.
   */
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    const numValue = Number(value);
    if (isNaN(numValue)) return '-';
    return numValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  /**
   * @function formatDate
   * @param {string|null} dateString - A string da data (esperado YYYY-MM-DD).
   * @returns {string} A data formatada como DD/MM/AAAA ou '-' se inválida/nula.
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString + 'T00:00:00'); // Adiciona T00:00:00 para evitar problemas de fuso com datas
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
        console.error("Erro ao formatar data:", dateString, e);
        return dateString;
    }
  };
  
  /**
   * @function formatDateTime
   * @param {string|null} dateTimeString - A string da data e hora.
   * @returns {string} A data e hora formatada como DD/MM/AAAA HH:MM ou '-' se inválida/nula.
   */
  const formatDateTime = (dateTimeString) => {
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
        });
    } catch (e) {
        console.error("Erro ao formatar data/hora:", dateTimeString, e);
        return dateTimeString;
    }
  };
  
  /**
   * @function formatDateForInput
   * @param {string|null} dateString - A string da data.
   * @returns {string} A data formatada como AAAA-MM-DD, adequada para `<input type="date">`.
   */
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString + 'T00:00:00'); // Consistência com formatDate
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


const getRowClass = (produto) => {
  const quantidadeAtual = Number(produto.quantidade);
  if (isNaN(quantidadeAtual)) return ''; 

  if (quantidadeAtual === 0) return 'stock-zero';
  
  const referencia = Number(produto.quantidade_referencia_alerta);
  if (!isNaN(referencia) && referencia > 0 && quantidadeAtual > 0 && quantidadeAtual <= referencia / 2) {
    return 'stock-half';
  }
  return '';
};

const getQuantityClass = (produto) => {
  const rowClass = getRowClass(produto);
  if (rowClass === 'stock-zero') return 'qty-zero';
  if (rowClass === 'stock-half') return 'qty-half';
  return 'qty-normal';
}
  
  // --- BLOCO 7: FUNÇÕES DE INTERAÇÃO COM API (CRUD DE PRODUTOS) ---
  
  /**
   * @function fetchProdutos
   * @description Busca a lista de produtos da API.
   * Atualiza `produtos.value` e os estados de carregamento. Trata erros de autenticação e de rede.
   */
  const fetchProdutos = async () => {
    isLoadingList.value = true;
    try {
        const token = localStorage.getItem('authToken');
    if (!token) {
        // Se não houver token, não há necessidade de fazer a chamada fetch
        toast.error("Token de autenticação não encontrado. Faça login.");
        produtos.value = []; // Limpa os produtos
        // router.push('/login'); // Redirecionar para login
        isLoadingList.value = false;
        return; // Interrompe a execução
    }

    const response = await fetch(`${API_URL}/produtos`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    // Lê o corpo da resposta UMA VEZ, independentemente do status
    const responseData = await response.json().catch(err => {
        console.warn("Falha ao parsear JSON da resposta:", err, "Status:", response.status);
        return { error: `Erro ao processar resposta do servidor (Status: ${response.status})`, details: err.message };
    });

    if (!response.ok) {
        let errorMsg = responseData?.error || `Falha ao buscar produtos (Status: ${response.status})`;
        if (responseData?.details) {
            errorMsg += ` Detalhes: ${responseData.details}`;
        }

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            toast.error("Sessão inválida ou expirada. Faça login novamente.");
        } else {
            toast.error(errorMsg);
        }
        produtos.value = []; // Limpa os produtos em caso de erro
        throw new Error(errorMsg);
    }

    produtos.value = responseData.map(p => ({
      ...p,
      quantidade: p.quantidade !== null && p.quantidade !== undefined ? Number(p.quantidade) : 0,
      quantidade_referencia_alerta: p.quantidade_referencia_alerta !== null && p.quantidade_referencia_alerta !== undefined ? Number(p.quantidade_referencia_alerta) : null,
      valor: p.valor !== null && p.valor !== undefined ? Number(p.valor) : null
    }));
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        toast.error(`Erro ao carregar produtos: ${error.message}`);
        produtos.value = [];
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
  
      const payload = {
          ...formData.value,
          nome: formData.value.nome.trim(),
          quantidade: (formData.value.quantidade === '' || formData.value.quantidade === null) ? null : Number(formData.value.quantidade),
          valor: (formData.value.valor === '' || formData.value.valor === null) ? null : Number(formData.value.valor),
          data_vencimento: formData.value.data_vencimento === '' ? null : formData.value.data_vencimento
      };
      delete payload.id;
  
      const response = await fetch(`${API_URL}/produtos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload),
      });
      const responseData = await response.json();
      if (!response.ok) {
          if (response.status === 409 && responseData.error) {
              validationError.value = responseData.error;
              toast.error(responseData.error);
          } else {
              const genericError = responseData.error || `Falha ao cadastrar produto (Status: ${response.status})`;
              validationError.value = genericError;
              toast.error(`Erro ao cadastrar: ${genericError}`);
          }
          return;
      }
      produtos.value.unshift(responseData);
      toast.success(`Produto "${responseData.nome}" adicionado com sucesso!`);
      resetForm();
      isFormExpanded.value = false;
    } catch (error) {
        console.error("Erro ao cadastrar produto:", error);
        toast.error(`Erro ao cadastrar: ${error.message}`);
    } finally {
        isLoading.value = false;
    }
  };
  
  const iniciarEdicao = (produto) => {
    validationError.value = '';
    editandoProdutoId.value = produto.id;
    produtoEmEdicao.value = { ...produto };
  
    formData.value = {
        id: produto.id,
        nome: produto.nome,
        descricao: produto.descricao || '',
        unidade_medida: produto.unidade_medida,
        categoria: produto.categoria,
        quantidade: produto.quantidade ?? null,
        valor: produto.valor ?? null,
        data_vencimento: formatDateForInput(produto.data_vencimento),
    };
  
    isFormExpanded.value = true;
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
  
        const payload = {
          ...formData.value,
          nome: formData.value.nome.trim(),
          quantidade: (formData.value.quantidade === '' || formData.value.quantidade === null) ? null : Number(formData.value.quantidade),
          valor: (formData.value.valor === '' || formData.value.valor === null) ? null : Number(formData.value.valor),
          data_vencimento: formData.value.data_vencimento === '' ? null : formData.value.data_vencimento
        };
  
        const response = await fetch(`${API_URL}/produtos/${editandoProdutoId.value}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload),
        });
        const responseData = await response.json();
        if (!response.ok) {
            if (response.status === 409 && responseData.error) {
                validationError.value = responseData.error;
                toast.error(responseData.error);
            } else {
                const genericError = responseData.error || `Falha ao atualizar produto (Status: ${response.status})`;
                validationError.value = genericError;
                toast.error(`Erro ao atualizar: ${genericError}`);
            }
            return;
        }
  
        const index = produtos.value.findIndex(p => p.id === editandoProdutoId.value);
        if (index !== -1) {
            produtos.value[index] = responseData;
        } else {
            fetchProdutos();
        }
        toast.success(`Produto "${responseData.nome}" atualizado com sucesso!`);
        resetForm();
        isFormExpanded.value = false;
    } catch (error) {
        console.error("Erro ao atualizar produto:", error);
        toast.error(`Erro ao atualizar: ${error.message}`);
    } finally {
        isLoading.value = false;
    }
  };
  
  const cancelarEdicao = () => {
    resetForm();
    isFormExpanded.value = false;
  };

  const limparCampos = () => {
    const idAtual = formData.value.id;
    formData.value = { ...getInitialFormData(), id: idAtual };
    validationError.value = '';
  };
  
  const resetForm = () => {
    formData.value = getInitialFormData();
    editandoProdutoId.value = null;
    produtoEmEdicao.value = null;
    validationError.value = '';
    isLoading.value = false;
  };
  
  const confirmarExclusao = async (id) => {
    const produtoParaExcluir = produtos.value.find(p => p.id === id);
    const nomeProduto = produtoParaExcluir ? `"${produtoParaExcluir.nome}"` : `de ID ${id}`;
  
    if (isEditing.value && editandoProdutoId.value === id) {
      cancelarEdicao();
      await nextTick();
    }
  
    if (!confirm(`Tem certeza que deseja excluir o produto ${nomeProduto}? Ele será removido dos estoques de todas as escolas associadas. Esta ação é irreversível.`)) {
        return;
    }
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("Token de autenticação não encontrado.");
  
      const response = await fetch(`${API_URL}/produtos/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401 || response.status === 403) { return; }
      if (response.status === 404) { throw new Error('Produto não encontrado no servidor.'); }
      if (!response.ok && response.status !== 204) {
          let errorMsg = `Falha ao excluir produto (Status: ${response.status})`;
          try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch(e) {}
          throw new Error(errorMsg);
      }
      produtos.value = produtos.value.filter(p => p.id !== id);
      toast.success(`Produto ${nomeProduto} excluído com sucesso.`);
    } catch (error) {
        console.error("Erro ao excluir produto:", error);
        toast.error(`Erro ao excluir: ${error.message}`);
    } finally {
        openedActionMenuId.value = null;
    }
  };
  
const executarEdicao = async (produto) => {
  closeActionMenu();

  const isFormDirty = formData.value.nome || formData.value.categoria;
  const message = isFormDirty && !isEditing.value
    ? `Deseja editar "${produto.nome}"? O conteúdo não salvo no formulário será perdido.`
    : `Deseja editar o produto "${produto.nome}"?`;

  try {
    await confirm({
      title: 'Confirmar Edição',
      message: message,
      confirmText: 'Sim, Editar',
      cancelText: 'Não',
      variant: 'warning'
    });
    iniciarEdicao(produto);
  } catch (error) {
    console.log('Edição cancelada pelo usuário.');
  }
};

const executarExclusao = async (produtoId) => {
    closeActionMenu();
    const produtoParaExcluir = produtos.value.find(p => p.id === produtoId);
    if (!produtoParaExcluir) return;

    const nomeProduto = `"${produtoParaExcluir.nome}"`;

    if (isEditing.value && editandoProdutoId.value === produtoId) {
        cancelarEdicao();
        await nextTick();
    }

    try {
        await confirm({
            title: 'Confirmar Exclusão',
            message: `Tem certeza que deseja excluir o produto ${nomeProduto}? Ele será removido de todos os estoques. Esta ação é irreversível.`,
            confirmText: 'Excluir Permanentemente',
            cancelText: 'Cancelar',
            variant: 'danger'
        });

        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error("Token de autenticação não encontrado.");

            const response = await fetch(`${API_URL}/produtos/${produtoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 404) { throw new Error('Produto não encontrado no servidor.'); }
            if (!response.ok && response.status !== 204) {
                let errorMsg = `Falha ao excluir produto (Status: ${response.status})`;
                try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch(e) {}
                throw new Error(errorMsg);
            }
            
            produtos.value = produtos.value.filter(p => p.id !== produtoId);
            toast.success(`Produto ${nomeProduto} excluído com sucesso.`);

        } catch (error) {
            console.error("Erro ao excluir produto:", error);
            toast.error(`Erro ao excluir: ${error.message}`);
        }

    } catch (error) {
        console.log('Exclusão cancelada pelo usuário.');
    }
};
  
  const openEnviarEstoqueModal = () => {
    showEnviarModal.value = true;
  };
  
  const handleConfirmarEnvio = async (payload) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error("Sessão expirada. Faça login novamente.");
        showEnviarModal.value = false;
        return;
      }
  
      const response = await fetch(`${API_URL}/transferencias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload),
      });
      const responseData = await response.json();
      if (!response.ok) {
          throw new Error(responseData.error || `Falha ao registrar a transferência (Status: ${response.status})`);
      }
  
      toast.success(responseData.message || "Estoque enviado com sucesso!");
  
      payload.itens.forEach(itemEnviado => {
          const index = produtos.value.findIndex(p => p.id === itemEnviado.produto_id);
          if (index !== -1) {
              const produtoOriginal = produtos.value[index];
              const novaQuantidade = (produtoOriginal.quantidade ?? 0) - itemEnviado.quantidade;
              produtos.value[index] = {
                  ...produtoOriginal,
                  quantidade: novaQuantidade < 0 ? 0 : novaQuantidade,
              };
          }
      });
      showEnviarModal.value = false;
    } catch (error) {
        console.error("Erro ao enviar estoque:", error);
        toast.error(`Erro ao enviar: ${error.message}`);
        showEnviarModal.value = false;
    }
  };

const openReabastecerEstoqueModal = () => {
  showReabastecerModal.value = true;
};

const handleConfirmarReabastecimento = async (payloadItens) => {
  if (!reabastecerModalRef.value) return;
  reabastecerModalRef.value.setLoading(true);

  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error("Sessão expirada. Faça login novamente.");
      showReabastecerModal.value = false;
      reabastecerModalRef.value.setLoading(false);
      return;
    }

    const response = await fetch(`${API_URL}/produtos/reabastecer-multiplos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ itens: payloadItens }),
    });
    const responseData = await response.json().catch(err => {
        console.warn("Falha ao parsear JSON da resposta de reabastecimento:", err, "Status:", response.status);
        return { error: `Erro ao processar resposta do servidor (Status: ${response.status})`, details: err.message };
    });

    if (!response.ok) {
        let errorMsg = responseData?.error || `Falha ao reabastecer o estoque (Status: ${response.status})`;
        if (responseData?.details) {
             errorMsg += ` Detalhes: ${responseData.details}`;
        }
        throw new Error(errorMsg);
    }

    toast.success(responseData.message || "Estoque reabastecido com sucesso!");

    if (responseData.produtos_atualizados && Array.isArray(responseData.produtos_atualizados)) {
        responseData.produtos_atualizados.forEach(produtoAtualizadoServidor => { 
            const index = produtos.value.findIndex(p => p.id === produtoAtualizadoServidor.id);
            if (index !== -1) {
                produtos.value[index] = {
                    ...produtos.value[index],
                    ...produtoAtualizadoServidor,
                    quantidade: Number(produtoAtualizadoServidor.quantidade),
                    quantidade_referencia_alerta: produtoAtualizadoServidor.quantidade_referencia_alerta !== null ? Number(produtoAtualizadoServidor.quantidade_referencia_alerta) : null
                };
            }
        });
    }

    showReabastecerModal.value = false;
  } catch (error) {
      console.error("Erro ao reabastecer estoque:", error);
      toast.error(`Erro ao reabastecer: ${error.message}`);
  } finally {
    if (reabastecerModalRef.value) {
      reabastecerModalRef.value.setLoading(false);
    }
  }
};

const openHistoricoGeralModal = () => {
    showHistoricoGeralModal.value = true;
};
  
onMounted(() => {
    fetchProdutos();
});
</script>

<style scoped>
/* --- PALETA DE CORES E VARIÁVEIS --- */
:root, .produtos-view {
  --cor-primaria: #28a745;         /* Verde Sucesso */
  --cor-primaria-hover: #218838;
  --cor-secundaria: #007bff;        /* Azul Info */
  --cor-secundaria-hover: #0056b3;
  --cor-terciaria: #6c757d;       /* Cinza para ações neutras */
  --cor-terciaria-hover: #5a6268;
  --cor-fundo: #f8f9fa;             /* Fundo geral da página */
  --cor-fundo-card: #ffffff;
  --cor-fundo-cabecalho: #f7f9fc;
  --cor-texto-principal: #212529;
  --cor-texto-secundario: #6c757d;
  --cor-borda: #dee2e6;
  --cor-sombra: rgba(0, 0, 0, 0.075);
  --cor-foco: rgba(40, 167, 69, 0.25);
  --cor-perigo: #dc3545;
  --cor-perigo-hover: #c82333;
  --cor-aviso: #ffc107;
  --cor-aviso-fundo: #fff3cd;
  --cor-zerado-fundo: #f8d7da;

  --raio-borda: 8px;
  --sombra-card: 0 4px 12px var(--cor-sombra);
}

/* --- GERAL & LAYOUT --- */
.produtos-view {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  color: var(--cor-texto-principal);
}
.page-header {
  margin-bottom: 2rem;
  text-align: center;
}
.page-header h1 {
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}
.page-subtitle {
  font-size: 1.1rem;
  color: var(--cor-texto-secundario);
  margin-top: 0;
}
.content-area {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* --- ESTILOS DE CARD --- */
.card {
  background-color: var(--cor-fundo-card);
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio-borda);
  box-shadow: var(--sombra-card);
  overflow: hidden;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: var(--cor-fundo-cabecalho);
  border-bottom: 1px solid var(--cor-borda);
  cursor: pointer;
  user-select: none;
}
.form-card.is-editing {
    /* Define uma variável de foco azul específica para o modo de edição */
    --cor-foco: rgba(0, 123, 255, 0.25); 

    /* Adiciona uma borda e um brilho azul sutil ao redor de todo o card */
    border-color: var(--cor-secundaria);
    box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.1), var(--sombra-card);
}

.form-card.is-editing .card-header {
    /* Deixa o fundo do cabeçalho com um tom azul claro */
    background-color: rgba(0, 123, 255, 0.07);
    border-bottom-color: rgba(0, 123, 255, 0.2);
}

/* Muda a cor da borda de foco dos inputs e selects para azul */
.form-card.is-editing .product-form input:focus,
.form-card.is-editing .product-form select:focus {
    border-color: var(--cor-secundaria);
    /* O box-shadow usará a variável --cor-foco que foi sobrescrita acima */
}
.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.card-title-icon {
  color: var(--cor-texto-secundario);
}
.card-body {
  padding: 1.5rem;
}
.card-body.no-padding {
  padding: 0;
}

/* --- FORMULÁRIO DE PRODUTO --- */
.product-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.25rem;
}
.form-group {
  display: flex;
  flex-direction: column;
}
.form-group.col-grow {
  grid-column: 1 / -1; /* Ocupa a linha toda em layouts maiores */
}
@media (min-width: 768px) {
  .form-group.col-grow {
    grid-column: span 3; /* Ocupa 3 das 4 colunas */
  }
  .form-group.col-small {
    grid-column: span 1; /* Ocupa 1 */
  }
}
.product-form label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--cor-texto-secundario);
}
.optional-label {
    font-weight: 400;
    font-size: 0.8rem;
}
.product-form input, .product-form select {
  padding: 0.75rem 1rem;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio-borda);
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.product-form input:focus, .product-form select:focus {
  outline: none;
  border-color: var(--cor-primaria);
  box-shadow: 0 0 0 3px var(--cor-foco);
}
.product-form select {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.7rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    padding-right: 2.8rem;
    appearance: none;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

/* --- BOTÕES --- */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--raio-borda);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-decoration: none;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-primary {
  background-color: var(--cor-primaria);
  color: white;
}
.btn-primary:hover:not(:disabled) {
  background-color: var(--cor-primaria-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
.btn-secondary {
  background-color: var(--cor-secundaria);
  color: white;
}
.btn-secondary:hover:not(:disabled) {
  background-color: var(--cor-secundaria-hover);
}
.btn-tertiary {
  background-color: var(--cor-fundo-card);
  color: var(--cor-texto-secundario);
  border: 1px solid var(--cor-borda);
}
.btn-tertiary:hover:not(:disabled) {
  background-color: var(--cor-fundo-cabecalho);
  border-color: #adb5bd;
}

/* Botões de Ação do Cabeçalho da Lista */
.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.toggle-button.icon-only {
  background: transparent;
  border: none;
  color: var(--cor-texto-secundario);
  padding: 0.25rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;
}
.toggle-button.icon-only:hover {
  background-color: rgba(0,0,0,0.05);
}
.toggle-button.icon-only.active {
    background-color: var(--cor-foco);
    color: var(--cor-primaria);
}

/* --- ÁREA DE FILTROS --- */
.filter-area {
  padding: 1.5rem;
  border-top: 1px solid var(--cor-borda);
  background-color: var(--cor-fundo-cabecalho);
}

/* --- TABELA DE DADOS --- */
.status-message {
    padding: 3rem 1.5rem;
    text-align: center;
    color: var(--cor-texto-secundario);
    font-size: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}
.table-responsive {
  width: 100%;
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.data-table th, .data-table td {
  padding: 1rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid var(--cor-borda);
  border-right: 1px solid var(--cor-borda); 
  white-space: nowrap;
}
.data-table th:first-child,
.data-table td:first-child {
  white-space: normal;      /* <<< ESSA É A LINHA PRINCIPAL: Permite a quebra de linha */
  overflow-wrap: break-word; /* Garante que palavras muito longas sem espaços também quebrem */
  min-width: 200px;         /* (Opcional) Define uma largura mínima para a coluna */
  max-width: 450px;         /* (Opcional) Define uma largura máxima para evitar que fique muito larga */
}
.data-table thead {
  background-color: var(--cor-fundo-cabecalho);
}
.data-table th {
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--cor-texto-secundario);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.data-table tbody tr:hover {
  background-color: #f1f3f5;
}
.data-table tbody tr:last-child td {
  border-bottom: none;
}
.text-right { text-align: right; }
.text-center { text-align: center; }

/* Destaques de Estoque */
.data-table tr.stock-half td {
  background-color: var(--cor-aviso-fundo) !important;
}
.data-table tr.stock-zero td {
  background-color: var(--cor-zerado-fundo) !important;
}
.quantity-tag {
  display: inline-block;
  padding: 0.25em 0.6em;
  font-size: 0.8em;
  font-weight: 700;
  border-radius: 20px;
  min-width: 30px;
  text-align: center;
}
.qty-normal {
  background-color: #e9ecef;
  color: #495057;
}
.qty-half {
  background-color: var(--cor-aviso);
  color: #333;
}
.qty-zero {
  background-color: var(--cor-perigo);
  color: white;
}

/* --- MENU DE AÇÕES (DROPDOWN) --- */
.actions-cell {
  text-align: center;
  position: relative;
}
.action-menu-container {
  display: inline-block;
  position: relative;
}
.action-menu-trigger {
  background: transparent;
  border: none;
  padding: 0.25rem;
  border-radius: 50%;
  cursor: pointer;
  color: var(--cor-texto-secundario);
  transition: background-color 0.2s;
  display: flex;
}
.action-menu-trigger:hover {
  background-color: var(--cor-borda);
  color: var(--cor-texto-principal);
}
.action-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 5px);
  background-color: var(--cor-fundo-card);
  border-radius: var(--raio-borda);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  border: 1px solid var(--cor-borda);
  z-index: 10;
  min-width: 150px;
  padding: 0.5rem 0;
  overflow: hidden;
}
.action-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: none;
  border: none;
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--cor-texto-principal);
}
.action-dropdown-item:hover {
  background-color: var(--cor-fundo-cabecalho);
}
.action-dropdown-item.delete {
  color: var(--cor-perigo);
}
.action-dropdown-item.delete:hover {
  background-color: #f8d7da;
}

/* --- ANIMAÇÕES E TRANSIÇÕES --- */
@keyframes spinner-border { to { transform: rotate(360deg); } }
.spinner {
  display: inline-block;
  width: 1.2em; height: 1.2em;
  vertical-align: -0.125em;
  border: 0.2em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border .75s linear infinite;
}
.spinner-large {
    width: 2.5rem; height: 2.5rem;
    border-width: 0.3rem;
    color: var(--cor-primaria);
}

.collapse-enter-active, .collapse-leave-active { transition: all 0.3s ease-in-out; }
.collapse-enter-from, .collapse-leave-to { transform: translateY(-10px); opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; }
.collapse-enter-to, .collapse-leave-from { max-height: 1000px; opacity: 1; }

.filter-collapse-enter-active, .filter-collapse-leave-active { transition: all 0.3s ease-in-out; }
.filter-collapse-enter-from, .filter-collapse-leave-to { opacity: 0; max-height: 0; }
.filter-collapse-enter-to, .filter-collapse-leave-from { max-height: 500px; opacity: 1; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(20px); }
.list-leave-active { position: absolute; }
</style>