import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'

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
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
  ]
})

export default router
