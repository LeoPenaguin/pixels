<template>
  <div class="organism-card">
    <div class="organism-card__title">
      <h3>{{ title }}</h3>
    </div>
    <div class="organism-card__details">
      <slot name="details"></slot>
    </div>
    <div class="organism-card__link">
      <AtomButton :text="linkText" @click="goToLink" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { RouteLocationRaw } from 'vue-router'
import { useRouter } from 'vue-router'
import AtomButton from './AtomButton.vue'

const router = useRouter()

const props = defineProps<{
  title: string
  details: string
  link: RouteLocationRaw
  linkText: string
}>()

function goToLink() {
  router.push(props.link)
}
</script>

<style lang="scss" scoped>
.organism-card {
  width: 300px;
  border: 2px solid var(--primary-color);
  display: flex;
  flex-direction: column;
  border-radius: var(--border-radius-1);
  overflow: hidden;
  padding: 10px;
  &__details {
    flex: 1;
  }
  &__link {
    a {
      border: 2px solid var(--primary-color);
      color: var(--primary-color);
      display: block;
      width: 100%;
      padding: 10px;
      box-sizing: border-box;
      border-radius: var(--border-radius-1);
    }
  }
}
</style>
