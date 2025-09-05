<!-- /frontend/src/views/Escolas/Historico/HistoricoEnviosSME.vue -->
<template>
  <div class="historico-envios-section-content">
    <!-- Componente de Filtros -->
    <HistoricoFiltros @filtros-atualizados="aplicarFiltrosDaBusca" class="mb-4" />

    <div class="section-header">
      <h2>Histórico de Envios para Escolas</h2>
      <button @click="refreshHistorico" :disabled="historicoStore.isLoading" class="btn-refresh-historico" title="Atualizar Histórico">
         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-clockwise" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
        </svg>
        Atualizar
      </button>
    </div>

    <div v-if="historicoStore.isLoading && historicoStore.historicoEnviosSME.length === 0" class="loading-message">
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      Carregando histórico de envios...
    </div>
    <div v-else-if="historicoStore.error && historicoStore.historicoEnviosSME.length === 0" class="error-message">
      Erro ao carregar histórico. Faça Login novamente. {{ historicoStore.error }}
       <button @click="refreshHistorico" class="btn-try-again">Tentar Novamente</button>
    </div>
    <div v-else-if="!historicoStore.isLoading && historicoStore.historicoEnviosSME.length === 0 && !historicoStore.error" class="empty-list-message">
      Nenhum envio registrado no histórico ainda{{ hasActiveFilters ? ' para os filtros aplicados' : '' }}.
    </div>
    <div v-else class="historico-list-container">
      <div v-if="historicoStore.isLoading" class="loading-overlay">
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Atualizando...
      </div>
      <ul class="historico-list">
        <!-- Estrutura do item do histórico totalmente refeita -->
        <li v-for="envio in historicoStore.historicoEnviosSME" :key="envio.transferencia_id" class="historico-item">
          <div class="item-content">
            <!-- Coluna Esquerda: Informações Principais -->
            <div class="item-main-info">
              <h3 class="item-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-building-fill-up" viewBox="0 0 16 16"><path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m.354-5.854 1.5 1.5a.5.5 0 0 1-.708.708L13 11.707V14.5a.5.5 0 0 1-1 0v-2.793l-.646.647a.5.5 0 0 1-.708-.708z"/><path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7.256A4.5 4.5 0 0 0 12.5 8a4.5 4.5 0 0 0-3.59 1.787A.5.5 0 0 0 9 9.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .39-.187A4.5 4.5 0 0 0 8.027 12H6.5a.5.5 0 0 0 0 1H8v1.5a.5.5 0 0 0 1 0V14h.5a.5.5 0 0 0 0-1h-.55a4.5 4.5 0 0 0-.308-.885L9 11.115l.087.06A4.5 4.5 0 0 0 9.5 13a4.5 4.5 0 0 0 .308-.886c.254-.63.64-1.202 1.082-1.676V1zM.5 11.5a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 0-1h-2a.5.5 0 0 0-.5.5m0-2a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 0-1h-5a.5.5 0 0 0-.5.5m0-2a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 0-1h-7a.5.5 0 0 0-.5.5m0-2a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 0-1h-7a.5.5 0 0 0-.5.5"/></svg>
                Destino: <strong>{{ envio.nome_escola }}</strong>
              </h3>
              <div class="meta-info">
                  <span>Enviado em: {{ envio.data_envio_formatada }}</span>
                  <span>Por: {{ envio.usuario_sme_nome }}</span>
              </div>
              <details class="itens-enviados-details">
                <summary>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-box-seam-fill" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M15.528 2.973a.75.75 0 0 1 .472.696v8.662a.75.75 0 0 1-.472.696l-7.25 2.9a.75.75 0 0 1-.557 0l-7.25-2.9A.75.75 0 0 1 0 12.331V3.669a.75.75 0 0 1 .471-.696L7.723.023a.75.75 0 0 1 .554 0zM10.404 2 4.25 4.461 1.846 3.5 1 3.839v.4l6.5 2.6v7.922l.5.2.5-.2V6.84l6.5-2.6v-.4l-.846-.339L10.404 2z"/></svg>
                  Detalhes dos Itens
                  <span class="item-count" v-if="envio.itens && envio.itens.length > 0">
                    ({{ envio.itens.length }})
                  </span>
                </summary>
                <ul v-if="envio.itens && envio.itens.length > 0" class="itens-list">
                  <li v-for="item in envio.itens" :key="item.produto_id + '-' + item.status" class="item-produto" :class="`status-${item.status}`">
                    <span class="item-status-icon" :title="(item.status?.charAt(0).toUpperCase() + item.status?.slice(1)) || 'Status não informado'">
                        {{ getStatusEmoji(item.status) }}
                    </span>
                    <span class="item-info">
                        {{ item.nome_produto }} ({{ item.unidade_medida }}) - Qtd: {{ item.quantidade_enviada }}
                    </span>
                    <span v-if="item.data_processamento" class="item-data-processamento">
                       - {{ item.status === 'confirmado' ? 'Confirmado' : 'Devolvido' }} em: {{ formatarDataParaBrasilia(item.data_processamento) }}
                    </span>
                  </li>
                </ul>
              </details>
            </div>
            <!-- Coluna Direita: Status e Ações -->
            <div class="item-status-actions">
                <span :class="['status-geral', getStatusClass(envio.status_geral)]">
                  <svg v-html="getStatusIcon(envio.status_geral)"></svg>
                  {{ envio.status_geral }}
                </span>
                <button @click="gerarPdfEnvio(envio)" class="btn-gerar-pdf" title="Gerar PDF do Envio">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-pdf" viewBox="0 0 16 16">
                    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2M9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>
                    <path d="M4.603 14.087a.8.8 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.7 7.7 0 0 1 1.482-.625q.49-.174.979-.263c.489-.089.98-.132 1.465-.132.58 0 1.079.06 1.47.182.399.121.735.295.998.524.264.229.456.51.578.85.122.34.152.703.088 1.086s-.165.733-.357 1.015c-.192.282-.45.513-.773.688a1.5 1.5 0 0 1-.41.145h-.002c-.305.09-.635.147-.979.147-.606 0-1.142-.158-1.579-.474a2.2 2.2 0 0 1-.621-.682q-.214-.378-.318-.796a2.3 2.3 0 0 1-.05-.488.3.3 0 0 1 .05-.15.3.3 0 0 1 .15-.05.6.6 0 0 1 .28-.038c.133 0 .25.03.353.092.105.06.192.14.263.24a.7.7 0 0 1 .057.293.7.7 0 0 1-.057.293c-.07.1-.16.18-.273.238a1.3 1.3 0 0 1-.438.095.8.8 0 0 1-.318-.077.7.7 0 0 1-.214-.214.8.8 0 0 1-.15-.318c-.022-.122-.022-.243.002-.363a.6.6 0 0 1 .047-.136.6.6 0 0 1 .137-.116.7.7 0 0 1 .255-.07.7.7 0 0 1 .287.043.7.7 0 0 1 .228.158c.07.07.12.158.152.263a.7.7 0 0 1 .028.322.7.7 0 0 1-.028.322c-.032.105-.08.198-.148.278a1.3 1.3 0 0 1-.438.202c-.12.04-.25.06-.39.06-.273 0-.52-.06-.707-.182-.187-.122-.317-.305-.39-.55Z"/>
                  </svg>
                  Gerar PDF
                </button>
            </div>
          </div>
        </li>
      </ul>
       <!-- Controles de Paginação -->
       <PaginationControls
        v-if="historicoStore.totalPages > 1"
        :current-page="historicoStore.currentPage"
        :total-pages="historicoStore.totalPages"
        @page-changed="goToPage"
        :max-visible-buttons="3" 
      />
    </div>
  </div>
