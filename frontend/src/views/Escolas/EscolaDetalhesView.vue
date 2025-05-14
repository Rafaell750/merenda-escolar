<template>
  <div class="escola-detalhes-container">
      <header class="detalhes-header">
          <h1>{{ escolaNome || 'Carregando...' }}</h1>
          <button
                type="button"
                @click="abrirModalConfirmacao"
                class="btn-confirmar-recebimento"
                :class="{ 'has-pending-animation': temTransferenciasPendentes }"
                :disabled="loading || !!error || loadingStatusPendentes || !podeInteragirComEstoque" 
                :title="temTransferenciasPendentes ? 'Existem recebimentos pendentes de confirmação!' : 'Confirmar recebimento de estoque'"
                v-if="podeInteragirComEstoque" 
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check2-square" viewBox="0 0 16 16">
                    <path d="M3 14.5A1.5 1.5 0 0 1 1.5 13V3A1.5 1.5 0 0 1 3 1.5h8a.5.5 0 0 1 0 1H3a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V8a.5.5 0 0 1 1 0v5a1.5 1.5 0 0 1-1.5 1.5z"/>
                    <path d="m8.354 10.354 7-7a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0"/>
                </svg>
                Confirmar Recebimento
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
          <!-- Adicionar botão de editar dados da escola aqui, se existir no seu design original -->
          <!-- <button v-if="podeGerenciarEscola" @click="abrirModalEditarDadosEscola">Editar Dados</button> -->
      </div>

      <section class="estoque-recebido-section" v-if="!loading">
          <div class="titulo-com-botao">
            <h2>Estoque Recebido</h2>
            <button
                v-if="itensConsolidados.length > 0 && podeInteragirComEstoque" 
                type="button"
                @click="abrirModalRetirarEstoque"
                class="btn-retirar-estoque"
                title="Retirar itens do estoque"
                :disabled="!podeInteragirComEstoque" 
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-up-right" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5"/>
                    <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z"/>
                </svg>
                Retirar Estoque
            </button>
          </div>

          <div v-if="loadingTransferencias" class="loading-message small">Carregando histórico...</div>
          <div v-if="errorTransferencias" class="error-message small">{{ errorTransferencias }}</div>

          <div v-if="!loadingTransferencias && itensConsolidados.length === 0 && !errorTransferencias" class="empty-message">
              Nenhum item de estoque confirmado como recebido para esta escola ainda.
          </div>

          <div v-else-if="itensConsolidados.length > 0" class="tabela-consolidada-container">
              <table class="tabela-consolidada">
                  <thead>
                      <tr>
                          <th>Último Recebimento</th>
                          <th>Último Registro por</th>
                          <th>Produto</th>
                          <th>Unidade</th>
                          <th class="text-right">Qtd Recebida</th>
                          <th>Detalhes</th>
                          <!-- Adicionar coluna de Ações se houver ações por item (ex: editar quantidade item a item) -->
                          <!-- <th v-if="podeInteragirComEstoque">Ações</th> -->
                      </tr>
                  </thead>
                  <tbody>
                      <ItemEstoqueConsolidado
                          v-for="item in itensConsolidados"
                          :key="item._id_vfor"
                          :item="item"
                          :colunas-na-tabela-principal="6"
                          :pode-editar-item="podeInteragirComEstoque" 
                      />
                  </tbody>
              </table>
          </div>
      </section>
      
      <!-- Mensagem para usuários que só podem visualizar -->
      <div v-if="!podeInteragirComEstoque" class="view-only-message mt-3">
        <p><em>Você está em modo de visualização. Ações de gerenciamento de estoque não estão disponíveis para seu perfil nesta escola.</em></p>
      </div>

      <!-- Modal de Confirmação de Recebimento -->
      <ConfirmarRecebimentoModal
          :show="showConfirmarModal"
          :escola-id="escolaId"
          :escola-nome="escolaNome"
          @close="showConfirmarModal = false"
          @recebimento-confirmado="handleRecebimentoConfirmado"
      />

      <!-- Novo Modal de Retirada de Estoque -->
      <RetirarEstoqueModal
          :show="showRetirarEstoqueModal"
          :itens-disponiveis="itensConsolidados"
          :escola-id="escolaId"
          :escola-nome="escolaNome"
          @close="showRetirarEstoqueModal = false"
          @retirada-confirmada="handleRetiradaConfirmada"
      />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import ConfirmarRecebimentoModal from './ConfirmarRecebimentoModal.vue';
import RetirarEstoqueModal from './RetirarEstoqueModal.vue';
import { useToast } from "vue-toastification";
import ItemEstoqueConsolidado from './Historico/HistoricoItemEstoque.vue';
import './EscolaDetalhesView.css';

const route = useRoute();
const toast = useToast();
const escolaId = computed(() => parseInt(route.params.id, 10)); // Garantir que é número
const escolaNome = ref('');
const detalhesEscola = ref(null);
const loading = ref(false);
const error = ref(null);

