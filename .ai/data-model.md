# Data Model

Source of truth: `admin/server/db/schema.js` (Drizzle ORM, PostgreSQL/Neon). Migrations: `admin/server/drizzle/*.sql` (drizzle-kit). All PKs `uuid().defaultRandom()`.

## Core (venue domain)

**users** — end customers. `email`+`phone_number` unique. `password` nullable (OTP-only accounts allowed). Subscription fields inline: `subscription_id`, `subscription_status` (none/active/authenticated/...), `next_billing_at`. `push_token` for notifications.

**owners** — venue/service owners (separate login realm). `email`+`phone_number` unique, `password` required, `is_active` flag.

**categories** — venue categories (name, icon, sort_order).

**otps** — phone + otp + expires_at, used for signup/login/password-reset flows across users/owners/admin.

**venues** — `category_id` → categories (set null on delete), `owner_id` → owners (set null on delete). Pricing: `price_per_hour/day/morning/evening/full_day`, `registration_fee` (pre-booking deposit model). `images` jsonb array (≤6, first = cover), `image_url` legacy single-cover field kept for back-compat. `approval_status`: pending_review / approved / pending_changes / rejected — owner edits to a live venue go into `pending_changes` jsonb pending admin approval. `blocked_dates`, `available_dates` jsonb.

**bookings** — venue bookings. `booking_id_display` (13-char human code, unique). References `venue_id`, `user_id`. Razorpay fields: `order_id`, `payment_id`, `signature`. Pre-booking/deposit fields: `transaction_id`, `registration_fee_paid`, `remaining_balance`, `paid_at`. `status`: pending/confirmed/... (see [api-routes.md](api-routes.md) confirm/cancel endpoints).

**notifications** — per-user, `type` default 'announcement', `data` jsonb payload, `is_read` flag. Also broadcast-capable (see `/api/notifications/broadcast`).

**support_tickets** — owner-raised tickets. `priority` (low/medium/high), `status` (open/in_progress/resolved/closed), `admin_reply`+`replied_at`.

**reviews** — venue reviews. One review per (venue,user) enforced via `reviews_user_venue_unique`. `rating` 1-5, `comment` nullable (≤500 chars enforced at API, not DB).

## Service marketplace (parallel domain, mirrors venue domain)

**service_categories** — like `categories` but `is_active` flag added.

**service_listings** — like `venues` but hourly/session-based: `opening_time`/`closing_time` (HH:MM strings), `max_booking_duration` (minutes, default 1440), `blocked_slots` jsonb array of `{date,start,end}`. `subscriber_discount_percent` (0-50) instead of full benefits list. Same `approval_status`/`pending_changes` workflow as venues.

**service_bookings** — like `bookings`. `quantity` + `unit_price` + `discount_applied` → `total_amount` (session/hourly pricing, see [mobile-app.md](mobile-app.md) `lib/pricing.ts`/`timeSlots.ts`). `booking_date` is `YYYY-MM-DD` string, `start_time`/`end_time` are display strings ("08:00 AM"). Extra statuses vs venue bookings: `refunded`, `payment_failed`. `cancellation_reason`, `refunded_at`.

**service_reviews** — mirrors `reviews`, unique per (listing,user).

**service_favorites** — user favorites for service listings, unique per (listing,user). (Venue favorites are NOT a DB table — see [mobile-app.md](mobile-app.md), venue favorites are client-side/local via `store/favoritesStore.ts` + `context/FavoritesContext.tsx`.)

## Relations summary
`owners` 1—N `venues`, `support_tickets`, `service_listings`. `venues` N—1 `categories`/`owners`, 1—N `bookings`/`reviews`. `users` 1—N `bookings`/`notifications`/`reviews`/`service_bookings`/`service_reviews`/`service_favorites`. `service_listings` N—1 `service_categories`/`owners`, 1—N `service_bookings`/`service_reviews`/`service_favorites`.

## Notable asymmetry to remember
- Venue side has no `favorites` table; service side does. If asked to add venue-favorites persistence server-side, this is a gap, not a bug.
- Venue `bookings` has no `refunded`/`payment_failed` status columns comment (service_bookings does) — check actual `status` string usage in index.js before assuming parity.
