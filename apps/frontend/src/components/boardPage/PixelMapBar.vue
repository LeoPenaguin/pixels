<template>
  <div class="board-bar">
    <div class="left"></div>
    <div class="middle">
      <div class="board-bar__colors">
        <div v-for="color in colors" :key="color" class="color">
          <button
            :style="{ backgroundColor: color }"
            :class="['item__button', { 'item__button-selected': selectedColor === color }]"
            @click="clickedColor(color)"
          ></button>
        </div>
      </div>
      <div v-if="selectedPixel" class="board-bar__infos">
        <span
          ><b>x</b> {{ uiSelectedPixelPosition?.x || 0 }} <b>y</b>
          {{ uiSelectedPixelPosition?.y || 0 }}</span
        >
        <span class="select-pixel__color" :style="{ backgroundColor: selectedColor.value }"></span>
        <div class="actions">
          <AtomButton icon="check" type="success" @click="paintPixel"></AtomButton>
          <AtomButton icon="close" type="danger" @click="unselectPixel"></AtomButton>
        </div>
      </div>
    </div>
    <div class="right">
      <div class="board-bar__toggle-sidebar">
        <AtomButton icon="check" type="primary" @click="toggleSidebar"></AtomButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useColorStore } from '@/stores/color'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { usePixelStore } from '@/stores/pixel'
import { useWebsocketStore } from '@/stores/websocket'
import AtomButton from '@/components/ds/AtomButton.vue'
import { useSidebarStore } from '@/stores/sidebar'

const sidebarStore = useSidebarStore()
const websocketStore = useWebsocketStore()

const colorStore = useColorStore()
const pixelStore = usePixelStore()

const { colors, selectedColor } = storeToRefs(colorStore)
const { selectedPixel, uiSelectedPixelPosition } = storeToRefs(pixelStore)

onMounted(() => {
  if (!selectedColor.value) {
    selectedColor.value = colors.value[0]
  }
})

const paintPixel = async () => {
  if (!selectedPixel.value) {
    return
  }

  websocketStore.send(
    JSON.stringify({
      event: 0,
      data: {
        color: selectedColor.value,
        x: selectedPixel.value.x,
        y: selectedPixel.value.y
      }
    })
  )
}

const unselectPixel = () => {
  selectedPixel.value = null
}

function clickedColor(color: string) {
  selectedColor.value = color
}

function toggleSidebar() {
  sidebarStore.toggleSidebarVisibility()
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
  align-items: flex-end;
  justify-content: space-between;
  overflow: hidden;
  gap: var(--space0);

  .left,
  .middle,
  .right {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    flex: 1;
    gap: var(--space0);
  }

  .middle {
    flex: 2;
  }

  .right {
    justify-content: flex-end;
  }

  &__colors {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    padding: 10px;
    background-color: var(--board-bar-color);
    border-radius: var(--border-radius-1);
    gap: 3px;
    .item__button {
      height: 25px;
      width: 25px;
      display: block;
      border-radius: var(--border-radius-1);
      border: 2px solid transparent;
      &-selected {
        border-color: var(--accent-color);
      }
    }
  }
  &__infos {
    background-color: var(--background-color);
    padding: var(--space0) var(--space0) var(--space0) var(--space1);
    border-radius: var(--border-radius-1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
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
