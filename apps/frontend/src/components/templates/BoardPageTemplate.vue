<template>
  <div
    class="board-page-template"
    :class="{ 'board-page-template--sidebar-is-visible': sidebarIsVisible }"
  >
    <slot name="content"> Empty header </slot>
    <div v-show="sidebarIsVisible">
      <slot name="sidebar"></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useSidebarStore } from '@/stores/sidebar'
import { storeToRefs } from 'pinia'

const sidebarStore = useSidebarStore()

const { sidebarIsVisible } = storeToRefs(sidebarStore)
</script>

<style lang="scss" scropped>
.board-page-template {
  display: grid;
  grid-template-columns: 1fr 0;
  grid-template-rows: 1fr;
  gap: 0;
  box-sizing: border-box;
  height: 100%;
  overflow: hidden;
  &--sidebar-is-visible {
    grid-template-columns: 1fr 300px;
    gap: var(--space0);
  }
}
</style>
