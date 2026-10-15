import { expect, open, test } from './fixtures'

// Light and dark themes: the system preference on first load, then the
// user's choice from the theme button, remembered across reloads.

const theme = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.dataset.theme ?? 'light')
const themeColor = (page: import('@playwright/test').Page) =>
  page.locator('meta[name="theme-color"]').getAttribute('content')

test.describe('system dark', () => {
  test.use({ colorScheme: 'dark' })
  test('first load follows prefers-color-scheme: dark', async ({ page }) => {
    await open(page)
    expect(await theme(page)).toBe('dark')
    expect(await themeColor(page)).toBe('#000000')
  })
})

test.describe('system light', () => {
  test.use({ colorScheme: 'light' })
  test('first load follows prefers-color-scheme: light', async ({ page }) => {
    await open(page)
    expect(await theme(page)).toBe('light')
    expect(await themeColor(page)).toBe('#ffffff')
  })

  test('the theme button switches themes and the choice is remembered', async ({ page }) => {
    await open(page)
    await page.getByRole('button', { name: 'Theme: system' }).click()
    await expect(page.getByRole('button', { name: 'Theme: light' })).toBeVisible()
    expect(await theme(page)).toBe('light')
    await page.getByRole('button', { name: 'Theme: light' }).click()
    await expect(page.getByRole('button', { name: 'Theme: dark' })).toBeVisible()
    expect(await theme(page)).toBe('dark')
    await expect.poll(() => themeColor(page)).toBe('#000000')
    // Dark colours really apply.
    const background = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--paper').trim())
    expect(background).toMatch(/^#000(000)?$/)

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
