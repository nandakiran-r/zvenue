# Requirements Document

## Introduction

This feature introduces a Service Categories Marketplace to the ZVenue platform, enabling users to browse and directly purchase services across nine distinct categories: Saloons, Decors, Catering, Mehandi, Travel, Water, Fashion, Jewellery, and Rentals. Unlike the existing venue booking flow (which requires pre-booking and agent confirmation), service listings follow a fully automated direct-payment model: users select a service, choose quantity, pay the full amount via Razorpay, and receive instant booking confirmation. Each service listing mirrors the venue detail page UI pattern (image carousel, description, video, reviews, subscriber benefits, owner info) but is tailored for service-specific attributes like quantity and direct pricing. The admin panel and owner portal are extended to manage these service listings independently from venues.

## Glossary

- **Service_Listing**: A purchasable service item within a service category, containing images, price, quantity, description, video, subscriber benefits, owner info, and reviews.
- **Service_Category**: One of the nine top-level groupings for services (Saloons, Decors, Catering, Mehandi, Travel, Water, Fashion, Jewellery, Rentals), separate from venue categories.
- **Service_Booking**: A confirmed purchase of a Service_Listing, created automatically upon successful payment without agent intervention.
- **Category_Switcher**: The horizontal scrollable chip UI on the home screen that allows navigation between Service_Categories.
- **Service_Detail_Page**: The mobile app screen displaying full details of a Service_Listing, following the same UI pattern as the venue detail page.
- **Service_Admin_Panel**: The section within the admin panel for managing Service_Listings and Service_Categories.
- **Owner_Portal**: The existing owner-facing interface, extended to allow owners to create and manage their Service_Listings.
- **Payment_Gateway**: Razorpay integration used for processing direct full-amount payments for services.
- **Subscriber**: A user with an active ₹49/month subscription who receives special benefits on listings.
- **Booking_Details_Page**: The screen showing confirmation and details of a completed Service_Booking.

## Requirements

### Requirement 1: Service Category Data Model

**User Story:** As a platform administrator, I want service categories and service listings stored as separate entities from venues, so that services can be managed independently without affecting existing venue functionality.

#### Acceptance Criteria

1. THE Database SHALL store Service_Categories as a separate table with fields: id, name, icon, sort_order, is_active, and created_at.
2. THE Database SHALL store Service_Listings as a separate table with fields: id, service_category_id, owner_id, name, description, images (max 5), video_url, price, quantity_available, subscriber_benefits, rating, review_count, is_active, and created_at.
3. THE Database SHALL store Service_Bookings as a separate table with fields: id, service_listing_id, user_id, quantity, unit_price, total_amount, payment_id, order_id, signature, status, and created_at.
4. WHEN the application starts, THE Database SHALL contain the nine predefined Service_Categories: Saloons, Decors, Catering, Mehandi, Travel, Water, Fashion, Jewellery, and Rentals.
5. THE Database SHALL enforce a foreign key relationship between Service_Listings and Service_Categories.
6. THE Database SHALL enforce a foreign key relationship between Service_Listings and Owners.
7. THE Database SHALL enforce a foreign key relationship between Service_Bookings and Service_Listings.
8. THE Database SHALL enforce a foreign key relationship between Service_Bookings and Users.

### Requirement 2: Home Screen Category Navigation

**User Story:** As a user, I want to switch between service categories on the home screen, so that I can browse different types of services easily.

#### Acceptance Criteria

1. THE Category_Switcher SHALL display all active Service_Categories as horizontally scrollable chips on the home screen.
2. WHEN a user taps a Service_Category chip, THE App SHALL navigate to a listing screen showing all active Service_Listings within that category.
3. THE Category_Switcher SHALL display Service_Categories separately from existing venue categories.
4. THE Category_Switcher SHALL display each Service_Category with its configured icon and name.
5. THE Category_Switcher SHALL order Service_Categories by their sort_order field.

### Requirement 3: Service Listing Browse Screen

**User Story:** As a user, I want to browse service listings within a category, so that I can find and compare services before purchasing.

#### Acceptance Criteria

1. WHEN a user navigates to a Service_Category, THE App SHALL display a scrollable list of all active Service_Listings in that category.
2. THE App SHALL display each Service_Listing card with: cover image, name, price, rating, review count, and location.
3. THE App SHALL allow users to add Service_Listings to favorites.
4. THE App SHALL sort Service_Listings by rating in descending order as the default sort.
5. IF no active Service_Listings exist in a category, THEN THE App SHALL display an empty state message indicating no services are available.

