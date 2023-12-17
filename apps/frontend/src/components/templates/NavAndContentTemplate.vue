<template>
  <div class="nav-and-content">
    <div>
      <slot name="nav"> Empty header </slot>
    </div>
    <div>
      <slot name="content"> Empty content </slot>
    </div>
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
