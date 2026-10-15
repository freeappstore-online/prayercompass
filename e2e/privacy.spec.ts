import { appStatus, expect, navTo, open, pickCity, test } from './fixtures'

// The privacy note, and what the app actually talks to. The live host's edge
// adds Cloudflare Web Analytics; the app itself must only ever talk to the
// FreeAppStore platform, and never send the location.

const ALLOWED_HOSTS = new Set(['api.freeappstore.online'])

test('the privacy note says what is stored, what is sent, and the analytics', async ({ page }) => {
  await open(page, '/about')
  const note = page.getByRole('region', { name: 'Privacy' })
  await expect(note).toBeVisible()
  await expect(note).toContainText('stored only in this browser on this device (localStorage)')
  await expect(note).toContainText('never sends your location anywhere')
  await expect(note).toContainText('City search uses a list built into the app')
  await expect(note).toContainText("there's no geocoding or other location service")
  await expect(note).toContainText("FreeAppStore's store analytics script")
  await expect(note).toContainText('without cookies')
  await expect(note).toContainText('Your location and settings are never included')
  await expect(note).toContainText('Cloudflare Web Analytics')
  await expect(note).toContainText('static.cloudflareinsights.com')
  await expect(note).toContainText('IP address')
  await expect(note).toContainText('No ads, no tracking cookies')
  await expect(page.getByRole('link', { name: 'adhan-js' })).toHaveAttribute('href', 'https://github.com/batoulapps/adhan-js')
})

test('Settings points to the privacy note', async ({ page }) => {
  await open(page, '/settings')
  await expect(page.getByText(/never leaves your device/)).toBeVisible()
  await expect(page.getByText(/full privacy note, including page-view counts, is on\s+the About screen/)).toBeVisible()
})

test('the app contacts only the FreeAppStore platform, and never sends the location', async ({ page, context, hosts, bodies }) => {
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ latitude: 48.8566, longitude: 2.3522 })
  await open(page, '/settings')
  await page.getByRole('button', { name: 'Use my location' }).click()
  await expect(appStatus(page)).toHaveText('Location set from your device.')
  await pickCity(page, 'kuala', /Kuala Lumpur/)
  await page.getByLabel('Latitude (-90 to 90)').fill('12.3456')
  await page.getByLabel('Longitude (-180 to 180)').fill('65.4321')
  await page.getByRole('button', { name: 'Save coordinates' }).click()
  for (const name of ['Today', 'Week', 'Qibla', 'About', 'Settings'] as const) await navTo(page, name)

  expect([...hosts].filter((h) => !ALLOWED_HOSTS.has(h))).toEqual([])
  for (const body of bodies) {
    for (const secret of ['48.85', '2.352', 'Kuala', '3.14', '101.69', '12.3456', '65.4321']) {
      expect(body, body).not.toContain(secret)
    }
  }
  expect(await context.cookies()).toEqual([])
})
