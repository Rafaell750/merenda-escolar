<!-- /frontend/src/views/Produtos/ProdutoView.vue -->
<template>
    <div class="produtos-view">
        <header class="page-header">
            <h1>Gestão de Produtos</h1>
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

                <!-- Conteúdo Colapsável -->
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
                <div class="card product-list-card">
                    <h2 class="card-title list-title">Produtos Cadastrados</h2>

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
                                    <!-- ***** NOVA COLUNA ***** -->
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
                                    <!-- ***** NOVA CÉLULA ***** -->
                                    <td data-label="Modificado em:">
                                        {{ formatDateTime(produto.data_modificacao) }}
                                    </td>
                                    <td data-label="Ações:" class="actions-cell">
                                        <button @click="iniciarEdicao(produto)" class="edit-button icon-only" title="Editar Produto">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                                                <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                                                <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
                                            </svg>
                                        </button>
                                        <button @click="confirmarExclusao(produto.id)" class="delete-button icon-only" title="Excluir Produto">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                                              <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm-1 .72h-6.97l-.8-10.047a.5.5 0 0 1 .498-.554h8.974a.5.5 0 0 1 .498.554l-.8 10.047zM9 5.5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0v-5a.5.5 0 0 1 .5-.5m-3 0a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0v-5a.5.5 0 0 1 .5-.5"/>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            </TransitionGroup>
                        </table>
                    </div>
                </div>

                <!-- Filtros -->
                <ProdutoFiltros
                    :categorias="categoriasMap"
                    @filtros-atualizados="handleFiltrosAtualizados"
                    class="filter-card" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { useToast } from "vue-toastification";
import ProdutoFiltros from './ProdutoFiltros.vue';

const toast = useToast();
const isFormExpanded = ref(false);
const editandoProdutoId = ref(null);
const produtoEmEdicao = ref(null);
const isEditing = computed(() => editandoProdutoId.value !== null);

const getInitialFormData = () => ({
  id: null,
  nome: '',
  descricao: '',
  unidade_medida: '',
  categoria: '',
  quantidade: null,
  valor: null,
  data_vencimento: '',
  // data_modificacao não é editável diretamente pelo usuário no formulário
});

const formData = ref(getInitialFormData());
const produtos = ref([]);
const isLoading = ref(false);
const isLoadingList = ref(true);
const validationError = ref('');
const filtrosAtivos = ref({ nome: '', categoria: '' });

const categoriasMap = {
  graos_cereais: 'Grãos/Cereais', laticinios: 'Laticínios', carnes_ovos: 'Carnes/Ovos',
  frutas: 'Frutas', verduras_legumes: 'Verduras/Legumes', nao_pereciveis: 'Não Perecíveis',
  congelados: 'Congelados', limpeza: 'Limpeza', outros: 'Outros'
};

const toggleForm = () => {
  isFormExpanded.value = !isFormExpanded.value;
  if (!isFormExpanded.value && isEditing.value) {
      cancelarEdicao();
  }
};

const getCategoriaLabel = (key) => categoriasMap[key] || key;

// --- FUNÇÕES DE FORMATAÇÃO ---
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '';
  const numValue = Number(value);
  if (isNaN(numValue)) return '-';
  return numValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString) => { // Apenas Data (para vencimento)
  if (!dateString) return '-';
  try {
      const date = new Date(dateString + 'T00:00:00');
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch (e) {
      return dateString;
  }
};

// ***** NOVA FUNÇÃO PARA FORMATAR DATA E HORA *****
const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-'; // Retorna '-' se for nulo ou vazio
    try {
        // Tenta criar um objeto Date. Funciona bem com formatos ISO como 'YYYY-MM-DDTHH:mm:ss.sssZ'
        const date = new Date(dateTimeString);
        // Verifica se a data é válida
        if (isNaN(date.getTime())) {
            console.warn("Data/Hora inválida recebida:", dateTimeString);
            return dateTimeString; // Retorna a string original se inválida
        }
        // Formata para o padrão brasileiro, incluindo a hora
        return date.toLocaleString('pt-BR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            // second: '2-digit' // Opcional: descomente para mostrar segundos
        });
    } catch (e) {
        console.error("Erro ao formatar data/hora:", dateTimeString, e);
        return dateTimeString; // Retorna original em caso de erro inesperado
    }
};


