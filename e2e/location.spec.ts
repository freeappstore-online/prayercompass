import { LOCATION_KEY, appStatus, expect, navTo, open, pickCity, test } from './fixtures'

// Location from all three sources: the device (geolocation), the bundled
// city list, and typed coordinates. It's kept in localStorage only.

test('with no location, Today asks for one and links to Settings', async ({ page }) => {
  await open(page)
  await expect(page.getByText('Set your location to see prayer times')).toBeVisible()
  await page.getByRole('main').getByRole('button', { name: 'Set location' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()
})

test('location from the device (geolocation)', async ({ page, context }) => {
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ latitude: 51.5074, longitude: -0.1278 })
  await open(page, '/settings')
  await page.getByRole('button', { name: 'Use my location' }).click()
  await expect(appStatus(page)).toHaveText('Location set from your device.')
  await expect(page.getByText('51.5074° N, 0.1278° W').first()).toBeVisible()
  await expect(page.getByText(/· from your device$/)).toBeVisible()
  await navTo(page, 'Today')
  await expect(page.getByText('51.5074° N, 0.1278° W')).toBeVisible()
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(6)
})

test('a refused location permission explains the alternatives', async ({ page, context }) => {
  await context.clearPermissions()
  await page.addInitScript(() => {
    // Behave as if the user refused the browser's permission prompt.
    navigator.geolocation.getCurrentPosition = (_ok, fail) =>
      fail?.({ code: 1, message: 'denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError)
  })
  await open(page, '/settings')
  await page.getByRole('button', { name: 'Use my location' }).click()
  await expect(appStatus(page)).toContainText('Location permission was denied')
  await expect(appStatus(page)).toContainText('Search for a city or enter coordinates instead')
})

test('location from the offline city list, with no network request', async ({ page, bodies }) => {
  await open(page, '/settings')
  const before = bodies.length
  await page.getByLabel('Search for a city').fill('sao pau')
  const results = page.getByRole('list', { name: 'Matching cities' })
  await expect(results.getByRole('button')).toHaveCount(1)
  await expect(results).toContainText('São Paulo, Brazil')
  await page.getByLabel('Search for a city').fill('hyderabad')
  await expect(results.getByRole('button')).toHaveCount(2)
  await page.getByLabel('Search for a city').fill('zzzz')
  await expect(results).toContainText('No city found')
  await pickCity(page, 'istanbul', /Istanbul/)
  await expect(appStatus(page)).toHaveText('Location set to Istanbul, Türkiye.')
  await expect(page.getByText('from the city list')).toBeVisible()
  // Searching and choosing a city sent nothing off the device.
  expect(bodies.slice(before)).toEqual([])
  await navTo(page, 'Today')
  await expect(page.getByText('Istanbul, Türkiye ·')).toBeVisible()
})

test('location from typed coordinates, with validation', async ({ page }) => {
  await open(page, '/settings')
  await page.getByLabel('Latitude (-90 to 90)').fill('95')
  await page.getByLabel('Longitude (-180 to 180)').fill('10')
  await page.getByRole('button', { name: 'Save coordinates' }).click()
  await expect(page.getByRole('alert')).toHaveText('Latitude must be a number from -90 to 90.')
  await page.getByLabel('Latitude (-90 to 90)').fill('-33,8688')
  await page.getByLabel('Longitude (-180 to 180)').fill('151.2093')
  await page.getByRole('button', { name: 'Save coordinates' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(appStatus(page)).toHaveText('Location set from the coordinates you entered.')
  await expect(page.getByText('entered by hand')).toBeVisible()
  await expect(page.getByText('33.8688° S, 151.2093° E').first()).toBeVisible()
})

test('the location persists across reloads, only in localStorage, and can be forgotten', async ({ page }) => {
  await open(page, '/settings')
  await pickCity(page, 'cairo', /Cairo/)
  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.getByText('Cairo, Egypt', { exact: true })).toBeVisible()
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), LOCATION_KEY)
  expect(stored).toEqual({ source: 'city', latitude: 30.04, longitude: 31.24, label: 'Cairo, Egypt' })
  // Nothing else holds it: no cookies.
  expect(await page.context().cookies()).toEqual([])

  await page.getByRole('button', { name: 'Forget location' }).click()
  await expect(appStatus(page)).toHaveText('Location removed from this device.')
  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.getByText('Not set')).toBeVisible()
  expect(await page.evaluate((key) => localStorage.getItem(key), LOCATION_KEY)).toBeNull()
})
