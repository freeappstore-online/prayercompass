import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@freeappstore/sdk/ui'
import { formatHijri, toHijri } from './lib/hijri'
import type { SavedLocation } from './lib/location'
import { ARABIC_NAMES, PRAYER_ORDER, currentPrayer, formatCountdown, nextPrayer, weekPrayers } from './lib/prayers'
import { METHODS, PRAYERS, type PrayerName, type Settings } from './lib/settings'

export const PRAYER_LABELS = Object.fromEntries(PRAYERS.map((p) => [p.id, p.label])) as Record<PrayerName, string>

export function formatTime(date: Date): string {
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/** The current time, updated every second, on the second. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let interval: number | undefined
    const tick = () => setNow(new Date())
    const timeout = window.setTimeout(() => {
      tick()
      interval = window.setInterval(tick, 1000)
    }, 1000 - (Date.now() % 1000))
    return () => {
      window.clearTimeout(timeout)
      window.clearInterval(interval)
    }
  }, [])
  return now
}

/** Hijri (estimated) and Gregorian date, for the header. */
export function DateLine({ date }: { date: Date }) {
  return (
    <>
      {formatHijri(toHijri(date))} <span className="text-sm">(estimated)</span> ·{' '}
      {date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
    </>
  )
}

export function NoLocation({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] p-5">
      <p className="text-lg font-semibold text-[var(--ink)]">Set your location to see prayer times</p>
      <p className="mt-1 text-[var(--muted)]">
        Use your device's location, pick a city, or enter coordinates. It stays on this device.
      </p>
      <button
        type="button"
        className="mt-3 rounded-[var(--radius)] bg-[var(--accent-deep)] px-4 py-2 font-semibold text-[var(--paper)]"
        onClick={onOpenSettings}
      >
        Set location
      </button>
    </div>
  )
}

interface Props {
  location: SavedLocation | null
  settings: Settings
  onOpenSettings: () => void
  onOpenWeek: () => void
}

export default function Today({ location, settings, onOpenSettings, onOpenWeek }: Props) {
  const now = useNow()
  const dayKey = now.toDateString()
  // Today and tomorrow, so the countdown carries on after Isha. Recomputed
  // only when the day, location or settings change, not every second.
  const days = useMemo(
    () => (location ? weekPrayers(location, settings, new Date(dayKey), 2) : null),
    [location, settings, dayKey],
  )
  const method = METHODS.find((m) => m.id === settings.method)

  return (
    <>
      <PageHeader title="Today" description={<DateLine date={now} />} />
      {!location || !days ? (
        <NoLocation onOpenSettings={onOpenSettings} />
      ) : (
        <TodayTimes days={days} now={now} />
      )}
      {location && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted)]">
          <p>
            {location.label} · {method?.label}
            <br />
            Times are shown in this device's time zone.
          </p>
          <div className="flex gap-4">
            <button type="button" className="underline" onClick={onOpenWeek}>
              This week
            </button>
            <button type="button" className="underline" onClick={onOpenSettings}>
              Change
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function TodayTimes({ days, now }: { days: ReturnType<typeof weekPrayers>; now: Date }) {
  const [today] = days
  const next = nextPrayer(days, now)
  const current = currentPrayer(today, now)

  return (
    <>
      {next && (
        <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] p-5 text-center">
          <p className="text-[var(--muted)]">
            {next.name === 'sunrise' ? 'Sunrise' : PRAYER_LABELS[next.name]}{' '}
            <span dir="auto" lang="ar">
              {ARABIC_NAMES[next.name]}
            </span>{' '}
            in
          </p>
          {/* Read out once per change of prayer, not every second. */}
          <p className="font-[Fraunces] text-5xl font-semibold tabular-nums text-[var(--ink)] sm:text-6xl" aria-hidden="true">
            {formatCountdown(next.time.getTime() - now.getTime())}
          </p>
          <p className="sr-only">
            Next: {PRAYER_LABELS[next.name]} at {formatTime(next.time)}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">at {formatTime(next.time)}</p>
        </div>
      )}
      <ol className="mt-4 divide-y divide-[var(--line)] rounded-[var(--radius)] border border-[var(--line)]">
        {PRAYER_ORDER.map((name) => {
          const isCurrent = name === current
          return (
            <li
              key={name}
              aria-current={isCurrent ? 'true' : undefined}
              className={`flex items-center justify-between gap-4 px-4 py-3 sm:px-5 ${
                isCurrent ? 'bg-[var(--accent-soft)]/40 font-bold' : ''
              } ${name === 'sunrise' ? 'text-[var(--muted)]' : 'text-[var(--ink)]'}`}
            >
              <span className="flex items-baseline gap-3">
                <span className="text-lg sm:text-xl">{PRAYER_LABELS[name]}</span>
                <span dir="auto" lang="ar" className="text-[var(--muted)]">
                  {ARABIC_NAMES[name]}
                </span>
                {isCurrent && <span className="text-sm font-semibold text-[var(--accent-deep)]">Now</span>}
              </span>
              <span className="text-2xl tabular-nums sm:text-3xl">{formatTime(today.times[name])}</span>
            </li>
          )
        })}
      </ol>
    </>
  )
}
