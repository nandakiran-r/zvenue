# Requirements Document

## Introduction

This feature introduces a Service Categories Marketplace to the ZVenue platform, enabling users to browse and directly purchase services across nine distinct categories: Saloons, Decors, Catering, Mehandi, Travel, Water, Fashion, Jewellery, and Rentals. Unlike the existing venue booking flow (which requires pre-booking and agent confirmation), service listings follow a fully automated direct-payment model: users select a service, choose quantity, pay the full amount via Razorpay, and receive instant booking confirmation. Each service listing mirrors the venue detail page UI pattern (image carousel, description, video, reviews, subscriber benefits, owner info) but is tailored for service-specific attributes like quantity and direct pricing. The admin panel and owner portal are extended to manage these service listings independently from venues.

## Glossary

- **Service_Listing**: A purchasable service item within a service category, containing images, price, quantity, description, video, subscriber benefits, owner info, and reviews.
- **Service_Category**: One of the nine top-level groupings for services (Saloons, Decors, Catering, Mehandi, Travel, Water, Fashion, Jewellery, Rentals), separate from venue categories.
- **Service_Booking**: A confirmed purchase of a Service_Listing, created automatically upon successful payment without agent intervention. Uses display ID format `ZSID-XXXXXXXX`.
- **Category_Switcher**: The horizontal scrollable chip UI on the home screen that allows navigation between Service_Categories, displayed below a "Venues / Services" top-level toggle.
- **Service_Detail_Page**: The mobile app screen displaying full details of a Service_Listing, following the same UI pattern as the venue detail page.
- **Service_Admin_Panel**: The section within the admin panel for managing Service_Listings, Service_Categories, and Service_Bookings.
- **Owner_Portal**: The existing owner-facing interface, extended to allow owners to create and manage their Service_Listings (same owner account manages both venues and services).
- **Payment_Gateway**: Razorpay integration used for processing direct full-amount payments for services. Service orders use receipt prefix `service_` to distinguish from venue bookings (`booking_`).
- **Subscriber**: A user with an active ₹49/month subscription who receives a percentage discount (configured per listing) on service purchases.
- **Booking_Details_Page**: The screen showing confirmation and details of a completed Service_Booking.
- **Active_Listing**: A Service_Listing where `is_active = true`, `approval_status = 'approved'`, `quantity_available > 0`, and its parent Service_Category `is_active = true`.

## Requirements

### Requirement 1: Service Category Data Model

**User Story:** As a platform administrator, I want service categories and service listings stored as separate entities from venues, so that services can be managed independently without affecting existing venue functionality.

#### Acceptance Criteria

