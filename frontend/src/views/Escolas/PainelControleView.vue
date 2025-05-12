<!-- /frontend/src/views/Escolas/PainelControleView.vue -->
<template>
  <div class="painel-controle-content">
    <!-- Cabeçalho da Página -->
    <header class="page-header">
      <h1>Painel de Controle</h1>
    </header>

    <!-- Container Principal para Layout Lado a Lado -->
    <div class="main-layout">

      <!-- Bloco 1: Lista de Escolas (Sempre Visível) -->
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

        <!-- Conteúdo da Lista -->
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
                <span class="escola-detalhe" v-if="escola.endereco"> <!-- Apenas endereço -->
                  {{ escola.endereco }}
                </span>
                <span class="escola-detalhe" v-if="escola.responsavel">Responsável: {{ escola.responsavel }}</span>
            </div>
            <div class="action-buttons">
              <button @click="startEdit(escola)" class="btn-edit" title="Editar Escola" :disabled="isFormExpanded && editingEscolaId !== escola.id">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16"> <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/> <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/> </svg>
                Editar
              </button>
              <button @click="confirmDeleteEscola(escola.id, escola.nome)" class="btn-delete" title="Excluir Escola" :disabled="isFormExpanded"> <!-- Desabilita se form estiver aberto -->
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
      <!-- Fim da Seção Lista (Bloco 1) -->

      <!-- Bloco 2: Formulário (Visível Condicionalmente com Transição) -->
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
              <!-- Campos do formulário -->
              <div class="form-group">
                <label for="form-nome">Nome da Escola <span class="required">*</span></label>
                <input type="text" id="form-nome" v-model="formData.nome" required>
              </div>
              <div class="form-group">
                <label for="form-endereco">Endereço</label>
                <input type="text" id="form-endereco" v-model="formData.endereco">
              </div>
              <!-- Campos de Cidade e UF foram removidos -->
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
      <!-- Fim da Seção Formulário (Bloco 2) -->

    </div> <!-- Fim do .main-layout -->

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useEscolasStore } from '@/stores/escolas';
import './PainelControleView.css';

const escolasStore = useEscolasStore();

// --- Estado ---
const isFormExpanded = ref(false);
const isEditing = ref(false);
const editingEscolaId = ref(null);
const formData = ref({ nome: '', endereco: '', responsavel: '' });
const formError = ref('');
const formSuccessMessage = ref('');
const listError = ref('');

// --- Funções Auxiliares ---
const resetForm = () => {
    isEditing.value = false;
    editingEscolaId.value = null;
    // Reseta para a estrutura atualizada
    formData.value = { nome: '', endereco: '', responsavel: '' };
    formError.value = '';
};

const openFormPanel = () => {
    resetForm();
    formSuccessMessage.value = '';
    isFormExpanded.value = true;
    nextTick(() => {
        document.getElementById('form-nome')?.focus();
    });
};

const closeFormPanel = () => {
    isFormExpanded.value = false;
    setTimeout(() => {
        resetForm();
        formSuccessMessage.value = '';
    }, 300); // Delay para animação
};

// --- Lógica Cadastro ---
const submitCadastro = async () => {
    formError.value = '';
    formSuccessMessage.value = '';
    try {
        // Envia o formData atualizado
        const novaEscola = await escolasStore.addEscola(formData.value);
        formSuccessMessage.value = `Escola "${novaEscola.nome}" cadastrada com sucesso!`;
        resetForm();
        setTimeout(() => {
             if (isFormExpanded.value) {
                closeFormPanel();
             }
        }, 2000);
    } catch (error) {
        console.error("Falha no cadastro:", error.message);
        formError.value = error.message || 'Falha ao cadastrar escola.';
    }
};

// --- Lógica Edição ---
const startEdit = (escola) => {
    resetForm();
    formSuccessMessage.value = '';
    // Copia apenas os campos existentes no formData atual
    const escolaDataCopy = {
        nome: escola.nome,
        endereco: escola.endereco || '', // Garante que seja string vazia se não existir
        responsavel: escola.responsavel || ''
    };
    formData.value = escolaDataCopy;
    isEditing.value = true;
    editingEscolaId.value = escola.id;
    isFormExpanded.value = true;

    nextTick(() => {
        document.getElementById('form-nome')?.focus();
    });
};

const submitUpdate = async () => {
    formError.value = '';
    formSuccessMessage.value = '';
    if (!editingEscolaId.value) return;

    try {
         // Envia o formData atualizado
        const escolaAtualizada = await escolasStore.updateEscola(editingEscolaId.value, formData.value);
        formSuccessMessage.value = `Escola "${escolaAtualizada.nome}" atualizada com sucesso!`;
        resetForm();
        setTimeout(() => {
           if (isFormExpanded.value) {
              closeFormPanel();
           }
        }, 2000);
    } catch (error) {
        console.error("Falha na atualização:", error.message);
        formError.value = error.message || 'Falha ao atualizar escola.';
    }
};

const cancelEdit = () => {
    closeFormPanel();
};

const handleSubmit = () => {
    if (isEditing.value) {
        submitUpdate();
    } else {
        submitCadastro();
    }
};

const formMode = computed(() => isEditing.value ? `edit-${editingEscolaId.value}` : 'add');

// --- Lógica Exclusão ---
const confirmDeleteEscola = async (id, nome) => {
    listError.value = '';
    if (isFormExpanded.value) {
        listError.value = "Feche o painel de cadastro/edição antes de excluir.";
        setTimeout(() => { listError.value = ''; }, 3500);
        return;
    }

    if (confirm(`Tem certeza que deseja excluir a escola "${nome}"? Esta ação não pode ser desfeita.`)) {
        try {
            await escolasStore.deleteEscola(id);
        } catch (error) {
            console.error("Erro ao excluir escola (View):", error);
            listError.value = error.message || `Falha ao excluir a escola "${nome}".`;
            setTimeout(() => { listError.value = ''; }, 4000);
        }
    }
};

// --- Carregamento Inicial ---
onMounted(() => {
    escolasStore.clearError();
    if (escolasStore.listaEscolas.length === 0 && !escolasStore.isLoading) {
        escolasStore.fetchEscolas();
    }
});

</script>