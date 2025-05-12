<!-- /frontend/src/views/Escolas/EscolaDetalhesView.vue -->
<template>
  <div class="escola-detalhes-container">
      <header class="detalhes-header">
          <h1>{{ escolaNome || 'Carregando...' }}</h1>
          <!-- botão -->
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
                <!-- Indicador visual de pendência  -->
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
          <h2>Estoque Recebido</h2> <!-- Título ajustado -->
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
                      </tr>
                  </thead>
                  <tbody>
                      <!-- Usando o novo componente -->
                      <ItemEstoqueConsolidado
                          v-for="item in itensConsolidados"
                          :key="item._id_vfor"
                          :item="item"
                          :colunas-na-tabela-principal="6"
                      />
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
import ConfirmarRecebimentoModal from './ConfirmarRecebimentoModal.vue'; 
import { useToast } from "vue-toastification"; // Para feedback
import ItemEstoqueConsolidado from './Historico/HistoricoItemEstoque.vue';
import './EscolaDetalhesView.css';

const route = useRoute();
const toast = useToast(); 
const escolaId = computed(() => route.params.id);
const escolaNome = ref('');
const detalhesEscola = ref(null);
const loading = ref(false);
const error = ref(null);

const transferenciasConfirmadas = ref([]); 
const loadingTransferencias = ref(false);
const errorTransferencias = ref(null);

const showConfirmarModal = ref(false); 

// --- Estado para transferências pendentes ---
const temTransferenciasPendentes = ref(false);
const loadingStatusPendentes = ref(false);


const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const itensConsolidados = computed(() => {
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
                _id_vfor: chaveAgregacao, // Mantido para a key do v-for do componente
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

// Renomeado para buscar transferências CONFIRMADAS
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

// --- Função para verificar status de transferências pendentes ---
async function checkTransferenciasPendentes() {
    if (!escolaId.value) return;
    loadingStatusPendentes.value = true;
    temTransferenciasPendentes.value = false; // Reseta antes de verificar
    const token = localStorage.getItem('authToken');

    if (!token) {
        loadingStatusPendentes.value = false;
        return;
    }

    try {
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

// Funções para o novo modal
function abrirModalConfirmacao() {
  showConfirmarModal.value = true;
}

async function handleRecebimentoConfirmado() {
  toast.success("Recebimento(s) confirmado(s) com sucesso!");
  // Recarrega a lista de transferências confirmadas para refletir a mudança
  await fetchTransferenciasConfirmadasDaEscola();
  await checkTransferenciasPendentes(); // Re-verifica pendências após confirmação
}


async function carregarDadosCompletos() {
  await fetchDetalhesEscola();
  if (detalhesEscola.value && !error.value) {
      await fetchTransferenciasConfirmadasDaEscola(); 
      checkTransferenciasPendentes()
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