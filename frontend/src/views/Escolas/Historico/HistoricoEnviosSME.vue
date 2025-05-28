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
        Erro ao carregar histórico: {{ historicoStore.error }}
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
          <li v-for="envio in historicoStore.historicoEnviosSME" :key="envio.transferencia_id" class="historico-item">
            <div class="historico-item-header">
              <span class="data-envio">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-calendar-check" viewBox="0 0 16 16">
                  <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0"/>
                  <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
                </svg>
                Enviado em: {{ envio.data_envio_formatada }}
              </span>
              <span class="usuario-sme">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-person-fill" viewBox="0 0 16 16">
                      <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
                  </svg>
                  Enviado Por: {{ envio.usuario_sme_nome }}
              </span>
              <span :class="['status-recebimento', envio.data_recebimento_confirmado_formatada ? 'confirmado' : 'pendente']">
                <template v-if="envio.data_recebimento_confirmado_formatada && envio.nome_usuario_confirmacao">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                    </svg>
                    {{ `Recebido e confirmado por: ${envio.nome_usuario_confirmacao ? envio.nome_usuario_confirmacao.trim() : 'Usuário Desconhecido'}, em ${envio.data_recebimento_confirmado_formatada}` }}
                </template>
                <template v-else-if="envio.data_recebimento_confirmado_formatada"> <!-- Fallback -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                    </svg>
                    Recebido em: {{ envio.data_recebimento_confirmado_formatada }}
                </template>
                <template v-else>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-hourglass-split" viewBox="0 0 16 16">
                        <path d="M2.5 15a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m2-13C3.5 1.5 3 2.5 3 3.5v1c0 1 .5 2 1.5 2.5V15a.5.5 0 0 1-1 0V9.333a2.5 2.5 0 0 1-.176-.273A2.5 2.5 0 0 1 3 8.5v-1c0-.355.08-.67.2-.937l.21-.468C3.607 5.776 4.234 5 5.5 5c.414 0 .786.126 1.076.316L8 6.632l1.424-1.316A1.5 1.5 0 0 1 10.5 5c1.266 0 1.893.776 2.09 1.125l.21.468c.12.267.2.582.2.937v1a2.5 2.5 0 0 1-.324.963q-.16.217-.176.273V15a.5.5 0 0 1-1 0V9.25A1.5 1.5 0 0 1 11.5 8c-1 0-1.5-1-1.5-2.5v-1C10 3.5 9.5 2.5 8.5 2M4 2h7v1.5a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 4 3.5z"/>
                    </svg>
                    Pendente de Recebimento
                </template>
            </span>
            <div class="flex-spacer"></div>
             <div class="historico-item-actions">
              <button @click="gerarPdfEnvio(envio)" class="btn-gerar-pdf" title="Gerar PDF do Envio">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-pdf-fill" viewBox="0 0 16 16">
                  <path d="M5.523 12.424q.21-.124.459-.238a8 8 0 0 1-.45.606c-.28.337-.498.516-.635.572a.26.26 0 0 1-.035.012.28.28 0 0 1-.026-.044c-.056-.11-.054-.216.04-.36.106-.165.417-.516.848-.93.092-.086.173-.17.25-.25a1.12 1.12 0 0 0 .199-.51.5.5 0 0 1 .5-.5c.19 0 .355.067.46.215.105.148.116.34.08.556-.037.215-.138.463-.29.656a1 1 0 0 0-.015.019l-.001.002-.002.001-.004.002a.3.3 0 0 1-.007.003l-.001.002-.001.001a.25.25 0 0 1-.023.006c-.038.013-.09.02-.15.022-.077.007-.17.01-.285.011l-.007.001-.001.002-.002.001-.001.001c-.114.003-.237.005-.37.006a.25.25 0 0 0-.216.049.2.2 0 0 0-.06.116.2.2 0 0 0 .037.107.18.18 0 0 0 .082.078.7.7 0 0 0 .201.083q.19.054.37.082c.24.038.45.054.59.054a.56.56 0 0 0 .42-.145c.125-.12.187-.293.187-.522v-.02c0-.153-.035-.305-.104-.454a1.2 1.2 0 0 0-.1-.177.5.5 0 0 0-.051-.05q-.05-.042-.118-.087a2 2 0 0 0-.18-.102q-.06-.047-.124-.09zm1.337-4.902c-.142-.06-.283-.116-.422-.168a.5.5 0 0 1-.035-.01.5.5 0 0 1-.001-.231c.002-.107.02-.207.055-.29.036-.086.085-.16.146-.22L7.05 6.05l-.002-.001-.002-.002A.5.5 0 0 1 7.04 6c.095-.096.22-.14.372-.14a.56.56 0 0 1 .497.158c.133.136.198.325.198.566v.015c0 .132-.03.254-.092.368a1.3 1.3 0 0 0-.118.22v.001l-.001.002-.002.002-.001.001a.5.5 0 0 1-.023.005l-.001.002-.001.001a.25.25 0 0 1-.023.006c-.038.013-.09.02-.15.022-.077.007-.17.01-.285.011l-.007.001-.001.002-.002.001-.001.001c-.114.003-.237.005-.37.006-.208.008-.367.045-.47.102a.6.6 0 0 0-.074.057zm.954-3.201H5.57c-.22 0-.399.046-.523.135a.8.8 0 0 0-.342.367c-.066.124-.1.27-.1.439v.015c0 .155.029.302.089.432.061.13.152.238.272.318a.9.9 0 0 0 .488.135h.116q.096 0 .19-.007c.088-.007.175-.022.26-.045l.002-.001.001-.002.001-.001a.25.25 0 0 1 .023-.006A.3.3 0 0 1 6.7 7.6l.001-.002.002-.001.001-.001.007-.003c.04-.017.08-.036.117-.058q.04-.026.07-.057a.38.38 0 0 0 .058-.083.38.38 0 0 0 .025-.117.25.25 0 0 0-.049-.173.3.3 0 0 0-.091-.11.3.3 0 0 0-.112-.078q-.06-.032-.126-.05c-.092-.026-.206-.045-.342-.054a.5.5 0 0 0-.107-.01H5.57c-.116.005-.21.023-.28.053a.3.3 0 0 1-.135.041H5.15c-.056 0-.105-.012-.145-.035a.2.2 0 0 1-.08-.063.2.2 0 0 1-.032-.098.2.2 0 0 1 .004-.099c.01-.026.026-.05.048-.072.022-.022.05-.04.084-.054.046-.017.11-.026.19-.026h2.383c.133 0 .248.006.348.017q.107.017.195.044c.068.02.125.043.168.068.043.025.078.053.105.085.027.032.047.065.06.098a.3.3 0 0 1 .012.102.3.3 0 0 1-.049.18c-.042.06-.102.103-.178.128q-.08.026-.19.026c-.09-.002-.18-.002-.27-.002Z"/>
                  <path d="M.5 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5M10 3H6a1 1 0 0 0-1 1v1.5H4a1 1 0 0 0-1 1v1H2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1.5V5.5h-1V4a1 1 0 0 0-1-1Z"/>
                </svg>
                Gerar PDF
              </button>
            </div>
            </div>
            <div class="historico-item-body">
              <p class="destino-escola">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-building-fill-up" viewBox="0 0 16 16">
                  <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m.354-5.854 1.5 1.5a.5.5 0 0 1-.708.708L13 11.707V14.5a.5.5 0 0 1-1 0v-2.793l-.646.647a.5.5 0 0 1-.708-.708z"/>
                  <path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7.256A4.5 4.5 0 0 0 12.5 8a4.5 4.5 0 0 0-3.59 1.787A.5.5 0 0 0 9 9.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .39-.187A4.5 4.5 0 0 0 8.027 12H6.5a.5.5 0 0 0 0 1H8v1.5a.5.5 0 0 0 1 0V14h.5a.5.5 0 0 0 0-1h-.55a4.5 4.5 0 0 0-.308-.885L9 11.115l.087.06A4.5 4.5 0 0 0 9.5 13a4.5 4.5 0 0 0 .308-.886c.254-.63.64-1.202 1.082-1.676V1zM.5 11.5a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 0-1h-2a.5.5 0 0 0-.5.5m0-2a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 0-1h-5a.5.5 0 0 0-.5.5m0-2a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 0-1h-7a.5.5 0 0 0-.5.5m0-2a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 0-1h-7a.5.5 0 0 0-.5.5"/>
                </svg>
                Destino: <strong>{{ envio.nome_escola }}</strong>
              </p>
              <details class="itens-enviados-details">
                <summary>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-box-seam-fill" viewBox="0 0 16 16">
                      <path fill-rule="evenodd" d="M15.528 2.973a.75.75 0 0 1 .472.696v8.662a.75.75 0 0 1-.472.696l-7.25 2.9a.75.75 0 0 1-.557 0l-7.25-2.9A.75.75 0 0 1 0 12.331V3.669a.75.75 0 0 1 .471-.696L7.723.023a.75.75 0 0 1 .554 0zM10.404 2 4.25 4.461 1.846 3.5 1 3.839v.4l6.5 2.6v7.922l.5.2.5-.2V6.84l6.5-2.6v-.4l-.846-.339L10.404 2z"/>
                  </svg>
                  Itens Enviados ({{ envio.itens ? envio.itens.length : 0 }}) <!-- Adicionado checagem para envio.itens -->
                </summary>
                <ul v-if="envio.itens && envio.itens.length > 0" class="itens-list">
                  <li v-for="item in envio.itens" :key="item.produto_id" class="item-produto">
                    {{ item.nome_produto }} ({{ item.unidade_medida }}) - Quantidade: {{ item.quantidade_enviada }}
                  </li>
                </ul>
                 <p v-else-if="envio.error_itens" class="error-message-itens">{{ envio.error_itens }}</p>
                 <p v-else class="empty-message-itens">Nenhum item detalhado para este envio.</p>
              </details>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </template>
  
  <script setup>
  import { onMounted, ref, computed } from 'vue'; // Adicionado ref e computed
  import { useHistoricoStore } from '@/stores/historicoStore';
  import { gerarPdfComprovanteEnvio } from '@/utils/pdfGenerator';
  import HistoricoFiltros from './HistoricoFiltros.vue'; // Importar o componente de filtros
  
  const historicoStore = useHistoricoStore();
  
  // Estado para armazenar os filtros atuais aplicados
  const currentFilters = ref({
    destino: '',
    dataInicio: '',
    dataFim: '',
  });

  // Propriedade computada para verificar se algum filtro está ativo
  const hasActiveFilters = computed(() => {
    return Object.values(currentFilters.value).some(value => !!value);
  });
  
  // Função para ser chamada quando os filtros são atualizados pelo componente HistoricoFiltros
  const aplicarFiltrosDaBusca = (novosFiltros) => {
    currentFilters.value = { ...novosFiltros }; // Atualiza os filtros locais
    historicoStore.fetchHistoricoEnviosSME(currentFilters.value); // Busca dados com os novos filtros
  };

  // Função para o botão "Atualizar" e "Tentar Novamente"
  const refreshHistorico = () => {
    // Ao atualizar, usa os filtros que já estão aplicados (ou nenhum se não houver)
    historicoStore.fetchHistoricoEnviosSME(currentFilters.value);
  };
  
  onMounted(() => {
    // Na montagem inicial, busca sem filtros, a menos que queira persistir filtros de alguma forma
    if (historicoStore.historicoEnviosSME.length === 0 && !historicoStore.isLoading && !historicoStore.error) {
      historicoStore.fetchHistoricoEnviosSME(); // Busca inicial sem filtros
    }
  });

  const gerarPdfEnvio = (envio) => {
    gerarPdfComprovanteEnvio(envio);
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
    padding-bottom: 0.75rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  .section-header h2 {
    font-size: 1.4rem;
    color: #1f2937;
    margin: 0;
  }
  
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
    background-color: #e6f7ff;
    border-color: #91d5ff;
    color: #096dd9;
  }
  .btn-gerar-pdf:hover {
      background-color: #bae7ff;
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
    /* Ajuste esta altura conforme necessário. 
       Subtraia a altura do header, do componente de filtro, etc. */
    max-height: calc(100vh - 350px); /* Exemplo, ajuste este valor! */
    overflow-y: auto;
    position: relative;
  }
  
  .historico-list {
    list-style-type: none;
    padding: 0;
    margin: 0;
  }
  
  .historico-item {
    background-color: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    margin-bottom: 1rem;
    padding: 1rem 1.25rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.03);
    transition: box-shadow 0.2s ease;
  }
  .historico-item:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.05);
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
  
  .status-recebimento {
      font-weight: 500;
  }
  .status-recebimento.confirmado {
      color: #16a34a;
  }
  .status-recebimento.pendente {
      color: #d97706;
  }
  .status-recebimento.confirmado svg { fill: #16a34a; opacity: 1;}
  .status-recebimento.pendente svg { fill: #d97706; opacity: 1;}
  
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
  
  .itens-enviados-details {
    flex-shrink: 0;
  }
  
  .itens-enviados-details summary {
    cursor: pointer;
    font-weight: 500;
    color: var(--primary-color, #3b82f6);
    margin-bottom: 0.5rem;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding-top: 0;
  }
  .itens-enviados-details summary:hover {
    text-decoration: underline;
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
  
  .itens-list .item-produto {
    margin-bottom: 0.3rem;
    padding: 0.3rem 0.2rem;
  }
  
  .error-message-itens, .empty-message-itens {
      font-size: 0.9rem;
      color: #6b7280;
      margin-left: 1rem;
      padding: 0.3rem 0.2rem;
  }
  
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