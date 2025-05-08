<!-- /frontend/src/views/Escolas/EscolaDetalhesView.vue -->
<template>
  <div class="escola-detalhes-container">
      <header class="detalhes-header">
          <h1>{{ escolaNome || 'Carregando...' }}</h1>
          <!-- ALTERAÇÃO: Novo botão -->
          <button
                type="button"
                @click="abrirModalConfirmacao"
                class="btn-confirmar-recebimento"
                :class="{ 'has-pending-animation': temTransferenciasPendentes }" 
                :disabled="loading || !!error || loadingStatusPendentes" 
                :title="temTransferenciasPendentes ? 'Existem recebimentos pendentes de confirmação!' : 'Confirmar recebimento de estoque'"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check2-square" viewBox="0 0 16 16">
                    <path d="M3 14.5A1.5 1.5 0 0 1 1.5 13V3A1.5 1.5 0 0 1 3 1.5h8a.5.5 0 0 1 0 1H3a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V8a.5.5 0 0 1 1 0v5a1.5 1.5 0 0 1-1.5 1.5z"/>
                    <path d="m8.354 10.354 7-7a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0"/>
                </svg>
                Confirmar Recebimento
                <!-- ALTERAÇÃO: Indicador visual de pendência (opcional) -->
                <span v-if="temTransferenciasPendentes && !loadingStatusPendentes" class="pending-indicator" aria-label="Pendências existem">!</span>
            </button>
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
          <h2>Estoque Recebido Confirmado</h2> <!-- Título ajustado -->
          <div v-if="loadingTransferencias" class="loading-message small">Carregando histórico...</div>
          <div v-if="errorTransferencias" class="error-message small">{{ errorTransferencias }}</div>

          <div v-if="!loadingTransferencias && itensConsolidados.length === 0 && !errorTransferencias" class="empty-message">
              Nenhum item de estoque confirmado como recebido para esta escola ainda.
          </div>

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
                          <td>{{ item.data_formatada }}</td> <!-- Este será a data de confirmação do recebimento -->
                          <td>{{ item.nome_usuario }}</td>
                          <td>{{ item.nome_produto }}</td>
                          <td>{{ item.unidade_medida }}</td>
                          <td class="text-right">{{ item.quantidade_enviada }}</td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </section>

      <!-- Modal de Confirmação -->
      <ConfirmarRecebimentoModal
          :show="showConfirmarModal"
          :escola-id="escolaId"
          :escola-nome="escolaNome"
          @close="showConfirmarModal = false"
          @recebimento-confirmado="handleRecebimentoConfirmado"
      />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import ConfirmarRecebimentoModal from './ConfirmarRecebimentoModal.vue'; // ALTERAÇÃO: Importar modal
import { useToast } from "vue-toastification"; // ALTERAÇÃO: Para feedback

const route = useRoute();
const toast = useToast(); // ALTERAÇÃO
const escolaId = computed(() => route.params.id);
const escolaNome = ref('');
const detalhesEscola = ref(null);
const loading = ref(false);
const error = ref(null);

const transferenciasConfirmadas = ref([]); // ALTERAÇÃO: Renomeado para clareza
const loadingTransferencias = ref(false);
const errorTransferencias = ref(null);

const showConfirmarModal = ref(false); // ALTERAÇÃO: Estado para o novo modal

