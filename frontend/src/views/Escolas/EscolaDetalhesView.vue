<!-- /frontend/src/views/Escolas/EscolaDetalhesView.vue -->
<template>
  <div class="escola-detalhes-container">
      <header class="detalhes-header">
          <h1>{{ escolaNome || 'Carregando...' }}</h1>
          <router-link to="/escolas/painel" class="btn-voltar">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-left-circle" viewBox="0 0 16 16">
                  <path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-4.5-.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5z"/>
              </svg>
              Voltar para Painel
          </router-link>
      </header>

      <div v-if="loading" class="loading-message">Carregando informações da escola...</div>
      <div v-if="error" class="error-message">{{ error }}</div>

      <div v-if="detalhesEscola" class="info-escola">
          <h2>Informações da Escola</h2>
          <p><strong>Endereço:</strong> {{ detalhesEscola.endereco || 'Não informado' }}</p>
          <p><strong>Responsável:</strong> {{ detalhesEscola.responsavel || 'Não informado' }}</p>
          <p><strong>Cadastrada em:</strong> {{ formatarData(detalhesEscola.data_cadastro) }}</p>
      </div>

      <section class="estoque-recebido-section" v-if="!loading">
          <h2>Estoque Recebido</h2>
          <div v-if="loadingTransferencias" class="loading-message small">Carregando histórico...</div>
          <div v-if="errorTransferencias" class="error-message small">{{ errorTransferencias }}</div>

          <div v-if="!loadingTransferencias && itensConsolidados.length === 0 && !errorTransferencias" class="empty-message">
              Nenhum item de estoque recebido para esta escola ainda.
          </div>

          <!-- ALTERAÇÃO: Única tabela para todos os itens -->
          <div v-else-if="itensConsolidados.length > 0" class="tabela-consolidada-container">
              <table class="tabela-consolidada">
                  <thead>
                      <tr>
                          <th>Data Recebimento</th>
                          <th>Registrado por</th>
                          <th>Produto</th>
                          <th>Unidade</th>
                          <th class="text-right">Quantidade Recebida</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr v-for="(item, index) in itensConsolidados" :key="item.original_transferencia_id + '-' + index">
                          <td>{{ item.data_formatada }}</td>
                          <td>{{ item.nome_usuario }}</td>
                          <td>{{ item.nome_produto }}</td>
                          <td>{{ item.unidade_medida }}</td>
                          <td class="text-right">{{ item.quantidade_enviada }}</td>
                      </tr>
                  </tbody>
              </table>
          </div>
          <!-- FIM ALTERAÇÃO -->
      </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const escolaId = computed(() => route.params.id);
const escolaNome = ref('');
const detalhesEscola = ref(null);
const loading = ref(false);
const error = ref(null);

const transferencias = ref([]); // Mantém a estrutura original da API
const loadingTransferencias = ref(false);
const errorTransferencias = ref(null);

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// ALTERAÇÃO: Computed property para achatar os dados para a tabela
const itensConsolidados = computed(() => {
  const todosItens = [];
  transferencias.value.forEach(transferencia => {
      if (transferencia.itens && transferencia.itens.length > 0) {
          transferencia.itens.forEach(item => {
              todosItens.push({
                  ...item, // Copia propriedades do item (nome_produto, unidade_medida, quantidade_enviada)
                  data_formatada: transferencia.data_formatada,
                  nome_usuario: transferencia.nome_usuario,
                  original_transferencia_id: transferencia.transferencia_id // Para a chave :key, se necessário
              });
          });
      }
  });
  // Opcional: Ordenar todos os itens por data, se necessário,
  // mas a API já retorna as transferências ordenadas por data.
  // Se as transferências não viessem ordenadas, você poderia ordenar todosItens aqui.
  return todosItens;
});

function formatarData(dataString) {
if (!dataString) return 'Data não disponível';
try {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
} catch (e) {
    return dataString;
}
}

