<!--
  /frontend/src/views/Escolas/PainelControleView.vue

  Visão Geral:
  Este componente Vue.js é responsável por gerenciar o painel de controle das escolas.
  Ele permite visualizar uma lista de escolas cadastradas, adicionar novas escolas,
  editar informações de escolas existentes e excluir escolas.

  Funcionalidades Principais:
  1.  LISTAGEM DE ESCOLAS: Exibe uma lista de todas as escolas buscadas da store Pinia (escolasStore).
      - Inclui estados de carregamento, erro e lista vazia.
      - Para cada escola, exibe nome, endereço e responsável.
      - Oferece botões de "Editar" e "Excluir" para cada escola.
  2.  CADASTRO DE NOVA ESCOLA: Um formulário é exibido (deslizando para a direita) ao clicar em "Nova Escola".
      - Campos do formulário: Nome (obrigatório), Endereço, Responsável.
      - Submissão do formulário aciona a action `addEscola` da store.
      - Exibe mensagens de sucesso ou erro.
  3.  EDIÇÃO DE ESCOLA: Ao clicar em "Editar" em uma escola da lista, o mesmo formulário é preenchido
      com os dados da escola selecionada e entra em modo de edição.
      - Submissão do formulário aciona a action `updateEscola` da store.
      - Permite cancelar a edição.
  4.  EXCLUSÃO DE ESCOLA: Ao clicar em "Excluir", uma confirmação é solicitada antes de
      acionar a action `deleteEscola` da store.
  5.  GERENCIAMENTO DE ESTADO: Utiliza `ref` para o estado local do componente (visibilidade do formulário,
      modo de edição, dados do formulário, mensagens de erro/sucesso).
  6.  INTERAÇÃO COM A STORE: Usa `useEscolasStore` (Pinia) para buscar, adicionar, atualizar e
      deletar escolas, além de observar o estado de carregamento e erros da store.
  7.  FEEDBACK VISUAL: Inclui animação de transição para o painel do formulário e mensagens
      claras para o usuário sobre o status das operações.
  8.  LAYOUT RESPONSIVO (implícito pelo CSS, não detalhado aqui): A estrutura sugere um layout
      que pode se adaptar, com a lista de escolas e o formulário dispostos lado a lado ou empilhados.
