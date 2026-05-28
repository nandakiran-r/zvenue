# Platform Hardening & Production Readiness — Strategic Enhancement Plan

## Overview

This plan addresses all critical security issues, architectural gaps, missing infrastructure, and quality improvements. It incorporates the following business decisions:

- **Invoices:** Sent via WhatsApp (AOC API) to both customers and owners. If user doesn't have WhatsApp, a digital invoice is available in-app only. No email invoices.
- **Account Recovery:** Owners and admins can recover accounts / change passwords via OTP verification (AOC WhatsApp + MSG2Z SMS dual-channel, same as existing login OTP).
- **No multi-language support** — English only.
- **No key removal** — All existing API keys and credentials are preserved as-is. Security improvements focus on access control, not key rotation.

---

## Phase 1: Critical Security Fixes (Priority: IMMEDIATE)

### Task 1.1: Admin Role-Based Access Control
**Problem:** Any authenticated user (regular app user) can access ALL admin endpoints.

**Implementation:**
- Add `authenticateAdmin` decorator that checks `request.user.role === 'admin'`
- Add `authenticateOwner` decorator that checks `request.user.role === 'owner'`
- Apply to all admin-only routes: `/api/admin/*`, venue approve/reject, user delete, category CRUD, notification broadcast, subscriber management, owner CRUD, push broadcast
- Modify admin sign-in to include `role: 'admin'` in JWT payload
- Owner login already includes `role: 'owner'`

**Files:** `admin/server/index.js` (add middleware, apply to ~30 endpoints)
**Effort:** 1.5 hours

---

### Task 1.2: Fix CORS Configuration
**Problem:** `origin: '*'` allows any website to make authenticated requests.

