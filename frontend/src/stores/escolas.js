// frontend/src/stores/escolas.js
import { defineStore } from 'pinia';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

let pollingInterval = null;

export const useEscolasStore = defineStore('escolas', {
    state: () => ({
        escolas: [],
        loading: false,
        error: null,
        isPollingActive: false,
    }),
    getters: {
        listaEscolas: (state) => state.escolas,
        isLoading: (state) => state.loading,
    },
    actions: {
        clearError() {
            this.error = null;
        },

        // --- Buscar todas as escolas (COM STATUS DE ESTOQUE) ---
        async fetchEscolas() {
            this.loading = true;
            this.error = null;
            const token = localStorage.getItem('authToken');
            if (!token) {
                this.error = 'Token de autenticação não encontrado.';
                this.loading = false;
                return;
            }

            try {
                // MODIFICAÇÃO PRINCIPAL: Alterar a URL para o novo endpoint que inclui o status do estoque.
                const response = await axios.get(`${API_URL}/escolas/com-status-estoque`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                this.escolas = response.data || [];
            } catch (err) {
                console.error('Erro ao buscar escolas com status:', err.response?.data || err.message);
                this.error = err.response?.data?.message || 'Falha ao buscar escolas.';
                 if (err.response?.status === 401) {
                    this.error = 'Sessão inválida ou expirada. Faça login novamente.';
                 }
            } finally {
                this.loading = false;
            }
        },

        startPolling() {
            // Se o polling já estiver rodando, não faça nada.
            if (this.isPollingActive) return;

            console.log("🍍 Iniciando polling global de escolas na store...");
            this.isPollingActive = true;
            
            // Busca os dados imediatamente ao iniciar
            this.fetchEscolas(); 
            
            pollingInterval = setInterval(() => {
                console.log("🍍 Polling: buscando atualizações de escolas...");
                this.fetchEscolas();
            }, 30000); // Podemos aumentar o intervalo para 30s para economizar recursos
        },

        stopPolling() {
            if (!this.isPollingActive) return;
            
            console.log("🍍 Parando polling global de escolas.");
            clearInterval(pollingInterval);
            pollingInterval = null;
            this.isPollingActive = false;
        },

        // --- Adicionar uma nova escola ---
        async addEscola(escolaData) {
            this.loading = true;
            this.error = null;
            const token = localStorage.getItem('authToken');
             if (!token) {
                this.error = 'Token de autenticação não encontrado.';
                this.loading = false;
                throw new Error('Não autenticado');
            }

            try {
                const response = await axios.post(`${API_URL}/escolas`, escolaData, {
                     headers: { Authorization: `Bearer ${token}` }
                });
                
                 // MODIFICAÇÃO DE CONSISTÊNCIA: Em vez de adicionar localmente, recarregamos a lista inteira.
                 // Isso garante que a nova escola também tenha seu status de estoque calculado e exibido.
                 await this.fetchEscolas();

                 return response.data; // Retorna a nova escola como confirmação para o componente.
             } catch (err) {
                 console.error('Erro ao adicionar escola:', err.response?.data || err.message);
                 this.error = err.response?.data?.message || 'Falha ao cadastrar escola.';
                 throw new Error(this.error);
             } finally {
                 this.loading = false;
             }
        },

        // --- Excluir uma escola ---
        async deleteEscola(id) {
            this.loading = true;
            this.error = null;
            const token = localStorage.getItem('authToken');
            if (!token) {
                this.error = 'Token de autenticação não encontrado.';
                this.loading = false;
                throw new Error('Não autenticado');
            }

            try {
                await axios.delete(`${API_URL}/escolas/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // A remoção local é segura, pois não precisamos mais dos dados do item removido.
                this.escolas = this.escolas.filter(escola => escola.id !== id);
            } catch (err) {
                console.error('Erro ao excluir escola:', err.response?.data || err.message);
                this.error = err.response?.data?.message || 'Falha ao excluir escola.';
                throw new Error(this.error);
            } finally {
                this.loading = false;
            }
        },

         // --- Atualizar Escola ---
         async updateEscola(id, escolaData) {
             this.loading = true;
             this.error = null;
             const token = localStorage.getItem('authToken');
              if (!token) {
                 this.error = 'Token de autenticação não encontrado.';
                 this.loading = false;
                 throw new Error('Não autenticado');
              }

             try {
                 const dataToSend = {
                     nome: escolaData.nome,
                     endereco: escolaData.endereco,
                     responsavel: escolaData.responsavel
                 };

                 const response = await axios.put(`${API_URL}/escolas/${id}`, dataToSend, {
                     headers: { Authorization: `Bearer ${token}` }
                 });

                 // MODIFICAÇÃO DE CONSISTÊNCIA: Recarregamos a lista em vez de atualizar localmente.
                 // Isso garante que a lista seja reordenada corretamente se o nome mudar e
                 // que o status do estoque permaneça visível.
                 await this.fetchEscolas();
                 
                 return response.data;

             } catch (err) {
                 console.error('Erro ao atualizar escola:', err.response?.data || err.message);
                 this.error = err.response?.data?.message || 'Falha ao atualizar escola.';
                 throw new Error(this.error);
             } finally {
                 this.loading = false;
             }
         }
    },
});