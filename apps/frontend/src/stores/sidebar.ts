import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useSidebarStore = defineStore('sidebar', () => {
  const sidebarIsVisible = ref<boolean>(true)

  function toggleSidebarVisibility() {
    sidebarIsVisible.value = !sidebarIsVisible.value
  }

  return { sidebarIsVisible, toggleSidebarVisibility }
})
