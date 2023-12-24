<template>
  <nav>
    <div class="nav-left"></div>
    <div class="nav-center">
      <SiteIcon />
    </div>
    <div class="nav-right">
      <UserBar />
    </div>
  </nav>
</template>

<script setup lang="ts">
import UserBar from '@/components/header/UserBar.vue'
import SiteIcon from '@/components/header/SiteIcon.vue'
</script>

<style lang="scss" scoped>
nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  border-radius: var(--border-radius-1);
  box-sizing: border-box;
  color: white;

  .nav-left,
  .nav-right {
    flex: 1;
  }
  .nav-center {
    width: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
