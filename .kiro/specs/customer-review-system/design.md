# Technical Design: Customer Review System

## Overview

This document describes the technical design for the Customer Review System in the Zvenue app. The system enables authenticated users who have completed bookings to submit star ratings and text reviews for venues, with offline support, backend sync, and admin moderation. The design integrates with the existing Fastify backend, Drizzle ORM schema, Expo mobile app, and React admin panel.

## Architecture

The review system follows the existing architecture patterns:
- **Backend:** New review routes added to the Fastify server (`admin/server/index.js`), new `reviews` table in Drizzle schema
- **Mobile App:** New screens (`write-review.tsx`, `venue-reviews.tsx`) and a `ReviewCard` component integrated into the venue detail screen, with a sync engine using AsyncStorage
- **Admin Panel:** New reviews feature module with a route at `/_authenticated/reviews/` using TanStack Router and shadcn/ui components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile App (Expo)                         │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────────┐ │
│  │  Venue   │  │ Write Review │  │    Venue Reviews List     │ │
│  │  Detail  │──│   Screen     │  │    (Paginated Screen)     │ │
│  │  Screen  │  └──────┬───────┘  └───────────────────────────┘ │
│  └────┬─────┘         │                                        │
│       │                │                                        │
│  ┌────▼────────────────▼──────────────────────────────────────┐ │
│  │              Review Sync Engine (lib/reviewSync.ts)         │ │
│  │  - Queue reviews in AsyncStorage when offline              │ │
│  │  - Auto-sync on connectivity restore                       │ │
│  │  - Exponential backoff retry (2s, 4s, 8s)                  │ │
│  └────────────────────────┬───────────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTP (Axios)
┌───────────────────────────▼─────────────────────────────────────┐
│                    Backend (Fastify Server)                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Review API Routes                          │ │
│  │  POST   /api/reviews              (create)                 │ │
│  │  GET    /api/venues/:id/reviews   (list paginated)         │ │
│  │  GET    /api/reviews/user/:userId (user's reviews)         │ │
│  │  PUT    /api/reviews/:id          (update)                 │ │
│  │  DELETE /api/reviews/:id          (delete)                 │ │
│  │  GET    /api/reviews/eligibility/:venueId (check booking)  │ │
│  └────────────────────────┬───────────────────────────────────┘ │
│                           │                                      │
│  ┌────────────────────────▼───────────────────────────────────┐ │
│  │              Rating Aggregator (inline in routes)           │ │
│  │  - Recalculates avg rating + count in same transaction     │ │
│  │  - Updates venues.rating and venues.review_count           │ │
│  └────────────────────────┬───────────────────────────────────┘ │
│                           │                                      │
│  ┌────────────────────────▼───────────────────────────────────┐ │
│  │              PostgreSQL (Neon Serverless)                   │ │
│  │  reviews table + indexes + unique constraint               │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    Admin Panel (React + TanStack Router)          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Reviews Page (/_authenticated/reviews/)                   │  │
│  │  - Paginated table with filters (venue, rating, date)      │  │
│  │  - Delete with confirmation dialog                         │  │
│  │  - Rating recalculation on delete                          │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Backend API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/reviews` | POST | User JWT | Create/submit a review |
| `/api/venues/:id/reviews` | GET | None | Get paginated reviews for a venue |
| `/api/reviews/eligibility/:venueId` | GET | User JWT | Check if user can review a venue |
| `/api/reviews/:id` | PUT | User JWT (owner) | Update own review |
| `/api/reviews/:id` | DELETE | User JWT (owner/admin) | Delete a review |
| `/api/admin/reviews` | GET | Admin JWT | List all reviews with filters |

### POST /api/reviews

**Request Body:**
```json
{
  "venue_id": "uuid",
  "rating": 4,
  "comment": "Great venue, loved the ambiance!"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "venue_id": "uuid",
  "user_id": "uuid",
  "rating": 4,
  "comment": "Great venue, loved the ambiance!",
  "created_at": "2026-05-27T10:00:00Z",
  "updated_at": "2026-05-27T10:00:00Z"
}
```

### GET /api/venues/:id/reviews

**Query Params:** `page` (default 1), `limit` (default 10, max 50)

**Response (200):**
```json
{
  "reviews": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Amazing place!",
      "created_at": "2026-05-25T10:00:00Z",
      "user": {
        "id": "uuid",
        "full_name": "John Doe",
        "avatar_url": "https://..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

### GET /api/reviews/eligibility/:venueId

**Response (200):**
```json
{
  "eligible": true,
  "existing_review": null
}
```

### Mobile App Components

| File | Purpose |
|------|---------|
| `app/write-review.tsx` | Review submission/edit screen |
| `app/venue-reviews.tsx` | Full paginated reviews list for a venue |
| `components/ReviewCard.tsx` | Reusable review display component |
| `components/StarRating.tsx` | Interactive star rating input |
| `components/StarDisplay.tsx` | Read-only star display |
| `lib/reviewSync.ts` | Offline queue and sync engine |
| `lib/reviewApi.ts` | Review-specific API functions |

### Admin Panel Components

| File | Purpose |
|------|---------|
| `src/routes/_authenticated/reviews/index.tsx` | Route file |
| `src/features/reviews/index.tsx` | Reviews page component |
| `src/features/reviews/components/reviews-table.tsx` | Data table |
| `src/features/reviews/components/review-filters.tsx` | Filter controls |
| `src/features/reviews/components/delete-review-dialog.tsx` | Confirmation dialog |

### Review Sync Engine Interface

```typescript
interface PendingReview {
  localId: string;
  venueId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: 'pending_sync' | 'synced' | 'sync_failed';
  retryCount: number;
  serverId?: string;
}

// Key functions:
// queueReview(review): saves to AsyncStorage
// syncPendingReviews(): called on app foreground + connectivity change
// retryWithBackoff(review, attempt): 2s, 4s, 8s delays
```

## Data Models

### Reviews Table (PostgreSQL via Drizzle ORM)

```javascript
// admin/server/db/schema.js
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  venue_id: uuid('venue_id').references(() => venues.id, { onDelete: 'cascade' }).notNull(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  rating: integer('rating').notNull(),          // 1-5
  comment: text('comment'),                      // nullable, max 500 chars
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => ({
  venueIdx: index('reviews_venue_id_idx').on(table.venue_id),
  userIdx: index('reviews_user_id_idx').on(table.user_id),
  uniqueUserVenue: unique('reviews_user_venue_unique').on(table.venue_id, table.user_id),
}));
```

### Relations

```javascript
export const reviewsRelations = relations(reviews, ({ one }) => ({
  venue: one(venues, { fields: [reviews.venue_id], references: [venues.id] }),
  user: one(users, { fields: [reviews.user_id], references: [users.id] }),
}));
```

### Migration SQL

```sql
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "venue_id" uuid NOT NULL REFERENCES "venues"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "rating" integer NOT NULL,
  "comment" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX "reviews_venue_id_idx" ON "reviews" ("venue_id");
CREATE INDEX "reviews_user_id_idx" ON "reviews" ("user_id");
CREATE UNIQUE INDEX "reviews_user_venue_unique" ON "reviews" ("venue_id", "user_id");
```

### TypeScript Types (Mobile App)

```typescript
export interface DbReview {
  id: string;
  venue_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface ReviewEligibility {
  eligible: boolean;
  existing_review: DbReview | null;
}

export interface ReviewsResponse {
  reviews: DbReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## Error Handling

| Scenario | HTTP Code | Client Behavior |
|----------|-----------|-----------------|
| Missing/invalid rating | 400 | Show inline validation error |
| No booking for venue | 403 | Show "booking required" message |
| Unauthenticated | 401 | Redirect to login |
| Not review owner (update/delete) | 403 | Show permission error |
| Review not found | 404 | Show "not found" message |
| Server error | 500 | Queue for retry (offline engine) |
| Network timeout | - | Queue for retry (offline engine) |
| Venue not found | 400 | Show "venue not found" error |
| Duplicate review (unique constraint) | 409 | Redirect to edit existing review |

## Correctness Properties

### Property 1: Review Uniqueness
A user can only have one review per venue, enforced at the database level via a unique constraint on (venue_id, user_id). Duplicate attempts are handled gracefully by redirecting to edit.
**Validates: Requirements 7.2**

### Property 2: Transactional Rating Aggregation
Rating recalculation always happens in the same database transaction as the review mutation (insert, update, delete), preventing stale or inconsistent rating data.
**Validates: Requirements 4.4**

### Property 3: Eligibility Enforcement
Both client and server validate booking eligibility before allowing review submission. The server is the source of truth — client checks are for UX only.
**Validates: Requirements 2.1**

### Property 4: Ownership Enforcement
Only the review author can update their review. Only the author or an admin can delete a review. Enforced server-side via JWT identity comparison.
**Validates: Requirements 6.7**

### Property 5: Cascade Integrity
Deleting a user or venue automatically removes associated reviews via ON DELETE CASCADE, and the rating aggregation is triggered to update venue stats.
**Validates: Requirements 7.3**

### Property 6: Offline Sync Consistency
Pending reviews are displayed locally and synced in FIFO order. Conflicts are resolved by the server's unique constraint — if a review already exists, the sync engine treats it as an update.
**Validates: Requirements 5.2**

## Testing Strategy

- **Unit tests:** Rating aggregation logic (average calculation, edge cases with 0 reviews)
- **API integration tests:** All CRUD endpoints with valid/invalid inputs, auth checks, eligibility checks
- **Mobile component tests:** StarRating interaction, ReviewCard rendering, form validation
- **Offline sync tests:** Queue/dequeue behavior, retry logic, status transitions
- **End-to-end tests:** Full flow from booking → review submission → venue rating update → admin moderation
- **Edge cases:** Duplicate review attempt, review after booking cancellation, concurrent review submissions
