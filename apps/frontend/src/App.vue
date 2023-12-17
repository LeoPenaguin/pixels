<template>
  <NavAndContentTemplate>
    <template #nav>
      <TheHeader />
    </template>
    <template #content>
      <RouterView />
    </template>
  </NavAndContentTemplate>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import TheHeader from '@/components/header/TheHeader.vue'
import NavAndContentTemplate from '@/components/templates/NavAndContentTemplate.vue'
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

a {
  color: var(--accent-color);
  text-decoration: none;
}
</style>
