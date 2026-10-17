import { compassPoint, distanceToKaaba, qiblaBearing } from './qibla'

export const MAKKAH = { lat: 21.3891, lon: 39.8579 }
type Point = { lat: number; lon: number }
const radians = Math.PI / 180

/** Sample the shortest spherical arc. Antipodes have no unique direction. */
export function greatCirclePoints(start: Point): Point[] {
  const vector = ({ lat, lon }: Point) => [Math.cos(lat * radians) * Math.cos(lon * radians), Math.cos(lat * radians) * Math.sin(lon * radians), Math.sin(lat * radians)]
  const a = vector(start)
  const b = vector(MAKKAH)
  const angle = Math.acos(Math.max(-1, Math.min(1, a.reduce((sum, v, i) => sum + v * b[i], 0))))
  if (angle < 1e-6 || Math.PI - angle < 1e-6) return []
  return Array.from({ length: 129 }, (_, i) => {
    if (i === 0) return start
    if (i === 128) return MAKKAH
    const t = i / 128
    const v = a.map((value, j) => (value * Math.sin((1 - t) * angle) + b[j] * Math.sin(t * angle)) / Math.sin(angle))
    return { lat: Math.atan2(v[2], Math.hypot(v[0], v[1])) / radians, lon: Math.atan2(v[1], v[0]) / radians }
  })
}

/** Split at the dateline so the projected route never crosses the whole map. */
export function mapPath(points: Point[]): string {
  let path = ''
  points.forEach((p, i) => {
    const previous = points[i - 1]
    if (previous && Math.abs(p.lon - previous.lon) > 180) {
      const edge = previous.lon > 0 ? 180 : -180
      const unwrapped = p.lon + (edge > 0 ? 360 : -360)
      const lat = previous.lat + (p.lat - previous.lat) * (edge - previous.lon) / (unwrapped - previous.lon)
      path += ` L${edge + 180},${90 - lat} M${180 - edge},${90 - lat}`
    }
    path += ` ${i ? 'L' : 'M'}${p.lon + 180},${90 - p.lat}`
  })
  return path.trim()
}

// Original hand-drawn schematic continent outlines, in equirectangular coordinates.
// No third-party geodata or external resources. Not intended for navigation.
const LAND = [
  'M12 20 L35 12 65 17 83 30 105 37 100 48 85 55 80 67 70 73 63 87 55 82 48 65 36 57 27 40 15 35Z',
  'M98 7 L125 8 138 18 126 30 110 27Z',
  'M99 80 L117 86 130 100 140 108 132 125 123 145 112 163 107 143 103 124 100 106 94 94Z',
  'M170 55 L174 43 187 36 192 20 207 17 215 27 235 20 260 17 285 22 315 20 345 30 357 40 344 47 330 53 324 65 306 68 297 80 289 93 279 83 272 70 260 65 251 80 246 96 238 88 229 73 216 69 211 60 199 56 188 61 180 54Z',
  'M164 58 L184 54 199 62 211 78 224 82 215 97 210 116 197 125 187 119 182 101 171 92 164 76Z',
  'M225 105 L230 109 227 123 222 125Z',
  'M276 96 L291 100 302 99 312 106 304 110 289 106Z',
  'M293 124 L309 116 328 121 335 140 320 147 301 143 292 134Z',
  'M327 151 L334 153 330 160Z M347 143 L352 149 345 159 340 161Z',
  'M0 174 L35 169 80 173 120 168 160 172 200 166 250 171 300 167 340 172 360 174 360 180 0 180Z',
]

export default function QiblaMap({ lat, lon }: Point) {
  const near = distanceToKaaba(lat, lon) < 1
  const points = near ? [] : greatCirclePoints({ lat, lon })
  const bearing = qiblaBearing(lat, lon)
  return (
    <section className="mt-5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] p-4" aria-label="Offline Qibla map">
      <h2 className="text-lg font-semibold">Offline Qibla map</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">North is up. The map works without compass permission. Your location stays on this device.</p>
      <svg viewBox="0 0 360 180" role="img" aria-label="North-up world map showing your location and Makkah" className="mt-3 block w-full" style={{ background: 'var(--paper)' }}>
        <g fill="var(--line-strong)" stroke="var(--muted)" strokeWidth="0.4">{LAND.map((d, i) => <path key={i} d={d} />)}</g>
        <path data-map-route d={mapPath(points)} fill="none" stroke="var(--accent-deep)" strokeWidth="1.5" />
        <circle cx={lon + 180} cy={90 - lat} r="2.5" fill="var(--danger)"><title>Your location</title></circle>
        <circle cx={MAKKAH.lon + 180} cy={90 - MAKKAH.lat} r="2.5" fill="var(--ink)"><title>Makkah</title></circle>
        <text x="8" y="15" fontSize="9" fill="var(--ink)">N ↑</text>
      </svg>
      <p className="mt-2 text-sm">{near ? 'You are near the Kaaba; no route is shown.' : points.length ? `Qibla: ${bearing.toFixed(1)} degrees clockwise from true north (${compassPoint(bearing)}).` : 'At the antipode, there is no unique shortest direction; no route is shown.'}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">Red dot: your location. Dark dot: Makkah. Line: great-circle path to Makkah city centre. The compass bearing targets the Kaaba. Schematic world outline drawn for PrayerCompass; MIT licence. Not a street map.</p>
    </section>
  )
}
