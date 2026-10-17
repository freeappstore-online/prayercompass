// Shared e2e setup.
//
// - Requests leaving localhost are blocked, so runs never depend on (or
//   touch) the live platform API or analytics. Every host the page tries to
//   reach is still recorded in `hosts`, and every request body in `bodies`.
// - Any uncaught page error fails the test.

import { test as base, expect, type Page } from '@playwright/test'

export const test = base.extend<{ pageErrors: string[]; hosts: Set<string>; bodies: string[] }>({
  hosts: async ({ context }, use) => {
    const hosts = new Set<string>()
    await context.route(
      (url) => url.protocol.startsWith('http') && url.hostname !== 'localhost',
      (route) => {
        hosts.add(new URL(route.request().url()).hostname)
        return route.abort()
      },
    )
    await use(hosts)
  },
  bodies: async ({ page }, use) => {
    const bodies: string[] = []
    page.on('request', (r) => {
      if (new URL(r.url()).hostname !== 'localhost') bodies.push(`${r.url()} ${r.postData() ?? ''}`)
    })
    await use(bodies)
  },
  pageErrors: [
    async ({ page, hosts }, use) => {
      void hosts // install the request blocker for every test
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      await use(errors)
      expect(errors, 'uncaught page errors').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

export type Screen = 'Today' | 'Monthly' | 'Week' | 'Qibla' | 'Settings' | 'About'

/** Each screen's <h1>. */
export const HEADINGS: Record<Screen, string> = {
  Today: 'Today',
  Monthly: 'Monthly timetable',
  Week: 'This week',
  Qibla: 'Qibla',
  Settings: 'Settings',
  About: 'About',
}

/** Open a screen and wait for the app to settle. */
export async function open(page: Page, path = '/') {
  await page.goto(path, { waitUntil: 'networkidle' })
}

/** Go to another screen through the app's own nav. On phones the nav sits behind the Menu button. */
export async function navTo(page: Page, name: Screen) {
  const nav = page.getByRole('navigation', { name: 'Main' })
  const link = nav.getByRole('link', { name, exact: true })
  if (!(await link.isVisible())) await nav.getByRole('button', { name: 'Menu' }).click()
  await link.click()
  await expect(page.getByRole('heading', { level: 1, name: HEADINGS[name] })).toBeVisible()
}

export const LOCATION_KEY = 'prayercompass.location'

/** Start with a saved location, as if chosen earlier. */
export async function withLocation(page: Page, latitude: number, longitude: number, label: string, source = 'city') {
  await page.addInitScript(
    ([key, value]) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value)
    },
    [LOCATION_KEY, JSON.stringify({ source, latitude, longitude, label })] as const,
  )
}

/** Pick a city from the bundled list on the Settings screen. */
export async function pickCity(page: Page, query: string, label: RegExp | string) {
  await page.getByLabel('Search for a city').fill(query)
  await page.getByRole('list', { name: 'Matching cities' }).getByRole('button', { name: label }).click()
}

/** The app's own status line (the SDK Shell has status regions of its own). */
export const appStatus = (page: Page) => page.getByRole('main').locator('p[role="status"]')

/** The row for one prayer in Today's list. */
export const prayerRow = (page: Page, name: string) =>
  page.getByRole('main').getByRole('listitem').filter({ hasText: new RegExp(`^${name}`) })

// Makkah, from adhan-js's shared fixture (ummulqura.org.sa timetable, Umm al-Qura method).
export const MAKKAH = { latitude: 21.427009, longitude: 39.828685, label: 'Makkah, Saudi Arabia' }
export const MAKKAH_2016_06_04 = {
  Fajr: '4:11 AM',
  Sunrise: '5:38 AM',
  Dhuhr: '12:19 PM',
  Asr: '3:36 PM',
  Maghrib: '7:01 PM',
  Isha: '8:31 PM',
}

/** Store Umm al-Qura as the method, as if chosen earlier in Settings. */
export async function withUmmAlQura(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('prayercompass.settings')) {
      localStorage.setItem('prayercompass.settings', JSON.stringify({ method: 'UmmAlQura' }))
    }
  })
}
