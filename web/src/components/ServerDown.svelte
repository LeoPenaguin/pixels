<!-- Shown instead of the board while the server cannot be reached on load. The app retries on its own. -->
<script lang="ts">
  // A small board with a few pixels missing (null).
  const CELLS = [
    '#E52521',
    '#FFD635',
    '#1F5BFF',
    '#2ECC40',
    null,
    null,
    '#E52521',
    null,
    '#FFD635',
    '#1F5BFF',
    null,
    '#2ECC40',
  ]
</script>

<div class="panel down" role="alert">
  <div class="cells" aria-hidden="true">
    {#each CELLS as fill, i (i)}
      <span class:missing={!fill} style:background={fill}></span>
    {/each}
  </div>
  <h1>Petit souci technique</h1>
  <p>Le serveur ne répond pas pour le moment. On réessaie tout seuls, pas besoin de recharger la page.</p>
  <p class="retry">Nouvel essai en cours<span class="dots" aria-hidden="true">…</span></p>
</div>

<style>
  .down {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(340px, calc(100vw - 48px));
    padding: 24px;
    text-align: center;
    line-height: 1.5;
  }
  .cells {
    display: inline-grid;
    grid-template-columns: repeat(4, 14px);
    gap: 3px;
    margin-bottom: 12px;
  }
  .cells span {
    height: 14px;
    border-radius: 2px;
  }
  .cells .missing {
    outline: 1px dashed #666;
    outline-offset: -1px;
  }
  h1 {
    margin: 0 0 8px;
    font-size: 17px;
    font-weight: 600;
  }
  p {
    margin: 0;
    font-weight: 400;
    color: #c8c8c8;
  }
  .retry {
    margin-top: 12px;
    font-size: 12px;
    color: #8a8a8a;
  }
  .dots {
    animation: blink 1.4s steps(2) infinite;
  }
  @keyframes blink {
    50% {
      opacity: 0.2;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dots {
      animation: none;
    }
  }
</style>
