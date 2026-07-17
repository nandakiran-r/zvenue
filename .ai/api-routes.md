# API Routes

All routes live in one file: `admin/server/index.js` (~5050 lines, no route modules/controllers). Base path always `/api/*` except `/health`. Line numbers below point at the `fastify.<method>(...)` call for quick lookup — re-grep if the file has since grown/shrunk:

```
grep -noE "fastify\.(get|post|put|delete|patch)\([^,]+" admin/server/index.js
```

Guard legend: **public** = no `onRequest`, **auth** = `fastify.authenticate` (any logged-in role — user/owner/admin all pass; route body then usually branches on `request.user.role`), **[[admin/owner check inside handler]]** = route says `auth` in code but does its own role check in the handler body rather than using the `authenticateAdmin`/`authenticateOwner` decorators (verify per-route; the decorators exist but aren't always used).

## Auth (`/api/auth/*`) — end users
| Method | Path | Guard | Line |
|---|---|---|---|
| POST | `/api/auth/sign-up` | public | 2029 |
| POST | `/api/auth/sign-in` | public | 2088 |
| POST | `/api/auth/send-otp` | public | 2115 |
| POST | `/api/auth/verify-otp` | public | 2264 |
| GET | `/api/auth/me` | auth | 2333 |
| DELETE | `/api/auth/delete-account` | auth | 2349 |

## Owners (`/api/owners/*`) — owner login + admin management of owners
| Method | Path | Guard | Line |
|---|---|---|---|
| POST | `/api/owners` | auth (admin creates owner) | 796 |
| GET | `/api/owners` | auth | 815 |
| POST | `/api/owners/login` | public | 830 |
| POST | `/api/owners/request-password-reset` | public | 849 |
| POST | `/api/owners/verify-reset-otp` | public | 890 |
| POST | `/api/owners/change-password` | auth | 928 |
| GET | `/api/owners/me` | auth | 1051 |
| GET | `/api/owners/venues` | auth | 1065 |
| POST | `/api/owners/venues` | auth | 1081 |
| PUT | `/api/owners/venues/:id` | auth | 1133 |
| PUT | `/api/owners/venues/:id/blocked-dates` | auth | 1182 |
| GET | `/api/owners/bookings` | auth | 1198 |
| GET | `/api/owners/analytics` | auth | 1223 |
| PUT | `/api/owners/:id` | auth | 1433 |
| DELETE | `/api/owners/:id` | auth | 1452 |
| GET | `/api/owners/services` | auth | 4504 |
| POST | `/api/owners/services` | auth | 4519 |
| PUT | `/api/owners/services/:id` | auth | 4536 |
| PUT | `/api/owners/services/:id/quantity` | auth | 4559 |
| GET | `/api/owners/service-analytics` | auth | 4574 |

## Admin (`/api/admin/*`) — admin-only ops
| Method | Path | Guard | Line |
|---|---|---|---|
| POST | `/api/admin/request-password-reset` | public | 954 |
| POST | `/api/admin/verify-reset-otp` | public | 989 |
| POST | `/api/admin/change-password` | auth | 1028 |
| POST | `/api/admin/bookings/:id/confirm-payment` | auth | 1853 |
| GET | `/api/admin/reviews` | auth | 3588 |
| GET | `/api/admin/service-categories` | auth | 3659 |
| GET | `/api/admin/service-bookings` | auth | 4180 |
| POST | `/api/admin/service-bookings/:id/refund` | auth | 4220 |
| POST | `/api/admin/service-bookings/:id/cancel` | auth | 4248 |
| GET | `/api/admin/service-reviews` | auth | 4407 |
| POST | `/api/admin/bookings/:id/generate-invoice` | auth | 4647 |
| POST | `/api/admin/service-bookings/:id/generate-invoice` | auth | 4675 |
| POST | `/api/admin/bookings/:id/send-invoice` | auth | 4703 |
| POST | `/api/admin/service-bookings/:id/send-invoice` | auth | 4757 |
| GET | `/api/admin/bookings/:id/download-invoice` | public (verify — likely token-in-query pattern) | 4811 |
| GET | `/api/admin/service-bookings/:id/download-invoice` | public (verify) | 4839 |

## Venues (`/api/venues/*`)
| Method | Path | Guard | Line |
|---|---|---|---|
| GET | `/api/venues` | public (list/search) | 2488 |
| GET | `/api/venues/:id` | public | 2555 |
| POST | `/api/venues` | auth | 2567 |
| PUT | `/api/venues/:id` | auth | 2622 |
| DELETE | `/api/venues/:id` | auth | 2666 |
| GET | `/api/venues/:id/booked-dates` | public | 2676 |
| POST | `/api/venues/:id/approve` | auth (admin) | 1365 |
| POST | `/api/venues/:id/reject` | auth (admin) | 1400 |
| GET | `/api/venues/:id/reviews` | public | 3469 |

## Categories (`/api/categories/*`) — venue categories
GET (public, 2706) / POST (auth, 2717) / PUT `:id` (auth, 2726) / DELETE `:id` (auth, 2735)

## Bookings — venue domain (`/api/bookings/*`)
| Method | Path | Guard | Line |
|---|---|---|---|
| POST | `/api/bookings/create-order` | auth | 1465 |
| POST | `/api/bookings/verify-payment` | auth | 1625 |
| GET | `/api/bookings` | auth | 2745 |
| GET | `/api/bookings/:id` | auth | 2776 |
| PUT | `/api/bookings/:id` | auth | 2792 |
| DELETE | `/api/bookings/:id` | auth | 2858 |
| POST | `/api/bookings` | auth | 2867 |
| GET | `/api/bookings/:id/invoice` | auth | 4607 |

## Service marketplace — categories/listings (`/api/service-categories`, `/api/service-listings`)
GET categories (public, 3645) / POST (auth,3673) / PUT `:id` (auth,3686) / DELETE `:id` (auth,3697)
GET listings list (public,3710) / GET `:id` (public,3746) / POST (auth,3760) / PUT `:id` (auth,3805) / DELETE `:id` (auth,3839) / POST `:id/approve` (auth-admin,3850) / POST `:id/reject` (auth-admin,3868) / GET `:id/booked-dates` (public,3881) / GET `:id/reviews` (public,4299)

## Service bookings (`/api/service-bookings/*`)
POST `create-order` (auth,3929) / POST `verify-payment` (auth,4013) / GET list (auth,4096) / GET `:id` (auth,4113) / POST `:id/cancel` (auth,4130) / GET `:id/invoice` (auth,4626)

## Reviews — venue (`/api/reviews/*`) & service (`/api/service-reviews/*`)
GET `eligibility/:venueId` (auth,3371) / POST (auth,3401) / PUT `:id` (auth,3510) / DELETE `:id` (auth,3555)
GET `eligibility/:listingId` (auth,4322) / POST (auth,4340) / PUT `:id` (auth,4376) / DELETE `:id` (auth,4392)

## Service favorites (`/api/service-favorites/*`)
GET (auth,4426) / POST (auth,4440) / DELETE `:listingId` (auth,4452) — **no venue-favorites equivalent server-side**, see [data-model.md](data-model.md).

## Users (`/api/users/*`) — admin management of end users
GET list (auth,2927) / GET `:id` (auth,2955) / PUT `:id` (auth,2973) / DELETE `:id` (auth,2995)

## Subscriptions (Razorpay, `/api/subscriptions/*`, `/api/subscription/*`)
POST `create` (auth,154) / POST `checkout` (auth,192) / POST `/api/webhooks/razorpay` (public — webhook, verified by signature not JWT,239) / GET `/api/subscription/status` (auth,685) / POST `confirm` (auth,715) / POST `cancel` (auth,766)

## Subscribers (`/api/subscribers/*`) — admin view of subscribed users
GET list (auth,3115) / POST `:id/cancel` (auth,3170) / POST `:id/activate` (auth,3204)

## Support tickets (`/api/support-tickets/*`)
POST create (auth,1281) / GET `mine` (auth,1311) / GET list-all (auth-admin,1326) / PUT `:id` (auth-admin,1345)

## Notifications (`/api/notifications/*`) + push (`/api/push*`)
GET (auth,3219) / POST (auth,3251) / POST `broadcast` (auth,3264) / PATCH `read-all` (auth,3288) / PATCH `:id/read` (auth,3301) / DELETE `:id` (auth,3310)
POST `/api/push-token` (auth,3007) / POST `/api/push/send` (auth,3048) / POST `/api/push/broadcast` (auth,3074)

## Dashboard/analytics (`/api/dashboard/*`) — admin
`stats` (2393) / `recent-bookings` (2426) / `revenue-chart` (2444) / `bookings-by-category` (2464) / `top-venues` (3320) / `city-distribution` (3335) — all auth.

## Search (`/api/search`)
GET, public, 4464 — cross-entity search (likely venues+services, uses `haversineDistance`/`sanitizeText` helpers from top of file).

## Receipts (`/api/receipts/*`) — PDF receipts
GET `venue/:id` (public? verify — likely needs a token param, 4870) / GET `service/:id` (4892) — backed by `admin/server/lib/receipt.js` (pdfkit) + Cloudinary upload.

## Config (`/api/config/*`) — key/value app config (e.g. subscription benefits copy)
GET `subscription-benefits` (public,4917) / GET `:key` (public,4929) / PUT `:key` (auth-admin,4944)

## Geocoding (`/api/geocode/*`)
GET `search` (auth,4983) / GET `reverse` (auth,5005) — proxies to `admin/server/lib/geocode.js`, avoids exposing 3rd-party geocode API keys client-side.

## Misc
GET `/health` (public, 5027) — Render health check target.

## Gaps / things to verify before relying on this table
- "auth" column means `fastify.authenticate` decorator was used; several admin-only-looking routes (e.g. some `/api/admin/*`) don't visibly use `authenticateAdmin`/`authenticateOwner` decorators in the grep above — the role check may happen manually inside the handler body. Read the handler before assuming a non-admin JWT is rejected.
- Invoice/receipt download routes may rely on a signed token in the query string rather than JWT — check handler body, don't assume "public" means unauthenticated-safe.
