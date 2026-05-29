# Design Document: Platform Infrastructure Upgrades

## Overview

This design covers six infrastructure improvements for the ZVenue platform. Each section is self-contained and can be implemented independently. The design prioritizes safe, incremental changes that don't break existing functionality.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile App (Expo)                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │  Sentry  │  │   Jest   │  │Deep Links │  │  Zustand     │  │
│  │   SDK    │  │  Tests   │  │  Handler  │  │  Stores      │  │
│  └──────────┘  └──────────┘  └───────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Fastify 5)                          │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────────────┐ │
│  │  Sentry  │  │  Redis   │  │  Rate Limiter (Redis-backed)  │ │
│  │  Plugin  │  │  Cache   │  └───────────────────────────────┘ │
│  └──────────┘  └──────────┘                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Neon PostgreSQL (with RLS Policies)                 │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐ │
│  │  Production DB   │  │  Staging Branch                      │ │
│  │  (RLS enabled)   │  │  (separate connection string)        │ │
│  └──────────────────┘  └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components and Interfaces

### Sentry Module (Mobile)

```typescript
// lib/sentry.ts
interface SentryConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  tracesSampleRate: number;
}

function initSentry(config: SentryConfig): void;
function setUserContext(userId: string | null): void;
```

### Sentry Plugin (Backend)

```javascript
// admin/server/lib/sentry.js
module.exports = {
  sentryPlugin: FastifyPluginAsync,  // Fastify plugin that registers error hooks
  captureException: (error, context?) => void,
  setUser: (userId: string | null) => void,
};
```

### Cache Layer

```javascript
// admin/server/lib/cache.js
module.exports = {
  cacheGet: (key: string) => Promise<any | null>,
  cacheSet: (key: string, data: any, ttlSeconds: number) => Promise<void>,
  invalidatePrefix: (prefix: string) => Promise<void>,
  invalidateKey: (key: string) => Promise<void>,
};
```

### Redis Client

```javascript
// admin/server/lib/redis.js
module.exports = {
  redis: IORedis,          // Redis client singleton
  isConnected: () => boolean,
};
```

### Deep Link Handler

```typescript
// lib/deepLink.ts
interface DeepLinkResult {
  route: string;
  requiresAuth: boolean;
}

function resolveDeepLink(url: string): DeepLinkResult;
function storePendingDeepLink(route: string): void;
function consumePendingDeepLink(): string | null;
```

### Share Helper

```typescript
// lib/share.ts
function getVenueShareUrl(id: string): string;
function getServiceShareUrl(id: string): string;
function getBookingShareUrl(id: string): string;
function shareUrl(url: string, title: string): Promise<void>;
```

### RLS Transaction Wrapper

```javascript
// admin/server/lib/rls.js
module.exports = {
  withUserContext: (userId: string, callback: (tx) => Promise<T>) => Promise<T>,
};
```

### Config Loader

```javascript
// admin/server/config/index.js
module.exports = {
  DATABASE_URL: string,
  REDIS_URL: string,
  SENTRY_DSN: string,
  CORS_ORIGINS: string[],
  NODE_ENV: 'development' | 'staging' | 'production',
};
```

---

## Data Models

This feature does not introduce new database tables. It modifies access control on existing tables via RLS policies and adds infrastructure services (Redis, Sentry) that operate alongside the existing data model.

### Existing Tables Affected by RLS

| Table | Primary Key | User FK Column | RLS Scope |
|-------|-------------|----------------|-----------|
| `users` | `id` | `id` (self) | Own row only |
| `bookings` | `id` | `user_id` | Own rows only |
| `service_bookings` | `id` | `user_id` | Own rows only |
| `notifications` | `id` | `user_id` | Own rows only |
| `service_favorites` | `id` | `user_id` | Own rows only |

### Redis Cache Key Schema

| Key Pattern | Data Type | TTL | Description |
|-------------|-----------|-----|-------------|
| `venues:list:{city}` | JSON array | 5 min | Venue listings by city |
| `venues:detail:{id}` | JSON object | 5 min | Single venue detail |
| `categories:all` | JSON array | 10 min | All venue categories |
| `svc-categories:all` | JSON array | 10 min | All service categories |
| `search:{hash}` | JSON array | 3 min | Search results (hash of query+filters) |

