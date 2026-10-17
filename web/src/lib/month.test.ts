import { describe, expect, it } from 'vitest'
import { monthPrayers, prayerTimes } from './prayers'
import { DEFAULT_SETTINGS } from './settings'

const position = { latitude: 51.5, longitude: -0.12 }
describe('monthly prayers', () => {
  it.each([[2023, 1, 28], [2024, 1, 29], [2024, 3, 30], [2024, 0, 31], [2100, 1, 28], [2000, 1, 29]])('covers every day in %i/%i', (year, month, count) => {
    const days = monthPrayers(position, DEFAULT_SETTINGS, new Date(year, month, 20))
    expect(days).toHaveLength(count)
    days.forEach((day, index) => {
      expect(day.date.getFullYear()).toBe(year)
      expect(day.date.getMonth()).toBe(month)
      expect(day.date.getDate()).toBe(index + 1)
      expect(day.date.getHours()).toBe(0)
      expect(day.times).toEqual(prayerTimes(position, DEFAULT_SETTINGS, day.date).times)
    })
  })
  it('uses location and every calculation setting for the whole month', () => {
    const date = new Date(2024, 5, 15)
    const original = monthPrayers(position, DEFAULT_SETTINGS, date)
    const variants = [
      { ...DEFAULT_SETTINGS, method: 'Singapore' as const },
      { ...DEFAULT_SETTINGS, madhab: 'hanafi' as const },
      { ...DEFAULT_SETTINGS, highLatitudeRule: 'seventhofthenight' as const },
      { ...DEFAULT_SETTINGS, adjustments: { ...DEFAULT_SETTINGS.adjustments, fajr: 5 } },
    ]
    for (const settings of variants) {
      const updated = monthPrayers(position, settings, date)
      expect(updated.map(day => day.times)).not.toEqual(original.map(day => day.times))
      updated.forEach(day => expect(day.times).toEqual(prayerTimes(position, settings, day.date).times))
    }
    expect(monthPrayers({ latitude: 21.4, longitude: 39.8 }, DEFAULT_SETTINGS, date)).not.toEqual(original)
  })
})
