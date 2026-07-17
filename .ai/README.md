# .ai Registry — ZVenue

Machine-readable-ish map of this repo for AI agents. Read this first. Then jump to detail file needed.

## Repo shape (3 apps, 1 repo, no monorepo tool)

| Part | Path | Stack | Purpose |
|---|---|---|---|
| Mobile app | `/` (root) | Expo 54 / React Native 0.81 / expo-router 6 | Customer-facing venue+service booking app |
| Admin dashboard | `admin/` | React 19 / Vite 8 / TanStack Router+Query+Table / Tailwind 4 / ShadcnUI | Owner + admin web portal |
| Backend API | `admin/server/` | Fastify 5 / Node / Drizzle ORM / PostgreSQL (Neon) | Single API serving both mobile app and admin dashboard |

Root `package.json` name is `expo-app` (mobile). No workspaces/turborepo — `admin/` and `admin/server/` each have own `package.json`, installed independently.

## Detail files
- [architecture.md](architecture.md) — how 3 parts connect, auth model, request flow
- [api-routes.md](api-routes.md) — full Fastify route inventory (`admin/server/index.js`)
- [data-model.md](data-model.md) — Drizzle schema, all tables/relations
- [mobile-app.md](mobile-app.md) — expo-router screens, state, lib modules
- [admin-dashboard.md](admin-dashboard.md) — admin routes/features
- [testing.md](testing.md) — Jest, Vitest, Maestro E2E
- [deployment.md](deployment.md) — Render, EAS, Docker, env vars

## Fast facts an agent should not re-derive
- Backend is **one monolithic file**: `admin/server/index.js` (~5050 lines). All routes registered inline on `fastify` — no route-file splitting, no controllers dir. Grep it, don't assume modular structure.
- DB schema: single file `admin/server/db/schema.js` (~360 lines), Drizzle ORM, PostgreSQL via Neon serverless driver.
- Three separate auth realms: end-user (`users` table, phone+OTP or password), venue `owners` table, and admin (hardcoded/seeded via `admin/server/create-admin.js`). JWT via `@fastify/jwt`; role-gating via `fastify.authenticate` / `authenticateAdmin` / `authenticateOwner` / `authenticateAdminOrOwner` decorators (index.js:87-130).
- Payments: Razorpay (orders, subscriptions, webhooks) — mobile app booking flow and admin subscription flow both hit `/api/bookings/*`, `/api/service-bookings/*`, `/api/subscriptions/*`.
- Two booking domains exist in parallel: **venue bookings** (`bookings` table) and **service bookings** (`service_bookings` table, separate marketplace for hourly/session services) — mirrored routes, mirrored review systems, mirrored favorites.
- Mobile app talks to backend via `EXPO_PUBLIC_API_URL` (see `lib/api.ts`); admin via `VITE_API_URL` (see `admin/src/lib/api.ts`).
- Image uploads: Cloudinary (unsigned preset `zvenue_unsigned`, cloud `dxprjeaun`) — both mobile (`lib/cloudinary.ts`) and admin (`admin/src/lib/cloudinary.ts`).
- Location: `expo-location` + Nominatim/Mappls geocoding on admin side (`admin/src/lib/mappls.ts`, `nominatim.ts`); backend also has `admin/server/lib/geocode.js` + `/api/geocode/*` routes.
- E2E via Maestro (`.maestro/*.yaml`, 50+ flows) — targets mobile app only.
- CI (`.github/workflows/ci.yml`) only builds/typechecks `admin/`. Mobile app and server have no CI job currently.
- Stray root-level scripts (`fix-ts.js`, `fix-ts2.js`, `test-ngrok.js`) are one-off dev utilities, not part of build.
- `build-1780463252113.apk` (87MB) is a committed build artifact sitting in repo root — flag if asked about repo bloat.
- `.kiro/specs/*` directories were deleted in working tree at last snapshot (git status shows D) — historical spec docs for features (map location picker, review system, service categories, session pricing, venue pre-booking etc.) may still be recoverable via `git show HEAD:.kiro/specs/...` if needed for context on why a feature exists.
