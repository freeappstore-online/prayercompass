import { afterEach, describe, expect, it, vi } from 'vitest'
import { CITIES, cityLabel, normalize, searchCities } from './cities'

describe('bundled city list', () => {
  it('has valid, unique entries', () => {
    expect(CITIES.length).toBeGreaterThan(200)
    const seen = new Set<string>()
    for (const city of CITIES) {
      expect(city.name).not.toBe('')
      expect(city.latitude).toBeGreaterThanOrEqual(-90)
      expect(city.latitude).toBeLessThanOrEqual(90)
      expect(city.longitude).toBeGreaterThanOrEqual(-180)
      expect(city.longitude).toBeLessThanOrEqual(180)
      const key = cityLabel(city)
      expect(seen.has(key), key).toBe(false)
      seen.add(key)
    }
  })

  it('places Makkah next to the Kaaba', () => {
    const [makkah] = searchCities('makkah')
    expect(makkah.latitude).toBeCloseTo(21.4225, 1)
    expect(makkah.longitude).toBeCloseTo(39.8262, 1)
  })
})

describe('searchCities', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('finds a city by prefix, ignoring case and accents', () => {
    expect(searchCities('ISTAN')[0].name).toBe('Istanbul')
    expect(searchCities('sao paulo')[0].name).toBe('São Paulo')
    expect(searchCities('reykjavik')[0].name).toBe('Reykjavík')
    expect(searchCities('sanaa')[0].name).toBe("Sana'a")
  })

  it('ranks name prefixes above words, substrings and countries', () => {
    const names = searchCities('man', 20).map((c) => c.name)
    const prefixed = names.filter((name) => normalize(name).startsWith('man'))
    expect(prefixed.length).toBeGreaterThan(0)
    expect(names.slice(0, prefixed.length)).toEqual(prefixed)
    // São Paulo only matches "br" by country (Brazil), so it ranks after name matches.
    const brunei = searchCities('br', 50).map((c) => c.name)
    expect(brunei.indexOf('Brisbane')).toBeLessThan(brunei.indexOf('São Paulo'))
  })

  it('matches later words and countries', () => {
    expect(searchCities('lumpur')[0].name).toBe('Kuala Lumpur')
    expect(searchCities('morocco', 20).map((c) => c.name)).toEqual(
      expect.arrayContaining(['Casablanca', 'Rabat', 'Marrakesh', 'Fez', 'Tangier']),
    )
  })

  it('tells namesakes apart with "city, country"', () => {
    expect(searchCities('hyderabad').map(cityLabel)).toEqual(
      expect.arrayContaining(['Hyderabad, India', 'Hyderabad, Pakistan']),
    )
    expect(searchCities('hyderabad, pak').map(cityLabel)).toEqual(['Hyderabad, Pakistan'])
  })

  it('returns nothing for an empty query or no match, and respects the limit', () => {
    expect(searchCities('   ')).toEqual([])
    expect(searchCities('zzzz')).toEqual([])
    expect(searchCities('a', 5)).toHaveLength(5)
  })

  it('makes no network request', () => {
    const fetchSpy = vi.fn()
    const xhrSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    vi.stubGlobal('XMLHttpRequest', xhrSpy)
    searchCities('cairo')
    searchCities('new york')
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(xhrSpy).not.toHaveBeenCalled()
  })
})
