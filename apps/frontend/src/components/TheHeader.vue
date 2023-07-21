<template>
  <nav>
    <div class="nav-left">
      <RouterLink to="/">
        <div class="home-link-logo">
          <img src="../assets/logo.png" alt="The logo" />
        </div>
      </RouterLink>
    </div>
    <div class="nav-center"></div>
    <div class="nav-right">
      <NavUser />
    </div>
  </nav>
</template>

<script setup lang="ts">
import NavUser from './navigation/NavUser.vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
</script>

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
      display: flex;
      align-items: center;
      img {
        height: 45px;
      }
    }
  }
}
</style>
