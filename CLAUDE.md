# prayercompass

PrayerCompass: private, ad-free prayer times and Qibla direction on FreeAppStore — today's times
with a countdown and week view, calculated locally (adhan-js), the Qibla bearing from true north,
and an estimated Hijri date. Location stays on the device (localStorage). Screens: Today, Week,
Qibla (static arrow; no compass sensors), Settings, About (freeappstore-online/platform#221).
Third-party licences are recorded in `LICENCES`.

- Live: https://prayercompass.freeappstore.online
- Dev: `pnpm install && pnpm dev`
- Build: `pnpm build`
- Test: `pnpm test` (vitest); e2e: `pnpm e2e` (Playwright, builds first)
- Check: `fas check` and `fas screencheck` (on Windows: `pnpm build` then `fas screencheck --skip-build`;
  the page never scrolls, each screen scrolls inside `.pc-page`)
- Deploy: `git push origin main` (auto-deploys to R2 via GitHub Actions)

## Notes

- Fonts are self-hosted (`@fontsource-variable/*`); the app makes no third-party requests
  beyond the platform API and analytics loader. Keep it that way.
- Location never leaves the device: no geocoding or other location APIs. City search uses the
  bundled list in `web/src/lib/cities.ts`.

Platform conventions: https://raw.githubusercontent.com/freeappstore-online/freeappstore/main/SKILLS.md
