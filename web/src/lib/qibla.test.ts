import { Coordinates, Qibla } from 'adhan'
import { describe, expect, it } from 'vitest'
import { CITIES } from './cities'
import { KAABA, compassPoint, distanceToKaaba, qiblaBearing } from './qibla'

// Commonly published Qibla bearings (degrees from true north, to 0.01°), as
// given by Qibla tables and calculators that use the great-circle method.
const REFERENCES: [city: string, lat: number, lng: number, bearing: number][] = [
  ['London', 51.5074, -0.1278, 118.99],
  ['New York', 40.7128, -74.006, 58.48],
  ['Jakarta', -6.2088, 106.8456, 295.15],
  ['Sydney', -33.8688, 151.2093, 277.5],
  ['Cairo', 30.0444, 31.2357, 136.14],
  ['Tokyo', 35.6762, 139.6503, 293.0],
  ['Kuala Lumpur', 3.139, 101.6869, 292.54],
  ['Istanbul', 41.0082, 28.9784, 151.62],
]

describe('qiblaBearing', () => {
  it.each(REFERENCES)('%s → %f°', (_city, lat, lng, expected) => {
    expect(Math.abs(qiblaBearing(lat, lng) - expected)).toBeLessThanOrEqual(0.1)
  })

  it('matches adhan-js Qibla() for every bundled city', () => {
    // adhan uses 21.4225241, 39.8261818 for the Kaaba; that only matters in
    // and right around Makkah, so those are left out.
    for (const city of CITIES.filter((c) => distanceToKaaba(c.latitude, c.longitude) > 50)) {
      const ours = qiblaBearing(city.latitude, city.longitude)
      const theirs = Qibla(new Coordinates(city.latitude, city.longitude))
      const diff = Math.abs(ours - theirs)
      expect(Math.min(diff, 360 - diff), city.name).toBeLessThan(0.01)
    }
  })

  it('points along the meridian when due north or south of the Kaaba', () => {
    expect(qiblaBearing(60, KAABA.lng)).toBeCloseTo(180, 6)
    expect(qiblaBearing(-30, KAABA.lng)).toBeCloseTo(0, 6)
  })

  it('handles the antimeridian and the poles', () => {
    expect(qiblaBearing(0, 180)).toBeGreaterThan(270)
    expect(qiblaBearing(0, -180)).toBeCloseTo(qiblaBearing(0, 180), 6)
    expect(qiblaBearing(89.9999, 0)).toBeGreaterThan(130)
  })

  it('always returns a bearing in [0, 360)', () => {
    for (let lat = -89; lat <= 89; lat += 7) {
      for (let lng = -180; lng <= 180; lng += 11) {
        const bearing = qiblaBearing(lat, lng)
        expect(Number.isFinite(bearing)).toBe(true)
        expect(bearing).toBeGreaterThanOrEqual(0)
        expect(bearing).toBeLessThan(360)
      }
    }
  })
})

describe('compassPoint', () => {
  it('names the nearest point', () => {
    expect(compassPoint(0)).toBe('N')
    expect(compassPoint(359)).toBe('N')
    expect(compassPoint(58.48)).toBe('ENE')
    expect(compassPoint(118.99)).toBe('ESE')
    expect(compassPoint(277.5)).toBe('W')
  })
})

describe('distanceToKaaba', () => {
  it('is about right for known cities', () => {
    expect(distanceToKaaba(KAABA.lat, KAABA.lng)).toBeCloseTo(0, 6)
    expect(distanceToKaaba(51.5074, -0.1278)).toBeGreaterThan(4750)
    expect(distanceToKaaba(51.5074, -0.1278)).toBeLessThan(4820)
  })
})
