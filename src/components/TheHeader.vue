<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <nav>
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/pixel-board">Pixel Board</RouterLink>
  </nav>
</template>

<style lang="scss" scoped>
nav {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}
</style>
