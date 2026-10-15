import { describe, expect, it } from 'vitest'
import {
  PRAYER_ORDER,
  currentPrayer,
  formatCountdown,
  nextPrayer,
  prayerTimes,
  weekPrayers,
  type DayTimes,
  type Position,
} from './prayers'
import { DEFAULT_SETTINGS, type MethodId, type PrayerName, type Settings } from './settings'

const settings = (overrides: Partial<Settings> = {}): Settings => ({
  ...DEFAULT_SETTINGS,
  adjustments: { ...DEFAULT_SETTINGS.adjustments },
  ...overrides,
})

/** Minutes since local midnight in `timeZone`, e.g. "5:38 AM" → 338. */
function wallClock(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return get('hour') * 60 + get('minute')
}

function parseClock(text: string): number {
  const [, h, m, ampm] = /^(\d+):(\d+) (AM|PM)$/.exec(text)!
  return ((Number(h) % 12) + (ampm === 'PM' ? 12 : 0)) * 60 + Number(m)
}

// Published timetables, from adhan-js's shared test fixtures
// (github.com/batoulapps/adhan-js/tree/master/Shared/Times). Each is a
// different city and method; London and Tehran cross a DST change between
// March and April. Allowed variance: 1 minute.
interface Reference {
  city: string
  position: Position
  timeZone: string
  method: MethodId
  madhab: Settings['madhab']
  rows: [date: string, fajr: string, sunrise: string, dhuhr: string, asr: string, maghrib: string, isha: string][]
}

const REFERENCES: Reference[] = [
  {
    city: 'Makkah (ummulqura.org.sa)',
    position: { latitude: 21.427009, longitude: 39.828685 },
    timeZone: 'Asia/Riyadh',
    method: 'UmmAlQura',
    madhab: 'shafi',
    rows: [
      ['2016-01-05', '5:38 AM', '7:00 AM', '12:26 PM', '3:31 PM', '5:52 PM', '7:22 PM'],
      ['2016-03-05', '5:22 AM', '6:38 AM', '12:32 PM', '3:55 PM', '6:27 PM', '7:57 PM'],
      ['2016-06-04', '4:11 AM', '5:38 AM', '12:19 PM', '3:36 PM', '7:01 PM', '8:31 PM'],
      ['2016-10-06', '4:57 AM', '6:13 AM', '12:09 PM', '3:31 PM', '6:04 PM', '7:34 PM'],
    ],
  },
  {
    city: 'London (moonsighting.com)',
    position: { latitude: 51.507194, longitude: -0.116711 },
    timeZone: 'Europe/London',
    method: 'MoonsightingCommittee',
    madhab: 'hanafi',
    rows: [
      ['2016-01-01', '6:25 AM', '8:06 AM', '12:09 PM', '2:15 PM', '4:05 PM', '5:38 PM'],
      ['2016-03-01', '5:10 AM', '6:45 AM', '12:18 PM', '3:49 PM', '5:44 PM', '7:03 PM'],
      ['2016-04-01', '4:59 AM', '6:35 AM', '1:09 PM', '5:32 PM', '7:37 PM', '8:49 PM'],
      ['2016-06-01', '2:55 AM', '4:49 AM', '1:03 PM', '6:31 PM', '9:12 PM', '10:23 PM'],
    ],
  },
  {
    city: 'Dubai (awqaf.gov.ae)',
    position: { latitude: 25.263056, longitude: 55.297222 },
    timeZone: 'Asia/Dubai',
    method: 'Dubai',
    madhab: 'shafi',
    rows: [
      ['2018-01-01', '5:42 AM', '7:01 AM', '12:25 PM', '3:24 PM', '5:44 PM', '7:03 PM'],
      ['2018-06-01', '4:00 AM', '5:25 AM', '12:19 PM', '3:43 PM', '7:08 PM', '8:33 PM'],
      ['2018-10-01', '4:54 AM', '6:08 AM', '12:11 PM', '3:35 PM', '6:09 PM', '7:23 PM'],
    ],
  },
  {
    city: 'Tehran (praytimes.org)',
    position: { latitude: 35.715298, longitude: 51.404343 },
    timeZone: 'Asia/Tehran',
    method: 'Tehran',
    madhab: 'shafi',
    rows: [
      ['2018-03-01', '5:11 AM', '6:35 AM', '12:17 PM', '3:30 PM', '6:17 PM', '7:04 PM'],
      ['2018-04-01', '5:26 AM', '6:51 AM', '1:08 PM', '4:42 PM', '7:44 PM', '8:32 PM'],
      ['2018-10-01', '4:36 AM', '5:59 AM', '11:54 AM', '3:16 PM', '6:07 PM', '6:54 PM'],
    ],
  },
]

function localDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

describe('reference timetables', () => {
  for (const ref of REFERENCES) {
    it.each(ref.rows)(`${ref.city}, ${ref.method}: %s`, (date, ...expected) => {
      const day = prayerTimes(ref.position, settings({ method: ref.method, madhab: ref.madhab }), localDate(date))
      PRAYER_ORDER.forEach((name, i) => {
        const diff = Math.abs(wallClock(day.times[name], ref.timeZone) - parseClock(expected[i]))
        expect(diff, `${name}: expected ${expected[i]}`).toBeLessThanOrEqual(1)
      })
    })
  }
})

// Reference values from adhan-js's own test suite (test/adhan.test.ts),
// several taken from moonsighting.com. They cover both Asr schools, more
// methods, and all three high-latitude rules, through our settings mapping.
interface Case {
  name: string
  position: Position
  timeZone: string
  date: string
  settings: Partial<Settings>
  times: Partial<Record<PrayerName, string>>
}

const RALEIGH: Position = { latitude: 35.775, longitude: -78.6336 }
const EDINBURGH: Position = { latitude: 55.983226, longitude: -3.216649 }

const CASES: Case[] = [
  {
    name: 'Raleigh, ISNA, Hanafi',
    position: RALEIGH,
    timeZone: 'America/New_York',
    date: '2015-07-12',
    settings: { method: 'NorthAmerica', madhab: 'hanafi' },
    times: { fajr: '4:42 AM', sunrise: '6:08 AM', dhuhr: '1:21 PM', asr: '6:22 PM', maghrib: '8:32 PM', isha: '9:57 PM' },
  },
  {
    name: "Raleigh, MWL, Shafi'i Asr",
    position: RALEIGH,
    timeZone: 'America/New_York',
    date: '2015-12-01',
    settings: { method: 'MuslimWorldLeague', madhab: 'shafi' },
    times: { fajr: '5:35 AM', sunrise: '7:06 AM', dhuhr: '12:05 PM', asr: '2:42 PM', maghrib: '5:01 PM' },
  },
  {
    name: 'Raleigh, MWL, Hanafi Asr',
    position: RALEIGH,
    timeZone: 'America/New_York',
    date: '2015-12-01',
    settings: { method: 'MuslimWorldLeague', madhab: 'hanafi' },
    times: { asr: '3:22 PM' },
  },
  {
    name: 'Raleigh, Moonsighting Committee (moonsighting.com)',
    position: RALEIGH,
    timeZone: 'America/New_York',
    date: '2016-01-31',
    settings: { method: 'MoonsightingCommittee' },
    times: { fajr: '5:48 AM', sunrise: '7:16 AM', dhuhr: '12:33 PM', asr: '3:20 PM', maghrib: '5:43 PM', isha: '7:05 PM' },
  },
  {
    name: 'Oslo, Moonsighting Committee, Hanafi, high latitude (moonsighting.com)',
    position: { latitude: 59.9094, longitude: 10.7349 },
    timeZone: 'Europe/Oslo',
    date: '2016-01-01',
    settings: { method: 'MoonsightingCommittee', madhab: 'hanafi' },
    times: { fajr: '7:34 AM', sunrise: '9:19 AM', dhuhr: '12:25 PM', asr: '1:36 PM', maghrib: '3:25 PM', isha: '5:02 PM' },
  },
  {
    name: 'Cairo, Egyptian',
    position: { latitude: 30.028703, longitude: 31.249528 },
    timeZone: 'Africa/Cairo',
    date: '2020-01-01',
    settings: { method: 'Egyptian' },
    times: { fajr: '5:18 AM', sunrise: '6:51 AM', dhuhr: '11:59 AM', asr: '2:47 PM', maghrib: '5:06 PM', isha: '6:29 PM' },
  },
  {
    name: 'Edinburgh, MWL, middle of the night',
    position: EDINBURGH,
    timeZone: 'Europe/London',
    date: '2020-06-15',
    settings: { method: 'MuslimWorldLeague', highLatitudeRule: 'middleofthenight' },
    times: { fajr: '1:14 AM', sunrise: '4:26 AM', dhuhr: '1:14 PM', asr: '5:46 PM', maghrib: '10:01 PM', isha: '1:14 AM' },
  },
  {
    name: 'Edinburgh, MWL, seventh of the night',
    position: EDINBURGH,
    timeZone: 'Europe/London',
    date: '2020-06-15',
    settings: { method: 'MuslimWorldLeague', highLatitudeRule: 'seventhofthenight' },
    times: { fajr: '3:31 AM', sunrise: '4:26 AM', dhuhr: '1:14 PM', asr: '5:46 PM', maghrib: '10:01 PM', isha: '10:56 PM' },
  },
  {
    name: 'Edinburgh, MWL, twilight angle',
    position: EDINBURGH,
    timeZone: 'Europe/London',
    date: '2020-06-15',
    settings: { method: 'MuslimWorldLeague', highLatitudeRule: 'twilightangle' },
    times: { fajr: '2:31 AM', sunrise: '4:26 AM', dhuhr: '1:14 PM', asr: '5:46 PM', maghrib: '10:01 PM', isha: '11:50 PM' },
  },
]

