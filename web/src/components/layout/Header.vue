<script setup lang="ts">
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
</script>

<template>
    <header class="header">
        <div class="user-info">
            <span>Usuario: {{ authStore.user?.name || 'Invitado' }}</span>
            <button @click="authStore.logout">Salir</button>
        </div>
    </header>
</template>

<style scoped>
.header {
    height: 60px;
    background-color: white;
    border-bottom: 1px solid #eee;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 2rem;
}

.user-info {
    display: flex;
    gap: 1rem;
    align-items: center;
}
</style>