-->
<template>
  <div class="painel-controle-content">
    <!-- 1. CABEÇALHO DA PÁGINA -->
    <!-- Título principal da visualização do painel de controle. -->
    <header class="page-header">
      <h1>Painel de Controle</h1>
      <!-- NAVEGAÇÃO DAS SEÇÕES -->
      <nav class="section-navigation">
        <button
          @click="setActiveSection('escolas')"
          :class="{ active: activeSection === 'escolas' }"
          class="nav-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-building" viewBox="0 0 16 16">
            <path d="M4 2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM4 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM7.5 5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM4.5 8a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5z"/>
            <path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1zm11 0H3v14h3v-2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V15h3z"/>
          </svg>
          Escolas Cadastradas
        </button>
        <button
          @click="setActiveSection('historico')"
          :class="{ active: activeSection === 'historico' }"
          class="nav-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-text" viewBox="0 0 16 16">
            <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5"/>
            <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
          </svg>
          Histórico de Envios/Gerar PDFs
        </button>
        <button
          @click="setActiveSection('notificacoes')"
          :class="{ active: activeSection === 'notificacoes' }"
          class="nav-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bell" viewBox="0 0 16 16">
            <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4.203 6H4a4 4 0 0 0-4 4v1c0 .278.022.543.064.806l.054.266h15.764l.054-.266A6.7 6.7 0 0 0 16 11v-1a4 4 0 0 0-4-4h-.203a4 4 0 0 0-3.002-3.921zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1z"/>
          </svg>
          Notificações de Produtos Devolvidos
          <span v-if="notificationsStore.unreadCount > 0" class="notification-badge">
            {{ notificationsStore.unreadCount }}
        </span>
        </button>
      </nav>
    </header>

  
    
    <!-- CONTEÚDO DAS SEÇÕES -->
    <div class="sections-container">
      <!-- SEÇÃO: ESCOLAS CADASTRADAS (Conteúdo Existente) -->
      <div v-if="activeSection === 'escolas'" class="content-section active-section">
        <!-- 2. LAYOUT PRINCIPAL (para Escolas) -->
        <div class="main-layout">
          <!-- 3. BLOCO DA LISTA DE ESCOLAS -->
          <section class="lista-escolas-section card">
            <div class="list-header">
              <h2>Escolas Cadastradas</h2>
              <button @click="openFormPanel" class="btn-add-new" :disabled="isEditing">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle-fill" viewBox="0 0 16 16">
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z"/>
                </svg>
                Nova Escola
              </button>
            </div>
            <div v-if="escolasStore.isLoading && escolasStore.listaEscolas.length === 0" class="loading-message">
              <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              Carregando escolas...
            </div>
            <div v-else-if="!escolasStore.isLoading && escolasStore.error && escolasStore.listaEscolas.length === 0" class="error-message">
              Erro ao carregar escolas: {{ escolasStore.error }}
            </div>
            <div v-else-if="!escolasStore.isLoading && !escolasStore.error && escolasStore.listaEscolas.length === 0" class="empty-list-message">
              Nenhuma escola cadastrada ainda. Clique em "Nova Escola" para adicionar a primeira.
            </div>
            <ul v-else class="escolas-list">
              <li v-for="escola in escolasStore.listaEscolas" :key="escola.id" class="escola-item">
                <div class="escola-info">
                    <span class="escola-nome">{{ escola.nome }}</span>
                    <span class="escola-detalhe" v-if="escola.endereco">{{ escola.endereco }}</span>
                    <span class="escola-detalhe" v-if="escola.responsavel">Responsável: {{ escola.responsavel }}</span>
                </div>
                <div class="action-buttons">
                  <button @click="startEdit(escola)" class="btn-edit" title="Editar Escola" :disabled="isFormExpanded && editingEscolaId !== escola.id">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16"> <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/> <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/> </svg>
                    Editar
                  </button>
                  <button @click="confirmDeleteEscola(escola.id, escola.nome)" class="btn-delete" title="Excluir Escola" :disabled="isFormExpanded">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16"> <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1h3.5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/> </svg>
                    Excluir
                  </button>
                </div>
              </li>
            </ul>
            <div v-if="listError" class="error-message list-error-margin">
              {{ listError }}
            </div>
          </section>

          <!-- 4. BLOCO DO FORMULÁRIO (CADASTRO/EDIÇÃO) -->
          <transition name="form-slide-fade">
            <section v-if="isFormExpanded" class="form-section card" :key="formMode">
              <div class="form-header">
                <h2>{{ isEditing ? `Editando Escola: ${formData.nome || '...'}` : 'Cadastrar Nova Escola' }}</h2>
                <button @click="closeFormPanel" class="btn-toggle-form btn-close" title="Fechar Formulário">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
                  </svg>
                </button>
              </div>
              <div class="form-content">
                <form @submit.prevent="handleSubmit" class="escola-form">
                  <div class="form-group">
                    <label for="form-nome">Nome da Escola <span class="required">*</span></label>
                    <input type="text" id="form-nome" v-model="formData.nome" required>
                  </div>
                  <div class="form-group">
                    <label for="form-endereco">Endereço</label>
                    <input type="text" id="form-endereco" v-model="formData.endereco">
                  </div>
                  <div class="form-group">
                    <label for="form-responsavel">Responsável</label>
                    <input type="text" id="form-responsavel" v-model="formData.responsavel">
                  </div>
                  <div v-if="formError" class="error-message"> {{ formError }} </div>
                  <div v-if="formSuccessMessage" class="success-message"> {{ formSuccessMessage }} </div>
                  <div class="form-actions">
                      <button v-if="isEditing" type="button" @click="cancelEdit" class="btn-cancel">
                        Cancelar Edição
                      </button>
                      <button type="submit" :disabled="escolasStore.isLoading" class="submit-button">
                        {{ isEditing ? (escolasStore.isLoading ? 'Salvando...' : 'Salvar Alterações') : (escolasStore.isLoading ? 'Cadastrando...' : 'Cadastrar Escola') }}
                      </button>
                  </div>
                </form>
              </div>
            </section>
          </transition>
        </div>
      </div>

      <!-- SEÇÃO: HISTÓRICO DE ENVIOS (AGORA UM COMPONENTE) -->
      <div v-if="activeSection === 'historico'" class="content-section card active-section">
        <HistoricoEnviosSME />
      </div>

      <!-- SEÇÃO: NOTIFICAÇÃO (Placeholder) -->
      <div v-if="activeSection === 'notificacoes'" class="content-section card active-section">
         <div class="section-placeholder-header">
          <h2>Central de Notificações</h2>
        </div>
        
        <div class="notifications-list-container">
            <div v-if="notificationsStore.isLoading" class="loading-message">Carregando notificações...</div>
            <div v-else-if="notificationsStore.error" class="error-message">{{ notificationsStore.error }}</div>
            <div v-else-if="notificationsStore.notificacoes.length === 0" class="empty-list-message">
                Nenhuma notificação encontrada.
            </div>
            <!-- Lista de Notificações -->
            <ul v-else class="notifications-list">
                <li v-for="notificacao in notificationsStore.notificacoes" :key="notificacao.id" class="notification-item" :class="{ 'nao-lida': !notificacao.lida }">
                    <div class="notification-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-arrow-counterclockwise" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2z"/>
                            <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466"/>
                        </svg>
                    </div>
                    <div class="notification-content">
                      <p class="notification-message">
                          {{ getNotificationTitle(notificacao.message) }}
                      </p>
                      <span class="notification-date">{{ new Date(notificacao.createdAt).toLocaleString('pt-BR') }}</span>

                      <!-- *** MODIFICADO: Bloco expansível redesenhado para corresponder ao modelo *** -->
                      <div v-if="getNotificationDetails(notificacao.message)" class="details-expander">
                          <!-- Cabeçalho Clicável -->
                          <div class="expander-header" @click="toggleNotificationDetails(notificacao.id)">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-seam" viewBox="0 0 16 16">
                                  <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2l-2.218-.887zM3.56 3.597l2.218.887L8 5.268l2.218-.884L12.44 3.6l-2.404-.961z"/>
                                  <path d="M13.846 3.5 8 5.961 2.154 3.5 1 3.961 8 6.887l7-2.926zM1.5 4.468 8 7.387l6.5-2.92V11.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5zM8 8.431l-6-2.4V11h12V6.031z"/>
                              </svg>
                              <span>Detalhes dos Itens ({{ getNotificationDetails(notificacao.message).trim().split('\n').length }})</span>
                              <div class="expander-chevron" :class="{ 'expanded': expandedNotifications[notificacao.id] }">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
                                      <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
                                  </svg>
                              </div>
                          </div>
                          <!-- Conteúdo que expande/recolhe -->
                          <div v-show="expandedNotifications[notificacao.id]" class="expander-content">
                              <p class="notification-details">
                                  {{ getNotificationDetails(notificacao.message) }}
                              </p>
                          </div>
                      </div>
                    </div>
                    <div class="notification-actions">
                        <button
                            v-if="notificacao.tipo === 'devolucao' && !notificacao.lida"
                            @click="confirmarDevolucaoEAtualizar(notificacao.id)"
                            class="btn-confirm-return"
                            :disabled="isLoadingModalData && pendingNotificacaoId === notificacao.id"
                            title="Confirmar Recebimento da Devolução e Reabastecer Estoque">
                            
                            <!-- Spinner de carregamento -->
                            <span v-if="isLoadingModalData && pendingNotificacaoId === notificacao.id" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            <span v-else>Confirmar devolução</span>
                        </button>
                    </div>
                </li>
            </ul>

            <!-- *** ADIÇÃO DO COMPONENTE DE PAGINAÇÃO *** -->
            <PaginationControls
                v-if="!notificationsStore.isLoading && notificationsStore.totalPages > 1"
                :current-page="notificationsStore.currentPage"
                :total-pages="notificationsStore.totalPages"
                @page-changed="handleNotificationPageChange"
            />
        </div>
      </div>
    </div>
    <ConfirmationModal
  :show="isConfirmationModalVisible"
  title="Confirmar Devolução e Reabastecimento"
  confirm-text="Sim, Reabastecer"
  cancel-text="Cancelar"
  variant="primary"
  @confirm="handleDevolucaoConfirm"
  @close="closeConfirmationModal"