const transferenciasConfirmadas = ref([]);
const loadingTransferencias = ref(false);
const errorTransferencias = ref(null);

const showConfirmarModal = ref(false);
const showRetirarEstoqueModal = ref(false);

const temTransferenciasPendentes = ref(false);
const loadingStatusPendentes = ref(false);

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// --- NOVA LÓGICA DE PERMISSÃO ---
const currentUser = ref(null);

function loadCurrentUser() {
    const userStr = localStorage.getItem('authUser');
    try {
        currentUser.value = userStr ? JSON.parse(userStr) : null;
    } catch {
        currentUser.value = null;
        // Opcional: limpar localStorage se inválido
        // localStorage.removeItem('authUser');
        // localStorage.removeItem('authToken');
    }
}

const userRole = computed(() => currentUser.value?.role);
const userLoggedInSchoolId = computed(() => currentUser.value?.school_id); // ID da escola do usuário logado

// `podeInteragirComEstoque` controla os botões principais de ação com o estoque
const podeInteragirComEstoque = computed(() => {
    if (!currentUser.value) return false; // Não logado, não pode interagir
    if (userRole.value === 'admin') return true; // Admin pode tudo
    if (userRole.value === 'escola' && userLoggedInSchoolId.value === escolaId.value) {
        return true; // Usuário da escola pode interagir com sua própria escola
    }
    // Usuários 'user' e usuários 'escola' de outras escolas não podem interagir com estoque
    return false;
});
// ----------------------------------


const itensConsolidados = computed(() => {
    // ... (sua lógica existente, sem alterações aqui) ...
    const itensCompletos = [];
    transferenciasConfirmadas.value.forEach(transferencia => {
        if (transferencia.itens && transferencia.itens.length > 0) {
            transferencia.itens.forEach(item => {
                const dataParaOrdenacao = transferencia.data_recebimento_confirmado || transferencia.data_envio || new Date(0).toISOString();
                itensCompletos.push({
                    ...item,
                    data_confirmacao: dataParaOrdenacao,
                    data_formatada: transferencia.data_recebimento_confirmado_formatada || transferencia.data_formatada,
                    nome_usuario: transferencia.nome_usuario,
                    original_transferencia_id: transferencia.transferencia_id,
                    item_id_original: item.id || item.item_id
                });
            });
        }
    });
    itensCompletos.sort((a, b) => new Date(b.data_confirmacao) - new Date(a.data_confirmacao));
    const agregador = new Map();
    itensCompletos.forEach(item => {
        const chaveAgregacao = `${item.nome_produto}|${item.unidade_medida}`;
        if (!agregador.has(chaveAgregacao)) {
            agregador.set(chaveAgregacao, {
                _id_vfor: chaveAgregacao,
                nome_produto: item.nome_produto,
                unidade_medida: item.unidade_medida,
                quantidade_total: 0,
                ultima_data_recebimento_formatada: item.data_formatada,
                ultimo_nome_usuario: item.nome_usuario,
                historico_detalhado: [],
            });
        }
        const itemAgregado = agregador.get(chaveAgregacao);
        const quantidade = parseFloat(item.quantidade_enviada);
        if (!isNaN(quantidade)) {
            itemAgregado.quantidade_total += quantidade;
        }
        itemAgregado.historico_detalhado.push({
            data_formatada: item.data_formatada,
            nome_usuario: item.nome_usuario,
            quantidade_enviada: item.quantidade_enviada,
            original_transferencia_id: item.original_transferencia_id,
            item_id_original: item.item_id_original
        });
    });
    const resultadoArray = Array.from(agregador.values());
    resultadoArray.sort((a, b) => a.nome_produto.localeCompare(b.nome_produto));
    return resultadoArray;
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
      error.value = err.response?.data?.error || 'Falha ao carregar detalhes da escola. Faça login novamente.';
      if (err.response?.status === 404) { escolaNome.value = "Escola não encontrada"; }
  } finally { loading.value = false; }
}

