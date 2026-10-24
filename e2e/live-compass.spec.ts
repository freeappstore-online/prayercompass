import { expect, test } from '@playwright/test'

// Opt in after deployment: LIVE_COMPASS_SMOKE=1 pnpm exec playwright test e2e/live-compass.spec.ts
// This checks the actual host and app, but cannot replace a physical sensor check.
test('production host permits sensors and the deployed compass accepts a heading', async ({ page, request }) => {
  test.skip(process.env.LIVE_COMPASS_SMOKE !== '1', 'Run explicitly against the live site')

  const origin = 'https://prayercompass.freeappstore.online'
  const response = await request.get(`${origin}/qibla`)
  expect(response.ok()).toBe(true)
  const policy = response.headers()['permissions-policy'] ?? ''
  for (const feature of ['accelerometer', 'gyroscope', 'magnetometer']) {
    expect(policy, `${feature} must be allowed for this origin`).toMatch(new RegExp(`(?:^|,\\s*)${feature}=\\(self\\)(?:,|$)`))
  }

  await page.addInitScript(() => {
    localStorage.setItem('prayercompass.location', JSON.stringify({
      source: 'city', latitude: 51.5074, longitude: -0.1278, label: 'London',
    }))
    Object.defineProperty(DeviceOrientationEvent, 'requestPermission', {
      configurable: true,
      value: () => Promise.resolve('granted'),
    })
  })
  await page.goto(`${origin}/qibla`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Enable live compass' }).click()
  await expect(page.getByText(/Waiting for an absolute heading/)).toBeVisible()
  await page.evaluate(() => {
    window.dispatchEvent(new DeviceOrientationEvent('deviceorientationabsolute', {
      alpha: 1, absolute: true,
    }))
  })
  await expect(page.getByText(/Live compass active/)).toBeVisible()
  await expect(page.getByRole('img', { name: 'Live Qibla arrow relative to your screen' })).toBeVisible()
})
