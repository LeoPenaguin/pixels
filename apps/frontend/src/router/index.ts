import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PixelBoardView from '../views/PixelBoardView.vue'

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
            component: PixelBoardView
        }
    ]
})

export default router
