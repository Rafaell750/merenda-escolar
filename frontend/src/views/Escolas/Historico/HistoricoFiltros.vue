<template>
    <div class="filtros-historico card">
      <div class="card-body">
        <h5 class="card-title mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-funnel-fill me-2" viewBox="0 0 16 16" style="margin-bottom: 3px;">
            <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.777.416L6 11.796V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5z"/>
          </svg>
          Filtrar Histórico de Envios
        </h5>
        <form @submit.prevent="aplicarFiltros" class="form-inline-custom align-items-end">
          <!-- Grupo de Filtro: Destino -->
          <div class="filter-group">
            <label for="filtroDestino" class="form-label">Destino (Escola):</label>
            <input
              type="text"
              id="filtroDestino"
              class="form-control form-control-sm"
              v-model="filtros.destino"
              placeholder="Nome da escola"
              style="min-width: 200px;"
            />
          </div>
  
          <!-- Grupo de Filtro: Data Início -->
          <div class="filter-group">
            <label for="filtroDataInicio" class="form-label">Data Início:</label>
            <input
              type="date"
              id="filtroDataInicio"
              class="form-control form-control-sm"
              v-model="filtros.dataInicio"
              style="min-width: 150px;"
            />
          </div>
  
          <!-- Grupo de Filtro: Data Fim -->
          <div class="filter-group">
            <label for="filtroDataFim" class="form-label">Data Fim:</label>
            <input
              type="date"
              id="filtroDataFim"
              class="form-control form-control-sm"
              v-model="filtros.dataFim"
              style="min-width: 150px;"
            />
          </div>
  
          <!-- Grupo de Botões -->
          <div class="filter-group ms-auto">
            <div class="d-flex gap-2"> 
              <button type="submit" class="btn btn-primary btn-sm" title="Aplicar Filtros">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-filter" viewBox="0 0 16 16">
                  <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/>
                </svg>
                Aplicar
              </button>
              <button type="button" @click="limparFiltros" class="btn btn-outline-secondary btn-sm" title="Limpar Filtros">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eraser" viewBox="0 0 16 16">
                  <path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828zm2.121.707a1 1 0 0 0-1.414 0L4.16 7.547l5.293 5.293 4.633-4.633a1 1 0 0 0 0-1.414zM8.746 13.547 3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293z"/>
                </svg>
                Limpar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </template>
  
  <script setup>
  // Seu script setup continua igual
  import { ref } from 'vue';
  
  const emit = defineEmits(['filtros-atualizados']);
  
  const filtros = ref({
    destino: '',
    dataInicio: '',
    dataFim: '',
  });
  
  const aplicarFiltros = () => {
    const filtrosParaEmitir = { ...filtros.value };
    if (filtrosParaEmitir.dataInicio && filtrosParaEmitir.dataFim && filtrosParaEmitir.dataInicio > filtrosParaEmitir.dataFim) {
      alert('A data de início não pode ser posterior à data de fim.');
      return; 
    }
    emit('filtros-atualizados', filtrosParaEmitir);
  };
  
  const limparFiltros = () => {
    filtros.value.destino = '';
    filtros.value.dataInicio = '';
    filtros.value.dataFim = '';
    emit('filtros-atualizados', { ...filtros.value });
  };
  </script>
  
  <style scoped>
  .filtros-historico.card {
    background-color: #ffffff;
    border: 1px solid #e0e3e7;
    border-radius: 0.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    margin-bottom: 1.5rem;
  }
  
  .card-body {
    padding: 1.25rem;
  }
  
  .card-title {
    font-size: 1.1rem;
    color: #2c3e50;
    font-weight: 600;
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.6rem;
    border-bottom: 1px solid #eaeff2;
  }
  
  .card-title svg {
    margin-right: 0.6rem;
    color: #3a7bd5;
  }
  
  .form-inline-custom {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem; /* Espaçamento entre os grupos de filtro principais */
    align-items: flex-end;
  }
  
  .filter-group {
    display: flex;
    align-items: center;
    flex-grow: 0;
    flex-shrink: 0;
  }
  
  .filter-group .form-label {
    margin-bottom: 0;
    white-space: nowrap;
    font-size: 0.8rem;
    color: #4a5568;
    font-weight: 500;
    margin-right: 0.5rem; /* ADICIONADO: Espaço DEPOIS do label (e do ':') */
  }
  
  .filter-group .form-control-sm {
    font-size: 0.875rem;
    border-radius: 0.375rem;
    padding: 0.35rem 0.6rem;
    border: 1px solid #d1d9e6;
    height: auto;
  }
  
  .filter-group .form-control-sm:focus {
    border-color: #3a7bd5;
    box-shadow: 0 0 0 0.2rem rgba(58, 123, 213, 0.15);
  }
  
  /* Botões */
  .btn-sm {
    padding: 0.35rem 0.75rem;
    font-size: 0.825rem;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    border-radius: 0.375rem;
    height: auto;
    line-height: normal;
  }
  
  /* A div que contém os botões, gap-2 no template já cuida do espaçamento entre eles */
  .filter-group .d-flex.gap-2 .btn:not(:last-child) {
  margin-right: 0.35rem; /* Exemplo de margem entre botões */
  }
  
  
  .btn-primary {
    background-color: #3a7bd5;
    border-color: #3a7bd5;
    color: #fff;
  }
  .btn-primary:hover {
    background-color: #2f6bc1;
    border-color: #2b64b5;
  }
  
  .btn-outline-secondary {
    color: #4a5568;
    border-color: #d1d9e6;
  }
  .btn-outline-secondary:hover {
    background-color: #f8f9fa;
    border-color: #c4cfdd;
    color: #3a7bd5;
  }
  
  @media (max-width: 991.98px) {
    .form-inline-custom {
      flex-direction: column;
      align-items: stretch;
    }
    .filter-group {
      width: 100%;
      /* justify-content: space-between;  Pode não ser necessário se o input crescer */
      margin-bottom: 0.75rem;
    }
    .filter-group:last-child {
      margin-bottom: 0;
    }
    .filter-group .form-label {
      margin-right: 0.5rem; /* Manter o espaço mesmo quando empilhado */
    }
    .filter-group .form-control-sm {
      flex-grow: 1; /* Input cresce para preencher espaço ao lado do label */
    }
    .filter-group.ms-auto {
      margin-left: 0 !important;
    }
    .filter-group .d-flex {
      width: 100%;
    }
    .filter-group .d-flex button {
      flex-grow: 1;
    }
  }
  </style>