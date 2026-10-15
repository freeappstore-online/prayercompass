import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  HIGH_LATITUDE_RULES,
  MAX_ADJUSTMENT,
  METHODS,
  SETTINGS_KEY,
  clampAdjustment,
  loadSettings,
  sanitizeSettings,
  saveSettings,
  type Settings,
} from './settings'
import { memoryStorage } from './memoryStorage.test-util'

describe('settings options', () => {
  it('offers the methods and high-latitude rules the issue asks for', () => {
    expect(METHODS.map((m) => m.id)).toEqual([
      'MuslimWorldLeague',
      'NorthAmerica',
      'UmmAlQura',
      'Egyptian',
      'Karachi',
      'Tehran',
      'Dubai',
      'MoonsightingCommittee',
    ])
    expect(HIGH_LATITUDE_RULES.map((r) => r.id)).toEqual(['middleofthenight', 'seventhofthenight', 'twilightangle'])
  })
})

describe('settings storage', () => {
  it('defaults when nothing is stored', () => {
    expect(loadSettings(memoryStorage())).toEqual(DEFAULT_SETTINGS)
  })

  it('persists across reloads', () => {
    const storage = memoryStorage()
    const settings: Settings = {
      method: 'UmmAlQura',
      madhab: 'hanafi',
      highLatitudeRule: 'seventhofthenight',
      adjustments: { fajr: -2, sunrise: 0, dhuhr: 3, asr: 0, maghrib: 1, isha: 30 },
    }
    saveSettings(settings, storage)
    expect(loadSettings(storage)).toEqual(settings)
  })

  it('recovers from corrupt or outdated values', () => {
    const storage = memoryStorage()
    storage.setItem(SETTINGS_KEY, '{oops')
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS)

    storage.setItem(SETTINGS_KEY, JSON.stringify({ method: 'Bogus', madhab: 'hanafi', adjustments: { isha: 500, fajr: 'x' } }))
    expect(loadSettings(storage)).toEqual({
      ...DEFAULT_SETTINGS,
      madhab: 'hanafi',
      adjustments: { ...DEFAULT_SETTINGS.adjustments, isha: MAX_ADJUSTMENT },
    })
  })

  it('does not share the default adjustments object', () => {
    const settings = sanitizeSettings(null)
    settings.adjustments.fajr = 5
    expect(DEFAULT_SETTINGS.adjustments.fajr).toBe(0)
  })
})

describe('clampAdjustment', () => {
  it('rounds and clamps to ±60 minutes', () => {
    expect(clampAdjustment(2.6)).toBe(3)
    expect(clampAdjustment('-7')).toBe(-7)
    expect(clampAdjustment(-999)).toBe(-MAX_ADJUSTMENT)
    expect(clampAdjustment(Number.NaN)).toBe(0)
    expect(clampAdjustment('abc')).toBe(0)
  })
})
