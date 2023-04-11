<script setup lang="ts">
import { RouterView } from 'vue-router'
import TheHeader from './components/TheHeader.vue';
import NavAndContent from './components/templates/NavAndContent.vue';
</script>

<template>
  <NavAndContent>
    <template #nav>
      <TheHeader/>
    </template>
    <template #content>
      <RouterView />
    </template>
  </NavAndContent>
</template>

<style lang="scss">
html {
  overflow: hidden;
}

body {
  margin: 0;
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
}

a {
  color: rgb(0, 162, 255);
  text-decoration: none;
}
</style>
