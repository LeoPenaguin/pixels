<!-- Keyboard shortcut list. Native <dialog>: the browser traps focus, handles Escape and restores focus. -->
<script lang="ts">
  let dialog: HTMLDialogElement

  export function open() {
    dialog.showModal()
  }

  export function isOpen() {
    return dialog.open
  }

  const SHORTCUTS: [keys: string[], joiner: string, label: string][] = [
    [['←', '↑', '→', '↓'], ' ', 'Déplacer le curseur (la vue suit)'],
    [['Maj', 'flèches'], ' + ', 'Déplacer de 10 pixels'],
    [['Entrée', 'Espace'], ' ou ', 'Poser un pixel sous le curseur'],
    [['+', '−'], ' ', 'Zoomer, dézoomer'],
    [['0'], '', 'Revenir en 0, 0'],
    [['C'], '', 'Ouvrir ou fermer les couleurs (flèches pour choisir)'],
    [['G'], '', 'Afficher ou cacher la grille'],
    [['Tab'], '', "Passer d'un bouton à l'autre ; les champs X / Y permettent de sauter à un pixel"],
    [['Échap'], '', 'Fermer la palette ou cette aide'],
    [['?'], '', 'Afficher cette aide'],
  ]
</script>

<!-- A click on the backdrop (outside the content) closes the dialog; Escape does the same. -->
<dialog
  class="panel help"
  bind:this={dialog}
  aria-labelledby="help-title"
  onclick={(e) => {
    if (e.target === dialog) dialog.close()
  }}
>
  <div class="head">
    <h2 id="help-title">Raccourcis clavier</h2>
    <button
      type="button"
      class="icon"
      aria-label="Fermer"
      title="Fermer (Échap)"
      onclick={() => {
        dialog.close()
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  </div>
  <dl>
    {#each SHORTCUTS as [keys, joiner, label] (label)}
      <dt>
        {#each keys as k, i (k)}{#if i}{joiner}{/if}<kbd>{k}</kbd>{/each}
      </dt>
      <dd>{label}</dd>
    {/each}
  </dl>
</dialog>

<style>
  .help {
    max-width: min(440px, calc(100vw - 32px));
    padding: 16px 18px;
    border: 0;
    line-height: 1.4;
  }
  .help::backdrop {
    background: rgb(0 0 0 / 0.35);
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  h2 {
    margin: 0;
    font-size: 15px;
  }
  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 8px 16px;
    margin: 0;
  }
  dt {
    white-space: nowrap;
  }
  dd {
    margin: 0;
    color: #c8c8c8;
    font-weight: 400;
  }
  kbd {
    display: inline-block;
    min-width: 1.4em;
    padding: 2px 5px;
    border-radius: 4px;
    background: #333;
    font: inherit;
    text-align: center;
  }
</style>
