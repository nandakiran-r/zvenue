# Technical Design Document

## Overview

This design extends the ZVenue platform with a Service Categories Marketplace. The architecture follows the existing patterns: Fastify backend with Drizzle ORM on PostgreSQL (Neon), React Native/Expo mobile app with Zustand stores, and React admin panel with TanStack Router. New database tables, API endpoints, mobile screens, and admin pages are added without modifying existing venue/booking functionality.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile App (Expo)                         │
│  ┌──────────┐ ┌──────────────┐ ┌────────────┐ ┌─────────────┐  │
│  │Home Screen│ │Service Browse│ │Service Detail│ │Service Book │  │
│  │(Toggle)   │ │   Screen     │ │    Page     │ │ Confirmation│  │
│  └──────────┘ └──────────────┘ └────────────┘ └─────────────┘  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐    │
│  │My Bookings   │ │Service Review│ │  Service Booking      │    │
│  │(Venues|Svc)  │ │   Screens    │ │  Detail Screen        │    │
│  └──────────────┘ └──────────────┘ └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │ Axios + JWT
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Fastify + Drizzle)                    │
│  ┌────────────────┐ ┌──────────────────┐ ┌──────────────────┐  │
│  │Service Category│ │ Service Listing   │ │ Service Booking   │  │
│  │  Endpoints     │ │   Endpoints       │ │   Endpoints       │  │
│  └────────────────┘ └──────────────────┘ └──────────────────┘  │
│  ┌────────────────┐ ┌──────────────────┐ ┌──────────────────┐  │
│  │Service Review  │ │ Service Favorites │ │ Webhook Router    │  │
│  │  Endpoints     │ │   Endpoints       │ │ (service_ prefix) │  │
│  └────────────────┘ └──────────────────┘ └──────────────────┘  │
│  ┌────────────────┐ ┌──────────────────┐                        │
│  │Unified Search  │ │ Owner Service    │                        │
│  │  Endpoint      │ │   Endpoints      │                        │
│  └────────────────┘ └──────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
                              │ Drizzle ORM
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL (Neon)                              │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────┐  │
│  │service_categories │ │service_listings   │ │service_bookings│  │
│  └──────────────────┘ └──────────────────┘ └────────────────┘  │
│  ┌──────────────────┐ ┌──────────────────┐                      │
│  │service_reviews    │ │service_favorites  │                      │
│  └──────────────────┘ └──────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Admin Panel (React + Vite)                     │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────┐  │
│  │Service Categories│ │Service Listings   │ │Service Bookings│  │
│  │   Page           │ │   Page            │ │   Page         │  │
│  └──────────────────┘ └──────────────────┘ └────────────────┘  │
│  ┌──────────────────┐                                            │
│  │Owner Portal:     │                                            │
│  │ My Services Page │                                            │
│  └──────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### New Tables

```sql
-- Service Categories (separate from venue categories)
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(50) DEFAULT 'star',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Service Listings
CREATE TABLE service_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES owners(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  images JSONB DEFAULT '[]',
  video_url VARCHAR(500),
  price REAL NOT NULL DEFAULT 0,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  city VARCHAR(255) NOT NULL,
  area VARCHAR(255),
  subscriber_discount_percent INTEGER DEFAULT 0,
  subscriber_benefits JSONB DEFAULT '[]',
  rating REAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  approval_status VARCHAR(50) DEFAULT 'approved',
  pending_changes JSONB,
  owner_name VARCHAR(255),
  owner_image TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Service Bookings
CREATE TABLE service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id_display VARCHAR(13) UNIQUE,
  service_listing_id UUID REFERENCES service_listings(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL,
  discount_applied REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'razorpay',
  order_id VARCHAR(255),
  payment_id VARCHAR(255),
  signature VARCHAR(500),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  cancellation_reason TEXT,
  refunded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Service Reviews
CREATE TABLE service_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_listing_id UUID NOT NULL REFERENCES service_listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE UNIQUE INDEX service_reviews_user_listing_unique ON service_reviews(service_listing_id, user_id);
CREATE INDEX service_reviews_listing_idx ON service_reviews(service_listing_id);

-- Service Favorites
CREATE TABLE service_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_listing_id UUID NOT NULL REFERENCES service_listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now()
);
CREATE UNIQUE INDEX service_favorites_user_listing_unique ON service_favorites(service_listing_id, user_id);
```

