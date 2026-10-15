// The privacy note, shown on the About screen. Keep it accurate: e2e tests
// check the app only ever contacts the FreeAppStore platform.

export function PrivacyNote() {
  return (
    <section
      aria-labelledby="privacy-note"
      className="mt-6 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5"
    >
      <h2 id="privacy-note" className="text-xl font-semibold text-[var(--ink)]">
        Privacy
      </h2>
      <ul className="mt-2 grid list-disc gap-2 ps-5 text-[var(--muted)]">
        <li>
          Your location and settings are stored only in this browser on this device (localStorage).
          PrayerCompass never sends your location anywhere, and there is no account.
        </li>
        <li>
          Prayer times, the Qibla direction and the Hijri date are calculated on your device. City search
          uses a list built into the app, so nothing you type is sent anywhere, and there's no
          geocoding or other location service.
        </li>
        <li>
          If you choose "Use my location", your browser asks for permission and works out your position
          itself (some browsers use their own location service for this). PrayerCompass only receives
          the result and keeps it on this device.
        </li>
        <li>
          Page-view counts: the app loads FreeAppStore's store analytics script, which records which
          screen you opened (for example /qibla), the page that linked here, and the time. It's sent to
          FreeAppStore without cookies and without your account, and held in this browser while you're
          offline. Your location and settings are never included.
        </li>
        <li>
          PrayerCompass is served via FreeAppStore, which also loads Cloudflare Web Analytics
          (beacon.min.js from static.cloudflareinsights.com). It doesn't use cookies and reports only
          aggregate page-view statistics, such as page load times and visit counts. As with any website,
          the servers handling these requests see your IP address and browser type.
        </li>
        <li>No ads, no tracking cookies, and no advertising or tracking SDKs.</li>
        <li>
          To remove your location, use "Forget location" in Settings, or clear this browser's data for
          the app.
        </li>
      </ul>
    </section>
  )
}
