<!--
  /frontend/src/views/Escolas/EscolaDetalhesView.vue

  Visão Geral:
  Este componente Vue.js exibe os detalhes de uma escola específica, incluindo suas
  informações cadastrais e o histórico de estoque recebido. Ele permite que usuários
  autorizados (admin ou usuário da própria escola) confirmem o recebimento de
  transferências pendentes e retirem itens do estoque da escola.

  Funcionalidades Principais:
  1.  EXIBIÇÃO DE DETALHES DA ESCOLA:
      - Carrega e exibe o nome, endereço, responsável e data de cadastro da escola.
      - O ID da escola é obtido do parâmetro da rota.
  2.  HISTÓRICO DE ESTOQUE RECEBIDO:
      - Busca e exibe uma lista consolidada dos itens de estoque que foram confirmados
        como recebidos pela escola.
      - Para cada item consolidado, mostra o último recebimento, quem registrou, nome do produto,
        unidade e quantidade total recebida.
      - Utiliza o componente `ItemEstoqueConsolidado` para renderizar cada linha da tabela
        e permitir a visualização do histórico detalhado de cada item.
  3.  CONFIRMAÇÃO DE RECEBIMENTO:
      - Um botão "Confirmar Recebimento" é exibido se o usuário tiver permissão.
      - O botão pode ter uma animação e um indicador '!' se houver transferências pendentes
        de confirmação para a escola.
      - Ao clicar, abre o modal `ConfirmarRecebimentoModal` para que o usuário possa
        selecionar e confirmar os itens recebidos.
      - Após a confirmação no modal, o histórico de estoque é atualizado.
  4.  RETIRADA DE ESTOQUE:
      - Um botão "Retirar Estoque" é exibido se houver itens no estoque consolidado e o
        usuário tiver permissão.
      - Ao clicar, abre o modal `RetirarEstoqueModal` para que o usuário possa
        selecionar os produtos e as quantidades a serem retiradas.
      - Após a confirmação no modal, o estoque consolidado é atualizado.
  5.  CONTROLE DE PERMISSÕES:
      - Carrega os dados do usuário logado do `localStorage`.
      - Determina se o usuário atual pode interagir com o estoque (confirmar recebimento,
        retirar estoque) com base no seu papel ('admin' ou 'escola' da respectiva escola).
      - Usuários sem permissão (ex: 'user' padrão ou 'escola' de outra unidade) veem uma
        mensagem de modo de visualização.
  6.  INTERAÇÃO COM API:
      - Utiliza `axios` para fazer chamadas à API para:
          - Buscar detalhes da escola (`/escolas/:id`).
          - Buscar transferências confirmadas para a escola (`/transferencias/confirmadas/por-escola/:id`).
          - Verificar se existem transferências pendentes para a escola (`/transferencias/pendentes/por-escola/:id`).
  7.  FEEDBACK AO USUÁRIO:
      - Exibe mensagens de carregamento, erro e lista vazia.
      - Utiliza `vue-toastification` para exibir toasts de sucesso após confirmações.
  8.  FORMATAÇÃO DE DADOS:
      - Função para formatar datas para exibição.
  9.  REATIVIDADE:
      - Observa mudanças no `escolaId` (parâmetro da rota) para recarregar os dados
        se o usuário navegar entre diferentes páginas de detalhes de escolas.

  Componentes Filhos:
  - `ConfirmarRecebimentoModal.vue`: Modal para confirmar o recebimento de transferências.
  - `RetirarEstoqueModal.vue`: Modal para registrar a retirada de itens do estoque da escola.
  - `HistoricoItemEstoque.vue` (dentro de `ItemEstoqueConsolidado`): Renderiza os itens do histórico
    de forma consolidada na tabela principal.

  Estilização:
  - Importa e utiliza CSS definido em `EscolaDetalhesView.css`.
  - Inclui estilos scoped para elementos específicos como o botão "Retirar Estoque".
