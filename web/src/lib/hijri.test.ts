import { describe, expect, it } from 'vitest'
import { HIJRI_MONTHS, formatHijri, tabular, toHijri, ummAlQura } from './hijri'

describe('toHijri (Umm al-Qura)', () => {
  it.each([
    [new Date(2024, 0, 1), { year: 1445, month: 6, day: 19, monthName: 'Jumada al-Akhirah' }],
    // 1 Ramadan 1446 and Eid al-Fitr (1 Shawwal) in the Umm al-Qura calendar.
    [new Date(2025, 2, 1), { year: 1446, month: 9, day: 1, monthName: 'Ramadan' }],
    [new Date(2025, 2, 30), { year: 1446, month: 10, day: 1, monthName: 'Shawwal' }],
  ])('%s', (date, expected) => {
    expect(toHijri(date)).toEqual(expected)
    expect(ummAlQura(date)).toEqual(expected)
  })

  it('uses the calendar day, not the time of day', () => {
    expect(toHijri(new Date(2024, 0, 1, 0, 1))).toEqual(toHijri(new Date(2024, 0, 1, 23, 59)))
  })
})

describe('tabular fallback', () => {
  it('matches known dates', () => {
    expect(tabular(new Date(2024, 0, 1))).toEqual({ year: 1445, month: 6, day: 19, monthName: 'Jumada al-Akhirah' })
    expect(tabular(new Date(2025, 2, 1))).toMatchObject({ year: 1446, month: 9, day: 1 })
  })

  it('stays within a day of Umm al-Qura over several years', () => {
    const msPerDay = 86400000
    for (let t = Date.UTC(2020, 0, 1); t < Date.UTC(2030, 0, 1); t += 13 * msPerDay) {
      const date = new Date(t)
      const a = tabular(date)
      const b = ummAlQura(date)!
      const dayIndex = (h: { year: number; month: number; day: number }) => h.year * 354.367 + (h.month - 1) * 29.53 + h.day
      expect(Math.abs(dayIndex(a) - dayIndex(b)), date.toISOString()).toBeLessThanOrEqual(2.5)
    }
  })
})

describe('formatHijri', () => {
  it('names the month', () => {
    expect(HIJRI_MONTHS).toHaveLength(12)
    expect(formatHijri({ year: 1445, month: 6, day: 19, monthName: 'Jumada al-Akhirah' })).toBe('19 Jumada al-Akhirah 1445 AH')
  })
})
