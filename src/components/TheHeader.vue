<script setup lang="ts">
import NavDropdown from './navigation/NavDropdown.vue'
import NavButton from './navigation/NavButton.vue'
import { RouterLink } from 'vue-router'
</script>

<template>
  <nav>
    <div class="nav-left">
      <RouterLink to="/">
        Home
      </RouterLink>
      <RouterLink to="/pixel-board">
        Pixel Board
      </RouterLink>
    </div>
    <div class="nav-right">
      <NavButton text="lol" />
      <NavDropdown />
    </div>
  </nav>
</template>

<style lang="scss" scoped>
nav {
  display: flex;
  justify-content: space-between;
  .nav-left {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }
  .nav-right {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    flex-direction: row;
  }
}
</style>
