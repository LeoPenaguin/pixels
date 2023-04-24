<script setup lang="ts">
import NavDropdown from './navigation/NavDropdown.vue'
import { RouterLink } from 'vue-router'
</script>

<template>
  <nav>
    <div class="nav-left">
      <RouterLink to="/">
        <div class="home-link-logo">
          <img
            src="../assets/logo.png"
            alt="The logo"
          >
        </div>
      </RouterLink>
      <RouterLink to="/pixel-board">
        Pixel Board
      </RouterLink>
    </div>
    <NavDropdown />
  </nav>
</template>

<style lang="scss" scoped>
@import '@/assets/style/theme.scss';

nav {
  display: flex;
  justify-content: space-between;
  .nav-left {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    a {
      height: 100%;
    }
    .home-link-logo {
      border-radius: $m4;
      height: 100%;
      img {
        height: 100%;
      }
      &:hover {
        background: $background-color;
      }
    }
  }
}
</style>
