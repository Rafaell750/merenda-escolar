// frontend/src/views/UnauthorizedView.vue
<template>
  <div class="unauthorized-container">
    <h1>Acesso Negado</h1>
    <p>Você não tem permissão para acessar esta página.</p>
    <router-link to="/">Voltar para o Painel</router-link>
  </div>
</template>

<script setup>
// Nenhum script específico necessário por enquanto
</script>

<style scoped>
.unauthorized-container {
  max-width: 600px;
  margin: 4rem auto;
  padding: 2rem;
  text-align: center;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
h1 {
  color: #dc3545; /* Vermelho */
  margin-bottom: 1rem;
}
p {
  margin-bottom: 1.5rem;
  color: #555;
}
a {
    color: #007bff;
    text-decoration: none;
}
a:hover {
    text-decoration: underline;
}
</style>