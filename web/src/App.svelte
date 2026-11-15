<script lang="ts">
  import { onMount } from 'svelte'
  import { World, type Config } from './world'

  let canvas: HTMLCanvasElement
  let cfg = $state<Config>()
  let world: World | undefined
  let color = $state(5)
  let hover = $state<{ x: number; y: number } | null>(null)
  let cooldownUntil = $state(0)
  let now = $state(Date.now())
  let online = $state(false)
  let error = $state('')

  const left = $derived(Math.max(0, Math.ceil((cooldownUntil - now) / 1000)))

  let ws: WebSocket | undefined

  function connect() {
    ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`)
    // À chaque (re)connexion on recharge les chunks : rien de raté entre le fetch et le flux live.
    ws.onopen = () => {
      online = true
      world?.reload()
    }
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.t === 'p') world?.setPixel(msg.x, msg.y, msg.c)
      else if (msg.t === 'cd') cooldownUntil = Date.now() + msg.ms
    }
    ws.onclose = () => {
      online = false
      setTimeout(connect, 1000)
    }
  }

  function place(x: number, y: number) {
    if (Date.now() < cooldownUntil || ws?.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ x, y, c: color }))
  }

  function key(e: KeyboardEvent) {
    if (e.key === '+' || e.key === '=') world?.zoomAt(1.5)
    else if (e.key === '-') world?.zoomAt(1 / 1.5)
  }

  onMount(() => {
    const tick = setInterval(() => (now = Date.now()), 250)
    fetch('/api/config')
      .then((r) => r.json())
      .then((c: Config) => {
        cfg = c
        world = new World(canvas, c)
        world.onHover = (p) => (hover = p)
        world.onPlace = place
        connect()
      })
      .catch(() => (error = 'Serveur injoignable'))
    return () => clearInterval(tick)
  })
</script>

<svelte:window onkeydown={key} />

<canvas bind:this={canvas}></canvas>

<div class="badge top-left">
  {#if error}{error}
  {:else if hover}{hover.x}, {hover.y}
  {:else}—{/if}
  <span class="dot" class:online title={online ? 'Connecté' : 'Déconnecté'}></span>
</div>

{#if cfg}
  <div class="toolbar" role="toolbar" aria-label="Couleurs">
    {#each cfg.palette as hex, i (hex)}
      <button
        style:background={hex}
        class:selected={i === color}
        aria-label={hex}
        aria-pressed={i === color}
        onclick={() => (color = i)}
      ></button>
    {/each}
    <span class="cooldown">{left ? `${left} s` : 'Prêt'}</span>
  </div>
{/if}

<style>
  canvas {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    cursor: crosshair;
    touch-action: none;
  }
  .badge,
  .toolbar {
    position: fixed;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgb(0 0 0 / 0.15);
    font: 500 13px/1 system-ui, sans-serif;
  }
  .top-left {
    top: 12px;
    left: 12px;
    padding: 8px 10px;
    display: flex;
    gap: 8px;
    align-items: center;
    font-variant-numeric: tabular-nums;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #d34f3e;
  }
  .dot.online {
    background: #5cc96e;
  }
  .toolbar {
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    max-width: calc(100vw - 32px);
    box-sizing: border-box;
    padding: 8px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
    align-items: center;
  }
  button {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: 1px solid rgb(0 0 0 / 0.15);
    cursor: pointer;
    padding: 0;
  }
  button.selected {
    outline: 2px solid #0d99ff;
    outline-offset: 1px;
  }
  .cooldown {
    min-width: 44px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
</style>