### Configuration Model

```javascript
// Environment config shape
{
  DATABASE_URL: string,       // Neon connection string
  REDIS_URL: string,          // Redis connection string
  SENTRY_DSN: string,         // Sentry project DSN
  CORS_ORIGINS: string[],     // Allowed CORS origins
  RATE_LIMIT_MAX: number,     // Max requests per window
  RATE_LIMIT_WINDOW: string,  // Time window (e.g., "1 minute")
}
```

---

## Section 1: Error Monitoring (Sentry)

### Technical Approach

**Mobile (expo-sentry):**
- Install `@sentry/react-native` and the Sentry Expo plugin
- Initialize in `app/_layout.tsx` before any other code
- Wrap the navigation with Sentry's routing instrumentation
- Configure source map uploads via the `expo-sentry` plugin in `app.json`

**Backend (fastify-sentry):**
- Install `@sentry/node`
- Create a Fastify plugin that initializes Sentry and registers error hooks
- Use `onError` hook to capture 5xx errors with request context
- Attach user ID from JWT to Sentry scope on authenticated requests

### Key Decisions

- Use `@sentry/react-native` (not `sentry-expo` which is deprecated)
- Backend: custom Fastify plugin pattern (no official `@sentry/fastify` for v5)
- Source maps uploaded during EAS build via plugin config, not CI separately
- Graceful degradation: if Sentry DSN is missing, skip initialization silently

### Files to Create/Modify

| File | Action |
|------|--------|
| `app/_layout.tsx` | Modify — add Sentry.init() at top |
| `lib/sentry.ts` | Create — Sentry config helper for mobile |
| `app.json` | Modify — add sentry-expo plugin |
| `admin/server/lib/sentry.js` | Create — Sentry init + Fastify plugin |
| `admin/server/index.js` | Modify — register Sentry plugin |
| `.env` / `.env.example` | Modify — add SENTRY_DSN vars |

---

## Section 2: Mobile Unit Tests (Jest)

### Technical Approach

- Install `jest-expo` preset (official Expo Jest config)
- Install `@testing-library/react-native` for component testing (optional, focus on logic)
- Create `jest.config.js` with `jest-expo` preset
- Create mock files for React Native modules, AsyncStorage, and expo modules
- Write tests for: `store/authStore.ts`, `lib/api.ts`, `lib/serviceApi.ts`

### Key Decisions

- Use `jest-expo` preset (handles RN transforms, module resolution)
- Mock `axios` at module level for API tests (no real network calls)
- Mock `AsyncStorage` with a simple in-memory Map implementation
- Test store logic by calling actions and asserting state changes
- Update existing `"test"` script to `jest --run` (remove `--watchAll` for CI)

### Files to Create/Modify

| File | Action |
|------|--------|
| `jest.config.js` | Create — Jest configuration |
| `__mocks__/@react-native-async-storage/async-storage.ts` | Create — AsyncStorage mock |
| `__mocks__/axios.ts` | Create — Axios mock |
| `__tests__/store/authStore.test.ts` | Create — Auth store tests |
| `__tests__/lib/api.test.ts` | Create — API client tests |
| `__tests__/lib/serviceApi.test.ts` | Create — Service API tests |
| `package.json` | Modify — add jest devDependencies, update test script |

### Test Strategy

**Auth Store Tests:**
- `login()` → sets isSignedIn, userId, dbUser; persists token
- `signOut()` → clears state; removes token from storage
- `initialize()` with stored token → restores session via /api/auth/me
- `initialize()` with no token → stays unauthenticated
- `initialize()` with expired/invalid token → clears state

**API Client Tests:**
- Verify Authorization header is attached when token exists
- Verify correct URL construction for each endpoint
- Verify error propagation on network failure
- Verify response data is returned correctly

---

## Section 3: Redis Caching

### Technical Approach

