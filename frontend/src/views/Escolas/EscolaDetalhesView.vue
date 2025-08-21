<!--
  /frontend/src/views/Escolas/EscolaDetalhesView.vue

  Visão Geral (desatualizado, criado uma nova "função" para retirada de estoque):
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
      </div>

      <!-- 4. SEÇÃO DE ESTOQUE RECEBIDO -->
      <!-- Exibido após o carregamento inicial dos detalhes da escola. -->
      <section class="estoque-recebido-section" v-if="!loading">
          <!-- Título da seção e botão "Retirar Estoque" -->
          <div class="titulo-com-botao">
            <h2>Estoque Recebido</h2>
            <div class="botoes-acao-estoque"><!-- Wrapper para os botões -->
            <!--
              Botão para retirar estoque.
              - `v-if`: Visível se houver itens e o usuário puder interagir.
              - `:disabled`: Desabilitado se o usuário não puder interagir.
            -->
            <button
                v-if="itensConsolidados.length > 0 && podeInteragirComEstoque"
                type="button"
                @click="abrirModalRetirarEstoque"
                class="btn-retirar-estoque btn-acao-estoque"
                title="Retirar itens do estoque"
                :disabled="!podeInteragirComEstoque"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-up-right" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5"/>
                    <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z"/>
                </svg>
                Retirar Estoque
            </button>
            <!-- NOVO BOTÃO DE HISTÓRICO -->
          <button
            type="button"
            @click="abrirModalHistoricoRetiradas"
            class="btn-historico-retiradas btn-acao-estoque"
            title="Ver histórico de retiradas"
            :disabled="loadingRetiradas" 
            v-if="podeInteragirComEstoque || userRole === 'admin'"   
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
              <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.798a7 7 0 0 0-.653-.796l.724-.69q.406.429.746.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.099-.415l.99-.155a8 8 0 0 1 .122.918l-.973.149a7 7 0 0 0-.046-.39m-.985 1.502a7 7 0 0 0 .258-.404l.866.505a8 8 0 0 1-.494.913l-.832-.54a7 7 0 0 0 .202-.375m-.914 1.205a7 7 0 0 0 .481-.348l.699.735a8 8 0 0 1-.854.867l-.547-.809a7 7 0 0 0 .322-.397m-.964 1.043a7 7 0 0 0 .653.261l.28-.975a8 8 0 0 1-1.185-.398l-.003.001q-.51.16-1.028.295l-.288.971a7 7 0 0 0 .613.237m1.834-1.024q.57.217 1.083.386l.22-.976a8 8 0 0 1-1.082-.387l-.218.975m.53 2.507a7 7 0 0 0 .099.415l-.99.155a8 8 0 0 1-.122-.918l.973-.149a7 7 0 0 0 .046.39M8 1a7 7 0 1 0 4.95 11.95A7 7 0 0 0 8 1m-.002 14a8 8 0 1 1 0-16 8 8 0 0 1 0 16M6.5 7.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5z"/>
              <path d="M8.5 5.001a.5.5 0 0 1 .5.5V7h1.5a.5.5 0 0 1 0 1H9v1.5a.5.5 0 0 1-1 0V8H6.5a.5.5 0 0 1 0-1H8V5.5a.5.5 0 0 1 .5-.5"/>
            </svg>
            Histórico de Retiradas
          </button>
        </div>
      </div>

          <!-- Mensagens de estado para o carregamento do histórico de transferências -->
          <div v-if="loadingTransferencias" class="loading-message small">Carregando histórico...</div>
          <div v-if="errorTransferencias" class="error-message small">{{ errorTransferencias }}</div>

          <!-- NOVO COMPONENTE DE ALERTA -->
          <EstoqueAlertas 
              v-if="!loadingTransferencias && itensComAlerta.length > 0"
              :produtos-com-alerta="itensComAlerta" 
              class="mb-3"
          />

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

       <!-- MODAL DE HISTÓRICO -->
      <HistoricoRetiradasModal
          :show="showHistoricoRetiradasModal"
          :escola-id="escolaId"
          :escola-nome="escolaNome"
          :historico-retiradas="retiradasDaEscola"
          :loading="loadingRetiradas"
          :error="errorRetiradas"
          @close="showHistoricoRetiradasModal = false"
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
import HistoricoRetiradasModal from './Historico/HistoricoRetiradasModal.vue';
import EstoqueAlertas from '@/views/Produtos/EstoqueAlertas.vue';


const route = useRoute(); // Instância para informações da rota atual.
const toast = useToast(); // Instância do serviço de toast.