**Implementation:**
- Use the already-defined `ALLOWED_ORIGINS` env var
- Parse comma-separated origins: `process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:4173']`
- Keep permissive for mobile app (React Native doesn't send Origin header)

**Files:** `admin/server/index.js`
**Effort:** 10 minutes

---

### Task 1.3: Service Webhook Handlers
**Problem:** Service payments captured by Razorpay won't be confirmed via webhook (only client-side verify works).

**Implementation:**
- Update existing `handlePaymentCaptured` to check receipt prefix
- If receipt starts with `service_` → route to new `handleServicePaymentCaptured`
- Implement `handleServicePaymentCaptured`: find service_booking by order_id, update status to confirmed, decrement quantity, notify user
- Implement `handleServicePaymentFailed`: update status, notify user
- Implement `handleServiceRefundProcessed`: update status to refunded, restore quantity, notify user

**Files:** `admin/server/index.js`
**Effort:** 1.5 hours

---

### Task 1.4: Strengthen JWT Configuration
**Problem:** Hardcoded fallback `'supersecretkey_change_me_in_prod'` means server starts even without proper secret.

**Implementation:**
- Remove the fallback: `secret: process.env.JWT_SECRET` (no `||` fallback)
- Add startup check: if `!process.env.JWT_SECRET` → throw error and exit
- Keep existing JWT_SECRET value in .env (no rotation per your requirement)

**Files:** `admin/server/index.js`
**Effort:** 5 minutes

---

### Task 1.5: Add .env to .gitignore (Prevent Future Commits)
**Problem:** .env files with credentials are tracked by git.

**Implementation:**
- Add to `.gitignore`: `admin/server/.env`, `.env`
- Create `admin/server/.env.example` with variable names (no values)
- Do NOT remove or rotate existing keys (per your requirement)
- Note: Existing git history still has the keys — acceptable for now

**Files:** `.gitignore`, `admin/server/.env.example`
**Effort:** 10 minutes

---

## Phase 2: Security Hardening (Priority: HIGH)

### Task 2.1: Security Headers (Helmet)
**Implementation:**
- Install `@fastify/helmet`
- Register with defaults (X-Frame-Options, X-Content-Type-Options, etc.)
- Disable CSP for now (mobile WebView compatibility)

**Effort:** 15 minutes

---

### Task 2.2: Global Rate Limiting
**Implementation:**
- Install `@fastify/rate-limit`
- Global: 100 requests/minute per IP
- Auth endpoints: 10 requests/minute
- Payment endpoints: 20 requests/minute
- Existing OTP rate limiting (in-memory) stays as additional layer

**Effort:** 30 minutes

---

### Task 2.3: Request Body Size Limits
**Implementation:**
- Set Fastify `bodyLimit: 10 * 1024 * 1024` (10MB — needed for base64 profile images)
- This is already Fastify's default but make it explicit

**Effort:** 5 minutes

---

### Task 2.4: Input Validation (JSON Schema)
**Implementation:**
- Add Fastify schema validation on critical endpoints:
  - `POST /api/auth/sign-up`: validate email format, phone format, name lengths
  - `POST /api/auth/verify-otp`: validate phone format, OTP 6 digits
  - `POST /api/service-bookings/create-order`: validate listing_id UUID, quantity > 0
  - `POST /api/venues`: validate required fields, price ranges
  - `POST /api/service-listings`: validate required fields, images max 5
- Use Fastify's built-in JSON Schema (no extra library needed)

**Effort:** 3 hours

---

### Task 2.5: XSS Sanitization
**Implementation:**
- Strip HTML tags from user-generated text before storing:
  - Venue/service descriptions
  - Review comments
  - Support ticket descriptions
  - Notification bodies
- Simple regex: `text.replace(/<[^>]*>/g, '')`
- Apply in relevant POST/PUT handlers

**Effort:** 45 minutes

---

## Phase 3: Account Recovery & Password Change (Priority: HIGH)

### Task 3.1: Owner Password Change (via OTP)
**Problem:** Owners have no way to change their password or recover their account.

**Implementation:**
- New endpoint: `POST /api/owners/request-password-reset`
  - Input: `{ email }` or `{ phone_number }`
  - Lookup owner by email/phone
  - Generate 6-digit OTP, store in `otps` table
  - Send via dual-channel (SMS + WhatsApp) using existing `sendSmsMSG2Z` + `sendWhatsAppOTP`
  - Return `{ success: true, message: 'OTP sent' }`

- New endpoint: `POST /api/owners/verify-reset-otp`
  - Input: `{ phone_number, otp, new_password }`
  - Verify OTP (same logic as user verify-otp)
  - Hash new password with argon2
  - Update owner's password
  - Delete used OTPs
  - Return `{ success: true, message: 'Password updated' }`

- New endpoint: `POST /api/owners/change-password` (authenticated)
  - Input: `{ current_password, new_password }`
  - Verify current password with argon2
  - Hash and update new password
  - Return `{ success: true }`

**Files:** `admin/server/index.js`
**Effort:** 2 hours

---

### Task 3.2: Admin Password Change (via OTP)
**Problem:** Admin has no password recovery mechanism.

**Implementation:**
- Since admin uses the same `users` table with email/password login:
- New endpoint: `POST /api/admin/request-password-reset`
  - Input: `{ email }`
  - Lookup user by email
  - Generate OTP, send via SMS + WhatsApp to user's phone
  - Return success

- New endpoint: `POST /api/admin/verify-reset-otp`
  - Input: `{ phone_number, otp, new_password }`
  - Verify OTP, hash new password, update user record
  - Return success

- New endpoint: `POST /api/admin/change-password` (authenticated)
  - Input: `{ current_password, new_password }`
  - Verify and update

**Files:** `admin/server/index.js`
**Effort:** 1.5 hours

---

### Task 3.3: Owner Portal - Password Change UI
**Implementation:**
- Add "Change Password" option in owner portal settings
- Form: current password → new password → confirm password
- "Forgot Password?" link on owner login page → OTP flow → reset

**Files:** `admin/src/features/owner-portal/`, owner login page
**Effort:** 2 hours

---

### Task 3.4: Admin Panel - Password Change UI
**Implementation:**
- Add "Change Password" in admin settings page
- Form: current password → new password → confirm password
- "Forgot Password?" on admin login → OTP to registered phone → reset

**Files:** `admin/src/features/auth/`, admin settings
**Effort:** 1.5 hours

---

## Phase 4: WhatsApp Invoice System (Priority: HIGH)

### Task 4.1: Invoice Data Model & Generation
**Implementation:**
- Create invoice data structure (no new table needed — derive from booking data):
  ```
  Invoice = {
    invoice_number: "ZINV-{timestamp}",
    booking_id_display: "ZBID-XXXXXXXX" or "ZSID-XXXXXXXX",
    customer_name, customer_phone,
    venue/service_name, city,
    booking_date (venue) or purchase_date (service),
    items: [{ description, quantity, unit_price, amount }],
    subtotal, discount, service_fee, total,
    payment_method, payment_id,
    owner_name, owner_phone,
    generated_at
  }
  ```
- Helper function: `generateInvoiceData(booking, type: 'venue' | 'service')`

**Files:** `admin/server/lib/invoice.js`
**Effort:** 1 hour

---

### Task 4.2: WhatsApp Invoice Delivery (AOC API)
**Implementation:**
- Create AOC WhatsApp template for invoices (template name: `booking_invoice`)
- Template params: customer_name, booking_id, venue_name, date, total_amount, payment_id
- New function: `sendWhatsAppInvoice(phoneNumber, invoiceParams)`
  - Uses existing AOC API integration pattern
  - Sends to customer phone number
  - Fire-and-forget (don't block booking confirmation)

- Trigger points:
  - After venue booking confirmed (pre-booking or full payment)
  - After service booking confirmed
  - Send to BOTH customer AND owner

**Files:** `admin/server/lib/invoice.js`, `admin/server/index.js` (booking confirmation handlers)
**Effort:** 2 hours

---

### Task 4.3: In-App Digital Invoice (Mobile)
**Implementation:**
- New endpoint: `GET /api/bookings/:id/invoice` and `GET /api/service-bookings/:id/invoice`
  - Returns structured invoice JSON
  - Only accessible by the booking owner (user_id check)

- Mobile screen: "View Invoice" button on booking detail screens
  - Displays formatted invoice card with all details
  - "Share" button to share as text/image
  - No PDF needed — just a nicely formatted in-app view

- Add "View Invoice" button to:
  - `app/view-booking.tsx` (venue bookings)
  - `app/view-service-booking.tsx` (service bookings)

**Files:** `admin/server/index.js`, `app/view-booking.tsx`, `app/view-service-booking.tsx`
**Effort:** 3 hours

---

### Task 4.4: Owner Invoice Notification
**Implementation:**
- When a booking is confirmed, send WhatsApp invoice to the venue/service owner
- Owner invoice includes: customer name, booking details, amount (minus platform fee if applicable)
- Uses same AOC template with owner-specific params
- Fallback: in-app notification if owner has no WhatsApp (already handled by notification system)

**Files:** `admin/server/index.js` (booking confirmation handlers)
**Effort:** 1 hour

---

## Phase 5: Database Improvements (Priority: MEDIUM)

### Task 5.1: Add Missing Performance Indexes
**Implementation:**
```sql
CREATE INDEX IF NOT EXISTS idx_bookings_venue_id ON bookings(venue_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_venues_category_id ON venues(category_id);
CREATE INDEX IF NOT EXISTS idx_venues_owner_id ON venues(owner_id);
CREATE INDEX IF NOT EXISTS idx_venues_approval_status ON venues(approval_status);
CREATE INDEX IF NOT EXISTS idx_service_listings_category_id ON service_listings(service_category_id);
CREATE INDEX IF NOT EXISTS idx_service_listings_approval ON service_listings(approval_status);
CREATE INDEX IF NOT EXISTS idx_service_bookings_user_id ON service_bookings(user_id);
```

**Effort:** 30 minutes

---

### Task 5.2: Add `updated_at` Timestamps
**Implementation:**
- Add column to: users, venues, service_listings, service_bookings, bookings
- Set on every UPDATE operation
- Migration: `ALTER TABLE X ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now()`

**Effort:** 1 hour

---

### Task 5.3: Soft Delete for Critical Entities
**Implementation:**
- Add `deleted_at TIMESTAMP` to: users, venues, service_listings
- Modify DELETE endpoints to SET deleted_at instead of hard delete
- Add `WHERE deleted_at IS NULL` to all SELECT queries for these tables
- Keep hard delete for: OTPs, notifications, reviews, favorites (ephemeral data)

**Effort:** 2 hours

---

## Phase 6: Architecture & Code Quality (Priority: MEDIUM)

### Task 6.1: Split Server into Route Modules
**Implementation:**
```
admin/server/
├── index.js              (app setup, plugins, middleware, start)
├── routes/
│   ├── auth.js
│   ├── venues.js
│   ├── bookings.js
│   ├── categories.js
│   ├── users.js
│   ├── owners.js
│   ├── notifications.js
│   ├── subscriptions.js
│   ├── reviews.js
│   ├── support.js
│   ├── dashboard.js
│   ├── subscribers.js
│   ├── services.js
│   ├── search.js
│   └── webhooks.js
├── middleware/
│   ├── auth.js
│   └── rate-limit.js
├── lib/
│   ├── geocode.js
│   ├── invoice.js
│   ├── push.js
│   └── validators.js
└── db/
    ├── index.js
    └── schema.js
```

Each route file exports a Fastify plugin:
```js
export default async function authRoutes(fastify, opts) {
  fastify.post('/api/auth/sign-up', ...);
  // ...
}
```

**Effort:** 5 hours (refactor only, no new logic)

---

### Task 6.2: Health Check Endpoint
**Implementation:**
- `GET /health` → `{ status: 'ok', uptime, timestamp }`
- Used by load balancers and monitoring

**Effort:** 10 minutes

---

### Task 6.3: Graceful Shutdown
**Implementation:**
- Listen for SIGINT/SIGTERM
- Close Fastify server (finish in-flight requests)
- Exit cleanly

**Effort:** 10 minutes

---

### Task 6.4: Remove Dead Code
**Implementation:**
- Remove `features/tasks/` (template)
- Remove `features/apps/` (template)
- Remove `features/chats/` (template)
- Remove empty `owners-management/`
- Remove `better-auth` from package.json (unused)
- Remove `app/bookings.tsx` (replaced by tabs/my-bookings)
- Move seed scripts to `scripts/` folder

**Effort:** 30 minutes

---

## Phase 7: Infrastructure & DevOps (Priority: MEDIUM)

### Task 7.1: Dockerfile
**Implementation:**
- Multi-stage build: install deps → copy source → run
- Expose port 3001
- Use node:20-alpine for small image

**Effort:** 30 minutes

---

### Task 7.2: docker-compose.yml
**Implementation:**
- Backend service from Dockerfile
- Environment from .env file
- Port mapping 3001:3001

**Effort:** 20 minutes

---

### Task 7.3: CI/CD Pipeline (GitHub Actions)
**Implementation:**
- On push to main: lint → typecheck → test → build admin → deploy
- On PR: lint → typecheck → test only
- Deploy target: Render / Railway / Fly.io (choose one)

**Effort:** 2 hours

---

### Task 7.4: Error Tracking (Sentry)
**Implementation:**
- Install `@sentry/node` on backend
- Install `@sentry/react-native` on mobile app
- Configure DSN from env var
- Capture unhandled errors automatically

**Effort:** 1 hour

---

### Task 7.5: Image Upload (Cloudinary)
**Problem:** Images are URL-only. No actual file upload for venues/services/profiles.

**Implementation:**
- Install `cloudinary` SDK
- Add `POST /api/upload` endpoint (multipart form, max 5MB, jpg/png/webp)
- Upload to Cloudinary, return URL
- Update admin panel image fields to use upload
- Update mobile profile picture to upload via this endpoint
- Add `CLOUDINARY_URL` to env

**Effort:** 3 hours

---

## Phase 8: Testing (Priority: LOW for MVP, HIGH for scale)

### Task 8.1: Backend Integration Tests
- Install vitest
- Test auth flow, booking flow, service flow, review flow
- Test role-based access (admin vs user vs owner)
- Target: 80% endpoint coverage

**Effort:** 10 hours

---

### Task 8.2: Mobile E2E Tests (Maestro)
- Login flow, browse, book, review, cancel
- 5-7 critical user journeys

**Effort:** 6 hours

---

### Task 8.3: Load Testing (k6)
- Venue listing, service listing, search, payment creation
- 100-200 concurrent users
- Identify bottlenecks

**Effort:** 4 hours

---

## Phase 9: Feature Polish (Priority: LOW)

### Task 9.1: Dashboard Service Analytics
- Update `/api/dashboard/stats` to include service counts/revenue
- Add service charts to admin analytics page

**Effort:** 2 hours

---

### Task 9.2: Offline Support (Mobile)
- Cache listings locally with AsyncStorage
- Show cached data with "Offline" banner
- Queue favorites/reviews for sync

**Effort:** 6 hours

---

### Task 9.3: Cancellation Policy Display
- Show "24-hour free cancellation" badge on service detail page
- Show "Pre-booking — agent will contact" note on venue detail page

**Effort:** 1 hour

---

## Execution Timeline

| Week | Phases | Focus |
|------|--------|-------|
| **Week 1** | Phase 1 + 2 | Security (critical + hardening) |
| **Week 2** | Phase 3 + 4 | Account recovery + Invoices |
| **Week 3** | Phase 5 + 6 | Database + Architecture |
| **Week 4** | Phase 7 | Infrastructure & DevOps |
| **Week 5** | Phase 8 | Testing |
| **Week 6** | Phase 9 | Polish |

---

## Total Effort Estimate

| Phase | Hours |
|-------|-------|
| Phase 1 (Critical Security) | 3.5h |
| Phase 2 (Security Hardening) | 4.5h |
| Phase 3 (Account Recovery) | 7h |
| Phase 4 (WhatsApp Invoices) | 7h |
| Phase 5 (Database) | 3.5h |
| Phase 6 (Architecture) | 6h |
| Phase 7 (Infrastructure) | 7h |
| Phase 8 (Testing) | 20h |
| Phase 9 (Polish) | 9h |
| **Total** | **~67.5 hours** |

---

## Key Decisions Documented

1. **No key rotation** — Existing API keys, JWT secret, and credentials stay as-is
2. **Invoices via WhatsApp** — Using existing AOC API integration, no email
3. **In-app digital invoice** — Fallback for users without WhatsApp
4. **Owner invoices** — Owners get WhatsApp notification with booking details
5. **Account recovery** — OTP-based (same dual-channel: SMS + WhatsApp)
6. **No multi-language** — English only
7. **No email system** — All communication via WhatsApp + Push + In-app
