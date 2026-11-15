<!-- Bottom-right navigation buttons: zoom, recenter, keyboard help. -->
<script lang="ts">
  type Props = {
    onzoomin: () => void
    onzoomout: () => void
    onrecenter: () => void
    onhelp: () => void
  }
  const { onzoomin, onzoomout, onrecenter, onhelp }: Props = $props()
</script>

<div class="panel controls" role="group" aria-label="Navigation">
  <button type="button" class="icon" title="Zoomer (+)" aria-label="Zoomer" aria-keyshortcuts="+" onclick={onzoomin}>
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  </button>
  <button
    type="button"
    class="icon"
    title="Dézoomer (−)"
    aria-label="Dézoomer"
    aria-keyshortcuts="-"
    onclick={onzoomout}
  >
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
    </svg>
  </button>
  <hr />
  <button
    type="button"
    class="icon"
    title="Recentrer sur 0, 0 (touche 0)"
    aria-label="Recentrer sur 0, 0"
    aria-keyshortcuts="0"
    onclick={onrecenter}
  >
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  </button>
  <hr />
  <button
    type="button"
    class="icon"
    title="Raccourcis clavier (?)"
    aria-label="Raccourcis clavier"
    aria-keyshortcuts="Shift+?"
    aria-haspopup="dialog"
    onclick={onhelp}
  >
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
    </svg>
  </button>
</div>

<style>
  .controls {
    right: 12px;
    bottom: 16px;
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .icon {
    width: 36px;
    height: 36px;
  }
  hr {
    width: 100%;
    margin: 2px 0;
    border: 0;
    border-top: 1px solid #3a3a3a;
  }
</style>
