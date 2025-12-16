<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
    <aside class="sidebar">
        <div class="logo">
            <h2>Avícola</h2>
        </div>
        <nav>
            <RouterLink to="/">Dashboard</RouterLink>
            <RouterLink to="/fincas">Fincas</RouterLink>
            <RouterLink to="/galpones">Galpones</RouterLink>
            <RouterLink to="/lotes">Lotes</RouterLink>
        </nav>
    </aside>
</template>

<style scoped>
.sidebar {
    width: 250px;
    background-color: #2c3e50;
    color: white;
    height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 1rem;
}

.logo {
    margin-bottom: 2rem;
}

nav {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

nav a {
    color: white;
    text-decoration: none;
    padding: 0.5rem;
    border-radius: 4px;
}

nav a:hover,
nav a.router-link-active {
    background-color: #34495e;
}
</style>
