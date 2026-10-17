import { describe, expect, it } from 'vitest'
import { readHeading, relativeBearing, screenHeading } from './heading'
describe('compass heading', () => {
  it('accepts absolute alpha including north and rejects relative or invalid values', () => {
    expect(readHeading({ alpha: 0, absolute: true })?.heading).toBe(0)
    expect(readHeading({ alpha: 90, absolute: true })?.heading).toBe(270)
    for (const alpha of [null, NaN, Infinity, -1, 361]) expect(readHeading({ alpha, absolute: true })).toBeNull()
    expect(readHeading({ alpha: 30, absolute: false })).toBeNull()
  })
  it('uses iOS heading, flags poor accuracy and rejects unavailable calibration', () => {
    expect(readHeading({ alpha: 50, absolute: false, webkitCompassHeading: 0, webkitCompassAccuracy: 25 })).toEqual({ heading: 0, lowAccuracy: true })
    expect(readHeading({ alpha: null, absolute: false, webkitCompassHeading: 50, webkitCompassAccuracy: -1 })).toBeNull()
  })
  it('handles wraparound and landscape screen rotation', () => {
    expect(relativeBearing(1, 359)).toBe(2)
    expect(relativeBearing(359, 1)).toBe(358)
    expect(screenHeading(350, 90)).toBe(80)
    expect(screenHeading(10, -90)).toBe(280)
  })
})
