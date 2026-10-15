import { useMemo } from 'react'
import { PageHeader } from '@freeappstore/sdk/ui'
import type { SavedLocation } from './lib/location'
import { ARABIC_NAMES, PRAYER_ORDER, weekPrayers } from './lib/prayers'
import type { Settings } from './lib/settings'
import { NoLocation, PRAYER_LABELS, formatTime, useNow } from './Today'

interface Props {
  location: SavedLocation | null
  settings: Settings
  onOpenSettings: () => void
  onOpenToday: () => void
}

export default function Week({ location, settings, onOpenSettings, onOpenToday }: Props) {
  const now = useNow()
  const dayKey = now.toDateString()
  const week = useMemo(
    () => (location ? weekPrayers(location, settings, new Date(dayKey)) : null),
    [location, settings, dayKey],
  )

  return (
    <>
      <PageHeader title="This week" description={location ? `${location.label} · the next seven days` : undefined} />
      {!location || !week ? (
        <NoLocation onOpenSettings={onOpenSettings} />
      ) : (
        // Scrolls sideways on narrow screens; the day column stays put.
        <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--line)]" tabIndex={0} role="region" aria-label="Prayer times this week">
          <table className="w-full min-w-[40rem] border-collapse text-start tabular-nums">
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
              {week.map((day, i) => (
                <tr
                  key={day.date.toISOString()}
                  aria-current={i === 0 ? 'date' : undefined}
                  className={`border-b border-[var(--line)] last:border-0 ${i === 0 ? 'font-bold' : ''}`}
                >
                  <th scope="row" className="sticky start-0 whitespace-nowrap bg-[var(--paper)] px-3 py-2 text-start">
                    {i === 0 ? 'Today' : day.date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                  </th>
                  {PRAYER_ORDER.map((name) => (
                    <td key={name} className={`whitespace-nowrap px-3 py-2 ${name === 'sunrise' ? 'text-[var(--muted)]' : ''}`}>
                      {formatTime(day.times[name])}
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
          ← Back to today
        </button>
      </p>
    </>
  )
}
