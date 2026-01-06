import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('../layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView
        },
        {
          path: 'fincas',
          name: 'fincas',
          component: () => import('../views/FincasView.vue')
        },
        {
          path: 'galpones',
          name: 'galpones',
          component: () => import('../views/GalponesView.vue')
        },
        {
          path: 'lotes',
          name: 'lotes',
          component: () => import('../views/LotesView.vue')
        },
        {
          path: 'registroDiario',
          name: 'registroDiario',
          component: () => import('../views/RegistroDiarioView.vue')
        },
        {
          path: 'admin/usuarios',
          name: 'admin-usuarios',
          component: () => import('../views/AdminUsuariosView.vue')
        },
        
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
  ]
})

import { useAuthStore } from '../stores/auth'

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.name === 'admin-usuarios' && authStore.user?.role !== 'ADMIN') {
    next('/')
  } else {
    next()
  }
})

export default router
