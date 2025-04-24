<!-- /frontend/src/components/PainelControleView.vue -->
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
                <span class="escola-detalhe" v-if="escola.cidade || escola.endereco">
                  {{ escola.cidade }}{{ escola.uf ? `/${escola.uf}` : '' }}{{ escola.endereco ? ` - ${escola.endereco}` : '' }}
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

      <!-- Bloco 2: Formulário (Visível Condicionalmente) -->
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
            <!-- Campos do formulário (iguais a antes) -->
             <div class="form-group">
              <label for="form-nome">Nome da Escola <span class="required">*</span></label>
              <input type="text" id="form-nome" v-model="formData.nome" required>
            </div>
            <div class="form-group">
              <label for="form-endereco">Endereço</label>
              <input type="text" id="form-endereco" v-model="formData.endereco">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="form-cidade">Cidade</label>
                <input type="text" id="form-cidade" v-model="formData.cidade">
              </div>
              <div class="form-group">
                <label for="form-uf">UF</label>
                <input type="text" id="form-uf" v-model="formData.uf" maxlength="2">
              </div>
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
      <!-- Fim da Seção Formulário (Bloco 2) -->

    </div> <!-- Fim do .main-layout -->

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useEscolasStore } from '@/stores/escolas';

const escolasStore = useEscolasStore();

// --- Estado ---
const isFormExpanded = ref(false); // Controla visibilidade do PAINEL do formulário
const isEditing = ref(false);
const editingEscolaId = ref(null);
const formData = ref({ nome: '', endereco: '', cidade: '', uf: '', responsavel: '' });
const formError = ref('');
const formSuccessMessage = ref('');
const listError = ref('');

// --- Funções Auxiliares ---
const resetForm = () => {
    isEditing.value = false;
    editingEscolaId.value = null;
    formData.value = { nome: '', endereco: '', cidade: '', uf: '', responsavel: '' };
    formError.value = '';
    // Não limpa a mensagem de sucesso aqui, para dar tempo de ver
    // Não mexe em isFormExpanded aqui
};

// Abre o painel do formulário para ADICIONAR
const openFormPanel = () => {
    resetForm(); // Limpa dados anteriores
    formSuccessMessage.value = ''; // Limpa msg de sucesso anterior
    isFormExpanded.value = true;
    nextTick(() => {
        document.getElementById('form-nome')?.focus();
    });
};

// Fecha o painel do formulário
const closeFormPanel = () => {
    isFormExpanded.value = false;
    resetForm(); // Garante que o estado de edição seja limpo ao fechar
    formSuccessMessage.value = ''; // Limpa msg ao fechar
};

// --- Lógica Cadastro ---
const submitCadastro = async () => {
    formError.value = '';
    formSuccessMessage.value = '';
    try {
        const novaEscola = await escolasStore.addEscola(formData.value);
        formSuccessMessage.value = `Escola "${novaEscola.nome}" cadastrada com sucesso!`;
        resetForm(); // Limpa os campos do form após sucesso
        // Mantém o painel aberto por um tempo para ver a msg, depois fecha
        setTimeout(() => {
            closeFormPanel();
        }, 2000);
    } catch (error) {
        console.error("Falha no cadastro:", error.message);
        formError.value = error.message || 'Falha ao cadastrar escola.';
        // Não fecha em caso de erro
    }
};