1. THE Database SHALL store Service_Categories as a separate table (`service_categories`) with fields: id (uuid PK), name (varchar 255), icon (varchar 50), sort_order (integer), is_active (boolean, default true), and created_at (timestamp).
2. THE Database SHALL store Service_Listings as a separate table (`service_listings`) with fields: id (uuid PK), service_category_id (uuid FK), owner_id (uuid FK), name (varchar 255, max 100 chars), description (text, max 2000 chars), images (jsonb array, max 5 URLs), video_url (varchar 500, nullable), price (real, min 1), quantity_available (integer, min 0), city (varchar 255), area (varchar 255, nullable), subscriber_discount_percent (integer, 0-50, default 0), subscriber_benefits (jsonb array), rating (real, default 0), review_count (integer, default 0), is_active (boolean, default true), approval_status (varchar 50, default 'approved' for admin-created, 'pending_review' for owner-created), pending_changes (jsonb, nullable), owner_name (varchar 255), owner_image (text, nullable), and created_at (timestamp).
3. THE Database SHALL store Service_Bookings as a separate table (`service_bookings`) with fields: id (uuid PK), booking_id_display (varchar 13, unique, format `ZSID-XXXXXXXX`), service_listing_id (uuid FK), user_id (uuid FK), quantity (integer), unit_price (real), discount_applied (real, default 0), total_amount (real), payment_method (varchar 50, default 'razorpay'), order_id (varchar 255), payment_id (varchar 255), signature (varchar 500), status (varchar 50, default 'pending'), cancellation_reason (text, nullable), refunded_at (timestamp, nullable), created_at (timestamp).
4. THE Database SHALL store Service_Reviews as a separate table (`service_reviews`) with fields: id (uuid PK), service_listing_id (uuid FK), user_id (uuid FK), rating (integer, 1-5), comment (text, max 500 chars, nullable), created_at (timestamp), updated_at (timestamp), with a unique index on (service_listing_id, user_id).
5. THE Database SHALL store Service_Favorites as a separate table (`service_favorites`) with fields: id (uuid PK), service_listing_id (uuid FK), user_id (uuid FK), created_at (timestamp), with a unique index on (service_listing_id, user_id).
6. THE Database migration SHALL seed the nine predefined Service_Categories: Saloons, Decors, Catering, Mehandi, Travel, Water, Fashion, Jewellery, and Rentals with appropriate icons and sequential sort_order.
7. THE Database SHALL enforce foreign key relationships: Service_Listings → Service_Categories, Service_Listings → Owners, Service_Bookings → Service_Listings, Service_Bookings → Users, Service_Reviews → Service_Listings, Service_Reviews → Users, Service_Favorites → Service_Listings, Service_Favorites → Users.
8. THE Database SHALL use ON DELETE CASCADE for Service_Reviews and Service_Favorites when a Service_Listing is deleted, and ON DELETE SET NULL for Service_Bookings.

### Requirement 2: Home Screen Category Navigation

**User Story:** As a user, I want to switch between venues and services on the home screen, so that I can browse different types of offerings easily.

#### Acceptance Criteria

1. THE Home Screen SHALL display a top-level toggle with two options: "Venues" and "Services", defaulting to "Venues".
2. WHEN the user selects "Services", THE Home Screen SHALL display the Service_Category chips in a horizontally scrollable row below the toggle.
3. WHEN the user selects "Venues", THE Home Screen SHALL display the existing venue category chips (current behavior preserved).
4. THE Category_Switcher SHALL display only active Service_Categories (where `is_active = true`).
5. THE Category_Switcher SHALL display each Service_Category with its configured icon and name, ordered by sort_order ascending.
6. WHEN a user taps a Service_Category chip, THE App SHALL navigate to the Service Listing Browse Screen filtered to that category.
7. THE toggle state SHALL persist during the session but reset to "Venues" on app restart.

### Requirement 3: Service Listing Browse Screen

**User Story:** As a user, I want to browse service listings within a category, so that I can find and compare services before purchasing.

#### Acceptance Criteria

1. WHEN a user navigates to a Service_Category, THE App SHALL display a paginated list (20 items per page, infinite scroll) of all Active_Listings in that category.
2. THE App SHALL display each Service_Listing card with: cover image (first from images array), name, price (formatted as ₹X,XXX), rating stars, review count, and city.
3. THE App SHALL allow users to add/remove Service_Listings to/from favorites via a heart icon on each card.
4. THE App SHALL sort Service_Listings by rating descending as default, with secondary sort by review_count descending, then created_at descending for tie-breaking.
5. IF no Active_Listings exist in a category, THEN THE App SHALL display an empty state with an illustration and message "No services available in this category yet."
6. THE App SHALL support pull-to-refresh to reload the listing data.

### Requirement 4: Service Detail Page

**User Story:** As a user, I want to view complete details of a service listing, so that I can make an informed purchase decision.

#### Acceptance Criteria

