import { expect, navTo, open, test, withLocation } from './fixtures'

// Geographic bearings remain available before sensor permission.

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
    const rotation = await arrow.locator('[data-qibla-arrow]').getAttribute('transform')
    expect(Number(/rotate\(([\d.]+)/.exec(rotation ?? '')?.[1]).toFixed(1) + '°').toBe(bearing)
  })
}

for (const permission of ['granted', 'denied', 'error', 'unsupported']) {
  test(`compass permission: ${permission}`, async ({ page }) => {
    await page.addInitScript((permission) => {
      if (permission === 'unsupported') {
        Object.defineProperty(window, 'DeviceOrientationEvent', { value: undefined })
        return
      }
      Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { value: () => {
        if (permission === 'error') return Promise.reject(new Error('blocked'))
        return Promise.resolve(permission)
      } })
      const active = new Set<EventListenerOrEventListenerObject>()
      const add = window.addEventListener.bind(window)
      const remove = window.removeEventListener.bind(window)
      window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) => {
        if (type === 'deviceorientation') active.add(listener!)
        add(type, listener!, options)
      }) as typeof window.addEventListener
      window.removeEventListener = ((type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) => {
        if (type === 'deviceorientation') active.delete(listener!)
        remove(type, listener!, options)
      }) as typeof window.removeEventListener
      Object.defineProperty(window, '__activeCompass', { get: () => active.size })
    }, permission)
    await withLocation(page, 51.5074, -0.1278, 'London')
    await open(page, '/qibla')
    expect(await page.evaluate(() => (window as unknown as { __activeCompass?: number }).__activeCompass ?? 0)).toBe(0)
    await page.getByRole('button', { name: 'Enable live compass' }).click()
    if (permission !== 'granted') {
      await expect(page.getByText(permission === 'unsupported' ? /Live compass unavailable/ : /Compass permission denied/)).toBeVisible()
      await expect(page.getByRole('img', { name: /Arrow pointing/ })).toBeVisible()
      return
    }
    await expect(page.getByText(/Waiting for an absolute heading/)).toBeVisible()
    await page.evaluate(() => window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 100, absolute: false })))
    await expect(page.getByText(/Waiting for an absolute heading/)).toBeVisible()
    await page.evaluate(() => window.dispatchEvent(new DeviceOrientationEvent('deviceorientationabsolute', { alpha: 1, absolute: true })))
    await expect(page.getByText(/Live compass active/)).toBeVisible()
    const arrow = page.locator('[data-qibla-arrow]')
    expect(Number((await arrow.getAttribute('transform'))?.match(/rotate\(([\d.]+)/)?.[1])).toBeCloseTo(119.0 - 359 + 360, 0)
    await page.evaluate(() => {
      Object.defineProperty(screen.orientation, 'angle', { value: 90, configurable: true })
      screen.orientation.dispatchEvent(new Event('change'))
    })
    expect(Number((await arrow.getAttribute('transform'))?.match(/rotate\(([\d.]+)/)?.[1])).toBeCloseTo(30, 0)
    await page.evaluate(() => {
      const event = new Event('deviceorientation')
      Object.assign(event, { webkitCompassHeading: 0, webkitCompassAccuracy: 40 })
      window.dispatchEvent(event)
    })
    await expect(page.getByText(/Low compass accuracy/)).toBeVisible()
    await expect(page.getByText(/figure-eight/)).toBeVisible()
    await expect(page.getByText(/No reliable heading received/)).toBeVisible({ timeout: 8000 })
    await navTo(page, 'Today')
    expect(await page.evaluate(() => (window as unknown as { __activeCompass: number }).__activeCompass)).toBe(0)
  })
}
