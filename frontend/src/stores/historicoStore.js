// frontend/src/stores/historicoStore.js
import { defineStore } from 'pinia';
import { useToast } from 'vue-toastification';

const toast = useToast();

export const useHistoricoStore = defineStore('historico', {
  state: () => ({
    historicoEnviosSME: [], // Armazena o histórico de envios feitos pela SME
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchHistoricoEnviosSME() {
      if (this.isLoading) return; // Evita chamadas duplicadas
      this.isLoading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          this.error = "Token de autenticação não encontrado.";
          toast.error("Sessão inválida. Faça login novamente.");
          // Idealmente, redirecionar para login aqui
          return;
        }

        const response = await fetch('http://localhost:3000/api/transferencias/historico-sme', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('authToken');
          this.error = "Acesso não autorizado ou sessão expirada.";
          toast.error(this.error + " Faça login novamente.");
          // Redirecionar para login
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `Falha ao buscar histórico (Status: ${response.status})` }));
          throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }

        this.historicoEnviosSME = await response.json();
      } catch (err) {
        console.error("Erro ao buscar histórico de envios SME:", err);
        this.error = err.message || 'Ocorreu um erro desconhecido ao buscar o histórico.';
        toast.error(this.error);
        this.historicoEnviosSME = []; // Limpa em caso de erro para não mostrar dados antigos
      } finally {
        this.isLoading = false;
      }
    },
    clearError() {
      this.error = null;
    }
  },
  getters: {
    // Você pode adicionar getters se precisar de dados computados do histórico
    // Ex: totalEnvios: (state) => state.historicoEnviosSME.length,
  }
});