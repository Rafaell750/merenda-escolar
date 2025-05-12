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
                <tr v-for="(histItem, histIndex) in item.historico_detalhado" :key="histItem.original_transferencia_id + '-' + (histItem.item_id_original || histIndex)">
                  <td>{{ histItem.data_formatada }}</td>
                  <td>{{ histItem.nome_usuario }}</td>
                  <td class="text-right">{{ histItem.quantidade_enviada }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </td>
      </tr>
    </template>

  
  <script setup>
  import { ref, defineProps } from 'vue';
  
  const props = defineProps({
    item: {
      type: Object,
      required: true
    },
    // Prop para saber quantas colunas a tabela principal tem, para o colspan
    colunasNaTabelaPrincipal: {
      type: Number,
      default: 6 // O valor padrão que você estava usando
    }
  });
  
  const expandido = ref(false); // Cada instância do componente terá seu próprio estado 'expandido'
  
  function toggleExpandido() {
    expandido.value = !expandido.value;
  }
  </script>
  
<style scoped>
.linha-consolidada {
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.linha-consolidada:hover {
  background-color: #f0f0f0 !important; /* !important pode ser necessário se houver conflito com estilos do pai para tr:hover */
}
.linha-consolidada.expandido {
  background-color: #e9ecef;
  font-weight: 500; /* Levemente mais forte que normal */
}
.linha-consolidada.expandido:hover {
    background-color: #dfe4e8 !important;
}

/* Estilos para as células da linha consolidada */
.linha-consolidada td {
  padding: 0.75rem;
  border-bottom: 1px solid #dee2e6;
  border-right: 1px solid #dee2e6; /* Adiciona borda direita a todos os TD da linha consolidada */
  vertical-align: middle;
  text-align: left;
}

/* Borda apenas nas laterais da primeira e última célula da linha principal para corresponder à tabela */
.linha-consolidada td:first-child {
  border-left: 1px solid #dee2e6;
}
.linha-consolidada td:last-child {
  border-right: 1px solid #dee2e6;
}


/* Específico para a coluna Produto (terceira célula) */
.linha-consolidada td:nth-child(3) {
  white-space: normal;    /* Permite quebra de linha */
  word-break: break-word; /* Ajuda a quebrar palavras muito longas sem espaços */
  /* Você pode adicionar uma largura ou largura mínima/máxima se necessário: */
  /* min-width: 150px; */
  /* width: 25%; */
}

/* Específico para a coluna Unidade (QUARTA célula) - CENTRALIZAR */
.linha-consolidada td:nth-child(4) {
  text-align: center;
}

/* Específico para a coluna Qtde. Total Recebida (QUINTA célula) - CENTRALIZAR */
.linha-consolidada td:nth-child(5) {
  text-align: center; 
}

/* Específico para a coluna Detalhes/Ícone (sexta célula) */
.linha-consolidada td:nth-child(6) {
  text-align: center;
}
.linha-consolidada td:nth-child(6) svg { /* Estilo para o SVG dentro da célula */
    vertical-align: middle;
}



/* Linha de Histórico */
.linha-historico td {
  padding: 0 !important;
  border-top: none !important;
  border-left: 1px solid #dee2e6; /* Borda lateral para a célula que contém o histórico */
  border-right: 1px solid #dee2e6;
  border-bottom: 1px solid #dee2e6;
}

.historico-detalhado-container {
  padding: 1rem 1.5rem;
  background-color: #fdfdfd;
  border-top: 2px solid #ced4da; /* Linha divisória um pouco mais forte */
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

.tabela-historico-detalhado .text-right { /* Se você tiver uma classe text-right dentro da tabela de histórico */
  text-align: right;
}
  </style>