-->
<template>
  <div class="escola-detalhes-container">
      <!-- 1. CABEÇALHO DA PÁGINA DE DETALHES -->
      <!-- Exibe o nome da escola e o botão de "Confirmar Recebimento". -->
      <header class="detalhes-header">
          <h1>{{ escolaNome || 'Carregando...' }}</h1>
          <!--
            Botão para confirmar recebimento de estoque.
            - `v-if="podeInteragirComEstoque"`: Visível apenas para usuários autorizados.
            - `:class="{ 'has-pending-animation': temTransferenciasPendentes }"`: Animação se houver pendências.
            - `:disabled`: Desabilitado durante carregamentos, erro, ou se não puder interagir.
          -->
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
                <!-- Indicador visual de pendências -->
                <span v-if="temTransferenciasPendentes && !loadingStatusPendentes" class="pending-indicator" aria-label="Pendências existem">!</span>
            </button>
        </header>

      <!-- 2. MENSAGENS DE ESTADO (CARREGAMENTO/ERRO) PARA DETALHES DA ESCOLA -->
      <div v-if="loading" class="loading-message">Carregando informações da escola...</div>
      <div v-if="error" class="error-message">{{ error }}</div>

      <!-- 3. INFORMAÇÕES CADASTRAIS DA ESCOLA -->
      <!-- Exibido se `detalhesEscola` for carregado com sucesso. -->
      <div v-if="detalhesEscola" class="info-escola">
          <h2>Informações da Escola</h2>
          <p><strong>Endereço:</strong> {{ detalhesEscola.endereco || 'Não informado' }}</p>
          <p><strong>Responsável:</strong> {{ detalhesEscola.responsavel || 'Não informado' }}</p>
          <p><strong>Cadastrada em:</strong> {{ formatarData(detalhesEscola.data_cadastro) }}</p>
          <!-- Botão para editar dados da escola (funcionalidade futura/opcional) -->
          <!-- <button v-if="podeGerenciarEscola" @click="abrirModalEditarDadosEscola">Editar Dados</button> -->
      </div>

      <!-- 4. SEÇÃO DE ESTOQUE RECEBIDO -->
      <!-- Exibido após o carregamento inicial dos detalhes da escola. -->
      <section class="estoque-recebido-section" v-if="!loading">
          <!-- Título da seção e botão "Retirar Estoque" -->
          <div class="titulo-com-botao">
            <h2>Estoque Recebido</h2>
            <!--
              Botão para retirar estoque.
              - `v-if`: Visível se houver itens e o usuário puder interagir.
              - `:disabled`: Desabilitado se o usuário não puder interagir.
            -->
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

          <!-- Mensagens de estado para o carregamento do histórico de transferências -->
          <div v-if="loadingTransferencias" class="loading-message small">Carregando histórico...</div>
          <div v-if="errorTransferencias" class="error-message small">{{ errorTransferencias }}</div>

          <!-- Mensagem se não houver itens de estoque recebidos -->
          <div v-if="!loadingTransferencias && itensConsolidados.length === 0 && !errorTransferencias" class="empty-message">
              Nenhum item de estoque confirmado como recebido para esta escola ainda.
          </div>

          <!-- Tabela de estoque consolidado -->
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
                          <!-- Coluna de Ações (opcional, para edições item a item) -->
                          <!-- <th v-if="podeInteragirComEstoque">Ações</th> -->
                      </tr>
                  </thead>
                  <tbody>
                      <!--
                        Componente `ItemEstoqueConsolidado` para cada item da lista.
                        Renderiza uma linha da tabela e, internamente, pode ter um sub-histórico.
                      -->
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

      <!-- 5. MENSAGEM DE MODO DE VISUALIZAÇÃO -->
      <!-- Exibida se o usuário logado não tiver permissão para interagir com o estoque desta escola. -->
      <div v-if="!podeInteragirComEstoque" class="view-only-message mt-3">
        <p><em>Você está em modo de visualização. Ações de gerenciamento de estoque não estão disponíveis para seu perfil nesta escola.</em></p>
      </div>

      <!-- 6. MODAIS -->
      <!-- Modal para Confirmar Recebimento de Estoque -->
      <ConfirmarRecebimentoModal
          :show="showConfirmarModal"
          :escola-id="escolaId"
          :escola-nome="escolaNome"
          @close="showConfirmarModal = false"
          @recebimento-confirmado="handleRecebimentoConfirmado"
      />

      <!-- Modal para Retirar Estoque -->
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
// --- BLOCO 1: IMPORTAÇÕES E INICIALIZAÇÕES ---
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router'; // Para acessar parâmetros da rota.
import axios from 'axios'; // Para chamadas HTTP.
import ConfirmarRecebimentoModal from './ConfirmarRecebimentoModal.vue'; // Componente modal.
import RetirarEstoqueModal from './RetirarEstoqueModal.vue'; // Componente modal.
import { useToast } from "vue-toastification"; // Para feedback visual.
import ItemEstoqueConsolidado from './Historico/HistoricoItemEstoque.vue'; // Componente para item da tabela.
import './EscolaDetalhesView.css'; // Estilos específicos.

