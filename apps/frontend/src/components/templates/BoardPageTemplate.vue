<template>
  <div class="board-page-template">
    <div>
      <slot name="content"> Empty header </slot>
    </div>
    <div>
      <slot name="sidebar"> Empty content </slot>
    </div>
  </div>
</template>

<style lang="scss" scropped>
.board-page-template {
  display: grid;
  grid-template-columns: 1fr 300px;
  grid-template-rows: 1fr;
  gap: var(--space0);
  box-sizing: border-box;
  height: 100%;
}
</style>