// --- BLOCO 2: ESTADO LOCAL DO COMPONENTE (REFS) ---
// Estado para detalhes da escola
const escolaId = computed(() => parseInt(route.params.id, 10)); // ID da escola da URL, convertido para número.
const escolaNome = ref('');             // Nome da escola, carregado da API.
const detalhesEscola = ref(null);       // Objeto com detalhes cadastrais da escola.
const loading = ref(false);             // Estado de carregamento dos detalhes da escola.
const error = ref(null);                // Mensagem de erro ao carregar detalhes da escola.

// Estado para transferências confirmadas (histórico de estoque ENTRADA)
const transferenciasConfirmadas = ref([]); // Array de transferências confirmadas.
const loadingTransferencias = ref(false); // Estado de carregamento das transferências.
const errorTransferencias = ref(null);    // Mensagem de erro ao carregar transferências.

//Estado para retiradas de estoque (SAÍDA)
const retiradasDaEscola = ref([]);
const loadingRetiradas = ref(false);
const errorRetiradas = ref(null);

// Estado para controle dos modais
const showConfirmarModal = ref(false);       // Visibilidade do modal de confirmação.
const showRetirarEstoqueModal = ref(false); // Visibilidade do modal de retirada.
const showHistoricoRetiradasModal = ref(false);

// Estado para transferências pendentes (para animação do botão)
const temTransferenciasPendentes = ref(false);    // Indica se há transferências pendentes.
const loadingStatusPendentes = ref(false);     // Estado de carregamento da verificação de pendências.

// URL base da API (do .env ou fallback)
const API_URL = import.meta.env.VITE_API_BASE_URL;

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
    // 1. UNIFICAR TRANSAÇÕES
    const entradas = transferenciasConfirmadas.value.flatMap(transferencia => {
        // A propriedade correta para a data da transação confirmada
        const dataString = transferencia.data_recebimento_confirmado_formatada;
        
        return (transferencia.itens || []).map(item => ({
            tipo: 'entrada',
            data: parsePtBrDate(dataString),
            produto_id: parseInt(item.produto_id, 10),
            nome_produto: item.nome_produto,
            unidade_medida: item.unidade_medida,
            quantidade: parseFloat(item.quantidade_enviada),
            data_formatada: dataString, // Mantemos a string original para exibição
            nome_usuario: transferencia.nome_usuario,
            original_transferencia_id: transferencia.transferencia_id,
            item_id_original: item.id || item.item_id
        }));
    });

