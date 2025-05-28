<!-- /frontend/src/viws/Escolas/Historico/HistoricoRetiradasModal.vue -->
<template>
    <div v-if="show" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content historico-modal-content">
        <header class="modal-header">
          <h3>Histórico de Retiradas da {{ escolaNome }}:</h3>
          <button @click="closeModal" class="close-button" aria-label="Fechar modal">×</button>
        </header>
        <div class="modal-body">
          <p v-if="loading" class="loading-message">Carregando histórico de retiradas...</p>
          <p v-else-if="error" class="error-message">{{ error }}</p>
          <p v-else-if="!historicoRetiradas || historicoRetiradas.length === 0" class="empty-message">
            Nenhuma retirada registrada para esta escola.
          </p>
          <table v-else class="tabela-historico-retiradas">
            <thead>
              <tr>
                <th>Data/Hora da Retirada</th>
                <th>Produto</th>
                <th>Unidade</th>
                <th class="text-right">Qtd. Retirada</th>
                <th>Usuário que retirou</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="retirada in historicoRetiradas" :key="retirada.id || `${retirada.data_retirada_formatada}-${retirada.produto_id}-${Math.random()}`">
                <td>{{ retirada.data_retirada_formatada }}</td>
                <td>{{ retirada.nome_produto }}</td>
                <td>{{ retirada.unidade_medida }}</td>
                <td class="text-right">{{ retirada.quantidade_retirada }}</td>
                <td>{{ retirada.nome_usuario_retirada }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer class="modal-footer">
          <button @click="closeModal" class="btn btn-primary">Fechar</button>
        </footer>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch, onMounted } from 'vue';
  // Não precisa de axios aqui, os dados virão por prop.
  
  const props = defineProps({
    show: Boolean,
    escolaId: [String, Number], // Pode ser útil para futuras features ou logs
    escolaNome: String,
    historicoRetiradas: { // Recebe o array de retiradas já processado
      type: Array,
      default: () => []
    },
    loading: { // Indica se o componente pai está carregando os dados
      type: Boolean,
      default: false
    },
    error: { // Mensagem de erro do componente pai
      type: String,
      default: null
    }
  });
  
  const emit = defineEmits(['close']);
  
  function closeModal() {
    emit('close');
  }
  
  // Poderia adicionar lógica de ordenação ou paginação aqui se necessário no futuro.
  // Por enquanto, assume-se que os dados já vêm ordenados de EscolaDetalhesView (via API).
  </script>
  
  <style scoped>
  /* Estilos básicos do modal - podem ser reutilizados ou adaptados */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: #fff;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 800px; /* Ajuste a largura conforme necessário */
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #eee;
    padding-bottom: 15px;
    margin-bottom: 15px;
  }
  
  .modal-header h3 {
    margin: 0;
    font-size: 1.4em;
    color: #333;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 1.8em;
    cursor: pointer;
    color: #888;
  }
  .close-button:hover {
    color: #333;
  }
  
  .modal-body {
    overflow-y: auto;
    padding: 10px 0;
    flex-grow: 1; /* Faz o corpo do modal crescer para preencher o espaço */
  }
  
  .tabela-historico-retiradas {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }
  
  .tabela-historico-retiradas th,
  .tabela-historico-retiradas td {
    border: 1px solid #ddd;
    padding: 10px;
    text-align: left;
    font-size: 0.9em; /* Fonte um pouco menor para caber mais info */
  }
  
  .tabela-historico-retiradas th {
    background-color: #f8f9fa;
    font-weight: 600;
  }
  
  .text-right {
    text-align: right !important;
  }
  
  .empty-message, .loading-message, .error-message {
    padding: 20px;
    text-align: center;
    color: #666;
    font-style: italic;
  }
  .error-message {
    color: #dc3545;
    font-style: normal;
    font-weight: bold;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #eee;
    padding-top: 15px;
    margin-top: 20px;
  }
  
  .btn {
    padding: 10px 18px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    font-weight: 500;
    margin-left: 10px;
  }
  
  .btn-primary {
    background-color: #007bff;
    color: white;
  }
  .btn-primary:hover {
    background-color: #0056b3;
  }
  </style>