// --- Lógica Edição ---
const startEdit = (escola) => {
    resetForm(); // Limpa estado anterior
    formSuccessMessage.value = ''; // Limpa msg de sucesso anterior
    const escolaDataCopy = JSON.parse(JSON.stringify(escola));
    formData.value = escolaDataCopy;
    isEditing.value = true;
    editingEscolaId.value = escola.id;
    isFormExpanded.value = true; // Abre/Garante que o painel esteja visível

    nextTick(() => {
        document.getElementById('form-nome')?.focus();
        // Scroll opcional para o formulário se a página for longa
        // document.querySelector('.form-section')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
};

const submitUpdate = async () => {
    formError.value = '';
    formSuccessMessage.value = '';
    if (!editingEscolaId.value) return;

    try {
        const escolaAtualizada = await escolasStore.updateEscola(editingEscolaId.value, formData.value);
        formSuccessMessage.value = `Escola "${escolaAtualizada.nome}" atualizada com sucesso!`;
        resetForm(); // Limpa estado de edição após sucesso
         // Mantém o painel aberto por um tempo para ver a msg, depois fecha
        setTimeout(() => {
           closeFormPanel();
        }, 2000);
    } catch (error) {
        console.error("Falha na atualização:", error.message);
        formError.value = error.message || 'Falha ao atualizar escola.';
        // Não fecha em caso de erro
    }
};

// Chamado pelo botão "Cancelar Edição"
const cancelEdit = () => {
    closeFormPanel(); // Fecha o painel e reseta
};

// Função unificada para o submit do formulário
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
    // Não permite excluir se o formulário estiver aberto (editando ou adicionando)
    // Isso simplifica o estado e evita exclusão acidental enquanto digita
    if (isFormExpanded.value) {
        listError.value = "Feche o painel de cadastro/edição antes de excluir.";
        setTimeout(() => { listError.value = ''; }, 3500);
        return;
    }

    if (confirm(`Tem certeza que deseja excluir a escola "${nome}"? Esta ação não pode ser desfeita.`)) {
        try {
            await escolasStore.deleteEscola(id);
            // Opcional: mostrar mensagem de sucesso na lista
            // listSuccessMessage.value = `Escola "${nome}" excluída.`;
            // setTimeout(() => { listSuccessMessage.value = ''; }, 3000);
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
.painel-controle-content { width: 100%; max-width: 1400px; /* Aumentado um pouco mais */ margin: 0 auto; padding: 1rem; }
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
  /* A altura será determinada pelo conteúdo */
}
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap; /* Permite quebrar linha se não couber */
  gap: 1rem;
}
.list-header h2 {
  color: #2c3e50;
  margin-bottom: 0; /* Controlado pelo gap do .list-header */
  font-size: 1.5rem;
  font-weight: 600;
  flex-grow: 1; /* Tenta ocupar espaço */
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
  flex-shrink: 0; /* Não encolhe */
}
.btn-add-new:hover:not(:disabled) { background-color: #0056b3; }
.btn-add-new:disabled { background-color: #6c757d; opacity: 0.6; cursor: not-allowed; }
.btn-add-new svg { width: 1em; height: 1em; }

/* Conteúdo da Lista (mensagens, ul) */
.loading-message, .empty-list-message { text-align: center; padding: 1.5rem; color: #5a6a7a; font-style: italic; flex-grow: 1; /* Ocupa espaço vertical se a lista estiver vazia */ }
.loading-message .spinner-border { margin-right: 0.5rem; vertical-align: middle; width: 1.2rem; height: 1.2rem;}
.error-message { /* Reutilizado para erros da lista */
    padding: 0.7rem; border-radius: 4px; margin-top: 0.8rem; text-align: center; border: 1px solid transparent; font-size: 0.85rem;
    color: #721c24; background-color: #f8d7da; border-color: #f5c6cb;
}
.escolas-list { list-style: none; padding: 0; margin: 0; /* Não precisa de flex-grow aqui, os itens preenchem */ }
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
.list-error-margin { margin-top: 1rem; } /* Margem para erro no final da lista */


/* --- Bloco 2: Formulário --- */
.form-section {
  flex: 0 0 450px; /* Não cresce, não encolhe, largura fixa */
  max-width: 450px; /* Garante que não exceda */
  /* Altura será determinada pelo conteúdo */
   /* Adiciona uma leve sombra para destacar quando aparece */
   box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}
.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: nowrap; /* Evita quebra de linha aqui */
  gap: 1rem;
}
.form-section h2 {
  text-align: left;
  color: #2c3e50;
  margin-bottom: 0;
  font-size: 1.4rem;
  font-weight: 600;
  white-space: nowrap; /* Evita quebra de linha do título */
  overflow: hidden;
  text-overflow: ellipsis; /* Adiciona '...' se o título for muito longo */
}
.btn-toggle-form.btn-close { /* Botão X para fechar */
  background: none;
  border: none;
  color: #6c757d;
  padding: 0.2rem; /* Menor padding */
  border-radius: 50%;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, color 0.2s ease;
  flex-shrink: 0;
  width: 28px; /* Tamanho fixo */
  height: 28px;
}
.btn-toggle-form.btn-close:hover { background-color: #f1f1f1; color: #333; }
.btn-toggle-form.btn-close svg { width: 1em; height: 1em; }

.form-content { overflow-y: auto; /* Scroll se necessário */ }
.escola-form { display: flex; flex-direction: column; gap: 0.8rem; }
.form-group { display: flex; flex-direction: column; }
.form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
.form-row .form-group { flex: 1; min-width: 120px; }
label { margin-bottom: 0.3rem; font-weight: 500; color: #555; font-size: 0.9rem; }
input[type="text"] { padding: 0.6rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.95rem; }
input[type="text"]:focus { outline: none; border-color: #34d399; box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.25); }
.required { color: red; margin-left: 2px; }
/* Mensagens de Erro/Sucesso do Formulário */
.form-section .error-message, .form-section .success-message { padding: 0.7rem; border-radius: 4px; margin-top: 0.8rem; text-align: center; border: 1px solid transparent; font-size: 0.85rem; }
.form-section .error-message { color: #721c24; background-color: #f8d7da; border-color: #f5c6cb; }
.form-section .success-message { color: #155724; background-color: #d4edda; border-color: #c3e6cb; }

.form-actions { display: flex; justify-content: flex-end; gap: 0.8rem; margin-top: 1rem; flex-wrap: wrap; padding-top: 1rem; border-top: 1px solid #eee; /* Linha separadora */ }
.form-actions button { padding: 0.7rem 1.2rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: background-color 0.2s ease, opacity 0.2s ease; min-width: 110px; }
.submit-button { background-color: #28a745; color: white; }
.submit-button:hover:not(:disabled) { background-color: #218838; }
.submit-button:disabled { background-color: #6c757d; cursor: not-allowed; opacity: 0.6; }
.btn-cancel { background-color: #6c757d; color: white; }
.btn-cancel:hover { background-color: #5a6268; }

/* --- Responsividade --- */
@media (max-width: 992px) { /* Ponto onde o layout quebra para coluna */
  .main-layout {
    flex-direction: column; /* Empilha */
  }
  .form-section {
    flex-basis: auto; /* Reseta base flex */
    width: 100%; /* Ocupa largura total */
    max-width: 100%; /* Garante que o max-width fixo não atrapalhe */
    order: 2; /* Garante que o formulário venha depois da lista no DOM visual */
  }
   .lista-escolas-section {
     order: 1; /* Garante que a lista venha primeiro */
     min-width: unset; /* Remove largura mínima */
   }
}

@media (max-width: 768px) {
  .page-header h1 { font-size: 1.6rem; }
  .card { padding: 1rem; }
}

@media (max-width: 600px) {
  .list-header { flex-direction: column; align-items: flex-start; } /* Empilha título e botão */
  .btn-add-new { width: 100%; justify-content: center; } /* Botão ocupa largura */
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

/* Estilos de entrada (aparecendo) */
.form-slide-fade-enter-active {
  transition: all 1.0s ease-out; /* Duração e easing da entrada */
}
.form-slide-fade-enter-from {
  transform: translateX(30px); /* Começa ligeiramente à direita */
  opacity: 0;                 /* Começa transparente */
}
.form-slide-fade-enter-to {
  transform: translateX(0);   /* Termina na posição normal */
  opacity: 1;                 /* Termina opaco */
}

/* Estilos de saída (desaparecendo) */
.form-slide-fade-leave-active {
  transition: all 0.5s ease-in; /* Duração e easing da saída (pode ser mais rápido) */
  /* position: absolute; */ /* Opcional: pode ajudar a evitar que a lista "salte" imediatamente */
}
.form-slide-fade-leave-from {
  transform: translateX(0);   /* Começa na posição normal */
  opacity: 1;                 /* Começa opaco */
}
.form-slide-fade-leave-to {
  transform: translateX(30px); /* Termina ligeiramente à direita */
  opacity: 0;                 /* Termina transparente */
}

/* Spinner (mantido) */
.spinner-border{display:inline-block;width:1rem;height:1rem;vertical-align:text-bottom;border:.2em solid currentColor;border-right-color:transparent;border-radius:50%;-webkit-animation:spinner-border .75s linear infinite;animation:spinner-border .75s linear infinite}@keyframes spinner-border{to{transform:rotate(360deg)}}.spinner-border-sm{width:1rem;height:1rem;border-width:.2em}

</style>