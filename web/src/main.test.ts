import { afterEach, expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import { unmount } from 'svelte'
import { config, stubFetch, stubWebSocket } from './test/fakes'

afterEach(() => {
  vi.unstubAllGlobals()
})

test('mounts the app in the body', async () => {
  stubWebSocket()
  stubFetch({ '/api/config': () => Response.json(config), '/api/': () => new Response(new Uint8Array()) })
  const { default: app } = await import('./main')
  await expect.element(page.getByRole('application', { name: 'Board de pixels' })).toBeInTheDocument()
  await unmount(app)
})
