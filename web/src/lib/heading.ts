export interface HeadingData {
  alpha: number | null
  absolute: boolean
  webkitCompassHeading?: number
  webkitCompassAccuracy?: number
}
export const normalize = (angle: number) => ((angle % 360) + 360) % 360

/** Relative alpha and accelerometer data cannot provide a north reference. */
export function readHeading(event: HeadingData): { heading: number; lowAccuracy: boolean } | null {
  const ios = event.webkitCompassHeading
  if (typeof ios === 'number' && Number.isFinite(ios) && ios >= 0 && ios <= 360) {
    const accuracy = event.webkitCompassAccuracy
    if (typeof accuracy === 'number' && (!Number.isFinite(accuracy) || accuracy < 0)) return null
    return { heading: normalize(ios), lowAccuracy: accuracy !== undefined && accuracy > 20 }
  }
  if (event.absolute && typeof event.alpha === 'number' && Number.isFinite(event.alpha) && event.alpha >= 0 && event.alpha <= 360) {
    return { heading: normalize(360 - event.alpha), lowAccuracy: false }
  }
  return null
}

/** Heading of the top of the current screen, clockwise from north. */
export const screenHeading = (heading: number, angle: number) => normalize(heading + angle)
export const relativeBearing = (bearing: number, heading: number) => normalize(bearing - heading)
