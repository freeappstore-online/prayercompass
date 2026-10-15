import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, open, test, withLocation } from './fixtures'

// Accessibility: axe-core (WCAG 2.0/2.1/2.2 A and AA) on every screen, in
// both themes, plus a keyboard pass and an RTL check.

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function audit(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze()
  const summary = results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`,
  )
  expect(summary, `axe violations on ${label}`).toEqual([])
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(theme, () => {
    test.use({ colorScheme: theme })
    for (const path of ['/', '/week', '/qibla', '/settings', '/about']) {
      test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
        await withLocation(page, 41.01, 28.98, 'Istanbul, Türkiye')
        await open(page, path)
        if (path === '/settings') await page.getByLabel('Search for a city').fill('is')
        await audit(page, `${path} (${theme})`)
      })
    }
    test('Today without a location has no WCAG A/AA violations', async ({ page }) => {
      await open(page)
      await audit(page, `/ no location (${theme})`)
    })
  })
}

test('every control on Settings is reachable by keyboard and shows a focus ring', async ({ page }) => {
  await withLocation(page, 41.01, 28.98, 'Istanbul, Türkiye')
  await open(page, '/settings')
  const reached: string[] = []
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab')
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement
      const style = getComputedStyle(el)
      return {
        name: el.getAttribute('aria-label') || el.textContent?.trim() || el.id,
        tag: el.tagName.toLowerCase(),
        type: (el as HTMLInputElement).type ?? '',
        ring: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2,
      }
    })
    if (info.tag === 'body') break
    expect(info.ring, `focus ring on ${info.tag} ${info.name}`).toBe(true)
    reached.push(`${info.tag}:${info.type}:${info.name}`)
  }
  for (const want of ['Forget location', 'Use my location', 'Save coordinates', 'Reset to defaults']) {
    expect(reached.some((r) => r.includes(want)), want).toBe(true)
  }
  expect(reached.filter((r) => r.startsWith('select')).length).toBe(2)
  expect(reached.filter((r) => r.startsWith('input:number')).length).toBe(6)
  expect(reached.some((r) => r.startsWith('input:radio'))).toBe(true)
})

test('the week table can be scrolled with the keyboard', async ({ page }) => {
  await withLocation(page, 41.01, 28.98, 'Istanbul, Türkiye')
  await open(page, '/week')
  const region = page.getByRole('region', { name: 'Prayer times this week' })
  await region.focus()
  await expect(region).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('End')
  await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0)
})

test('in a right-to-left page, layout mirrors and nothing overflows', async ({ page }) => {
  await withLocation(page, 41.01, 28.98, 'Istanbul, Türkiye')
  for (const path of ['/', '/week', '/settings', '/qibla']) {
    await open(page, path)
    await page.evaluate(() => {
      document.documentElement.dir = 'rtl'
    })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), path).toBe(true)
    // Arabic prayer names are isolated so they render correctly either way.
    if (path !== '/qibla' && path !== '/settings') {
      const arabic = page.locator('[lang="ar"]')
      expect(await arabic.count()).toBeGreaterThanOrEqual(6)
      for (const dir of await arabic.evaluateAll((els) => els.map((e) => e.getAttribute('dir')))) expect(dir).toBe('auto')
    }
  }
})
