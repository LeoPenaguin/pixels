import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PixelBoardView from '../views/PixelBoardView.vue'
import { useColorStore } from '@/stores/color'
import { storeToRefs } from 'pinia'
import { getColors } from '@/api/color'
import { useBoardStore } from '@/stores/board'
import { getBoard } from '@/api/board'

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
      async beforeEnter(to, from, next) {
        const colorStore = useColorStore()
        const boardStore = useBoardStore()

        const { colors } = storeToRefs(colorStore)
        const { board } = storeToRefs(boardStore)

        colors.value = await getColors()
        board.value = await getBoard(to.params.id as string)

        next()
      }
    }
  ]
})

export default router
