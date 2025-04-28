<!-- /frontend/src/views/Produtos/ProdutosView.vue -->
<template>
    <div class="produtos-view">
      <header class="page-header">
        <h1>Gestão de Produtos</h1>
      </header>

      <div class="content-area">
        <!-- Card do Formulário -->
        <div class="card form-card">
          <!-- Cabeçalho do Card com Título e Botão Toggle -->
          <div class="form-card-header">
            <h2 class="card-title">Adicionar Novo Produto</h2>
            <button @click="toggleForm" type="button" class="toggle-form-button">
              <!-- Ícone ou Texto que muda -->
              <svg v-if="isFormExpanded" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
              </svg>
            </button>
          </div>

          <!-- Conteúdo Colapsável com Transição -->
          <Transition name="collapse">
            <div v-if="isFormExpanded" class="form-collapsible-content">
              <form @submit.prevent="cadastrarProduto" class="form-cadastro">
                <!-- Feedback -->
                <div v-if="validationError" class="feedback-message error form-feedback">
                  {{ validationError }}
                </div>

            <!-- === LINHA 1: Nome (maior) e Unidade (menor) === -->
            <div class="form-row">
              <div class="form-group col-grow">
                <label for="nomeProduto" class="form-label">Nome:</label>
                <input type="text" id="nomeProduto" v-model="novoProduto.nome" class="form-input" required placeholder="Nome do Produto" />
              </div>
              <div class="form-group col-small">
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

             <!-- === LINHA 2: Categoria, Quantidade, Valor e Vencimento === -->
             <div class="form-row">
                <!-- Categoria -->
                <div class="form-group col-1-of-4"> <!-- MUDANÇA: Adicionado col-1-of-4 -->
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
                <!-- Quantidade -->
                <div class="form-group col-1-of-4"> <!-- MUDANÇA: Alterado de col-1-of-3 para col-1-of-4 -->
                    <label for="quantidadeProduto" class="form-label">Quantidade:</label>
                    <input type="number" id="quantidadeProduto" v-model.number="novoProduto.quantidade" class="form-input" placeholder="Ex: 10" step="any" min="0"/>
                </div>
                <!-- Valor -->
                <div class="form-group col-1-of-4"> <!-- MUDANÇA: Alterado de col-1-of-3 para col-1-of-4 -->
                    <label for="valorProduto" class="form-label">Valor (R$):</label>
                    <input type="number" id="valorProduto" v-model.number="novoProduto.valor" class="form-input" placeholder="Ex: 15,50" step="0.01" min="0"/>
                </div>
                <!-- Vencimento -->
                <div class="form-group col-1-of-4"> <!-- MUDANÇA: Alterado de col-1-of-3 para col-1-of-4 -->
                    <label for="vencimentoProduto" class="form-label">Vencimento:</label>
                    <input type="date" id="vencimentoProduto" v-model="novoProduto.data_vencimento" class="form-input"/>
                </div>
            </div>


            <!-- === LINHA 4: Descrição === -->
            <div class="form-row">
                <div class="form-group">
                    <label for="descricaoProduto" class="form-label optional">Descrição (Opcional):</label>
                    <input type="text" id="descricaoProduto" v-model="novoProduto.descricao" class="form-input" placeholder="Detalhes adicionais..." />
                </div>
            </div>

            <!-- Botão de Envio -->
            <div class="form-actions">
              <button type="submit" class="submit-button" :disabled="isLoading">
                <span v-if="isLoading" class="spinner"></span>
                <span>{{ isLoading ? 'Adicionando...' : 'Adicionar Produto' }}</span>
              </button>
            </div>
          </form>
        </div> <!-- Fim de .form-collapsible-content -->
      </Transition>
    </div> <!-- Fim de .card.form-card -->

        <!-- **** NOVA ÁREA PARA LISTA E FILTROS LADO A LADO **** -->
        <div class="list-filter-container">

            <!-- Área da Lista de Produtos -->
            <div class="card product-list-card">
              <h2 class="card-title list-title">Produtos Cadastrados</h2>
              <div v-if="isLoadingList" class="loading-list">Carregando produtos...</div>
              <!-- Mensagem se não houver produtos *antes* de filtrar -->
              <div v-else-if="!produtos || produtos.length === 0" class="empty-list">Nenhum produto cadastrado ainda.</div>
              <!-- Mensagem se houver produtos, mas nenhum corresponder ao filtro -->
              <div v-else-if="produtosFiltrados.length === 0" class="empty-list">Nenhum produto encontrado com os filtros atuais.</div>

              <!-- Lista de Produtos (Itera sobre produtosFiltrados) -->
              <TransitionGroup name="list" tag="ul" class="product-list" v-else>
                <li v-for="produto in produtosFiltrados" :key="produto.id" class="product-item">
                  <!-- Informações principais -->
                  <div class="product-info">
                      <span class="product-name">{{ produto.nome }}</span>
                      <span class="product-details">
                      {{ getCategoriaLabel(produto.categoria) }} | {{ produto.unidade_medida }}
                      </span>
                      <!-- Detalhes extras -->
                      <span class="product-details extra-details">
                      <span v-if="produto.quantidade !== null && produto.quantidade !== undefined">
                          Qtd: {{ produto.quantidade }} |
                      </span>
                      <span v-if="produto.valor !== null && produto.valor !== undefined">
                          Valor: {{ formatCurrency(produto.valor) }} |
                      </span>
                      <span v-if="produto.data_vencimento">
                          Venc: {{ formatDate(produto.data_vencimento) }}
                      </span>
                      </span>
                  </div>
                  <!-- Botão Excluir -->
                  <button @click="confirmarExclusao(produto.id)" class="delete-button" title="Excluir Produto">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                      <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm-1 .72h-6.97l-.8-10.047a.5.5 0 0 1 .498-.554h8.974a.5.5 0 0 1 .498.554l-.8 10.047zM9 5.5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0v-5a.5.5 0 0 1 .5-.5m-3 0a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0v-5a.5.5 0 0 1 .5-.5"/>
                      </svg>
                  </button>
                </li>
              </TransitionGroup>
            </div> <!-- Fim de product-list-card -->

             <!-- **** Área dos Filtros (Novo Componente) **** -->
             <ProdutoFiltros
                :categorias="categoriasMap"
                @filtros-atualizados="handleFiltrosAtualizados"
             />
             <!-- :categorias -> Passa o mapa de categorias para o componente filho -->
             <!-- @filtros-atualizados -> Escuta o evento emitido pelo filho -->

        </div> <!-- Fim de list-filter-container -->

      </div> <!-- Fim de content-area -->
    </div>
  </template>

  <script setup>
  import { ref, onMounted, computed } from 'vue'; // Importa 'computed'
  import { useToast } from "vue-toastification";
  import ProdutoFiltros from './ProdutoFiltros.vue'; // Importa o novo componente (ajuste o caminho se necessário)

  const toast = useToast();
  const isFormExpanded = ref(false); // Começa recolhido (false)

  // Estado Reativo Inicial
  const getInitialNovoProduto = () => ({
    nome: '',
    descricao: '',
    unidadeMedida: '',
    categoria: '',
    quantidade: null,
    valor: null,
    data_vencimento: ''
  });

  const novoProduto = ref(getInitialNovoProduto());
  const produtos = ref([]); // Lista ORIGINAL de produtos vinda do backend
  const isLoading = ref(false);
  const isLoadingList = ref(true);
  const validationError = ref('');

  // Estado para armazenar os filtros ativos recebidos do componente filho
  const filtrosAtivos = ref({
    nome: '',
    categoria: '',
    // quantidadeMin: null // Adicione aqui os mesmos campos do filtro inicial do filho
  });

  // Mapeamento de categorias (para labels e para passar ao filho)
  const categoriasMap = {
    graos_cereais: 'Grãos/Cereais', laticinios: 'Laticínios', carnes_ovos: 'Carnes/Ovos',
    frutas: 'Frutas', verduras_legumes: 'Verduras/Legumes', nao_pereciveis: 'Não Perecíveis',
    congelados: 'Congelados', limpeza: 'Limpeza', outros: 'Outros'
  };

  // --- NOVA FUNÇÃO PARA ALTERNAR O ESTADO ---
  const toggleForm = () => {
  isFormExpanded.value = !isFormExpanded.value;
  };

  const getCategoriaLabel = (key) => categoriasMap[key] || key;

  // --- Funções de Formatação ---
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
       // Adiciona T00:00:00 para tratar como data local e evitar problemas de fuso
       const date = new Date(dateString + 'T00:00:00');
       // Verifica se a data é válida após a conversão
       if (isNaN(date.getTime())) return dateString; // Retorna original se inválida
       return new Intl.DateTimeFormat('pt-BR').format(date);
    } catch (e) {
       return dateString; // Retorna original em caso de erro
    }
  };


  // --- Funções da API ---

  const fetchProdutos = async () => {
    isLoadingList.value = true;
    // Nota: Esta versão filtra no frontend. Para filtrar no backend,
    // você passaria os filtrosAtivos.value como query params na URL.
    // Ex: `http://localhost:3000/api/produtos?nome=${filtrosAtivos.value.nome}&categoria=${...}`
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
         toast.error("Sessão inválida ou expirada. Faça login novamente.");
         produtos.value = [];
         isLoadingList.value = false; // Para o loading aqui também
         return;
      }

      const response = await fetch('http://localhost:3000/api/produtos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
          let errorMsg = `Falha ao buscar produtos (Status: ${response.status})`;
          try {
               if (response.status === 401 || response.status === 403) {
                   const textResponse = await response.text();
                   try {
                       const jsonData = JSON.parse(textResponse);
                       errorMsg = jsonData.error || textResponse || errorMsg;
                   } catch (parseError) { errorMsg = textResponse || errorMsg; }
                   localStorage.removeItem('authToken');
                   toast.error("Sessão inválida ou expirada. Faça login.");
               } else {
                   const errorData = await response.json();
                   errorMsg = errorData.error || errorMsg;
               }
          } catch(e) { console.warn("Não foi possível ler o corpo da resposta de erro do fetchProdutos."); }
          throw new Error(errorMsg);
      }

      // Atualiza a lista ORIGINAL com os dados do backend
      produtos.value = await response.json();

    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      toast.error(`Não foi possível carregar a lista: ${error.message}`);
      produtos.value = []; // Garante que a lista fique vazia em caso de erro
    } finally {
      isLoadingList.value = false;
    }
  };

  const cadastrarProduto = async () => {
    validationError.value = '';

    // Validação Frontend Simples
    if (!novoProduto.value.nome || !novoProduto.value.unidadeMedida || !novoProduto.value.categoria) {
      validationError.value = 'Preencha os campos obrigatórios (Nome, Unidade, Categoria).';
      toast.warning(validationError.value);
      return;
    }
     if (novoProduto.value.quantidade !== null && novoProduto.value.quantidade < 0) {
         validationError.value = 'A quantidade não pode ser negativa.';
         toast.warning(validationError.value);
         return;
     }
     if (novoProduto.value.valor !== null && novoProduto.value.valor < 0) {
         validationError.value = 'O valor não pode ser negativo.';
         toast.warning(validationError.value);
         return;
     }


     isLoading.value = true;
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
         toast.error("Erro de autenticação. Faça login novamente.");
         isLoading.value = false;
         return;
      }

      const response = await fetch('http://localhost:3000/api/produtos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(novoProduto.value),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `Falha ao cadastrar (Status: ${response.status})`);
      }

      // Sucesso! Adiciona o produto NO INÍCIO da lista ORIGINAL
      // A lista filtrada (computed) será atualizada automaticamente
      produtos.value.unshift(responseData);

      novoProduto.value = getInitialNovoProduto(); // Limpa o formulário
      toast.success(`Produto "${responseData.nome}" adicionado!`);

    } catch (error) {
      console.error("Erro ao cadastrar produto:", error);
      toast.error(`Erro ao cadastrar: ${error.message}`);
    } finally {
      isLoading.value = false;
    }
  };

  // Excluir Produto (opera na lista original 'produtos')
  const confirmarExclusao = async (id) => {
    const produtoParaExcluir = produtos.value.find(p => p.id === id);
    const nomeProduto = produtoParaExcluir ? produtoParaExcluir.nome : `ID ${id}`;

    if (!confirm(`Tem certeza que deseja excluir o produto "${nomeProduto}"?`)) {
        return;
    }
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            toast.error("Erro de autenticação. Faça login novamente.");
            return;
        }

        const response = await fetch(`http://localhost:3000/api/produtos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            let errorMsg = `Falha ao excluir (Status: ${response.status})`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg;
            } catch(e) { /* Ignora se não conseguir parsear json */ }
            throw new Error(errorMsg);
        }

        // Remove da lista ORIGINAL após sucesso no backend
        // A lista filtrada (computed) será atualizada automaticamente
        produtos.value = produtos.value.filter(p => p.id !== id);
        toast.success(`Produto "${nomeProduto}" excluído com sucesso.`);

    } catch (error) {
        console.error("Erro ao excluir produto:", error);
        toast.error(`Erro ao excluir: ${error.message}`);
    }
  }

  // --- Lógica de Filtragem ---

  // Handler para o evento emitido pelo componente ProdutoFiltros
  const handleFiltrosAtualizados = (novosFiltros) => {
    filtrosAtivos.value = novosFiltros;
    // Se estivesse filtrando no backend, chamaria fetchProdutos() aqui.
    // console.log("Filtros ativos agora:", filtrosAtivos.value); // Para debug
  };

  // Computed property para a lista de produtos FILTRADA
  const produtosFiltrados = computed(() => {
    // Se não há produtos originais, retorna array vazio
    if (!produtos.value) return [];

    // Começa com a lista original completa
    let listaFiltrada = produtos.value;

    // Aplica filtro de nome (case-insensitive)
    const nomeFiltro = filtrosAtivos.value.nome?.trim().toLowerCase();
    if (nomeFiltro) {
      listaFiltrada = listaFiltrada.filter(p =>
        p.nome.toLowerCase().includes(nomeFiltro)
      );
    }

    // Aplica filtro de categoria
    const categoriaFiltro = filtrosAtivos.value.categoria;
    if (categoriaFiltro) {
      listaFiltrada = listaFiltrada.filter(p =>
        p.categoria === categoriaFiltro
      );
    }

    // Exemplo: Aplica filtro de quantidade mínima (se existir)
    // const qtdMinFiltro = filtrosAtivos.value.quantidadeMin;
    // if (qtdMinFiltro !== null && qtdMinFiltro !== undefined && qtdMinFiltro >= 0) {
    //   listaFiltrada = listaFiltrada.filter(p =>
    //      p.quantidade !== null && p.quantidade !== undefined && p.quantidade >= qtdMinFiltro
    //   );
    // }

    // Retorna a lista após aplicar todos os filtros ativos
    return listaFiltrada;
  });


  // Executar ao montar o componente
  onMounted(() => {
    fetchProdutos(); // Carrega a lista inicial
  });

  </script>

  <!-- Mantém o link para o CSS externo -->
  <style scoped src="../CSS/ProdutosView.css"></style>

  