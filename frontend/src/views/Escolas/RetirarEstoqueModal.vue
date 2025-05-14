<template>
    <div v-if="show" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <header class="modal-header">
          <h3>Retirar Estoque da Escola: {{ escolaNome }}</h3>
          <button @click="closeModal" class="close-button" aria-label="Fechar modal">×</button>
        </header>
        <div class="modal-body">
          <p v-if="!itensDisponiveis || itensDisponiveis.length === 0" class="empty-message">
            Não há itens de estoque disponíveis para retirada.
          </p>
          <table v-else class="tabela-retirada">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Unidade</th>
                <th class="text-right">Qtd. Disponível</th>
                <th class="text-right">Qtd. a Retirar</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in itensParaRetirar" :key="item._id_vfor">
                <td>{{ item.nome_produto }}</td>
                <td>{{ item.unidade_medida }}</td>
                <td class="text-right">{{ item.quantidade_total }}</td>
                <td class="text-right">
                  <input
                    type="number"
                    v-model.number="item.quantidade_a_retirar"
                    min="0"
                    :max="item.quantidade_total"
                    class="input-quantidade-retirar"
                    @input="validarQuantidade(item)"
                    placeholder="0"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">Cancelar</button>
          <button
            @click="confirmarRetirada"
            class="btn btn-primary"
            :disabled="!podeConfirmarRetirada || processandoRetirada"
          >
            <span v-if="processandoRetirada">Processando...</span>
            <span v-else>Confirmar Retirada</span>
          </button>
        </footer>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch, computed } from 'vue';
  import axios from 'axios';
  import { useToast } from "vue-toastification";
  
  const props = defineProps({
    show: Boolean,
    itensDisponiveis: {
      type: Array,
      default: () => []
    },
    escolaId: [String, Number],
    escolaNome: String,
  });
  
  const emit = defineEmits(['close', 'retirada-confirmada']);
  const toast = useToast();
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  
  const itensParaRetirar = ref([]);
  const processandoRetirada = ref(false);
  
  // Quando o modal é aberto ou os itens disponíveis mudam, atualizamos a lista interna.
  watch(() => props.itensDisponiveis, (novosItens) => {
    if (novosItens) {
      itensParaRetirar.value = JSON.parse(JSON.stringify(novosItens)).map(item => ({
        ...item,
        quantidade_a_retirar: 0 // Inicializa com 0 ou mantém o valor anterior se já existir
      }));
    } else {
      itensParaRetirar.value = [];
    }
  }, { deep: true, immediate: true });
  
  
  watch(() => props.show, (newValue) => {
    if (newValue) {
      // Resetar quantidades ao abrir o modal
      itensParaRetirar.value = JSON.parse(JSON.stringify(props.itensDisponiveis)).map(item => ({
        ...item,
        quantidade_a_retirar: 0
      }));
    }
  });
  
  function validarQuantidade(item) {
    if (item.quantidade_a_retirar < 0) {
      item.quantidade_a_retirar = 0;
    }
    if (item.quantidade_a_retirar > item.quantidade_total) {
      item.quantidade_a_retirar = item.quantidade_total;
    }
  }
  
  const podeConfirmarRetirada = computed(() => {
    return itensParaRetirar.value.some(item => item.quantidade_a_retirar > 0);
  });
  
  function closeModal() {
    emit('close');
  }
  
  async function confirmarRetirada() {
    if (!podeConfirmarRetirada.value) return;
  
    const itensComRetirada = itensParaRetirar.value
      .filter(item => item.quantidade_a_retirar > 0)
      .map(item => ({
        produto_id: item.produto_id_original || item._id_vfor.split('|')[0], // Assumindo que _id_vfor é 'nome_produto|unidade_medida'
        nome_produto: item.nome_produto,
        unidade_medida: item.unidade_medida,
        quantidade_retirada: item.quantidade_a_retirar,
        // Adicionar mais detalhes se necessário para o backend, como o ID específico do produto no estoque.
        // Por ora, usamos nome_produto e unidade_medida para identificar.
        // O ideal seria ter um `produto_id` único vindo do `itensConsolidados`.
        // Se `_id_vfor` é `produto_id|unidade_medida`, podemos usá-lo.
        // Se `item` tiver um `produto_id` único, use-o.
        // Para este exemplo, vou assumir que precisamos enviar o nome e unidade.
        // E para o backend, ele precisará encontrar o item correspondente no estoque da escola.
      }));
  
    if (itensComRetirada.length === 0) {
      toast.info("Nenhuma quantidade especificada para retirada.");
      return;
    }
  
    processandoRetirada.value = true;
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error('Não autenticado.');
      processandoRetirada.value = false;
      return;
    }
  
    try {
      // Este endpoint é hipotético e precisaria ser implementado no backend
      // POST /api/escolas/:escolaId/estoque/retirar
      const response = await axios.post(`${API_URL}/escolas/${props.escolaId}/estoque/retirar`, {
        itens: itensComRetirada,
        // Pode adicionar mais informações como data_retirada, usuario_responsavel (se aplicável)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      toast.success(response.data.message || "Retirada de estoque registrada com sucesso!");
      emit('retirada-confirmada');
      closeModal();
    } catch (err) {
      console.error('Erro ao registrar retirada de estoque:', err);
      toast.error(err.response?.data?.error || 'Falha ao registrar retirada de estoque.');
    } finally {
      processandoRetirada.value = false;
    }
  }
  
  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000; /* Garante que o modal fique sobre outros elementos */
  }
  
  .modal-content {
    background-color: #fff;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 700px; /* Largura máxima aumentada */
    max-height: 90vh; /* Altura máxima */
    display: flex;
    flex-direction: column;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #eee;
    padding-bottom: 15px;
    margin-bottom: 15px;
  }
  
  .modal-header h3 {
    margin: 0;
    font-size: 1.4em;
    color: #333;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 1.8em;
    cursor: pointer;
    color: #888;
  }
  .close-button:hover {
    color: #333;
  }
  
  .modal-body {
    overflow-y: auto; /* Permite rolagem se o conteúdo for grande */
    padding: 10px 0;
  }
  
  .tabela-retirada {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }
  
  .tabela-retirada th,
  .tabela-retirada td {
    border: 1px solid #ddd;
    padding: 10px;
    text-align: left;
    font-size: 0.95em;
  }
  
  .tabela-retirada th {
    background-color: #f8f9fa;
    font-weight: 600;
  }
  
  .text-right {
    text-align: right !important;
  }
  
  .input-quantidade-retirar {
    width: 80px;
    padding: 6px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    text-align: right;
    font-size: 0.95em;
  }
  .input-quantidade-retirar:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
    outline: none;
  }
  
  .empty-message {
    padding: 20px;
    text-align: center;
    color: #666;
    font-style: italic;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #eee;
    padding-top: 15px;
    margin-top: 20px;
  }
  
  .btn {
    padding: 10px 18px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    font-weight: 500;
    transition: background-color 0.2s ease-in-out, opacity 0.2s;
    margin-left: 10px;
  }
  
  .btn-primary {
    background-color: #007bff;
    color: white;
  }
  .btn-primary:hover {
    background-color: #0056b3;
  }
  .btn-primary:disabled {
    background-color: #6c757d;
    opacity: 0.65;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    background-color: #6c757d;
    color: white;
  }
  .btn-secondary:hover {
    background-color: #545b62;
  }
  </style>