1. THE Service_Detail_Page SHALL display an image carousel with a maximum of 5 images, auto-scrolling every 3 seconds with manual swipe support. Auto-scroll SHALL pause when the user manually swipes and resume after 5 seconds of inactivity. The carousel SHALL loop back to the first image after the last.
2. THE Service_Detail_Page SHALL display the service name, price per unit (₹ formatted), available quantity, city, and area.
3. THE Service_Detail_Page SHALL display an "About" section with the full service description.
4. WHEN a video_url is present, THE Service_Detail_Page SHALL display a video section with a tap-to-open button that opens the URL in the device's external browser (YouTube app or browser).
5. THE Service_Detail_Page SHALL display subscriber benefits in a highlighted yellow section matching the venue detail page pattern, showing the discount percentage and benefit list.
6. THE Service_Detail_Page SHALL display owner information including name and avatar image.
7. THE Service_Detail_Page SHALL display a reviews section showing up to 2 preview reviews with a "See All Reviews" link navigating to the full reviews screen.
8. THE Service_Detail_Page SHALL display a fixed bottom bar with the total price and a "Buy Now" button.
9. WHEN a user taps the "Buy Now" button without being logged in, THE App SHALL show an authentication prompt with "Log In" and "Cancel" options.
10. THE Service_Detail_Page SHALL display a back button and a favorite (heart) toggle in the image overlay header.

### Requirement 5: Quantity Selection and Pricing

**User Story:** As a user, I want to select the quantity of a service before purchasing, so that I can order the exact amount I need.

#### Acceptance Criteria

1. THE Service_Detail_Page SHALL display a quantity selector with increment (+) and decrement (−) buttons, allowing selection between 1 and the available quantity.
2. THE Service_Detail_Page SHALL display the calculated total price (unit_price × quantity) in the bottom bar, updated in real-time as quantity changes.
3. WHEN the user attempts to increase quantity beyond available stock, THE App SHALL cap the quantity at the maximum available.
4. WHEN the quantity is capped, THE App SHALL display a toast notification: "Maximum available quantity reached."
5. IF the user is a Subscriber, THE Service_Detail_Page SHALL display both the original total and the discounted total (with discount percentage shown), so the user sees the savings before purchasing.
6. THE quantity selector SHALL default to 1 when the page loads.

### Requirement 6: Direct Payment Flow

**User Story:** As a user, I want to pay the full amount directly through the payment gateway, so that my booking is confirmed instantly without waiting for agent approval.

#### Acceptance Criteria

1. WHEN a user initiates payment, THE Backend SHALL create a Razorpay order with receipt prefix `service_` for the payable amount (unit_price × quantity − subscriber_discount if applicable), in INR currency.
2. WHEN creating the order, THE Backend SHALL atomically check that `quantity_available >= requested_quantity`. IF insufficient stock, THE Backend SHALL return HTTP 400 with error "Insufficient stock. Only X items available."
3. THE Backend SHALL create a pending Service_Booking record with the order_id before presenting the payment UI.
4. WHEN the Razorpay payment is completed successfully, THE Backend SHALL verify the payment signature using HMAC-SHA256 with the Razorpay key secret.
5. WHEN payment verification succeeds, THE Backend SHALL atomically: (a) update Service_Booking status to "confirmed", (b) store payment_id and signature, (c) decrement quantity_available by the purchased quantity.
6. IF payment verification fails, THEN THE Backend SHALL set the Service_Booking status to "payment_failed" and NOT decrement quantity.
7. IF the user has an active subscription (status = 'active' or 'authenticated'), THE Backend SHALL apply the listing's `subscriber_discount_percent` to the total before creating the Razorpay order. THE Backend SHALL validate subscription status at payment time (not rely on client-side claims).
8. THE Payment_Gateway SHALL process payments without requiring any agent intervention or manual confirmation step.
9. IF the Payment_Gateway is unavailable or returns a timeout, THE App SHALL display an error toast "Payment could not be processed. Please try again." and allow the user to retry.
10. THE Backend webhook handler SHALL route Razorpay events to the correct handler based on order receipt prefix: orders starting with `service_` route to service booking handler, orders starting with `booking_` route to venue booking handler.

### Requirement 7: Service Booking Confirmation

