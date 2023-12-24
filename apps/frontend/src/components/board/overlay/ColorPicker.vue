<template>
  <div class="color-picker">
    <div class="color-picker__header" @click="toggleVisibility">
      <span
        v-if="!isVisible"
        :style="{ background: selectedColor }"
        class="header__selected-color"
      ></span>
      <span v-else>Color</span>
      <button>+/-</button>
    </div>
    <div v-if="isVisible" class="color-picker__colors">
      <div v-for="color in colors" :key="color" class="color">
        <button
          :style="{ backgroundColor: color }"
          :class="['item__button', { 'item__button-selected': selectedColor === color }]"
          @click="clickedColor(color)"
        ></button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useColorStore } from '@/stores/color'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'

const colorStore = useColorStore()
const { colors, selectedColor } = storeToRefs(colorStore)

const isVisible = ref(false)

function toggleVisibility() {
  isVisible.value = !isVisible.value
}

function clickedColor(color: string) {
  selectedColor.value = color
}

onMounted(() => {
  if (!selectedColor.value) {
    selectedColor.value = colors.value[0]
  }
})
</script>

<style lang="scss" scoped>
.color-picker {
  background-color: black;
  border-radius: var(--border-radius-1);
  color: white;
  display: flex;
  flex-direction: column;
  &__header {
    display: flex;
    gap: 10px;
    padding: 10px;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    .header__selected-color {
      height: 25px;
      width: 25px;
      border-radius: var(--border-radius-1);
      border: 2px solid transparent;
    }
  }
  &__colors {
    padding: 0 10px 10px 10px;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 3px;
  }
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
</style>
