// frontend/src/stores/notifications.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const useNotificationsStore = defineStore('notifications', () => {
    // --- ESTADO ---
    const notificacoes = ref([]);
    const isLoading = ref(false);
    const error = ref(null);
    // Novas propriedades de estado para paginação
    const currentPage = ref(1);
    const totalPages = ref(1);
    const itemsPerPage = ref(10); // Corresponde ao `limit` no backend

    // Estado para a contagem global de não lidos
    const totalUnreadCount = ref(0);

    // --- PROPRIEDADE COMPUTADA ---
    // Agora, unreadCount simplesmente retorna o valor que veio da API,
    // em vez de calcular com base na lista da página atual.
    const unreadCount = computed(() => totalUnreadCount.value);

    // --- ACTIONS ---


    async function fetchUnreadCount() {
        try {
            const token = localStorage.getItem('authToken');
            
            
            const response = await axios.get(`${API_URL}/notificacoes/unread-count`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (response.data && typeof response.data.unreadCount === 'number') {
                totalUnreadCount.value = response.data.unreadCount;
            }
        } catch (err) {
            // Silenciosamente loga o erro, pois é uma verificação de fundo.
            
            console.error('Falha ao verificar contagem de notificações:', err);
        }
    }

    function addNotificacao(notificacao) {
        const existe = notificacoes.value.some(n => n.id === notificacao.id);
        if (!existe) {
            notificacoes.value.unshift(notificacao);
            // Poderia ter lógica aqui para refetch a página 1 se uma nova notificação chega
        }
    }
    
    async function confirmarDevolucao(notificacaoId) {
        const notificacaoParaConfirmar = notificacoes.value.find(n => n.id === notificacaoId);
        if (!notificacaoParaConfirmar || notificacaoParaConfirmar.lida) return;
        
        notificacaoParaConfirmar.lida = true;
        totalUnreadCount.value--; 

        
        const token = localStorage.getItem('authToken');

        try {
            await axios.post(`${API_URL}/notificacoes/confirmar-devolucao`, 
                { notificacao_id: notificacaoId }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Opcional: Recarregar a página atual para refletir o estado do backend
            // await fetchNotificacoes(currentPage.value);
        } catch (err) {
            console.error("Erro ao confirmar devolução:", err);
            notificacaoParaConfirmar.lida = false;
            totalUnreadCount.value++;
        }
    }

    // Ação de busca atualizada para lidar com paginação
async function fetchNotificacoes(page = 1) {
        if (isLoading.value) return;

        isLoading.value = true;
        error.value = null;
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`${API_URL}/notificacoes`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { page: page, limit: itemsPerPage.value }
            });

            // Desestrutura a resposta para pegar os novos dados
            const { data, pagination, totalUnreadCount: unreadCountFromApi } = response.data;

            const dadosNormalizados = data.map(notificacao => ({
                ...notificacao,
                lida: Boolean(notificacao.lida)
            }));
            
            notificacoes.value = dadosNormalizados;
            currentPage.value = pagination.currentPage;
            totalPages.value = pagination.totalPages;
            
            // ATUALIZA A CONTAGEM GLOBAL
            totalUnreadCount.value = unreadCountFromApi;

        } catch (err) {
            console.error("Erro ao buscar notificações:", err);
            error.value = err.response?.data?.error || "Falha ao carregar notificações.";
            notificacoes.value = [];
            currentPage.value = 1;
            totalPages.value = 1;
            totalUnreadCount.value = 0; // Zera a contagem em caso de erro
        } finally {
            isLoading.value = false;
        }
    }
    
    async function marcarComoLida(notificacaoId) {
        const notificacaoParaMarcar = notificacoes.value.find(n => n.id === notificacaoId);
        if (!notificacaoParaMarcar || notificacaoParaMarcar.lida) return;

        // Atualização otimista
        notificacaoParaMarcar.lida = true;
        totalUnreadCount.value--; // Diminui a contagem imediatamente

        const token = localStorage.getItem('authToken');
        try {
            await axios.put(`${API_URL}/notificacoes/${notificacaoId}/marcar-lida`, {}, {
                 headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error("Erro ao marcar notificação como lida no backend:", err);
            // Rollback
            notificacaoParaMarcar.lida = false;
            totalUnreadCount.value++;
        }
    }

    // Exporta as novas propriedades e a ação atualizada
    return {
        notificacoes,
        isLoading,
        error,
        unreadCount,
        currentPage,
        totalPages,
        addNotificacao,
        fetchNotificacoes,
        confirmarDevolucao,
        marcarComoLida,
        fetchUnreadCount
    };
});