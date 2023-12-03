<template>
  <svg width="25" height="25" viewBox="-8 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1 4.20001L4 1.20001L7 4.20001M7 17.9L4 20.9L1 17.9M4 2.20001V19.8"
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
