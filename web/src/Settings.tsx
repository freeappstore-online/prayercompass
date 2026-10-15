import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { PageHeader } from '@freeappstore/sdk/ui'
import { cityLabel, searchCities, type City } from './lib/cities'
import { formatCoordinates, parseCoordinates, requestGpsLocation, type SavedLocation } from './lib/location'
import {
  DEFAULT_SETTINGS,
  HIGH_LATITUDE_RULES,
  MADHABS,
  MAX_ADJUSTMENT,
  METHODS,
  PRAYERS,
  clampAdjustment,
  type Settings as SettingsValue,
} from './lib/settings'

const card = 'rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5'
const button =
  'rounded-[var(--radius)] border border-[var(--line-strong)] px-4 py-2 font-semibold text-[var(--ink)] hover:bg-[var(--paper-deep)] disabled:opacity-60'
const input =
  'w-full rounded-[var(--radius)] border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-[var(--ink)]'

interface Props {
  location: SavedLocation | null
  onLocationChange: (location: SavedLocation | null) => void
  settings: SettingsValue
  onSettingsChange: (settings: SettingsValue) => void
}

export default function Settings({ location, onLocationChange, settings, onSettingsChange }: Props) {
  return (
    <>
      <PageHeader title="Settings" description="Your location and how prayer times are calculated." />
      <LocationSection location={location} onChange={onLocationChange} />
      <CalculationSection settings={settings} onChange={onSettingsChange} />
    </>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="mt-6">
      <h2 id={id} className="mb-3 text-xl font-semibold text-[var(--ink)]">
        {title}
      </h2>
      {children}
    </section>
  )
}

function LocationSection({ location, onChange }: { location: SavedLocation | null; onChange: (l: SavedLocation | null) => void }) {
  const [status, setStatus] = useState<{ kind: 'info' | 'error'; text: string } | null>(null)
  const [locating, setLocating] = useState(false)

  const choose = (next: SavedLocation, message: string) => {
    onChange(next)
    setStatus({ kind: 'info', text: message })
  }

  const useGps = async () => {
    setLocating(true)
    setStatus(null)
    try {
      choose(await requestGpsLocation(), 'Location set from your device.')
    } catch (error) {
      setStatus({ kind: 'error', text: (error as Error).message })
    } finally {
      setLocating(false)
    }
  }

  return (
    <Section title="Location">
      <div className={card}>
        <p className="text-sm text-[var(--muted)]">Current location</p>
        {location ? (
          <>
            <p className="text-lg font-semibold text-[var(--ink)]">{location.label}</p>
            <p className="text-sm text-[var(--muted)]">
              {formatCoordinates(location.latitude, location.longitude)} ·{' '}
              {location.source === 'gps' ? 'from your device' : location.source === 'city' ? 'from the city list' : 'entered by hand'}
            </p>
            <button
              type="button"
              className="mt-3 text-sm text-[var(--muted)] underline"
              onClick={() => {
                onChange(null)
                setStatus({ kind: 'info', text: 'Location removed from this device.' })
              }}
            >
              Forget location
            </button>
          </>
        ) : (
          <p className="text-lg font-semibold text-[var(--ink)]">Not set</p>
        )}
        <p role="status" className={`mt-3 text-sm ${status?.kind === 'error' ? 'text-[var(--danger)]' : 'text-[var(--muted)]'}`}>
          {status?.text}
        </p>
      </div>

      <div className={`${card} mt-3`}>
        <h3 className="font-semibold text-[var(--ink)]">Use my location</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Your browser will ask for permission. The position is used on this device only and is never sent anywhere.
        </p>
        <button type="button" className={`${button} mt-3`} onClick={useGps} disabled={locating}>
          {locating ? 'Finding your location…' : 'Use my location'}
        </button>
      </div>

      <CitySearch onPick={(city) => choose({ source: 'city', latitude: city.latitude, longitude: city.longitude, label: cityLabel(city) }, `Location set to ${cityLabel(city)}.`)} />

      <ManualEntry
        initial={location?.source === 'manual' ? location : null}
        onSave={(latitude, longitude) =>
          choose({ source: 'manual', latitude, longitude, label: formatCoordinates(latitude, longitude) }, 'Location set from the coordinates you entered.')
        }
      />

      <p className="mt-3 text-sm text-[var(--muted)]">
        <strong className="text-[var(--ink)]">Privacy:</strong> your location is stored only in this browser (localStorage) and
        never leaves your device. City search uses a list built into the app, so nothing you type is sent anywhere. Prayer
        times and the Qibla are calculated on your device.
      </p>
    </Section>
  )
}

