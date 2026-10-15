// A bundled, offline city list for manual location search. Searching it never
// makes a network request: there is no geocoding API. Coordinates are city
// centres to two decimal places (about 1 km), which is well within what prayer
// times and the Qibla bearing need.

export interface City {
  name: string
  country: string
  latitude: number
  longitude: number
}

// [name, country, latitude, longitude]
type Row = [string, string, number, number]

const ROWS: Row[] = [
  // Arabian Peninsula
  ['Makkah', 'Saudi Arabia', 21.42, 39.83],
  ['Madinah', 'Saudi Arabia', 24.47, 39.61],
  ['Riyadh', 'Saudi Arabia', 24.71, 46.68],
  ['Jeddah', 'Saudi Arabia', 21.49, 39.19],
  ['Dammam', 'Saudi Arabia', 26.43, 50.1],
  ['Taif', 'Saudi Arabia', 21.27, 40.42],
  ['Tabuk', 'Saudi Arabia', 28.38, 36.57],
  ['Abha', 'Saudi Arabia', 18.22, 42.51],
  ['Dubai', 'United Arab Emirates', 25.2, 55.27],
  ['Abu Dhabi', 'United Arab Emirates', 24.45, 54.38],
  ['Sharjah', 'United Arab Emirates', 25.35, 55.39],
  ['Doha', 'Qatar', 25.29, 51.53],
  ['Manama', 'Bahrain', 26.23, 50.59],
  ['Kuwait City', 'Kuwait', 29.38, 47.99],
  ['Muscat', 'Oman', 23.59, 58.41],
  ['Salalah', 'Oman', 17.02, 54.09],
  ["Sana'a", 'Yemen', 15.37, 44.19],
  ['Aden', 'Yemen', 12.79, 45.02],
  // Levant, Iraq, Iran, Türkiye
  ['Amman', 'Jordan', 31.95, 35.93],
  ['Jerusalem', 'Palestine', 31.78, 35.23],
  ['Gaza', 'Palestine', 31.5, 34.47],
  ['Ramallah', 'Palestine', 31.9, 35.2],
  ['Beirut', 'Lebanon', 33.89, 35.5],
  ['Damascus', 'Syria', 33.51, 36.29],
  ['Aleppo', 'Syria', 36.2, 37.16],
  ['Baghdad', 'Iraq', 33.31, 44.36],
  ['Basra', 'Iraq', 30.51, 47.81],
  ['Mosul', 'Iraq', 36.34, 43.13],
  ['Erbil', 'Iraq', 36.19, 44.01],
  ['Najaf', 'Iraq', 32.03, 44.35],
  ['Karbala', 'Iraq', 32.62, 44.02],
  ['Tehran', 'Iran', 35.69, 51.39],
  ['Mashhad', 'Iran', 36.3, 59.61],
  ['Isfahan', 'Iran', 32.65, 51.67],
  ['Shiraz', 'Iran', 29.59, 52.58],
  ['Tabriz', 'Iran', 38.08, 46.29],
  ['Qom', 'Iran', 34.64, 50.88],
  ['Istanbul', 'Türkiye', 41.01, 28.98],
  ['Ankara', 'Türkiye', 39.93, 32.86],
  ['Izmir', 'Türkiye', 38.42, 27.14],
  ['Bursa', 'Türkiye', 40.19, 29.06],
  ['Konya', 'Türkiye', 37.87, 32.48],
  ['Antalya', 'Türkiye', 36.9, 30.71],
  ['Nicosia', 'Cyprus', 35.19, 33.38],
  // North Africa
  ['Cairo', 'Egypt', 30.04, 31.24],
  ['Alexandria', 'Egypt', 31.2, 29.92],
  ['Giza', 'Egypt', 30.01, 31.21],
  ['Aswan', 'Egypt', 24.09, 32.9],
  ['Khartoum', 'Sudan', 15.5, 32.56],
  ['Tripoli', 'Libya', 32.89, 13.19],
  ['Benghazi', 'Libya', 32.12, 20.09],
  ['Tunis', 'Tunisia', 36.81, 10.18],
  ['Algiers', 'Algeria', 36.75, 3.06],
  ['Oran', 'Algeria', 35.7, -0.63],
  ['Constantine', 'Algeria', 36.37, 6.61],
  ['Casablanca', 'Morocco', 33.57, -7.59],
  ['Rabat', 'Morocco', 34.02, -6.84],
  ['Marrakesh', 'Morocco', 31.63, -7.98],
  ['Fez', 'Morocco', 34.03, -5.0],
  ['Tangier', 'Morocco', 35.76, -5.83],
  ['Nouakchott', 'Mauritania', 18.08, -15.98],
  // Sub-Saharan Africa
  ['Dakar', 'Senegal', 14.72, -17.47],
  ['Touba', 'Senegal', 14.85, -15.88],
  ['Bamako', 'Mali', 12.64, -8.0],
  ['Niamey', 'Niger', 13.51, 2.11],
  ['Kano', 'Nigeria', 12.0, 8.52],
  ['Lagos', 'Nigeria', 6.52, 3.38],
  ['Abuja', 'Nigeria', 9.08, 7.4],
  ['Accra', 'Ghana', 5.6, -0.19],
  ['Conakry', 'Guinea', 9.64, -13.58],
  ['Abidjan', "Côte d'Ivoire", 5.36, -4.01],
  ["N'Djamena", 'Chad', 12.13, 15.06],
  ['Mogadishu', 'Somalia', 2.05, 45.32],
  ['Hargeisa', 'Somalia', 9.56, 44.06],
  ['Djibouti', 'Djibouti', 11.59, 43.15],
  ['Addis Ababa', 'Ethiopia', 9.03, 38.74],
  ['Nairobi', 'Kenya', -1.29, 36.82],
  ['Mombasa', 'Kenya', -4.04, 39.67],
  ['Kampala', 'Uganda', 0.35, 32.58],
  ['Dar es Salaam', 'Tanzania', -6.79, 39.21],
  ['Zanzibar City', 'Tanzania', -6.17, 39.2],
  ['Kinshasa', 'DR Congo', -4.44, 15.27],
  ['Johannesburg', 'South Africa', -26.2, 28.05],
  ['Cape Town', 'South Africa', -33.92, 18.42],
  ['Durban', 'South Africa', -29.86, 31.02],
  // South Asia
  ['Karachi', 'Pakistan', 24.86, 67.0],
  ['Lahore', 'Pakistan', 31.55, 74.34],
  ['Islamabad', 'Pakistan', 33.68, 73.05],
  ['Rawalpindi', 'Pakistan', 33.6, 73.04],
  ['Faisalabad', 'Pakistan', 31.42, 73.08],
  ['Peshawar', 'Pakistan', 34.01, 71.58],
  ['Multan', 'Pakistan', 30.16, 71.52],
  ['Quetta', 'Pakistan', 30.18, 66.98],
  ['Hyderabad', 'Pakistan', 25.4, 68.37],
  ['Kabul', 'Afghanistan', 34.56, 69.21],
  ['Kandahar', 'Afghanistan', 31.63, 65.71],
  ['Herat', 'Afghanistan', 34.35, 62.2],
  ['Delhi', 'India', 28.61, 77.21],
  ['Mumbai', 'India', 19.08, 72.88],
  ['Hyderabad', 'India', 17.39, 78.49],
  ['Bengaluru', 'India', 12.97, 77.59],
  ['Chennai', 'India', 13.08, 80.27],
  ['Kolkata', 'India', 22.57, 88.36],
  ['Lucknow', 'India', 26.85, 80.95],
  ['Srinagar', 'India', 34.08, 74.8],
  ['Ahmedabad', 'India', 23.02, 72.57],
  ['Kozhikode', 'India', 11.26, 75.78],
  ['Dhaka', 'Bangladesh', 23.81, 90.41],
  ['Chittagong', 'Bangladesh', 22.36, 91.78],
  ['Sylhet', 'Bangladesh', 24.89, 91.87],
  ['Colombo', 'Sri Lanka', 6.93, 79.86],
  ['Malé', 'Maldives', 4.18, 73.51],
  ['Kathmandu', 'Nepal', 27.72, 85.32],
  // Central Asia & Caucasus
  ['Tashkent', 'Uzbekistan', 41.3, 69.24],
  ['Samarkand', 'Uzbekistan', 39.65, 66.96],
  ['Bukhara', 'Uzbekistan', 39.77, 64.42],
  ['Almaty', 'Kazakhstan', 43.24, 76.89],
  ['Astana', 'Kazakhstan', 51.17, 71.45],
  ['Bishkek', 'Kyrgyzstan', 42.87, 74.59],
  ['Dushanbe', 'Tajikistan', 38.56, 68.79],
  ['Ashgabat', 'Turkmenistan', 37.96, 58.33],
  ['Baku', 'Azerbaijan', 40.41, 49.87],
  ['Tbilisi', 'Georgia', 41.72, 44.79],
  ['Grozny', 'Russia', 43.32, 45.69],
  ['Makhachkala', 'Russia', 42.98, 47.5],
  ['Kazan', 'Russia', 55.79, 49.12],
  ['Ufa', 'Russia', 54.74, 55.97],
  ['Moscow', 'Russia', 55.76, 37.62],
  ['Saint Petersburg', 'Russia', 59.93, 30.34],
  // East & Southeast Asia
  ['Jakarta', 'Indonesia', -6.21, 106.85],
  ['Surabaya', 'Indonesia', -7.26, 112.75],
  ['Bandung', 'Indonesia', -6.92, 107.62],
  ['Medan', 'Indonesia', 3.6, 98.67],
  ['Makassar', 'Indonesia', -5.15, 119.43],
  ['Banda Aceh', 'Indonesia', 5.55, 95.32],
  ['Yogyakarta', 'Indonesia', -7.8, 110.36],
  ['Kuala Lumpur', 'Malaysia', 3.14, 101.69],
  ['George Town', 'Malaysia', 5.41, 100.33],
  ['Johor Bahru', 'Malaysia', 1.49, 103.74],
  ['Kota Kinabalu', 'Malaysia', 5.98, 116.07],
  ['Singapore', 'Singapore', 1.35, 103.82],
  ['Bandar Seri Begawan', 'Brunei', 4.9, 114.94],
  ['Bangkok', 'Thailand', 13.76, 100.5],
  ['Pattani', 'Thailand', 6.87, 101.25],
  ['Manila', 'Philippines', 14.6, 120.98],
  ['Marawi', 'Philippines', 8.0, 124.29],
  ['Cotabato City', 'Philippines', 7.22, 124.25],
  ['Ho Chi Minh City', 'Vietnam', 10.82, 106.63],
  ['Yangon', 'Myanmar', 16.84, 96.17],
  ['Beijing', 'China', 39.9, 116.41],
  ['Shanghai', 'China', 31.23, 121.47],
  ['Guangzhou', 'China', 23.13, 113.26],
  ['Hong Kong', 'China', 22.32, 114.17],
  ['Urumqi', 'China', 43.83, 87.62],
  ['Kashgar', 'China', 39.47, 75.99],
  ['Tokyo', 'Japan', 35.68, 139.69],
  ['Osaka', 'Japan', 34.69, 135.5],
  ['Seoul', 'South Korea', 37.57, 126.98],
  // Europe
  ['London', 'United Kingdom', 51.51, -0.13],
  ['Birmingham', 'United Kingdom', 52.49, -1.89],
  ['Manchester', 'United Kingdom', 53.48, -2.24],
  ['Bradford', 'United Kingdom', 53.8, -1.76],
  ['Leicester', 'United Kingdom', 52.64, -1.13],
  ['Glasgow', 'United Kingdom', 55.86, -4.25],
  ['Edinburgh', 'United Kingdom', 55.95, -3.19],
  ['Dublin', 'Ireland', 53.35, -6.26],
  ['Paris', 'France', 48.86, 2.35],
  ['Marseille', 'France', 43.3, 5.37],
  ['Lyon', 'France', 45.76, 4.84],
  ['Brussels', 'Belgium', 50.85, 4.35],
  ['Amsterdam', 'Netherlands', 52.37, 4.9],
  ['Rotterdam', 'Netherlands', 51.92, 4.48],
  ['Berlin', 'Germany', 52.52, 13.4],
  ['Hamburg', 'Germany', 53.55, 9.99],
  ['Cologne', 'Germany', 50.94, 6.96],
  ['Frankfurt', 'Germany', 50.11, 8.68],
  ['Munich', 'Germany', 48.14, 11.58],
  ['Vienna', 'Austria', 48.21, 16.37],
  ['Zurich', 'Switzerland', 47.38, 8.54],
  ['Geneva', 'Switzerland', 46.2, 6.14],
  ['Madrid', 'Spain', 40.42, -3.7],
  ['Barcelona', 'Spain', 41.39, 2.17],
  ['Granada', 'Spain', 37.18, -3.6],
  ['Lisbon', 'Portugal', 38.72, -9.14],
  ['Rome', 'Italy', 41.9, 12.5],
  ['Milan', 'Italy', 45.46, 9.19],
  ['Athens', 'Greece', 37.98, 23.73],
  ['Sarajevo', 'Bosnia and Herzegovina', 43.86, 18.41],
  ['Tirana', 'Albania', 41.33, 19.82],
  ['Pristina', 'Kosovo', 42.66, 21.17],
  ['Skopje', 'North Macedonia', 41.99, 21.43],
  ['Sofia', 'Bulgaria', 42.7, 23.32],
  ['Bucharest', 'Romania', 44.43, 26.1],
  ['Warsaw', 'Poland', 52.23, 21.01],
  ['Copenhagen', 'Denmark', 55.68, 12.57],
  ['Stockholm', 'Sweden', 59.33, 18.07],
  ['Malmö', 'Sweden', 55.6, 13.0],
  ['Oslo', 'Norway', 59.91, 10.75],
  ['Tromsø', 'Norway', 69.65, 18.96],
  ['Helsinki', 'Finland', 60.17, 24.94],
  ['Reykjavík', 'Iceland', 64.15, -21.94],
  // Americas
  ['New York', 'United States', 40.71, -74.01],
  ['Los Angeles', 'United States', 34.05, -118.24],
  ['Chicago', 'United States', 41.88, -87.63],
  ['Houston', 'United States', 29.76, -95.37],
  ['Dallas', 'United States', 32.78, -96.8],
  ['Dearborn', 'United States', 42.32, -83.18],
  ['Detroit', 'United States', 42.33, -83.05],
  ['Washington', 'United States', 38.91, -77.04],
  ['Philadelphia', 'United States', 39.95, -75.17],
  ['Atlanta', 'United States', 33.75, -84.39],
  ['Miami', 'United States', 25.76, -80.19],
  ['Minneapolis', 'United States', 44.98, -93.27],
  ['San Francisco', 'United States', 37.77, -122.42],
  ['Seattle', 'United States', 47.61, -122.33],
  ['Phoenix', 'United States', 33.45, -112.07],
  ['Anchorage', 'United States', 61.22, -149.9],
  ['Toronto', 'Canada', 43.65, -79.38],
  ['Montreal', 'Canada', 45.5, -73.57],
  ['Ottawa', 'Canada', 45.42, -75.7],
  ['Calgary', 'Canada', 51.05, -114.07],
  ['Edmonton', 'Canada', 53.55, -113.49],
  ['Vancouver', 'Canada', 49.28, -123.12],
  ['Mexico City', 'Mexico', 19.43, -99.13],
  ['Bogotá', 'Colombia', 4.71, -74.07],
  ['Caracas', 'Venezuela', 10.48, -66.9],
  ['Lima', 'Peru', -12.05, -77.04],
  ['São Paulo', 'Brazil', -23.55, -46.63],
  ['Rio de Janeiro', 'Brazil', -22.91, -43.17],
  ['Foz do Iguaçu', 'Brazil', -25.55, -54.59],
  ['Buenos Aires', 'Argentina', -34.6, -58.38],
  ['Santiago', 'Chile', -33.45, -70.67],
  ['Georgetown', 'Guyana', 6.8, -58.16],
  ['Paramaribo', 'Suriname', 5.85, -55.2],
  ['Port of Spain', 'Trinidad and Tobago', 10.66, -61.51],
  // Oceania
  ['Sydney', 'Australia', -33.87, 151.21],
  ['Melbourne', 'Australia', -37.81, 144.96],
  ['Brisbane', 'Australia', -27.47, 153.03],
  ['Perth', 'Australia', -31.95, 115.86],
  ['Adelaide', 'Australia', -34.93, 138.6],
  ['Auckland', 'New Zealand', -36.85, 174.76],
  ['Christchurch', 'New Zealand', -43.53, 172.64],
  ['Suva', 'Fiji', -18.14, 178.44],
]

