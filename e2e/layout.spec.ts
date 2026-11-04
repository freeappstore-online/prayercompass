import { expect, navTo, open, test, withLocation } from './fixtures'

// Every screen fits the smallest supported phones in both orientations: the
// page never scrolls (each screen scrolls inside the app frame), matching
// what `fas screencheck` checks on the first screen.

for (const viewport of [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 568, height: 320 },
]) {
  test.describe(`${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport })
    for (const path of ['/', '/month', '/week', '/qibla', '/settings', '/about']) {
      test(`${path} fits without the page scrolling`, async ({ page }) => {
        await withLocation(page, 41.01, 28.98, 'Istanbul, Türkiye')
        await open(page, path)
        const size = await page.evaluate(() => ({
          width: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          height: document.documentElement.scrollHeight,
        }))
        expect(size.width).toBeLessThanOrEqual(viewport.width)
        expect(size.width).toBeLessThanOrEqual(size.clientWidth)
        expect(size.height).toBeLessThanOrEqual(viewport.height)
        // Sign in stays on screen, on one line.
        const signIn = page.getByRole('button', { name: 'Sign in' })
        await expect(signIn).toBeInViewport({ ratio: 1 })
        const box = (await signIn.boundingBox())!
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeLessThan(48)
        expect(await signIn.evaluate((el) => {
          const range = document.createRange()
          range.selectNodeContents(el)
          return range.getClientRects().length
        })).toBe(1)
        // The end of the screen is still reachable by scrolling its frame.
        const frame = page.locator('.pc-page')
        await frame.evaluate((el) => el.scrollTo({ top: el.scrollHeight }))
        await expect(frame.locator(':scope > div > *').last()).toBeInViewport()
      })
    }
  })
}

test.describe('320px navigation', () => {
  test.use({ viewport: { width: 320, height: 568 } })
  test('every nav item is reachable without horizontal overflow', async ({ page }) => {
    await open(page)
    for (const name of ['Monthly', 'Week', 'Qibla', 'Settings', 'About', 'Today'] as const) {
      await navTo(page, name)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    }
  })
})
