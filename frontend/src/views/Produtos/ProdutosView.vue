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
        </header>
  
        <!-- 2. ÁREA DE CONTEÚDO PRINCIPAL -->
        <!-- Organiza o formulário, a lista de produtos e os filtros. -->
        <div class="content-area">
            <!-- 3. CARD DO FORMULÁRIO DE ADIÇÃO/EDIÇÃO DE PRODUTO -->
            <!--
              - `:class="{ 'is-editing-mode': isEditing }"`: Adiciona uma classe CSS quando em modo de edição.
              - O cabeçalho do card também funciona como um botão para expandir/recolher o formulário.
            -->
            <div class="card form-card" :class="{ 'is-editing-mode': isEditing }">
                <!-- 3.1. CABEÇALHO DO FORMULÁRIO (COLAPSÁVEL) -->
                <div class="form-card-header" @click="toggleForm">
                    <!-- Título dinâmico: "Adicionar Novo Produto" ou "Editando: [Nome do Produto]" -->
                    <h2 class="card-title">{{ isEditing ? `Editando: ${produtoEmEdicao?.nome || ''}` : 'Adicionar Novo Produto' }}</h2>
                    <button type="button" class="toggle-form-button icon-only" aria-label="Mostrar/Ocultar Formulário">
                        <!-- Ícone de chevron para indicar estado expandido/recolhido -->
                        <svg v-if="isFormExpanded" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/>
                        </svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
                        </svg>
                    </button>
                </div>
  
                <!-- 3.2. CONTEÚDO COLAPSÁVEL DO FORMULÁRIO -->
                <!-- Utiliza `<Transition name="collapse">` para animação de expansão/recolhimento. -->
                <Transition name="collapse">
                    <div v-if="isFormExpanded" class="form-collapsible-content">
                        <!-- FORMULÁRIO UNIFICADO PARA CADASTRO E EDIÇÃO -->
                        <form @submit.prevent="salvarProduto" class="form-cadastro">
                            <!-- 3.2.1. MENSAGEM DE FEEDBACK/VALIDAÇÃO -->
                            <div v-if="validationError" class="feedback-message error form-feedback">
                                {{ validationError }}
                            </div>
  
                            <!-- 3.2.2. CAMPOS DO FORMULÁRIO (ORGANIZADOS EM LINHAS) -->
                            <!-- Linha 1: Nome e Unidade -->
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
  
                            <!-- Linha 2: Categoria, Quantidade, Valor e Vencimento -->
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
  
                            <!-- Linha 3 (removida no código original, era Linha 4): Descrição -->
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="descricaoProduto" class="form-label optional">Descrição (Opcional):</label>
                                    <input type="text" id="descricaoProduto" v-model="formData.descricao" class="form-input" placeholder="Detalhes adicionais..." />
                                </div>
                            </div>
  
                            <!-- 3.2.3. BOTÕES DE AÇÃO DO FORMULÁRIO -->
                            <div class="form-actions">
                                <button type="submit" class="submit-button" :disabled="isLoading">
                                    <span v-if="isLoading" class="spinner"></span> <!-- Indicador de carregamento -->
                                    <span>{{ isLoading ? (isEditing ? 'Salvando...' : 'Adicionando...') : (isEditing ? 'Salvar Alterações' : 'Adicionar Produto') }}</span>
                                </button>
                                <button type="button" v-if="isEditing" @click="cancelarEdicao" class="cancel-button" :disabled="isLoading">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </Transition>
            </div> <!-- Fim do card do formulário -->
  
            <!-- 4. CONTAINER PARA A LISTA DE PRODUTOS E FILTROS -->
            <!-- Organiza a lista e os filtros lado a lado ou empilhados, dependendo do CSS. -->
            <div class="list-filter-container">
                <!-- 4.1. CARD DA LISTA DE PRODUTOS -->
                <div class="card product-list-card">
                    <!-- 4.1.1. CABEÇALHO DA LISTA -->
                    <!-- Inclui título, botão "Enviar Estoque" e botão para alternar filtros. -->
                    <div class="list-card-header">
                        <h2 class="card-title list-title">Produtos em Estoque - SME</h2>
                        <div class="list-header-actions">
                             <!-- Botão para abrir o modal de envio de estoque -->
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
                             <!-- Botão para mostrar/ocultar filtros -->
                             <button
                                type="button"
                                @click="toggleFilters"
                                class="toggle-filter-button icon-only"
                                :aria-expanded="isFilterExpanded"
                                aria-label="Mostrar/Ocultar Filtros"
                                title="Mostrar/Ocultar Filtros"
                              >
                            <svg v-if="!isFilterExpanded" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-funnel" viewBox="0 0 16 16">
                                <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.74.439L7 12.439a.5.5 0 0 1-.26-.439V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5zM2 2v1.586l3.999 4.667a.5.5 0 0 1 .26.439v3.561l1.406.937a.5.5 0 0 1 .26.439V8.692L12 3.586V2z"/>
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-funnel-fill" viewBox="0 0 16 16">
                               <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.74.439L7 12.439a.5.5 0 0 1-.26-.439V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5z"/>
                            </svg>
                        </button>
                    </div>
                  </div>
  
                    <!-- 4.1.2. CONTEÚDO DA LISTA (TABELA DE PRODUTOS) -->
                    <!-- Mensagens de estado: carregando, lista vazia, nenhum resultado para filtros. -->
                    <div v-if="isLoadingList" class="loading-list">Carregando produtos...</div>
                    <div v-else-if="!produtos || produtos.length === 0" class="empty-list">Nenhum produto cadastrado ainda.</div>
                    <div v-else-if="produtosFiltrados.length === 0" class="empty-list">Nenhum produto encontrado com os filtros atuais.</div>
  
                    <!-- Tabela responsiva para exibir os produtos -->
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
                            <!--
                              Usa `<TransitionGroup name="list" tag="tbody">` para animar a entrada/saída de itens na lista.
                              Cada linha `<tr>` representa um produto.
                            -->
                            <TransitionGroup name="list" tag="tbody">
                                <tr v-for="produto in produtosFiltrados" :key="produto.id">
                                    <td data-label="Nome:">{{ produto.nome }}</td>
                                    <td data-label="Categoria:">{{ getCategoriaLabel(produto.categoria) }}</td>
                                    <td data-label="Unidade:">{{ produto.unidade_medida }}</td>
                                    <td data-label="Qtd:" class="text-right" :id="`produto-qty-${produto.id}`"> <!-- ID para atualização direta da QTD após envio -->
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
                                    <!-- 4.1.2.1. CÉLULA DE AÇÕES COM MENU DROPDOWN -->
                                    <td data-label="Ações:" class="actions-cell">
                                      <div class="action-menu-container">
                                            <!-- Botão para abrir o menu de ações do produto -->
                                            <button @click.stop="toggleActionMenu(produto.id)" class="action-menu-trigger icon-only" title="Mais Ações">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots-vertical" viewBox="0 0 16 16">
                                                    <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
                                                </svg>
                                            </button>
                                            <!-- Menu Dropdown (condicionalmente visível) -->
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
                </div> <!-- Fim do card da lista de produtos -->
  
                <!-- 4.2. COMPONENTE DE FILTROS -->
                <!--
                  - Visível condicionalmente (`v-if="isFilterExpanded"`) com animação de transição.
                  - Recebe `categoriasMap` como prop.
                  - Emite o evento `filtros-atualizados` quando os filtros são alterados.
                -->
                <Transition name="filter-collapse">
                    <ProdutoFiltros
                        v-if="isFilterExpanded"
                        :categorias="categoriasMap"
                        @filtros-atualizados="handleFiltrosAtualizados"
                        class="filter-card" />
                </Transition>
            </div> <!-- Fim do container da lista e filtros -->
        </div> <!-- Fim da área de conteúdo -->
  
        <!-- 5. MODAL DE ENVIO DE ESTOQUE -->
        <!--
          - `:show`: Controla a visibilidade do modal.
          - `:produtos`: Passa a lista de produtos para o modal.
          - `@close`: Evento emitido pelo modal para fechar.
          - `@confirmar-envio`: Evento emitido pelo modal com os dados da transferência.
        -->
        <EnviarEstoqueModal
          :show="showEnviarModal"
          :produtos="produtos"
          @close="showEnviarModal = false"
          @confirmar-envio="handleConfirmarEnvio"
        />
    </div> <!-- Fim da view de produtos -->
  </template>
  
  <script setup>
  // --- BLOCO 1: IMPORTAÇÕES E INICIALIZAÇÕES ---
  import { ref, onMounted, computed, nextTick } from 'vue';
  import { useToast } from "vue-toastification"; // Para feedback visual ao usuário.
  import ProdutoFiltros from './ProdutoFiltros.vue'; // Componente filho para filtros.
  import EnviarEstoqueModal from './EnviarEstoqueModal.vue'; // Componente filho para o modal de envio.
  import { useEscolasStore } from '@/stores/escolas'; // Store Pinia (instanciada mas não usada diretamente neste arquivo).
  
  const toast = useToast(); // Instância do serviço de toast.
  const escolasStore = useEscolasStore(); // Instância da store de escolas (uso potencial pelo modal ou futuras features).
  
  // --- BLOCO 2: ESTADO LOCAL DO COMPONENTE (REFS) ---
  // Controla a visibilidade e estado de elementos da UI e dados.
  const isFormExpanded = ref(false);      // Controla se o formulário de add/edit está expandido.
  const editandoProdutoId = ref(null);    // ID do produto atualmente em edição (null se não estiver editando).
  const produtoEmEdicao = ref(null);      // Cópia do produto sendo editado (usado para o título do formulário).
  const openedActionMenuId = ref(null);   // ID do produto cujo menu de ações está aberto.
  const isFilterExpanded = ref(false);    // Controla se o painel de filtros está expandido.
  const showEnviarModal = ref(false);     // Controla a visibilidade do modal de envio de estoque.
  
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
    if (value === null || value === undefined) return '';
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
        if (!token) throw new Error("Token de autenticação não encontrado.");
  
        const response = await fetch('http://localhost:3000/api/produtos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
  
        if (response.status === 401 || response.status === 403) {
             localStorage.removeItem('authToken'); // Limpa token inválido
             toast.error("Sessão inválida ou expirada. Faça login novamente.");
             // TODO: Implementar redirecionamento para login: router.push('/login');
             produtos.value = []; isLoadingList.value = false; return;
        }
        if (!response.ok) {
            let errorMsg = `Falha ao buscar produtos (Status: ${response.status})`;
            try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch(e) {}
            throw new Error(errorMsg);
        }
        produtos.value = await response.json(); // API deve retornar 'data_modificacao'
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        toast.error(`Erro ao carregar produtos: ${error.message}`);
        produtos.value = [];
    } finally {
        isLoadingList.value = false;
    }
  };
  
  /**
   * @function salvarProduto
   * @description Decide se chama `cadastrarProduto` ou `atualizarProduto` baseado no estado `isEditing`.
   */
  const salvarProduto = () => {
    if (isEditing.value) {
        atualizarProduto();
    } else {
        cadastrarProduto();
    }
  };
  
  /**
   * @function validarFormulario
   * @description Realiza validações básicas nos campos do formulário.
   * @returns {boolean} True se o formulário for válido, false caso contrário. Exibe toasts de aviso.
   */
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
  
  /**
   * @function cadastrarProduto
   * @description Envia os dados do formulário para a API para criar um novo produto.
   * Atualiza a lista local, exibe toasts e reseta o formulário em caso de sucesso.
   */
  const cadastrarProduto = async () => {
    if (!validarFormulario()) return;
    isLoading.value = true;
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("Token de autenticação não encontrado.");
  
      // Prepara payload, convertendo campos numéricos e tratando datas vazias.
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
      // Adiciona o novo produto no início da lista (assumindo retorno da API com ID e data_modificacao)
      produtos.value.unshift(responseData);
      toast.success(`Produto "${responseData.nome}" adicionado com sucesso!`);
      resetForm();
      isFormExpanded.value = false; // Fecha o formulário
    } catch (error) {
        console.error("Erro ao cadastrar produto:", error);
        toast.error(`Erro ao cadastrar: ${error.message}`);
    } finally {
        isLoading.value = false;
    }
  };
  
  /**
   * @function iniciarEdicao
   * @param {object} produto - O objeto do produto a ser editado.
   * @description Prepara o formulário para edição. Preenche `formData` com os dados do produto,
   * define o estado de edição e expande o formulário.
   */
  const iniciarEdicao = (produto) => {
    validationError.value = '';
    editandoProdutoId.value = produto.id;
    produtoEmEdicao.value = { ...produto }; // Cópia para o título do formulário
  
    formData.value = {
        id: produto.id,
        nome: produto.nome,
        descricao: produto.descricao || '',
        unidade_medida: produto.unidade_medida,
        categoria: produto.categoria,
        quantidade: produto.quantidade ?? null, // `??` trata null/undefined para null
        valor: produto.valor ?? null,
        data_vencimento: formatDateForInput(produto.data_vencimento), // Formata data para input
    };
  
    isFormExpanded.value = true;
    nextTick(() => { // Rola a tela para o formulário após o DOM atualizar
        document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };
  
  /**
   * @function atualizarProduto
   * @description Envia os dados atualizados do produto para a API.
   * Atualiza o produto na lista local, exibe toasts e reseta o formulário.
   */
  const atualizarProduto = async () => {
    if (!editandoProdutoId.value || !validarFormulario()) return;
    isLoading.value = true;
    try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error("Token de autenticação não encontrado.");
  
        const payload = {
          ...formData.value,
          quantidade: (formData.value.quantidade === '' || formData.value.quantidade === null) ? null : Number(formData.value.quantidade),
          valor: (formData.value.valor === '' || formData.value.valor === null) ? null : Number(formData.value.valor),
          data_vencimento: formData.value.data_vencimento === '' ? null : formData.value.data_vencimento
        };
  
        const response = await fetch(`http://localhost:3000/api/produtos/${editandoProdutoId.value}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload),
        });
        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.error || `Falha ao atualizar produto (Status: ${response.status})`);
        }
  
        // Atualiza o produto na lista local com os dados retornados (incluindo nova data_modificacao)
        const index = produtos.value.findIndex(p => p.id === editandoProdutoId.value);
        if (index !== -1) {
            produtos.value[index] = responseData;
        } else {
            fetchProdutos(); // Fallback: recarrega a lista se não encontrar (menos ideal)
        }
        toast.success(`Produto "${responseData.nome}" atualizado com sucesso!`);
        resetForm();
        isFormExpanded.value = false; // Fecha o formulário
    } catch (error) {
        console.error("Erro ao atualizar produto:", error);
        toast.error(`Erro ao atualizar: ${error.message}`);
    } finally {
        isLoading.value = false;
    }
  };
  
  /**
   * @function cancelarEdicao
   * @description Cancela o modo de edição, reseta o formulário e o fecha.
   */
  const cancelarEdicao = () => {
    resetForm();
    isFormExpanded.value = false;
  };
  
  /**
   * @function resetForm
   * @description Reseta o `formData` para o estado inicial, limpa o estado de edição e erros de validação.
   */
  const resetForm = () => {
    formData.value = getInitialFormData();
    editandoProdutoId.value = null;
    produtoEmEdicao.value = null;
    validationError.value = '';
    isLoading.value = false; // Garante que o spinner do botão pare
  };
  
  /**
   * @function confirmarExclusao
   * @param {number|string} id - O ID do produto a ser excluído.
   * @description Solicita confirmação do usuário e, se confirmado, envia uma requisição DELETE para a API.
   * Remove o produto da lista local e exibe toasts.
   */
  const confirmarExclusao = async (id) => {
    const produtoParaExcluir = produtos.value.find(p => p.id === id);
    const nomeProduto = produtoParaExcluir ? `"${produtoParaExcluir.nome}"` : `de ID ${id}`;
  
    if (isEditing.value && editandoProdutoId.value === id) {
      cancelarEdicao(); // Cancela edição se estiver editando o item a ser excluído
      await nextTick(); // Espera UI atualizar antes do `confirm`
    }
  
    if (!confirm(`Tem certeza que deseja excluir o produto ${nomeProduto}? Esta ação não pode ser desfeita.`)) {
        return;
    }
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("Token de autenticação não encontrado.");
  
      const response = await fetch(`http://localhost:3000/api/produtos/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401 || response.status === 403) { /* TODO: Tratar erro de auth */ return; }
      if (response.status === 404) { throw new Error('Produto não encontrado no servidor.'); }
      if (!response.ok && response.status !== 204) { // 204 No Content é sucesso para DELETE
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
        openedActionMenuId.value = null; // Fecha qualquer menu de ação
    }
  };
  
  /**
   * @function executarEdicao
   * @param {object} produto - O produto a ser editado (passado pelo menu de ações).
   * @description Inicia a edição do produto e fecha o menu de ações.
   */
  const executarEdicao = (produto) => {
    iniciarEdicao(produto);
    closeActionMenu();
  };
  
  /**
   * @function executarExclusao
   * @param {number|string} produtoId - O ID do produto a ser excluído (passado pelo menu de ações).
   * @description Chama `confirmarExclusao`. O menu de ações é fechado dentro de `confirmarExclusao`.
   */
  const executarExclusao = (produtoId) => {
    confirmarExclusao(produtoId);
  };
  
  
  // --- BLOCO 8: LÓGICA DO MODAL DE ENVIO DE ESTOQUE ---
  
  /**
   * @function openEnviarEstoqueModal
   * @description Abre o modal `EnviarEstoqueModal`.
   */
  const openEnviarEstoqueModal = () => {
    // escolasStore.fetchEscolas(); // Opcional: carregar escolas aqui se o modal não fizer
    showEnviarModal.value = true;
  };
  
  /**
   * @function handleConfirmarEnvio
   * @param {object} payload - Os dados da transferência { escola_id, itens: [{ produto_id, quantidade }] }.
   * @description Envia os dados da transferência para a API. Em caso de sucesso, atualiza as
   * quantidades dos produtos na lista local e exibe um toast. Fecha o modal.
   */
  const handleConfirmarEnvio = async (payload) => {
    console.log("Payload recebido para envio:", payload);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error("Sessão expirada. Faça login novamente.");
        showEnviarModal.value = false;
        return;
      }
  
      // Presume-se um endpoint POST /api/transferencias no backend
      const response = await fetch('http://localhost:3000/api/transferencias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload),
      });
      const responseData = await response.json();
      if (!response.ok) {
          throw new Error(responseData.error || `Falha ao registrar a transferência (Status: ${response.status})`);
      }
  
      toast.success(responseData.message || "Estoque enviado com sucesso!");
  
      // Atualiza as quantidades na lista local
      payload.itens.forEach(itemEnviado => {
          const index = produtos.value.findIndex(p => p.id === itemEnviado.produto_id);
          if (index !== -1) {
              const produtoOriginal = produtos.value[index];
              const novaQuantidade = (produtoOriginal.quantidade ?? 0) - itemEnviado.quantidade;
              // Cria um novo objeto para garantir reatividade
              produtos.value[index] = {
                  ...produtoOriginal,
                  quantidade: novaQuantidade < 0 ? 0 : novaQuantidade, // Evita quantidade negativa
                  // TODO: Se a API de transferência retornar 'data_modificacao' atualizada para os produtos,
                  // usar aqui: data_modificacao: responseData.produtos_atualizados?.[itemEnviado.produto_id]?.data_modificacao || produtoOriginal.data_modificacao
              };
              // A atualização da quantidade no DOM (`:id="produto-qty-${produto.id}"`) é reativa via Vue.
              // A classe 'highlight-update' é uma melhoria visual opcional.
          }
      });
      showEnviarModal.value = false; // Fecha o modal
    } catch (error) {
        console.error("Erro ao enviar estoque:", error);
        toast.error(`Erro ao enviar: ${error.message}`);
        // Considerar o estado do modal em caso de erro. Por simplicidade, fecha-o.
        showEnviarModal.value = false;
    }
  };
  
  // --- BLOCO 9: HOOK DE CICLO DE VIDA ---
  
  /**
   * @hook onMounted
   * @description Executado quando o componente é montado.
   * Chama `fetchProdutos` para carregar a lista inicial de produtos.
   */
  onMounted(() => {
    fetchProdutos();
    // isFilterExpanded.value = true; // Opcional: Iniciar com filtros abertos
  });
  
  </script>
  
  <!-- Estilos CSS: um importado da pasta CSS e outro scoped -->
  <style scoped src="../CSS/ProdutosView.css"></style>
  <style scoped src="../CSS/ProdutosEditView.css"></style>
  
  <!-- Estilos adicionais específicos para este componente -->
  <style scoped>
  /* 1. ESTILOS PARA O CABEÇALHO DA LISTA DE PRODUTOS */
  /* Organiza título e botões de ação (Enviar Estoque, Filtros) */
  .list-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap; /* Permite quebra de linha em telas menores */
      gap: 1rem; /* Espaçamento entre título e grupo de botões */
  }
  
  .list-title {
      margin-bottom: 0; /* Remove margem inferior padrão do título para melhor alinhamento */
      flex-grow: 1; /* Faz o título ocupar o espaço disponível */
  }
  
  .list-header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem; /* Espaçamento entre os botões de ação */
      flex-shrink: 0; /* Impede que os botões encolham demais em layouts flexíveis */
  }
  
  /* 2. ESTILOS BASE PARA BOTÕES DE AÇÃO NO CABEÇALHO DA LISTA */
  .action-button {
      background-color: #f8f9fa; /* Cor de fundo padrão */
      border: 1px solid #dee2e6; /* Cor da borda padrão */
      color: #495057; /* Cor do texto padrão */
      padding: 0.4rem 0.8rem; /* Preenchimento interno */
      border-radius: 4px; /* Bordas arredondadas */
      cursor: pointer; /* Cursor de ponteiro */
      display: inline-flex; /* Para alinhar ícone e texto */
      align-items: center; /* Alinha ícone e texto verticalmente */
      gap: 0.4rem; /* Espaço entre ícone e texto */
      font-size: 0.85rem; /* Tamanho da fonte */
      font-weight: 500; /* Peso da fonte */
      transition: all 0.2s ease; /* Transição suave para hover/focus */
  }
  .action-button:hover:not(:disabled) { /* Estilo ao passar o mouse (se não desabilitado) */
      background-color: #e9ecef;
      border-color: #adb5bd;
      color: #212529;
  }
  .action-button:disabled { /* Estilo para botões desabilitados */
      opacity: 0.6;
      cursor: not-allowed;
  }
  .action-button svg { /* Estilo para SVGs dentro dos botões de ação */
      width: 1em; /* Largura relativa ao tamanho da fonte do botão */
      height: 1em; /* Altura relativa ao tamanho da fonte do botão */
  }
  
  /* 3. ESTILOS ESPECÍFICOS PARA O BOTÃO "ENVIAR ESTOQUE" */
  .send-stock-button {
      background-color: #17a2b8; /* Cor de destaque (info/azul claro) */
      border-color: #17a2b8;
      color: white; /* Texto branco para contraste */
  }
  .send-stock-button:hover:not(:disabled) {
      background-color: #138496; /* Cor mais escura no hover */
      border-color: #117a8b;
      color: white;
  }
  
  /* .toggle-filter-button: (sem estilos específicos aqui, herda de .action-button e CSS global/ProdutosView.css) */
  
  /* 4. ANIMAÇÃO DE HIGHLIGHT PARA QUANTIDADE ATUALIZADA (Opcional) */
  /* Usado para destacar visualmente a quantidade de um produto após uma atualização (ex: envio de estoque). */
  @keyframes highlight {
    from { background-color: #ffc107; } /* Cor de destaque inicial (amarelo) */
    to { background-color: transparent; } /* Transição para transparente */
  }
  .highlight-update {
    animation: highlight 1.5s ease-out; /* Aplica a animação */
    display: inline-block; /* Necessário para o background-color funcionar corretamente */
    padding: 0 2px; /* Pequeno preenchimento para o destaque */
    border-radius: 3px; /* Bordas levemente arredondadas */
  }
  
  /* 5. AJUSTES RESPONSIVOS PARA O CABEÇALHO DA LISTA */
  /* Adapta o layout do cabeçalho da lista para telas menores. */
  @media (max-width: 600px) {
      .list-card-header {
          flex-direction: column; /* Empilha título e botões verticalmente */
          align-items: flex-start; /* Alinha itens à esquerda */
      }
      .list-header-actions {
          width: 100%; /* Faz os botões ocuparem toda a largura */
          justify-content: flex-end; /* Alinha os botões à direita dentro de sua linha */
      }
      .list-title {
          width: 100%; /* Título ocupa toda a largura */
          margin-bottom: 0.5rem; /* Adiciona espaço abaixo do título quando empilhado */
      }
  }
  </style>