- Install `ioredis` package on the backend
- Create a `lib/cache.js` module that exports cache helpers (get, set, invalidate)
- Implement cache-aside pattern: check cache → miss → query DB → store in cache → return
- Use key prefixes: `venues:`, `categories:`, `service-categories:`, `search:`
- Cache invalidation: on mutation routes, call `invalidatePrefix('venues:')` etc.
- Rate limiting: pass Redis client to `@fastify/rate-limit` via `redis` option

### Key Decisions

- Use `ioredis` (mature, supports clusters, Sentinel, pipelines)
- Cache TTLs: venues 5min, categories 10min (rarely change), search 3min
- Key structure: `venues:list:{city}:{page}`, `search:{hash(query+filters)}`
- Invalidation strategy: prefix-based `SCAN` + `DEL` (simple, safe for this scale)
- Fallback: if Redis unavailable, bypass cache and query DB directly (log warning)
- Rate limit fallback: in-memory if Redis connection fails

### Files to Create/Modify

| File | Action |
|------|--------|
| `admin/server/lib/redis.js` | Create — Redis client singleton |
| `admin/server/lib/cache.js` | Create — Cache helpers (get/set/invalidate) |
| `admin/server/index.js` | Modify — wrap venue/category/search routes with cache |
| `admin/server/index.js` | Modify — update rate-limit config to use Redis store |
| `admin/server/package.json` | Modify — add ioredis dependency |
| `admin/server/.env.example` | Modify — add REDIS_URL |
| `docker-compose.yml` | Modify — add Redis service for local dev |

### Cache Flow

```
Request → Check Redis → HIT → Return cached data
                      → MISS → Query DB → Store in Redis (with TTL) → Return data

Mutation → Execute DB write → Invalidate related cache keys
```

---

## Section 4: Deep Linking

### Technical Approach

- The app already has `scheme: "zvenue-app"` and `expo-linking` installed
- Replace the stub in `app/+native-intent.tsx` with actual route resolution
- Map URL paths to expo-router routes:
  - `zvenue-app://venue/{id}` → `/venue-detail?id={id}`
  - `zvenue-app://service/{id}` → `/service-detail?id={id}`
  - `zvenue-app://booking/{id}` → `/view-booking?id={id}`
- Handle auth guard: if not authenticated, store pending deep link and redirect to login
- After login, check for pending deep link and navigate

### Key Decisions

- Keep existing scheme `zvenue-app` (already registered, Maestro tests use it)
- Use expo-router's `+native-intent.tsx` for URL → route mapping (official pattern)
- Store pending deep link in Zustand (not AsyncStorage — ephemeral, session-only)
- Universal links: configure `apple-app-site-association` and `assetlinks.json` on `zvenue.pages.dev`
- Share URLs: create a `lib/share.ts` helper that generates shareable deep link URLs

### Files to Create/Modify

| File | Action |
|------|--------|
| `app/+native-intent.tsx` | Modify — implement route resolution logic |
| `lib/deepLink.ts` | Create — deep link parsing + pending link store |
| `lib/share.ts` | Create — generate shareable URLs |
| `store/authStore.ts` | Modify — check pending deep link after login |
| `app.json` | Verify — scheme and universal link config |

### URL Mapping

| Deep Link URL | App Route | Screen |
|---------------|-----------|--------|
| `zvenue-app://venue/{id}` | `/venue-detail?id={id}` | Venue Detail |
| `zvenue-app://service/{id}` | `/service-detail?id={id}` | Service Detail |
| `zvenue-app://booking/{id}` | `/view-booking?id={id}` | Booking Detail |
| `zvenue-app://service-booking/{id}` | `/view-service-booking?id={id}` | Service Booking |

---

## Section 5: Row Level Security (RLS)

### Technical Approach

- Create a new Drizzle migration (`0006_row_level_security.sql`) with raw SQL
- Enable RLS on target tables: `users`, `bookings`, `service_bookings`, `notifications`, `service_favorites`
- Create two PostgreSQL roles:
  - `app_user` — used when executing queries on behalf of an authenticated user
  - `service_role` — used by the backend for admin/system operations (bypasses RLS)
