# Implementation Plan: Customer Review System

## Overview

This plan implements the Customer Review System across the backend (Fastify + Drizzle), mobile app (Expo/React Native), and admin panel (React + TanStack Router). Tasks are ordered by dependency — backend first, then mobile app, then admin panel.

## Tasks

- [x] 1. Create reviews database schema and migration
  - Add `reviews` table definition to `admin/server/db/schema.js` with columns: id (UUID), venue_id (FK to venues), user_id (FK to users), rating (integer), comment (text nullable), created_at, updated_at
  - Add unique constraint on (venue_id, user_id) combination
  - Add indexes on venue_id and user_id columns
  - Add `reviewsRelations` to schema.js defining relations to venues and users
  - Update `venuesRelations` to include `reviews: many(reviews)`
  - Update `usersRelations` to include `reviews: many(reviews)`
  - Create Drizzle migration file `admin/server/drizzle/0002_add_reviews_table.sql`
  - Run migration against the database to create the table

- [x] 2. Implement review backend API routes
  - Add `POST /api/reviews` route (authenticated) that validates rating (1-5), checks booking eligibility, inserts review, and triggers rating aggregation in a single transaction
  - Add `GET /api/venues/:id/reviews` route that returns paginated reviews with user info (full_name, avatar_url), accepting `page` and `limit` query params
  - Add `GET /api/reviews/eligibility/:venueId` route (authenticated) that checks if user has a qualifying booking and returns existing review if any
  - Add `PUT /api/reviews/:id` route (authenticated) that allows the original reviewer to update rating/comment and recalculates venue rating
  - Add `DELETE /api/reviews/:id` route (authenticated) that allows original reviewer or admin to delete and recalculates venue rating
  - Add `GET /api/admin/reviews` route (admin authenticated) that returns all reviews with venue name and user name, supporting filters and pagination
  - Implement rating aggregation helper function that recalculates `venues.rating` and `venues.review_count` within the same database transaction

- [x] 3. Add review TypeScript types to mobile app
  - Add `DbReview` interface to `lib/types.ts` with id, venue_id, user_id, rating, comment, created_at, updated_at, and optional user object
  - Add `ReviewEligibility` interface with eligible boolean and existing_review field
  - Add `ReviewsResponse` interface with reviews array and pagination metadata
  - Add `PendingReview` interface for offline sync with localId, status, retryCount fields

- [x] 4. Create review API functions in mobile app
  - Create `lib/reviewApi.ts` with `submitReview(venueId, rating, comment)` function calling POST /api/reviews
  - Add `fetchVenueReviews(venueId, page, limit)` function calling GET /api/venues/:id/reviews
  - Add `checkReviewEligibility(venueId)` function calling GET /api/reviews/eligibility/:venueId
  - Add `updateReview(reviewId, rating, comment)` function calling PUT /api/reviews/:id
  - Add `deleteReview(reviewId)` function calling DELETE /api/reviews/:id

- [x] 5. Build StarRating and StarDisplay components
  - Create `components/StarRating.tsx` - interactive star input component with 5 touchable stars, using Star icon from lucide-react-native, filled with Colors.primary when selected
  - Create `components/StarDisplay.tsx` - read-only star display component accepting a rating value (1-5), rendering filled/empty stars at configurable size
  - Ensure both components use the app's brown/maroon theme color (Colors.primary)

- [x] 6. Build ReviewCard component
  - Create `components/ReviewCard.tsx` displaying user avatar (or placeholder), full name, star rating (StarDisplay), comment text, and relative timestamp
  - Implement comment truncation at 150 characters with "Read more" indicator
  - Add relative time formatting (e.g., "2 days ago", "1 week ago")
  - Add "pending sync" visual indicator for reviews with pending_sync status
  - Style component to match app theme (Colors.primary, Colors.text, Colors.textSecondary)

- [x] 7. Create write review screen
  - Create `app/write-review.tsx` accepting `venueId` route param
  - On mount, call `checkReviewEligibility(venueId)` to verify booking and fetch existing review
  - Display venue name at top for context
  - Render StarRating component for rating input
  - Render TextInput for comment with 500 character limit and live counter
  - If existing review found, pre-populate form fields for editing
  - On submit: validate rating is selected, call submitReview or updateReview
  - Show success toast and navigate back to venue detail on success
  - Show inline error message on failure, preserve form data for retry
  - If user is not eligible, display "booking required" message and disable form

- [x] 8. Create venue reviews list screen
  - Create `app/venue-reviews.tsx` accepting `venueId` route param
  - Implement FlatList with infinite scroll pagination (10 reviews per page)
  - Display ReviewCard for each review
  - Show loading indicator during initial fetch and page loads
  - Show empty state message when no reviews exist
  - Show inline error with "Retry" button on pagination failure
  - Add header with venue name and total review count

