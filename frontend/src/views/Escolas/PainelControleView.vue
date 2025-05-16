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
    </header>

    <!-- 2. LAYOUT PRINCIPAL -->
    <!-- Container que organiza a lista de escolas e o formulário. -->
    <div class="main-layout">

      <!-- 3. BLOCO DA LISTA DE ESCOLAS -->
      <!-- Seção para exibir as escolas cadastradas. Esta seção é sempre visível. -->
      <section class="lista-escolas-section card">
        <div class="list-header">
          <h2>Escolas Cadastradas</h2>
          <!--
            3.1. BOTÃO NOVA ESCOLA
            - Abre o painel do formulário para adicionar uma nova escola.
            - Desabilitado se o formulário já estiver aberto e em modo de edição de outra escola.
          -->
          <button @click="openFormPanel" class="btn-add-new" :disabled="isEditing">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle-fill" viewBox="0 0 16 16">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z"/>
            </svg>
            Nova Escola
          </button>
        </div>

        <!--
          3.2. CONTEÚDO DA LISTA DE ESCOLAS
          - Renderização condicional baseada no estado da store (carregando, erro, lista vazia, ou lista preenchida).
        -->
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
          <!--
            3.2.1. ITEM DA LISTA DE ESCOLAS
            - Itera sobre `escolasStore.listaEscolas` para exibir cada escola.
            - `key` é o `escola.id` para otimização do Vue.
          -->
          <li v-for="escola in escolasStore.listaEscolas" :key="escola.id" class="escola-item">
            <div class="escola-info">
                <span class="escola-nome">{{ escola.nome }}</span>
                <!-- Exibe endereço e responsável se existirem -->
                <span class="escola-detalhe" v-if="escola.endereco">
                  {{ escola.endereco }}
                </span>
                <span class="escola-detalhe" v-if="escola.responsavel">Responsável: {{ escola.responsavel }}</span>
            </div>
            <div class="action-buttons">
              <!--
                3.2.2. BOTÃO EDITAR ESCOLA
                - Chama `startEdit` com os dados da escola.
                - Desabilitado se o painel do formulário estiver aberto para uma escola diferente da atual.
              -->
              <button @click="startEdit(escola)" class="btn-edit" title="Editar Escola" :disabled="isFormExpanded && editingEscolaId !== escola.id">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16"> <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/> <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/> </svg>
                Editar
              </button>
              <!--
                3.2.3. BOTÃO EXCLUIR ESCOLA
                - Chama `confirmDeleteEscola` com o ID e nome da escola.
                - Desabilitado se o painel do formulário estiver aberto.
              -->
              <button @click="confirmDeleteEscola(escola.id, escola.nome)" class="btn-delete" title="Excluir Escola" :disabled="isFormExpanded">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16"> <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1h3.5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/> </svg>
                Excluir
              </button>
            </div>
          </li>
        </ul>
        <!-- Mensagem de erro específica para a lista (ex: falha ao excluir) -->
        <div v-if="listError" class="error-message list-error-margin">
          {{ listError }}
        </div>
      </section>
      <!-- Fim da Seção Lista (Bloco 3) -->

      <!-- 4. BLOCO DO FORMULÁRIO (CADASTRO/EDIÇÃO) -->
      <!--
        - Seção para o formulário de cadastro ou edição de escolas.
        - Visível condicionalmente (`v-if="isFormExpanded"`).
        - Utiliza `<transition>` para animação de entrada/saída.
        - A `key` dinâmica (`formMode`) força a recriação do componente de formulário quando se alterna
          entre "adicionar" e "editar" (ou editar diferentes itens), garantindo que o estado interno
          do formulário seja resetado ou inicializado corretamente.
      -->
      <transition name="form-slide-fade">
        <section v-if="isFormExpanded" class="form-section card" :key="formMode">
          <div class="form-header">
            <!-- Título dinâmico: "Cadastrar Nova Escola" ou "Editando Escola: [Nome da Escola]" -->
            <h2>{{ isEditing ? `Editando Escola: ${formData.nome || '...'}` : 'Cadastrar Nova Escola' }}</h2>
            <!-- Botão para fechar o painel do formulário -->
            <button @click="closeFormPanel" class="btn-toggle-form btn-close" title="Fechar Formulário">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
              </svg>
            </button>
          </div>

          <div class="form-content">
            <!--
              4.1. FORMULÁRIO HTML
              - `@submit.prevent="handleSubmit"` previne o comportamento padrão do formulário e chama o método `handleSubmit`.
            -->
            <form @submit.prevent="handleSubmit" class="escola-form">
              <!-- Campos do formulário -->
              <div class="form-group">
                <label for="form-nome">Nome da Escola <span class="required">*</span></label>
                <input type="text" id="form-nome" v-model="formData.nome" required>
              </div>
              <div class="form-group">
                <label for="form-endereco">Endereço</label>
                <input type="text" id="form-endereco" v-model="formData.endereco">
              </div>
              <!-- Campos de Cidade e UF foram removidos do formulário, mas mantidos na estrutura de dados caso sejam reintroduzidos. -->
              <div class="form-group">
                <label for="form-responsavel">Responsável</label>
                <input type="text" id="form-responsavel" v-model="formData.responsavel">
              </div>

              <!-- Mensagens de erro e sucesso específicas do formulário -->
              <div v-if="formError" class="error-message"> {{ formError }} </div>
              <div v-if="formSuccessMessage" class="success-message"> {{ formSuccessMessage }} </div>

              <!--
                4.2. AÇÕES DO FORMULÁRIO
              -->
              <div class="form-actions">
                  <!-- Botão "Cancelar Edição", visível apenas no modo de edição -->
                  <button v-if="isEditing" type="button" @click="cancelEdit" class="btn-cancel">
                    Cancelar Edição
                  </button>
                  <!-- Botão de submissão principal (Cadastrar/Salvar) -->
                  <button type="submit" :disabled="escolasStore.isLoading" class="submit-button">
                    {{ isEditing ? (escolasStore.isLoading ? 'Salvando...' : 'Salvar Alterações') : (escolasStore.isLoading ? 'Cadastrando...' : 'Cadastrar Escola') }}
                  </button>
              </div>
            </form>
          </div>
        </section>
      </transition>
      <!-- Fim da Seção Formulário (Bloco 4) -->

    </div> <!-- Fim do .main-layout -->

  </div>
