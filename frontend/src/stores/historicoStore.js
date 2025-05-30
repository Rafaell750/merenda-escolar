// frontend/src/stores/historicoStore.js
import { defineStore } from 'pinia';
import { useToast } from 'vue-toastification';

const toast = useToast();
const ITEMS_PER_PAGE = 10; // Defina quantos itens por página

export const useHistoricoStore = defineStore('historico', {
  state: () => ({
    historicoEnviosSME: [],
    isLoading: false,
    error: null,
    // Novas propriedades para paginação
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
  }),
  actions: {
    // Modificado para aceitar filtros, mantendo a lógica original o máximo possível
    async fetchHistoricoEnviosSME(filters = {}, page = 1) { // Adicionado parâmetro filters
      // Lógica para evitar chamadas duplicadas:
      // Se é um refresh simples (sem filtros explícitos) E já está carregando, não faz nada.
      // Se filtros são passados (mesmo que vazios, indicando intenção de (re)filtrar), a chamada prossegue.
      if (Object.keys(filters).length === 0 && this.isLoading) {
        return;
      }

      this.isLoading = true;
      this.error = null;
      this.currentPage = page;

      // Se filtros estão sendo aplicados, limpar o histórico atual para uma melhor UX
      const hasActiveFilters = Object.values(filters).some(value => !!value);
      if (hasActiveFilters) {
        this.historicoEnviosSME = [];
      }

      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          this.error = "Token de autenticação não encontrado.";
          toast.error("Sessão inválida. Faça login novamente.");
          this.isLoading = false;
          return;
        }

        // Construir query params para a API
        const params = new URLSearchParams();
        if (filters.destino) {
          params.append('destino', filters.destino);
        }
        if (filters.dataInicio) {
          params.append('dataInicio', filters.dataInicio);
        }
        if (filters.dataFim) {
          params.append('dataFim', filters.dataFim);
        }

        params.append('page', this.currentPage); // Envia a página atual
        params.append('limit', ITEMS_PER_PAGE);  // Envia o limite de itens por página

        const queryString = params.toString();
        // Sua URL base. Adiciona a queryString se ela existir.
        const apiUrl = `http://localhost:3000/api/transferencias/historico-sme${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetch(apiUrl, { // URL modificada para incluir filtros
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('authToken');
          this.error = "Acesso não autorizado ou sessão expirada.";
          toast.error(this.error + " Faça login novamente.");
          this.historicoEnviosSME = [];
          this.isLoading = false;
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `Falha ao buscar histórico (Status: ${response.status})` }));
          throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }

        const data = await response.json();

        // Processamento dos dados para garantir o formato esperado pelo componente:
        // O componente HistoricoEnviosSME.vue espera:
        // - envio.data_envio_formatada
        // - envio.data_recebimento_confirmado_formatada
        // - envio.itens (como um array)
        // Se o seu backend já retorna os dados exatamente neste formato, o .map pode ser mais simples
        // ou até removido se o 'rawData' já for perfeito.
        // A lógica abaixo tenta garantir esses campos.
        this.historicoEnviosSME = data.items.map(envio => {
          let parsedItens = [];
          if (Array.isArray(envio.itens)) {
            parsedItens = envio.itens;
          } else if (envio.itens && typeof envio.itens === 'string') {
            try {
              const itemsString = envio.itens.trim();
              if (itemsString.startsWith('[') && itemsString.endsWith(']')) {
                parsedItens = JSON.parse(itemsString);
              } else if (itemsString.startsWith('{') && itemsString.endsWith('}')) {
                parsedItens = JSON.parse(`[${itemsString.replace(/}\s*{/g, '},{')}]`);
              } else if (itemsString) { // Se for uma string não vazia, não JSON de array/objeto
                console.warn("Campo 'itens' é uma string não JSON array/object:", envio.itens);
                // Você pode decidir como tratar isso, ex: atribuir a uma propriedade de erro_itens
                // ou deixar como array vazio.
              }
            } catch (e) {
              console.warn("Erro ao parsear 'itens' do envio na store:", e, "Dados originais:", envio.itens);
              parsedItens = [];
            }
          } else if (envio.itens && typeof envio.itens === 'object') { // Se for um objeto único
            parsedItens = [envio.itens];
          }

          return {
            ...envio, // Mantém todos os outros campos que vieram da API
            // Formata as datas se elas não vierem formatadas do backend
            data_envio_formatada: envio.data_envio_formatada || (envio.data_envio 
              ? new Date(envio.data_envio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
              : 'Data Indisponível'),
            data_recebimento_confirmado_formatada: envio.data_recebimento_confirmado_formatada || (envio.data_recebimento_confirmado 
              ? new Date(envio.data_recebimento_confirmado).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
              : null),
            itens: parsedItens, // Usa os itens parseados ou originais se já eram array
            // Se o backend já envia 'nome_usuario_confirmacao', 'usuario_sme_nome', 'nome_escola', etc.
            // eles serão preservados pelo ...envio.
          };
        });
        this.totalPages = data.totalPages;
        this.totalItems = data.totalItems;
        // this.currentPage já foi setado no início da action

      } catch (err) {
        console.error("Erro ao buscar histórico de envios SME:", err);
        this.error = err.message || 'Ocorreu um erro desconhecido ao buscar o histórico.';
        toast.error(this.error);
        this.historicoEnviosSME = [];
      } finally {
        this.isLoading = false;
      }
    },
    clearError() {
      this.error = null;
    }
  },
  getters: {
    // Seus getters existentes
  }
});