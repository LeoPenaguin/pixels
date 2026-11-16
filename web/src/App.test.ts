import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-svelte'
import './app.css'
import App from './App.svelte'
import type { PixelInfo } from './lib/api'
import { FakeWebSocket, config as baseConfig, frames, stubFetch, stubWebSocket } from './test/fakes'

// The default colour is index 5 (black): a full row of greys is needed.
const config = {
  ...baseConfig,
  palette: [
    ['#FFFFFF', '#CDCDCD', '#9C9C9C', '#696969', '#373737', '#000000'],
    ['#E52521', '#1F5BFF'],
  ],
}

let info: Partial<PixelInfo> = {}
let configResponse: () => Response | Promise<Response>

beforeEach(() => {
  info = {}
  configResponse = () => Response.json(config)
  stubWebSocket()
  stubFetch({
    '/api/config': () => configResponse(),
    '/api/chunks/': () => new Response(new Uint8Array()),
    '/api/pixels/': (url) => {
      const [x, y] = url.split('/').slice(-2).map(Number)
      return Response.json({ x, y, c: 0, changes: 0, lastChange: null, ...info })
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const board = () => document.querySelector<HTMLCanvasElement>('canvas.world')!
const announced = (text: string) =>
  vi.waitFor(() => {
    expect(document.querySelector('[aria-live]')?.textContent).toBe(text)
  })
const fields = () => [...document.querySelectorAll<HTMLInputElement>('input')].map((i) => i.valueAsNumber)

/** Renders the app, waits for the configuration and opens the real-time connection. */
async function start() {
  const screen = await render(App)
  await expect.element(page.getByRole('button', { name: 'Grille' })).toBeVisible()
  const c = board()
  c.setPointerCapture = vi.fn()
  FakeWebSocket.last.open()
  return { screen, ws: FakeWebSocket.last }
}

const click = (x: number, y: number) => {
  for (const type of ['pointerdown', 'pointerup'])
    board().dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 1, button: 0, bubbles: true }))
}
const press = (key: string, init: KeyboardEventInit = {}) =>
  (document.activeElement ?? document.body).dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }),
  )

describe('painting pixels', () => {
  test('a click paints the selected colour and closes the palette', async () => {
    const { ws } = await start()
    await page.getByRole('button', { name: /^Couleurs/ }).click()
    await page.getByRole('radio', { name: 'Rouge vif' }).click()
    const center = board().getBoundingClientRect()
    click(center.width / 2, center.height / 2)
    expect(ws.sent).toEqual([{ x: 0, y: 0, c: 6 }])
    await announced('Rouge vif posé en 0, 0')
    await expect.element(page.getByRole('radiogroup')).not.toBeInTheDocument()
  })

  test('quota exhausted, then refilled by the server', async () => {
    const { ws } = await start()
    board().dispatchEvent(new PointerEvent('pointermove', { clientX: 10, clientY: 10 }))
    click(10, 10)
    click(10, 10)
    click(10, 10) // quota of 2: refused without sending anything
    expect(ws.sent).toHaveLength(2)
    await vi.waitFor(() => {
      expect(board().style.cursor).toBe('not-allowed')
    })
    await announced('Plus de pixel disponible, prochain dans 1 secondes')
    ws.receive({ t: 'q', n: 2 })
    await vi.waitFor(() => {
      expect(board().style.cursor).not.toBe('not-allowed')
    })
    click(10, 10)
    expect(ws.sent).toHaveLength(3)
  })

  test('offline: nothing is sent, the disconnection and then the reconnection are shown', async () => {
    const { ws } = await start()
    ws.close()
    await expect.element(page.getByRole('status')).toHaveTextContent('Connexion perdue, reconnexion…')
    click(10, 10)
    await announced('Hors ligne, pixel non posé')
    await vi.waitFor(() => {
      expect(FakeWebSocket.instances).toHaveLength(2)
    })
    FakeWebSocket.last.open()
    await expect.element(page.getByRole('status')).not.toBeInTheDocument()
  })

  test('without a quota limit, no gauge or countdown', async () => {
    configResponse = () => Response.json({ ...config, quota: { burst: 1, refillMs: 0 } })
    const { ws } = await start()
    click(10, 10)
    click(10, 10)
    expect(ws.sent).toHaveLength(2)
    await expect.element(page.getByText(/disponible/)).not.toBeInTheDocument()
  })
})

