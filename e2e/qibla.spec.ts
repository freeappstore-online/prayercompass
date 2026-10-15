import { expect, open, test, withLocation } from './fixtures'

// The Qibla screen: a static arrow and the bearing from true north. No
// compass sensors are used.

test('with no location, Qibla asks for one', async ({ page }) => {
  await open(page, '/qibla')
  await expect(page.getByText('Set your location to see prayer times')).toBeVisible()
})

for (const [label, latitude, longitude, bearing, point] of [
  ['London, United Kingdom', 51.5074, -0.1278, '119.0°', 'ESE'],
  ['New York, United States', 40.7128, -74.006, '58.5°', 'ENE'],
  ['Jakarta, Indonesia', -6.2088, 106.8456, '295.2°', 'WNW'],
] as const) {
  test(`shows the bearing and arrow for ${label}`, async ({ page }) => {
    await withLocation(page, latitude, longitude, label)
    await open(page, '/qibla')
    await expect(page.getByText(`Qibla direction from your location · ${label}`)).toBeVisible()
    await expect(page.getByText(bearing, { exact: true })).toBeVisible()
    await expect(page.getByText(`from true north, clockwise (${point})`)).toBeVisible()
    const arrow = page.getByRole('img', { name: `Arrow pointing ${bearing} clockwise from true north, toward ${point}` })
    await expect(arrow).toBeVisible()
    const rotation = await arrow.locator('g[transform^="rotate("]').getAttribute('transform')
    expect(Number(/rotate\(([\d.]+)/.exec(rotation ?? '')?.[1]).toFixed(1) + '°').toBe(bearing)
  })
}

test('explains how to use a phone compass, and that live rotation is coming', async ({ page }) => {
  await withLocation(page, 51.5074, -0.1278, 'London, United Kingdom')
  await open(page, '/qibla')
  await expect(page.getByText(/open its built-in compass, align the compass north with true north/)).toBeVisible()
  await expect(page.getByText(/Live\s+compass rotation is coming in a future update/)).toBeVisible()
})

test('never asks for motion or orientation sensors', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __sensorCalls: string[] }
    w.__sensorCalls = []
    const add = window.addEventListener.bind(window)
    window.addEventListener = ((type: string, ...rest: unknown[]) => {
      if (/deviceorientation|devicemotion/.test(type)) w.__sensorCalls.push(type)
      return (add as (...a: unknown[]) => void)(type, ...rest)
    }) as typeof window.addEventListener
    const g = globalThis as unknown as Record<string, unknown>
    for (const name of ['Magnetometer', 'AbsoluteOrientationSensor', 'RelativeOrientationSensor', 'Gyroscope']) {
      g[name] = class {
        constructor() {
          w.__sensorCalls.push(name)
        }
      }
    }
  })
  await withLocation(page, 51.5074, -0.1278, 'London, United Kingdom')
  await open(page, '/qibla')
  await expect(page.getByText('119.0°', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => (window as unknown as { __sensorCalls: string[] }).__sensorCalls)).toEqual([])
})