>
  <!-- Este é o conteúdo que será injetado no <slot> do modal -->
  <div class="confirm-body-content">
    <p>A ação a seguir irá reabastecer os itens abaixo no estoque da SME. Por favor, verifique os detalhes:</p>
    
    <table class="confirm-table">
      <thead>
        <tr>
          <th>Item Devolvido</th>
          <th>Estoque Atual</th>
          <th>Estoque Futuro</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in itensParaConfirmacao" :key="item.nome">
          <td>{{ item.nome }} <strong class="text-success">(+{{ item.quantidadeDevolvida }})</strong></td>
          <td>{{ item.estoqueAtual }}</td>
          <td class="future-stock">
            {{ item.estoqueFuturo }}
          </td>
        </tr>
      </tbody>
    </table>
    
    <p class="confirm-footer-message">Você tem certeza que deseja prosseguir?</p>
  </div>
</ConfirmationModal>
  </div>
</template>

<script setup>
// --- BLOCO 1: IMPORTAÇÕES ---
// Importações de funcionalidades do Vue, store Pinia e estilos CSS.
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useEscolasStore } from '@/stores/escolas'; // Store Pinia para gerenciar dados das escolas.
import { useNotificationsStore } from '@/stores/notifications';
import HistoricoEnviosSME from './Historico/HistoricoEnviosSME.vue';
import PaginationControls from '@/components/PaginationControls.vue';
import ConfirmationModal from '@/components/ConfirmationModal.vue';
import { useEstoqueStore } from '@/stores/estoque';
import { useToast } from "vue-toastification";

const toast = useToast();
const isConfirmationModalVisible = ref(false);
const pendingNotificacaoId = ref(null); // Guarda o ID da notificação a ser confirmada

