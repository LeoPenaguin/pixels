<!-- Quota gauge: the ring shows the next pixel's refill, the number the available pixels. -->
<script lang="ts">
  import { quotaAt, type QuotaRules, type QuotaSnapshot } from '../lib/quota'

  type Props = { rules: QuotaRules; snapshot: QuotaSnapshot; now: number }
  const { rules, snapshot, now }: Props = $props()

  const q = $derived(quotaAt(rules, snapshot, now))
  // The ring runs on a CSS animation, not on `now` (which ticks every 250 ms): one loop per pixel
  // regained, phased on the snapshot, stopping full. Restarted only when a new snapshot arrives.
  const ring = $derived.by(() => {
    const q0 = quotaAt(rules, snapshot, snapshot.at)
    return { delay: -q0.progress * rules.refillMs, loops: rules.burst - q0.available }
  })
  const s = (n: number) => (n > 1 ? 's' : '')
</script>

<div class="quota" class:empty={q.available === 0}>
  <span class="sr-only">
    {`${String(q.available)} pixel${s(q.available)} disponible${s(q.available)} sur ${String(rules.burst)}${
      q.full ? '' : `, prochain dans ${String(q.nextIn)} secondes`
    }`}
  </span>
  <span class="ring" aria-hidden="true">
    <svg viewBox="0 0 36 36" width="34" height="34">
      <circle class="track" cx="18" cy="18" r="15" />
      <!-- Recreated on each snapshot: the animation restarts in phase. The attribute is the
           fallback without animation (full, or reduced motion). -->
      {#key snapshot}
        <circle
          class="progress"
          class:filling={ring.loops > 0}
          cx="18"
          cy="18"
          r="15"
          pathLength="100"
          stroke-dasharray="100"
          stroke-dashoffset={100 - q.progress * 100}
          transform="rotate(-90 18 18)"
          style:animation-duration={`${String(rules.refillMs)}ms`}
          style:animation-delay={`${String(ring.delay)}ms`}
          style:animation-iteration-count={ring.loops}
        />
      {/key}
    </svg>
    <span class="num">{q.available}</span>
  </span>
  <span class="label" aria-hidden="true">
    <span>{`pixel${s(q.available)}`}</span>
    <span class="sub">{q.full ? `max ${String(rules.burst)}` : `+1 dans ${String(q.nextIn)} s`}</span>
  </span>
</div>

<style>
  .quota {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-right: 10px;
    --q: #f2f2f2;
  }
  .quota.empty {
    --q: #8a8a8a;
  }
  .ring {
    position: relative;
    display: grid;
    place-items: center;
  }
  .ring circle {
    fill: none;
    stroke-width: 3.5;
  }
  .track {
    stroke: #3a3a3a;
  }
  .progress {
    stroke: var(--q);
    stroke-linecap: round;
  }
  .filling {
    animation-name: fill;
    animation-timing-function: linear;
    animation-fill-mode: both;
  }
  @keyframes fill {
    from {
      stroke-dashoffset: 100;
    }
    to {
      stroke-dashoffset: 0;
    }
  }
  .num {
    position: absolute;
    font-size: 13px;
    font-weight: 600;
    color: var(--q);
    font-variant-numeric: tabular-nums;
  }
  .label {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 64px;
  }
  .sub {
    font-size: 11px;
    font-weight: 400;
    color: #8a8a8a;
    font-variant-numeric: tabular-nums;
  }
  @media (prefers-reduced-motion: reduce) {
    .filling {
      animation: none;
    }
  }
</style>
