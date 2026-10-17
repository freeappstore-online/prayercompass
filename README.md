# PrayerCompass

**Private, ad-free prayer times and Qibla direction: calculated on your device,
location never leaves it.** A free app on [FreeAppStore](https://freeappstore.online), live at
https://prayercompass.freeappstore.online.

- **Prayer times** for today (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) with a live countdown to the
  next prayer, and the week ahead. Calculated with [adhan-js](https://github.com/batoulapps/adhan-js)
  (MIT): 8 calculation methods, Shafi'i or Hanafi Asr, a high-latitude rule and per-prayer adjustments.
- **Qibla**: the great-circle bearing to the Kaaba from true north, with an optional live device compass and calibration guidance.
- **Hijri date** (Umm al-Qura), shown as an estimate.
- **Location** from your device, a built-in list of 240+ cities, or typed coordinates. Stored only in
  this browser; no geocoding service.
- Works offline, light and dark themes, no account, no ads.

## Develop

```bash
pnpm install
pnpm dev      # local dev server
pnpm build    # production build in web/dist
pnpm test     # unit tests (vitest)
pnpm e2e      # end-to-end tests (Playwright; builds first)
fas check     # FreeAppStore compliance checks
fas screencheck  # layout at every reference viewport
```

Pushes to `main` auto-deploy via GitHub Actions.

## License

MIT. Third-party licences are in [LICENCES](LICENCES).

## Live compass verification

The compass uses absolute DeviceOrientationEvent headings or iOS webkitCompassHeading; raw DeviceMotionEvent acceleration cannot establish north. Permissions are requested only from the enable button. Sensor readings remain in memory; the existing Settings GPS flow supplies location. iOS headings use magnetic north; no declination correction is applied. Hold the phone flat and calibrate away from magnetic interference.

Automated tests cover synthetic permission outcomes, absolute/relative and invalid readings, wraparound, screen rotation, low accuracy, stale readings and listener removal. Physical iOS Safari and Android Chrome testing was not available in this run. Before release verification, check permission prompts, portrait/landscape alignment against a true-north compass, calibration and background/navigation behavior on both devices.
