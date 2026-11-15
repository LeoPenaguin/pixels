import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// En dev, le front et le serveur Go partagent la même origine via ce proxy.
export default defineConfig({
  plugins: [svelte()],
  server: {
    proxy: {
      '/api': 'http://localhost:3007',
      '/ws': { target: 'ws://localhost:3007', ws: true },
    },
  },
})