describe('adhan-js reference cases (Asr schools, methods, high-latitude rules)', () => {
  it.each(CASES)('$name, $date', ({ position, timeZone, date, settings: overrides, times }) => {
    const day = prayerTimes(position, settings(overrides), localDate(date))
    for (const [name, expected] of Object.entries(times) as [PrayerName, string][]) {
      expect(wallClock(day.times[name], timeZone), `${name}: expected ${expected}`).toBe(parseClock(expected))
    }
  })
})

const NEW_YORK: Position = { latitude: 40.7128, longitude: -74.006 }
const TROMSO: Position = { latitude: 69.65, longitude: 18.96 }

describe('prayerTimes', () => {
  it('returns six valid, ordered times', () => {
    const { times } = prayerTimes(NEW_YORK, settings({ method: 'NorthAmerica' }), new Date(2024, 5, 15))
    for (let i = 0; i < PRAYER_ORDER.length; i++) {
      expect(times[PRAYER_ORDER[i]]).toBeInstanceOf(Date)
      expect(Number.isNaN(times[PRAYER_ORDER[i]].getTime())).toBe(false)
      if (i > 0) expect(times[PRAYER_ORDER[i]].getTime()).toBeGreaterThan(times[PRAYER_ORDER[i - 1]].getTime())
    }
  })

  it('shifts wall-clock times by an hour across a DST change (New York, spring forward 2024-03-10)', () => {
    const s = settings({ method: 'NorthAmerica' })
    const before = prayerTimes(NEW_YORK, s, new Date(2024, 2, 9)).times
    const after = prayerTimes(NEW_YORK, s, new Date(2024, 2, 10)).times
    for (const name of PRAYER_ORDER) {
      const shift = wallClock(after[name], 'America/New_York') - wallClock(before[name], 'America/New_York')
      // One hour of DST, give or take the day's ~1–2 minute drift.
      expect(Math.abs(shift - 60), name).toBeLessThanOrEqual(3)
      // The actual instant moves by only a minute or two.
      expect(Math.abs(after[name].getTime() - before[name].getTime() - 86400000)).toBeLessThan(3 * 60000)
    }
  })

  it('Hanafi Asr is later than Shafi Asr', () => {
    const date = new Date(2024, 0, 15)
    const shafi = prayerTimes(NEW_YORK, settings({ madhab: 'shafi' }), date).times.asr
    const hanafi = prayerTimes(NEW_YORK, settings({ madhab: 'hanafi' }), date).times.asr
    expect(hanafi.getTime() - shafi.getTime()).toBeGreaterThan(30 * 60000)
  })

  it('applies per-prayer minute adjustments', () => {
    const date = new Date(2024, 0, 15)
    const base = prayerTimes(NEW_YORK, settings(), date).times
    const adjusted = prayerTimes(
      NEW_YORK,
      settings({ adjustments: { fajr: -5, sunrise: 0, dhuhr: 2, asr: 0, maghrib: 3, isha: 10 } }),
      date,
    ).times
    const delta = (name: PrayerName) => (adjusted[name].getTime() - base[name].getTime()) / 60000
    expect([delta('fajr'), delta('sunrise'), delta('dhuhr'), delta('asr'), delta('maghrib'), delta('isha')]).toEqual([
      -5, 0, 2, 0, 3, 10,
    ])
  })

  describe('high latitude (Tromsø, 69.65° N)', () => {
    const dates = [new Date(2024, 5, 21), new Date(2024, 11, 21), new Date(2024, 4, 1)]
    for (const rule of ['middleofthenight', 'seventhofthenight', 'twilightangle'] as const) {
      it.each(dates)(`${rule}: every time is valid on %s`, (date) => {
        const { times } = prayerTimes(TROMSO, settings({ highLatitudeRule: rule }), date)
        for (const name of PRAYER_ORDER) {
          expect(times[name]).toBeInstanceOf(Date)
          expect(Number.isNaN(times[name].getTime()), name).toBe(false)
        }
      })
    }

    it('the rule changes Fajr and Isha where twilight lasts all night', () => {
      const date = new Date(2024, 4, 1)
      const middle = prayerTimes(TROMSO, settings({ highLatitudeRule: 'middleofthenight' }), date).times
      const seventh = prayerTimes(TROMSO, settings({ highLatitudeRule: 'seventhofthenight' }), date).times
      expect(seventh.fajr.getTime()).toBeGreaterThan(middle.fajr.getTime())
      expect(seventh.isha.getTime()).toBeLessThan(middle.isha.getTime())
    })
  })
})