</template>
  
  <script setup>
  import { onMounted, ref, computed } from 'vue'; // Adicionado ref e computed
  import { useHistoricoStore } from '@/stores/historicoStore';
  import { gerarPdfComprovanteEnvio } from '@/utils/pdfGenerator';
  import HistoricoFiltros from './HistoricoFiltros.vue'; // Importar o componente de filtros
  import PaginationControls from '@/components/PaginationControls.vue';
  
  const historicoStore = useHistoricoStore();
  
  // Estado para armazenar os filtros atuais aplicados
  const currentFilters = ref({
    destino: '',
    dataInicio: '',
    dataFim: '',
  });

  const formatarDataParaBrasilia = (dataStringUTC) => {
  if (!dataStringUTC) return null; // Retorna nulo se a data for vazia
  try {
    const dataUTC = new Date(dataStringUTC + 'Z');
    if (isNaN(dataUTC.getTime())) {
      console.warn("Data inválida recebida:", dataStringUTC);
      return dataStringUTC;
    }
    return dataUTC.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    console.error("Erro ao formatar data:", dataStringUTC, e);
    return dataStringUTC;
  }
};

  // Propriedade computada para verificar se algum filtro está ativo
  const hasActiveFilters = computed(() => {
    return Object.values(currentFilters.value).some(value => !!value);
  });
  
  // Função para ser chamada quando os filtros são atualizados pelo componente HistoricoFiltros
  const aplicarFiltrosDaBusca = (novosFiltros) => {
    currentFilters.value = { ...novosFiltros }; // Atualiza os filtros locais
    historicoStore.fetchHistoricoEnviosSME(currentFilters.value); // Busca dados com os novos filtros
  };

  const fetchData = (page = 1) => {
    historicoStore.fetchHistoricoEnviosSME(currentFilters.value, page);
  };

  // Função goToPage (certifique-se que está exatamente assim)