</template>

<script setup>
// --- BLOCO 1: IMPORTAÇÕES ---
// Importações de funcionalidades do Vue, store Pinia e estilos CSS.
import { ref, computed, onMounted, nextTick } from 'vue';
import { useEscolasStore } from '@/stores/escolas'; // Store Pinia para gerenciar dados das escolas.
import './PainelControleView.css'; // Estilos específicos para este componente.

// --- BLOCO 2: INICIALIZAÇÃO DA STORE ---
// Instância da store de escolas para interagir com o estado global e as actions.
const escolasStore = useEscolasStore();

// --- BLOCO 3: ESTADO LOCAL DO COMPONENTE (REFS) ---
// Variáveis reativas para controlar o comportamento e a interface do componente.
const isFormExpanded = ref(false);      // Controla a visibilidade do painel do formulário.
const isEditing = ref(false);           // Indica se o formulário está em modo de edição (true) ou cadastro (false).
const editingEscolaId = ref(null);      // Armazena o ID da escola que está sendo editada.
const formData = ref({                  // Objeto para vincular os dados do formulário (v-model).
    nome: '',
    endereco: '',
    responsavel: ''
    // Campos `cidade` e `uf` foram removidos do formulário, mas a estrutura pode ser mantida aqui
    // para fácil reintrodução se necessário.
});
const formError = ref('');              // Mensagem de erro para o formulário.
const formSuccessMessage = ref('');     // Mensagem de sucesso para o formulário.
const listError = ref('');              // Mensagem de erro para a lista de escolas (ex: falha na exclusão).

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

// --- BLOCO 9: HOOKS DE CICLO DE VIDA ---

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
});

</script>