async function fetchTransferenciasConfirmadasDaEscola() {
  loadingTransferencias.value = true;
  errorTransferencias.value = null;
  transferenciasConfirmadas.value = [];
  const token = localStorage.getItem('authToken');
  if (!token) { errorTransferencias.value = 'Não autenticado.'; loadingTransferencias.value = false; return; }
  try {
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

async function checkTransferenciasPendentes() {
    if (!escolaId.value) return;
    loadingStatusPendentes.value = true;
    temTransferenciasPendentes.value = false;
    const token = localStorage.getItem('authToken');
    if (!token) { loadingStatusPendentes.value = false; return; }
    try {
        const response = await axios.get(`${API_URL}/transferencias/pendentes/por-escola/${escolaId.value}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        temTransferenciasPendentes.value = response.data && response.data.length > 0;
    } catch (err) {
        console.error('Erro ao verificar transferências pendentes para animação:', err);
        temTransferenciasPendentes.value = false;
    } finally {
        loadingStatusPendentes.value = false;
    }
}

function abrirModalConfirmacao() {
  showConfirmarModal.value = true;
}

async function handleRecebimentoConfirmado() {
  toast.success("Recebimento(s) confirmado(s) com sucesso!");
  await fetchTransferenciasConfirmadasDaEscola();
  await checkTransferenciasPendentes();
}

// Funções para o novo modal de retirada
function abrirModalRetirarEstoque() {
  showRetirarEstoqueModal.value = true;
}

async function handleRetiradaConfirmada() {
  // O toast de sucesso já é dado pelo modal de retirada
  // Apenas recarrega os dados para refletir o estoque atualizado
  await fetchTransferenciasConfirmadasDaEscola();
  // Não é necessário verificar pendências aqui, pois a retirada não afeta transferências pendentes.
}

async function carregarDadosCompletos() {
  await fetchDetalhesEscola();
  if (detalhesEscola.value && !error.value) {
      await fetchTransferenciasConfirmadasDaEscola();
      await checkTransferenciasPendentes();
  }
}

onMounted(() => {
  loadCurrentUser();
  carregarDadosCompletos();
});

watch(escolaId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    carregarDadosCompletos();
  }
}, { immediate: false });
</script>

<style scoped>
/* Adicionar estilos para .titulo-com-botao e .btn-retirar-estoque */
.titulo-com-botao {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem; /* Ou conforme necessário */
}

.titulo-com-botao h2 {
  margin-bottom: 0; /* Remove a margem inferior do h2 se o flex container já der espaçamento */
}

.btn-retirar-estoque {
  background-color: #ffc107; /* Amarelo alerta */
  color: #212529; /* Texto escuro para contraste */
  border: 1px solid #ffc107;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px; /* Espaço entre ícone e texto */
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
}

.btn-retirar-estoque:hover {
  background-color: #e0a800;
  border-color: #d39e00;
}

.btn-retirar-estoque svg {
  margin-right: 4px; /* Pequeno espaço entre ícone e texto, caso gap não seja suportado */
}

.btn-retirar-estoque:disabled {
  background-color: #e9ecef;
  border-color: #ced4da;
  color: #6c757d;
  cursor: not-allowed;
}

/* Outros estilos de EscolaDetalhesView.css permanecem os mesmos */
/* ... seu CSS existente ... */
.escola-detalhes-container {
  padding: 20px;
  max-width: 1000px;
  margin: 20px auto;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.detalhes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #eee;
  padding-bottom: 15px;
  margin-bottom: 20px;
}

.detalhes-header h1 {
  color: #333;
  margin: 0;
  font-size: 1.8em;
}

.btn-confirmar-recebimento {
  background-color: #28a745; /* Verde */
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s ease-in-out;
  position: relative; /* Para o indicador de pendência */
}
.btn-confirmar-recebimento:hover {
  background-color: #218838;
}
.btn-confirmar-recebimento:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}
.btn-confirmar-recebimento svg {
  margin-right: 5px;
}

.pending-indicator {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: red;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8em;
  font-weight: bold;
  box-shadow: 0 0 5px rgba(0,0,0,0.5);
}

.has-pending-animation {
    animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
    0% {
        box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7);
    }
    70% {
        box-shadow: 0 0 0 10px rgba(255, 82, 82, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(255, 82, 82, 0);
    }
}


.info-escola, .estoque-recebido-section {
  background-color: #fff;
  padding: 20px;
  border-radius: 6px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.07);
  margin-bottom: 25px;
}

.info-escola h2, .estoque-recebido-section h2 {
  color: #444;
  font-size: 1.5em;
  margin-top: 0;
  margin-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 10px;
}

.info-escola p {
  margin: 8px 0;
  color: #555;
  line-height: 1.6;
}
.info-escola p strong {
  color: #333;
}

.loading-message, .error-message, .empty-message {
  padding: 15px;
  margin: 15px 0;
  border-radius: 4px;
  text-align: center;
}
.loading-message.small {
    padding: 10px;
    font-size: 0.9em;
}
.error-message.small {
    padding: 10px;
    font-size: 0.9em;
}

.loading-message {
  background-color: #e9f5ff;
  color: #005c99;
  border: 1px solid #b8d B8DFFC;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.empty-message {
  background-color: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.tabela-consolidada-container {
  overflow-x: auto; /* Permite rolagem horizontal em telas pequenas */
}

.tabela-consolidada {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.tabela-consolidada th,
.tabela-consolidada td {
  border: 1px solid #e0e0e0;
  padding: 10px 12px;
  text-align: left;
  vertical-align: middle;
  font-size: 0.95em;
}

.tabela-consolidada th {
  background-color: #f1f3f5;
  font-weight: 600;
  color: #343a40;
}

.tabela-consolidada tbody tr:nth-child(odd) {
  background-color: #fdfdfd;
}
.tabela-consolidada tbody tr:hover {
  background-color: #f0f5f9;
}

.text-right {
  text-align: right !important;
}
</style>