const goToPage = (page) => { // 'page' aqui é o número da nova página
  console.log("HistoricoEnviosSME: goToPage chamada com a página:", page); // Adicione para depuração
  fetchData(page);
};

  const handleFiltrosAtualizados = (novosFiltros) => {
    currentFilters.value = { ...novosFiltros };
    fetchData(1); // Ao aplicar novos filtros, sempre volta para a página 1
  };

  // Função para o botão "Atualizar" e "Tentar Novamente"
  const refreshHistorico = () => {
    // Ao atualizar, usa os filtros que já estão aplicados (ou nenhum se não houver)
    historicoStore.fetchHistoricoEnviosSME(currentFilters.value);
  };

    const gerarPdfEnvio = (envio) => {
    gerarPdfComprovanteEnvio(envio);
  };
  
  onMounted(() => {
    // Na montagem inicial, busca sem filtros, a menos que queira persistir filtros de alguma forma
    if (historicoStore.historicoEnviosSME.length === 0 && !historicoStore.isLoading && !historicoStore.error) {
      historicoStore.fetchHistoricoEnviosSME(); // Busca inicial sem filtros
    }
  });

    // NOVO: Funções auxiliares para classes e ícones de status
const getStatusClass = (status) => {
      if (!status) return 'pendente';
      const s = status.toLowerCase();
      if (s.includes('totalmente confirmado')) return 'confirmado';
      if (s.includes('concluído')) return 'concluido'; // Nova classe para 'Concluído'
      if (s.includes('totalmente devolvido')) return 'devolvido';
      if (s.includes('parcialmente')) return 'parcial';
      return 'pendente';
  };