### Requirement 4: Service Detail Page

**User Story:** As a user, I want to view complete details of a service listing, so that I can make an informed purchase decision.

#### Acceptance Criteria

1. THE Service_Detail_Page SHALL display an image carousel with a maximum of 5 images, auto-scrolling every 3 seconds with manual swipe support.
2. THE Service_Detail_Page SHALL display the service name, price per unit, and available quantity.
3. THE Service_Detail_Page SHALL display an "About" section with the full service description.
4. WHEN a video_url is present, THE Service_Detail_Page SHALL display a video section with a tap-to-open link.
5. THE Service_Detail_Page SHALL display subscriber benefits in a highlighted section, matching the venue detail page benefit display pattern.
6. THE Service_Detail_Page SHALL display owner information including name and avatar image.
7. THE Service_Detail_Page SHALL display a reviews section showing preview reviews with a "See All Reviews" link.
8. THE Service_Detail_Page SHALL display a "Buy Now" button in a fixed bottom bar.
9. WHEN a user taps the "Buy Now" button, THE App SHALL navigate to the payment flow with the selected quantity.

### Requirement 5: Quantity Selection and Pricing

**User Story:** As a user, I want to select the quantity of a service before purchasing, so that I can order the exact amount I need.

#### Acceptance Criteria

1. THE Service_Detail_Page SHALL display a quantity selector allowing the user to choose between 1 and the available quantity.
2. THE Service_Detail_Page SHALL display the calculated total price based on unit price multiplied by selected quantity.
3. WHEN the user increases quantity beyond available stock, THE App SHALL cap the quantity at the maximum available and display a notification.
4. THE Service_Detail_Page SHALL update the total price in real-time as the user adjusts quantity.

### Requirement 6: Direct Payment Flow

**User Story:** As a user, I want to pay the full amount directly through the payment gateway, so that my booking is confirmed instantly without waiting for agent approval.

#### Acceptance Criteria

1. WHEN a user initiates payment, THE Backend SHALL create a Razorpay order for the full amount (unit_price multiplied by quantity).
2. WHEN the Razorpay payment is completed successfully, THE Backend SHALL verify the payment signature.
3. WHEN payment verification succeeds, THE Backend SHALL create a Service_Booking record with status "confirmed".
4. WHEN payment verification succeeds, THE Backend SHALL decrement the available quantity of the Service_Listing by the purchased quantity.
5. IF payment verification fails, THEN THE Backend SHALL set the Service_Booking status to "failed" and not decrement quantity.
6. THE Payment_Gateway SHALL process payments without requiring any agent intervention or manual confirmation step.
7. WHEN a Subscriber makes a payment, THE Backend SHALL apply subscriber discount benefits to the total amount before creating the Razorpay order.

### Requirement 7: Service Booking Confirmation

**User Story:** As a user, I want to see my booking confirmation immediately after payment, so that I have proof of my purchase.

#### Acceptance Criteria

1. WHEN payment is confirmed, THE App SHALL navigate to the Booking_Details_Page displaying: booking ID, service name, quantity purchased, total amount paid, payment timestamp, and booking status.
2. THE Booking_Details_Page SHALL display the service listing cover image and owner contact information.
3. WHEN a Service_Booking is confirmed, THE Backend SHALL send a push notification to the user confirming the booking.
4. THE App SHALL display Service_Bookings in the "My Bookings" tab alongside venue bookings, distinguished by a "Service" label.

### Requirement 8: Service Reviews

**User Story:** As a user, I want to read and write reviews for service listings, so that I can share my experience and help other users make decisions.

#### Acceptance Criteria

1. THE Database SHALL store service reviews in a service_reviews table with fields: id, service_listing_id, user_id, rating (1-5), comment, created_at, and updated_at.
2. THE Database SHALL enforce a unique constraint allowing only one review per user per Service_Listing.
3. WHEN a user has a confirmed Service_Booking for a listing, THE App SHALL allow the user to submit a review for that listing.
4. WHEN a review is submitted, THE Backend SHALL recalculate and update the Service_Listing rating and review_count.
5. THE Service_Detail_Page SHALL display up to 2 preview reviews with an option to view all reviews.

### Requirement 9: Admin Panel - Service Category Management

