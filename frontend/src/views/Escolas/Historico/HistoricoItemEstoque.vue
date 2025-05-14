<!-- /frontend/src/views/Escolas/Historico/HistoricoItemEstoque.vue -->
<template>
    <!-- Usamos <template> aqui porque o componente renderizará duas <tr>, que são fragmentos -->

      <tr @click="toggleExpandido" class="linha-consolidada" :class="{'expandido': expandido}">
        <td>{{ item.ultima_data_recebimento_formatada }}</td>
        <td>{{ item.ultimo_nome_usuario }}</td>
        <td>{{ item.nome_produto }}</td>
        <td>{{ item.unidade_medida }}</td>
        <td class="text-right">{{ item.quantidade_total }}</td>
        <td class="text-center">
          <svg v-if="!expandido" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/>
          </svg>
        </td>
      </tr>
      <tr v-if="expandido" class="linha-historico">
        <td :colspan="colunasNaTabelaPrincipal">
          <div class="historico-detalhado-container">
            <h4>Histórico de Recebimentos para: {{ item.nome_produto }} ({{ item.unidade_medida }})</h4>
            <table class="tabela-historico-detalhado">
              <thead>
                <tr>
                  <th>Histórico - Data Recebimento</th>
                  <th>Histórico - Registrado por</th>
                  <th class="text-right">Histórico - Quantidade Recebida</th>
                </tr>
              </thead>
              <tbody>
                <!-- *** MODIFICADO: Iterar sobre o histórico paginado *** -->
                <tr v-for="(histItem, histIndex) in paginatedHistory" :key="histItem.original_transferencia_id + '-' + (histItem.item_id_original || histIndex)">
                  <td>{{ histItem.data_formatada }}</td>
                  <td>{{ histItem.nome_usuario }}</td>
                  <td class="text-right">{{ histItem.quantidade_enviada }}</td>
                </tr>
                <!-- Mensagem se não houver histórico (opcional) -->
                <tr v-if="!item.historico_detalhado || item.historico_detalhado.length === 0">
                    <td colspan="3" class="text-center fst-italic py-3">Nenhum histórico detalhado encontrado.</td>
                </tr>
              </tbody>
            </table>

            <!-- *** NOVO: Controles de Paginação *** -->
            <nav aria-label="Paginação do histórico detalhado" v-if="totalPages > 1" class="pagination-controls mt-3">
              <ul class="pagination">
                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                  <button class="page-link" @click.prevent="changePage(currentPage - 1)" aria-label="Anterior">«</button>
                </li>
                <li v-for="page in pageNumbers" :key="page === '...' ? `ellipsis-${Math.random()}` : `page-${page}`"
                    class="page-item"
                    :class="{ active: currentPage === page, disabled: page === '...' }">
                  <span v-if="page === '...'" class="page-link">...</span>
                  <button v-else class="page-link" @click.prevent="changePage(page)">{{ page }}</button>
                </li>
                <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                  <button class="page-link" @click.prevent="changePage(currentPage + 1)" aria-label="Próximo">»</button>
                </li>
              </ul>
            </nav>
            <!-- *** FIM: Controles de Paginação *** -->

          </div>
        </td>
      </tr>
    </template>


<script setup>
import { ref, defineProps, computed, watch } from 'vue'; // Import 'computed' e 'watch'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  colunasNaTabelaPrincipal: {
    type: Number,
    default: 6
  }
});

const expandido = ref(false);

// --- Estado e Lógica de Paginação ---
const currentPage = ref(1);
const itemsPerPage = 5; // Itens por página

// Reseta a página atual quando o item é fechado/reaberto ou se o histórico mudar
// Isso é importante se a fonte de dados puder ser atualizada dinamicamente
watch(expandido, (newVal) => {
  if (newVal) {
    currentPage.value = 1; // Volta para a página 1 ao expandir
  }
});
watch(() => props.item.historico_detalhado, () => {
  currentPage.value = 1; // Volta para a página 1 se o histórico mudar
}, { deep: true });


// Propriedade computada para o número total de páginas
const totalPages = computed(() => {
  if (!props.item || !props.item.historico_detalhado) {
    return 0;
  }
  return Math.ceil(props.item.historico_detalhado.length / itemsPerPage);
});

// Propriedade computada para os itens da página atual
const paginatedHistory = computed(() => {
  if (!props.item || !props.item.historico_detalhado || totalPages.value === 0) {
    return [];
  }
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return props.item.historico_detalhado.slice(start, end);
});