const saidas = retiradasDaEscola.value.map(retirada => {
        // A propriedade correta para a data da retirada
        const dataString = retirada.data_retirada_formatada;
        
        return {
            tipo: 'saida',
            data: parsePtBrDate(dataString), // Usando a função robusta
            // ... resto das propriedades ...
            produto_id: parseInt(retirada.produto_id, 10),
            nome_produto: retirada.nome_produto,
            unidade_medida: retirada.unidade_medida,
            quantidade: parseFloat(retirada.quantidade_retirada)
        };
    });

    const transacoes = [...entradas, ...saidas];

     // Remove quaisquer transações que não puderam ter a data convertida
     const transacoesValidas = transacoes.filter(t => t.data && !isNaN(t.data.getTime()));

    // 2. ORDENAÇÃO COM CRITÉRIO DE DESEMPATE
    transacoesValidas.sort((a, b) => {
        // Primeiro, tenta ordenar pela data
        const dateDiff = a.data - b.data;
        if (dateDiff !== 0) {
            return dateDiff; // Se as datas forem diferentes, usa a diferença
        }
        
        // Se as datas são idênticas, entra o critério de desempate:
        // Queremos processar 'saida' (-1) antes de 'entrada' (1).
        // Isso força as saídas a terem prioridade quando o timestamp é o mesmo.
        if (a.tipo === 'saida' && b.tipo === 'entrada') {
            return -1; // 'a' (saida) vem antes
        }
        if (a.tipo === 'entrada' && b.tipo === 'saida') {
            return 1; // 'b' (saida) vem antes
        }
        
        // Se os tipos também forem iguais, a ordem não importa.
        return 0;
    });

    // 3. PROCESSAR TRANSAÇÕES PARA CALCULAR SALDO E PICO DE ESTOQUE
    const agregador = new Map();

    // Itera sobre a lista de transações JÁ ORDENADA
    for (const transacao of transacoesValidas) {
        if (isNaN(transacao.produto_id)) continue;

        const chaveAgregacao = `${transacao.produto_id}|${transacao.unidade_medida}`;
        
        // Se o produto ainda não está no nosso mapa, inicializa-o.
        if (!agregador.has(chaveAgregacao)) {
            agregador.set(chaveAgregacao, {
                _id_vfor: chaveAgregacao,
                produto_id: transacao.produto_id,
                nome_produto: transacao.nome_produto,
                unidade_medida: transacao.unidade_medida,
                quantidade_total: 0,
                picoDeEstoque: 0, // A referência para o alerta
                ultima_data_recebimento_formatada: 'N/A',
                ultimo_nome_usuario: 'N/A',
                historico_detalhado: [],
            });
        }
        
        const itemAgregado = agregador.get(chaveAgregacao);
        
        // --- LÓGICA CORRIGIDA E EXPLÍCITA ---
        // Primeiro, aplica a transação ao saldo atual.
        if (transacao.tipo === 'entrada') {
            itemAgregado.quantidade_total += transacao.quantidade;
        } else if (transacao.tipo === 'saida') {
            itemAgregado.quantidade_total -= transacao.quantidade;
        }
        
        // Segundo, DEPOIS de atualizar o saldo, compara-o com o pico de estoque.
        // Se o saldo atual for o maior que já vimos, ele se torna o novo pico.
        if (itemAgregado.quantidade_total > itemAgregado.picoDeEstoque) {
            itemAgregado.picoDeEstoque = itemAgregado.quantidade_total;
        }
        
        // Adiciona informações ao histórico detalhado (apenas para entradas)
        if (transacao.tipo === 'entrada') {
            itemAgregado.historico_detalhado.push({
                data_formatada: transacao.data_formatada,
                nome_usuario: transacao.nome_usuario,
                quantidade_enviada: transacao.quantidade,
                original_transferencia_id: transacao.original_transferencia_id,
                item_id_original: transacao.item_id_original,
                produto_id: transacao.produto_id
            });
            itemAgregado.ultima_data_recebimento_formatada = transacao.data_formatada;
            itemAgregado.ultimo_nome_usuario = transacao.nome_usuario;
        }
    }
    
    // 4. GERAR O RESULTADO FINAL
    const resultadoArray = Array.from(agregador.values())
        .filter(item => item.quantidade_total >= 0);

    // Ordena o resultado final alfabeticamente pelo nome do produto
    resultadoArray.sort((a, b) => a.nome_produto.localeCompare(b.nome_produto));
    
    // Inverte o histórico detalhado para mostrar os mais recentes primeiro na UI
    resultadoArray.forEach(item => {
        item.historico_detalhado.reverse();
    });

    // Mapeia para o formato final, compatível com o resto do componente
    return resultadoArray.map(item => ({
        ...item,
        // *** AQUI ESTÁ A MÁGICA ***
        // A referência para o alerta é agora o pico de estoque que o produto já atingiu na escola.
        quantidade_referencia_alerta: item.picoDeEstoque, 
        
        // Alias para compatibilidade com o componente EstoqueAlertas.vue
        quantidade: item.quantidade_total,
        nome: item.nome_produto
    }));
});

const itensComAlerta = computed(() => {
  if (!itensConsolidados.value) return [];
  
  return itensConsolidados.value.filter(item => {
    // Renomeado para `item.quantidade_total` para maior clareza aqui.
    const estoqueAtual = item.quantidade_total;
    const referencia = item.quantidade_referencia_alerta;

    if (estoqueAtual === 0) {
      return true; // Alerta de estoque zerado
    }

    if (referencia && referencia > 0 && estoqueAtual > 0 && estoqueAtual <= referencia / 2) {
      return true; // Alerta de metade do estoque
    }
    
    return false;
  }).map(item => ({ // Garante que a prop `nome` exista, como esperado por EstoqueAlertas.vue
      ...item,
      nome: item.nome_produto 
  }));
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
 * Converte uma string de data 'dd/mm/yyyy hh:mm' ou 'dd/mm/yyyy hh:mm:ss' para um objeto Date válido.
 * @param {string} dateString - A data no formato pt-BR.
 * @returns {Date|null} Um objeto Date válido ou null se a entrada for inválida.
 */
 function parsePtBrDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    // Se a entrada não for uma string válida, retorna null.
    return null;
  }

  // Divide a string em partes de data e hora
  const parts = dateString.split(' ');
  const dateParts = parts[0].split('/');
  const timeParts = parts[1] ? parts[1].split(':') : [0, 0, 0];
  
  // Verifica se temos as 3 partes da data (dia, mês, ano)
  if (dateParts.length !== 3) {
    console.warn(`[parsePtBrDate] Formato de data inválido, não foi possível dividir em dia/mês/ano: "${dateString}"`);
    return new Date(dateString); // Tenta um fallback
  }

  // Reconstrói a data no formato ISO (YYYY-MM-DDTHH:MM:SS) que é universal
  // O construtor Date(ano, mês-1, dia, ...) também é uma opção segura.
  const [day, month, year] = dateParts;
  const [hour, minute, second] = timeParts;
  
  // O mês no construtor do Date é baseado em zero (0=Janeiro, 11=Dezembro)
  const isoDate = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
  
  // Verifica se a data resultante é válida
  if (isNaN(isoDate.getTime())) {
    console.warn(`[parsePtBrDate] A data resultante é inválida para a string: "${dateString}"`);
    return null; // Retorna null para indicar falha
  }

  return isoDate;
}

