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
        <AtomButton icon="check" type="success" @click="paintPixel"></AtomButton>
        <AtomButton icon="close" type="danger" @click="unselectPixel"></AtomButton>
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
import { useWebSocket } from '@vueuse/core'
import AtomButton from '@/components/ds/AtomButton.vue'

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
  const { send } = useWebSocket('ws://localhost:3007')

  send(
    JSON.stringify({
      event: 0,
      data: {
        colorId: selectedColor.value._id,
        x: selectedPixel.value.col,
        y: selectedPixel.value.row
      }
    })
  )
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
  overflow: hidden;
  gap: var(--space0);

  &__colors {
    display: flex;
    padding: 10px;
    background-color: var(--board-bar-color);
    border-radius: var(--border-radius-1);
    gap: 3px;
    .item__button {
      height: 40px;
      width: 40px;
      display: block;
      border-radius: var(--border-radius-1);
      border: 2px solid var(--primary-color);
      &-selected {
        border: 2px solid var(--accent-color);
      }
    }
  }
  &__infos {
    border: 2px solid var(--primary-color);
    background-color: var(--background-color);
    height: 40px;
    padding: 10px 10px 10px 20px;
    border-radius: var(--border-radius-1);
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
    }
  }
}
</style>
