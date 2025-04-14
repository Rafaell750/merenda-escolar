<!-- /frontend/src/views/NavBar.vue-->
<template>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
            <router-link to="/" class="navbar-brand">Controle de Merenda</router-link>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <router-link to="/produtos" class="nav-link">Produtos</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link to="/movimentacoes" class="nav-link">Movimentações</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link to="/relatorios" class="nav-link">Relatórios</router-link>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
</template>

<script>
export default {
    name: 'NavBar'
}
</script>

<style scoped>
/* Estilos opcionais */
</style>