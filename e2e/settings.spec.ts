import { MAKKAH, expect, open, prayerRow, test, withLocation } from './fixtures'

// Calculation settings persist across reloads and change the times shown.

test.use({ timezoneId: 'Asia/Riyadh' })

test('settings persist across reloads and drive the times', async ({ page }) => {
  await page.clock.install({ time: new Date('2016-06-04T10:00:00+03:00') })
  await withLocation(page, MAKKAH.latitude, MAKKAH.longitude, MAKKAH.label)
  await open(page, '/settings')

  // Defaults.
  await expect(page.getByLabel('Calculation method')).toHaveValue('MuslimWorldLeague')
  await expect(page.getByLabel("Shafi'i, Maliki, Hanbali")).toBeChecked()
  await expect(page.getByLabel('High-latitude rule')).toHaveValue('middleofthenight')

  await page.getByLabel('Calculation method').selectOption({ label: 'Umm al-Qura (Makkah)' })
  await expect(page.getByText('Fajr 18.5°, Isha 90 min after Maghrib')).toBeVisible()
  await page.getByLabel('Hanafi').check()
  await page.getByLabel('High-latitude rule').selectOption({ label: 'One seventh of the night' })
  await page.getByLabel('Fajr', { exact: true }).fill('5')
  await page.getByLabel('Isha', { exact: true }).fill('-3')

  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.getByLabel('Calculation method')).toHaveValue('UmmAlQura')
  await expect(page.getByLabel('Hanafi')).toBeChecked()
  await expect(page.getByLabel('High-latitude rule')).toHaveValue('seventhofthenight')
  await expect(page.getByLabel('Fajr', { exact: true })).toHaveValue('5')
  await expect(page.getByLabel('Isha', { exact: true })).toHaveValue('-3')

  // Umm al-Qura + adjustments, against the published 4:11 AM Fajr and
  // 8:31 PM Isha; Hanafi Asr is later than the published (Shafi'i) 3:36 PM.
  await page.goto('/')
  await expect(page.getByText('Umm al-Qura (Makkah)', { exact: false })).toBeVisible()
  await expect(prayerRow(page, 'Fajr')).toContainText('4:16 AM')
  await expect(prayerRow(page, 'Isha')).toContainText('8:28 PM')
  await expect(prayerRow(page, 'Asr')).toContainText(/4:\d\d PM/)

  // Adjustments are clamped to ±60 minutes.
  await page.goto('/settings')
  await page.getByLabel('Dhuhr', { exact: true }).fill('500')
  await page.getByLabel('Dhuhr', { exact: true }).blur()
  await expect(page.getByLabel('Dhuhr', { exact: true })).toHaveValue('60')

  await page.getByRole('button', { name: 'Reset to defaults' }).click()
  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.getByLabel('Calculation method')).toHaveValue('MuslimWorldLeague')
  await expect(page.getByLabel("Shafi'i, Maliki, Hanbali")).toBeChecked()
  await expect(page.getByLabel('Fajr', { exact: true })).toHaveValue('0')
})

test('every calculation method from the issue is offered', async ({ page }) => {
  await open(page, '/settings')
  const options = await page.getByLabel('Calculation method').locator('option').allTextContents()
  expect(options).toEqual([
    'Muslim World League',
    'ISNA (North America)',
    'Umm al-Qura (Makkah)',
    'Egyptian General Authority',
    'University of Islamic Sciences, Karachi',
    'Institute of Geophysics, Tehran',
    'Gulf region',
    'Moonsighting Committee',
  ])
  const rules = await page.getByLabel('High-latitude rule').locator('option').allTextContents()
  expect(rules).toEqual(['Middle of the night', 'One seventh of the night', 'Twilight angle'])
})