### Drizzle Schema (admin/server/db/schema.js additions)

New exports: `service_categories`, `service_listings`, `service_bookings`, `service_reviews`, `service_favorites` with corresponding relations.

## API Endpoints

### Service Categories
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/service-categories` | No | List active service categories |
| POST | `/api/service-categories` | Admin | Create category |
| PUT | `/api/service-categories/:id` | Admin | Update category |
| DELETE | `/api/service-categories/:id` | Admin | Delete category |

### Service Listings
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/service-listings` | No | List active listings (filter by category_id, search) |
| GET | `/api/service-listings/:id` | No | Get single listing with category & owner |
| POST | `/api/service-listings` | Admin | Create listing (approval_status = 'approved') |
| PUT | `/api/service-listings/:id` | Admin | Update listing |
| DELETE | `/api/service-listings/:id` | Admin | Delete listing |
| POST | `/api/service-listings/:id/approve` | Admin | Approve owner-submitted listing |
| POST | `/api/service-listings/:id/reject` | Admin | Reject listing |

### Service Bookings
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/service-bookings` | User | List user's service bookings |
| GET | `/api/service-bookings/:id` | User | Get booking detail |
| POST | `/api/service-bookings/create-order` | User | Create Razorpay order + pending booking |
| POST | `/api/service-bookings/verify-payment` | User | Verify payment + confirm booking |
| POST | `/api/service-bookings/:id/cancel` | User | Cancel within 24h window |
| GET | `/api/admin/service-bookings` | Admin | List all service bookings (filtered) |
| POST | `/api/admin/service-bookings/:id/refund` | Admin | Admin-initiated refund |

### Service Reviews
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/service-listings/:id/reviews` | No | Paginated reviews for a listing |
| GET | `/api/service-reviews/eligibility/:listingId` | User | Check if user can review |
| POST | `/api/service-reviews` | User | Create/upsert review |
| PUT | `/api/service-reviews/:id` | User | Update own review |
| DELETE | `/api/service-reviews/:id` | User/Admin | Delete review |
| GET | `/api/admin/service-reviews` | Admin | All reviews (filtered) |

### Service Favorites
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/service-favorites` | User | List user's favorite services |
| POST | `/api/service-favorites` | User | Add to favorites |
| DELETE | `/api/service-favorites/:listingId` | User | Remove from favorites |

### Owner Service Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/owners/services` | Owner | List own service listings |
| POST | `/api/owners/services` | Owner | Create listing (pending_review) |
| PUT | `/api/owners/services/:id` | Owner | Edit listing (pending_changes if approved) |
| PUT | `/api/owners/services/:id/quantity` | Owner | Update quantity directly |
| GET | `/api/owners/service-analytics` | Owner | Service booking analytics |

### Unified Search
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/search?q=term&type=all|venues|services` | No | Unified search across venues + services |

## Mobile App Screens

### New Screens (Expo Router)
| Screen | Path | Description |
|--------|------|-------------|
| Service Browse | `/service-listings` | Category-filtered listing grid |
| Service Detail | `/service-detail` | Full detail page (mirrors venue-detail) |
| Service Booking Confirmed | `/service-booking-confirmed` | One-time confirmation screen |
| Service Booking Detail | `/view-service-booking` | Booking detail with cancel option |
| Service Write Review | `/write-service-review` | Review submission screen |
| Service All Reviews | `/service-reviews` | Full reviews list |

### Modified Screens
| Screen | Change |
|--------|--------|
| `(tabs)/home` | Add "Venues / Services" toggle, service category chips |
| `(tabs)/my-bookings` | Add "Venues / Services" sub-tabs |
| `(tabs)/search` | Integrate unified search with type badges |
| `(tabs)/favorites` | Add service favorites section |

### New Stores (Zustand)
- `store/serviceStore.ts` — Service listings, categories, browse state
- `store/serviceBookingStore.ts` — Service booking state
- `store/serviceReviewStore.ts` — Service reviews (mirrors reviewStore pattern)
- `store/serviceFavoritesStore.ts` — Service favorites

### New API Functions (lib/)
- `lib/serviceApi.ts` — All service-related API calls
- `lib/serviceTypes.ts` — TypeScript interfaces for service entities

## Admin Panel Pages

### New Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/service-categories` | ServiceCategoriesPage | CRUD for service categories |
| `/service-listings` | ServiceListingsPage | CRUD + approval for listings |
| `/service-bookings` | ServiceBookingsPage | View + refund bookings |

