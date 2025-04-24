// frontend/src/stores/escolas.js
import { defineStore } from 'pinia';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const useEscolasStore = defineStore('escolas', {
    state: () => ({
        escolas: [],
        loading: false,
        error: null, // Erro geral do store
    }),
    getters: {
        listaEscolas: (state) => state.escolas,
        isLoading: (state) => state.loading,
    },
    actions: {
        // --- Limpar Erro ---
        clearError() {
            this.error = null;
        },

        // --- Buscar todas as escolas ---
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
                const response = await axios.get(`${API_URL}/escolas`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Garante que sempre seja um array
                this.escolas = response.data || [];
            } catch (err) {
                console.error('Erro ao buscar escolas:', err.response?.data || err.message);
                // Usa uma mensagem mais específica para falha na busca
                this.error = err.response?.data?.message || 'Falha ao buscar escolas.';
                 // Se for 401, pode adicionar uma mensagem específica
                 if (err.response?.status === 401) {
                    this.error = 'Sessão inválida ou expirada. Faça login novamente.';
                    // Opcional: Limpar token local se for inválido
                    // localStorage.removeItem('authToken');
                    // localStorage.removeItem('authUser');
                    // Idealmente, o guardião de rotas deve pegar isso e redirecionar
                 }
            } finally {
                this.loading = false;
            }
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
                 this.escolas.push(response.data);
                 this.escolas.sort((a, b) => a.nome.localeCompare(b.nome));
                 return response.data;
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
                this.escolas = this.escolas.filter(escola => escola.id !== id);
            } catch (err) {
                console.error('Erro ao excluir escola:', err.response?.data || err.message);
                this.error = err.response?.data?.message || 'Falha ao excluir escola.';
                throw new Error(this.error);
            } finally {
                this.loading = false;
            }
        },

         // --- Ação para Atualizar Escola ---
         // *** IMPLEMENTADO/REFINADO ***
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
                 // Cria uma cópia para não enviar o ID no corpo se não for necessário pela API
                 const dataToSend = {
                     nome: escolaData.nome,
                     endereco: escolaData.endereco,
                     cidade: escolaData.cidade,
                     uf: escolaData.uf,
                     responsavel: escolaData.responsavel
                 };

                 const response = await axios.put(`${API_URL}/escolas/${id}`, dataToSend, {
                     headers: { Authorization: `Bearer ${token}` }
                 });

                 // Atualizar a escola na lista local
                 const index = this.escolas.findIndex(e => e.id === id);
                 if (index !== -1) {
                     this.escolas[index] = response.data; // Usa a resposta da API
                     this.escolas.sort((a, b) => a.nome.localeCompare(b.nome));
                 } else {
                     console.warn(`Escola ID ${id} não encontrada localmente após update. Refetching.`);
                     await this.fetchEscolas(); // Fallback: recarrega tudo
                 }
                 return response.data; // Retorna para o componente

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