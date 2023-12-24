<template>
  <div
    class="canvas-page-layout"
    :class="{ 'canvas-page-layout--sidebar-is-visible': sidebarIsVisible }"
  >
    <slot name="content"> Empty content </slot>
    <div v-show="sidebarIsVisible">
      <slot name="sidebar"> Empty sidebar </slot>
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
.canvas-page-layout {
  display: grid;
  grid-template-columns: 1fr 0;
  grid-template-rows: 1fr;
  gap: 0;
  box-sizing: border-box;
  height: 100%;
  overflow: hidden;
  &--sidebar-is-visible {
    grid-template-columns: 1fr 300px;
    gap: 7px;
  }
}
</style>
