<script setup lang="ts">
import NavCurrentBoard from './navigation/NavCurrentBoard.vue';
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
    </div>
    <div class="nav-center">
      <NavCurrentBoard />
    </div>
    <div class="nav-right">
      <NavDropdown />
    </div>
  </nav>
</template>

<style lang="scss" scoped>
@import '@/assets/style/theme.scss';

nav {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: $m3;

  .nav-left,
  .nav-center,
  .nav-right {
    display: flex;
    align-items: center;
  }

  .nav-left {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    a {
      height: 100%;
    }
    .home-link-logo {
      height: 100%;
      img {
        height: 100%;
      }
    }
  }

}
</style>
