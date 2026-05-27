# Requirements Document

## Introduction

This feature modifies the existing venue booking flow to introduce a two-phase payment process: pre-booking and full booking confirmation. Users pay a registration fee upfront to pre-book a venue, then an admin agent contacts the user to collect the remaining balance manually. Once the admin confirms full payment receipt, the booking is marked as fully confirmed and the user is notified.

## Glossary

- **Mobile_App**: The React Native (Expo) mobile application used by customers to browse and book venues
- **Admin_Panel**: The React/Vite web application used by administrators to manage venues, bookings, and payments
- **Server**: The Express/Fastify backend API that processes booking requests, payments, and notifications
- **Pre_Booking**: A booking state where the user has paid the registration fee but the remaining balance is pending
- **Registration_Fee**: The initial partial payment amount configured per venue that the user pays via Razorpay to secure a pre-booking
- **Remaining_Balance**: The difference between the total booking cost and the registration fee, collected manually by the admin agent
- **Transaction_ID**: A unique identifier provided by the user to the admin as proof of the manual payment for the remaining balance
- **Admin_Agent**: A human representative from the Zvenue team who contacts the user to collect the remaining payment
- **Booking_Status**: The state of a booking, one of: pending, pre_booked, confirmed, payment_failed, cancelled, refunded

## Requirements

### Requirement 1: Pre-Booking Payment via Razorpay

**User Story:** As a customer, I want to pay only the registration fee to pre-book a venue, so that I can secure my booking without paying the full amount upfront.

#### Acceptance Criteria

1. WHEN a user confirms a booking for a venue with a registration fee greater than zero, THE Mobile_App SHALL initiate a Razorpay payment for the registration fee amount only
2. WHEN the Razorpay payment for the registration fee is successful, THE Server SHALL create a booking record with status "pre_booked"
3. WHEN the Razorpay payment for the registration fee is successful, THE Server SHALL store the Razorpay payment_id, order_id, and signature against the booking record
4. THE Mobile_App SHALL display the registration fee as "Pay Now" amount and the remaining balance as "Balance Due (via Agent)" in the booking summary
5. ALL venues SHALL have a registration fee greater than zero. The pre-booking flow is the only booking path available to users

### Requirement 2: Pre-Booking Confirmation Screen

**User Story:** As a customer, I want to see a clear confirmation that my pre-booking is successful and understand the next steps, so that I know what to expect.

#### Acceptance Criteria

1. WHEN the registration fee payment is verified successfully, THE Mobile_App SHALL navigate to a pre-booking confirmation screen
2. THE Mobile_App SHALL display a message stating "Pre-booking is successful and our agent will contact you for further proceedings" on the pre-booking confirmation screen
3. THE Mobile_App SHALL display the pre-booking details including venue name, date, session, registration fee paid, and remaining balance only on the confirmation screen
4. THE Mobile_App SHALL provide a "View Booking" button that navigates to the booking details screen showing the pre-booked status

### Requirement 3: Pre-Booking Notification to User

**User Story:** As a customer, I want to receive a notification confirming my pre-booking, so that I have a record of the transaction.

#### Acceptance Criteria

1. WHEN a booking is successfully marked as "pre_booked", THE Server SHALL create a notification for the user with title "Pre-Booking Confirmed" and body containing the venue name, booking date, and registration fee paid
2. THE Server SHALL include the booking_id in the notification data payload

### Requirement 4: Admin Panel Pre-Booking Visibility

**User Story:** As an admin, I want to see all pre-booked venues in the admin panel, so that I can track which bookings need agent follow-up for remaining payment.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display pre-booked bookings with a distinct "Pre-Booked" status badge only when the remaining balance is greater than zero
2. THE Admin_Panel SHALL show the registration fee paid, remaining balance amount, and user contact details for each pre-booked booking
3. WHEN a new pre-booking is created, THE Server SHALL create a notification for the admin with title "New Pre-Booking" and body containing the user name, venue name, and remaining balance amount

### Requirement 5: Admin Confirms Remaining Payment

**User Story:** As an admin, I want to confirm that the remaining payment has been received from the user, so that I can mark the booking as fully confirmed.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a "Confirm Payment" action for bookings with status "pre_booked"
2. WHEN the admin clicks "Confirm Payment", THE Admin_Panel SHALL display a form requiring the transaction ID provided by the user
3. WHEN the admin submits the payment confirmation with a valid transaction ID, THE Server SHALL update the booking status from "pre_booked" to "confirmed"
4. WHEN the admin submits the payment confirmation, THE Server SHALL store the transaction ID against the booking record
5. IF the transaction ID field is empty or contains invalid content (special characters or exceeds 64 characters), THEN THE Admin_Panel SHALL display a validation error and prevent submission

### Requirement 6: Full Booking Confirmation Notification to User

**User Story:** As a customer, I want to receive a notification when my booking is fully confirmed, so that I know the venue is secured for my event.

#### Acceptance Criteria

