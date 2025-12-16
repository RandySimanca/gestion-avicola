<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const authStore = useAuthStore()

const handleLogin = () => {
    authStore.login(email.value, password.value)
}
</script>

<template>
    <div class="login-container">
        <h1>Iniciar Sesión</h1>
        <form @submit.prevent="handleLogin">
            <input v-model="email" type="email" placeholder="Email" required />
            <input v-model="password" type="password" placeholder="Contraseña" required />
            <button type="submit">Ingresar</button>
        </form>
    </div>
</template>

<style scoped>
.login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
}
</style>