// Instância da store de notificações
const notificationsStore = useNotificationsStore();

const estoqueStore = useEstoqueStore(); // <-- Instancia a store
const itensParaConfirmacao = ref([]); // <-- Novo: Armazena os dados para a tabela do modal
const isLoadingModalData = ref(false); // <-- Novo: Estado de loading para o botão

// --- BLOCO 2: INICIALIZAÇÃO DA STORE ---
// Instância da store de escolas para interagir com o estado global e as actions.
const escolasStore = useEscolasStore();

// --- BLOCO 3: ESTADO LOCAL DO COMPONENTE (REFS) ---
// Variáveis reativas para controlar o comportamento e a interface do componente.
const expandedNotifications = ref({});
const isFormExpanded = ref(false);      // Controla a visibilidade do painel do formulário.
const isEditing = ref(false);           // Indica se o formulário está em modo de edição (true) ou cadastro (false).
const editingEscolaId = ref(null);      // Armazena o ID da escola que está sendo editada.
const formData = ref({                  // Objeto para vincular os dados do formulário (v-model).
    nome: '',
    endereco: '',
    responsavel: ''

});
const formError = ref('');              // Mensagem de erro para o formulário.
const formSuccessMessage = ref('');     // Mensagem de sucesso para o formulário.
const listError = ref('');              // Mensagem de erro para a lista de escolas (ex: falha na exclusão).

// Estado para controlar a seção ativa
const activeSection = ref('escolas'); // 'escolas', 'historico', 'notificacoes'

const setActiveSection = (sectionName) => { // <<<--- DEFINIDA AQUI
  activeSection.value = sectionName;
};

// --- BLOCO 4: FUNÇÕES AUXILIARES ---

/**
 * @function resetForm
 * @description Reseta o estado do formulário para os valores padrão.
 * Limpa os campos do formData, o modo de edição, o ID da escola em edição e a mensagem de erro do formulário.
 */
const resetForm = () => {
    isEditing.value = false;
    editingEscolaId.value = null;
    // Reseta formData para sua estrutura inicial (vazia).
    formData.value = { nome: '', endereco: '', responsavel: '' };
    formError.value = '';
    // formSuccessMessage não é resetado aqui para permitir que seja exibido por um tempo.
};

/**
 * @function openFormPanel
 * @description Abre o painel do formulário para cadastro de uma nova escola.
 * Reseta o formulário, limpa mensagens de sucesso anteriores, expande o painel
 * e foca no primeiro campo do formulário (`form-nome`) usando `nextTick` para garantir
 * que o elemento esteja no DOM.
 */
const openFormPanel = () => {
    resetForm();
    formSuccessMessage.value = ''; // Limpa mensagem de sucesso ao abrir para novo cadastro.
    isFormExpanded.value = true;
    nextTick(() => { // Garante que o DOM foi atualizado antes de tentar focar.
        document.getElementById('form-nome')?.focus();
    });
};

/**
 * @function closeFormPanel
 * @description Fecha o painel do formulário.
 * Define `isFormExpanded` para `false` e, após um pequeno delay (para a animação de saída),
 * reseta o formulário e a mensagem de sucesso.
 */
const closeFormPanel = () => {
    isFormExpanded.value = false;
    setTimeout(() => { // Delay para permitir que a animação de fechamento ocorra.
        resetForm();
        formSuccessMessage.value = '';
    }, 300); // 300ms é um tempo comum para transições CSS.
};

// --- BLOCO 5: LÓGICA DE CADASTRO ---

/**
 * @function submitCadastro
 * @description Envia os dados do formulário para cadastrar uma nova escola.
 * Chama a action `addEscola` da store. Em caso de sucesso, exibe mensagem,
 * reseta o formulário e o fecha após um tempo. Em caso de erro, exibe mensagem de erro.
 */
const submitCadastro = async () => {
    formError.value = '';
    formSuccessMessage.value = '';
    try {
        // Envia `formData.value` que contém os dados atuais do formulário.
        const novaEscola = await escolasStore.addEscola(formData.value);
        formSuccessMessage.value = `Escola "${novaEscola.nome}" cadastrada com sucesso!`;
        resetForm(); // Reseta os campos e o estado de edição.
        setTimeout(() => {
             if (isFormExpanded.value) { // Fecha o painel apenas se ainda estiver aberto.
                closeFormPanel();
             }
        }, 2000); // Fecha o formulário automaticamente após 2 segundos de sucesso.
    } catch (error) {
        console.error("Falha no cadastro:", error.message);
        formError.value = error.message || 'Falha ao cadastrar escola.';
    }
};

// --- BLOCO 6: LÓGICA DE EDIÇÃO ---

/**
 * @function startEdit
 * @param {object} escola - O objeto da escola a ser editada.
 * @description Prepara o formulário para editar uma escola existente.
 * Reseta o formulário, preenche `formData` com os dados da escola, define o modo de edição,
 * armazena o ID da escola, expande o painel do formulário e foca no primeiro campo.
 */
