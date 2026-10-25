import { MAKKAH, MAKKAH_2016_06_04, expect, open, prayerRow, test, withLocation, withUmmAlQura } from './fixtures'

// PWA offline: after the first visit the service worker has cached the app,
// so it loads and shows prayer times with no network at all.

test.use({ timezoneId: 'Asia/Riyadh', serviceWorkers: 'allow' })

test('loads and shows prayer times, the week and the Qibla offline', async ({ page, context }) => {
  await page.clock.install({ time: new Date('2016-06-04T10:00:00+03:00') })
  await withLocation(page, MAKKAH.latitude, MAKKAH.longitude, MAKKAH.label)
  await withUmmAlQura(page)
  await open(page)
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  // The worker controls the page from the next load on.
  await page.reload({ waitUntil: 'networkidle' })
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible()
  await expect(page.getByText("28 Sha'ban 1437 AH (estimated)")).toBeVisible()
  await expect(page.getByText('Next: Dhuhr at 12:19 PM')).toBeVisible()
  for (const [name, time] of Object.entries(MAKKAH_2016_06_04)) {
    await expect(prayerRow(page, name)).toContainText(time)
  }
  // Self-hosted fonts come from the cache too.
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready
    return [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family))]
  })
  expect(fonts.sort()).toEqual(['Fraunces', 'Manrope'])

  // Other screens load offline as fresh navigations (SPA fallback).
  await page.goto('/week')
  await expect(page.getByRole('table')).toContainText('4:11 AM')
  await page.goto('/month')
  await expect(page.locator('tbody tr')).toHaveCount(30)
  await page.getByRole('button', { name: 'Next month' }).click()
  await expect(page.getByRole('heading', { name: 'July 2016' })).toBeVisible()
  await expect(page.locator('tbody tr')).toHaveCount(31)
  await page.getByRole('button', { name: 'Current month' }).click()
  await expect(page.locator('tr[aria-current=date]')).toContainText('4:11 AM')
  await page.goto('/qibla')
  await expect(page.getByRole('heading', { level: 1, name: 'Qibla' })).toBeVisible()
})

test('map survives offline reload with compass permission denied without transmitting coordinates', async ({ page, context }) => {
  await withLocation(page, -33.8688, 151.2093, 'Sydney')
  await page.addInitScript(() => {
    Object.defineProperty(window, 'DeviceOrientationEvent', { value: { requestPermission: () => Promise.resolve('denied') } })
  })
  const requests: string[] = []
  page.on('request', request => requests.push(request.url() + (request.postData() ?? '')))
  await open(page, '/qibla')
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.reload({ waitUntil: 'networkidle' })
  await context.setOffline(true)
  await page.reload()
  await page.getByRole('button', { name: 'Enable live compass' }).click()
  await expect(page.getByText(/Compass permission denied/)).toBeVisible()
  await expect(page.getByRole('img', { name: /North-up world map/ })).toBeVisible()
  await expect(page.locator('[data-map-route]')).toHaveAttribute('d', /^M.+L/)
  expect(requests.join('\n')).not.toMatch(/33\.8688|151\.2093/)
})