const getStatusIcon = (status) => {
      const s = status || '';
      if (s.includes('Totalmente Confirmado')) return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>`;
      // NOVO ÍCONE E CONDIÇÃO PARA 'Concluído'
      if (s.includes('Concluído')) return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-check-all" viewBox="0 0 16 16"><path d="M8.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L2.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093L8.95 4.992zm-.92 5.14.92.92a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 1 0-1.091-1.028L9.477 9.417l-.485-.486z"/></svg>`;
      if (s.includes('Totalmente Devolvido')) return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-x-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.647 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z"/></svg>`;
      // NOVO ÍCONE PARA 'Parcialmente'
      if (s.includes('Parcialmente')) return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-pie-chart-fill" viewBox="0 0 16 16"><path d="M15.985 8.5H8.207l-5.5 5.5a8 8 0 0 0 13.277-5.5zM2 13.292A8 8 0 0 1 7.5.015v7.778zM8.5.015V7.5h7.485A8 8 0 0 0 8.5.015"/></svg>`;
      // Ícone padrão para 'Pendente'
      return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-hourglass-split" viewBox="0 0 16 16"><path d="M2.5 15a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m2-13C3.5 1.5 3 2.5 3 3.5v1c0 1 .5 2 1.5 2.5V15a.5.5 0 0 1-1 0V9.333a2.5 2.5 0 0 1-.176-.273A2.5 2.5 0 0 1 3 8.5v-1c0-.355.08-.67.2-.937l.21-.468C3.607 5.776 4.234 5 5.5 5c.414 0 .786.126 1.076.316L8 6.632l1.424-1.316A1.5 1.5 0 0 1 10.5 5c1.266 0 1.893.776 2.09 1.125l.21.468c.12.267.2.582.2.937v1a2.5 2.5 0 0 1-.324.963q-.16.217-.176.273V15a.5.5 0 0 1-1 0V9.25A1.5 1.5 0 0 1 11.5 8c-1 0-1.5-1-1.5-2.5v-1C10 3.5 9.5 2.5 8.5 2M4 2h7v1.5a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 4 3.5z"/></svg>`;
  };

  const getStatusEmoji = (status) => {
      switch(status) {
          case 'confirmado': return '✅';
          case 'devolvido': return '↩️';
          case 'pendente': return '⏳';
          default: return '❔';
      }
  };

  </script>
  
  <style scoped>
  /* --- ESTILOS PARA A SEÇÃO DE HISTÓRICO --- */
  .historico-envios-section-content {
    /* Se precisar de algum estilo específico para o container do conteúdo */
  }
  
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
  }
  .section-header h2 { font-size: 1.25rem; margin: 0; }
  .loading-message, .error-message, .empty-list-message { text-align: center; padding: 2rem; }
  
  .btn-refresh-historico, .btn-try-again, .btn-gerar-pdf { 
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    display: inline-flex; 
    align-items: center;
    gap: 0.3rem;
    transition: background-color 0.2s ease;
  }
  .btn-refresh-historico:hover, .btn-try-again:hover, .btn-gerar-pdf:hover {
    background-color: #e5e5e5;
  }
  .btn-refresh-historico:disabled {
      opacity: 0.6;
      cursor: not-allowed;
  }
  .btn-refresh-historico svg, .btn-gerar-pdf svg {
    width: 14px; 
    height: 14px; 
  }
  .btn-try-again {
      margin-top: 0.5rem;
      background-color: #e6f7ff;
      border-color: #91d5ff;
      color: #096dd9;
  }
 .btn-gerar-pdf { 
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    display: inline-flex; 
    align-items: center;
    gap: 0.3rem;
    transition: background-color 0.2s ease;
  }
  .btn-gerar-pdf:hover {
    background-color: #e5e5e5;
  }
  .btn-gerar-pdf svg {
      fill: #096dd9;
  }
  
  
  .loading-message, .error-message, .empty-list-message {
    padding: 1rem;
    text-align: center;
    color: #4b5563;
  }
  .loading-message .spinner-border, .loading-overlay .spinner-border {
    margin-right: 0.5rem;
  }
  .error-message {
    color: #dc3545;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
  }
  
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
    border-radius: 6px;
    font-size: 0.9rem;
    color: #333;
  }
  
  
  .historico-list-container {
  /* REMOVA ou COMENTE estas linhas para permitir expansão vertical: */
  /* max-height: calc(100vh - 350px); */
  /* overflow-y: auto; */

  position: relative; /* Mantenha se o .loading-overlay depender disso */
  /* A lista agora vai tentar ocupar toda a altura necessária para seu conteúdo */
}
  
  .historico-list {
    list-style-type: none;
    padding: 0;
    margin: 0;
  }
  
