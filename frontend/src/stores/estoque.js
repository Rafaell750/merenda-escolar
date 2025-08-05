import { defineStore } from 'pinia';
import { useToast } from 'vue-toastification';

const API_URL = import.meta.env.VITE_API_BASE_URL;
const toast = useToast();

export const useEstoqueStore = defineStore('estoqueSME', {
  state: () => ({
    produtos: [], // Armazenará a lista de produtos do estoque da SME
    isLoading: false,
    error: null,
  }),
  getters: {
    // Getter para encontrar rapidamente a quantidade de um produto pelo nome.
    // Isso será crucial para a performance, evitando loops repetidos.
    getEstoquePorNome: (state) => (nomeProduto) => {
      const produto = state.produtos.find(p => p.nome.trim().toLowerCase() === nomeProduto.trim().toLowerCase());
      return produto ? Number(produto.quantidade) : 0; // Retorna 0 se o produto não estiver no estoque
    },

        // --- NOVO GETTER POR ID (MUITO MAIS ROBUSTO) ---
    getProdutoPorId: (state) => (idProduto) => {
      // Usamos '==' para comparar, pois o ID pode vir como string ou número
      const produto = state.produtos.find(p => p.id == idProduto); 
      return produto || null; // Retorna o objeto do produto inteiro ou null
    },
  },
  
  actions: {
    // Action para buscar os dados do estoque da API (SME).
    async fetchEstoqueSME() {
      // Se já temos os dados, não busca de novo para economizar chamadas de API.
      if (this.produtos.length > 0) {
        return;
      }
      
      this.isLoading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error("Usuário não autenticado.");

        const response = await fetch(`${API_URL}/produtos`, { // Usa o endpoint GET /api/produtos
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Falha ao buscar o estoque da SME.');
        }

        this.produtos = await response.json();
      } catch (err) {
        console.error("Erro ao buscar estoque da SME:", err);
        this.error = err.message;
        toast.error(this.error);
      } finally {
        this.isLoading = false;
      }
    },
  },
});