**User Story:** As a user, I want to see my booking confirmation immediately after payment, so that I have proof of my purchase.

#### Acceptance Criteria

1. WHEN payment is confirmed, THE App SHALL navigate (using `router.replace`) to the Service Booking Confirmation screen displaying: booking display ID (ZSID-XXXXXXXX), service name, quantity purchased, unit price, discount applied (if any), total amount paid, and booking status "Confirmed".
2. THE Booking Confirmation screen SHALL display the service listing cover image and owner name.
3. THE Booking Confirmation screen SHALL display a "View Booking" button (navigates to service booking detail) and a "Back to Home" button (navigates to home).
4. THE hardware back button on the confirmation screen SHALL navigate to home (not back to payment flow).
5. WHEN a Service_Booking is confirmed, THE Backend SHALL create an in-app notification for the user with type `service_booking` and title "Service Booking Confirmed".
6. WHEN a Service_Booking is confirmed, THE Backend SHALL send a push notification to the user if they have a push_token registered.
7. THE App SHALL generate a unique booking display ID in format `ZSID-XXXXXXXX` (8 random digits) for each Service_Booking.

### Requirement 8: My Bookings Integration

**User Story:** As a user, I want to see all my bookings (venues and services) in one place, so that I can track my purchases easily.

#### Acceptance Criteria

1. THE "My Bookings" tab SHALL display two sub-tabs: "Venues" and "Services", defaulting to "Venues".
2. THE "Venues" sub-tab SHALL display existing venue bookings (current behavior preserved exactly).
3. THE "Services" sub-tab SHALL display all Service_Bookings for the logged-in user, sorted by created_at descending.
4. Each Service_Booking card SHALL display: service cover image, service name, city, quantity, total amount, status badge, and purchase date.
5. THE status badge SHALL use colors: confirmed = green, cancelled = red, refunded = orange, payment_failed = red.
6. WHEN a user taps a Service_Booking card, THE App SHALL navigate to the Service Booking Detail screen showing full booking information.
7. THE Backend SHALL provide a separate API endpoint `GET /api/service-bookings?user_id=X` for fetching user's service bookings.

### Requirement 9: Service Booking Cancellation

**User Story:** As a user, I want to cancel a service booking within a reasonable window, so that I can get a refund if my plans change.

#### Acceptance Criteria

1. THE Service Booking Detail screen SHALL display a "Cancel Booking" button for bookings with status "confirmed" that were created within the last 24 hours.
2. WHEN a user taps "Cancel Booking", THE App SHALL display a confirmation dialog: "Are you sure you want to cancel? A refund will be processed within 5-7 business days."
3. WHEN cancellation is confirmed, THE Backend SHALL update the Service_Booking status to "cancelled" and initiate a Razorpay refund for the full amount.
4. WHEN a refund is initiated, THE Backend SHALL restore the quantity_available on the Service_Listing by the cancelled quantity.
5. WHEN a refund is processed, THE Backend SHALL update the Service_Booking status to "refunded" and set refunded_at timestamp.
6. IF the 24-hour cancellation window has passed, THE App SHALL hide the "Cancel Booking" button and display text: "Cancellation window expired."
7. THE Backend SHALL send a push notification and in-app notification to the user when the refund is processed.

### Requirement 10: Service Reviews

**User Story:** As a user, I want to read and write reviews for service listings, so that I can share my experience and help other users make decisions.

#### Acceptance Criteria

1. THE Database SHALL enforce a unique constraint allowing only one review per user per Service_Listing.
2. WHEN a user has a confirmed Service_Booking for a listing, THE App SHALL allow the user to submit a review (rating 1-5, optional comment up to 500 characters).
3. WHEN a review is submitted, THE Backend SHALL recalculate the Service_Listing's average rating and review_count.
4. THE Service_Detail_Page SHALL display up to 2 preview reviews with user avatar, name, rating stars, comment snippet, and date.
5. THE "See All Reviews" link SHALL navigate to a full reviews screen (same UI pattern as venue reviews) with pagination (10 per page, infinite scroll).
6. THE App SHALL allow users to edit their existing review (update rating/comment) from the service detail page.
7. THE Backend SHALL provide endpoints: `POST /api/service-reviews`, `GET /api/service-listings/:id/reviews`, `PUT /api/service-reviews/:id`, `DELETE /api/service-reviews/:id`.

