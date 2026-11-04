import type { Page } from '@playwright/test'

/** Resolve literal CSS colours without losing alpha or accepting missing values. */
export async function normalizeColor(page: Page, value: string | null): Promise<string> {
  return page.evaluate((value) => {
    if (!value?.trim() || /^(inherit|initial|unset|revert|revert-layer|currentcolor)$/i.test(value.trim())) {
      throw new Error(`Missing or invalid CSS colour: ${value}`)
    }
    const probe = document.createElement('span')
    probe.style.color = value
    if (!probe.style.color || /var\(/i.test(value)) throw new Error(`Invalid CSS colour: ${value}`)
    document.body.append(probe)
    try {
      return getComputedStyle(probe).color
    } finally {
      probe.remove()
    }
  }, value)
}
