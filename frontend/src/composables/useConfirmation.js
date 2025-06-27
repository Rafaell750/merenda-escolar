// src/composables/useConfirmation.js
import { ref } from 'vue';

// Estado do modal (fora da função para ser um singleton)
const isVisible = ref(false);
const title = ref('');
const message = ref('');
const options = ref({});

// Funções para resolver/rejeitar a Promise
let resolvePromise = null;
let rejectPromise = null;

export function useConfirmation() {
  
  const confirm = (opts) => {
    title.value = opts.title;
    message.value = opts.message;
    options.value = {
      confirmText: opts.confirmText || 'Confirmar',
      cancelText: opts.cancelText || 'Cancelar',
      variant: opts.variant || 'primary',
    };
    isVisible.value = true;
    
    return new Promise((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
  };

  const handleConfirm = () => {
    if (resolvePromise) {
      resolvePromise(true);
    }
    isVisible.value = false;
    reset();
  };
  
  const handleCancel = () => {
    if (rejectPromise) {
      rejectPromise(new Error('Ação cancelada pelo usuário.'));
    }
    isVisible.value = false;
    reset();
  };

  const reset = () => {
      resolvePromise = null;
      rejectPromise = null;
  }

  // Retorna o estado reativo e as funções que serão usadas no template
  return {
    confirm,
    isVisible,
    title,
    message,
    options,
    handleConfirm,
    handleCancel
  };
}