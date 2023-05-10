<template>
  <div class="bottom-bar">
    <div class="bottom-bar__content">
      <div v-if="selectedColor" class="content__selected-color">
        {{ selectedColor.name }} - {{ selectedColor.value }}
      </div>
      <div class="content__colors">
        <div v-for="color in colors" :key="color._id" class="colors__item">
          <button class="item__button" @click="clickedColor(color)">
            {{ color.name }} - {{ color.value }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useColorStore } from '@/stores/color'
import { storeToRefs } from 'pinia'

const colorStore = useColorStore()
const { colors, selectedColor } = storeToRefs(colorStore)

function clickedColor(color) {
  selectedColor.value = color
}
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
  z-index: 1000;
  &__content {
    border-radius: $m4;
    width: 200px;
    padding: $m4;
    pointer-events: inherit;
    background: rgb(224, 224, 224);
    border: 3px solid white;
  }
  .item__button {
    pointer-events: all;
  }
}
</style>
