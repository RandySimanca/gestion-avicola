import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Inicializar store de autenticación
import { useAuthStore } from './stores/auth'
const authStore = useAuthStore(pinia)
authStore.init()

app.mount('#app')
