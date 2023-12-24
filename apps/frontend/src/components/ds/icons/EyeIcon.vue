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
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
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
