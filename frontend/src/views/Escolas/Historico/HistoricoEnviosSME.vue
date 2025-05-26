<!-- /frontend/src/viws/Historico/HistoricoEnviosSME.vue -->
<template>
    <div class="historico-envios-section-content">
      <div class="section-header">
        <h2>Histórico de Envios para Escolas</h2>
        <button @click="historicoStore.fetchHistoricoEnviosSME()" :disabled="historicoStore.isLoading" class="btn-refresh-historico" title="Atualizar Histórico">
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
         <button @click="historicoStore.fetchHistoricoEnviosSME()" class="btn-try-again">Tentar Novamente</button>
      </div>
      <div v-else-if="!historicoStore.isLoading && historicoStore.historicoEnviosSME.length === 0 && !historicoStore.error" class="empty-list-message">
        Nenhum envio registrado no histórico ainda.
      </div>
      <div v-else class="historico-list-container">
        <div v-if="historicoStore.isLoading" class="loading-overlay"> <!-- Para loading de refresh -->
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
                  <svg v-if="envio.data_recebimento_confirmado_formatada" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-hourglass-split" viewBox="0 0 16 16">
                      <path d="M2.5 15a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m2-13C3.5 1.5 3 2.5 3 3.5v1c0 1 .5 2 1.5 2.5V15a.5.5 0 0 1-1 0V9.333a2.5 2.5 0 0 1-.176-.273A2.5 2.5 0 0 1 3 8.5v-1c0-.355.08-.67.2-.937l.21-.468C3.607 5.776 4.234 5 5.5 5c.414 0 .786.126 1.076.316L8 6.632l1.424-1.316A1.5 1.5 0 0 1 10.5 5c1.266 0 1.893.776 2.09 1.125l.21.468c.12.267.2.582.2.937v1a2.5 2.5 0 0 1-.324.963q-.16.217-.176.273V15a.5.5 0 0 1-1 0V9.25A1.5 1.5 0 0 1 11.5 8c-1 0-1.5-1-1.5-2.5v-1C10 3.5 9.5 2.5 8.5 2M4 2h7v1.5a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 4 3.5z"/>
                  </svg>
                  {{ envio.data_recebimento_confirmado_formatada ? 'Recebido em: ' + envio.data_recebimento_confirmado_formatada : 'Pendente de Recebimento' }}
              </span>
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
                  Itens Enviados ({{ envio.itens.length }})
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
  import { onMounted } from 'vue';
  import { useHistoricoStore } from '@/stores/historicoStore';
  
  const historicoStore = useHistoricoStore();
  
  // O componente pai (PainelControleView) será responsável por chamar o fetch
  // na primeira vez que a aba for ativada. Este onMounted é mais um fallback
  // ou para quando o componente for usado de forma isolada.
  // No entanto, para evitar chamadas duplas, a store já tem um `if (this.isLoading) return;`
  onMounted(() => {
    if (historicoStore.historicoEnviosSME.length === 0 && !historicoStore.isLoading && !historicoStore.error) {
      historicoStore.fetchHistoricoEnviosSME();
    }
  });
  </script>
  
  <style scoped>
  /* --- ESTILOS PARA A SEÇÃO DE HISTÓRICO --- */
  .historico-envios-section-content {
    /* Se precisar de algum estilo específico para o container do conteúdo */
    /* O 'card' já está no elemento pai <div v-if="activeSection === 'historico'" class="content-section card ..."> */
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
  .btn-refresh-historico, .btn-try-again {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    display: inline-flex; /* Mudado para inline-flex */
    align-items: center;
    gap: 0.3rem;
    transition: background-color 0.2s ease;
  }
  .btn-refresh-historico:hover, .btn-try-again:hover {
    background-color: #e5e5e5;
  }
  .btn-refresh-historico:disabled {
      opacity: 0.6;
      cursor: not-allowed;
  }
  .btn-refresh-historico svg {
    width: 14px; /* Ajustado para consistência */
    height: 14px; /* Ajustado para consistência */
  }
  .btn-try-again {
      margin-top: 0.5rem;
      background-color: #e6f7ff;
      border-color: #91d5ff;
      color: #096dd9;
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
    color: #dc3545; /* Vermelho para erros */
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
    border-radius: 6px; /* Para cobrir o card */
    font-size: 0.9rem;
    color: #333;
  }
  
  
  .historico-list-container {
    max-height: calc(100vh - 280px); /* Ajuste esta altura conforme necessário. 280px é um chute para header, navs, etc. */
    overflow-y: auto;
    position: relative; /* Para o loading-overlay */
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
      flex-shrink: 0; /* Evita que ícones sejam esmagados */
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
  justify-content: flex-start; /* ALTERADO: Alinha os itens à esquerda */
  align-items: baseline; /* ALTERADO: Tenta alinhar pela linha de base do texto */
  gap: 2rem; /* AUMENTADO: Espaçamento entre "Destino" e "Itens Enviados", ajuste conforme preferir */
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

  flex-shrink: 0; /* Impede que o details encolha demais */
  /* Você pode adicionar um min-width aqui também se quiser um controle mais fino */
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
      fill: currentColor; /* Herda a cor do texto da summary */
  }
  
  .itens-list {
    list-style-type: none; /* Removido o 'disc' para um visual mais limpo com detalhes */
    margin-left: 0; /* Ajustado */
    padding-left: 1rem; /* Leve indentação */
    font-size: 0.9rem;
    color: #4b5563;
    border-left: 2px solid #f0f0f0; /* Linha à esquerda para os itens */
    margin-top: 0.5rem;
  }
  
  .itens-list .item-produto {
    margin-bottom: 0.3rem;
    padding: 0.3rem 0.2rem;
  }
  
  .error-message-itens, .empty-message-itens {
      font-size: 0.9rem;
      color: #6b7280;
      margin-left: 1rem; /* Ajustado */
      padding: 0.3rem 0.2rem;
  }
  
  /* Adicionar estilos para spinner-border se não estiverem globais */
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
  </style>