# Admin Dashboard (`admin/`)

React 19 + Vite 8 + TanStack Router/Query/Table + Tailwind 4 + ShadcnUI (Radix primitives) + Zustand 5 + React Hook Form + Zod. Serves both **admin** and **venue/service owner** roles from one SPA (role-gated at route/feature level).

## Routing (`admin/src/routes/`, TanStack Router file-based)
- `(auth)/` — `sign-in`, `sign-in-2` (alt variant, check which is live), `sign-up`, `forgot-password`, `otp`.
- `_authenticated/` — gated shell (`route.tsx` likely does auth check + redirect), `index.tsx` = dashboard home.
- `(errors)/` — 401, 403, 404, 500, 503 static pages.
- `__root.tsx` — root layout (providers, theming, RTL support per README).

## Features (`admin/src/features/`) — one dir per domain
`analytics`, `dashboard`, `venues`, `bookings-management`, `categories`, `service-categories`, `service-listings`, `service-bookings`, `service-reviews`, `reviews`, `owners`, `owner-portal` (owner-specific views, distinct from admin `owners` management), `users`, `subscribers`, `support`, `notifications-management`, `app-content` (legal/help content mgmt), `help-center`, `settings`, `auth`, `errors`.

Mirrors the two-domain split from the backend: venue-side (`venues`, `bookings-management`, `categories`, `reviews`) vs service-marketplace-side (`service-*`) are separate feature folders, not shared components — check the right one before editing.

## lib/ (`admin/src/lib/`)
- `api.ts` — axios client, base URL `VITE_API_URL`.
- `cloudinary.ts` — same unsigned-upload pattern as mobile.
- `cookies.ts` — has a test file (`cookies.test.ts`) — likely used for session/token persistence in browser (vs AsyncStorage on mobile).
- `mappls.ts` / `nominatim.ts` — two different geocoding providers used client-side (map picker for venue location, likely `VenueMap.tsx`-equivalent).
- `handle-server-error.ts` — centralized API error → toast/UI mapping, has tests.
- `show-submitted-data.tsx` — dev/debug helper for form submission preview.

## Testing
Vitest (browser mode via Playwright, not jsdom) — `npm run test` runs `vitest run --browser.headless`. Coverage via `@vitest/coverage-v8`. Also `knip` configured for dead-code/unused-export detection (`npm run knip`).

## Build/Lint
`vite build` → `dist/`. ESLint 10 (flat config) + Prettier w/ `@trivago/prettier-plugin-sort-imports` + `prettier-plugin-tailwindcss` (class sorting). CI (`.github/workflows/ci.yml`) runs `tsc --noEmit` (non-blocking, `|| true`) and a build job uploading `admin/dist` as artifact — **CI does not run admin's own test suite or lint**, only typecheck+build. Flag if asked to harden CI.

## Backend server (`admin/server/`)
See [architecture.md](architecture.md) and [api-routes.md](api-routes.md). Dev: `cd admin/server && npm run dev` (or `admin`'s `npm run dev:server` shortcut). One-off scripts at `admin/server/` root worth knowing about: `create-admin.js` (seed admin credentials), `backup-db.js`, `seed-demo-venues.js`, `seed-test-user.js`, `migrate-registration-fees.js`, `check_db.js`/`fix_db.js`, `query-users.js` — these are manual ops tools, not part of the app runtime or CI.