/**
 * @async
 * @function fetchRetiradasDaEscola  <--- DEFINIÇÃO DA FUNÇÃO
 * @description Busca o histórico de retiradas de estoque para a escola.
 */
 async function fetchRetiradasDaEscola() {
    loadingRetiradas.value = true;
    errorRetiradas.value = null;
    retiradasDaEscola.value = []; // Limpa antes de buscar
    const token = localStorage.getItem('authToken');
    if (!token) {
        errorRetiradas.value = 'Não autenticado.';
        loadingRetiradas.value = false;
        return;
    }
    try {
        const response = await axios.get(`${API_URL}/escolas/${escolaId.value}/estoque/retiradas`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        retiradasDaEscola.value = response.data.map(r => ({
            ...r,
            produto_id: parseInt(r.produto_id, 10),
        }));
    } catch (err) {
        console.error('Erro ao buscar retiradas da escola:', err);
        errorRetiradas.value = err.response?.data?.error || 'Falha ao carregar histórico de retiradas.';
        // Adicione um toast aqui se quiser notificar o usuário sobre o erro na busca de retiradas
        // toast.error(errorRetiradas.value);
    } finally {
        loadingRetiradas.value = false;
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
  if (!token) { error.value = 'Sessão expirada. Faça Login novamente.'; loading.value = false; return; }
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
  await fetchRetiradasDaEscola(); // Atualiza a lista de estoque após retirada
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
    await Promise.all([
          fetchTransferenciasConfirmadasDaEscola(),
          fetchRetiradasDaEscola(), // ADICIONE A CHAMADA AQUI
          checkTransferenciasPendentes()
      ]);
  }
}

// NOVA FUNÇÃO PARA ABRIR O MODAL DE HISTÓRICO
function abrirModalHistoricoRetiradas() {
  // Os dados de 'retiradasDaEscola' já devem estar carregados por onMounted ou após uma retirada.
  // Se 'retiradasDaEscola' ainda não foi carregado ou estiver vazio,
  // o modal vai mostrar "Carregando..." ou "Nenhuma retirada..."
  showHistoricoRetiradasModal.value = true;
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
@import './EscolaDetalhesView.css'; /* Estilos específicos. */

.titulo-com-botao {
  display: flex; /* Já deve estar no .titulo-com-botao */
  justify-content: space-between; /* Já deve estar no .titulo-com-botao */
  align-items: center; /* Já deve estar no .titulo-com-botao */
  padding-bottom: 10px; /* Espaçamento abaixo da linha e antes do conteúdo abaixo */
  margin-bottom: 20px; /* Espaçamento após a linha e antes do conteúdo abaixo */
  border-bottom: 1px solid #dee2e6; /* Cor da linha - ajuste conforme necessário (ex: #ccc, #e0e0e0) */
}

.titulo-com-botao h2 {
  margin-bottom: 0; /* Remove margem padrão do h2 se o container flex já cuida do espaçamento */
}

.botoes-acao-estoque {
  display: flex;
  gap: 10px; /* Espaço entre os botões */
}

/* Classe base para os botões de ação da seção de estoque */
.btn-acao-estoque {
  padding: 8px 15px; /* Ajuste o padding */
  border: 1px solid transparent; /* Borda inicial transparente */
  border-radius: 5px; /* Bordas arredondadas */
  cursor: pointer;
  font-size: 0.95em; /* Tamanho da fonte */
  font-weight: 500;
  display: inline-flex; /* Para alinhar ícone e texto */
  align-items: center;
  gap: 6px; /* Espaço entre ícone e texto */
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, color 0.2s ease-in-out;
  text-decoration: none; /* Remove sublinhado se for usado como link */
  color: #fff; /* Cor do texto padrão (branco) */
}

.btn-acao-estoque svg {
  width: 16px; /* Tamanho do ícone */
  height: 16px;
  /* fill: currentColor; (geralmente herdado) */
}

.btn-acao-estoque:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* Estilo para o botão "Histórico" (exemplo, usando um azul) */
.btn-historico-retiradas {
  background-color: #007bff; /* Azul Bootstrap "primary" */
  border-color: #007bff;
  color: white;
}

.btn-historico-retiradas:hover:not(:disabled) {
  background-color: #0056b3; /* Azul mais escuro no hover */
  border-color: #0056b3;
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