### Requirement 11: Admin Panel - Service Category Management

**User Story:** As an administrator, I want to manage service categories from the admin panel, so that I can control which categories are visible and their display order.

#### Acceptance Criteria

1. THE Admin Panel sidebar SHALL include a "Services" section with sub-items: "Service Categories", "Service Listings", "Service Bookings".
2. THE Service Categories page SHALL display a table of all Service_Categories with columns: name, icon, sort_order, active status, listing count, and actions.
3. THE Service Categories page SHALL allow administrators to create new Service_Categories with: name (required, max 50 chars), icon (required, from a predefined icon set), and sort_order (required, integer).
4. THE Service Categories page SHALL allow administrators to edit existing Service_Category name, icon, sort_order, and is_active status.
5. THE Service Categories page SHALL allow administrators to toggle is_active status, with a confirmation dialog when deactivating: "This will hide all listings in this category from the app."
6. WHEN a Service_Category is deactivated, THE mobile App SHALL exclude all Service_Listings within that category from browse and search results.

### Requirement 12: Admin Panel - Service Listing Management

**User Story:** As an administrator, I want to manage service listings from the admin panel, so that I can oversee all services on the platform.

#### Acceptance Criteria

1. THE Service Listings page SHALL display a paginated table (20 per page) with columns: image thumbnail, name, category, owner, price (₹ formatted), quantity, rating, approval status, and created date.
2. THE Service Listings page SHALL allow filtering by: category (dropdown), owner (search), approval_status (dropdown: all/pending/approved/rejected), and is_active (toggle).
3. THE Service Listings page SHALL allow administrators to create new Service_Listings with all fields: name (max 100 chars), category (required), owner (required, searchable dropdown), description (max 2000 chars), images (upload up to 5, accepted formats: jpg/png/webp, max 5MB each), video_url (optional, valid URL), price (required, min ₹1), quantity (required, min 1), city (required), area (optional), subscriber_discount_percent (0-50), subscriber_benefits (list of text items).
4. THE Service Listings page SHALL allow administrators to edit any field of an existing Service_Listing.
5. THE Service Listings page SHALL allow administrators to approve or reject owner-submitted listings (same workflow as venue approval).
6. THE Service Listings page SHALL allow administrators to deactivate/reactivate a Service_Listing.

### Requirement 13: Admin Panel - Service Booking Management

**User Story:** As an administrator, I want to view and manage service bookings, so that I can monitor transactions and handle disputes.

#### Acceptance Criteria

1. THE Service Bookings page SHALL display a paginated table (20 per page) with columns: booking display ID, user name, service name, quantity, total amount (₹ formatted), status badge, payment_id, and date.
2. THE Service Bookings page SHALL allow filtering by: status (all/confirmed/cancelled/refunded/payment_failed), category (dropdown), and date range (from/to date pickers).
3. THE Service Bookings page SHALL allow administrators to view full booking details in a detail drawer/dialog showing: all booking fields, user contact info, service listing info, and payment details.
4. THE Service Bookings page SHALL allow administrators to initiate a refund for confirmed bookings, with a confirmation dialog and reason field. Upon refund, the system SHALL update status to "refunded", restore quantity, and trigger Razorpay refund API.

### Requirement 14: Owner Portal - Service Listing Management

**User Story:** As a service owner, I want to create and manage my service listings through the owner portal, so that I can offer my services on the platform.

#### Acceptance Criteria

