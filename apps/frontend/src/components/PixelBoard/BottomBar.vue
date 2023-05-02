<template>
  <div class="bottom-bar">
    <div class="bottom-bar__content">
      <div class="content__colors">
        <div v-for="color in colors" :key="color._id" class="colors__item">
          {{ color.name }} - {{ color.value }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useColorStore } from '@/stores/color'
import { storeToRefs } from 'pinia'

const colorStore = useColorStore()
const { colors } = storeToRefs(colorStore)
</script>

<style lang="scss">
@import '@/assets/style/theme.scss';

.bottom-bar {
  padding: 0.5rem;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  bottom: 0;
  pointer-events: none;
  &__content {
    border-radius: $m4;
    width: 200px;
    padding: $m4;
    background: rgba($secondary-background-color, 0.8);
    box-shadow: 0px 0px $m1 0px rgba(0, 0, 0, 0.5);
    pointer-events: inherit;
    backdrop-filter: blur($m2);
  }
}
</style>