1. WHEN a booking status changes from "pre_booked" to "confirmed", THE Server SHALL create a push notification for the user with title "Booking Fully Confirmed" and body containing the venue name, booking date, session time, and total amount paid
2. THE Server SHALL include the booking_id and venue_id in the notification data payload so the user can navigate to booking details
3. WHEN the user taps the "Booking Fully Confirmed" notification, THE Mobile_App SHALL navigate to the booking details screen showing the confirmed booking with all details
4. WHEN a booking status changes from "pre_booked" to "confirmed", THE Server SHALL also create an in-app notification with the full booking details (venue name, date, session, guests, total paid, transaction ID)
5. THE Mobile_App SHALL update the booking view in real-time (or on next fetch) to reflect the "Confirmed" status with a complete booking summary replacing the pre-booking progress indicator

### Requirement 7: User Shares Transaction ID

**User Story:** As a customer, I want to share my payment transaction ID with the admin, so that the admin can verify my payment and confirm the booking.

#### Acceptance Criteria

1. WHILE a booking has status "pre_booked", THE Mobile_App SHALL display a "Submit Transaction ID" input field on the booking details screen
2. WHEN the user submits a transaction ID, THE Server SHALL store the transaction ID against the booking record. IF the storage operation fails, THE Server SHALL return an error and THE Mobile_App SHALL display an error message requiring the user to resubmit
3. WHEN the user submits a transaction ID, THE Server SHALL create a notification for the admin indicating that the user has shared a transaction ID for a specific booking
4. IF the transaction ID field is empty or contains invalid content (special characters or exceeds 64 characters), THEN THE Mobile_App SHALL display a validation error and prevent submission

### Requirement 8: Booking Status Tracking

**User Story:** As a customer, I want to see the current status of my booking at all times, so that I can track the progress from pre-booking to full confirmation.

#### Acceptance Criteria

1. THE Mobile_App SHALL display the booking status as one of: "Pre-Booked", "Confirmed", "Pending", "Cancelled" on the booking details screen
2. WHILE a booking has status "pre_booked", THE Mobile_App SHALL display a progress indicator showing the steps: "Registration Fee Paid" (completed), "Agent Contact" (in progress), "Full Payment" (pending), "Booking Confirmed" (pending). Steps MAY be completed out of order as long as the booking remains in pre_booked status
3. WHEN a booking status changes to "confirmed", THE Mobile_App SHALL replace the progress indicator with a complete booking confirmation card showing: venue name, booking date, session time, number of guests, registration fee paid, remaining balance paid, total amount, and transaction ID
4. WHEN a booking has status "confirmed", THE Mobile_App SHALL display a green "Booking Confirmed" badge and a success icon at the top of the booking details screen
5. THE Mobile_App SHALL refresh booking data when the screen is focused (e.g., returning from background or navigating back) to pick up status changes made by the admin

### Requirement 9: Database Schema Update for Pre-Booking

**User Story:** As a developer, I want the database schema to support the pre-booking workflow, so that all pre-booking data is persisted correctly.

#### Acceptance Criteria

1. THE Server SHALL support a "pre_booked" value in the booking status field
2. THE Server SHALL store a transaction_id field on the bookings table to record the manual payment transaction identifier
3. THE Server SHALL store a registration_fee_paid field on the bookings table to record the amount paid during pre-booking
4. THE Server SHALL store a remaining_balance field on the bookings table to record the outstanding amount after pre-booking

### Requirement 10: Mandatory Registration Fee for Venues

**User Story:** As an admin, I want every venue to have a registration fee so that all bookings follow the pre-booking workflow consistently.

#### Acceptance Criteria

1. WHEN an admin creates or approves a venue, THE Admin_Panel SHALL require a registration fee greater than zero before the venue can be published/approved
2. IF the registration fee field is empty or zero, THEN THE Admin_Panel SHALL display a validation error and prevent venue approval
3. THE Server SHALL reject venue creation or approval requests where registration_fee is missing or zero with a 400 error
4. THE Mobile_App SHALL NOT display venues that have a registration fee of zero (they are considered incomplete/draft)

### Requirement 11: Data Migration for Existing Venues

**User Story:** As a developer, I want all existing venues in the database to have a valid registration fee so that the pre-booking flow works for all venues without breaking the mobile app.

#### Acceptance Criteria

1. A migration script SHALL update all existing venues that have a registration_fee of zero or null to a random registration fee between ₹1,000 and ₹5,000
2. THE migration script SHALL NOT modify venues that already have a registration_fee greater than zero
3. THE migration script SHALL log the number of venues updated and their new registration fee values

### Requirement 12: WhatsApp Notification to Venue Owner on Pre-Booking

**User Story:** As a venue owner, I want to receive a WhatsApp notification when a customer pre-books my venue, so that I am immediately aware of the booking and can prepare accordingly.

#### Acceptance Criteria

1. WHEN a booking is successfully marked as "pre_booked", THE Server SHALL send a WhatsApp message to the venue owner's phone number using the AOC WhatsApp API
2. THE WhatsApp message SHALL be sent using a pre-approved template (template ID to be configured later via environment variable)
3. IF the WhatsApp message fails to send, THE Server SHALL log the error but SHALL NOT block or fail the pre-booking process
4. THE Server SHALL use the owner's phone number from the owners table associated with the venue
