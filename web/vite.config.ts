import { svelte } from '@sveltejs/vite-plugin-svelte'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

// In dev, the front and the Go server share one origin through this proxy.
// API_PORT lets the end-to-end tests target a dedicated Go server.
const api = `localhost:${process.env.API_PORT ?? '3007'}`

export default defineConfig({
  plugins: [svelte()],
  server: {
    proxy: {
      '/api': `http://${api}`,
      '/ws': { target: `ws://${api}`, ws: true },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    // Real browser: real canvas, <dialog>, focus and pointer events.
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      viewport: { width: 1024, height: 768 },
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,svelte}'],
      exclude: ['src/**/*.test.ts', 'src/test/**'],
      thresholds: { 100: true },
    },
  },
})
