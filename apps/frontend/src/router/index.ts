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
      beforeEnter(to, from, next) {
        const colorStore = useColorStore()
        const boardStore = useBoardStore()

        const { colors } = storeToRefs(colorStore)
        const { board } = storeToRefs(boardStore)

        getColors().then((response) => {
          colors.value = response
        })

        getBoard(to.params.id as string).then((response) => {
          board.value = response
        })

        next()
      }
    }
  ]
})

export default router
