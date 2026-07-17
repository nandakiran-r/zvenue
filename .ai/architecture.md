# Architecture

## Three deployables, one Fastify backend

```
Mobile app (Expo/RN, root dir)  ──┐
                                   ├──► admin/server (Fastify, single index.js) ──► PostgreSQL (Neon, Drizzle ORM)
Admin dashboard (admin/, Vite)   ──┘         │
                                              ├──► Razorpay (payments, subscriptions, webhooks)
                                              ├──► Cloudinary (image upload, both clients upload directly client-side w/ unsigned preset; server also uploads generated receipts)
                                              ├──► Resend (email — admin/owner password reset OTP delivery)
                                              ├──► WhatsApp (AOC / MSG2Z providers — invoice + prebooking alerts, see admin/server/lib/invoice.js)
                                              └──► Geocoding (Nominatim/Mappls) for address→lat/lng
```

Backend is one process (`admin/server/index.js`), single Fastify app, no microservices. Runs via `node index.js` (prod) or `node --watch index.js` (dev). Health check: `GET /health`.

## Auth model — 3 separate identity realms, one JWT scheme

All three sign the same JWT (`@fastify/jwt`, secret `JWT_SECRET`), but payload `role`/table differs:
1. **User** (mobile app customers) — `users` table. Signup via phone+OTP (`/api/auth/send-otp` → `/api/auth/verify-otp`) or `/api/auth/sign-up` + `/api/auth/sign-in` (password path, `better-auth` dependency present but check actual usage — much of the auth is hand-rolled in index.js with `argon2` for hashing, not fully delegated to better-auth).
2. **Owner** (venue/service owners) — `owners` table, `/api/owners/login`, own password-reset flow (`/api/owners/request-password-reset` → OTP → `/api/owners/change-password`).
3. **Admin** — no dedicated table found in schema; likely env-configured or seeded via `admin/server/create-admin.js` script. Own password-reset endpoints under `/api/admin/*`.

Route guards (decorators defined `index.js:87-130`):
- `fastify.authenticate` — valid JWT required, any role.
- `fastify.authenticateAdmin` — must run after `authenticate`, checks role==admin.
- `fastify.authenticateOwner` — role==owner.
- `fastify.authenticateAdminOrOwner` — either.

## Request flow example — venue booking with payment
1. Mobile app: user picks venue/date → `POST /api/bookings/create-order` (creates Razorpay order, likely inserts pending `bookings` row).
2. Razorpay checkout completes client-side → `POST /api/bookings/verify-payment` (verifies signature, marks booking confirmed, generates receipt via `admin/server/lib/receipt.js`, sends invoice via `lib/invoice.js`).
3. Razorpay webhook also hits `POST /api/webhooks/razorpay` independently (defense in depth / async confirmation, e.g. for subscriptions).
4. Admin/owner sees booking in dashboard via `GET /api/owners/bookings` or `GET /api/bookings` (admin-wide).

Service bookings follow the identical shape under `/api/service-bookings/*`.

## Approval workflow (venues & service listings)
Owners create/edit venues or service listings. New creations and edits to already-approved listings set `approval_status = pending_review` or stash the diff in `pending_changes` jsonb (edits to live/approved items don't overwrite until admin approves — see `PUT /api/owners/venues/:id` at index.js:1133 vs 1182, two variants). Admin approves/rejects via admin-only endpoints. This is the core moderation gate for the marketplace — check this before assuming a `PUT` from the owner dashboard updates a venue immediately.

## Cross-cutting utilities in index.js
- `sanitizeText()` — strips HTML tags from user input inline (basic XSS defense, not a library).
- `haversineDistance()` — used for "nearby venues/services" / city-distance features.
- `generateBookingDisplayId()` — generates `ZBID-XXXXXXXX` human-readable booking codes with DB-uniqueness retry loop (10 attempts, then timestamp fallback).
- Global rate limit: 100 req/min per IP (`@fastify/rate-limit`), applies to entire app, not just auth routes.
- Helmet CSP explicitly disabled — noted in code as required for mobile WebView compatibility. Don't re-enable without checking WebView usage (e.g. Razorpay checkout, legal-content screens).
