<template>
  <div class="bottom-bar">
    <div class="bottom-bar__content">
      <div class="content__section colors">
        <div v-for="color in colors" :key="color._id">
          <button
            :style="{ backgroundColor: color.value }"
            :class="['item__button', { 'item__button-selected': selectedColor === color }]"
            @click="clickedColor(color)"
          ></button>
        </div>
      </div>
      <div class="content__section cursor">
        <div class="curstor__x">x: {{ uiCursorPosition.x }}</div>
        <div class="curstor__y">y: {{ uiCursorPosition.y }}</div>
      </div>
      <div v-if="selectedPixel" class="content__section select-pixel">
        x: {{ selectedPixel.col }} y: {{ selectedPixel.row }}
        <span class="select-pixel__color" :style="{ backgroundColor: selectedColor.value }"></span>
        <button :onclick="paintPixel">Click</button>
        <button :onclick="unselectPixel">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useColorStore } from '@/stores/color'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import type { IColor } from '@pixels/typings'
import { useCursorStore } from '@/stores/cursor'
import { usePixelStore } from '@/stores/pixel'
import { useBoardStore } from '@/stores/board'

const cursorStore = useCursorStore()
const colorStore = useColorStore()
const pixelStore = usePixelStore()
const boardStore = useBoardStore()

const { colors, selectedColor } = storeToRefs(colorStore)
const { uiCursorPosition } = storeToRefs(cursorStore)
const { selectedPixel } = storeToRefs(pixelStore)
const { board } = storeToRefs(boardStore)

onMounted(() => {
  if (!selectedColor.value) {
    selectedColor.value = colors.value[0]
  }
})

const paintPixel = async () => {
  const newPixel = await pixelStore.postPixel(
    selectedColor.value,
    board.value,
    selectedPixel.value.col,
    selectedPixel.value.row
  )

  boardStore.replaceBoardPixel(newPixel)
}

const unselectPixel = () => {
  selectedPixel.value = null
}

function clickedColor(color: IColor) {
  selectedColor.value = color
}

onMounted(() => {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      unselectPixel()
    } else if (e.key === 'Enter') {
      paintPixel()
    }
  })
})
</script>

<style lang="scss">
@import '@/assets/style/theme.scss';

.bottom-bar {
  padding: 1rem 0;
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
    pointer-events: inherit;
    .content__section {
      background: rgb(255, 0, 0);
      padding: $m1 $m3;
      border-radius: $m5;
      display: flex;
      align-items: center;
      pointer-events: all;

      &.colors {
        gap: $m2;
        height: 60px;

        .item__button {
          border: 0;
          width: 40px;
          height: 40px;
          border-radius: 20px;
          cursor: pointer;
          &:hover {
            transform: scale(1.1);
          }
          &-selected {
            &::after {
              content: 'x';
            }
            &:hover {
              transform: scale(1);
            }
          }
        }
      }

      &.cursor {
        background: rgb(176, 0, 0);
        color: white;
        height: 60px;
        width: 60px;
        flex-direction: column;
        justify-content: center;
      }

      &.select-pixel {
        background: rgb(176, 0, 0);
        color: white;
        height: 60px;
        .select-pixel__color {
          width: 40px;
          height: 40px;
        }
      }
    }
  }
}
</style>
