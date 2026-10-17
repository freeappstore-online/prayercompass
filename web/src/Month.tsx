import { useMemo, useState } from 'react'
import { PageHeader } from '@freeappstore/sdk/ui'
import type { SavedLocation } from './lib/location'
import { ARABIC_NAMES, PRAYER_ORDER, monthPrayers } from './lib/prayers'
import type { Settings } from './lib/settings'
import { NoLocation, PRAYER_LABELS, formatTime, useNow } from './Today'

interface Props {
  location: SavedLocation | null
  settings: Settings
  onOpenSettings: () => void
  onOpenToday: () => void
}

export default function Month({ location, settings, onOpenSettings, onOpenToday }: Props) {
  const now = useNow()
  const [selected, setSelected] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1))
  const monthLabel = selected.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const month = useMemo(
    () => (location ? monthPrayers(location, settings, selected) : null),
    [location, settings, selected],
  )
  const moveMonth = (offset: number) => setSelected((date) => new Date(date.getFullYear(), date.getMonth() + offset, 1))

  return (
    <>
      <PageHeader title="Monthly timetable" description={location?.label} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button type="button" className="rounded-[var(--radius)] border border-[var(--line)] px-3 py-2" onClick={() => moveMonth(-1)}>Previous month</button>
        <h2 className="text-lg font-semibold" aria-live="polite" aria-atomic="true">{monthLabel}</h2>
        <button type="button" className="rounded-[var(--radius)] border border-[var(--line)] px-3 py-2" onClick={() => moveMonth(1)}>Next month</button>
        <button type="button" className="underline" onClick={() => setSelected(new Date(now.getFullYear(), now.getMonth(), 1))}>Current month</button>
      </div>
      <p className="mb-4 text-sm text-[var(--muted)]">Times are shown in this device's time zone.</p>
      {!location || !month ? (
        <NoLocation onOpenSettings={onOpenSettings} />
      ) : (
        // Scrolls sideways on narrow screens; the day column stays put.
        <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--line)]" tabIndex={0} role="region" aria-label="Monthly prayer times">
          <table className="w-full min-w-[40rem] border-collapse text-start tabular-nums">
            <caption className="sr-only">{monthLabel} prayer times for {location.label}</caption>
            <thead>
              <tr className="border-b border-[var(--line-strong)]">
                <th scope="col" className="sticky start-0 bg-[var(--paper)] px-3 py-2 text-start">
                  Day
                </th>
                {PRAYER_ORDER.map((name) => (
                  <th key={name} scope="col" className="px-3 py-2 text-start font-semibold">
                    <span className="block">{PRAYER_LABELS[name]}</span>
                    <span dir="auto" lang="ar" className="block text-sm font-normal text-[var(--muted)]">
                      {ARABIC_NAMES[name]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {month.map((day) => (
                <tr
                  key={day.date.toISOString()}
                  aria-current={day.date.toDateString() === now.toDateString() ? 'date' : undefined}
                  className={`border-b border-[var(--line)] last:border-0 ${day.date.toDateString() === now.toDateString() ? 'font-bold' : ''}`}
                >
                  <th scope="row" className="sticky start-0 whitespace-nowrap bg-[var(--paper)] px-3 py-2 text-start">
                    {day.date.toDateString() === now.toDateString() ? `Today: ${day.date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}` : day.date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                  </th>
                  {PRAYER_ORDER.map((name) => (
                    <td key={name} className={`whitespace-nowrap px-3 py-2 ${name === 'sunrise' ? 'text-[var(--muted)]' : ''}`}>
                      <span dir="ltr">{formatTime(day.times[name])}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-sm">
        <button type="button" className="underline" onClick={onOpenToday}>
          <span aria-hidden="true" className="inline-block rtl:rotate-180">←</span> Back to today
        </button>
      </p>
    </>
  )
}
