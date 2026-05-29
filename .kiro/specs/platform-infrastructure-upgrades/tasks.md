# Implementation Plan: Platform Infrastructure Upgrades

## Overview

This plan implements six infrastructure improvements for the ZVenue platform: Sentry error monitoring (mobile + backend), Jest unit testing framework, Redis caching layer, deep linking route resolution, PostgreSQL Row Level Security policies, and a staging environment with CI/CD gating. Tasks are organized in dependency waves — earlier waves must complete before later ones can begin, though tasks within the same wave can be parallelized.

## Tasks

- [ ] 1. Install and configure Sentry for mobile app
  - Install `@sentry/react-native` in the mobile app root
  - Add `@sentry/react-native` to the plugins array in `app.json`
  - Add `EXPO_PUBLIC_SENTRY_DSN` to `.env` and `.env.example`
  - Create `lib/sentry.ts` with Sentry.init() configuration
  - Import and call init at the top of `app/_layout.tsx` (before component)
  - Configure: DSN from env, environment tag, tracesSampleRate
  - Set user context (Sentry.setUser) when auth state changes
  - Wrap navigation with Sentry routing instrumentation
  - Verify the app still builds without errors

- [ ] 2. Install and configure Sentry for backend
  - Install `@sentry/node` in `admin/server/`
  - Create `admin/server/lib/sentry.js` with init function and Fastify plugin
  - Register the Sentry plugin in `admin/server/index.js`
  - Add `SENTRY_DSN` to `admin/server/.env.example`
  - Hook into `onError` to capture 5xx errors with request context
  - Attach user ID from JWT to Sentry scope on authenticated requests
  - Ensure graceful fallback if DSN is not configured

- [x] 3. Set up Jest testing framework for mobile app
  - Install devDependencies: `jest-expo`, `@types/jest`, `ts-jest`
  - Create `jest.config.js` with `jest-expo` preset
  - Update `package.json` test script to `jest` (remove `--watchAll`)
  - Add `"test:watch": "jest --watchAll"` as separate script
  - Create `__mocks__/@react-native-async-storage/async-storage.ts` mock
  - Create `__mocks__/axios.ts` mock with jest.fn() implementations
  - Verify `npx jest --passWithNoTests` runs successfully

- [x] 4. Write auth store unit tests
  - Create `__tests__/store/authStore.test.ts`
  - Test: `login()` sets isSignedIn, userId, dbUser and persists token
  - Test: `signOut()` clears state and removes token from AsyncStorage
  - Test: `initialize()` with stored token restores session
  - Test: `initialize()` with no stored token stays unauthenticated
  - Test: `initialize()` with invalid token clears state gracefully
  - Run tests and verify all pass

- [x] 5. Write API client unit tests
  - Create `__tests__/lib/api.test.ts`
  - Test: Authorization header is attached when token exists in storage
  - Test: `fetchCategories()` calls correct endpoint and returns data
  - Test: `fetchVenues()` constructs query params correctly
  - Test: `fetchVenueById()` returns null on error
  - Test: `createBooking()` sends correct POST body
  - Run tests and verify all pass

- [x] 6. Write service API unit tests
  - Create `__tests__/lib/serviceApi.test.ts`
  - Test: `fetchServiceCategories()` calls correct endpoint
  - Test: `fetchServiceListings()` passes filter params
  - Test: `searchAll()` constructs query with type param
  - Test: `addServiceFavorite()` sends correct POST body
  - Test: `cancelServiceBooking()` sends reason in body
  - Run tests and verify all pass

