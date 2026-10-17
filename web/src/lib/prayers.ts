// Prayer times, calculated on the device with adhan-js (MIT, Batoul Apps).
// Times are absolute instants (Date); the UI shows them in the device's time
// zone.

import {
  CalculationMethod,
  type CalculationParameters,
  Coordinates,
  PolarCircleResolution,
  PrayerTimes,
} from 'adhan'
import { PRAYERS, type PrayerName, type Settings } from './settings'

export interface Position {
  latitude: number
  longitude: number
}

export interface DayTimes {
  /** Local midnight of the day these times are for. */
  date: Date
  times: Record<PrayerName, Date>
}

export const PRAYER_ORDER: PrayerName[] = PRAYERS.map((p) => p.id)

/** Arabic names, shown alongside the English ones. */
export const ARABIC_NAMES: Record<PrayerName, string> = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
}

export function calculationParameters(settings: Settings): CalculationParameters {
  const params = CalculationMethod[settings.method]()
  params.madhab = settings.madhab
  params.highLatitudeRule = settings.highLatitudeRule
  params.adjustments = { ...settings.adjustments }
  // Inside the polar circles there are days with no sunrise or sunset; use the
  // nearest latitude where there is one instead of returning invalid times.
  params.polarCircleResolution = PolarCircleResolution.AqrabBalad
  return params
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/** The six times for the calendar day (in the device's time zone) containing `date`. */
export function prayerTimes(position: Position, settings: Settings, date: Date): DayTimes {
  const day = startOfDay(date)
  const result = new PrayerTimes(
    new Coordinates(position.latitude, position.longitude),
    day,
    calculationParameters(settings),
  )
  return {
    date: day,
    times: {
      fajr: result.fajr,
      sunrise: result.sunrise,
      dhuhr: result.dhuhr,
      asr: result.asr,
      maghrib: result.maghrib,
      isha: result.isha,
    },
  }
}

/** `days` consecutive days starting with the day containing `start`. */
export function weekPrayers(position: Position, settings: Settings, start: Date, days = 7): DayTimes[] {
  return Array.from({ length: days }, (_, i) => prayerTimes(position, settings, addDays(start, i)))
}

/** Every Gregorian calendar day of the month containing date, in local time. */
export function monthPrayers(position: Position, settings: Settings, date: Date): DayTimes[] {
  const year = date.getFullYear()
  const month = date.getMonth()
  return weekPrayers(position, settings, new Date(year, month, 1), new Date(year, month + 1, 0).getDate())
}

function isValid(date: Date): boolean {
  return !Number.isNaN(date.getTime())
}

/**
 * The first time after `now` across consecutive days (pass today and
 * tomorrow so the countdown keeps going after Isha). Sunrise counts: it marks
 * the end of Fajr.
 */
export function nextPrayer(days: DayTimes[], now: Date): { name: PrayerName; time: Date } | null {
  for (const day of days) {
    for (const name of PRAYER_ORDER) {
      const time = day.times[name]
      if (isValid(time) && time.getTime() > now.getTime()) return { name, time }
    }
  }
  return null
}

/**
 * The prayer whose time has started and not yet ended, on this day. Fajr ends
 * at sunrise, so between sunrise and Dhuhr there is none; before Fajr it is
 * null too (that is the previous day's Isha).
 */
export function currentPrayer(day: DayTimes, now: Date): PrayerName | null {
  let current: PrayerName | null = null
  for (const name of PRAYER_ORDER) {
    const time = day.times[name]
    if (isValid(time) && time.getTime() <= now.getTime()) current = name
  }
  return current === 'sunrise' ? null : current
}

/** "01:02:03"; hours keep counting past 99 if they ever need to. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
}
