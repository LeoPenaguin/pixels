<template>
  <div ref="mouseCursor" class="mouse-cursor">
    <div class="arrow">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <polygon points="50 15, 100 100, 0 100" />
      </svg>
    </div>
    <div class="tail">
      <span :style="{ background: selectedColor }" class="tail__color"></span>
      <span class="tail__text"> {{ uiCursorPosition.x }}, {{ uiCursorPosition.y }} </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useColorStore } from '@/stores/color'
import { storeToRefs } from 'pinia'
import { useCursorStore } from '@/stores/cursor'

const cursorStore = useCursorStore()
const colorStore = useColorStore()

const { selectedColor } = storeToRefs(colorStore)
const { uiCursorPosition } = storeToRefs(cursorStore)

const mouseCursor = ref<HTMLDivElement>()

const moveCursor = (e) => {
  const mouseY = e.clientY
  const mouseX = e.clientX

  mouseCursor.value.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`
  mouseCursor.value.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`
}

window.addEventListener('mousemove', moveCursor)
</script>

<style lang="scss" scoped>
.mouse-cursor {
  z-index: 1000;
  position: fixed;
  left: 0;
  top: 0;
  pointer-events: none;
  .arrow {
    svg {
      width: 15px;
      transform: rotate(90deg);
    }
  }
  .tail {
    background: rgb(255, 255, 255);
    margin-left: 10px;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px;
    border: 1px solid black;
    &__color {
      display: block;
      height: 10px;
      width: 10px;
      border-radius: var(--border-radius-1);
      border: 2px solid transparent;
    }
  }
}
</style>
