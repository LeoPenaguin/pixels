<script setup lang="ts">
import { RouterView } from 'vue-router'
import TheHeader from './components/TheHeader.vue';
import NavAndContent from './components/templates/NavAndContent.vue';
</script>

<template>
  <NavAndContent>
    <template #nav>
      <TheHeader />
    </template>
    <template #content>
      <RouterView />
    </template>
  </NavAndContent>
</template>

<style lang="scss">
@import '@/assets/style/theme.scss';

html {
  overflow: hidden;
}

body {
  margin: 0;
  color: $text-color;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
  background-color: $background-color;
}

a {
  color: $link-color;
  text-decoration: none;
}
</style>
