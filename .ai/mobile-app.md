# Mobile App (root dir)

Expo 54 + expo-router 6 (file-based routing) + React Native 0.81 + React 19. Entry: `expo-router/entry` (see root `package.json` `main`). New Architecture enabled (`newArchEnabled: true` in `app.json`).

## Routing (`app/`)
File-based via expo-router. Root layout `app/_layout.tsx`. Tab group `app/(tabs)/` = bottom nav: `home`, `search`, `favorites`, `my-bookings`, `profile`.

Top-level screens (stack, outside tabs): `login`, `signup`, `enter-otp`, `onboarding`, `venue-detail`, `service-detail`, `booking-detail` / `service-booking-detail`, `booking-confirmed` / `service-booking-confirmed` / `pre-booking-confirmed`, `bookings`, `view-booking` / `view-service-booking`, `venue-reviews` / `service-reviews`, `write-review` / `write-service-review`, `service-listings`, `category-venues`, `subscription` / `my-subscription`, `notifications`, `settings`, `edit-profile`, `help`, `legal-content`. Plus `+not-found.tsx` and `+native-intent.tsx` (deep link intent handling, pairs with `lib/deepLink.ts`).

Two parallel booking domains mirrored at the route level: venue bookings vs service bookings — same pattern, separate files. Check which one applies before editing (`booking-*` = venue, `service-booking-*` = service marketplace).

## State
- **Zustand stores** (`store/`): `authStore.ts` (JWT/session, subscription info, deep-link consumption), `favoritesStore.ts`, `locationStore.ts`, `notificationStore.ts`, `reviewStore.ts`.
- **React Context** (`context/`): `AuthContext.tsx`, `FavoritesContext.tsx`, `ToastContext.tsx` — thin wrappers/providers around the zustand stores or independent UI-only state (verify per-file before assuming duplication).
- **TanStack Query** (`@tanstack/react-query`) also present in deps — used for server-state caching alongside zustand for client/session state.

## lib/ modules
- `api.ts` — axios instance, base URL from `EXPO_PUBLIC_API_URL` (default `http://localhost:3001`), auto-attaches JWT from AsyncStorage via request interceptor, exports typed functions (`fetchUser`, `getSubscriptionStatus`, etc.) wrapping backend endpoints from [api-routes.md](api-routes.md).
- `serviceApi.ts` — same pattern, scoped to `/api/service-*` endpoints.
- `reviewApi.ts` / `reviewSync.ts` — review CRUD + offline-sync reconciliation.
- `cloudinary.ts` — direct unsigned upload to Cloudinary from device (cloud `dxprjeaun`, preset `zvenue_unsigned`).
- `pricing.ts` / `timeSlots.ts` — session/hourly pricing math + slot availability logic for service bookings (has dedicated tests, see [testing.md](testing.md)).
- `deepLink.ts` — parses/queues deep links (`zvenue-app://` scheme, also `https://zvenue.pages.dev/` universal link origin per `app.json`), consumed by authStore after login.
- `notifications.ts` — expo-notifications push token registration, wired to backend `/api/push-token` + `/api/push/*`.
- `types.ts` — shared TS types mirroring backend DB shape (`DbUser`, `DbVenue`, `DbBooking`, etc.) — kept in sync manually with `admin/server/db/schema.js`, no codegen.
- `serviceTypes.ts` — same for service marketplace entities.
- `share.ts` — native share sheet helpers.
- `utils.ts` — misc helpers.

## Native config (`app.json`/`eas.json`)
- Bundle/package id: `com.zvenue.app` (iOS+Android). Scheme: `zvenue-app`.
- Firebase configs present (`GoogleService-Info.plist`, `google-services.json`) — push notifications likely route through FCM/APNs via expo-notifications.
- `usesCleartextTraffic: true` both platforms — HTTP (non-TLS) allowed, likely for local dev backend testing; verify disabled/irrelevant in production API (prod uses `https://www.zvenue.in`).
- EAS build profiles: `development` (dev client), `preview` (APK, points at prod API `https://www.zvenue.in`), `production` (app-bundle, API URL still placeholder `your-backend-domain.com` in `eas.json` — **flag if doing a real production build, this needs updating**).
- Razorpay live key embedded in `eas.json` preview profile (`rzp_live_...`) — committed in plaintext. Flag as a secrets-hygiene issue if asked about security.

## E2E coverage
50+ Maestro flows in `.maestro/` covering auth, onboarding, booking (venue+service), payments (Razorpay), reviews, favorites, notifications, deep links, permissions, navigation. See [testing.md](testing.md).
