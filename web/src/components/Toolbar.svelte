<!-- Bottom toolbar: one button per tool (each may open its panel above) and the quota. -->
<script lang="ts">
  import { tick } from 'svelte'
  import { colorName } from '../lib/colors'
  import type { QuotaRules, QuotaSnapshot } from '../lib/quota'
  import Palette from './Palette.svelte'
  import Quota from './Quota.svelte'

  type Props = {
    rows: string[][]
    color: number
    open: boolean // palette is open
    showGrid: boolean
    ontogglegrid: () => void
    quota: QuotaRules | null // null: no limit
    snapshot: QuotaSnapshot
    now: number
  }
  let { rows, color = $bindable(), open = $bindable(), showGrid, ontogglegrid, quota, snapshot, now }: Props = $props()

  let button: HTMLButtonElement
  let palette = $state<{ focus: () => void }>()
  const hex = $derived(rows.flat()[color])

  /** Opens the palette (focus on the selected colour) or closes it. */
  export async function toggle() {
    if (open) {
      close()
      return
    }
    open = true
    await tick()
    palette?.focus()
  }

  /** Closes the palette; if focus was inside, hands it back to the button so it is not lost. */
  export function close() {
    const inside = document.activeElement?.closest('#palette-panel')
    open = false
    if (inside) button.focus()
  }
</script>

<div class="dock">
  {#if open}
    <Palette bind:this={palette} {rows} bind:color />
  {/if}

  <div class="panel toolbar" role="group" aria-label="Outils">
    <button
      type="button"
      bind:this={button}
      class="icon tool"
      class:active={open}
      style:--c={hex}
      title="Couleurs (C)"
      aria-label={`Couleurs, couleur actuelle : ${colorName(hex)}`}
      aria-keyshortcuts="C"
      aria-expanded={open}
      aria-controls="palette-panel"
      onclick={toggle}
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path
          d="M12 21a9 9 0 0 1 0-18c4.97 0 9 3.58 9 8 0 1.06-.47 2.08-1.32 2.83-.84.75-1.99 1.17-3.18 1.17H14a2 2 0 0 0-1 3.75A1.3 1.3 0 0 1 12 21"
        />
        <circle cx="7.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="12" cy="7.5" r=".5" fill="currentColor" />
        <circle cx="16.5" cy="10.5" r=".5" fill="currentColor" />
      </svg>
      <span class="current" style:background={hex}></span>
    </button>
    <button
      type="button"
      class="icon square"
      class:active={showGrid}
      title="Afficher / cacher la grille (G)"
      aria-label="Grille"
      aria-keyshortcuts="G"
      aria-pressed={showGrid}
      onclick={ontogglegrid}
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <rect x="4" y="4" width="16" height="16" rx="1" /><path d="M9.33 4v16M14.67 4v16M4 9.33h16M4 14.67h16" />
      </svg>
    </button>
    {#if quota}
      <span class="sep" aria-hidden="true"></span>
      <Quota rules={quota} {snapshot} {now} />
    {/if}
  </div>
</div>

<style>
  .dock {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .toolbar {
    position: static;
    padding: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  /* The palette button takes a dark tint of the selected colour. */
  .tool {
    display: flex;
    align-items: center;
    gap: 8px;
    width: auto;
    height: 40px;
    padding: 0 10px;
    background: color-mix(in srgb, var(--c) 22%, #1e1e1e);
  }
  .tool:hover {
    background: color-mix(in srgb, var(--c) 30%, #1e1e1e);
  }
  .tool.active {
    background: color-mix(in srgb, var(--c) 38%, #1e1e1e);
  }
  .square {
    width: 40px;
    height: 40px;
  }
  .current {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    box-shadow: 0 0 0 1px rgb(255 255 255 / 0.35);
  }
  .sep {
    width: 1px;
    align-self: stretch;
    margin: 6px 4px;
    background: #3a3a3a;
  }
</style>
