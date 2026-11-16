<!-- Top-left panel: coordinates of the targeted pixel (editable to jump there) and its history. -->
<script lang="ts">
  import type { PixelInfo } from '../lib/api'
  import type { Point } from '../lib/engine/camera'
  import { ago } from '../lib/time'

  type Props = {
    position: Point // targeted pixel, or view centre
    info: PixelInfo | null // history of `position`, once loaded
    now: number
    onjump: (x: number, y: number) => void
  }
  const { position, info, now, onjump }: Props = $props()

  // The fields follow `position`, except while being edited.
  let editing = $state(false)
  let fx = $state<number | null>(null)
  let fy = $state<number | null>(null)
  $effect.pre(() => {
    if (editing) return
    fx = position.x
    fy = position.y
  })

  function submit(e: SubmitEvent) {
    e.preventDefault()
    if (fx === null || fy === null || !Number.isInteger(fx) || !Number.isInteger(fy)) return
    onjump(fx, fy)
    ;(document.activeElement as HTMLElement).blur()
  }

  function cancel(e: KeyboardEvent) {
    if (e.key === 'Escape') (e.currentTarget as HTMLElement).blur()
  }

  const plural = (n: number) => (n > 1 ? 's' : '')
</script>

<div class="panel top-left">
  <form
    class="row"
    aria-label="Aller à un pixel"
    onsubmit={submit}
    onfocusin={() => (editing = true)}
    onfocusout={(e) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) editing = false
    }}
  >
    <label>X <input type="number" step="1" bind:value={fx} onkeydown={cancel} aria-label="Coordonnée X" /></label>
    <label>Y <input type="number" step="1" bind:value={fy} onkeydown={cancel} aria-label="Coordonnée Y" /></label>
    <button class="icon" type="submit" title="Aller à ces coordonnées (Entrée)" aria-label="Aller à ces coordonnées">
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  </form>
  {#if info}
    <div class="info">
      {#if info.lastChange}
        {`${String(info.changes)} changement${plural(info.changes)} · dernier ${ago(info.lastChange, now)}`}
      {:else if info.c}
        Peint avant le suivi des changements
      {:else}
        Jamais peint
      {/if}
    </div>
  {/if}
</div>

<style>
  .top-left {
    top: 12px;
    left: 12px;
    padding: 4px 4px 4px 10px;
  }
  .row {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .info {
    padding: 2px 6px 6px 0;
    font-weight: 400;
    color: #a0a0a0;
  }
  label {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #a0a0a0;
  }
  input {
    width: 8ch;
    padding: 4px 6px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: #2c2c2c;
    font: inherit;
    color: #f2f2f2;
    font-variant-numeric: tabular-nums;
  }
  input:focus {
    outline: none;
    border-color: #f2f2f2;
  }
</style>
