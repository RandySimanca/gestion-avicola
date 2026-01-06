import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import apiService from '../services/api.service'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: string; email: string; name: string; role: string } | null>(null)
  const isAuthenticated = ref(false)
  const loading = ref(true)
  const router = useRouter()

  // Inicializar estado desde el token guardado
  function init() {
    const token = apiService.getToken()
    if (token) {
      const role = apiService.getUserRole()
      if (role) {
        isAuthenticated.value = true
        // Podríamos obtener los datos completos del perfil aquí si fuera necesario
        user.value = { 
          id: '', 
          email: '', 
          name: 'Usuario Autenticado', 
          role: role 
        }
      } else {
        logout()
      }
    }
    loading.value = false
  }

  async function login(email: string, password: string) {
    loading.value = true
    const response = await apiService.login(email, password)
    
    if (response.success && response.data) {
      isAuthenticated.value = true
      user.value = response.data.user
      router.push('/')
    } else {
      alert(response.error || 'Error al iniciar sesión')
    }
    loading.value = false
  }

  function logout() {
    apiService.logout()
    isAuthenticated.value = false
    user.value = null
    router.push('/login')
  }

  return { user, isAuthenticated, loading, login, logout, init }
})