### Sidebar Addition
Under a new "Services" group in the sidebar:
- Service Categories (Tags icon)
- Service Listings (ShoppingBag icon)
- Service Bookings (Receipt icon)

### Owner Portal Addition
- "My Services" page (mirrors owner-venues pattern)
- Service analytics section

## Payment Flow Sequence

```
User taps "Buy Now"
    │
    ▼
POST /api/service-bookings/create-order
    ├── Validate stock (quantity_available >= requested)
    ├── Calculate amount (price × qty − subscriber discount)
    ├── Create Razorpay order (receipt: service_{timestamp})
    ├── Create pending service_booking record
    └── Return { order, booking, listing }
    │
    ▼
App opens Razorpay WebView checkout
    │
    ├── Success → POST /api/service-bookings/verify-payment
    │               ├── Verify HMAC signature
    │               ├── Update booking: status=confirmed, payment_id, signature
    │               ├── Decrement quantity_available (atomic)
    │               ├── Create notification + push
    │               └── Return { success, booking }
    │               │
    │               ▼
    │           App navigates to /service-booking-confirmed (router.replace)
    │
    ├── Cancel → Show toast "Payment cancelled"
    │
    └── Failed → Show toast "Payment failed"

Webhook (async backup):
    Razorpay → POST /api/webhooks/razorpay
        ├── Check receipt prefix
        ├── If "service_" → handleServicePaymentCaptured/Failed/Refunded
        └── If "booking_" → existing venue handler (unchanged)
```

## Key Design Decisions

1. **Separate tables** — Services don't share tables with venues. This prevents schema pollution and allows independent evolution.
2. **Same owner model** — Owners manage both venues and services from one account. No new auth system needed.
3. **Receipt prefix routing** — Razorpay webhooks use order receipt prefix (`service_` vs `booking_`) to route to the correct handler without modifying existing venue webhook logic.
4. **Atomic stock management** — Quantity checks and decrements happen in the same transaction to prevent overselling.
5. **Mirror UI patterns** — Service detail page reuses the same visual structure as venue detail (carousel, sections, bottom bar) for consistency.
6. **Sub-tabs over merged lists** — My Bookings uses sub-tabs rather than a merged list because venue and service bookings have fundamentally different data shapes.
7. **Per-listing discount** — Subscriber discount is configured per listing (0-50%) rather than globally, giving admins flexibility.

## Files to Create/Modify

### Backend (admin/server/)
- `db/schema.js` — Add 5 new table definitions + relations
- `drizzle/0003_service_marketplace.sql` — Migration SQL
- `index.js` — Add ~15 new API endpoints + webhook routing
- `seed-service-categories.js` — Seed the 9 categories

### Mobile App (root)
- `lib/serviceTypes.ts` — New type definitions
- `lib/serviceApi.ts` — New API functions
- `store/serviceStore.ts` — Browse/detail state
- `store/serviceBookingStore.ts` — Booking state
- `store/serviceReviewStore.ts` — Review state
- `store/serviceFavoritesStore.ts` — Favorites state
- `app/service-listings.tsx` — Browse screen
- `app/service-detail.tsx` — Detail page
- `app/service-booking-confirmed.tsx` — Confirmation
- `app/view-service-booking.tsx` — Booking detail
- `app/write-service-review.tsx` — Write review
- `app/service-reviews.tsx` — All reviews
- `app/(tabs)/home.tsx` — Add toggle + service categories
- `app/(tabs)/my-bookings.tsx` — Add sub-tabs
- `app/(tabs)/search.tsx` — Unified search
- `app/(tabs)/favorites.tsx` — Service favorites
- `app/_layout.tsx` — Register new screens

### Admin Panel (admin/src/)
- `features/service-categories/index.tsx` — Category management
- `features/service-listings/index.tsx` — Listing management
- `features/service-bookings/index.tsx` — Booking management
- `features/owner-portal/owner-services.tsx` — Owner service management
- `routes/_authenticated/service-categories/index.tsx` — Route
- `routes/_authenticated/service-listings/index.tsx` — Route
- `routes/_authenticated/service-bookings/index.tsx` — Route
- `components/layout/data/sidebar-data.ts` — Add Services section
- `lib/api.ts` — Add service API functions