async function fetchDetalhesEscola() {
loading.value = true;
error.value = null;
detalhesEscola.value = null;
escolaNome.value = '';
const token = localStorage.getItem('authToken');

if (!token) {
    error.value = 'Não autenticado.';
    loading.value = false;
    return;
}

try {
    const response = await axios.get(`${API_URL}/escolas/${escolaId.value}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    detalhesEscola.value = response.data;
    escolaNome.value = response.data.nome;
} catch (err) {
    console.error('Erro ao buscar detalhes da escola:', err);
    error.value = err.response?.data?.error || 'Falha ao carregar detalhes da escola.';
    if (err.response?.status === 404) {
        escolaNome.value = "Escola não encontrada";
    }
} finally {
    loading.value = false;
}
}

async function fetchTransferenciasDaEscola() {
loadingTransferencias.value = true;
errorTransferencias.value = null;
transferencias.value = []; // A estrutura original da API ainda é armazenada aqui
const token = localStorage.getItem('authToken');

if (!token) {
    errorTransferencias.value = 'Não autenticado para buscar histórico.';
    loadingTransferencias.value = false;
    return;
}

try {
    const response = await axios.get(`${API_URL}/transferencias/por-escola/${escolaId.value}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    transferencias.value = response.data; // Armazena os dados como vêm da API
} catch (err) {
    console.error('Erro ao buscar histórico de transferências:', err);
    errorTransferencias.value = err.response?.data?.error || 'Falha ao carregar histórico de transferências.';
} finally {
    loadingTransferencias.value = false;
}
}

async function carregarDadosCompletos() {
  await fetchDetalhesEscola();
  if (detalhesEscola.value && !error.value) {
      await fetchTransferenciasDaEscola();
  }
}

onMounted(() => {
  carregarDadosCompletos();
});

watch(escolaId, (newId, oldId) => {
if (newId && newId !== oldId) {
  carregarDadosCompletos();
}
}, { immediate: false });
</script>

<style scoped>
.escola-detalhes-container {
  padding: 1.5rem 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  max-width: 1000px; /* Aumentado para tabelas mais largas */
  margin: 2rem auto;
}

.detalhes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.detalhes-header h1 {
  color: #2c3e50;
  margin: 0;
  font-size: 1.8rem;
}

.btn-voltar {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background-color: #6c757d;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}
.btn-voltar:hover {
  background-color: #5a6268;
}
.btn-voltar svg {
  margin-bottom: 1px;
}

.info-escola {
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 6px;
}
.info-escola h2 {
  font-size: 1.3rem;
  color: #343a40;
  margin-top: 0;
  margin-bottom: 0.8rem;
}
.info-escola p {
  color: #495057;
  margin-bottom: 0.4rem;
  font-size: 0.95rem;
}
.info-escola p strong {
  color: #212529;
}

.estoque-recebido-section h2 { /* Mudado de .historico-transferencias */
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e0e0e0;
}

/* ALTERAÇÃO: Estilos para a tabela consolidada */
.tabela-consolidada-container {
  margin-top: 1rem;
  overflow-x: auto; /* Permite rolagem horizontal se a tabela for muito larga */
}

.tabela-consolidada {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  min-width: 700px; /* Largura mínima para evitar quebra excessiva de colunas */
}

.tabela-consolidada th,
.tabela-consolidada td {
  border: 1px solid #dee2e6;
  padding: 0.75rem;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap; /* Evita quebra de linha no conteúdo da célula por padrão */
}
.tabela-consolidada td:nth-child(3) { /* Coluna Produto */
  white-space: normal; /* Permite quebra de linha no nome do produto se for longo */
}


.tabela-consolidada th {
  background-color: #e9ecef;
  font-weight: 600;
  color: #495057;
  position: sticky; /* Para cabeçalho fixo se a tabela rolar verticalmente (requer altura no container) */
  top: 0;
  z-index: 1;
}

.tabela-consolidada tbody tr:nth-child(even) {
  background-color: #f8f9fa;
}
.tabela-consolidada tbody tr:hover {
  background-color: #f1f3f5;
}

.tabela-consolidada .text-right {
  text-align: right;
}
/* FIM ALTERAÇÃO */

.loading-message, .empty-message {
  text-align: center;
  padding: 1rem;
  color: #6c757d;
  font-style: italic;
}
.loading-message.small, .empty-message.small {
  padding: 0.5rem;
  font-size: 0.9rem;
}

.error-message {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 0.8rem 1rem;
  border-radius: 4px;
  margin-top: 1rem;
  font-size: 0.9rem;
}
.error-message.small {
  font-size: 0.85rem;
  padding: 0.5rem 0.8rem;
}
</style>