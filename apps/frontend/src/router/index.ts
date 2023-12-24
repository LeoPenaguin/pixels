import { createRouter, createWebHistory } from 'vue-router'
import BoardPage from '@/views/BoardPage.vue'
import LoginView from '@/views/auth/LoginUser.vue'
import SignUpView from '@/views/auth/SignUpUser.vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { RouteNames } from './types/routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: RouteNames.HOME,
      component: BoardPage,
      meta: { requiresAuth: false }
    },
    // {
    //   path: '/board/:id',
    //   name: RouteNames.PIXEL_BOARD,
    //   component: PixelBoard,
    //   meta: { requiresAuth: true }
    // },
    {
      path: '/auth/login',
      name: RouteNames.AUTH_LOGIN,
      component: LoginView
    },
    {
      path: '/auth/signup',
      name: RouteNames.AUTH_SIGNUP,
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