const route = useRoute(); // Instância para informações da rota atual.
const toast = useToast(); // Instância do serviço de toast.

// --- BLOCO 2: ESTADO LOCAL DO COMPONENTE (REFS) ---
// Estado para detalhes da escola
const escolaId = computed(() => parseInt(route.params.id, 10)); // ID da escola da URL, convertido para número.
const escolaNome = ref('');             // Nome da escola, carregado da API.
const detalhesEscola = ref(null);       // Objeto com detalhes cadastrais da escola.
const loading = ref(false);             // Estado de carregamento dos detalhes da escola.
const error = ref(null);                // Mensagem de erro ao carregar detalhes da escola.

// Estado para transferências confirmadas (histórico de estoque)
const transferenciasConfirmadas = ref([]); // Array de transferências confirmadas.
const loadingTransferencias = ref(false); // Estado de carregamento das transferências.
const errorTransferencias = ref(null);    // Mensagem de erro ao carregar transferências.

// Estado para controle dos modais
const showConfirmarModal = ref(false);       // Visibilidade do modal de confirmação.
const showRetirarEstoqueModal = ref(false); // Visibilidade do modal de retirada.

// Estado para transferências pendentes (para animação do botão)
const temTransferenciasPendentes = ref(false);    // Indica se há transferências pendentes.
const loadingStatusPendentes = ref(false);     // Estado de carregamento da verificação de pendências.

// URL base da API (do .env ou fallback)
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Estado para dados do usuário logado (para controle de permissões)
const currentUser = ref(null);

// --- BLOCO 3: LÓGICA DE PERMISSÕES ---
/**
 * @function loadCurrentUser
 * @description Carrega os dados do usuário logado do localStorage.
 */
function loadCurrentUser() {
    const userStr = localStorage.getItem('authUser');
    try {
        currentUser.value = userStr ? JSON.parse(userStr) : null;
    } catch {
        currentUser.value = null;
        // Opcional: Limpar localStorage se os dados do usuário forem inválidos.
        // localStorage.removeItem('authUser');
        // localStorage.removeItem('authToken');
    }
}

// Propriedades computadas para facilitar a verificação de permissões
const userRole = computed(() => currentUser.value?.role);
const userLoggedInSchoolId = computed(() => currentUser.value?.school_id); // ID da escola do usuário logado

/**
 * @computed podeInteragirComEstoque
 * @description Determina se o usuário logado pode interagir com o estoque desta escola
 * (confirmar recebimento, retirar estoque).
 * - Admin: Pode sempre.
 * - Usuário do tipo 'escola': Pode se o ID da sua escola for o mesmo da escola visualizada.
 * - Outros (user padrão, escola de outra unidade, não logado): Não podem.
 * @returns {boolean}
 */
const podeInteragirComEstoque = computed(() => {
    if (!currentUser.value) return false;
    if (userRole.value === 'admin') return true;
    if (userRole.value === 'escola' && userLoggedInSchoolId.value === escolaId.value) {
        return true;
    }
    return false;
});