const startEdit = (escola) => {
    resetForm();
    formSuccessMessage.value = ''; // Limpa mensagem de sucesso ao iniciar edição.
    // Copia os dados da escola para o formData, garantindo que apenas os campos esperados sejam usados.
    // Se um campo como `endereco` ou `responsavel` for null/undefined na `escola`, usa string vazia.
    const escolaDataCopy = {
        nome: escola.nome,
        endereco: escola.endereco || '',
        responsavel: escola.responsavel || ''
    };
    formData.value = escolaDataCopy;
    isEditing.value = true;
    editingEscolaId.value = escola.id;
    isFormExpanded.value = true; // Abre o painel do formulário.

    nextTick(() => { // Garante que o DOM foi atualizado.
        document.getElementById('form-nome')?.focus();
    });
};

/**
 * @function submitUpdate
 * @description Envia os dados do formulário para atualizar uma escola existente.
 * Chama a action `updateEscola` da store. Em caso de sucesso, exibe mensagem,
 * reseta o formulário e o fecha após um tempo. Em caso de erro, exibe mensagem de erro.
 */
const submitUpdate = async () => {
    formError.value = '';
    formSuccessMessage.value = '';
    if (!editingEscolaId.value) return; // Proteção caso não haja ID para editar.

    try {
        // Envia `formData.value` que contém os dados atualizados do formulário.
        const escolaAtualizada = await escolasStore.updateEscola(editingEscolaId.value, formData.value);
        formSuccessMessage.value = `Escola "${escolaAtualizada.nome}" atualizada com sucesso!`;
        resetForm(); // Reseta os campos e o estado de edição.
        setTimeout(() => {
           if (isFormExpanded.value) { // Fecha o painel apenas se ainda estiver aberto.
              closeFormPanel();
           }
        }, 2000); // Fecha o formulário automaticamente após 2 segundos de sucesso.
    } catch (error) {
        console.error("Falha na atualização:", error.message);
        formError.value = error.message || 'Falha ao atualizar escola.';
    }
};

/**
 * @function cancelEdit
 * @description Cancela o modo de edição e fecha o painel do formulário.
 */
const cancelEdit = () => {
    closeFormPanel(); // Reutiliza a lógica de fechar e resetar o formulário.
};

/**
 * @function handleSubmit
 * @description Manipulador de submissão do formulário.
 * Verifica se está em modo de edição (`isEditing.value`) para chamar `submitUpdate`
 * ou, caso contrário, chama `submitCadastro`.
 */
const handleSubmit = () => {
    if (isEditing.value) {
        submitUpdate();
    } else {
        submitCadastro();
    }
};

// --- BLOCO 7: PROPRIEDADES COMPUTADAS ---

/**
 * @computed formMode
 * @description Determina uma chave única para o componente do formulário.
 * Ajuda o Vue a identificar o formulário como uma nova instância ao alternar entre
 * modo de adição e edição (ou ao editar diferentes itens), o que pode ser útil
 * para forçar um re-render ou resetar o estado interno do componente `<section class="form-section">`.
 * Retorna 'add' ou 'edit-[id_da_escola]'.
 */
const formMode = computed(() => isEditing.value ? `edit-${editingEscolaId.value}` : 'add');

// --- BLOCO 8: LÓGICA DE EXCLUSÃO ---

/**
 * @function confirmDeleteEscola
 * @param {number|string} id - O ID da escola a ser excluída.
 * @param {string} nome - O nome da escola, para a mensagem de confirmação.
 * @description Solicita confirmação do usuário antes de excluir uma escola.
 * Se o formulário estiver aberto, exibe um erro. Caso contrário, após confirmação,
 * chama a action `deleteEscola` da store. Trata possíveis erros na exclusão.
 */
const confirmDeleteEscola = async (id, nome) => {
    listError.value = ''; // Limpa erros anteriores da lista.
    // Impede a exclusão se o formulário estiver aberto, para evitar conflitos de UI/UX.
    if (isFormExpanded.value) {
        listError.value = "Feche o painel de cadastro/edição antes de excluir.";
        setTimeout(() => { listError.value = ''; }, 3500); // Limpa a mensagem após 3.5s.
        return;
    }

    // Janela de confirmação nativa do navegador.
    if (confirm(`Tem certeza que deseja excluir a escola "${nome}"? Esta ação não pode ser desfeita.`)) {
        try {
            await escolasStore.deleteEscola(id);
            // A store é responsável por atualizar a `listaEscolas`, que re-renderizará a lista.
            // Poderia-se adicionar uma mensagem de sucesso para a lista aqui, se desejado.
        } catch (error) {
            console.error("Erro ao excluir escola (View):", error);
            listError.value = error.message || `Falha ao excluir a escola "${nome}".`;
            setTimeout(() => { listError.value = ''; }, 4000); // Limpa a mensagem de erro após 4s.
        }
    }
};

