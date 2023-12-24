<template>
  <div class="app">
    <TheHeader />
    <div class="app-content">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import TheHeader from '@/components/header/TheHeader.vue'
</script>

<style lang="scss">
html {
  overflow: hidden;
}

body {
  margin: 0;
  color: var(--primary-color);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
  background-color: var(--background-color);
}

.app {
  height: 100vh;
  padding: 7px;
  display: grid;
  gap: 7px;
  grid-template-rows: auto 1fr;
  box-sizing: border-box;
}

a {
  color: var(--accent-color);
  text-decoration: none;
}
</style>
