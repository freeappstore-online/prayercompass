import { MAKKAH, MAKKAH_2016_06_04, expect, navTo, open, prayerRow, test, withLocation, withUmmAlQura } from './fixtures'

// Today's times, the countdown, and the week view, for Makkah on 4 June 2016
// with the Umm al-Qura method, checked against the published timetable.

test.use({ timezoneId: 'Asia/Riyadh' })

test.beforeEach(async ({ page }) => {
  await withLocation(page, MAKKAH.latitude, MAKKAH.longitude, MAKKAH.label)
  await withUmmAlQura(page)
})

test('Today shows the six times, matching the published timetable', async ({ page }) => {
  await page.clock.install({ time: new Date('2016-06-04T10:00:00+03:00') })
  await open(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible()
  for (const [name, time] of Object.entries(MAKKAH_2016_06_04)) {
    await expect(prayerRow(page, name)).toContainText(time)
  }
  // Arabic names are marked up for bidi.
  await expect(page.locator('span[dir="auto"][lang="ar"]', { hasText: 'الفجر' }).first()).toBeVisible()
})

test('the Hijri date is in the header and labelled as an estimate', async ({ page }) => {
  await page.clock.install({ time: new Date('2016-06-04T10:00:00+03:00') })
  await open(page)
  // 28 Sha'ban 1437 on the ummulqura.org.sa timetable for this day.
  await expect(page.getByText("28 Sha'ban 1437 AH (estimated)")).toBeVisible()
  await expect(page.getByText('Saturday, June 4, 2016')).toBeVisible()
})

test('the countdown ticks every second toward the next prayer', async ({ page }) => {
  await page.clock.install({ time: new Date('2016-06-04T02:59:00+03:00') })
  await open(page)
  // Stop the clock at exactly 3:00:00, then step it a second at a time.
  await page.clock.pauseAt(new Date('2016-06-04T03:00:00+03:00'))
  const countdown = page.getByRole('main').locator('p.tabular-nums').first()
  await expect(page.getByText('Next: Fajr at 4:11 AM')).toBeAttached()
  await page.clock.runFor(1000)
  await expect(countdown).toHaveText('01:10:59')
  await page.clock.runFor(1000)
  await expect(countdown).toHaveText('01:10:58')
  await page.clock.runFor(2000)
  await expect(countdown).toHaveText('01:10:56')
  // Before Fajr nothing is current yet.
  await expect(page.locator('[aria-current="true"]')).toHaveCount(0)
})

test('at Fajr, Fajr is current and the countdown moves on to sunrise', async ({ page }) => {
  await page.clock.install({ time: new Date('2016-06-04T04:10:58+03:00') })
  await open(page)
  await expect(page.getByText('Next: Fajr at 4:11 AM')).toBeAttached()
  await page.clock.runFor(3000)
  await expect(page.getByText('Next: Sunrise at 5:38 AM')).toBeAttached()
  const current = page.locator('[aria-current="true"]')
  await expect(current).toHaveCount(1)
  await expect(current).toContainText('Fajr')
  await expect(current).toContainText('Now')
})

test("after Isha, the countdown is to tomorrow's Fajr", async ({ page }) => {
  await page.clock.install({ time: new Date('2016-06-04T21:59:00+03:00') })
  await open(page)
  await page.clock.pauseAt(new Date('2016-06-04T22:00:00+03:00'))
  await page.clock.runFor(1000)
  await expect(page.getByText(/^Next: Fajr at 4:1\d AM$/)).toBeAttached()
  await expect(page.locator('[aria-current="true"]')).toContainText('Isha')
  const countdown = page.getByRole('main').locator('p.tabular-nums').first()
  await expect(countdown).toHaveText(/^06:1\d:59$/)
})

test('the week view lists seven days of six prayers and scrolls without breaking the layout', async ({ page }) => {
  await page.clock.install({ time: new Date('2016-06-04T10:00:00+03:00') })
  await open(page)
  await navTo(page, 'Week')
  await expect(page.getByRole('heading', { level: 1, name: 'This week' })).toBeVisible()
  const table = page.getByRole('table')
  await expect(table.getByRole('columnheader')).toHaveCount(7)
  for (const name of ['Day', 'Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
    await expect(table.getByRole('columnheader', { name: new RegExp(`^${name}`) })).toBeVisible()
  }
  const rows = table.getByRole('row')
  await expect(rows).toHaveCount(8)
  await expect(rows.nth(1)).toContainText('Today')
  await expect(rows.nth(1)).toContainText('4:11 AM')
  await expect(rows.nth(7)).toContainText('Fri, Jun 10')
  for (let i = 1; i <= 7; i++) await expect(rows.nth(i).getByRole('cell')).toHaveCount(6)

  // The table scrolls inside its own region; the page itself never scrolls sideways.
  const region = page.getByRole('region', { name: 'Prayer times this week' })
  const overflow = await region.evaluate((el) => ({ inner: el.scrollWidth > el.clientWidth }))
  expect(overflow.inner).toBe(true)
  await region.evaluate((el) => el.scrollBy({ left: 1000 }))
  await expect(table.getByRole('columnheader', { name: /^Isha/ })).toBeInViewport()
  // The day column stays visible while scrolled.
  await expect(rows.nth(1).getByRole('rowheader')).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await page.getByRole('button', { name: /Back to today/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible()
})

test('the main nav reaches every screen', async ({ page }) => {
  await open(page)
  for (const name of ['Week', 'Qibla', 'Settings', 'About', 'Today'] as const) await navTo(page, name)
})
