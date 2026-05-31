# ZVenue — Production Deployment Checklist

## Pre-Deployment Steps

### 1. Razorpay (Payment Gateway)
- [ ] Switch from test mode to **live mode** in Razorpay Dashboard
- [ ] Generate **live API keys** (Settings → API Keys)
- [ ] Create **live subscription plans** (same amounts: ₹9/₹29/₹59)
- [ ] Update plan IDs in `app/subscription.tsx` with live plan IDs
- [ ] Set up **webhook** (Dashboard → Webhooks → Add):
  - URL: `https://your-backend-domain.com/api/razorpay/webhook`
  - Events: `payment.captured`, `subscription.activated`, `subscription.cancelled`
  - Copy webhook secret to `RAZORPAY_WEBHOOK_SECRET`
- [ ] Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in backend `.env`
- [ ] Update `EXPO_PUBLIC_RAZORPAY_KEY` in `eas.json` (production profile)

### 2. Database (Neon PostgreSQL)
- [ ] Create a **production branch** in Neon (separate from dev)
- [ ] Run all migrations on production DB
- [ ] Update `DATABASE_URL` in backend `.env` with production connection string
- [ ] Verify connection pooling is enabled (use `-pooler` endpoint)

### 3. Domain & Hosting
- [ ] Set up production domain for backend (e.g., `api.zvenue.in`)
- [ ] Set up production domain for admin panel (e.g., `admin.zvenue.in`)
- [ ] Configure SSL certificates (auto with Cloudflare/Render/Azure)
- [ ] Update `BETTER_AUTH_URL` in backend `.env`
- [ ] Update `ALLOWED_ORIGINS` in backend `.env`
- [ ] Update `VITE_API_URL` in admin `.env`
- [ ] Update `EXPO_PUBLIC_API_URL` in `eas.json`

### 4. Authentication & Security
- [ ] Generate new `BETTER_AUTH_SECRET` (`openssl rand -hex 32`)
- [ ] Generate new `JWT_SECRET` (`openssl rand -hex 32`)
- [ ] Verify CORS is restricted to production domains only
- [ ] Remove `http://localhost:*` from `ALLOWED_ORIGINS`

### 5. WhatsApp (AOC Portal)
- [ ] Verify all templates are approved in AOC portal:
  - `otp` — OTP verification
  - `booking_notification` — venue pre-booking
  - `notification` — service booking
  - `pre_booking_owner_notification` — owner alert
  - `booking_confirmation_invoice` — confirmation + receipt (document header)
- [ ] Verify WhatsApp Business number is verified and active
- [ ] Test sending to a real number from production backend

### 6. Cloudinary
- [ ] Verify `zvenue_unsigned` preset exists with:
  - Mode: **Unsigned**
  - Resource type: **Auto** (supports images + raw/PDF)
- [ ] No changes needed — same cloud works for dev and prod

### 7. Mobile App (EAS Build)
- [ ] Update `eas.json` production env with live values
- [ ] Run production build: `eas build --platform android --profile production`
- [ ] Test the production APK/AAB thoroughly
- [ ] Submit to Google Play Store (if ready)

### 8. Admin Panel
- [ ] Build: `cd admin && npm run build`
- [ ] Deploy `admin/dist/` to hosting (Cloudflare Pages, Vercel, or Azure)
- [ ] Verify admin login works with production backend

---

## Environment Files Summary

| Component | File | Key Variables |
|-----------|------|---------------|
| Backend | `admin/server/.env` | DATABASE_URL, RAZORPAY keys, AOC keys, JWT secrets |
| Admin Panel | `admin/.env` | VITE_API_URL, VITE_CLOUDINARY_* |
| Mobile App | `eas.json` (production.env) | EXPO_PUBLIC_API_URL, EXPO_PUBLIC_RAZORPAY_KEY |

---

## Production Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Mobile App    │────▶│    Backend API    │◀────│   Admin Panel   │
│  (Expo/RN)     │     │  (Fastify/Node)   │     │  (React/Vite)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
              ┌──────────┐ ┌────────┐ ┌──────────┐
              │  Neon DB │ │Razorpay│ │   AOC    │
              │(Postgres)│ │Payment │ │WhatsApp  │
              └──────────┘ └────────┘ └──────────┘
                    │
                    ▼
              ┌──────────┐
              │Cloudinary│
              │  (CDN)   │
              └──────────┘
```

---

## Post-Deployment Verification

- [ ] Admin can login to admin panel
- [ ] Admin can view/manage venues, services, bookings
- [ ] Customer can sign up via OTP (WhatsApp + SMS)
- [ ] Customer can browse venues and services
- [ ] Customer can pre-book a venue (Razorpay payment)
- [ ] Customer receives WhatsApp pre-booking notification
- [ ] Owner receives WhatsApp pre-booking alert
- [ ] Admin can confirm full payment
- [ ] Admin can send confirmation + receipt via WhatsApp
- [ ] Customer can book a service (Razorpay payment)
- [ ] Customer receives WhatsApp service booking notification
- [ ] Admin can send service receipt via WhatsApp
- [ ] Subscription purchase works (₹9/₹29/₹59 plans)
- [ ] Push notifications arrive on mobile
- [ ] Image uploads work (venues, services, profile avatar)
- [ ] Deep links resolve correctly

---

## Rollback Plan

If issues arise after deployment:
1. Backend: Revert to previous code, restart server
2. Admin: Redeploy previous `dist/` build
3. Mobile: Cannot rollback published app — use OTA updates (expo-updates) for JS fixes
4. Database: Neon supports point-in-time recovery (PITR)
