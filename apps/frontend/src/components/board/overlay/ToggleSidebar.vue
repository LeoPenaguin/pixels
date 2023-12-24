<template>
  <div class="toggle-sidebar">
    <button @click="toggleSidebar">Sidebar</button>
  </div>
</template>

<script setup lang="ts">
import { useSidebarStore } from '@/stores/sidebar'

const sidebarStore = useSidebarStore()

function toggleSidebar() {
  sidebarStore.toggleSidebarVisibility()
}
</script>

<style scoped></style>
