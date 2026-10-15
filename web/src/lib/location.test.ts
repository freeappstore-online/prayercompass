import { describe, expect, it, vi } from 'vitest'
import {
  LOCATION_KEY,
  clearLocation,
  formatCoordinates,
  loadLocation,
  parseCoordinates,
  requestGpsLocation,
  saveLocation,
  type SavedLocation,
} from './location'
import { memoryStorage } from './memoryStorage.test-util'

function fakeGeolocation(outcome: { coords: { latitude: number; longitude: number } } | { code: number }) {
  return {
    getCurrentPosition: vi.fn((success: PositionCallback, failure?: PositionErrorCallback | null) => {
      if ('coords' in outcome) success(outcome as unknown as GeolocationPosition)
      else failure?.(outcome as GeolocationPositionError)
    }),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  }
}

describe('parseCoordinates', () => {
  it('accepts decimal degrees, signs, spaces and a decimal comma', () => {
    expect(parseCoordinates(' 21.4225 ', '39.8262')).toEqual({ ok: true, latitude: 21.4225, longitude: 39.8262 })
    expect(parseCoordinates('-33,87', '+151.21')).toEqual({ ok: true, latitude: -33.87, longitude: 151.21 })
    expect(parseCoordinates('90', '-180')).toEqual({ ok: true, latitude: 90, longitude: -180 })
  })

  it('rejects out-of-range or non-numeric input', () => {
    expect(parseCoordinates('91', '0').ok).toBe(false)
    expect(parseCoordinates('0', '180.5').ok).toBe(false)
    expect(parseCoordinates('', '10').ok).toBe(false)
    expect(parseCoordinates('12abc', '10').ok).toBe(false)
    expect(parseCoordinates('1e2', '10').ok).toBe(false)
  })
})

describe('formatCoordinates', () => {
  it('uses hemispheres instead of signs', () => {
    expect(formatCoordinates(21.4225, 39.8262)).toBe('21.4225° N, 39.8262° E')
    expect(formatCoordinates(-33.87, -70.67)).toBe('33.8700° S, 70.6700° W')
  })
})

describe('location storage', () => {
  const samples: SavedLocation[] = [
    { source: 'gps', latitude: 51.5, longitude: -0.12, label: '51.5000° N, 0.1200° W' },
    { source: 'city', latitude: 41.01, longitude: 28.98, label: 'Istanbul, Türkiye' },
    { source: 'manual', latitude: -6.2, longitude: 106.8, label: '6.2000° S, 106.8000° E' },
  ]

  it.each(samples)('round-trips a $source location (survives a reload)', (location) => {
    const storage = memoryStorage()
    saveLocation(location, storage)
    expect(loadLocation(storage)).toEqual(location)
  })

  it('returns null when nothing is stored, or the stored value is invalid', () => {
    const storage = memoryStorage()
    expect(loadLocation(storage)).toBeNull()
    storage.setItem(LOCATION_KEY, 'not json')
    expect(loadLocation(storage)).toBeNull()
    storage.setItem(LOCATION_KEY, JSON.stringify({ source: 'gps', latitude: 120, longitude: 0 }))
    expect(loadLocation(storage)).toBeNull()
    storage.setItem(LOCATION_KEY, JSON.stringify({ source: 'ip', latitude: 1, longitude: 1 }))
    expect(loadLocation(storage)).toBeNull()
  })

  it('fills in a missing label', () => {
    const storage = memoryStorage()
    storage.setItem(LOCATION_KEY, JSON.stringify({ source: 'manual', latitude: 1, longitude: 2 }))
    expect(loadLocation(storage)?.label).toBe('1.0000° N, 2.0000° E')
  })

  it('forgets the location', () => {
    const storage = memoryStorage()
    saveLocation(samples[0], storage)
    clearLocation(storage)
    expect(loadLocation(storage)).toBeNull()
  })
})

describe('requestGpsLocation', () => {
  it('resolves to a gps location from the browser position', async () => {
    const geo = fakeGeolocation({ coords: { latitude: 21.4225, longitude: 39.8262 } })
    await expect(requestGpsLocation(geo as unknown as Geolocation)).resolves.toEqual({
      source: 'gps',
      latitude: 21.4225,
      longitude: 39.8262,
      label: '21.4225° N, 39.8262° E',
    })
    expect(geo.getCurrentPosition).toHaveBeenCalledTimes(1)
  })

  it('explains a denied permission', async () => {
    await expect(requestGpsLocation(fakeGeolocation({ code: 1 }) as unknown as Geolocation)).rejects.toThrow(/denied/)
  })

  it('explains a timeout', async () => {
    await expect(requestGpsLocation(fakeGeolocation({ code: 3 }) as unknown as Geolocation)).rejects.toThrow(/too long/)
  })

  it('fails clearly when the browser has no geolocation', async () => {
    await expect(requestGpsLocation(undefined)).rejects.toThrow(/can't share your location/)
  })
})