// --- BLOCO 4: PROPRIEDADES COMPUTADAS PARA DADOS (ESTOQUE CONSOLIDADO) ---
/**
 * @computed itensConsolidados
 * @description Processa `transferenciasConfirmadas` para agregar os itens por nome e unidade,
 * somando as quantidades e mantendo um histórico detalhado para cada item agregado.
 * Ordena o resultado final pelo nome do produto.
 * @returns {Array<object>} Lista de itens de estoque consolidados.
 */
const itensConsolidados = computed(() => {
    const itensCompletos = []; // Array para todos os itens individuais de todas as transferências
    transferenciasConfirmadas.value.forEach(transferencia => {
        if (transferencia.itens && transferencia.itens.length > 0) {
            transferencia.itens.forEach(item => {
                // Usa data_recebimento_confirmado ou data_envio para ordenação e referência.
                const dataParaOrdenacao = transferencia.data_recebimento_confirmado || transferencia.data_envio || new Date(0).toISOString();
                itensCompletos.push({
                    ...item, // Propriedades do item (nome_produto, unidade_medida, quantidade_enviada, etc.)
                    data_confirmacao: dataParaOrdenacao,
                    data_formatada: transferencia.data_recebimento_confirmado_formatada || transferencia.data_formatada, // Data formatada para exibição
                    nome_usuario: transferencia.nome_usuario, // Nome do usuário que confirmou/enviou
                    original_transferencia_id: transferencia.transferencia_id, // ID da transferência original
                    item_id_original: item.id || item.item_id // ID original do item na transferência
                });
            });
        }
    });

    // Ordena todos os itens pela data de confirmação/envio (mais recente primeiro)
    // Essa ordenação inicial pode não ser estritamente necessária aqui se o backend já envia ordenado,
    // mas garante a ordem para a lógica de agregação pegar o "último" corretamente.
    itensCompletos.sort((a, b) => new Date(b.data_confirmacao) - new Date(a.data_confirmacao));

    // Agrega os itens por produto e unidade de medida
    const agregador = new Map();
    itensCompletos.forEach(item => {
        const chaveAgregacao = `${item.nome_produto}|${item.unidade_medida}`; // Chave única para agregação
        if (!agregador.has(chaveAgregacao)) {
            // Se é o primeiro item deste tipo, inicializa o objeto agregado
            agregador.set(chaveAgregacao, {
                _id_vfor: chaveAgregacao, // ID único para o v-for no template
                nome_produto: item.nome_produto,
                unidade_medida: item.unidade_medida,
                quantidade_total: 0,
                ultima_data_recebimento_formatada: item.data_formatada, // Primeiro item (mais recente) define a "última data"
                ultimo_nome_usuario: item.nome_usuario, // e "último usuário"
                historico_detalhado: [], // Array para o histórico de entradas deste item
            });
        }
        const itemAgregado = agregador.get(chaveAgregacao);
        const quantidade = parseFloat(item.quantidade_enviada);
        if (!isNaN(quantidade)) {
            itemAgregado.quantidade_total += quantidade; // Soma a quantidade
        }
        // Adiciona o item original ao histórico detalhado do item agregado
        itemAgregado.historico_detalhado.push({
            data_formatada: item.data_formatada,
            nome_usuario: item.nome_usuario,
            quantidade_enviada: item.quantidade_enviada,
            original_transferencia_id: item.original_transferencia_id,
            item_id_original: item.item_id_original
        });
    });

    const resultadoArray = Array.from(agregador.values()); // Converte o Map para Array
    // Ordena o resultado final alfabeticamente pelo nome do produto
    resultadoArray.sort((a, b) => a.nome_produto.localeCompare(b.nome_produto));
    return resultadoArray;
});

// --- BLOCO 5: FUNÇÕES UTILITÁRIAS E DE API ---
/**
 * @function formatarData
 * @param {string} dataString - A string da data a ser formatada.
 * @returns {string} Data formatada (ex: "10 de janeiro de 2024, 14:30") ou mensagem de fallback.
 */
function formatarData(dataString) {
  if (!dataString) return 'Data não disponível';
  try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR', {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
      });
  } catch (e) {
      return dataString; // Retorna a string original em caso de erro na formatação
  }
}

