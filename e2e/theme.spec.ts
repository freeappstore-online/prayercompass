import { expect, open, test } from './fixtures'
import { normalizeColor } from './colors'

// Light and dark themes: the system preference on first load, then the
// user's choice from the theme button, remembered across reloads.

const theme = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.dataset.theme ?? 'light')
const themeColor = async (page: import('@playwright/test').Page) =>
  normalizeColor(page, await page.locator('meta[name="theme-color"]').getAttribute('content'))

test.describe('system dark', () => {
  test.use({ colorScheme: 'dark' })
  test('first load follows prefers-color-scheme: dark', async ({ page }) => {
    await open(page)
    expect(await theme(page)).toBe('dark')
    expect(await themeColor(page)).toBe(await normalizeColor(page, '#000000'))
  })
})

test.describe('system light', () => {
  test.use({ colorScheme: 'light' })
  test('first load follows prefers-color-scheme: light', async ({ page }) => {
    await open(page)
    expect(await theme(page)).toBe('light')
    expect(await themeColor(page)).toBe(await normalizeColor(page, '#ffffff'))
  })

  test('the theme button switches themes and the choice is remembered', async ({ page }) => {
    await open(page)
    await page.getByRole('button', { name: 'Theme: system' }).click()
    await expect(page.getByRole('button', { name: 'Theme: light' })).toBeVisible()
    expect(await theme(page)).toBe('light')
    await page.getByRole('button', { name: 'Theme: light' }).click()
    await expect(page.getByRole('button', { name: 'Theme: dark' })).toBeVisible()
    expect(await theme(page)).toBe('dark')
    await expect.poll(() => themeColor(page)).toBe(await normalizeColor(page, '#000000'))
    // Dark colours really apply.
    const background = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--paper').trim())
    expect(await normalizeColor(page, background)).toBe(await normalizeColor(page, '#000000'))

    await page.reload({ waitUntil: 'networkidle' })
    expect(await theme(page)).toBe('dark')
    await expect(page.getByRole('button', { name: 'Theme: dark' })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('stores-theme'))).toBe('dark')

    // Back to following the system.
    await page.getByRole('button', { name: 'Theme: dark' }).click()
    await expect(page.getByRole('button', { name: 'Theme: system' })).toBeVisible()
    expect(await theme(page)).toBe('light')
  })
})

test('colour comparisons preserve equivalence, differences and invalid values', async ({ page }) => {
  await open(page)
  const black = await normalizeColor(page, '#000000')
  const white = await normalizeColor(page, '#ffffff')
  for (const value of ['#000', 'rgb(0, 0, 0)', 'rgba(0, 0, 0, 1)', 'hsl(0, 0%, 0%)']) {
    expect(await normalizeColor(page, value)).toBe(black)
  }
  expect(await normalizeColor(page, '#fff')).toBe(white)
  expect(black).not.toBe(white)
  expect(await normalizeColor(page, 'rgba(0, 0, 0, 0.5)')).not.toBe(black)
  for (const value of [null, '', 'not-a-colour', '#xyz', 'inherit', 'var(--missing)']) {
    await expect(normalizeColor(page, value)).rejects.toThrow(/invalid CSS colour/i)
  }
})
