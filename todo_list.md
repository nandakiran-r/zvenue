# ZVenue — Infrastructure TODO List

Items to implement before production launch. Skipped for now during active development.

---

## 1. Error Monitoring (Sentry)
**Priority:** Before production launch
**Cost:** Free tier (5K errors/month) or self-host GlitchTip
**Why:** Catches crashes, API failures, and JS exceptions in production. Without it, you won't know when users hit bugs unless they report them.
**Effort:** ~30 minutes
**What to do:**
- Create Sentry account → get DSN for React Native + Node.js projects
- Install `@sentry/react-native` in mobile app
- Install `@sentry/node` in backend
- Initialize in `app/_layout.tsx` and `admin/server/index.js`
- Upload source maps during EAS builds

---

## 2. Redis Caching
**Priority:** When response times matter (100+ concurrent users)
**Cost:** Free locally (Docker), Upstash free tier (10K commands/day), or ~$5/month hosted
**Why:** Caches venue listings, categories, and search results. Reduces DB load and speeds up responses from ~200ms to ~5ms for cached data.
**Effort:** ~2 hours
**What to do:**
- Install `ioredis` in backend
- Create `lib/redis.js` (client) and `lib/cache.js` (helpers)
- Wrap GET /api/venues, /api/categories, /api/search with cache
- Add cache invalidation on mutations
- Migrate rate limiting from in-memory to Redis
- Add Redis to `docker-compose.yml` for local dev

---

## 3. Row Level Security (RLS)
**Priority:** When handling sensitive data at scale or with multiple developers
**Cost:** Free (SQL policies on existing Neon DB)
**Why:** Database-level access control. Even if API code has a bug, users can't see each other's data. Defense-in-depth beyond API middleware.
**Effort:** ~3 hours
**What to do:**
- Create migration `0006_row_level_security.sql`
- Enable RLS on: users, bookings, service_bookings, notifications, service_favorites
- Create policies: users can only SELECT/UPDATE their own rows
- Create service role bypass for admin operations
- Create `lib/rls.js` transaction wrapper that sets user context
- Wrap authenticated routes with `withUserContext()`

---

## 4. Staging Environment
**Priority:** Before first production deployment
**Cost:** Free (Neon branching is free tier)
**Why:** Lets you test migrations and changes against a copy of your DB without risking production data. CI/CD can deploy to staging first, verify health, then promote to production.
**Effort:** ~1 hour
**What to do:**
- Create Neon staging branch from main
- Create `admin/server/config/` with environment-specific configs (dev/staging/prod)
- Update `index.js` to load config based on `NODE_ENV`
- Create `seed-staging.js` with test data
- Update GitHub Actions to deploy staging → health check → production

---

## Already Completed ✅

- [x] Jest testing framework (27 unit tests passing)
- [x] Deep linking (route resolution, auth guard, share buttons)
- [x] Service calendar booking system
- [x] Subscription management (My Subscription page, signup prompt)
- [x] Mark all notifications read (backend endpoint)
- [x] Consistent toggle UI across tabs

---

## Recommended Order for Implementation

1. **Staging environment** — Do this first, before any production deploy
2. **Error monitoring** — Add right before going live with real users
3. **Redis caching** — Add when you notice slow responses under load
4. **RLS policies** — Add when team grows or handling compliance requirements
