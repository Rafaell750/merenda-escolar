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

<style scoped>
/* --- Estilos Gerais --- */
.painel-controle-content { width: 100%; max-width: 1400px; margin: 0 auto; padding: 1rem; }
.page-header { margin-bottom: 1.5rem; text-align: center; }
.page-header h1 { color: #2c3e50; font-size: 1.8rem; font-weight: 600; }
.card { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); display: flex; flex-direction: column; }

/* --- Layout Principal Flexível --- */
.main-layout {
  display: flex;
  gap: 2rem;
  align-items: flex-start; /* Alinha os cards pelo topo */
}

/* --- Bloco 1: Lista de Escolas --- */
.lista-escolas-section {
  flex: 1 1 auto; /* Cresce e encolhe, baseia-se no conteúdo */
  min-width: 350px; /* Largura mínima para a lista */
  transition: flex-basis 0.4s ease-out; /* Anima a mudança de tamanho da lista */
}
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.list-header h2 {
  color: #2c3e50;
  margin-bottom: 0;
  font-size: 1.5rem;
  font-weight: 600;
  flex-grow: 1;
}
.btn-add-new {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: background-color 0.2s ease, opacity 0.2s ease;
  flex-shrink: 0;
}
.btn-add-new:hover:not(:disabled) { background-color: #0056b3; }
.btn-add-new:disabled { background-color: #6c757d; opacity: 0.6; cursor: not-allowed; }
.btn-add-new svg { width: 1em; height: 1em; }

.loading-message, .empty-list-message { text-align: center; padding: 1.5rem; color: #5a6a7a; font-style: italic; flex-grow: 1; }
.loading-message .spinner-border { margin-right: 0.5rem; vertical-align: middle; width: 1.2rem; height: 1.2rem;}
.error-message {
    padding: 0.7rem; border-radius: 4px; margin-top: 0.8rem; text-align: center; border: 1px solid transparent; font-size: 0.85rem;
    color: #721c24; background-color: #f8d7da; border-color: #f5c6cb;
}
.escolas-list { list-style: none; padding: 0; margin: 0; }
.escola-item { display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 0; border-bottom: 1px solid #eee; flex-wrap: wrap; gap: 0.5rem; }
.escola-item:last-child { border-bottom: none; }
.escola-info { display: flex; flex-direction: column; flex-grow: 1; margin-right: 1rem; gap: 0.2rem; }
.escola-nome { font-size: 1rem; color: #333; font-weight: 500; }
.escola-detalhe { font-size: 0.85rem; color: #5a6a7a; }
.action-buttons { display: flex; gap: 0.5rem; flex-shrink: 0; align-items: center;}
.action-buttons button { background: none; border: 1px solid transparent; padding: 0.4rem 0.6rem; cursor: pointer; border-radius: 4px; transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease; display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.85rem; line-height: 1; }
.action-buttons button svg { width: 13px; height: 13px; margin-bottom: 1px; }
.btn-edit { color: #007bff; border-color: #007bff; }
.btn-edit:hover:not(:disabled) { background-color: #007bff; color: white; }
.btn-delete { color: #dc3545; border-color: #dc3545; }
.btn-delete:hover:not(:disabled) { background-color: #dc3545; color: white; }
.action-buttons button:disabled { cursor: not-allowed; opacity: 0.5; }
.list-error-margin { margin-top: 1rem; }


/* --- Bloco 2: Formulário --- */
.form-section {
  flex: 0 0 450px;
  max-width: 450px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  /* A transição é aplicada pelo wrapper <transition> */
}
.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: nowrap;
  gap: 1rem;
}
.form-section h2 {
  text-align: left;
  color: #2c3e50;
  margin-bottom: 0;
  font-size: 1.4rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.btn-toggle-form.btn-close {
  background: none;
  border: none;
  color: #6c757d;
  padding: 0.2rem;
  border-radius: 50%;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, color 0.2s ease;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
}
.btn-toggle-form.btn-close:hover { background-color: #f1f1f1; color: #333; }
.btn-toggle-form.btn-close svg { width: 1em; height: 1em; }

.form-content { overflow-y: auto; }
.escola-form { display: flex; flex-direction: column; gap: 0.8rem; } /* Reduzido gap */
.form-group { display: flex; flex-direction: column; }
/* .form-row não é mais usado */
label { margin-bottom: 0.3rem; font-weight: 500; color: #555; font-size: 0.9rem; }
input[type="text"] { padding: 0.6rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.95rem; }
input[type="text"]:focus { outline: none; border-color: #34d399; box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.25); }
.required { color: red; margin-left: 2px; }
.form-section .error-message, .form-section .success-message { padding: 0.7rem; border-radius: 4px; margin-top: 0.8rem; text-align: center; border: 1px solid transparent; font-size: 0.85rem; }
.form-section .error-message { color: #721c24; background-color: #f8d7da; border-color: #f5c6cb; }
.form-section .success-message { color: #155724; background-color: #d4edda; border-color: #c3e6cb; }

.form-actions { display: flex; justify-content: flex-end; gap: 0.8rem; margin-top: 1rem; flex-wrap: wrap; padding-top: 1rem; border-top: 1px solid #eee; }
.form-actions button { padding: 0.7rem 1.2rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: background-color 0.2s ease, opacity 0.2s ease; min-width: 110px; }
.submit-button { background-color: #28a745; color: white; }
.submit-button:hover:not(:disabled) { background-color: #218838; }
.submit-button:disabled { background-color: #6c757d; cursor: not-allowed; opacity: 0.6; }
.btn-cancel { background-color: #6c757d; color: white; }
.btn-cancel:hover { background-color: #5a6268; }

/* --- Responsividade --- */
@media (max-width: 992px) {
  .main-layout {
    flex-direction: column;
  }
  .form-section {
    flex-basis: auto;
    width: 100%;
    max-width: 100%;
    order: 2;
  }
   .lista-escolas-section {
     order: 1;
     min-width: unset;
   }
}

@media (max-width: 768px) {
  .page-header h1 { font-size: 1.6rem; }
  .card { padding: 1rem; }
}

@media (max-width: 600px) {
  .list-header { flex-direction: column; align-items: flex-start; }
  .btn-add-new { width: 100%; justify-content: center; }
  .escola-info { margin-right: 0; margin-bottom: 0.8rem; width: 100%;}
  .action-buttons { width: 100%; justify-content: flex-end; }
}
@media (max-width: 480px) {
    .form-actions { justify-content: space-between; gap: 0.5rem;}
    .form-actions button { flex-grow: 1; min-width: 90px; padding: 0.6rem 0.8rem; font-size: 0.85rem; }
}
@media (max-width: 400px) {
    .form-actions { flex-direction: column; gap: 0.5rem; }
    .form-actions button { width: 100%; }
}

/* --- Transições --- */
.form-slide-fade-enter-active {
  transition: all 0.4s ease-out;
}
.form-slide-fade-leave-active {
  transition: all 0.3s ease-in;
  /* position: absolute; */ /* Teste se necessário */
}
.form-slide-fade-enter-from,
.form-slide-fade-leave-to {
  transform: translateX(30px);
  opacity: 0;
}
.form-slide-fade-enter-to,
.form-slide-fade-leave-from {
  transform: translateX(0);
  opacity: 1;
}


/* Spinner (mantido) */
.spinner-border{display:inline-block;width:1rem;height:1rem;vertical-align:text-bottom;border:.2em solid currentColor;border-right-color:transparent;border-radius:50%;-webkit-animation:spinner-border .75s linear infinite;animation:spinner-border .75s linear infinite}@keyframes spinner-border{to{transform:rotate(360deg)}}.spinner-border-sm{width:1rem;height:1rem;border-width:.2em}

</style>