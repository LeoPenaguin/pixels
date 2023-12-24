<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="25"
    height="25"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M20 9v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9" />
    <path d="M9 22V12h6v10M2 10.6L12 2l10 8.6" />
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