describe('weekPrayers', () => {
  it('returns seven consecutive days of six times', () => {
    const week = weekPrayers(NEW_YORK, settings(), new Date(2024, 1, 26, 15, 30))
    expect(week).toHaveLength(7)
    week.forEach((day, i) => {
      expect(day.date).toEqual(new Date(2024, 1, 26 + i))
      expect(Object.keys(day.times)).toEqual(PRAYER_ORDER)
      for (const name of PRAYER_ORDER) expect(day.times[name]).toBeInstanceOf(Date)
    })
    // Crosses into March (2024 is a leap year).
    expect(week[3].date.getDate()).toBe(29)
    expect(week[4].date.getMonth()).toBe(2)
  })
})

describe('nextPrayer and currentPrayer', () => {
  const at = (h: number, m: number) => new Date(Date.UTC(2024, 0, 1, h, m))
  const day: DayTimes = {
    date: new Date(2024, 0, 1),
    times: { fajr: at(5, 0), sunrise: at(6, 30), dhuhr: at(12, 0), asr: at(15, 0), maghrib: at(17, 30), isha: at(19, 0) },
  }
  const tomorrow: DayTimes = {
    date: new Date(2024, 0, 2),
    times: { fajr: at(29, 1), sunrise: at(30, 31), dhuhr: at(36, 0), asr: at(39, 0), maghrib: at(41, 31), isha: at(43, 1) },
  }

  it('between Fajr and Sunrise: Fajr is current, Sunrise is next', () => {
    expect(nextPrayer([day, tomorrow], at(5, 45))).toEqual({ name: 'sunrise', time: day.times.sunrise })
    expect(currentPrayer(day, at(5, 45))).toBe('fajr')
  })

  it('between Sunrise and Dhuhr there is no current prayer', () => {
    expect(currentPrayer(day, at(9, 0))).toBeNull()
    expect(nextPrayer([day], at(9, 0))?.name).toBe('dhuhr')
  })

  it('at the exact time, that prayer has started', () => {
    expect(currentPrayer(day, at(15, 0))).toBe('asr')
    expect(nextPrayer([day], at(15, 0))?.name).toBe('maghrib')
  })

  it("after Isha, the next prayer is tomorrow's Fajr", () => {
    expect(currentPrayer(day, at(22, 0))).toBe('isha')
    expect(nextPrayer([day, tomorrow], at(22, 0))).toEqual({ name: 'fajr', time: tomorrow.times.fajr })
    expect(nextPrayer([day], at(22, 0))).toBeNull()
  })

  it('before Fajr: nothing current today, Fajr is next', () => {
    expect(currentPrayer(day, at(3, 0))).toBeNull()
    expect(nextPrayer([day], at(3, 0))?.name).toBe('fajr')
  })

  it('skips invalid times', () => {
    const broken: DayTimes = { ...day, times: { ...day.times, fajr: new Date(Number.NaN) } }
    expect(nextPrayer([broken], at(3, 0))?.name).toBe('sunrise')
  })
})

describe('formatCountdown', () => {
  it('formats hh:mm:ss and never goes negative', () => {
    expect(formatCountdown(0)).toBe('00:00:00')
    expect(formatCountdown(999)).toBe('00:00:00')
    expect(formatCountdown(1000)).toBe('00:00:01')
    expect(formatCountdown((2 * 3600 + 3 * 60 + 4) * 1000 + 500)).toBe('02:03:04')
    expect(formatCountdown(-5000)).toBe('00:00:00')
  })

  it('ticks down one second at a time', () => {
    const target = 10 * 60 * 1000
    const ticks = [0, 1000, 2000, 3000].map((elapsed) => formatCountdown(target - elapsed))
    expect(ticks).toEqual(['00:10:00', '00:09:59', '00:09:58', '00:09:57'])
  })
})