function CitySearch({ onPick }: { onPick: (city: City) => void }) {
  const [query, setQuery] = useState('')
  const inputId = useId()
  const results = searchCities(query)
  return (
    <div className={`${card} mt-3`}>
      <label htmlFor={inputId} className="font-semibold text-[var(--ink)]">
        Search for a city
      </label>
      <p className="mt-1 text-sm text-[var(--muted)]">From a list built into the app — works offline.</p>
      <input
        id={inputId}
        type="search"
        className={`${input} mt-3`}
        placeholder="e.g. Istanbul"
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {query.trim() && (
        <ul className="mt-2 divide-y divide-[var(--line)]" aria-label="Matching cities">
          {results.length === 0 ? (
            <li className="py-2 text-sm text-[var(--muted)]">
              No city found. Try a nearby larger city, or enter coordinates below.
            </li>
          ) : (
            results.map((city) => (
              <li key={`${city.name}|${city.country}`}>
                <button
                  type="button"
                  className="w-full py-2 text-left hover:bg-[var(--paper-deep)]"
                  onClick={() => {
                    onPick(city)
                    setQuery('')
                  }}
                >
                  <span className="font-semibold text-[var(--ink)]">{city.name}</span>
                  <span className="text-[var(--muted)]">, {city.country}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

function ManualEntry({ initial, onSave }: { initial: SavedLocation | null; onSave: (latitude: number, longitude: number) => void }) {
  const [lat, setLat] = useState(initial ? String(initial.latitude) : '')
  const [lng, setLng] = useState(initial ? String(initial.longitude) : '')
  const [error, setError] = useState('')
  const latId = useId()
  const lngId = useId()
  const errorId = useId()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const result = parseCoordinates(lat, lng)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError('')
    onSave(result.latitude, result.longitude)
  }

  return (
    <form className={`${card} mt-3`} onSubmit={submit} noValidate>
      <h3 className="font-semibold text-[var(--ink)]">Enter coordinates</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">Decimal degrees. South and west are negative.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={latId} className="text-sm text-[var(--muted)]">
            Latitude (-90 to 90)
          </label>
          <input id={latId} className={input} inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} aria-describedby={error ? errorId : undefined} placeholder="21.4225" />
        </div>
        <div>
          <label htmlFor={lngId} className="text-sm text-[var(--muted)]">
            Longitude (-180 to 180)
          </label>
          <input id={lngId} className={input} inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} aria-describedby={error ? errorId : undefined} placeholder="39.8262" />
        </div>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
      <button type="submit" className={`${button} mt-3`}>
        Save coordinates
      </button>
    </form>
  )
}

function CalculationSection({ settings, onChange }: { settings: SettingsValue; onChange: (s: SettingsValue) => void }) {
  const methodId = useId()
  const latitudeRuleId = useId()
  const method = METHODS.find((m) => m.id === settings.method)
  const rule = HIGH_LATITUDE_RULES.find((r) => r.id === settings.highLatitudeRule)

  return (
    <Section title="Calculation">
      <div className={card}>
        <label htmlFor={methodId} className="font-semibold text-[var(--ink)]">
          Calculation method
        </label>
        <select
          id={methodId}
          className={`${input} mt-2`}
          value={settings.method}
          onChange={(e) => onChange({ ...settings, method: e.target.value as SettingsValue['method'] })}
        >
          {METHODS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-[var(--muted)]">{method?.detail}</p>
      </div>

      <fieldset className={`${card} mt-3`}>
        <legend className="float-left w-full font-semibold text-[var(--ink)]">Asr calculation</legend>
        {MADHABS.map((m) => (
          <label key={m.id} className="clear-left flex items-start gap-2 pt-2">
            <input
              type="radio"
              name="madhab"
              className="mt-1"
              checked={settings.madhab === m.id}
              onChange={() => onChange({ ...settings, madhab: m.id })}
            />
            <span>
              <span className="text-[var(--ink)]">{m.label}</span>
              <span className="block text-sm text-[var(--muted)]">{m.detail}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className={`${card} mt-3`}>
        <label htmlFor={latitudeRuleId} className="font-semibold text-[var(--ink)]">
          High-latitude rule
        </label>
        <select
          id={latitudeRuleId}
          className={`${input} mt-2`}
          value={settings.highLatitudeRule}
          onChange={(e) => onChange({ ...settings, highLatitudeRule: e.target.value as SettingsValue['highLatitudeRule'] })}
        >
          {HIGH_LATITUDE_RULES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-[var(--muted)]">{rule?.detail}. Used where twilight lasts all night in summer.</p>
      </div>

      <fieldset className={`${card} mt-3`}>
        <legend className="float-left w-full font-semibold text-[var(--ink)]">Adjustments (minutes)</legend>
        <p className="clear-left pt-1 text-sm text-[var(--muted)]">
          Shift a time to match your local mosque, from -{MAX_ADJUSTMENT} to +{MAX_ADJUSTMENT} minutes.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PRAYERS.map((p) => (
            <AdjustmentInput
              key={p.id}
              label={p.label}
              value={settings.adjustments[p.id]}
              onChange={(minutes) => onChange({ ...settings, adjustments: { ...settings.adjustments, [p.id]: minutes } })}
            />
          ))}
        </div>
      </fieldset>

      <button type="button" className={`${button} mt-3`} onClick={() => onChange(DEFAULT_SETTINGS)}>
        Reset to defaults
      </button>
    </Section>
  )
}

function AdjustmentInput({ label, value, onChange }: { label: string; value: number; onChange: (minutes: number) => void }) {
  const id = useId()
  // Keep the typed text so "-" or an empty field can be edited freely; the
  // saved value is the clamped whole number.
  const [text, setText] = useState(String(value))
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    setText(String(value))
  }
  return (
    <div>
      <label htmlFor={id} className="text-sm text-[var(--muted)]">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={-MAX_ADJUSTMENT}
        max={MAX_ADJUSTMENT}
        step={1}
        className={input}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          const minutes = clampAdjustment(e.target.value === '' || e.target.value === '-' ? 0 : e.target.value)
          setLastValue(minutes)
          onChange(minutes)
        }}
        onBlur={() => setText(String(value))}
      />
    </div>
  )
}
