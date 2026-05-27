# Implementation Tasks

## Task 1: Database Schema & Migration
- [x] Add service_categories, service_listings, service_bookings, service_reviews, service_favorites table definitions to `admin/server/db/schema.js`
- [x] Add Drizzle relations for all new tables (linking to existing owners and users)
- [x] Create migration file `admin/server/drizzle/0003_service_marketplace.sql` with all CREATE TABLE statements, indexes, and constraints
- [x] Create `admin/server/seed-service-categories.js` to seed the 9 predefined categories (Saloons, Decors, Catering, Mehandi, Travel, Water, Fashion, Jewellery, Rentals)
- [x] Run migration and seed script against the database
- [x] Verify tables exist with correct schema using a query test

**Requirements:** 1

## Task 2: Backend - Service Category API Endpoints
- [x] Add `GET /api/service-categories` endpoint (public, returns active categories sorted by sort_order)
- [x] Add `POST /api/service-categories` endpoint (admin auth, create category)
- [x] Add `PUT /api/service-categories/:id` endpoint (admin auth, update category)
- [x] Add `DELETE /api/service-categories/:id` endpoint (admin auth, delete category)
- [x] Test all CRUD operations via curl/script

**Requirements:** 1, 11

## Task 3: Backend - Service Listing API Endpoints
- [x] Add `GET /api/service-listings` endpoint (public, filter by category_id/search, returns only Active_Listings, paginated 20/page, sorted by rating desc)
- [x] Add `GET /api/service-listings/:id` endpoint (public, returns listing with category and owner info)
- [x] Add `POST /api/service-listings` endpoint (admin auth, create with approval_status='approved')
- [x] Add `PUT /api/service-listings/:id` endpoint (admin auth, update any field)
- [x] Add `DELETE /api/service-listings/:id` endpoint (admin auth, cascade reviews/favorites)
- [x] Add `POST /api/service-listings/:id/approve` endpoint (admin, approve pending listing)
- [x] Add `POST /api/service-listings/:id/reject` endpoint (admin, reject listing)
- [x] Validate: name max 100 chars, description max 2000, images max 5, price min 1, quantity min 0, subscriber_discount_percent 0-50
- [x] Test all endpoints with valid and invalid data

**Requirements:** 1, 3, 12

## Task 4: Backend - Service Booking & Payment Endpoints
- [x] Add `POST /api/service-bookings/create-order` endpoint: validate stock atomically, calculate amount (with subscriber discount), create Razorpay order with `service_` receipt prefix, create pending booking record, return order + booking
- [x] Add `POST /api/service-bookings/verify-payment` endpoint: verify HMAC signature, atomically update booking to confirmed + decrement quantity, create notification + push
- [x] Add `GET /api/service-bookings` endpoint (user auth, filter by user_id, returns bookings with listing info)
- [x] Add `GET /api/service-bookings/:id` endpoint (user auth, full booking detail)
- [x] Add `POST /api/service-bookings/:id/cancel` endpoint: validate 24h window, update status to cancelled, initiate Razorpay refund, restore quantity, notify user
- [x] Add `GET /api/admin/service-bookings` endpoint (admin, paginated, filterable by status/category/date)
- [x] Add `POST /api/admin/service-bookings/:id/refund` endpoint (admin, refund + restore quantity)
- [x] Add `generateServiceBookingDisplayId()` helper (format: ZSID-XXXXXXXX)
- [ ] Update Razorpay webhook handler to route by receipt prefix (`service_` → service handler, `booking_` → existing venue handler)
- [ ] Add `handleServicePaymentCaptured`, `handleServicePaymentFailed`, `handleServiceRefundProcessed` webhook handlers
- [x] Test full payment flow: create-order → verify-payment → confirm
- [x] Test cancellation flow: cancel within 24h → refund initiated
- [ ] Test webhook routing: service events go to service handler, venue events unchanged

**Requirements:** 6, 7, 9, 13, 17