/**
 * @async
 * @function fetchDetalhesEscola
 * @description Busca os detalhes cadastrais da escola da API.
 * Atualiza `detalhesEscola`, `escolaNome`, `loading` e `error`.
 */
async function fetchDetalhesEscola() {
  loading.value = true;
  error.value = null;
  detalhesEscola.value = null;
  escolaNome.value = ''; // Reseta nome enquanto carrega
  const token = localStorage.getItem('authToken');
  if (!token) { error.value = 'Não autenticado.'; loading.value = false; return; }
  try {
      const response = await axios.get(`${API_URL}/escolas/${escolaId.value}`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      detalhesEscola.value = response.data;
      escolaNome.value = response.data.nome; // Atualiza o nome da escola para o cabeçalho
  } catch (err) {
      console.error('Erro ao buscar detalhes da escola:', err);
      error.value = err.response?.data?.error || 'Falha ao carregar detalhes da escola. Faça login novamente.';
      if (err.response?.status === 404) { escolaNome.value = "Escola não encontrada"; }
  } finally { loading.value = false; }
}

/**
 * @async
 * @function fetchTransferenciasConfirmadasDaEscola
 * @description Busca o histórico de transferências confirmadas (itens recebidos) para a escola.
 * Atualiza `transferenciasConfirmadas`, `loadingTransferencias` e `errorTransferencias`.
 */
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

/**
 * @async
 * @function checkTransferenciasPendentes
 * @description Verifica se existem transferências pendentes de confirmação para a escola.
 * Usado para a animação do botão "Confirmar Recebimento".
 * Atualiza `temTransferenciasPendentes` e `loadingStatusPendentes`.
 */
async function checkTransferenciasPendentes() {
    if (!escolaId.value) return; // Não executa se escolaId não estiver definido
    loadingStatusPendentes.value = true;
    temTransferenciasPendentes.value = false; // Assume que não há pendências inicialmente
    const token = localStorage.getItem('authToken');
    if (!token) { loadingStatusPendentes.value = false; return; }
    try {
        const response = await axios.get(`${API_URL}/transferencias/pendentes/por-escola/${escolaId.value}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Define `temTransferenciasPendentes` com base na resposta da API (se existem itens no array)
        temTransferenciasPendentes.value = response.data && response.data.length > 0;
    } catch (err) {
        console.error('Erro ao verificar transferências pendentes para animação:', err);
        temTransferenciasPendentes.value = false; // Em caso de erro, assume que não há pendências visíveis
    } finally {
        loadingStatusPendentes.value = false;
    }
}

/**
 * @function abrirModalConfirmacao
 * @description Define `showConfirmarModal` para `true`, abrindo o modal de confirmação.
 */
function abrirModalConfirmacao() {
  showConfirmarModal.value = true;
}

/**
 * @async
 * @function handleRecebimentoConfirmado
 * @description Chamada após o modal `ConfirmarRecebimentoModal` emitir `recebimento-confirmado`.
 * Exibe um toast de sucesso e recarrega o histórico de transferências e o status de pendências.
 */
async function handleRecebimentoConfirmado() {
  toast.success("Recebimento(s) confirmado(s) com sucesso!");
  await fetchTransferenciasConfirmadasDaEscola(); // Atualiza a lista de estoque recebido
  await checkTransferenciasPendentes(); // Reverifica se ainda há pendências
}

/**
 * @function abrirModalRetirarEstoque
 * @description Define `showRetirarEstoqueModal` para `true`, abrindo o modal de retirada.
 */
function abrirModalRetirarEstoque() {
  showRetirarEstoqueModal.value = true;
}

/**
 * @async
 * @function handleRetiradaConfirmada
 * @description Chamada após o modal `RetirarEstoqueModal` emitir `retirada-confirmada`.
 * Recarrega o histórico de transferências para refletir o estoque atualizado.
 * O toast de sucesso é geralmente emitido pelo próprio modal de retirada.
 */
async function handleRetiradaConfirmada() {
  await fetchTransferenciasConfirmadasDaEscola(); // Atualiza a lista de estoque após retirada
}

/**
 * @async
 * @function carregarDadosCompletos
 * @description Função agregadora para carregar todos os dados necessários para a view.
 * Primeiro busca os detalhes da escola, e se bem-sucedido, busca as transferências e pendências.
 */
async function carregarDadosCompletos() {
  await fetchDetalhesEscola();
  // Só prossegue para buscar transferências se os detalhes da escola foram carregados sem erro
  if (detalhesEscola.value && !error.value) {
      await fetchTransferenciasConfirmadasDaEscola();
      await checkTransferenciasPendentes();
  }
}

// --- BLOCO 6: HOOKS DE CICLO DE VIDA E WATCHERS ---
/**
 * @hook onMounted
 * @description Executado quando o componente é montado.
 * Carrega os dados do usuário logado e, em seguida, todos os dados da escola.
 */
onMounted(() => {
  loadCurrentUser(); // Carrega o usuário para determinar permissões
  carregarDadosCompletos(); // Carrega os dados da escola
});

/**
 * @watcher escolaId
 * @description Observa mudanças no `escolaId` (proveniente da rota).
 * Se o ID mudar (ex: navegação entre detalhes de diferentes escolas), recarrega
 * todos os dados para a nova escola.
 * `immediate: false` para não executar na montagem inicial, pois `onMounted` já faz isso.
 */
watch(escolaId, (newId, oldId) => {
  if (newId && newId !== oldId) { // Se o ID é válido e diferente do anterior
    loadCurrentUser(); // Recarrega o usuário também, caso permissões dependam da nova escola
    carregarDadosCompletos();
  }
}, { immediate: false }); // Não executa imediatamente na montagem
</script>

<style scoped>
/* Adicionar estilos para .titulo-com-botao e .btn-retirar-estoque */
/* ... (estilos já fornecidos e comentados anteriormente) ... */
/* O CSS importado de './EscolaDetalhesView.css' cuidará da maior parte da estilização. */
/* Estilos scoped específicos são para elementos adicionados/modificados nesta view. */

.titulo-com-botao {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem; /* Espaçamento abaixo do título e botão */
}

.titulo-com-botao h2 {
  margin-bottom: 0; /* Remove margem padrão do h2 se o container flex já cuida do espaçamento */
}

.btn-retirar-estoque {
  background-color: #ffc107; /* Cor de destaque (amarelo/alerta) */
  color: #212529; /* Texto escuro para bom contraste */
  border: 1px solid #ffc107;
  padding: 8px 12px; /* Preenchimento do botão */
  border-radius: 5px; /* Bordas arredondadas */
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  display: inline-flex; /* Para alinhar ícone e texto */
  align-items: center; /* Alinhamento vertical */
  gap: 6px; /* Espaço entre ícone e texto */
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out; /* Transição suave */
}

.btn-retirar-estoque:hover {
  background-color: #e0a800; /* Cor mais escura no hover */
  border-color: #d39e00;
}

.btn-retirar-estoque svg {
  margin-right: 4px; /* Espaço adicional se `gap` não for suportado por todos os navegadores */
}

.btn-retirar-estoque:disabled {
  background-color: #e9ecef; /* Cor para botão desabilitado */
  border-color: #ced4da;
  color: #6c757d;
  cursor: not-allowed; /* Cursor indicando não permitido */
}

/* Estilos para a mensagem de modo de visualização */
.view-only-message {
    background-color: #fff3cd; /* Amarelo claro, tom de aviso */
    color: #856404; /* Texto escuro para contraste */
    border: 1px solid #ffeeba;
    padding: 1rem;
    border-radius: 0.25rem;
    margin-top: 1.5rem; /* Espaço acima da mensagem */
    text-align: center;
}
.view-only-message p {
    margin: 0;
}

/* Animação e indicador para botão de confirmação com pendências */
/* (Já incluso no CSS global de EscolaDetalhesView.css, mas repetido aqui para clareza se fosse local) */
.btn-confirmar-recebimento.has-pending-animation {
    animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
    0% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(255, 82, 82, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0); }
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
/* ... (o restante do CSS já está no arquivo EscolaDetalhesView.css importado) ... */
</style>