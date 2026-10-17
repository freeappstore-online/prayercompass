import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import QiblaMap, { greatCirclePoints, MAKKAH, mapPath } from './QiblaMap'

describe('offline Qibla map', () => {
  it('samples a spherical arc with correct endpoints and equal angular steps', () => {
    const start = { lat: 51.5074, lon: -0.1278 }
    const points = greatCirclePoints(start)
    expect(points).toHaveLength(129)
    expect(points[0]).toEqual(start)
    expect(points.at(-1)).toEqual(MAKKAH)
    const distance = (a: typeof start, b: typeof start) => {
      const r = Math.PI / 180
      return Math.acos(Math.min(1, Math.sin(a.lat * r) * Math.sin(b.lat * r) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.cos((a.lon - b.lon) * r)))
    }
    for (let i = 1; i < points.length; i++) expect(distance(points[i - 1], points[i])).toBeCloseTo(distance(start, MAKKAH) / 128, 8)
  })

  it('splits dateline crossings at both map edges', () => {
    expect(mapPath([{ lat: 0, lon: 179 }, { lat: 2, lon: -179 }])).toBe('M359,90 L360,89 M0,89 L1,88')
    for (const lat of [-90, 0, 90]) expect(mapPath(greatCirclePoints({ lat, lon: 180 }))).not.toMatch(/NaN|Infinity/)
  })

  it('omits undefined and near-Kaaba routes', () => {
    expect(greatCirclePoints(MAKKAH)).toEqual([])
    expect(greatCirclePoints({ lat: -MAKKAH.lat, lon: MAKKAH.lon - 180 })).toEqual([])
    expect(renderToStaticMarkup(<QiblaMap lat={21.4225} lon={39.8262} />)).toContain('no route is shown')
  })

  it('renders self-contained SVG without network calls or resource references', () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network forbidden'))
    try {
      const html = renderToStaticMarkup(<QiblaMap lat={-33.8688} lon={151.2093} />)
      expect(html).toContain('<svg')
      expect(html).toContain('data-map-route')
      expect(html).not.toMatch(/https?:|href=|src=|<image|<iframe|url\(/)
      expect(fetch).not.toHaveBeenCalled()
    } finally { fetch.mockRestore() }
  })
})
