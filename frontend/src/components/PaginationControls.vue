<!-- frontend/src/components/PaginationControls.vue -->
<!-- Arquivo para colocar o numero de paginas no Historico de envio/Gerar PDFs-->

<template>
    <!-- O nav é o elemento raiz do componente -->
    <nav v-if="totalPages > 1" 
         aria-label="Page navigation example" 
         class="pagination-nav-container"> 
      <ul class="pagination"> 
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)" aria-label="Previous">
            <span aria-hidden="true">«</span>
          </a>
        </li>
  
        <li v-for="page in pagesToShow" :key="page.number + '-' + page.display" class="page-item" :class="{ active: page.active, disabled: page.disabled }">
          <a v-if="!page.disabled" class="page-link" href="#" @click.prevent="changePage(page.number)">{{ page.display }}</a>
          <span v-else class="page-link">{{ page.display }}</span>
        </li>
  
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)" aria-label="Next">
            <span aria-hidden="true">»</span>
          </a>
        </li>
      </ul>
    </nav>
</template>
  
  <script setup>
  import { computed } from 'vue';
  
  const props = defineProps({
    currentPage: {
      type: Number,
      required: true
    },
    totalPages: {
      type: Number,
      required: true
    },
    maxVisibleButtons: { // Quantos botões de página mostrar ao redor da atual
       type: Number,
       default: 3 // Ex: Prev 1 2 [3] 4 5 ... 10 Next
    }
  });
  
  const emit = defineEmits(['page-changed']);
  
  const changePage = (page) => {
    if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
      emit('page-changed', page);
    }
  };
  
  // Lógica para "1, 2, ..., ultima pagina"
  const pagesToShow = computed(() => {
    const pages = [];
    const total = props.totalPages;
    const current = props.currentPage;
    const maxVisible = props.maxVisibleButtons; // Quantidade de botões numéricos que queremos visíveis, além de "1" e "total" e "..."

    if (total <= 1) return [{ number: 1, display: '1', active: true, disabled: false }];

    // Adiciona a primeira página
    pages.push({ number: 1, display: '1', active: current === 1, disabled: false });

    // Se o número total de páginas é pequeno o suficiente para mostrar todos os botões
    // (1 + maxVisible + 1 + reticencias + ultima pagina)
    // Ex: 1 + 3 (maxVisible) + 1 (ultima) = 5. Se incluirmos espaço para 2 reticências, seria 1 + 1 + 3 + 1 + 1 = 7
    // Se total <= maxVisible + 2 (primeira, ultima, e o bloco visível), não precisa de reticências
    if (total <= maxVisible + 2) { // Para maxVisible=3, total <= 5 -> 1,2,3,4,5
        for (let i = 2; i < total; i++) {
            pages.push({ number: i, display: i.toString(), active: current === i, disabled: false });
        }
    } else {
        // Lógica para quando precisamos de reticências
        let leftEllipsis = false;
        let rightEllipsis = false;

        // Páginas a mostrar ao redor da atual
        const adjacentCount = Math.floor((maxVisible - 1) / 2); // Para maxVisible=3, adjacentCount=1. Mostra [c-1, c, c+1]

        let startRange = current - adjacentCount;
        let endRange = current + adjacentCount;

        // Ajustar o range para não ficar menor que 2 ou maior que total-1
        // e para tentar mostrar 'maxVisible' botões
        if (startRange <= 2) { // Se o range inicial está muito perto do início
            startRange = 2;
            endRange = Math.min(total - 1, startRange + maxVisible -1);
        } else {
            leftEllipsis = true;
        }

        if (endRange >= total - 1) { // Se o range final está muito perto do fim
            endRange = total - 1;
            startRange = Math.max(2, endRange - maxVisible + 1);
             if(startRange > 2) leftEllipsis = true; // Reavalia leftEllipsis
             else leftEllipsis = false;

        } else {
             rightEllipsis = true;
        }
        
        // Se depois dos ajustes, o startRange ainda for > 2, precisamos da reticência esquerda.
        if (startRange > 2) { // Esta condição é mais direta para a reticência esquerda
             leftEllipsis = true;
        } else { // Se startRange é 2, não precisamos da reticência esquerda (já temos o '1')
             leftEllipsis = false;
        }


        if (leftEllipsis) {
            pages.push({ display: '...', disabled: true });
        }

        for (let i = startRange; i <= endRange; i++) {
             if (i > 1 && i < total) { // Só adiciona se não for a primeira nem a última
                pages.push({ number: i, display: i.toString(), active: current === i, disabled: false });
             }
        }

        // Se depois dos ajustes, o endRange ainda for < total - 1, precisamos da reticência direita.
        if (endRange < total - 1) { // Esta condição é mais direta para a reticência direita
             rightEllipsis = true;
        } else { // Se endRange é total-1, não precisamos da reticência direita (já teremos 'total')
             rightEllipsis = false;
        }


        if (rightEllipsis) {
            pages.push({ display: '...', disabled: true });
        }
    }

    // Adiciona a última página (se não for a primeira)
    if (total > 1) {
        pages.push({ number: total, display: total.toString(), active: current === total, disabled: false });
    }
    
    // Lógica de limpeza de duplicatas e reticências adjacentes (simplificada)
    const finalPages = [];
    let lastPage = null;
    for (const page of pages) {
        if (page.disabled) { // É '...'
            if (!lastPage || !lastPage.disabled) { // Só adiciona se a anterior não for '...'
                finalPages.push(page);
            }
        } else { // É um número
             if (!lastPage || lastPage.number !== page.number) { // Só adiciona se não for duplicata
                finalPages.push(page);
             }
        }
        lastPage = page;
    }
    // Se a primeira reticência está logo após '1' e o próximo número é '2', remove a reticência.
    if (finalPages.length > 2 && finalPages[0].number === 1 && finalPages[1].disabled && finalPages[2].number === 2) {
        finalPages.splice(1, 1);
    }
    // Se a última reticência está logo antes de 'total' e o número anterior é 'total-1', remove a reticência.
    if (finalPages.length > 2) {
        const l = finalPages.length;
        if (finalPages[l-1].number === total && finalPages[l-2].disabled && finalPages[l-3].number === total - 1) {
             finalPages.splice(l-2, 1);
        }
    }


    return finalPages;
});
  
  </script>
  
  <style scoped>
  .pagination-nav-container {
    display: flex; /* Faz o <nav> ser um container flex */
    justify-content: center; /* Centraliza seu filho direto (a ul.pagination) */
    width: 100%; /* Garante que o nav tente ocupar a largura disponível */
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    /* Para centralizar o próprio <nav> se ele não ocupar 100% do pai: */
    /* Se o pai não for flex, e este <nav> não ocupar 100% da largura,
       as margens auto não funcionarão bem com display:flex.
       A centralização do <nav> em si é melhor controlada pelo pai.
       Mas garantimos que o conteúdo DENTRO do <nav> (a ul.pagination) esteja centralizado.
    */
  }
  
  .pagination {
    /* Bootstrap já aplica display: flex. Não precisa redefinir aqui.
       A centralização da ul.pagination é feita pelo seu pai .pagination-nav-container. */
    padding-left: 0;
    list-style: none;
    /* Se você quiser ter certeza que a ul não se expanda desnecessariamente: */
    display: inline-flex; /* Faz a <ul> ter a largura do seu conteúdo */
    /* margin: 0 auto;  ISSO SÓ FUNCIONA SE O PAI NÃO FOR FLEX E O ITEM FOR BLOCK */
  }
  
  .page-item {
    /* Estilos de Bootstrap devem ser suficientes */
  }
  
  .page-item.disabled .page-link {
    color: #6c757d;
    pointer-events: none;
    background-color: #fff;
    border-color: #dee2e6;
  }
  
  .page-item.active .page-link {
    z-index: 3;
    color: #fff;
    background-color: #0d6efd;
    border-color: #0d6efd;
  }
  
  .page-link {
    cursor: pointer;
    position: relative;
    display: block;
    padding: 0.375rem 0.75rem;
    margin-left: -1px; /* Junta as bordas */
    line-height: 1.25;
    color: #0d6efd;
    background-color: #fff;
    border: 1px solid #dee2e6;
    text-decoration: none; /* Adicionado para garantir */
  }
  
  .page-link:hover {
    z-index: 2;
    color: #0a58ca;
    background-color: #e9ecef;
    border-color: #dee2e6;
  }
  
  .page-item:first-child .page-link {
    margin-left: 0;
    border-top-left-radius: 0.25rem;
    border-bottom-left-radius: 0.25rem;
  }
  
  .page-item:last-child .page-link {
    border-top-right-radius: 0.25rem;
    border-bottom-right-radius: 0.25rem;
  }
  </style>