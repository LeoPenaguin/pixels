<template>
  <svg width="25" height="25" viewBox="0 -8 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 1.79999L1 4.79999L4 7.79999M17.7 1.79999L20.7 4.79999L17.7 7.79999M2.1 4.79999H19.5"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script lang="ts" setup>
defineProps({
  color: {
    type: String,
    default: 'currentColor'
  },
  strokeWidth: {
    type: String,
    default: '2'
  }
})
</script>
