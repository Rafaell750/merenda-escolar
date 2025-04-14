<!-- /frontend/src/views/ProdutosView.vue-->
<template>
    <div class="produtos-view">
      <header class="page-header">
        <h1>Gestão de Produtos</h1>
      </header>
  
      <div class="content-area">
        <!-- Card do Formulário -->
        <div class="card form-card">
          <h2 class="card-title">Adicionar Novo Produto</h2>
          <form @submit.prevent="cadastrarProduto" class="form-cadastro">
            <!-- Feedback de Validação (Opcional, melhor ainda com libs de validação) -->
            <div v-if="validationError" class="feedback-message error form-feedback">
              {{ validationError }}
            </div>
  
            <div class="form-row">
              <!-- Nome -->
              <div class="form-group flex-grow">
                <label for="nomeProduto" class="form-label">Nome:</label>
                <input type="text" id="nomeProduto" v-model="novoProduto.nome" class="form-input" required placeholder="Nome do Produto" />
              </div>
              <!-- Unidade -->
              <div class="form-group">
                <label for="unidadeMedida" class="form-label">Unidade:</label>
                <select id="unidadeMedida" v-model="novoProduto.unidadeMedida" class="form-select" required>
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
  
            <div class="form-row">
              <!-- Categoria -->
              <div class="form-group flex-grow">
                <label for="categoriaProduto" class="form-label">Categoria:</label>
                <select id="categoriaProduto" v-model="novoProduto.categoria" class="form-select" required>
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
            </div>
  
            <!-- Descrição (Opcional, menor destaque) -->
            <div class="form-group">
              <label for="descricaoProduto" class="form-label optional">Descrição (Opcional):</label>
              <input type="text" id="descricaoProduto" v-model="novoProduto.descricao" class="form-input" placeholder="Detalhes adicionais..." />
            </div>
  
            <!-- Botão de Envio com Loading State -->
            <div class="form-actions">
              <button type="submit" class="submit-button" :disabled="isLoading">
                <span v-if="isLoading" class="spinner"></span>
                <span v-else>Adicionar Produto</span>
              </button>
            </div>
          </form>
        </div>
  
        <!-- Área da Lista de Produtos -->
        <div class="card product-list-card">
          <h2 class="card-title list-title">Produtos Cadastrados</h2>
          <div v-if="isLoadingList" class="loading-list">Carregando produtos...</div>
          <div v-else-if="produtos.length === 0" class="empty-list">Nenhum produto cadastrado ainda.</div>
  
          <!-- Usando TransitionGroup para animar a lista -->
          <TransitionGroup name="list" tag="ul" class="product-list" v-else>
            <li v-for="produto in produtos" :key="produto.id" class="product-item">
              <div class="product-info">
                <span class="product-name">{{ produto.nome }}</span>
                <span class="product-details">
                  {{ getCategoriaLabel(produto.categoria) }} | {{ produto.unidade_medida }}
                </span>
              </div>
               <!-- Adicionar botão de excluir (funcionalidade futura) -->
               <button @click="confirmarExclusao(produto.id)" class="delete-button" title="Excluir Produto">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                   <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm-1 .72h-6.97l-.8-10.047a.5.5 0 0 1 .498-.554h8.974a.5.5 0 0 1 .498.554l-.8 10.047zM9 5.5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0v-5a.5.5 0 0 1 .5-.5m-3 0a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0v-5a.5.5 0 0 1 .5-.5"/>
                 </svg>
               </button>
            </li>
          </TransitionGroup>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { useToast } from "vue-toastification"; // Importar hook do toast
  
  const toast = useToast(); // Inicializar toast
  
  // Estados Reativos
  const novoProduto = ref({
    nome: '',
    descricao: '',
    unidadeMedida: '',
    categoria: ''
  });
  const produtos = ref([]); // Lista de produtos
  const isLoading = ref(false); // Loading do botão de cadastro
  const isLoadingList = ref(true); // Loading da lista inicial
  const validationError = ref(''); // Mensagem de erro de validação do form
  
  // Mapeamento para exibir nomes de categoria mais amigáveis
  const categoriasMap = {
    graos_cereais: 'Grãos/Cereais', laticinios: 'Laticínios', carnes_ovos: 'Carnes/Ovos',
    frutas: 'Frutas', verduras_legumes: 'Verduras/Legumes', nao_pereciveis: 'Não Perecíveis',
    congelados: 'Congelados', limpeza: 'Limpeza', outros: 'Outros'
  };
  
  // Função para obter o label da categoria
  const getCategoriaLabel = (key) => categoriasMap[key] || key;
  
  // --- Funções da API ---
  
  // Buscar Produtos ao montar o componente
  const fetchProdutos = async () => {
    isLoadingList.value = true;
    try {
      const response = await fetch('http://localhost:3000/api/produtos');
      if (!response.ok) throw new Error('Falha ao buscar produtos');
      produtos.value = await response.json();
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      toast.error("Não foi possível carregar a lista de produtos."); // Feedback com Toast
      produtos.value = []; // Limpa a lista em caso de erro
    } finally {
      isLoadingList.value = false;
    }
  };
  
  // Cadastrar Novo Produto
  const cadastrarProduto = async () => {
    validationError.value = ''; // Limpa erro de validação
  
    // Validação Frontend Simples
    if (!novoProduto.value.nome || !novoProduto.value.unidadeMedida || !novoProduto.value.categoria) {
      validationError.value = 'Preencha os campos obrigatórios (Nome, Unidade, Categoria).';
      return;
    }
  
    isLoading.value = true; // Ativa loading do botão
    try {
      const response = await fetch('http://localhost:3000/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoProduto.value),
      });
  
      const responseData = await response.json(); // Lê a resposta (sucesso ou erro)
  
      if (!response.ok) {
        // Usa a mensagem de erro do backend, se disponível
        throw new Error(responseData.error || `Falha ao cadastrar (Status: ${response.status})`);
      }
  
      // Sucesso! Adiciona o produto NO INÍCIO da lista local
      produtos.value.unshift(responseData); // Adiciona o objeto retornado pelo backend
  
      // Limpa o formulário
      novoProduto.value = { nome: '', descricao: '', unidadeMedida: '', categoria: '' };
  
      toast.success(`Produto "${responseData.nome}" adicionado!`); // Feedback com Toast
  
    } catch (error) {
      console.error("Erro ao cadastrar produto:", error);
      toast.error(`Erro ao cadastrar: ${error.message}`); // Feedback com Toast
    } finally {
      isLoading.value = false; // Desativa loading do botão
    }
  };
  
  // Excluir Produto (implementação futura)
  const confirmarExclusao = (id) => {
    // Implementar lógica de confirmação e chamada DELETE para /api/produtos/:id
    toast.warning(`Funcionalidade de excluir produto (ID: ${id}) ainda não implementada.`);
    // Após excluir no backend, remover da lista local:
    // produtos.value = produtos.value.filter(p => p.id !== id);
  }
  
  // Executar ao montar o componente
  onMounted(() => {
    fetchProdutos();
  });
  
  </script>
  
  <style scoped src="./CSS/ProdutosView.css"></style>
  <!-- Adicionar estilos específicos para a lista e animação -->
  <style scoped>
  /* Layout do Formulário em Linhas */
  .form-row {
    display: flex;
    gap: 1rem; /* Espaço entre campos na mesma linha */
    align-items: flex-end; /* Alinha itens na base (útil se labels tiverem alturas diferentes) */
  }
  .form-group.flex-grow {
    flex: 1; /* Faz o campo ocupar o espaço restante */
  }
  .form-label.optional {
      font-weight: 400; /* Menos destaque para opcional */
      font-size: 0.8rem;
      color: #718096;
  }
  
  /* Feedback de Validação no Form */
  .form-feedback {
      margin-top: -0.75rem; /* Aproximar do topo */
      margin-bottom: 1rem; /* Afastar do primeiro campo */
      text-align: left;
  }
  
  
  /* Estilos da Lista de Produtos */
  .product-list-card {
    margin-top: 2.5rem; /* Espaço acima da lista */
    padding: 1.5rem 0; /* Padding vertical, sem horizontal para os itens ocuparem tudo */
  }
  .list-title {
      padding: 0 1.5rem 1rem 1.5rem; /* Padding interno do título */
      margin-bottom: 1rem;
      text-align: left;
  }
  .loading-list, .empty-list {
      text-align: center;
      padding: 2rem;
      color: #718096;
      font-style: italic;
  }
  
  .product-list {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 400px; /* Altura máxima com scroll */
    overflow-y: auto; /* Scroll se necessário */
    /* Estilização da barra de scroll (opcional, webkit) */
      scrollbar-width: thin;
      scrollbar-color: #a0aec0 #edf2f7;
  }
  .product-list::-webkit-scrollbar {
    width: 8px;
  }
  .product-list::-webkit-scrollbar-track {
    background: #edf2f7;
    border-radius: 4px;
  }
  .product-list::-webkit-scrollbar-thumb {
    background-color: #a0aec0;
    border-radius: 4px;
    border: 2px solid #edf2f7;
  }
  
  
  .product-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.9rem 1.5rem; /* Padding interno do item */
    border-bottom: 1px solid #edf2f7; /* Linha separadora */
    transition: background-color 0.2s ease;
  }
  .product-item:last-child {
    border-bottom: none; /* Remove borda do último item */
  }
  .product-item:hover {
      background-color: #f7fafc; /* Fundo sutil no hover */
  }
  
  .product-info {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    flex-grow: 1; /* Ocupa espaço */
    margin-right: 1rem; /* Espaço antes do botão delete */
  }
  
  .product-name {
    font-weight: 600;
    color: #2d3748;
  }
  
  .product-details {
    font-size: 0.85rem;
    color: #718096;
  }
  
  .delete-button {
      background: none;
      border: none;
      color: #e53e3e; /* Vermelho para excluir */
      cursor: pointer;
      padding: 0.4rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease, color 0.2s ease;
  }
  .delete-button:hover {
      background-color: #fed7d7; /* Fundo vermelho claro */
      color: #9b2c2c; /* Vermelho escuro */
  }
  .delete-button svg {
      display: block; /* Evita espaço extra abaixo do svg */
  }
  
  
  /* Animações da Lista com TransitionGroup */
  .list-enter-active,
  .list-leave-active {
    transition: all 0.5s ease; /* Duração e timing da animação */
  }
  .list-enter-from,
  .list-leave-to {
    opacity: 0;
    transform: translateX(-30px); /* Começa/termina deslocado e transparente */
  }
  /* Opcional: garantir que itens que saem não afetem o layout */
  .list-leave-active {
    position: absolute; /* Tira o item do fluxo durante a saída */
     width: calc(100% - 3rem); /* Ajustar largura por causa do padding do pai - PODE PRECISAR AJUSTE */
  }
  
  
  /* Spinner de Loading para Botão */
  @keyframes spinner-border {
    to { transform: rotate(360deg); }
  }
  .spinner {
    display: inline-block;
    width: 1em; /* Tamanho relativo à fonte do botão */
    height: 1em;
    vertical-align: -0.125em;
    border: 0.15em solid currentColor; /* Usa a cor do texto do botão */
    border-right-color: transparent;
    border-radius: 50%;
    animation: spinner-border .75s linear infinite;
  }
  .submit-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  
  </style>