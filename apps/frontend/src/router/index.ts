import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import PixelBoard from '@/views/PixelBoardView.vue'
import LoginView from '@/views/auth/LoginUser.vue'
import SignUpView from '@/views/auth/SignUpUser.vue'
import { useColorStore } from '@/stores/color'
import { storeToRefs } from 'pinia'
import { getColors } from '@/api/color'
import { useBoardStore } from '@/stores/board'
import { getBoard } from '@/api/board'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/board/:id',
      name: 'pixel-board',
      component: PixelBoard,
      meta: { requiresAuth: true }
    },
    {
      path: '/auth/login',
      name: 'auth-login',
      component: LoginView
    },
    {
      path: '/auth/signup',
      name: 'auth-signup',
      component: SignUpView
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  await authStore.checkAuth()

  const { user } = storeToRefs(authStore)

  if (to.meta.requiresAuth && !user.value) {
    next({ name: 'auth-login' })
  } else next()
})

export default router