// --- ALTERAÇÃO: Estado para transferências pendentes ---
const temTransferenciasPendentes = ref(false);
const loadingStatusPendentes = ref(false);
// --- FIM ALTERAÇÃO ---

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const itensConsolidados = computed(() => {
  const todosItens = [];
  transferenciasConfirmadas.value.forEach(transferencia => { // ALTERAÇÃO: Usa transferenciasConfirmadas
      if (transferencia.itens && transferencia.itens.length > 0) {
          transferencia.itens.forEach(item => {
              todosItens.push({
                  ...item,
                  data_formatada: transferencia.data_recebimento_confirmado_formatada || transferencia.data_formatada, // Usará a nova data de confirmação
                  nome_usuario: transferencia.nome_usuario,
                  original_transferencia_id: transferencia.transferencia_id
              });
          });
      }
  });
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
if (!token) { error.value = 'Não autenticado.'; loading.value = false; return; }
try {
    const response = await axios.get(`${API_URL}/escolas/${escolaId.value}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    detalhesEscola.value = response.data;
    escolaNome.value = response.data.nome;
} catch (err) {
    console.error('Erro ao buscar detalhes da escola:', err);
    error.value = err.response?.data?.error || 'Falha ao carregar detalhes da escola.';
    if (err.response?.status === 404) { escolaNome.value = "Escola não encontrada"; }
} finally { loading.value = false; }
}

// ALTERAÇÃO: Renomeado para buscar transferências CONFIRMADAS
async function fetchTransferenciasConfirmadasDaEscola() {
loadingTransferencias.value = true;
errorTransferencias.value = null;
transferenciasConfirmadas.value = [];
const token = localStorage.getItem('authToken');
if (!token) { errorTransferencias.value = 'Não autenticado.'; loadingTransferencias.value = false; return; }
try {
    // API será ajustada para buscar apenas confirmadas: GET /api/transferencias/confirmadas/por-escola/:escolaId
    // Por enquanto, usamos a mesma, mas a lógica do backend precisará mudar.
    const response = await axios.get(`${API_URL}/transferencias/confirmadas/por-escola/${escolaId.value}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    transferenciasConfirmadas.value = response.data;
} catch (err) {
    console.error('Erro ao buscar transferências confirmadas:', err);
    errorTransferencias.value = err.response?.data?.error || 'Falha ao carregar transferências confirmadas.';
} finally {
    loadingTransferencias.value = false;
}
}

// --- ALTERAÇÃO: Função para verificar status de transferências pendentes ---
async function checkTransferenciasPendentes() {
    if (!escolaId.value) return;
    loadingStatusPendentes.value = true;
    temTransferenciasPendentes.value = false; // Reseta antes de verificar
    const token = localStorage.getItem('authToken');

    if (!token) {
        // Não precisa mostrar erro aqui, apenas não ativa a animação
        loadingStatusPendentes.value = false;
        return;
    }

    try {
        // Usaremos a mesma API que o modal usa, mas só precisamos saber se o array retornado tem tamanho > 0
        const response = await axios.get(`${API_URL}/transferencias/pendentes/por-escola/${escolaId.value}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data && response.data.length > 0) {
            temTransferenciasPendentes.value = true;
        } else {
            temTransferenciasPendentes.value = false;
        }
    } catch (err) {
        console.error('Erro ao verificar transferências pendentes para animação:', err);
        temTransferenciasPendentes.value = false; // Assume que não há pendentes em caso de erro
    } finally {
        loadingStatusPendentes.value = false;
    }
}
// --- FIM ALTERAÇÃO ---

// ALTERAÇÃO: Funções para o novo modal
function abrirModalConfirmacao() {
  showConfirmarModal.value = true;
}

async function handleRecebimentoConfirmado() {
  toast.success("Recebimento(s) confirmado(s) com sucesso!");
  // Recarrega a lista de transferências confirmadas para refletir a mudança
  await fetchTransferenciasConfirmadasDaEscola();
  await checkTransferenciasPendentes(); // ALTERAÇÃO: Re-verifica pendências após confirmação
}
// FIM ALTERAÇÃO

async function carregarDadosCompletos() {
  await fetchDetalhesEscola();
  if (detalhesEscola.value && !error.value) {
      await fetchTransferenciasConfirmadasDaEscola(); // ALTERAÇÃO
      checkTransferenciasPendentes() // ALTERAÇÃO: Verifica pendências
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

/* ALTERAÇÃO: Estilo para o novo botão */
.btn-confirmar-recebimento {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    background-color: #198754; /* Verde sucesso Bootstrap */
    color: white;
    border: none;
    text-decoration: none;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    position: relative; /* Para o indicador de pendência */
}
.btn-confirmar-recebimento:hover:not(:disabled) {
    background-color: #157347;
}
.btn-confirmar-recebimento:disabled {
    background-color: #6c757d;
    opacity: 0.65;
    cursor: not-allowed;
}
.btn-confirmar-recebimento svg {
    margin-bottom: 1px;
}

/* ALTERAÇÃO: Indicador de pendência (opcional) */
.pending-indicator {
    position: absolute;
    top: -5px;
    right: -5px;
    background-color: red;
    color: white;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    font-size: 12px;
    line-height: 18px;
    text-align: center;
    font-weight: bold;
    box-shadow: 0 0 5px rgba(255, 0, 0, 0.7);
}


/* --- ALTERAÇÃO: Animação de Balanço/Tremor --- */
@keyframes shake-horizontal {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
  20%, 40%, 60%, 80% { transform: translateX(3px); }
}

@keyframes pulse-glow {
  0% { box-shadow: 0 0 3px 0px rgba(25, 135, 84, 0.5); }
  50% { box-shadow: 0 0 8px 4px rgba(25, 135, 84, 0.7); }
  100% { box-shadow: 0 0 3px 0px rgba(25, 135, 84, 0.5); }
}

.btn-confirmar-recebimento.has-pending-animation {
    animation: shake-horizontal 0.8s cubic-bezier(.36,.07,.19,.97) both,
               pulse-glow 1.5s ease-in-out infinite alternate; /* Combina duas animações */
    /* Ajuste a duração e o timing-function conforme preferir */
    /* Se quiser apenas uma: */
    /* animation: shake-horizontal 0.8s cubic-bezier(.36,.07,.19,.97) infinite both; */
    /* animation: pulse-glow 1.5s ease-in-out infinite alternate; */
}
/* --- FIM ALTERAÇÃO --- */

</style>