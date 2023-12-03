<template>
  <div class="board-bar">
    <div class="board-bar__colors">
      <div v-for="color in colors" :key="color.name" class="color">
        <button
          :style="{ backgroundColor: color.value }"
          :class="['item__button', { 'item__button-selected': selectedColor === color }]"
          @click="clickedColor(color)"
        ></button>
      </div>
    </div>
    <div v-if="selectedPixel" class="board-bar__infos">
      <span
        ><b>x</b> {{ uiSelectedPixelPosition?.col || 0 }} <b>y</b>
        {{ uiSelectedPixelPosition?.row || 0 }}</span
      >
      <span class="select-pixel__color" :style="{ backgroundColor: selectedColor.value }"></span>
      <div class="actions">
        <button class="button-success" :onclick="paintPixel">
          <CheckIcon />
        </button>
        <button class="button-error" :onclick="unselectPixel">
          <CloseIcon />
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useColorStore } from '@/stores/color'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import type { IColor } from '@pixels/typings'
import { usePixelStore } from '@/stores/pixel'
import { useBoardStore } from '@/stores/board'
import CheckIcon from '../icons/CheckIcon.vue'
import CloseIcon from '../icons/CloseIcon.vue'

const colorStore = useColorStore()
const pixelStore = usePixelStore()
const boardStore = useBoardStore()

const { colors, selectedColor } = storeToRefs(colorStore)
const { selectedPixel, uiSelectedPixelPosition } = storeToRefs(pixelStore)
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

  pixelStore.startPixelTimer()
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

<style lang="scss" scropped>
.board-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  border-radius: 5px;
  overflow: hidden;

  &__colors {
    display: flex;
    padding: 10px;
    background: rgba(37, 37, 37, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 10px;
    gap: 3px;
    .item__button {
      border: 0;
      height: 40px;
      width: 40px;
      display: block;
      border-radius: 5px;
      &-selected {
        border: 3px solid rgba(0, 157, 255, 0.6);
      }
    }
  }
  &__infos {
    background: rgba(235, 235, 235, 0.8);
    backdrop-filter: blur(10px);
    height: 40px;
    padding: 10px 10px 10px 20px;
    margin: 0 10px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    gap: 10px;
    .actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      button {
        border: 0;
        background: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        padding: 5px;
        border-radius: 20px;
        cursor: pointer;
        &.button-success {
          background: rgba(21, 255, 0, 0.2);
          color: rgb(14, 162, 0);
        }
        &.button-error {
          background: rgba(255, 0, 0, 0.1);
          color: rgba(255, 0, 0);
        }
        &:hover {
          background: #d2d2d2;
        }
      }
    }
  }
}
</style>