// --- BLOCO 9: LÓGICA DE NOTIFICAÇÕES ---

// *** NOVO: Funções para separar título e detalhes da notificação ***
const getNotificationTitle = (message) => {
  if (!message) return '';
  const newlineIndex = message.indexOf('\n');
  return newlineIndex !== -1 ? message.substring(0, newlineIndex) : message;
};

const getNotificationDetails = (message) => {
  if (!message) return null;
  const newlineIndex = message.indexOf('\n');
  return newlineIndex !== -1 ? message.substring(newlineIndex + 1) : null;
};

// *** NOVO: Função para alternar a visibilidade dos detalhes ***
const toggleNotificationDetails = (id) => {
  expandedNotifications.value[id] = !expandedNotifications.value[id];
};

// *** NOVO: FUNÇÃO PARA MUDAR DE PÁGINA NAS NOTIFICAÇÕES ***
const handleNotificationPageChange = (newPage) => {
  notificationsStore.fetchNotificacoes(newPage);
  // Opcional: rolar para o topo da lista de notificações
  document.querySelector('.notifications-list-container')?.scrollTo(0, 0);
};

const confirmarDevolucaoEAtualizar = async (notificacaoId) => {
  isLoadingModalData.value = true;
  pendingNotificacaoId.value = notificacaoId;

  try {
    await estoqueStore.fetchEstoqueSME();
    
    const notificacao = notificationsStore.notificacoes.find(n => n.id === notificacaoId);
    if (!notificacao) throw new Error("Notificação não encontrada!");

    const detalhes = getNotificationDetails(notificacao.message);
    if (!detalhes) throw new Error("Detalhes da devolução não encontrados na notificação!");

    // --- NOVA LÓGICA DE PARSING COM EXPRESSÃO REGULAR ---
    const itensDevolvidos = detalhes.trim().split('\n').map(linha => {
      // Esta expressão regular procura por:
      // 1. Um nome de produto (qualquer caractere até encontrar " (Qtd: ")
      // 2. Um número (um ou mais dígitos) dentro dos parênteses
      const regex = /-\s*(.+?)\s*\(Qtd:\s*(\d+)\)/;
      const match = linha.match(regex);

      // Se a linha não corresponder ao padrão, 'match' será null.
      if (!match) {
        console.warn(`Linha ignorada (formato regex não corresponde): "${linha}"`);
        return null;
      }
      
      // match[1] captura o primeiro grupo (o nome do produto)
      // match[2] captura o segundo grupo (a quantidade)
      const nomeProdutoNotificacao = match[1].trim();
      const quantidadeDevolvida = parseInt(match[2], 10);

      if (!nomeProdutoNotificacao || isNaN(quantidadeDevolvida)) return null;

      // Busca no estoque pelo nome limpo
      const produtoNoEstoque = estoqueStore.produtos.find(p => p.nome.trim().toLowerCase() === nomeProdutoNotificacao.toLowerCase());
      
      if (!produtoNoEstoque) {
        console.error(`FALHA: Produto com nome "${nomeProdutoNotificacao}" NÃO ENCONTRADO no estoque da SME.`);
      }
      
      const estoqueAtual = produtoNoEstoque ? Number(produtoNoEstoque.quantidade) : 0;
      
      return {
        nome: nomeProdutoNotificacao,
        quantidadeDevolvida,
        estoqueAtual,
        estoqueFuturo: estoqueAtual + quantidadeDevolvida,
      };
    }).filter(Boolean); // Remove os nulos de linhas que não corresponderam

    if (itensDevolvidos.length === 0) {
      throw new Error("Não foi possível processar nenhum item da devolução. O formato das linhas pode estar incorreto.");
    }

    itensParaConfirmacao.value = itensDevolvidos;
    isConfirmationModalVisible.value = true;

  } catch (error) {
    console.error("Erro ao preparar dados para confirmação:", error);
    toast.error(error.message || "Não foi possível carregar os detalhes da devolução.");
  } finally {
    isLoadingModalData.value = false;
  }
};

// 4. ADICIONE/ATUALIZE AS FUNÇÕES PARA LIDAR COM O MODAL
const handleDevolucaoConfirm = async () => {
  if (!pendingNotificacaoId.value) return;

  try {
    await notificationsStore.confirmarDevolucao(pendingNotificacaoId.value);
    await notificationsStore.fetchNotificacoes(notificationsStore.currentPage);
    // IMPORTANTE: Forçar a store de estoque a recarregar na próxima vez,
    // pois os dados dela estão desatualizados agora.
    estoqueStore.produtos = []; 
  } catch (error) {
    console.error("Erro ao confirmar a devolução:", error);
    toast.error("Ocorreu um erro ao confirmar a devolução.");
  } finally {
    closeConfirmationModal();
  }
};

