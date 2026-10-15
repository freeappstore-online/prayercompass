// The user's location: where it came from, and the coordinates. It is kept in
// localStorage only and is never sent anywhere.

export type LocationSource = 'gps' | 'city' | 'manual'

export interface SavedLocation {
  source: LocationSource
  latitude: number
  longitude: number
  /** A human label: the city name, or the coordinates for GPS/manual. */
  label: string
}

export const LOCATION_KEY = 'prayercompass.location'

const SOURCES: LocationSource[] = ['gps', 'city', 'manual']

export function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90
}

export function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180
}

/** "21.4225° N, 39.8262° E" */
export function formatCoordinates(latitude: number, longitude: number): string {
  const lat = `${Math.abs(latitude).toFixed(4)}° ${latitude >= 0 ? 'N' : 'S'}`
  const lng = `${Math.abs(longitude).toFixed(4)}° ${longitude >= 0 ? 'E' : 'W'}`
  return `${lat}, ${lng}`
}

/**
 * Parses typed latitude/longitude. Accepts a decimal point or comma and
 * surrounding spaces. Returns an error message when either is out of range.
 */
export function parseCoordinates(
  latText: string,
  lngText: string,
): { ok: true; latitude: number; longitude: number } | { ok: false; error: string } {
  const toNumber = (text: string) => {
    const trimmed = text.trim().replace(',', '.')
    return /^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(trimmed) ? Number(trimmed) : Number.NaN
  }
  const latitude = toNumber(latText)
  const longitude = toNumber(lngText)
  if (!isValidLatitude(latitude)) return { ok: false, error: 'Latitude must be a number from -90 to 90.' }
  if (!isValidLongitude(longitude)) return { ok: false, error: 'Longitude must be a number from -180 to 180.' }
  return { ok: true, latitude, longitude }
}

export function loadLocation(storage: Storage = localStorage): SavedLocation | null {
  try {
    const raw = storage.getItem(LOCATION_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<SavedLocation>
    if (
      !SOURCES.includes(value.source as LocationSource) ||
      typeof value.latitude !== 'number' ||
      typeof value.longitude !== 'number' ||
      !isValidLatitude(value.latitude) ||
      !isValidLongitude(value.longitude)
    ) {
      return null
    }
    return {
      source: value.source as LocationSource,
      latitude: value.latitude,
      longitude: value.longitude,
      label: typeof value.label === 'string' && value.label ? value.label : formatCoordinates(value.latitude, value.longitude),
    }
  } catch {
    return null
  }
}

export function saveLocation(location: SavedLocation, storage: Storage = localStorage): void {
  storage.setItem(LOCATION_KEY, JSON.stringify(location))
}

export function clearLocation(storage: Storage = localStorage): void {
  storage.removeItem(LOCATION_KEY)
}

/**
 * Asks the browser for the current position. The browser shows its own
 * permission prompt; the position is only used on this device.
 */
export function requestGpsLocation(
  geolocation: Geolocation | undefined = typeof navigator === 'undefined' ? undefined : navigator.geolocation,
): Promise<SavedLocation> {
  return new Promise((resolve, reject) => {
    if (!geolocation) {
      reject(new Error("This browser can't share your location. Search for a city or enter coordinates instead."))
      return
    }
    geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        resolve({ source: 'gps', latitude, longitude, label: formatCoordinates(latitude, longitude) })
      },
      (error) => reject(new Error(gpsErrorMessage(error.code))),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000 },
    )
  })
}

function gpsErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return 'Location permission was denied. Search for a city or enter coordinates instead.'
    case 2:
      return "Your position isn't available right now. Search for a city or enter coordinates instead."
    case 3:
      return 'Finding your location took too long. Try again, or search for a city.'
    default:
      return "Couldn't get your location. Search for a city or enter coordinates instead."
  }
}
