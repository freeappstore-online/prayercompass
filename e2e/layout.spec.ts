import { expect, open, test, withLocation } from './fixtures'

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
    for (const path of ['/', '/week', '/qibla', '/settings', '/about']) {
      test(`${path} fits without the page scrolling`, async ({ page }) => {
        await withLocation(page, 41.01, 28.98, 'Istanbul, Türkiye')
        await open(page, path)
        const size = await page.evaluate(() => ({
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
        }))
        expect(size.width).toBeLessThanOrEqual(viewport.width)
        expect(size.height).toBeLessThanOrEqual(viewport.height)
        // Sign in stays on screen, on one line.
        const signIn = page.getByRole('button', { name: 'Sign in' })
        await expect(signIn).toBeInViewport({ ratio: 1 })
        expect((await signIn.boundingBox())!.height).toBeLessThan(48)
        // The end of the screen is still reachable by scrolling its frame.
        const frame = page.locator('.pc-page')
        await frame.evaluate((el) => el.scrollTo({ top: el.scrollHeight }))
        await expect(frame.locator(':scope > div > *').last()).toBeInViewport()
      })
    }
  })
}
