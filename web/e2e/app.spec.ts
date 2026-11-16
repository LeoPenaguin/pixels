import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

type PixelInfo = { x: number; y: number; c: number; changes: number }

/** A random white pixel of the 1024 × 1024 world, so painting it black is always a change,
 *  whatever earlier runs left in Redis. Returns its current history too. */
async function whitePixel(request: APIRequestContext): Promise<PixelInfo> {
  for (;;) {
    const [x, y] = [0, 0].map(() => Math.floor(Math.random() * 1024) - 512)
    const res = await request.get(`/api/pixels/${String(x)}/${String(y)}`)
    const info = (await res.json()) as PixelInfo
    if (info.c === 0) return info
  }
}

const changes = (n: number) => `${String(n)} changement${n > 1 ? 's' : ''} · dernier`

/** Opens the app and waits for the configuration (commands are inert before that). */
async function open(page: Page) {
  await page.bringToFront() // several players: the front page receives the keyboard
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Grille' })).toBeVisible()
}

async function jumpTo(page: Page, { x, y }: { x: number; y: number }) {
  await page.getByRole('spinbutton', { name: 'Coordonnée X' }).fill(String(x))
  await page.getByRole('spinbutton', { name: 'Coordonnée Y' }).fill(String(y))
  await page.keyboard.press('Enter')
}

test('painting with the keyboard: stored, broadcast, and the page reopens on it', async ({ page, browser }) => {
  const before = await whitePixel(page.request)
  const target = { x: before.x, y: before.y }
  await open(page)
  await jumpTo(page, target)

  // A second player looks at the same pixel.
  const other = await browser.newPage()
  await open(other)
  await jumpTo(other, target)
  const board2 = other.getByRole('application', { name: 'Board de pixels' })
  await board2.focus()
  await other.keyboard.press('Enter') // shows the cursor, announces the pixel
  await expect(other.locator('[aria-live]')).toHaveText(new RegExp(`^${String(target.x)}, ${String(target.y)} : Blanc`))

  await page.bringToFront()
  const board = page.getByRole('application', { name: 'Board de pixels' })
  await board.focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Space')
  await expect(page.locator('[aria-live]')).toHaveText(new RegExp(`posé en ${String(target.x)}, ${String(target.y)}$`))

  const res = await page.request.get(`/api/pixels/${String(target.x)}/${String(target.y)}`)
  expect(await res.json()).toMatchObject({ ...target, changes: before.changes + 1 })

  // The broadcast pixel reloads the history for the other player.
  await expect(other.getByText(changes(before.changes + 1))).toBeVisible()

  await page.reload()
  await expect(page.getByRole('spinbutton', { name: 'Coordonnée X' })).toHaveValue(String(target.x))
  await expect(page.getByRole('spinbutton', { name: 'Coordonnée Y' })).toHaveValue(String(target.y))
})

test('palette, grid and help from the keyboard', async ({ page }) => {
  await open(page)
  await page.getByRole('application', { name: 'Board de pixels' }).focus()
  await page.keyboard.press('g')
  await expect(page.getByRole('button', { name: 'Grille' })).toHaveAttribute('aria-pressed', 'false')

  await page.keyboard.press('c')
  const radios = page.getByRole('radio')
  await expect(radios.locator('xpath=self::*[@aria-checked="true"]')).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('radiogroup')).toBeHidden()
  await expect(page.getByRole('button', { name: /^Couleurs, couleur actuelle/ })).toBeFocused()

  await page.keyboard.press('?')
  await expect(page.getByRole('dialog', { name: 'Raccourcis clavier' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('the navigation buttons recenter on 0, 0', async ({ page }) => {
  await open(page)
  await jumpTo(page, { x: 500, y: 500 })
  await page.getByRole('button', { name: 'Zoomer', exact: true }).click()
  await page.getByRole('button', { name: 'Recentrer sur 0, 0' }).click()
  await expect(page.getByRole('spinbutton', { name: 'Coordonnée X' })).toHaveValue('0')
  await expect(page.getByRole('spinbutton', { name: 'Coordonnée Y' })).toHaveValue('0')
})
