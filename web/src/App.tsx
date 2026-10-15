import { useEffect, useState } from 'react'
import { initApp } from '@freeappstore/sdk'
import { BuildInfo, type NavItem, PageHeader, Shell } from '@freeappstore/sdk/ui'
import Settings from './Settings'
import Today from './Today'
import Week from './Week'
import { clearLocation, loadLocation, saveLocation, type SavedLocation } from './lib/location'
import { loadSettings, saveSettings, type Settings as SettingsValue } from './lib/settings'

const fas = initApp({ appId: 'prayercompass' })

// The app's screens. Shell renders them as its navbar (<nav aria-label="Main">,
// current screen highlighted, a menu on phones). `title` becomes the browser
// tab title on that route.
const NAV: NavItem[] = [
  { label: 'Today', href: '/', title: 'PrayerCompass' },
  { label: 'Week', href: '/week', title: 'This week — PrayerCompass' },
  { label: 'Settings', href: '/settings', title: 'Settings — PrayerCompass' },
  { label: 'About', href: '/about', title: 'About — PrayerCompass' },
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
        ) : path === '/week' ? (
          <Week
            location={location}
            settings={settings}
            onOpenSettings={() => navigate('/settings')}
            onOpenToday={() => navigate('/')}
          />
        ) : (
          <Today
            location={location}
            settings={settings}
            onOpenSettings={() => navigate('/settings')}
            onOpenWeek={() => navigate('/week')}
          />
        )}
      </div>
      <BuildInfo />
    </Shell>
  )
}

function About() {
  return (
    <>
      <PageHeader title="About" />
      <p className="text-[var(--muted)]">
        PrayerCompass shows the daily prayer times, a countdown to the next prayer and the week ahead
        for where you are. Everything is calculated on your device, so it works offline and your
        location is never sent anywhere. No account, no ads. The Qibla direction is coming soon.
      </p>
      <p className="mt-4 text-[var(--muted)]">
        The Hijri date is an estimate from the Umm al-Qura calendar; the start of each month depends on
        the moon being sighted, so it can differ by a day from your local announcement.
      </p>
      <p className="mt-4 text-[var(--muted)]">
        Prayer times are calculated with{' '}
        <a href="https://github.com/batoulapps/adhan-js" className="underline">
          adhan-js
        </a>{' '}
        by Batoul Apps (MIT licence).
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