describe('targeted pixel history', () => {
  test('shown on hover, reloaded when the pixel changes', async () => {
    const { ws } = await start()
    info = { c: 5, changes: 2, lastChange: Date.now() - 5000 }
    const r = board().getBoundingClientRect()
    board().dispatchEvent(new PointerEvent('pointermove', { clientX: r.width / 2, clientY: r.height / 2 }))
    await expect.element(page.getByText('2 changements · dernier il y a 5 secondes')).toBeVisible()
    expect(fields()).toEqual([0, 0])

    info = { c: 2, changes: 3, lastChange: Date.now() }
    ws.receive({ t: 'b', p: [5, 5, 1, 0, 0, 2] })
    await expect.element(page.getByText(/^3 changements/)).toBeVisible()

    board().dispatchEvent(new PointerEvent('pointerleave'))
    await expect.element(page.getByText(/changements/)).not.toBeInTheDocument()
  })

  test('hover too short, or server down: nothing is shown', async () => {
    await start()
    board().dispatchEvent(new PointerEvent('pointermove', { clientX: 5, clientY: 5 }))
    board().dispatchEvent(new PointerEvent('pointerleave')) // left before loading
    await new Promise((r) => setTimeout(r, 300))
    vi.mocked(fetch).mockImplementation(() => Promise.reject(new Error('panne')))
    board().dispatchEvent(new PointerEvent('pointermove', { clientX: 50, clientY: 50 }))
    await new Promise((r) => setTimeout(r, 300))
    await expect.element(page.getByText(/peint/)).not.toBeInTheDocument()
  })
})

describe('keyboard', () => {
  test('arrow cursor with announcements, Enter paints, Shift goes further', async () => {
    const { ws } = await start()
    board().focus()
    press('Enter') // first press: shows the cursor at the centre
    await announced('0, 0 : Blanc')
    info = { c: 5, changes: 1, lastChange: 1 }
    press('ArrowRight')
    await announced('1, 0 : Noir, 1 changement')
    info = { c: 5, changes: 4, lastChange: 1 }
    press('ArrowDown', { shiftKey: true })
    await announced('1, 10 : Noir, 4 changements')
    expect(fields()).toEqual([1, 10])
    press(' ')
    expect(ws.sent).toEqual([{ x: 1, y: 10, c: 5 }])

    // The cursor moves before the info arrives: only the last position is announced.
    info = {}
    press('ArrowLeft')
    press('ArrowLeft')
    await announced('-1, 10 : Blanc')
  })

  test('view, grid, palette and help shortcuts', async () => {
    await start()
    board().focus()
    press('+')
    press('-')
    press('0')
    press('g')
    await expect.element(page.getByRole('button', { name: 'Grille' })).toHaveAttribute('aria-pressed', 'false')
    press('c')
    await expect.element(page.getByRole('radio', { name: 'Noir' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}') // handled by the palette, not the board
    await expect.element(page.getByRole('radio', { name: 'Rouge vif' })).toHaveFocus()
    press('Escape')
    await expect.element(page.getByRole('radiogroup')).not.toBeInTheDocument()
    press('?')
    await expect.element(page.getByRole('heading', { name: 'Raccourcis clavier' })).toBeVisible()
    press('g') // help open: shortcuts are disabled
    await expect.element(page.getByRole('button', { name: 'Grille' })).toHaveAttribute('aria-pressed', 'false')
    await userEvent.keyboard('{Escape}')
    press('x') // key without a shortcut
  })

  test('the X / Y fields keep their keys and allow jumping', async () => {
    const { ws } = await start()
    const x = page.getByRole('spinbutton', { name: 'Coordonnée X' })
    await x.fill('40')
    await userEvent.keyboard('{Enter}')
    await vi.waitFor(() => {
      expect(fields()).toEqual([40, 0]) // end of the animated jump
    })
    await page.getByRole('spinbutton', { name: 'Coordonnée Y' }).fill('7') // only y changes
    await userEvent.keyboard('{Enter}')
    await vi.waitFor(() => {
      expect(fields()).toEqual([40, 7])
    })
    await page.getByRole('button', { name: 'Zoomer', exact: true }).click()
    await page.getByRole('button', { name: 'Dézoomer' }).click()
    await page.getByRole('button', { name: 'Recentrer sur 0, 0' }).click()
    await page.getByRole('button', { name: 'Raccourcis clavier' }).click()
    await expect.element(page.getByRole('heading', { name: 'Raccourcis clavier' })).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await x.click()
    await userEvent.keyboard('{Enter}')
    expect(ws.sent).toEqual([]) // Enter in a field: jump, no pixel
  })
})

describe('loading', () => {
  test('server unreachable: a message instead of the board, inert shortcuts, then retry', async () => {
    let fail = true
    configResponse = () => (fail ? new Response('', { status: 503 }) : Response.json(config))
    const screen = await render(App)
    await expect.element(page.getByRole('heading', { name: 'Petit souci technique' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Zoomer', exact: true })).not.toBeInTheDocument()
    for (const k of ['ArrowUp', 'Enter', '+', '-', '0', 'g', 'c', 'Escape']) press(k)
    fail = false
    await expect.element(page.getByRole('button', { name: 'Grille' }), { timeout: 3000 }).toBeVisible()
    await expect.element(page.getByRole('alert')).not.toBeInTheDocument()
    await screen.unmount()
  })

  test('opens on 0, 0 and closes the connection when unmounted', async () => {
    const { screen } = await start()
    await frames()
    expect(fields()).toEqual([0, 0])
    await screen.unmount()
    expect(FakeWebSocket.last.readyState).toBe(3)
  })
})
