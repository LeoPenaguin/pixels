import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PixelBoardView from '../views/PixelBoardView.vue'
import { useColorStore } from '@/stores/color'
import { storeToRefs } from 'pinia'
import { getColors } from '@/api/color'

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
      component: PixelBoardView,
      beforeEnter(to, from, next) {
        const colorStore = useColorStore()
        const { colors } = storeToRefs(colorStore)

        getColors().then((response) => {
          colors.value = response
          next()
        })
      }
    }
  ]
})

export default router
