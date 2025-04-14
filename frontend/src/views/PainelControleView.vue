<!-- /frontend/src/views/PainelControleView.vue -->
<template>
  <!-- Este div agora é um bloco simples que será centralizado pelo pai -->
  <div class="painel-controle-content">
    <!-- Cabeçalho da Página -->
    <header class="page-header">
      <h1>Painel de Controle</h1>
    </header>

    <!-- Mensagem de Boas Vindas -->
    <div class="welcome-message">
      <h2>Bem-vindo ao Sistema de Merenda Escolar</h2>
      <p>Utilize o menu lateral para acessar as funcionalidades do sistema.</p>
    </div>
  </div>
</template>

<script setup>
// Lógica específica do Painel de Controle
</script>

<style scoped>
/* Estilos específicos para o conteúdo do Painel de Controle */

.painel-controle-content {
  /* MANTÉM controle de largura e alinhamento de texto interno */
  width: 100%;          /* Ocupa a largura permitida pelo align-items do pai */
  max-width: 800px;     /* Limita a largura máxima */
  text-align: center;   /* Centraliza o texto dentro dele */
}

/* Estilos do Cabeçalho da Página */
.page-header {
  margin-bottom: 1.5rem;
}

.page-header h1 {
  color: #2c3e50;
  font-size: 1.8rem;
  font-weight: 600;
}

/* Estilos da Mensagem de Boas Vindas */
.welcome-message {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.welcome-message h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.7rem;
}

.welcome-message p {
  color: #5a6a7a;
  font-size: 1.1rem;
  line-height: 1.6;
}

/* --- Responsividade --- */
/* Ajustes de responsividade podem permanecer focados nos tamanhos de fonte e padding */
@media (max-width: 768px) {
  .page-header h1 {
    font-size: 1.6rem;
  }
  .welcome-message {
    padding: 1.5rem;
  }
  .welcome-message h2 {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: 1.4rem;
  }
  .welcome-message {
    padding: 1.2rem;
  }
  .welcome-message h2 {
    font-size: 1.3rem;
  }
   .welcome-message p {
    font-size: 1rem;
  }
}
</style>