- Set `current_setting('app.current_user_id')` before each user-scoped query
- The backend sets this via `SET LOCAL` in a transaction wrapper

### Key Decisions

- Use `SET LOCAL app.current_user_id` (transaction-scoped, safe for connection pooling)
- Backend service role bypasses RLS for admin operations (owner management, notifications)
- RLS policies use `current_setting('app.current_user_id', true)` with `true` for missing_ok
- Implement as a Fastify `preHandler` hook that wraps authenticated routes in a transaction
- Tables NOT getting RLS: `venues`, `categories`, `service_categories`, `service_listings` (public read)
- `reviews` and `service_reviews` are publicly readable but only writable by the author

### Files to Create/Modify

| File | Action |
|------|--------|
| `admin/server/drizzle/0006_row_level_security.sql` | Create — RLS migration |
| `admin/server/lib/rls.js` | Create — transaction wrapper that sets user context |
| `admin/server/index.js` | Modify — use RLS wrapper on authenticated routes |
| `admin/server/db/index.js` | Modify — support dual-role connections |

### RLS Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| users | own row | — | own row | — |
| bookings | own rows | own rows | — | — |
| service_bookings | own rows | own rows | — | — |
| notifications | own rows | — | own rows (mark read) | — |
| service_favorites | own rows | own rows | — | own rows |

---

## Section 6: Staging Environment

### Technical Approach

- Create a Neon database branch named `staging` from the `main` branch
- Create environment-specific config: `admin/server/config/{development,staging,production}.js`
- Each config exports: DATABASE_URL, REDIS_URL, SENTRY_DSN, CORS origins, etc.
- Update `index.js` to load config based on `NODE_ENV`
- Update GitHub Actions CI to:
  1. Run tests
  2. Deploy to staging
  3. Run health check against staging
  4. Deploy to production (manual approval or auto after health check)

### Key Decisions

- Use Neon branching (free tier supports branches, instant creation)
- Config files (not just env vars) for structured, validated configuration
- Staging uses same Docker image as production (parity)
- Health check: `GET /health` must return 200 with `status: "ok"`
- Seed data: create a `seed-staging.js` script with representative test data
- CI deployment target: same hosting as production (assumed Render/Railway/Fly)

### Files to Create/Modify

| File | Action |
|------|--------|
| `admin/server/config/development.js` | Create — dev config |
| `admin/server/config/staging.js` | Create — staging config |
| `admin/server/config/production.js` | Create — production config |
| `admin/server/config/index.js` | Create — config loader |
| `admin/server/index.js` | Modify — use config loader |
| `admin/server/seed-staging.js` | Create — staging seed data |
| `.github/workflows/ci.yml` | Modify — add staging deploy + health check |
| `.github/workflows/deploy.yml` | Create — deployment workflow |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Deep link route resolution

*For any* valid deep link URL with a known resource type (venue, service, booking, service-booking) and any valid ID string, the Deep_Link_Handler SHALL produce the correct app route matching the pattern `/{screen}?id={id}` corresponding to that resource type.

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 2: Deep link auth guard stores and redirects

*For any* deep link URL received while the user is not authenticated, the Deep_Link_Handler SHALL store the target route and return a redirect to the login screen, and after successful authentication the stored route SHALL be consumable exactly once.

**Validates: Requirements 10.5**

### Property 3: Cache key determinism

*For any* set of search parameters (query string, city, and filter values), the cache key generation function SHALL always produce the same key for the same input parameters, and different parameters SHALL produce different keys.

**Validates: Requirements 7.1**

### Property 4: Cache-aside correctness

*For any* cacheable GET request, if a valid cache entry exists for the computed key then the cached data SHALL be returned without querying the database; if no cache entry exists then the database SHALL be queried, the result stored in Redis with the correct TTL, and the data returned to the caller.

**Validates: Requirements 6.1, 6.2**

### Property 5: Cache invalidation on mutation