const closeConfirmationModal = () => {
  isConfirmationModalVisible.value = false;
  pendingNotificacaoId.value = null;
  itensParaConfirmacao.value = []; // Limpa os dados do modal
};

// --- BLOCO 10: HOOKS DE CICLO DE VIDA ---

/**
 * @hook onMounted
 * @description Executado quando o componente é montado no DOM.
 * Limpa qualquer erro preexistente na store de escolas.
 * Se a lista de escolas estiver vazia e não estiver carregando, dispara a action `fetchEscolas`
 * para buscar os dados iniciais das escolas do backend.
 */
onMounted(() => {
    escolasStore.clearError(); // Limpa erros que possam ter vindo de outras views ou stores.
    // Busca escolas apenas se a lista estiver vazia e não houver uma carga em andamento.
    // Isso previne múltiplas chamadas se o usuário navegar para fora e voltar rapidamente.
    if (escolasStore.listaEscolas.length === 0 && !escolasStore.isLoading) {
        escolasStore.fetchEscolas();
    }
    // Buscar notificações quando o componente é montado
    if (notificationsStore.notificacoes.length === 0) {
        notificationsStore.fetchNotificacoes();
    }
});

// Watcher para carregar dados da seção de escolas se ela for ativada
// e os dados ainda não tiverem sido carregados.
watch(activeSection, (newSectionValue) => {
  if (newSectionValue === 'escolas') {
    if (escolasStore.listaEscolas.length === 0 && !escolasStore.isLoading && !escolasStore.error) {
      escolasStore.fetchEscolas();
    }
  }
// Lógica para carregar notificações ao clicar na aba, se necessário
  if (newSectionValue === 'notificacoes') {
    // Se a store estiver vazia, tenta buscar os dados
    if (notificationsStore.notificacoes.length === 0 && !notificationsStore.isLoading) {
        // notificationsStore.fetchNotificacoes();
    }
  }
});

</script>

<style scoped>

@import './PainelControleView.css'; /* Estilos específicos para este componente. */

/* --- ESTILOS PARA NAVEGAÇÃO DE SEÇÕES --- */
.section-navigation {
  display: flex;
  gap: 0.5rem; /* Espaço entre os botões */
  margin-top: 1rem; /* Espaço abaixo do título "Painel de Controle" */
  padding-bottom: 1rem; /* Espaço antes do conteúdo da seção */
  border-bottom: 2px solid #e5e7eb; /* Linha divisória mais proeminente */
  margin-bottom: 1.5rem; /* Espaço antes do container de seções */
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border: none;
  background-color: transparent; /* Fundo transparente por padrão */
  color: #4b5563; /* Cinza escuro para texto */
  border-radius: 6px 6px 0 0; /* Cantos arredondados apenas no topo */
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background-color 0.2s ease, color 0.2s ease, border-bottom-color 0.2s ease;
  border-bottom: 2px solid transparent; /* Borda inferior para indicar atividade */
  margin-bottom: -2px; /* Para alinhar com a borda do container */
}

.nav-button:hover {
  color: #1f2937; /* Cor mais escura no hover */
  background-color: #f0f0f0; /* Leve fundo no hover */
}

