// An estimated Hijri date. The actual start of each month depends on the
// moon being sighted, so the UI always labels this as an estimate.
//
// Uses the Umm al-Qura calendar built into the browser (Intl), and falls back
// to the tabular (arithmetic) Islamic calendar where that isn't available.

export interface HijriDate {
  year: number
  /** 1–12 */
  month: number
  day: number
  monthName: string
}

export const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  'Jumada al-Ula',
  'Jumada al-Akhirah',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qa'dah",
  'Dhu al-Hijjah',
] as const

function make(year: number, month: number, day: number): HijriDate {
  return { year, month, day, monthName: HIJRI_MONTHS[month - 1] }
}

/** The calendar day of `date` in the device's time zone, as noon UTC. */
function civilNoonUtc(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12))
}

/** Umm al-Qura via Intl, or null if the runtime doesn't support that calendar. */
export function ummAlQura(date: Date): HijriDate | null {
  try {
    const format = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
    if (format.resolvedOptions().calendar !== 'islamic-umalqura') return null
    const parts = format.formatToParts(civilNoonUtc(date))
    const get = (type: string) => Number.parseInt(parts.find((p) => p.type === type)?.value ?? '', 10)
    const year = get('year')
    const month = get('month')
    const day = get('day')
    if (![year, month, day].every(Number.isFinite) || month < 1 || month > 12) return null
    return make(year, month, day)
  } catch {
    return null
  }
}

/** The tabular Islamic calendar (civil epoch, 16 July 622). */
export function tabular(date: Date): HijriDate {
  const julianDay = Math.floor(civilNoonUtc(date).getTime() / 86400000) + 2440588
  const days = julianDay - 1948440 + 10632
  const cycle = Math.floor((days - 1) / 10631)
  const rest = days - 10631 * cycle + 354
  const j =
    Math.floor((10985 - rest) / 5316) * Math.floor((50 * rest) / 17719) +
    Math.floor(rest / 5670) * Math.floor((43 * rest) / 15238)
  const dayOfYear =
    rest -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29
  const month = Math.floor((24 * dayOfYear) / 709)
  const day = dayOfYear - Math.floor((709 * month) / 24)
  const year = 30 * cycle + j - 30
  return make(year, month, day)
}

export function toHijri(date: Date): HijriDate {
  return ummAlQura(date) ?? tabular(date)
}

export function formatHijri(hijri: HijriDate): string {
  return `${hijri.day} ${hijri.monthName} ${hijri.year} AH`
}
