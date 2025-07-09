import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios'; // Certifique-se de que o axios está importado

export const useNotificationsStore = defineStore('notifications', () => {
    const notificacoes = ref([]);
    const isLoading = ref(false);
    const error = ref(null);

    // Propriedade computada para contar apenas as notificações não lidas.
    // Esta propriedade é reativa: ela será recalculada automaticamente sempre
    // que o array 'notificacoes' ou a propriedade 'lida' de qualquer item mudar.
    const unreadCount = computed(() => {
        return notificacoes.value.filter(n => n.lida === false).length;
    });

    function addNotificacao(notificacao) {
        // Verifica se a notificação já existe para evitar duplicatas
        const existe = notificacoes.value.some(n => n.id === notificacao.id);
        if (!existe) {
            notificacoes.value.unshift(notificacao);
        }
    }
    
    // Ação para chamar a nova rota de confirmação
    async function confirmarDevolucao(notificacaoId) {

        const notificacaoParaConfirmar = notificacoes.value.find(n => n.id === notificacaoId);
        if (!notificacaoParaConfirmar || notificacaoParaConfirmar.lida) return;
        
        // Atualização otimista
        notificacaoParaConfirmar.lida = true; 

        const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
        const token = localStorage.getItem('authToken');

        try {
            await axios.post(`${API_URL}/notificacoes/confirmar-devolucao`, 
                { notificacao_id: notificacaoId }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.error("Erro ao confirmar devolução:", err);
            notificacaoParaConfirmar.lida = false; // Rollback
        }
    }

    
    // Implementar a lógica de busca da API
    async function fetchNotificacoes() {
        if (isLoading.value) return;

        const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
        const token = localStorage.getItem('authToken');

        if (!token) {
            error.value = "Usuário não autenticado para buscar notificações.";
            return;
        }

        isLoading.value = true;
        error.value = null;
        try {
            const response = await axios.get(`${API_URL}/notificacoes`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            
            // Normaliza os dados recebidos para garantir que 'lida' seja sempre um booleano.
            const dadosNormalizados = response.data.map(notificacao => ({
                ...notificacao,
                lida: Boolean(notificacao.lida) // Converte 0 para false, 1 para true.
            }));
            
            notificacoes.value = dadosNormalizados;
        } catch (err) {
            console.error("Erro ao buscar notificações:", err);
            error.value = err.response?.data?.error || "Falha ao carregar notificações.";
        } finally {
            isLoading.value = false;
        }
    }
    

    // Função completa para marcar como lida, incluindo a chamada à API
async function marcarComoLida(notificacaoId) {
        // CORREÇÃO 2 (A que estava faltando)
        const notificacaoParaMarcar = notificacoes.value.find(n => n.id === notificacaoId);
        if (!notificacaoParaMarcar || notificacaoParaMarcar.lida) return;

        notificacaoParaMarcar.lida = true;
        const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
        const token = localStorage.getItem('authToken');
        try {
            await axios.put(`${API_URL}/notificacoes/${notificacaoId}/marcar-lida`, {}, {
                 headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error("Erro ao marcar notificação como lida no backend:", err);
            notificacaoParaMarcar.lida = false;
        }
    }

    return {
        notificacoes,
        isLoading,
        error,
        unreadCount,
        addNotificacao,
        fetchNotificacoes,
        confirmarDevolucao,
        marcarComoLida
    };
});