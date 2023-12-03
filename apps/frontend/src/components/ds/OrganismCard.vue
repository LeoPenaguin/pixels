<template>
  <div class="organism-card">
    <div class="organism-card__title">
      <h3>{{ title }}</h3>
    </div>
    <div class="organism-card__details">
      <slot name="details"></slot>
    </div>
    <div class="organism-card__link">
      <RouterLink :to="link">{{ linkText }}</RouterLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { RouteLocationRaw } from 'vue-router'
import { RouterLink } from 'vue-router'

defineProps<{
  title: string
  details: string
  link: RouteLocationRaw
  linkText: string
}>()
</script>

<style lang="scss" scoped>
.organism-card {
  width: 300px;
  background: rgb(7, 229, 129);
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  overflow: hidden;
  &__title {
    padding: 10px;
  }
  &__details {
    flex: 1;
    padding: 10px;
  }
  &__link {
    a {
      background: yellow;
      display: block;
      width: 100%;
      padding: 10px;
      box-sizing: border-box;
    }
  }
}
</style>
