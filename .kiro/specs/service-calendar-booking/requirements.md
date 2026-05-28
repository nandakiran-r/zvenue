# Requirements Document

## Introduction

This feature adds a calendar-based booking system to services, mirroring the existing venue booking flow. Currently, services use a direct "Buy Now" purchase model (select quantity → pay immediately). This change introduces date and session selection via a calendar before payment, making the service booking experience consistent with venues. Additionally, all "Buy Now" labels will be renamed to "Book Now" across the service flow.

## Glossary

- **Service_Detail_Page**: The screen showing a service listing's details, images, reviews, and booking action (`app/service-detail.tsx`)
- **Service_Booking_Page**: A new screen (similar to `booking-detail.tsx`) where users select a date, session, and quantity before paying for a service
- **Calendar_Component**: The custom-built month calendar grid (already exists in `booking-detail.tsx`) showing available/booked dates
- **Session_Slot**: A time block (Morning, Afternoon, Full Day) that can be selected for a booking
- **Service_Booked_Dates**: API response containing existing bookings and blocked dates for a service listing
- **Booking_Confirmed_Page**: The existing `service-booking-confirmed.tsx` screen, updated to show date/session info

## Requirements

### Requirement 1: Rename "Buy Now" to "Book Now"

**User Story:** As a user, I want the service action button to say "Book Now" instead of "Buy Now", so that the language is consistent with the booking-based experience.

#### Acceptance Criteria

1. THE Service_Detail_Page SHALL display "Book Now" as the primary action button text instead of "Buy Now"
2. THE login prompt message SHALL say "Please log in to book this service" instead of "Please log in to purchase this service"
3. THE subscriber benefit text SHALL say "Subscribers save X% on every booking" instead of "on every purchase"
4. THE my-bookings empty state for services SHALL say "Your service bookings will appear here" instead of "Your service purchases will appear here"

### Requirement 2: Navigate to Service Booking Page

**User Story:** As a user, I want tapping "Book Now" to take me to a calendar booking page, so that I can select a date and time for my service.

#### Acceptance Criteria

1. WHEN the user taps "Book Now" on the Service_Detail_Page, THE app SHALL navigate to the Service_Booking_Page with the service listing ID passed as a parameter
2. THE Service_Booking_Page SHALL display the service name, image, city, and price at the top
3. THE Service_Booking_Page SHALL require the user to be logged in (redirect to login if not)
4. IF the user is not logged in and taps "Book Now", THE Service_Detail_Page SHALL show a login prompt before navigation

### Requirement 3: Calendar Date Selection for Services

**User Story:** As a user, I want to see a calendar showing available dates for a service, so that I can pick a date that works for me.

#### Acceptance Criteria

1. THE Service_Booking_Page SHALL display a monthly calendar grid identical in style to the venue booking calendar
2. THE calendar SHALL fetch booked dates for the service listing from the API and mark them visually
3. THE calendar SHALL disable past dates and blocked dates (not selectable)
4. THE calendar SHALL highlight dates that have existing bookings with a dot indicator
5. WHEN the user taps an available date, THE calendar SHALL highlight it as selected
6. THE calendar SHALL support month navigation (previous/next month arrows)
7. THE calendar SHALL display a legend showing: Selected (primary color), Has bookings (orange), Past (grey)

### Requirement 4: Session Selection for Services

**User Story:** As a user, I want to select a time session (Morning, Afternoon, or Full Day) for my service booking, so that I can specify when I need the service.

#### Acceptance Criteria

1. WHEN a date is selected, THE Service_Booking_Page SHALL display session options: Morning (8:00 AM – 12:00 PM), Afternoon (1:00 PM – 5:00 PM), Full Day (8:00 AM – 5:00 PM)
2. THE Service_Booking_Page SHALL mark sessions that are already booked for the selected date as disabled with "Booked" label
3. WHEN the user taps an available session, THE Service_Booking_Page SHALL highlight it as selected
4. IF a full-day booking exists for the selected date, ALL sessions SHALL be marked as booked
5. IF morning AND afternoon sessions are both booked, THE full-day session SHALL also be marked as booked

### Requirement 5: Quantity Selection on Booking Page

**User Story:** As a user, I want to select the quantity of the service I need on the booking page, so that I can order multiple units for my event.

#### Acceptance Criteria

1. WHEN a date and session are selected, THE Service_Booking_Page SHALL display a quantity selector with +/- buttons
2. THE quantity SHALL default to 1 and SHALL NOT go below 1
3. THE quantity SHALL NOT exceed the service listing's `quantity_available` value
4. IF the user tries to exceed the maximum, THE Service_Booking_Page SHALL show a warning message

### Requirement 6: Pricing Summary on Booking Page

**User Story:** As a user, I want to see a clear pricing breakdown before I pay, so that I know exactly what I'm being charged.

#### Acceptance Criteria

1. THE Service_Booking_Page SHALL display: unit price × quantity = subtotal
2. IF the user is a subscriber and the service has a subscriber discount, THE Service_Booking_Page SHALL show the discount amount and the discounted total
3. THE Service_Booking_Page SHALL display a service fee (if applicable)
4. THE Service_Booking_Page SHALL display the final total amount prominently
5. THE pricing SHALL update in real-time as the user changes quantity

### Requirement 7: Payment and Order Creation with Date/Session

**User Story:** As a user, I want to complete payment for my service booking with the selected date and session included, so that my booking is confirmed for the right time.

#### Acceptance Criteria

1. WHEN the user taps "Confirm & Pay" on the Service_Booking_Page, THE app SHALL call the service order creation API with: service_listing_id, quantity, booking_date, start_time, end_time
2. THE app SHALL open the Razorpay payment WebView with the order details
3. WHEN payment succeeds, THE app SHALL verify the payment via the service payment verification API
4. WHEN payment is verified, THE app SHALL navigate to the Booking_Confirmed_Page with date and session details
5. IF payment fails or is cancelled, THE app SHALL show an appropriate error message and remain on the Service_Booking_Page

### Requirement 8: Updated Booking Confirmation with Date/Session

**User Story:** As a user, I want my service booking confirmation to show the date and session I booked, so that I have a clear record.

#### Acceptance Criteria

1. THE Booking_Confirmed_Page SHALL display the booking date in a readable format (e.g., "28 May 2026")
2. THE Booking_Confirmed_Page SHALL display the session time (e.g., "Morning Session: 8:00 AM – 12:00 PM")
3. THE Booking_Confirmed_Page SHALL continue to display: service name, quantity, total paid, and booking ID

### Requirement 9: View Service Booking Shows Date/Session

**User Story:** As a user, I want to see the date and session in my service booking details, so that I can reference when my booking is scheduled.

#### Acceptance Criteria

1. THE view-service-booking page SHALL display the booking date in the "Booking Details" card
2. THE view-service-booking page SHALL display the session/time slot in the "Booking Details" card
3. THE my-bookings list for services SHALL display the booking date on each service booking card

### Requirement 10: Service Booked Dates API

**User Story:** As a developer, I need an API endpoint to fetch booked dates for a service listing, so that the calendar can show availability.

#### Acceptance Criteria

1. THE app SHALL call a new API endpoint `GET /api/service-listings/:id/booked-dates` to fetch existing bookings for a service
2. THE API response SHALL return: `{ bookings: [{ booking_date, start_time, end_time }], blocked_dates: string[] }`
3. THE Service_Booking_Page SHALL use this data to mark booked sessions and dates on the calendar
4. IF the API call fails, THE Service_Booking_Page SHALL show an error message and allow retry
