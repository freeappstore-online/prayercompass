// The Qibla: the great-circle bearing from a location to the Kaaba, in degrees
// clockwise from true north. Calculated locally, independently of live sensors.

export const KAABA = { lat: 21.4225, lng: 39.8262 }

const toRadians = (degrees: number) => (degrees * Math.PI) / 180
const toDegrees = (radians: number) => (radians * 180) / Math.PI

/** Initial great-circle bearing (forward azimuth) to the Kaaba, in [0, 360). */
export function qiblaBearing(lat: number, lng: number): number {
  const φ1 = toRadians(lat)
  const φ2 = toRadians(KAABA.lat)
  const Δλ = toRadians(KAABA.lng - lng)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  const bearing = (toDegrees(Math.atan2(y, x)) + 360) % 360
  // (−tiny + 360) % 360 can round to exactly 360.
  return bearing >= 360 ? 0 : bearing
}

const POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']

/** The nearest of the 16 compass points, e.g. 118.99 → "ESE". */
export function compassPoint(bearing: number): string {
  return POINTS[Math.round((((bearing % 360) + 360) % 360) / 22.5) % 16]
}

/** Great-circle distance to the Kaaba in kilometres (mean Earth radius). */
export function distanceToKaaba(lat: number, lng: number): number {
  const φ1 = toRadians(lat)
  const φ2 = toRadians(KAABA.lat)
  const a =
    Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(toRadians(KAABA.lng - lng) / 2) ** 2
  return 2 * 6371.0088 * Math.asin(Math.min(1, Math.sqrt(a)))
}
