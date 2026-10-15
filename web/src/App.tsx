import { useEffect, useState } from 'react'
import { initApp } from '@freeappstore/sdk'
import { BuildInfo, type NavItem, PageHeader, Shell } from '@freeappstore/sdk/ui'
import Settings from './Settings'
import { clearLocation, loadLocation, saveLocation, type SavedLocation } from './lib/location'
import { METHODS, loadSettings, saveSettings, type Settings as SettingsValue } from './lib/settings'

const fas = initApp({ appId: 'prayercompass' })

// The app's screens. Shell renders them as its navbar (<nav aria-label="Main">,
// current screen highlighted, a menu on phones). `title` becomes the browser
// tab title on that route.
const NAV: NavItem[] = [
  { label: 'Today', href: '/', title: 'PrayerCompass' },
  { label: 'Settings', href: '/settings', title: 'Settings — PrayerCompass' },
  { label: 'About', href: '/about', title: 'About — PrayerCompass' },
]

// The features planned for v1 (freeappstore-online/platform#221).
const FEATURES = [
  { name: 'Prayer times', what: "Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha for today, and the week ahead." },
  { name: 'Countdown', what: 'A live countdown to the next prayer.' },
  { name: 'Your method', what: 'Choose the calculation method, Asr school and high-latitude rule.' },
  { name: 'Qibla', what: 'The direction of the Kaaba from where you are, in degrees from true north.' },
  { name: 'Hijri date', what: "Today's Hijri date, shown as an estimate." },
  { name: 'Private', what: 'Times are calculated on your device. Your location never leaves it.' },
]

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname)
  // Location and settings live in localStorage only; nothing is sent anywhere.
  const [location, setLocation] = useState<SavedLocation | null>(() => loadLocation())
  const [settings, setSettings] = useState<SettingsValue>(() => loadSettings())

  const changeLocation = (next: SavedLocation | null) => {
    if (next) saveLocation(next)
    else clearLocation()
    setLocation(next)
  }
  const changeSettings = (next: SettingsValue) => {
    saveSettings(next)
    setSettings(next)
  }

  // Keep the screen in step with the browser's back and forward buttons.
  useEffect(() => {
    const sync = () => setPath(window.location.pathname)
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  // Nav clicks switch screens without a page load. Shell scrolls to the top
  // and moves focus to the new screen's PageHeader.
  const navigate = (href: string) => {
    window.history.pushState(null, '', href)
    setPath(href)
  }

  return (
    <Shell app={fas} appName="PrayerCompass" nav={NAV} onNavigate={navigate}>
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">
        {path === '/about' ? (
          <About />
        ) : path === '/settings' ? (
          <Settings
            location={location}
            onLocationChange={changeLocation}
            settings={settings}
            onSettingsChange={changeSettings}
          />
        ) : (
          <Today location={location} settings={settings} onOpenSettings={() => navigate('/settings')} />
        )}
      </div>
      <BuildInfo />
    </Shell>
  )
}

function Today({
  location,
  settings,
  onOpenSettings,
}: {
  location: SavedLocation | null
  settings: SettingsValue
  onOpenSettings: () => void
}) {
  const method = METHODS.find((m) => m.id === settings.method)
  return (
    <>
      <PageHeader
        title="PrayerCompass"
        description="Coming soon — private, ad-free prayer times and Qibla direction: calculated on your device, location never leaves it."
      />
      <ComingSoon />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--line)] p-4">
        <div>
          <p className="text-sm text-[var(--muted)]">Location</p>
          <p className="font-semibold text-[var(--ink)]">{location ? location.label : 'Not set'}</p>
          <p className="text-sm text-[var(--muted)]">{method?.label}</p>
        </div>
        <button type="button" className="underline" onClick={onOpenSettings}>
          {location ? 'Change' : 'Set location'}
        </button>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <li key={feature.name} className="rounded-[var(--radius)] border border-[var(--line)] p-4">
            <p className="font-semibold text-[var(--ink)]">{feature.name}</p>
            <p className="text-sm text-[var(--muted)]">{feature.what}</p>
          </li>
        ))}
      </ul>
    </>
  )
}

function About() {
  return (
    <>
      <PageHeader title="About" />
      <ComingSoon />
      <p className="mt-4 text-[var(--muted)]">
        PrayerCompass will show the daily prayer times and the Qibla direction for where you are.
        Everything will be calculated on your device, so it works offline and your location is never
        sent anywhere. No account, no ads.
      </p>
      <p className="mt-4 text-[var(--muted)]">
        PrayerCompass is a free, MIT-licensed app on{' '}
        <a href="https://freeappstore.online" className="underline">
          FreeAppStore
        </a>
        .
      </p>
    </>
  )
}

// Placeholder until the features are built. None of them work yet, so it says so plainly.
function ComingSoon() {
  return (
    <p className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] p-4 text-[var(--muted)]">
      Coming soon. PrayerCompass is in development; you can set your location and calculation method now, and prayer times and the Qibla are on the way.
    </p>
  )
}
