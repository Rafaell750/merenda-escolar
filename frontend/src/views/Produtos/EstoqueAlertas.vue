<!-- /frontend/src/views/Produtos/EstoqueAlertas.vue -->

<template>
    <div v-if="produtosComAlerta && produtosComAlerta.length > 0" class="stock-alerts-summary-container">
      <div class="stock-alerts-summary-header" @mouseover="showDetails = true" @mouseleave="showDetails = false" @focusin="showDetails = true" @focusout="handleFocusOut">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        </svg>
        <span>Atenção: {{ produtosComAlerta.length }} produto(s) com estoque baixo ou zerado! (Passe o mouse para mais detalhes)</span>
      </div>
      <Transition name="fade">
        <div v-if="showDetails" class="stock-alerts-summary-details" ref="detailsContainer">
          <ul>
            <li v-for="produto in produtosComAlerta" :key="`alert-${produto.id}`" :class="getAlertItemClass(produto)">
              <strong>{{ produto.nome }}:</strong> <span class="alert-message">{{ getAlertMessage(produto) }}</span>
            </li>
          </ul>
        </div>
      </Transition>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const props = defineProps({
    produtosComAlerta: {
      type: Array,
      required: true,
      default: () => []
    }
  });
  
  const showDetails = ref(false);
  const detailsContainer = ref(null); // Para o focusout
  
  const getAlertItemClass = (produto) => {
    if (produto.quantidade === 0) {
      return 'alert-item-zero';
    }
    const referencia = produto.quantidade_referencia_alerta;
    if (referencia && referencia > 0 && produto.quantidade > 0 && produto.quantidade <= referencia / 2) {
      return 'alert-item-half';
    }
    return '';
  };
  
  const getAlertMessage = (produto) => {
    if (produto.quantidade === 0) {
      return 'Estoque zerado!';
    }
    const referencia = produto.quantidade_referencia_alerta;
    if (referencia && referencia > 0 && produto.quantidade <= referencia / 2) {
      const currentQty = Number(produto.quantidade);
      const refQty = Number(referencia);
      // Verifica se os valores são números válidos e se refQty não é zero para evitar divisão por zero
      if (isNaN(currentQty) || isNaN(refQty) || refQty === 0) {
          return `Estoque baixo (Atual: ${produto.quantidade || 0})`;
      }
      return `Estoque em ${((currentQty / refQty) * 100).toFixed(0)}% ou menos (Atual: ${currentQty} / Ref: ${refQty}).`;
    }
    return ''; // Não deve ser atingido se a prop estiver correta
  };
  
  // Para acessibilidade: manter aberto se o foco estiver dentro dos detalhes
  const handleFocusOut = (event) => {
    // Se o foco saiu para um elemento fora do container de detalhes, fecha.
    // O setTimeout é para dar tempo do novo elemento focado ser registrado.
    setTimeout(() => {
      if (detailsContainer.value && !detailsContainer.value.contains(document.activeElement)) {
        showDetails.value = false;
      }
    }, 0);
  };
  
  </script>
  
  <style scoped>
  .stock-alerts-summary-container {
      margin-top: 0.3rem;
      padding: 0.75rem 1rem;
      border: 1px solid #ffc107; /* Amarelo/Laranja para aviso */
      border-radius: 4px;
      background-color: #fff3cd; /* Fundo amarelo bem claro */
  }
  
  .stock-alerts-summary-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: bold;
      color: #856404; /* Texto escuro para contraste com fundo amarelo */
      cursor: default; /* Ou pointer, se quiser que pareça clicável */
      outline: none; /* Remove outline padrão do focus, se houver */
  }
  .stock-alerts-summary-header:focus-visible { /* Estilo de foco para acessibilidade */
      box-shadow: 0 0 0 2px rgba(255, 165, 0, 0.5);
  }
  
  .stock-alerts-summary-header svg {
      color: #ffa500; /* Laranja */
      flex-shrink: 0; /* Impede que o SVG encolha */
  }
  
  .stock-alerts-summary-details {
      margin-top: 0.5rem;
      padding-left: 0;
      font-size: 0.9em;
      max-height: 200px; /* Limita altura, caso muitos itens */
      overflow-y: auto; /* Adiciona scroll se necessário */
  }
  .stock-alerts-summary-details ul {
      list-style-type: none;
      padding-left: 0;
      margin-bottom: 0;
  }
  .stock-alerts-summary-details li {
      padding: 0.25rem 0.5rem;
      border-bottom: 1px dashed #ffeeba;
      /* display: flex; /* Comentado para melhor quebra de linha da mensagem */
      /* gap: 0.5rem; */
  }
  .stock-alerts-summary-details li:last-child {
      border-bottom: none;
  }
  .stock-alerts-summary-details li strong {
      /* flex-shrink: 0; /* Comentado */
      margin-right: 0.3em; /* Adiciona um pequeno espaço após o nome */
  }
  .stock-alerts-summary-details li .alert-message {
      /* Permite quebra de linha */
      display: inline;
  }
  
  .stock-alerts-summary-details li.alert-item-half .alert-message { /* Estilo na mensagem, não no li inteiro */
      color: #d97706; /* Laranja escuro */
  }
  .stock-alerts-summary-details li.alert-item-zero .alert-message {
      color: #b91c1c; /* Vermelho escuro */
      font-weight: 500;
  }

  .product-list-card > .stock-alerts-summary-container { /* Seletor para o componente EstoqueAlertas quando filho direto */
    margin-bottom: 0.5rem; /* Adiciona espaço ABAIXO dos alertas, antes da próxima coisa (mensagens de estado ou tabela) */
    /* A margem superior do .stock-alerts-summary-container já foi ajustada em EstoqueAlertas.vue */
}
  
  
  /* Animação para o sumário */
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
    transform-origin: top;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
    transform: scaleY(0.95) translateY(-10px);
  }
  </style>