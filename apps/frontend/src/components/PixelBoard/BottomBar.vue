<template>
  <div class="bottom-bar">
    <div class="bottom-bar__content">
      <div
        v-if="selectedColor"
        :style="{ backgroundColor: selectedColor.value }"
        class="content__selected-color"
      >
        {{ selectedColor.name }}
      </div>
      <div class="content__colors">
        <div v-for="color in colors" :key="color._id" class="colors__item">
          <button
            :style="{ backgroundColor: color.value }"
            class="item__button"
            @click="clickedColor(color)"
          ></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useColorStore } from '@/stores/color'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import type { IColor } from '@pixels/typings'

const colorStore = useColorStore()
const { colors, selectedColor } = storeToRefs(colorStore)

onMounted(() => {
  if (!selectedColor.value) {
    selectedColor.value = colors.value[0]
  }
})

function clickedColor(color: IColor) {
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
    display: flex;
    gap: $m2;
    align-items: center;
    border-radius: $m4;
    padding: $m2;
    pointer-events: inherit;
    background: linear-gradient(90deg, rgb(126, 195, 196) 0%, rgb(240, 212, 156) 100%);
    .content__selected-color {
      display: flex;
      gap: $m1;
      height: 60px;
      background: rgba(255, 255, 255, 0.7);
      padding: $m1 $m6;
      border-radius: $m3;
      align-items: center;
    }
    .content__colors {
      display: flex;
      gap: $m1;
      height: 60px;
      background: rgba(255, 255, 255, 0.7);
      padding: $m1 $m3;
      border-radius: $m3;
      align-items: center;
      .item__button {
        pointer-events: all;
        border: 0;
        width: 40px;
        height: 40px;
        border-radius: 20px;
        cursor: pointer;
        &:hover {
          transform: scale(1.2);
        }
      }
    }
  }
}
</style>