- [x] 9. Integrate reviews section into venue detail screen
  - Add reviews section to `app/venue-detail.tsx` below amenities/description
  - Fetch first 3 reviews for the venue on screen load
  - Display up to 3 ReviewCard components
  - Show "See All Reviews (X)" button when review_count > 3, navigating to venue-reviews screen
  - Show "Write a Review" button if user is authenticated and eligible
  - Hide "Write a Review" button for unauthenticated users
  - Display "No reviews yet" message when venue has zero reviews
  - Register new routes in `app/_layout.tsx` for write-review and venue-reviews screens

- [x] 10. Implement offline review sync engine
  - Create `lib/reviewSync.ts` with AsyncStorage-based queue for pending reviews
  - Implement `queueReview(review)` function that saves review with "pending_sync" status
  - Implement `syncPendingReviews()` function that processes queue in FIFO order
  - Add exponential backoff retry logic (2s, 4s, 8s) for server errors (5xx)
  - Mark reviews as "sync_failed" after 3 failed attempts or on client errors (4xx)
  - Update review status to "synced" and store server ID on success
  - Integrate with NetInfo to trigger sync on connectivity restore
  - Call syncPendingReviews on app foreground (AppState listener)
  - Update write-review screen to use sync engine when offline

- [x] 11. Add review API functions to admin panel
  - Add `fetchAdminReviews(params)` function to `admin/src/lib/api.ts` calling GET /api/admin/reviews with filter params
  - Add `deleteAdminReview(id)` function calling DELETE /api/reviews/:id
  - Define TypeScript interfaces for admin review data in the admin panel

- [x] 12. Build admin panel reviews page
  - Create route file `admin/src/routes/_authenticated/reviews/index.tsx`
  - Create `admin/src/features/reviews/index.tsx` page component with paginated table (20 per page)
  - Create `admin/src/features/reviews/components/reviews-table.tsx` with columns: Venue, Reviewer, Rating, Comment, Date, Actions
  - Create `admin/src/features/reviews/components/review-filters.tsx` with venue name search, rating dropdown (1-5), and date range picker
  - Create `admin/src/features/reviews/components/delete-review-dialog.tsx` confirmation dialog
  - Wire delete action to call API and refresh table on success
  - Add "Reviews" navigation item to admin sidebar

- [x] 13. End-to-end testing and polish
  - Test review submission flow: create booking → write review → verify rating updates on venue
  - Test edit flow: submit review → navigate back → tap "Write a Review" → verify form pre-populated → update → verify changes
  - Test eligibility: attempt review without booking → verify error message shown
  - Test offline flow: disable network → submit review → verify queued → enable network → verify synced
  - Test admin moderation: view reviews list → apply filters → delete review → verify venue rating recalculated
  - Test pagination: create multiple reviews → verify infinite scroll loads correctly
  - Verify unique constraint: attempt duplicate review → verify upsert/edit behavior

## Task Dependency Graph

```json
{
  "waves": [
    {"wave": 1, "tasks": [1]},
    {"wave": 2, "tasks": [2]},
    {"wave": 3, "tasks": [3, 5, 11]},
    {"wave": 4, "tasks": [4, 6]},
    {"wave": 5, "tasks": [7, 8, 12]},
    {"wave": 6, "tasks": [9, 10]},
    {"wave": 7, "tasks": [13]}
  ]
}
```

- Wave 1: Database schema and migration (no dependencies)
- Wave 2: Backend API routes (depends on schema)
- Wave 3: Types, star components, and admin API functions (depend on API routes)
- Wave 4: Mobile API functions and ReviewCard (depend on types and star components)
- Wave 5: Write review screen, reviews list screen, and admin page (depend on API functions and components)
- Wave 6: Venue detail integration and offline sync (depend on screens)
- Wave 7: End-to-end testing (depends on all above)

## Notes

- The `venues` table already has `rating` (real) and `review_count` (integer) columns — no schema change needed for those fields
- The backend uses Fastify with `@fastify/jwt` for auth — review routes follow the same `preHandler: [fastify.authenticate]` pattern
- The mobile app uses Axios with AsyncStorage-based JWT interceptor — review API functions follow the same pattern as existing `lib/api.ts`
- The admin panel uses TanStack Router file-based routing and shadcn/ui — the reviews page follows the same pattern as existing features (venues, bookings, users)
- NetInfo package (`@react-native-community/netinfo`) may need to be installed for offline sync detection