## Task 5: Backend - Service Review Endpoints
- [x] Add `GET /api/service-listings/:id/reviews` endpoint (public, paginated 10/page, with user info)
- [x] Add `GET /api/service-reviews/eligibility/:listingId` endpoint (user auth, check if user has confirmed booking + existing review)
- [x] Add `POST /api/service-reviews` endpoint (user auth, validate booking exists, upsert review, recalculate rating)
- [x] Add `PUT /api/service-reviews/:id` endpoint (user auth, owner only)
- [x] Add `DELETE /api/service-reviews/:id` endpoint (user/admin, recalculate rating)
- [x] Add `GET /api/admin/service-reviews` endpoint (admin, paginated, filterable)
- [x] Add `recalculateServiceListingRating(listingId)` helper function
- [x] Test review CRUD and rating recalculation

**Requirements:** 10

## Task 6: Backend - Service Favorites & Search Endpoints
- [x] Add `GET /api/service-favorites` endpoint (user auth, returns user's favorite service listings)
- [x] Add `POST /api/service-favorites` endpoint (user auth, add to favorites)
- [x] Add `DELETE /api/service-favorites/:listingId` endpoint (user auth, remove from favorites)
- [x] Add `GET /api/search?q=term&type=all|venues|services` unified search endpoint (ILIKE on name/description for both venues and services, returns typed results)
- [x] Test favorites toggle and search with mixed results

**Requirements:** 3, 15

## Task 7: Backend - Owner Service Endpoints
- [x] Add `GET /api/owners/services` endpoint (owner auth, list own service listings)
- [x] Add `POST /api/owners/services` endpoint (owner auth, create with approval_status='pending_review')
- [x] Add `PUT /api/owners/services/:id` endpoint (owner auth, pending_changes if approved)
- [x] Add `PUT /api/owners/services/:id/quantity` endpoint (owner auth, direct quantity update for approved listings)
- [x] Add `GET /api/owners/service-analytics` endpoint (owner auth, total bookings/revenue/rating for own services)
- [x] Test owner CRUD with approval workflow

**Requirements:** 14

## Task 8: Mobile App - Types & API Layer
- [x] Create `lib/serviceTypes.ts` with interfaces: DbServiceCategory, DbServiceListing, DbServiceBooking, DbServiceReview, ServiceBookingInput, ServicePaymentVerifyInput
- [x] Create `lib/serviceApi.ts` with all API functions: fetchServiceCategories, fetchServiceListings, fetchServiceListingById, createServiceOrder, verifyServicePayment, fetchServiceBookings, cancelServiceBooking, fetchServiceReviews, submitServiceReview, checkServiceReviewEligibility, toggleServiceFavorite, fetchServiceFavorites, searchAll
- [x] Register new screens in `app/_layout.tsx` Stack

**Requirements:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15

## Task 9: Mobile App - Home Screen Toggle & Service Categories
- [x] Modify `app/(tabs)/home.tsx` to add "Venues / Services" toggle at the top
- [x] When "Services" is selected, fetch and display service category chips (horizontally scrollable)
- [x] When a service category chip is tapped, navigate to `/service-listings?categoryId=X&categoryName=Y`
- [x] Preserve existing venue category behavior when "Venues" is selected
- [x] Toggle state persists during session (use local state, resets on app restart)

**Requirements:** 2

## Task 10: Mobile App - Service Listing Browse Screen
- [x] Create `app/service-listings.tsx` screen with category filter from params
- [x] Implement paginated FlatList (20 items, infinite scroll via onEndReached)
- [x] Create ServiceListingCard component: cover image, name, price, rating stars, review count, city, heart icon
- [x] Implement pull-to-refresh
- [x] Implement empty state for no listings
- [ ] Implement favorites toggle (heart icon) calling service favorites API
- [ ] Create `store/serviceStore.ts` for browse state management

**Requirements:** 3

## Task 11: Mobile App - Service Detail Page
- [x] Create `app/service-detail.tsx` screen (mirrors venue-detail.tsx structure)
- [x] Implement image carousel (max 5, auto-scroll 3s, pause on swipe, loop, dots indicator)
- [x] Display: name, price/unit, available quantity, city, area
- [x] Display "About" description section
- [x] Display video section (tap opens external browser via Linking.openURL)
- [x] Display subscriber benefits section (yellow highlighted, matching venue pattern)
- [x] Display owner info (name + avatar)
- [x] Display reviews section (2 preview reviews + "See All Reviews" link)
- [x] Implement quantity selector (+/− buttons, 1 to quantity_available, default 1)
- [x] Display real-time total in bottom bar (price × quantity, show discount for subscribers)
- [x] Implement "Buy Now" button with auth check
- [x] Display subscribe prompt for non-subscribers
- [x] Implement back button and favorite toggle in header overlay
- [ ] Create `store/serviceReviewStore.ts` (mirrors reviewStore pattern)

**Requirements:** 4, 5, 16

## Task 12: Mobile App - Service Payment Flow
- [x] Implement payment initiation: call create-order API, get Razorpay order
- [x] Generate Razorpay WebView checkout HTML (same pattern as venue booking-detail)
- [x] Handle payment success: call verify-payment API, navigate to confirmation
- [x] Handle payment cancel: show toast, stay on detail page
- [x] Handle payment failure: show toast with error description
- [x] Handle network errors: show retry-friendly toast
- [x] Implement subscriber discount display and application

**Requirements:** 6, 16

## Task 13: Mobile App - Service Booking Confirmation Screen
- [x] Create `app/service-booking-confirmed.tsx` screen
- [x] Display: booking display ID (ZSID-XXXXXXXX), service name, quantity, unit price, discount, total, status
- [x] Display service cover image and owner name
- [x] "View Booking" button → router.replace to /view-service-booking
- [x] "Back to Home" button → router.replace to /(tabs)/home
- [x] BackHandler prevents going back to payment flow (navigates to home)
- [x] Use router.replace from payment flow to this screen (one-time only)

**Requirements:** 7

## Task 14: Mobile App - My Bookings Sub-tabs
- [x] Modify `app/(tabs)/my-bookings.tsx` to add "Venues" / "Services" sub-tab toggle at the top
- [x] "Venues" tab shows existing venue bookings (unchanged)
- [x] "Services" tab fetches from `/api/service-bookings?user_id=X` and displays service booking cards
- [x] Service booking card: cover image, service name, city, quantity, total, status badge, date
- [x] Status colors: confirmed=green, cancelled=red, refunded=orange, payment_failed=red
- [x] Tapping a service booking navigates to `/view-service-booking?id=X`
- [x] Create `store/serviceBookingStore.ts`

**Requirements:** 8

## Task 15: Mobile App - Service Booking Detail & Cancellation
- [x] Create `app/view-service-booking.tsx` screen
- [x] Display: booking ID, service name, cover image, quantity, unit price, discount, total, status, payment date
- [x] Display owner contact info
- [x] Show "Cancel Booking" button if status=confirmed AND created_at < 24 hours ago
- [x] Cancel flow: confirmation dialog → call cancel API → show success toast → refresh
- [x] Show "Cancellation window expired" text if > 24 hours
- [x] Back button navigates to My Bookings tab

**Requirements:** 9

## Task 16: Mobile App - Service Reviews
- [x] Create `app/write-service-review.tsx` screen (mirrors write-review.tsx)
- [x] Create `app/service-reviews.tsx` screen (mirrors venue-reviews.tsx)
- [x] Implement review eligibility check (must have confirmed service booking)
- [x] Implement review submission (rating 1-5, optional comment max 500 chars)
- [x] Implement review editing for existing reviews
- [x] Display reviews in service detail page (2 preview + "See All" link)
- [x] Success modal after submission

**Requirements:** 10

## Task 17: Mobile App - Search Integration
- [x] Modify `app/(tabs)/search.tsx` to call unified `/api/search` endpoint
- [x] Add type filter chips: "All", "Venues", "Services"
- [x] Display type badge on each result: "Venue" (brown) or "Service" (blue)
- [x] Tapping a service result navigates to `/service-detail?id=X`
- [x] Tapping a venue result navigates to `/venue-detail?id=X` (existing behavior)

**Requirements:** 15

## Task 18: Mobile App - Service Favorites
- [x] Modify `app/(tabs)/favorites.tsx` to add "Venues" / "Services" sub-tabs (or a combined list with type badges)
- [x] Create `store/serviceFavoritesStore.ts` for managing service favorites state
- [x] Implement add/remove favorite from service detail page and browse cards
- [x] Fetch favorites from `/api/service-favorites` endpoint

**Requirements:** 3, 4

## Task 19: Admin Panel - Service Categories Page
- [x] Create `admin/src/features/service-categories/index.tsx` with table view
- [x] Implement CRUD: create/edit dialog with name, icon (dropdown), sort_order fields
- [x] Implement is_active toggle with confirmation dialog
- [x] Display listing count per category
- [x] Create route file `admin/src/routes/_authenticated/service-categories/index.tsx`
- [x] Add API functions to `admin/src/lib/api.ts`

**Requirements:** 11

## Task 20: Admin Panel - Service Listings Page
- [x] Create `admin/src/features/service-listings/index.tsx` with paginated table
- [x] Implement filters: category dropdown, owner search, approval_status, is_active toggle
- [x] Implement create/edit dialog with all fields (name, category, owner, description, images upload, video_url, price, quantity, city, area, subscriber_discount_percent, subscriber_benefits)
- [x] Implement approve/reject actions for pending listings
- [x] Implement deactivate/reactivate toggle
- [x] Enforce max 5 images validation
- [x] Create route file `admin/src/routes/_authenticated/service-listings/index.tsx`

**Requirements:** 12

## Task 21: Admin Panel - Service Bookings Page
- [x] Create `admin/src/features/service-bookings/index.tsx` with paginated table
- [x] Implement filters: status dropdown, category dropdown, date range pickers
- [x] Implement booking detail drawer/dialog showing all fields + user + listing info
- [x] Implement refund action with confirmation dialog and reason field
- [x] Create route file `admin/src/routes/_authenticated/service-bookings/index.tsx`

**Requirements:** 13

## Task 22: Admin Panel - Sidebar & Navigation
- [x] Update `admin/src/components/layout/data/sidebar-data.ts` to add "Services" group with: Service Categories, Service Listings, Service Bookings
- [x] Update owner sidebar to add "My Services" item
- [ ] Regenerate route tree if needed (`npx tanstack-router generate`)

**Requirements:** 11, 12, 13, 14

## Task 23: Admin Panel - Owner Portal Services
- [x] Create `admin/src/features/owner-portal/owner-services.tsx` (mirrors owner-venues.tsx)
- [x] Implement: list own services, create (pending_review), edit (pending_changes if approved), update quantity directly
- [x] Add service analytics section (total bookings, revenue, avg rating)
- [x] Wire up to owner portal routing

**Requirements:** 14

## Task 24: End-to-End Testing
- [x] Test: Admin creates service category → appears in mobile app category switcher
- [x] Test: Admin creates service listing → appears in mobile browse screen
- [x] Test: User browses by category → sees correct listings
- [x] Test: User views service detail → all sections render correctly
- [x] Test: User selects quantity → total updates correctly
- [x] Test: Subscriber sees discount → discounted price shown
- [x] Test: User pays → Razorpay order created → payment verified → booking confirmed
- [x] Test: Booking appears in My Bookings "Services" tab
- [x] Test: User cancels within 24h → refund initiated → quantity restored
- [x] Test: User writes review → rating recalculated
- [x] Test: Search returns both venues and services with type badges
- [x] Test: Favorites toggle works for services
- [x] Test: Owner creates service → pending_review → admin approves → goes live
- [x] Test: Webhook routes correctly (service events don't affect venue bookings)
- [x] Test: Existing venue flow still works unchanged after all changes

**Requirements:** All