const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString + 'T00:00:00');
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        return '';
    }
};


// --- FUNÇÕES API ---
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
           produtos.value = [];
           isLoadingList.value = false;
           // TODO: Redirecionar para login
           return;
      }
      if (!response.ok) {
          let errorMsg = `Falha ao buscar produtos (Status: ${response.status})`;
          try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch(e) { /* Ignora */ }
          throw new Error(errorMsg);
      }
      // A API AGORA DEVE RETORNAR 'data_modificacao' EM CADA PRODUTO
      produtos.value = await response.json();
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

const cadastrarProduto = async () => {
  validationError.value = '';
  if (!formData.value.nome || !formData.value.unidade_medida || !formData.value.categoria) {
    validationError.value = 'Preencha os campos obrigatórios (Nome, Unidade, Categoria).';
    toast.warning(validationError.value);
    return;
  }
   if ((formData.value.quantidade !== null && formData.value.quantidade !== '' && formData.value.quantidade < 0) ||
       (formData.value.valor !== null && formData.value.valor !== '' && formData.value.valor < 0)) {
        validationError.value = 'Quantidade e Valor não podem ser negativos.';
        toast.warning(validationError.value);
        return;
    }

  isLoading.value = true;
  try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("Token de autenticação não encontrado.");

      const payload = {
          ...formData.value,
          quantidade: formData.value.quantidade === '' ? null : formData.value.quantidade,
          valor: formData.value.valor === '' ? null : formData.value.valor,
          data_vencimento: formData.value.data_vencimento === '' ? null : formData.value.data_vencimento
      };
      delete payload.id; // Remove ID para criação

      const response = await fetch('http://localhost:3000/api/produtos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload),
      });
      const responseData = await response.json();
      if (!response.ok) {
          throw new Error(responseData.error || `Falha ao cadastrar (Status: ${response.status})`);
      }
      // responseData agora deve incluir 'data_modificacao' vindo da API
      produtos.value.unshift(responseData);
      toast.success(`Produto "${responseData.nome}" adicionado!`);
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
    produtoEmEdicao.value = { ...produto }; // Guarda cópia

    // Preenche formData (NÃO inclui data_modificacao aqui, pois não é editável no form)
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
    if (!editandoProdutoId.value) return;

    validationError.value = '';
    if (!formData.value.nome || !formData.value.unidade_medida || !formData.value.categoria) {
        validationError.value = 'Preencha os campos obrigatórios (Nome, Unidade, Categoria).';
        toast.warning(validationError.value);
        return;
    }
    if ((formData.value.quantidade !== null && formData.value.quantidade !== '' && formData.value.quantidade < 0) ||
       (formData.value.valor !== null && formData.value.valor !== '' && formData.value.valor < 0)) {
        validationError.value = 'Quantidade e Valor não podem ser negativos.';
        toast.warning(validationError.value);
        return;
    }

    isLoading.value = true;
    try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error("Token de autenticação não encontrado.");

        const payload = {
          ...formData.value,
          quantidade: formData.value.quantidade === '' ? null : formData.value.quantidade,
          valor: formData.value.valor === '' ? null : formData.value.valor,
          data_vencimento: formData.value.data_vencimento === '' ? null : formData.value.data_vencimento
        };
        // ID já está no payload a partir do formData
        // A API (backend) DEVE atualizar o campo data_modificacao automaticamente ou na lógica da rota PUT

        const response = await fetch(`http://localhost:3000/api/produtos/${editandoProdutoId.value}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.error || `Falha ao atualizar (Status: ${response.status})`);
        }

        // Atualiza lista local. responseData DEVE conter a nova data_modificacao vinda da API
        const index = produtos.value.findIndex(p => p.id === editandoProdutoId.value);
        if (index !== -1) {
            produtos.value[index] = responseData; // Substitui o objeto antigo pelo retornado pela API
        } else {
            fetchProdutos(); // Recarrega tudo se não encontrar (fallback)
        }

        toast.success(`Produto "${responseData.nome}" atualizado!`);
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

const resetForm = () => {
    formData.value = getInitialFormData();
    editandoProdutoId.value = null;
    produtoEmEdicao.value = null;
    validationError.value = '';
};

const confirmarExclusao = async (id) => {
  const produtoParaExcluir = produtos.value.find(p => p.id === id);
  const nomeProduto = produtoParaExcluir ? produtoParaExcluir.nome : `ID ${id}`;

  if (isEditing.value && editandoProdutoId.value === id) {
    cancelarEdicao();
    await nextTick();
  }

  if (!confirm(`Tem certeza que deseja excluir o produto "${nomeProduto}"?`)) {
      return;
  }
  try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("Token de autenticação não encontrado.");

      const response = await fetch(`http://localhost:3000/api/produtos/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) { /* ... tratamento de erro ... */ return; }
      if (response.status === 404) { throw new Error('Produto não encontrado para exclusão.'); }
      if (!response.ok && response.status !== 204) { /* ... tratamento de erro ... */ throw new Error(errorMsg); }

      produtos.value = produtos.value.filter(p => p.id !== id);
      toast.success(`Produto "${nomeProduto}" excluído com sucesso.`);
  } catch (error) {
      console.error("Erro ao excluir produto:", error);
      toast.error(`Erro ao excluir: ${error.message}`);
  }
};

