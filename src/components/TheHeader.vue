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
    <div class="nav-right">
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
    a {
      height: 100%;
    }
    .home-link-logo {
      border-radius: 5px;
      height: 100%;
      img {
        height: 100%;
      }
      &:hover {
        background: rgb(8, 8, 8);
      }
    }
  }
  .nav-right {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    flex-direction: row;
  }
}
</style>