export const CITIES: readonly City[] = ROWS.map(([name, country, latitude, longitude]) => ({
  name,
  country,
  latitude,
  longitude,
}))

/** Lowercase and strip accents so "sao paulo" finds "São Paulo". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .trim()
}

/**
 * Searches the bundled list by city or country. Cities whose name starts with
 * the query come first, then other name matches, then country matches.
 */
export function searchCities(query: string, limit = 8, cities: readonly City[] = CITIES): City[] {
  const q = normalize(query)
  if (!q) return []
  const scored: { city: City; rank: number }[] = []
  for (const city of cities) {
    const name = normalize(city.name)
    const country = normalize(city.country)
    // `${name}, ${country}` also matches "hyderabad, ind" to pick between namesakes.
    const rank = `${name}, ${country}`.startsWith(q)
      ? 0
      : name.split(/[\s-]+/).some((word) => word.startsWith(q))
        ? 1
        : name.includes(q)
          ? 2
          : country.startsWith(q)
            ? 3
            : -1
    if (rank >= 0) scored.push({ city, rank })
  }
  scored.sort((a, b) => a.rank - b.rank || a.city.name.localeCompare(b.city.name))
  return scored.slice(0, limit).map((entry) => entry.city)
}

export function cityLabel(city: City): string {
  return `${city.name}, ${city.country}`
}
