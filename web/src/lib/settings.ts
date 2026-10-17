// Prayer-time calculation settings, kept in localStorage. The ids match the
// adhan-js names (CalculationMethod.*, Madhab.*, HighLatitudeRule.*) so the
// calculator can map them directly.

export type MethodId =
  | 'MuslimWorldLeague'
  | 'NorthAmerica'
  | 'UmmAlQura'
  | 'Egyptian'
  | 'Karachi'
  | 'Tehran'
  | 'Dubai'
  | 'MoonsightingCommittee'
  | 'Singapore'
  | 'Turkey'
  | 'Qatar'
  | 'Kuwait'

export type Madhab = 'shafi' | 'hanafi'

export type HighLatitudeRule = 'middleofthenight' | 'seventhofthenight' | 'twilightangle'

export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'

export interface Settings {
  method: MethodId
  madhab: Madhab
  highLatitudeRule: HighLatitudeRule
  /** Minutes added to (or, if negative, taken from) each computed time. */
  adjustments: Record<PrayerName, number>
}

export const METHODS: { id: MethodId; label: string; detail: string }[] = [
  { id: 'MuslimWorldLeague', label: 'Muslim World League', detail: 'Fajr 18°, Isha 17°' },
  { id: 'NorthAmerica', label: 'ISNA (North America)', detail: 'Fajr 15°, Isha 15°' },
  { id: 'UmmAlQura', label: 'Umm al-Qura (Makkah)', detail: 'Fajr 18.5°, Isha 90 min after Maghrib' },
  { id: 'Egyptian', label: 'Egyptian General Authority', detail: 'Fajr 19.5°, Isha 17.5°' },
  { id: 'Karachi', label: 'University of Islamic Sciences, Karachi', detail: 'Fajr 18°, Isha 18°' },
  { id: 'Tehran', label: 'Institute of Geophysics, Tehran', detail: 'Fajr 17.7°, Isha 14°, Maghrib 4.5°' },
  { id: 'Dubai', label: 'Gulf region', detail: 'Fajr 18.2°, Isha 18.2°' },
  { id: 'MoonsightingCommittee', label: 'Moonsighting Committee', detail: 'Fajr 18°, Isha 18°, seasonal adjustment' },
  { id: 'Singapore', label: 'Singapore', detail: 'Fajr 20°, Isha 18°, Dhuhr +1 min; times rounded up' },
  { id: 'Turkey', label: 'Turkey (Diyanet approximation)', detail: 'Fajr 18°, Isha 17°; regional approximation, less accurate outside Turkey' },
  { id: 'Qatar', label: 'Qatar', detail: 'Fajr 18°, Isha 90 min after Maghrib' },
  { id: 'Kuwait', label: 'Kuwait', detail: 'Fajr 18°, Isha 17.5°' },
]

export const MADHABS: { id: Madhab; label: string; detail: string }[] = [
  { id: 'shafi', label: "Shafi'i, Maliki, Hanbali", detail: 'Asr when a shadow equals its length' },
  { id: 'hanafi', label: 'Hanafi', detail: 'Asr when a shadow is twice its length' },
]

export const HIGH_LATITUDE_RULES: { id: HighLatitudeRule; label: string; detail: string }[] = [
  { id: 'middleofthenight', label: 'Middle of the night', detail: 'Fajr and Isha no further than half the night from sunset' },
  { id: 'seventhofthenight', label: 'One seventh of the night', detail: 'Fajr and Isha no further than a seventh of the night from sunset' },
  { id: 'twilightangle', label: 'Twilight angle', detail: 'A portion of the night based on the Fajr and Isha angles' },
]

export const PRAYERS: { id: PrayerName; label: string }[] = [
  { id: 'fajr', label: 'Fajr' },
  { id: 'sunrise', label: 'Sunrise' },
  { id: 'dhuhr', label: 'Dhuhr' },
  { id: 'asr', label: 'Asr' },
  { id: 'maghrib', label: 'Maghrib' },
  { id: 'isha', label: 'Isha' },
]

/** Adjustments are clamped to ±60 minutes. */
export const MAX_ADJUSTMENT = 60

export const SETTINGS_KEY = 'prayercompass.settings'

export const DEFAULT_SETTINGS: Settings = {
  method: 'MuslimWorldLeague',
  madhab: 'shafi',
  highLatitudeRule: 'middleofthenight',
  adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
}

export function clampAdjustment(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(-MAX_ADJUSTMENT, Math.min(MAX_ADJUSTMENT, Math.round(n)))
}

/** Fills in defaults for anything missing or invalid (e.g. from an older version). */
export function sanitizeSettings(value: unknown): Settings {
  const input = (value && typeof value === 'object' ? value : {}) as Partial<Record<keyof Settings, unknown>>
  const pick = <T extends string>(options: { id: T }[], candidate: unknown, fallback: T): T =>
    options.some((option) => option.id === candidate) ? (candidate as T) : fallback
  const adjustmentsIn = (input.adjustments && typeof input.adjustments === 'object' ? input.adjustments : {}) as Record<
    string,
    unknown
  >
  const adjustments = { ...DEFAULT_SETTINGS.adjustments }
  for (const { id } of PRAYERS) adjustments[id] = clampAdjustment(adjustmentsIn[id] ?? 0)
  return {
    method: pick(METHODS, input.method, DEFAULT_SETTINGS.method),
    madhab: pick(MADHABS, input.madhab, DEFAULT_SETTINGS.madhab),
    highLatitudeRule: pick(HIGH_LATITUDE_RULES, input.highLatitudeRule, DEFAULT_SETTINGS.highLatitudeRule),
    adjustments,
  }
}

export function loadSettings(storage: Storage = localStorage): Settings {
  try {
    const raw = storage.getItem(SETTINGS_KEY)
    return sanitizeSettings(raw ? JSON.parse(raw) : null)
  } catch {
    return sanitizeSettings(null)
  }
}

export function saveSettings(settings: Settings, storage: Storage = localStorage): void {
  storage.setItem(SETTINGS_KEY, JSON.stringify(sanitizeSettings(settings)))
}
