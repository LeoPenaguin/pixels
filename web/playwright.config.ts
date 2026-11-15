// End-to-end tests: real Go server (Redis database 14, reserved for tests) and real Vite front,
// on their own ports so they do not clash with the dev servers.
import { defineConfig, devices } from '@playwright/test'

const API_PORT = 3017
const WEB_PORT = 5183

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
  // Reduced motion: camera moves are instant, hence deterministic.
  use: { baseURL: `http://localhost:${String(WEB_PORT)}`, trace: 'retain-on-failure', reducedMotion: 'reduce' },
  projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }],
  webServer: [
    {
      command: 'go run .',
      cwd: '../server',
      url: `http://localhost:${String(API_PORT)}/api/config`,
      env: { ADDR: `:${String(API_PORT)}`, REDIS_URL: 'redis://localhost:6379/14', PIXEL_BURST: '1000' },
    },
    {
      command: `pnpm exec vite --port ${String(WEB_PORT)} --strictPort`,
      url: `http://localhost:${String(WEB_PORT)}`,
      env: { API_PORT: String(API_PORT) },
    },
  ],
})