// --- Filtragem ---
const handleFiltrosAtualizados = (novosFiltros) => {
  filtrosAtivos.value = novosFiltros;
};

const produtosFiltrados = computed(() => {
  if (!produtos.value) return [];
  let listaFiltrada = [...produtos.value];

  const nomeFiltro = filtrosAtivos.value.nome?.trim().toLowerCase();
  if (nomeFiltro) {
      listaFiltrada = listaFiltrada.filter(p => p.nome.toLowerCase().includes(nomeFiltro));
  }
  const categoriaFiltro = filtrosAtivos.value.categoria;
  if (categoriaFiltro) {
      listaFiltrada = listaFiltrada.filter(p => p.categoria === categoriaFiltro);
  }
  // Ordenar por data de modificação (mais recente primeiro) - Opcional
  listaFiltrada.sort((a, b) => {
      const dateA = a.data_modificacao ? new Date(a.data_modificacao).getTime() : 0;
      const dateB = b.data_modificacao ? new Date(b.data_modificacao).getTime() : 0;
      return dateB - dateA; // Decrescente (mais novo primeiro)
  });

  return listaFiltrada;
});

// --- Ciclo de Vida ---
onMounted(() => {
  fetchProdutos();
});

</script>

<!-- Links CSS -->
<style scoped src="../CSS/ProdutosView.css"></style>
<style scoped src="../CSS/ProdutosEditView.css"></style>

<!-- CSS Adicional (Se necessário para a nova coluna, mas geralmente os estilos de tabela existentes devem funcionar) -->
<style scoped>
/* Se precisar de ajustes específicos para a coluna de data/hora */
.product-table th:nth-last-child(2), /* Penúltimo header (Última Modificação) */
.product-table td:nth-last-child(2) { /* Penúltima célula (Última Modificação) */
    /* Exemplo: min-width: 140px; */
    /* Exemplo: white-space: nowrap; */
}

/* Ajuste para responsividade se a tabela ficar muito cheia */
@media (max-width: 992px) {
    /* Pode precisar reavaliar o layout da tabela ou os data-labels */
     .product-table td[data-label="Modificado em:"]::before {
         content: attr(data-label) " ";
         font-weight: bold;
         display: inline-block; /* Ou block dependendo do layout responsivo */
         margin-right: 6px;
         color: #4a5568;
     }
}
</style>