*For any* mutation (create, update, or delete) on a venue or category, all cache entries with the corresponding prefix SHALL be deleted, ensuring subsequent reads fetch fresh data from the database.

**Validates: Requirements 6.5, 7.4**

---

## Error Handling

### Sentry SDK Failures

| Scenario | Behavior |
|----------|----------|
| Missing or invalid DSN | Skip Sentry initialization, log warning, app continues normally |
| Sentry network timeout | Events queued locally, retried automatically by SDK |
| Sentry SDK throws during init | Catch error, log warning, app continues without monitoring |

### Redis Connection Failures

| Scenario | Behavior |
|----------|----------|
| Redis unavailable on startup | Log warning, all cache operations become no-ops (bypass to DB) |
| Redis connection drops mid-operation | `cacheGet` returns `null` (cache miss), `cacheSet` silently fails |
| Redis timeout on read | Return `null`, proceed with DB query |
| Rate limiter Redis unavailable | Fall back to in-memory rate limiting |

### Deep Link Errors

| Scenario | Behavior |
|----------|----------|
| Unrecognized URL path | Navigate to home screen (`/`) |
| Invalid or non-existent resource ID | Display error toast, navigate to home screen |
| Deep link while unauthenticated | Store pending route, redirect to login |
| Pending deep link timeout (30s) | Clear stored route, no navigation after login |

### RLS Errors

| Scenario | Behavior |
|----------|----------|
| `SET LOCAL` fails in transaction | Log error, continue without RLS (graceful degradation) |
| User context not set for authenticated route | Query returns zero rows (RLS denies access) |
| Service role connection fails | Fall back to user-scoped connection, log critical error |

### Configuration Errors

| Scenario | Behavior |
|----------|----------|
| Unknown `NODE_ENV` value | Default to `development` config, log warning |
| Missing required config value | Throw on startup with descriptive error message |
| Invalid config value type | Throw on startup with validation error |

### Jest Test Failures

| Scenario | Behavior |
|----------|----------|
| Mock module not found | Jest reports clear error with module path |
| Test timeout | Default 5s timeout, configurable per test |
| Async test unhandled rejection | Test fails with rejection reason |

---

## Testing Strategy

### Dual Testing Approach

- **Unit tests**: Verify specific examples, edge cases, and error conditions (Jest for mobile, existing test framework for backend)
- **Property tests**: Verify universal properties across generated inputs using `fast-check` for the deep link handler and cache modules
- **Integration tests**: Verify RLS policies, Redis caching, and Sentry integration against real services
- **E2E tests**: Maestro flows for deep linking on device

### Property-Based Testing Configuration

- Library: `fast-check` (TypeScript/JavaScript)
- Minimum iterations: 100 per property
- Tag format: **Feature: platform-infrastructure-upgrades, Property {number}: {property_text}**
- Properties 1-2 test the deep link resolution module (`lib/deepLink.ts`)
- Properties 3-5 test the cache module (`admin/server/lib/cache.js`)

### Test Coverage by Area

| Area | Test Type | Approach |
|------|-----------|----------|
| Sentry (Mobile) | Manual | Trigger error, verify in Sentry dashboard |
| Sentry (Backend) | Integration | Call endpoint that throws, verify Sentry event |
| Jest Tests | Unit | Automated via `npm test` in CI |
| Redis Cache | Property + Integration | Property tests for cache logic, integration for Redis |
| Deep Linking | Property + E2E | Property tests for route resolution, Maestro for on-device |
| RLS | Integration | SQL-level tests verifying policy enforcement |
| Staging | Smoke | Health check endpoint after deployment |

---

## Risk Mitigation

1. **Sentry**: Graceful fallback if DSN missing — no app crashes from monitoring code
2. **Jest**: Isolated from production code — only devDependencies, no runtime impact
3. **Redis**: Fallback to direct DB queries if Redis unavailable — no downtime
4. **Deep Links**: Fallback to home screen for unrecognized paths — no crashes
5. **RLS**: Service role bypass ensures backend admin operations continue working
6. **Staging**: Production deployment gated by staging health check — prevents bad deploys
