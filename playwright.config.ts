// End-to-end tests: the built app (web/dist) served by `vite preview` and
// driven in Chromium at a phone-sized viewport. Run with `pnpm e2e`, which
// builds first.

import { defineConfig, devices } from '@playwright/test'

const PORT = 4620

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Pixel 7'],
    // Pixel 7 is a Chromium device; keep its size and touch, use our browser.
    browserName: 'chromium',
    // Fixed zone and locale, so the times and formats the tests read are stable.
    timezoneId: 'Europe/Istanbul',
    locale: 'en-US',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `pnpm --filter @prayercompass/web exec vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