.historico-item {
    background-color: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 1rem;
    padding: 0.75rem 1.25rem; /* Padding reduzido para mais compacidade */
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    transition: box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .historico-item:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  }

  .item-content {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

    /* --- COLUNA ESQUERDA: INFORMAÇÕES --- */
  .item-main-info {
    flex-grow: 1;
    min-width: 0; /* Ajuda o flexbox a lidar com texto longo */
  }

  .item-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .item-title svg {
    color: var(--primary-color, #3b82f6);
    flex-shrink: 0;
  }

  .meta-info {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.5rem;
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 0.75rem;
  }

    /* --- COLUNA DIREITA: STATUS E AÇÕES --- */
  .item-status-actions {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-end;
    flex-shrink: 0;
    min-width: 240px; /* Largura mínima para o status não quebrar */
  }

  .status-geral {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px; /* Formato de pílula */
    font-size: 0.8rem;
    font-weight: 500;
    white-space: nowrap;
  }
  
  /* ESTILOS ATUALIZADOS */
  .status-geral.confirmado { color: #15803d; background-color: #dcfce7; }
  .status-geral.concluido { color: #166534; background-color: #dcfce7; } /* Verde um pouco mais escuro para diferenciar de 'Totalmente Confirmado' */
  .status-geral.devolvido { color: #b91c1c; background-color: #fee2e2; }
  .status-geral.parcial { color: #b45309; background-color: #f8e9ad; } /* Cor amarela/laranja */
  .status-geral.pendente { color: #a16207; background-color: #f7f1b4; }
  
  .status-geral svg {
      width: 14px;
      height: 14px;
  }
  
  .historico-item-header {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.5rem;
    align-items: center;
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px dashed #e0e0e0;
    font-size: 0.85rem;
    color: #4b5563;
  }
  .historico-item-header span {
      display: flex;
      align-items: center;
      gap: 0.35rem;
  }
  .historico-item-header svg {
      opacity: 0.7;
      flex-shrink: 0;
  }

.flex-spacer {
  flex-grow: 1;
}
  
    .historico-item-body {
    display: flex;
    justify-content: flex-start;
    align-items: baseline;
    gap: 2rem;
    flex-wrap: wrap;
    }
  
  .historico-item-body .destino-escola {
    font-size: 0.95rem;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.2rem;

  }
  .historico-item-body .destino-escola strong {
      color: #1f2937;
  }
  .historico-item-body .destino-escola svg {
      fill: var(--primary-color, #3b82f6);
      flex-shrink: 0;
  }
  
 /* --- DETALHES DOS ITENS --- */
  .itens-enviados-details {
    margin-top: 0.5rem;
  }
  .itens-enviados-details summary {
    cursor: pointer;
    font-weight: 500;
    color: #4b5563;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.9rem;
  }
  .itens-enviados-details summary:hover {
    color: var(--primary-color, #3b82f6);
  }
  .itens-enviados-details summary svg {
      fill: currentColor;
  }
  
  .itens-list {
    list-style-type: none;
    margin-left: 0;
    padding-left: 1rem;
    font-size: 0.9rem;
    color: #4b5563;
    border-left: 2px solid #f0f0f0;
    margin-top: 0.5rem;
  }
  
  .error-message-itens, .empty-message-itens {
      font-size: 0.9rem;
      color: #6b7280;
      margin-left: 1rem;
      padding: 0.3rem 0.2rem;
  }

 .itens-list {
    list-style-type: none;
    padding: 0.5rem 0 0 0.75rem;
    margin: 0.5rem 0 0 0.5rem;
    border-left: 2px solid #f3f4f6;
    font-size: 0.9rem;
  }
  .item-produto {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem;
    border-radius: 4px;
  }
  .item-status-icon { font-size: 0.8rem; line-height: 1; flex-shrink: 0; }
  .item-info { flex-grow: 1; color: #374151; }
  .item-data-processamento { font-size: 0.8rem; color: #6b7280; font-style: italic; white-space: nowrap; }
  
  .item-produto.status-confirmado { background-color: #f0fdf4; }
  .item-produto.status-devolvido { background-color: #fef2f2; }
  .item-produto.status-pendente { background-color: #fffbeb; }

  .spinner-border {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    vertical-align: text-bottom;
    border: .2em solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spinner-border .75s linear infinite;
  }
  @keyframes spinner-border {
    to { transform: rotate(360deg); }
  }
  .spinner-border-sm {
    width: 0.8rem;
    height: 0.8rem;
    border-width: .15em;
  }
  /* Adicionar margem inferior ao componente de filtros se ele estiver usando a classe card */
  .filtros-historico.card { 
      margin-bottom: 1.5rem; /* Ajuste conforme necessário */
  }
  </style>