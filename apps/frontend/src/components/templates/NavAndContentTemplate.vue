<template>
  <div class="nav-and-content">
    <slot name="nav"> Empty header </slot>
    <slot name="content"> Empty content </slot>
  </div>
</template>

<style lang="scss" scropped>
.nav-and-content {
  height: 100vh;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
  background: #272727;
  padding: var(--space0);
  gap: var(--space0);
  box-sizing: border-box;
}
</style>
