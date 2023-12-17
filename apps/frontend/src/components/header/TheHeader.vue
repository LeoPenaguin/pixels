<template>
  <nav>
    <div class="nav-left">
      <BreadCrumb />
    </div>
    <div class="nav-right">
      <UserActions />
    </div>
  </nav>
</template>

<script setup lang="ts">
import UserActions from '@/components/header/UserActions.vue'
import BreadCrumb from './BreadCrumb.vue'
</script>

<style lang="scss" scoped>
nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space0);
  background-color: var(--accent-color);
  padding: var(--space0);
  border-radius: var(--border-radius-1);
}
</style>
