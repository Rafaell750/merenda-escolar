<!-- src/components/ConfirmationModal.vue -->
<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-backdrop" @click="closeModal">
      <div class="modal-container" :class="variantClass" @click.stop>
        <header class="modal-header">
          <h3 class="modal-title">{{ title }}</h3>
          <button type="button" class="close-button" @click="closeModal" aria-label="Fechar">
            ×
          </button>
        </header>

        <section class="modal-body">
          <slot>
            <!-- Fallback: Se nenhum conteúdo for passado para o slot, mostra um parágrafo vazio.
                O ideal é sempre passar conteúdo. -->
            <p>Ação requer confirmação.</p>
          </slot>
        </section>

        <footer class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">
            {{ cancelText }}
          </button>
          <button type="button" class="btn" :class="confirmButtonClass" @click="confirmAction">
            {{ confirmText }}
          </button>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: 'Confirmar Ação',
  },
  message: {
    type: String,
    // required: true, // REMOVA OU COMENTE ESTA LINHA
  },
  confirmText: {
    type: String,
    default: 'Confirmar',
  },
  cancelText: {
    type: String,
    default: 'Cancelar',
  },
  // 'danger' para exclusão, 'warning' para avisos, 'primary' para padrão
  variant: {
    type: String,
    default: 'primary', // 'primary', 'danger', 'warning'
  }
});

const emit = defineEmits(['close', 'confirm']);

const closeModal = () => {
  emit('close');
};

const confirmAction = () => {
  emit('confirm');
};

// Classes CSS dinâmicas baseadas na variante
const variantClass = computed(() => `modal-variant-${props.variant}`);
const confirmButtonClass = computed(() => `btn-${props.variant}`);

</script>

<style scoped>
/* Estilos para o Modal de Confirmação */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050; /* Garante que fique sobre outros elementos */
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  width: 90%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Garante que os cantos arredondados sejam aplicados ao header/footer */
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

/* Cores variantes para o header */
.modal-variant-danger .modal-header { background-color: #f8d7da; color: #721c24; }
.modal-variant-warning .modal-header { background-color: #fff3cd; color: #856404; }
.modal-variant-primary .modal-header { background-color: #cce5ff; color: #004085; }

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.75rem;
  font-weight: bold;
  line-height: 1;
  color: #000;
  opacity: 0.5;
  cursor: pointer;
}
.close-button:hover {
  opacity: 0.8;
}

.modal-body {
  padding: 1.5rem;
  font-size: 1rem;
  line-height: 1.5;
  color: #495057;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

/* Estilos dos Botões */
.btn {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 5px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
  color: white;
}
.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-primary { background-color: #007bff; color: white; }
.btn-primary:hover { background-color: #0069d9; }

.btn-danger { background-color: #dc3545; color: white; }
.btn-danger:hover { background-color: #c82333; }

.btn-warning { background-color: #ffc107; color: #212529; }
.btn-warning:hover { background-color: #e0a800; }

/* Animação de Fade para o Modal */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>