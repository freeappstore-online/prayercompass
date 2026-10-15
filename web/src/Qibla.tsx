import { PageHeader } from '@freeappstore/sdk/ui'
import type { SavedLocation } from './lib/location'
import { compassPoint, distanceToKaaba, qiblaBearing } from './lib/qibla'
import { NoLocation } from './Today'

interface Props {
  location: SavedLocation | null
  onOpenSettings: () => void
}

export default function Qibla({ location, onOpenSettings }: Props) {
  if (!location) {
    return (
      <>
        <PageHeader title="Qibla" />
        <NoLocation onOpenSettings={onOpenSettings} />
      </>
    )
  }

  const bearing = qiblaBearing(location.latitude, location.longitude)
  const distance = distanceToKaaba(location.latitude, location.longitude)
  const degrees = `${bearing.toFixed(1)}°`

  return (
    <>
      <PageHeader title="Qibla" description={`Qibla direction from your location · ${location.label}`} />
      <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] p-5 text-center">
        {distance < 1 ? (
          <p className="text-lg text-[var(--ink)]">You are at the Kaaba.</p>
        ) : (
          <>
            <Compass bearing={bearing} label={`Arrow pointing ${degrees} clockwise from true north, toward ${compassPoint(bearing)}`} />
            <p className="mt-4 font-[Fraunces] text-5xl font-semibold tabular-nums text-[var(--ink)]">{degrees}</p>
            <p className="mt-1 text-[var(--muted)]">
              from true north, clockwise ({compassPoint(bearing)}) · {Math.round(distance).toLocaleString()} km to Makkah
            </p>
          </>
        )}
      </div>
      <p className="mt-4 text-sm text-[var(--muted)]">
        To use: hold your phone flat, open its built-in compass, align the compass north with true north, then follow
        this arrow. Many compass apps show magnetic north by default; switch them to true north if they offer it. (Live
        compass rotation is coming in a future update.)
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        The bearing is the shortest path over the globe (great circle) to the Kaaba, calculated on your device.
      </p>
    </>
  )
}

/** A static compass rose with north up and an arrow rotated to the bearing. */
function Compass({ bearing, label }: { bearing: number; label: string }) {
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5)
  return (
    <svg viewBox="-24 -24 288 288" role="img" aria-label={label} className="mx-auto block w-full max-w-[20rem]">
      <circle cx="120" cy="120" r="112" fill="var(--paper)" stroke="var(--line-strong)" strokeWidth="2" />
      {ticks.map((angle) => (
        <line
          key={angle}
          x1="120"
          y1={angle % 90 === 0 ? 14 : angle % 30 === 0 ? 16 : 18}
          x2="120"
          y2="24"
          stroke={angle % 30 === 0 ? 'var(--ink)' : 'var(--muted)'}
          strokeWidth={angle % 90 === 0 ? 2.5 : 1}
          transform={`rotate(${angle} 120 120)`}
        />
      ))}
      {(
        [
          ['N', 120, -6],
          ['E', 252, 126],
          ['S', 120, 258],
          ['W', -12, 126],
        ] as const
      ).map(([letter, x, y]) => (
        <text
          key={letter}
          x={x}
          y={y}
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fill={letter === 'N' ? 'var(--danger)' : 'var(--ink)'}
        >
          {letter}
        </text>
      ))}
      <g transform={`rotate(${bearing} 120 120)`}>
        <line x1="120" y1="166" x2="120" y2="72" stroke="var(--accent-deep)" strokeWidth="6" strokeLinecap="round" />
        <path d="M120 46 L136 78 L120 70 L104 78 Z" fill="var(--accent-deep)" />
        {/* The Kaaba, at the arrow's tip. */}
        <rect x="113" y="28" width="14" height="14" rx="1.5" fill="var(--ink)" />
        <rect x="113" y="32" width="14" height="2.5" fill="var(--accent)" />
      </g>
      <circle cx="120" cy="120" r="7" fill="var(--ink)" />
    </svg>
  )
}