// Propriedade computada para gerar os números de página a serem exibidos
// Lógica: 1, 2, ..., 5 (mostra 1, 2, ..., penúltima, última - adaptado)
// Ou uma lógica mais comum: 1 ... 4 5 6 ... 10
const pageNumbers = computed(() => {
  if (totalPages.value <= 1) return [];

  const maxVisibleButtons = 5; // Número máximo de botões (incluindo '...')
  const pages = [];
  const current = currentPage.value;
  const total = totalPages.value;

  if (total <= maxVisibleButtons) {
    // Mostra todas as páginas se forem poucas
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // Lógica para muitas páginas: 1 ... current-1 current current+1 ... total
    pages.push(1); // Sempre mostra a primeira página

    let startPage = Math.max(2, current - 1);
    let endPage = Math.min(total - 1, current + 1);

    // Adiciona '...' se houver um salto entre 1 e startPage
    if (startPage > 2) {
      pages.push('...');
    }

    // Adiciona as páginas ao redor da atual (garantindo que não sejam 1 ou total)
    for (let i = startPage; i <= endPage; i++) {
       pages.push(i);
    }

     // Adiciona '...' se houver um salto entre endPage e total
    if (endPage < total - 1) {
      pages.push('...');
    }

    pages.push(total); // Sempre mostra a última página
  }

  return pages;
});


// Função para mudar de página
function changePage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
}

function toggleExpandido() {
  expandido.value = !expandido.value;
  // Não precisa mais resetar a página aqui, o 'watch' cuida disso
}
</script>

<style scoped>
/* Seus estilos existentes... */

/* --- NOVOS ESTILOS para Paginação --- */
.pagination-controls {
  display: flex;
  justify-content: center; /* Centraliza os controles */
}

.pagination {
  display: inline-flex; /* Garante que a lista ul se comporte como bloco inline */
  padding-left: 0;
  list-style: none;
  border-radius: 0.25rem; /* Opcional: bordas arredondadas */
  margin-bottom: 0; /* Remove margem inferior padrão de ul */
}

.page-item {
  margin: 0 2px; /* Pequeno espaço entre os botões */
}

.page-item .page-link {
  position: relative;
  display: block;
  padding: 0.375rem 0.75rem;
  color: #0d6efd; /* Cor do link padrão (Bootstrap) */
  text-decoration: none;
  background-color: #fff;
  border: 1px solid #dee2e6;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  cursor: pointer;
  border-radius: 0.25rem; /* Bordas arredondadas para cada botão */
}

.page-item .page-link:hover {
  z-index: 2;
  color: #0a58ca;
  background-color: #e9ecef;
  border-color: #dee2e6;
}

.page-item.active .page-link {
  z-index: 3;
  color: #fff;
  background-color: #0d6efd;
  border-color: #0d6efd;
  cursor: default;
}

.page-item.disabled .page-link {
  color: #6c757d;
  pointer-events: none;
  background-color: #fff;
  border-color: #dee2e6;
  opacity: 0.7;
}

/* Estilo específico para o '...' (ellipsis) */
.page-item.disabled .page-link span {
   cursor: default;
}
.page-link span { /* Para garantir que o span '...' ocupe espaço */
   display: inline-block;
}

/* Ajustes específicos se necessário */
.tabela-historico-detalhado {
  margin-bottom: 1rem; /* Adiciona espaço antes da paginação */
}

.text-center {
    text-align: center;
}
.fst-italic {
    font-style: italic;
}
.py-3 {
    padding-top: 1rem;
    padding-bottom: 1rem;
}
.mt-3 {
    margin-top: 1rem !important;
}


/* Seus outros estilos... */
.linha-consolidada {
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.linha-consolidada:hover {
  background-color: #f0f0f0 !important;
}
.linha-consolidada.expandido {
  background-color: #e9ecef;
  font-weight: 500;
}
.linha-consolidada.expandido:hover {
    background-color: #dfe4e8 !important;
}
.linha-consolidada td {
  padding: 0.75rem;
  border-bottom: 1px solid #dee2e6;
  border-right: 1px solid #dee2e6;
  vertical-align: middle;
  text-align: left;
}
.linha-consolidada td:first-child {
  border-left: 1px solid #dee2e6;
}
.linha-consolidada td:last-child {
  border-right: 1px solid #dee2e6;
}
.linha-consolidada td:nth-child(3) {
  white-space: normal;
  word-break: break-word;
}
.linha-consolidada td:nth-child(4),
.linha-consolidada td:nth-child(5),
.linha-consolidada td:nth-child(6) {
  text-align: center;
}
.linha-consolidada td:nth-child(6) svg {
    vertical-align: middle;
}
.linha-historico td {
  padding: 0 !important;
  border-top: none !important;
  border-left: 1px solid #dee2e6;
  border-right: 1px solid #dee2e6;
  border-bottom: 1px solid #dee2e6;
}
.historico-detalhado-container {
  padding: 1rem 1.5rem;
  background-color: #fdfdfd;
  border-top: 2px solid #ced4da;
}
.historico-detalhado-container h4 {
  margin-top: 0;
  margin-bottom: 0.8rem;
  font-size: 1rem;
  color: #495057;
  font-weight: 600;
}
.tabela-historico-detalhado {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.tabela-historico-detalhado th,
.tabela-historico-detalhado td {
  border: 1px solid #e0e0e0;
  padding: 0.5rem 0.75rem;
  text-align: left;
  vertical-align: middle;
}
.tabela-historico-detalhado th {
  background-color: #f8f9fa;
  font-weight: 500;
  color: #343a40;
}
.tabela-historico-detalhado tbody tr:nth-child(even) {
  background-color: #fbfcfd;
}
.tabela-historico-detalhado .text-right {
  text-align: right;
}
</style>