import { defineStore } from 'pinia';
import { useToast } from 'vue-toastification';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const toast = useToast();
const ITEMS_PER_PAGE = 10;

// FUNÇÃO AUXILIAR PARA FORMATAR A DATA
/**
 * Formata uma string de data/hora (que vem da API em UTC) para o horário de Brasília.
 * @param {string | null} dataStringUTC - A data como string, ex: "2024-05-16 18:30:00".
 * @returns {string | null} A data formatada como "DD/MM/AAAA, HH:mm" ou null.
 */
const formatarDataParaBrasilia = (dataStringUTC) => {
  // Se a data for nula ou vazia, retorna null.
  if (!dataStringUTC) return null;

  try {
    // Passo A: Adiciona 'Z' ao final para garantir que o JavaScript interprete a data como UTC.
    // Isso transforma "2024-05-16 18:30:00" em "2024-05-16 18:30:00Z".
    const dataUTC = new Date(dataStringUTC + 'Z');

    // Passo B: Verifica se a data criada é válida.
    if (isNaN(dataUTC.getTime())) {
      console.warn("Data inválida recebida da API:", dataStringUTC);
      return 'Data Inválida';
    }

    // Passo C: Formata a data para o padrão pt-BR e fuso horário de São Paulo.
    return dataUTC.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    console.error("Erro ao formatar a data:", dataStringUTC, e);
    return 'Erro na Data'; // Retorna uma mensagem de erro se algo falhar.
  }
};


export const useHistoricoStore = defineStore('historico', {
  state: () => ({
    historicoEnviosSME: [],
    isLoading: false,
    error: null,
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
  }),
  actions: {
    async fetchHistoricoEnviosSME(filters = {}, page = 1) {
      if (Object.keys(filters).length === 0 && this.isLoading) {
        return;
      }
      this.isLoading = true;
      this.error = null;
      this.currentPage = page;
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
        const params = new URLSearchParams();
        if (filters.destino) params.append('destino', filters.destino);
        if (filters.dataInicio) params.append('dataInicio', filters.dataInicio);
        if (filters.dataFim) params.append('dataFim', filters.dataFim);
        params.append('page', this.currentPage);
        params.append('limit', ITEMS_PER_PAGE);
        const queryString = params.toString();
        const apiUrl = `${API_URL}/transferencias/historico-sme${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetch(apiUrl, {
          headers: { 'Authorization': `Bearer ${token}` },
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

        // FUNÇÃO PARA PROCESSAR OS DADOS DA API
        this.historicoEnviosSME = data.items.map(envio => {
          
          let parsedItens = [];
          if (Array.isArray(envio.itens)) {
            parsedItens = envio.itens;
          } else if (typeof envio.itens === 'string') {
            try {
              parsedItens = JSON.parse(envio.itens);
            } catch (e) {
              console.warn("Erro ao parsear 'itens':", e);
              parsedItens = [];
            }
          }
          
          // Supondo que o backend agora envia `data_envio` e `data_recebimento_confirmado`
          // sem formatação.
          return {
            ...envio, // Mantém todos os outros campos que vieram da API
            
            // Usamos nossa nova função para criar os campos formatados
            data_envio_formatada: formatarDataParaBrasilia(envio.data_envio) || 'Data Indisponível',
            data_recebimento_confirmado_formatada: formatarDataParaBrasilia(envio.data_recebimento_confirmado),

            itens: parsedItens,
          };
        });

        this.totalPages = data.totalPages;
        this.totalItems = data.totalItems;

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