.nav-button.active {
  /* Estilo para o botão da seção ativa (Exemplo com azul, ajuste para sua paleta) */
  background-color: #fff; /* Pode ser a cor de fundo do card */
  color: var(--primary-color, #3b82f6); /* Cor primária da aplicação */
  border-bottom: 2px solid var(--primary-color, #3b82f6);
  font-weight: 600;
}

.nav-button svg {
  /* Estilos para os ícones dos botões, se necessário */
  width: 18px;
  height: 18px;
}

/* Estilos para os placeholders das novas seções */
.section-placeholder-header {
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}
.section-placeholder-header h2 {
  font-size: 1.4rem;
  color: #1f2937; /* Cor um pouco mais escura para o título da seção */
  margin: 0;
}

.section-placeholder-content p {
  margin-bottom: 0.75rem;
  line-height: 1.6;
  color: #374151;
}
.section-placeholder-content ul {
  list-style-type: disc;
  margin-left: 1.5rem;
  margin-bottom: 1rem;
}
.section-placeholder-content li {
  margin-bottom: 0.4rem;
}
.section-placeholder-content em {
  color: #6b7280; /* Cinza para o texto em itálico */
  font-size: 0.9rem;
}

/* Para garantir que o layout flex das escolas funcione dentro da aba */
.content-section .main-layout {
  display: flex; /* Já está no seu CSS, mas confirmando */
  /* ... outros estilos de .main-layout */
}

/* NOVO: Estilos para a lista de notificações */
.notification-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    background-color: var(--danger-color, #dc3545);
    color: white;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    font-size: 0.7rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
}

.nav-button {
    position: relative; /* Necessário para posicionar o badge */
}

.notifications-list-container {
    padding: 1rem;
}

.notifications-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.notification-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    background-color: #fff;
    transition: background-color 0.2s ease;
}

.notification-item.nao-lida {
    background-color: #f8f9fa;
    border-left: 4px solid var(--primary-color, #3b82f6);
}

.notification-icon {
    color: #6c757d;
}

.notification-content {
    flex-grow: 1;
}

.notification-message {
    margin: 0 0 0.25rem 0;
    font-size: 0.95rem;
    color: #212529;
    font-weight: 500;
}

/* Estilo para o texto dos produtos devolvidos */
.notification-details {
  margin: 0;
  color: #495057;
  font-weight: 400;
  font-size: 0.9rem;
  line-height: 1.6;
  white-space: pre-wrap; /* Mantém as quebras de linha */
}

/* Botão "Ver Detalhes" completamente reestilizado */
.btn-toggle-details {
  /* Layout interno do botão (ícone + texto) */
  display: flex;
  align-items: center;
  gap: 0.3rem;

  /* Aparência do botão */
  background-color: #f8f9fa; /* Fundo cinza bem claro */
  border: 1px solid #dee2e6; /* Borda sutil */
  color: #495057; /* Cor do texto */
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;

  /* Remove estilos antigos de link */
  text-decoration: none;
  text-align: center;
}

.btn-toggle-details:hover {
  background-color: #e9ecef; /* Fundo um pouco mais escuro no hover */
  border-color: #ced4da;
}

/* Estilo para o ícone dentro do botão */
.btn-toggle-details svg {
  width: 14px;
  height: 14px;
}

/* Container para a data e o botão */
.notification-footer {
  margin-top: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* A data agora fica diretamente no conteúdo */
.notification-date {
    display: block; /* Garante que ocupe sua própria linha */
    font-size: 0.8rem;
    color: #6c757d;
    margin-top: 0.25rem; /* Pequeno espaço após a mensagem principal */
}

/* Container principal do bloco expansível */
.details-expander {
  margin-top: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden; /* Garante que os cantos arredondados sejam aplicados aos filhos */
}

/* O cabeçalho clicável */
.expander-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: #f9fafb; /* Cinza muito claro, como no modelo */
  cursor: pointer;
  font-weight: 500;
  color: #374151; /* Cor de texto mais escura e sóbria */
  transition: background-color 0.2s;
}

.expander-header:hover {
  background-color: #f3f4f6; /* Efeito hover sutil */
}

/* O ícone de seta/chevron na direita */
.expander-chevron {
  margin-left: auto; /* Empurra a seta para a direita */
  transition: transform 0.2s ease-in-out;
  color: #6b7280;
}

/* Classe aplicada quando o conteúdo está visível para girar a seta */
.expander-chevron.expanded {
  transform: rotate(180deg);
}

/* O container do conteúdo que é mostrado/oculto */
.expander-content {
  padding: 0.5rem 1rem 1rem 1rem; /* Espaçamento interno */
  background-color: #fff;
  border-top: 1px solid #e5e7eb; /* Linha sutil separando do header */
}

.notification-actions .btn-mark-read {
    background: none;
    border: 1px solid #ced4da;
    color: #495057;
    font-size: 0.8rem;
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    cursor: pointer;
}
.notification-actions .btn-mark-read:hover {
    background-color: #e9ecef;
}

.notification-actions .btn-confirm-return {
    /* ... seus estilos existentes */
    white-space: nowrap; /* Evita que o texto quebre em duas linhas */
}

.btn-confirm-return {
    background-color: #28a745; /* Verde sucesso */
    color: white;
    border: 1px solid #218838;
    /* ... outros estilos de botão que você usa ... */
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
}
.btn-confirm-return:hover {
    background-color: #218838;
}

.confirm-body-content p {
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.confirm-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.confirm-table th, .confirm-table td {
  border: 1px solid #dee2e6;
  padding: 0.75rem;
  text-align: left;
  vertical-align: middle;
}

.confirm-table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.confirm-table td {
  text-align: center;
}
.confirm-table td:first-child {
  text-align: left;
  font-weight: 500;
}
.confirm-table .text-success {
  color: #28a745;
  font-weight: bold;
}

.future-stock {
  font-weight: bold;
  font-size: 1.1em;
  color: var(--primary-color, #007bff);
  background-color: #e7f1ff;
}

.future-stock svg {
  vertical-align: -0.125em; /* Alinha melhor a seta com o texto */
  margin-left: 0.25rem;
}

.confirm-footer-message {
  margin-top: 1rem;
  font-weight: 500;
  text-align: center;
  margin-bottom: 0;
}


</style>