- [ ] 7. Set up Redis client and connection
  - Install `ioredis` in `admin/server/`
  - Create `admin/server/lib/redis.js` with Redis client singleton
  - Add `REDIS_URL` to `admin/server/.env.example`
  - Handle connection errors gracefully (log warning, don't crash)
  - Add Redis service to `docker-compose.yml` for local development
  - Verify Redis client connects successfully in dev

- [ ] 8. Create cache helper module
  - Create `admin/server/lib/cache.js` with functions:
    - `cacheGet(key)` — returns parsed JSON or null
    - `cacheSet(key, data, ttlSeconds)` — stores JSON with TTL
    - `invalidatePrefix(prefix)` — SCAN + DEL keys matching prefix
    - `invalidateKey(key)` — delete single key
  - All functions gracefully handle Redis unavailability (return null / no-op)
  - Add unit-style test in `admin/server/tests/cache.test.js`

- [ ] 9. Add caching to venue and category endpoints
  - Wrap `GET /api/venues` with cache (key: `venues:list:{city}`, TTL: 5min)
  - Wrap `GET /api/venues/:id` with cache (key: `venues:detail:{id}`, TTL: 5min)
  - Wrap `GET /api/categories` with cache (key: `categories:all`, TTL: 10min)
  - Wrap `GET /api/service-categories` with cache (key: `svc-categories:all`, TTL: 10min)
  - Add cache invalidation to venue create/update/delete routes
  - Add cache invalidation to category create/update/delete routes
  - Verify endpoints still return correct data

- [ ] 10. Add caching to search endpoint
  - Wrap `GET /api/search` with cache (key: `search:{hash}`, TTL: 3min)
  - Generate cache key from query string + city + type params
  - Add cache invalidation for search keys on venue/service mutations
  - Verify search results are correct after cache hit

- [ ] 11. Migrate rate limiting to Redis
  - Update `@fastify/rate-limit` config to use Redis store via ioredis client
  - Configure fallback to in-memory if Redis is unavailable
  - Verify rate limiting still works (existing test in `api.test.js`)
  - Verify 429 response includes Retry-After header

- [x] 12. Implement deep link route resolution
  - Replace stub in `app/+native-intent.tsx` with URL parsing logic
  - Map `zvenue-app://venue/{id}` → `/venue-detail?id={id}`
  - Map `zvenue-app://service/{id}` → `/service-detail?id={id}`
  - Map `zvenue-app://booking/{id}` → `/view-booking?id={id}`
  - Map `zvenue-app://service-booking/{id}` → `/view-service-booking?id={id}`
  - Return `/` for unrecognized paths (safe fallback)

- [x] 13. Add authentication guard for deep links
  - Create `lib/deepLink.ts` with pending deep link storage (Zustand atom or module-level variable)
  - In `+native-intent.tsx`: if user not authenticated, store target path and return `/login`
  - In `store/authStore.ts`: after successful login, check for pending deep link and navigate
  - Clear pending deep link after navigation or after timeout (30s)

- [x] 14. Create share URL helper and integrate
  - Create `lib/share.ts` with functions:
    - `getVenueShareUrl(id)` → returns `zvenue-app://venue/{id}`
    - `getServiceShareUrl(id)` → returns `zvenue-app://service/{id}`
    - `getBookingShareUrl(id)` → returns `zvenue-app://booking/{id}`
  - Integrate with React Native Share API for venue/service detail screens
  - Add share button to venue-detail and service-detail screens
  - Update `.maestro/deep_link_test.yaml` with route-specific tests

- [ ] 15. Create RLS migration file
  - Create `admin/server/drizzle/0006_row_level_security.sql`
  - Enable RLS on: `users`, `bookings`, `service_bookings`, `notifications`, `service_favorites`
  - Create policies for `users`: SELECT/UPDATE own row only
  - Create policies for `bookings`: SELECT own rows only
  - Create policies for `service_bookings`: SELECT own rows only
  - Create policies for `notifications`: SELECT/UPDATE own rows only
  - Create policies for `service_favorites`: SELECT/INSERT/DELETE own rows only
  - Create service role bypass policy for each table
  - Use `current_setting('app.current_user_id', true)` in policy conditions

- [ ] 16. Create RLS transaction wrapper
  - Create `admin/server/lib/rls.js` with helper function
  - Function: `withUserContext(userId, callback)` — wraps DB operations in transaction
  - Sets `SET LOCAL app.current_user_id = '{userId}'` at start of transaction
  - Resets setting at end of transaction
  - Handle errors: if SET fails, log and continue without RLS (graceful degradation)

- [ ] 17. Integrate RLS wrapper with authenticated routes
  - Identify all routes that query user-specific data (bookings, notifications, favorites)
  - Wrap their DB queries with `withUserContext(request.user.id, ...)`
  - Ensure admin/owner routes use service role (no user context set)
  - Test: authenticated user can only see their own data
  - Test: admin operations still work without restriction

- [ ] 18. Test RLS policies
  - Add RLS-specific tests to `admin/server/tests/api.test.js`
  - Test: user A cannot see user B's bookings
  - Test: user can see their own notifications
  - Test: service role can access all data
  - Run existing API tests to verify no regressions

- [ ] 19. Create environment configuration system
  - Create `admin/server/config/index.js` — config loader based on NODE_ENV
  - Create `admin/server/config/development.js` — local dev settings
  - Create `admin/server/config/staging.js` — staging settings (placeholder values)
  - Create `admin/server/config/production.js` — production settings (from env vars)
  - Update `admin/server/index.js` to use config loader for DB URL, CORS, etc.
  - Verify server starts correctly with `NODE_ENV=development`

- [ ] 20. Set up staging environment and CI/CD pipeline
  - Document steps to create Neon staging branch (in README or setup script)
  - Create `admin/server/scripts/setup-staging.sh` with neonctl commands
  - Create `admin/server/seed-staging.js` with representative test data
  - Update `.github/workflows/ci.yml` to add staging deploy job
  - Add health check step: `curl` staging `/health` endpoint
  - Gate production deployment on staging health check success
  - Add `NODE_ENV` and staging secrets to GitHub repository settings docs

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "description": "Foundation — independent setup tasks with no cross-dependencies",
      "tasks": [1, 2, 3, 7, 19]
    },
    {
      "wave": 2,
      "description": "Core logic — depends on foundation setup from wave 1",
      "tasks": [4, 5, 6, 8, 12, 15, 16]
    },
    {
      "wave": 3,
      "description": "Integration — connects core modules together",
      "tasks": [9, 10, 11, 13, 14, 17]
    },
    {
      "wave": 4,
      "description": "Validation and deployment — tests and staging pipeline",
      "tasks": [18, 20]
    }
  ]
}
```

## Notes

- **Parallelism**: Tasks within the same wave can be worked on in parallel. The six infrastructure areas (Sentry, Jest, Redis, Deep Linking, RLS, Staging) are largely independent of each other.
- **Redis dependency**: Tasks 9, 10, and 11 all depend on task 7 (Redis client) and task 8 (cache helpers) being complete.
- **Jest dependency**: Tasks 4, 5, and 6 depend on task 3 (Jest framework setup).
- **RLS dependency**: Task 17 depends on both task 15 (migration) and task 16 (wrapper). Task 18 depends on task 17.
- **Deep linking**: Task 13 depends on task 12 (route resolution). Task 14 depends on task 13.
- **Staging**: Task 20 depends on task 19 (config system) being in place.
- **Risk order**: Consider implementing Sentry first (tasks 1-2) for observability during subsequent changes.
- **Rollback**: Each phase is independently deployable and reversible. RLS policies can be disabled with `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` if issues arise.