**User Story:** As an administrator, I want to manage service categories from the admin panel, so that I can control which categories are visible and their display order.

#### Acceptance Criteria

1. THE Service_Admin_Panel SHALL display a list of all Service_Categories with name, icon, sort_order, and active status.
2. THE Service_Admin_Panel SHALL allow administrators to create new Service_Categories with name, icon, and sort_order.
3. THE Service_Admin_Panel SHALL allow administrators to edit existing Service_Category name, icon, sort_order, and is_active status.
4. THE Service_Admin_Panel SHALL allow administrators to deactivate a Service_Category, hiding it from the mobile app Category_Switcher.
5. WHEN a Service_Category is deactivated, THE App SHALL hide all Service_Listings within that category from browse screens.

### Requirement 10: Admin Panel - Service Listing Management

**User Story:** As an administrator, I want to manage service listings from the admin panel, so that I can oversee all services on the platform.

#### Acceptance Criteria

1. THE Service_Admin_Panel SHALL display a paginated table of all Service_Listings with columns: name, category, owner, price, quantity, rating, status, and created date.
2. THE Service_Admin_Panel SHALL allow filtering Service_Listings by category, owner, and active status.
3. THE Service_Admin_Panel SHALL allow administrators to create new Service_Listings with all required fields (name, category, owner, description, images, price, quantity, video_url, subscriber_benefits).
4. THE Service_Admin_Panel SHALL allow administrators to edit any field of an existing Service_Listing.
5. THE Service_Admin_Panel SHALL allow administrators to deactivate a Service_Listing, hiding it from the mobile app.
6. THE Service_Admin_Panel SHALL enforce a maximum of 5 images per Service_Listing during creation and editing.

### Requirement 11: Admin Panel - Service Booking Management

**User Story:** As an administrator, I want to view and manage service bookings, so that I can monitor transactions and handle disputes.

#### Acceptance Criteria

1. THE Service_Admin_Panel SHALL display a paginated table of all Service_Bookings with columns: booking ID, user, service name, quantity, total amount, status, and date.
2. THE Service_Admin_Panel SHALL allow filtering Service_Bookings by status, category, and date range.
3. THE Service_Admin_Panel SHALL allow administrators to view full booking details including payment information.
4. IF a refund is required, THEN THE Service_Admin_Panel SHALL allow administrators to initiate a refund, updating the booking status to "refunded".

### Requirement 12: Owner Portal - Service Listing Management

**User Story:** As a service owner, I want to create and manage my service listings through the owner portal, so that I can offer my services on the platform.

#### Acceptance Criteria

1. THE Owner_Portal SHALL display a "My Services" section listing all Service_Listings owned by the logged-in owner.
2. THE Owner_Portal SHALL allow owners to create new Service_Listings with: name, category, description, images (max 5), video_url, price, quantity, and subscriber_benefits.
3. THE Owner_Portal SHALL allow owners to edit their existing Service_Listings.
4. THE Owner_Portal SHALL allow owners to update available quantity for their Service_Listings.
5. THE Owner_Portal SHALL display booking analytics for the owner's Service_Listings including total bookings, revenue, and average rating.
6. WHEN an owner creates or edits a Service_Listing, THE Owner_Portal SHALL submit the listing for admin approval before it becomes active.

### Requirement 13: Search Integration

**User Story:** As a user, I want to search for services across all categories, so that I can quickly find what I need.

#### Acceptance Criteria

1. THE App SHALL include Service_Listings in search results when the user searches from the search tab.
2. THE App SHALL display search results with a type indicator distinguishing services from venues.
3. WHEN a user taps a service search result, THE App SHALL navigate to the Service_Detail_Page for that listing.
4. THE App SHALL support searching Service_Listings by name and description text.

### Requirement 14: Subscriber Benefits for Services

**User Story:** As a subscriber, I want to receive discounts and benefits when purchasing services, so that my subscription provides value across the platform.

#### Acceptance Criteria

1. WHILE a user has an active subscription, THE Service_Detail_Page SHALL highlight subscriber-exclusive benefits for the listing.
2. WHILE a user has an active subscription, THE Payment_Gateway SHALL apply the configured subscriber discount to the service total before processing payment.
3. THE Service_Detail_Page SHALL display a prompt to non-subscribers showing available benefits they would receive by subscribing.
4. THE Backend SHALL validate subscription status at payment time to prevent expired subscribers from receiving discounts.
