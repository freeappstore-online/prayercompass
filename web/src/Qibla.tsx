import { useCompass } from './lib/useCompass'
import { relativeBearing } from './lib/heading'
import { PageHeader } from '@freeappstore/sdk/ui'
import type { SavedLocation } from './lib/location'
import { compassPoint, distanceToKaaba, qiblaBearing } from './lib/qibla'
import { NoLocation } from './Today'

interface Props {
  location: SavedLocation | null
  onOpenSettings: () => void
}

export default function Qibla({ location, onOpenSettings }: Props) {
  const compass = useCompass(!!location && distanceToKaaba(location.latitude, location.longitude) >= 1)
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
            <Compass bearing={compass.reading ? relativeBearing(bearing, compass.reading.heading) : bearing} northRotation={compass.reading ? -compass.reading.heading : 0} label={compass.reading ? "Live Qibla arrow relative to your screen" : `Arrow pointing ${degrees} clockwise from true north, toward ${compassPoint(bearing)}`} />
            <p className="mt-4 font-[Fraunces] text-5xl font-semibold tabular-nums text-[var(--ink)]">{degrees}</p>
            <p className="mt-1 text-[var(--muted)]">
              from true north, clockwise ({compassPoint(bearing)}) · {Math.round(distance).toLocaleString()} km to Makkah
            </p>
          </>
        )}
      </div>
      {distance >= 1 && <div className="mt-4 text-sm text-[var(--muted)]">
        <button type="button" onClick={() => void compass.start()} disabled={compass.state === 'requesting'} className="rounded-[var(--radius)] border border-[var(--line-strong)] px-4 py-3 text-[var(--ink)]">
          {compass.state === 'idle' ? 'Enable live compass' : 'Retry live compass'}
        </button>
        <p role="status" className="mt-2">{({
          idle: 'Static bearing: north is at the top. Enable the compass to follow your phone.',
          requesting: 'Requesting compass permission...',
          waiting: 'Waiting for an absolute heading. Hold your phone flat and turn it gently.',
          live: compass.reading?.lowAccuracy ? 'Low compass accuracy. Please calibrate before following the arrow.' : 'Live compass active. Hold your phone flat.',
          denied: 'Compass permission denied. Allow motion and orientation access in browser settings, then retry. Static bearing shown.',
          unsupported: 'Live compass unavailable. Use a supported browser over HTTPS. Static bearing shown.',
          missing: 'No reliable heading received. Hold flat, calibrate and turn gently, or retry. Static bearing shown.',
        })[compass.state]}</p>
        <p className="mt-2">To calibrate, hold your phone flat and move it in a figure-eight, away from magnets, metal and electronics.</p>
        <p className="mt-2">The numeric bearing uses true north. Device headings may use magnetic north (including iOS), so the live arrow can differ by local magnetic declination. Accuracy may be unknown. For a precise direction, verify with a compass set to true north.</p>
        <p className="mt-2">When static, align the top of the diagram with true north using a separate compass. Sensor readings stay in memory and are never saved or sent.</p>
      </div>}
      <p className="mt-2 text-sm text-[var(--muted)]">
        The bearing is the shortest path over the globe (great circle) to the Kaaba, calculated on your device.
      </p>
    </>
  )
}

/** North and Qibla rotate relative to the current screen. */
function Compass({ bearing, label, northRotation = 0 }: { bearing: number; label: string; northRotation?: number }) {
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5)
  return (
    <svg viewBox="-24 -24 288 288" role="img" aria-label={label} className="mx-auto block w-full max-w-[20rem]">
      <circle cx="120" cy="120" r="112" fill="var(--paper)" stroke="var(--line-strong)" strokeWidth="2" />
      <g data-compass-rose transform={`rotate(${northRotation} 120 120)`}>
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
      </g>
      <g data-qibla-arrow transform={`rotate(${bearing} 120 120)`}>
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