1. THE Owner_Portal sidebar SHALL include a "My Services" item (in addition to existing "My Venues").
2. THE "My Services" page SHALL display all Service_Listings owned by the logged-in owner with: name, category, price, quantity, rating, approval status, and actions.
3. THE Owner_Portal SHALL allow owners to create new Service_Listings with: name, category, description, images (max 5), video_url, price, quantity, city, area. Owner-created listings SHALL have `approval_status = 'pending_review'`.
4. THE Owner_Portal SHALL allow owners to edit their existing Service_Listings. IF the listing is already approved, edits SHALL be stored as `pending_changes` and `approval_status` set to `'pending_changes'` (same pattern as venue edits).
5. THE Owner_Portal SHALL allow owners to update available quantity directly (without approval) for their approved listings.
6. THE Owner_Portal SHALL display a "Service Analytics" section showing: total service bookings, total revenue, average rating, and monthly revenue chart.
7. THE same owner account SHALL be able to manage both venues and services without needing separate credentials.

### Requirement 15: Search Integration

**User Story:** As a user, I want to search for services across all categories, so that I can quickly find what I need.

#### Acceptance Criteria

1. THE Backend SHALL provide a unified search endpoint `GET /api/search?q=term` that returns both venues and Active_Listings matching the search term.
2. THE search SHALL match against Service_Listing name and description using case-insensitive partial matching (ILIKE).
3. THE App search results SHALL display a type badge on each result: "Venue" (brown) or "Service" (blue) to distinguish result types.
4. WHEN a user taps a service search result, THE App SHALL navigate to the Service_Detail_Page for that listing.
5. THE App SHALL support filtering search results by type: "All", "Venues", "Services".
6. THE search results SHALL be limited to 20 results per type, sorted by relevance (name match first, then description match).

### Requirement 16: Subscriber Benefits for Services

**User Story:** As a subscriber, I want to receive discounts and benefits when purchasing services, so that my subscription provides value across the platform.

#### Acceptance Criteria

1. WHILE a user has an active subscription, THE Service_Detail_Page SHALL display the subscriber discount percentage in the pricing section (e.g., "Subscribers save 15%") and show the discounted total alongside the original total.
2. WHILE a user has an active subscription, THE Backend SHALL apply the listing's `subscriber_discount_percent` to the total amount before creating the Razorpay order. The discount SHALL be stored in the Service_Booking's `discount_applied` field.
3. THE Service_Detail_Page SHALL display a subscribe prompt to non-subscribers showing: "Subscribe for ₹49/month and save X% on this service" with a "Subscribe Now" button.
4. THE Backend SHALL validate subscription status (checking `users.subscription_status` is 'active' or 'authenticated') at payment creation time. IF subscription has expired between page load and payment, THE Backend SHALL process payment at full price without discount.
5. THE subscriber_discount_percent SHALL be configurable per Service_Listing by the admin (range 0-50%).

### Requirement 17: Webhook and Notification Integration

**User Story:** As a platform operator, I want service payments to be reliably processed and users notified, so that the system handles all payment states correctly.

#### Acceptance Criteria

1. THE Backend Razorpay webhook handler SHALL identify service-related events by checking if the order receipt starts with `service_`. IF yes, route to service booking handler. IF receipt starts with `booking_`, route to existing venue booking handler.
2. WHEN a `payment.captured` webhook is received for a service order, THE Backend SHALL update the Service_Booking status to "confirmed", store payment_id, and decrement quantity atomically.
3. WHEN a `payment.failed` webhook is received for a service order, THE Backend SHALL update the Service_Booking status to "payment_failed" and create a notification for the user.
4. WHEN a `refund.processed` webhook is received for a service order, THE Backend SHALL update the Service_Booking status to "refunded", set refunded_at, restore quantity, and notify the user.
5. THE Backend SHALL create notifications with type `service_booking` for service-related events, distinguishable from venue notifications (type `booking`).
6. THE Backend SHALL send push notifications for: service booking confirmed, service booking cancelled/refunded, and service payment failed.

