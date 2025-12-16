import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ email: string; name: string; role: string } | null>(null)
  const isAuthenticated = ref(false)
  const router = useRouter()

  function login(email: string, password: string) {
    // Mock login
    if (email && password) {
      isAuthenticated.value = true
      user.value = { email, name: 'Admin User', role: 'ADMIN' }
      router.push('/')
    }
  }

  function logout() {
    isAuthenticated.value = false
    user.value = null
    router.push('/login')
  }

  return { user, isAuthenticated, login, logout }
})
