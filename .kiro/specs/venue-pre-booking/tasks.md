# Implementation Tasks

## Task 1: Database Schema Migration — Add Pre-Booking Columns

- [x] Add `transaction_id VARCHAR(64)` column to bookings table in `admin/server/db/schema.js`
- [x] Add `registration_fee_paid REAL DEFAULT 0` column to bookings table in `admin/server/db/schema.js`
- [x] Add `remaining_balance REAL DEFAULT 0` column to bookings table in `admin/server/db/schema.js`
- [x] Create Drizzle migration file with the ALTER TABLE statements
- [x] Run migration against the database to apply schema changes
- [x] Verify columns exist by querying the bookings table

**Requirements**: 9.1, 9.2, 9.3, 9.4

## Task 2: Data Migration Script — Assign Registration Fees to Existing Venues

- [x] Create `admin/server/migrate-registration-fees.js` script
- [x] Query all venues where `registration_fee` is NULL or 0
- [x] For each venue, generate a random fee between 1000 and 5000
- [x] Update each venue's `registration_fee` with the generated value
- [x] Log each venue updated with its name, ID, and new fee
- [x] Log summary count of total venues updated
- [x] Run the migration script and verify all venues now have `registration_fee > 0`

**Requirements**: 11.1, 11.2, 11.3

## Task 3: Server — Modify `verify-payment` Endpoint for Pre-Booking

- [x] In `admin/server/index.js`, modify the `POST /api/bookings/verify-payment` handler
- [x] After successful payment verification, fetch the venue's `registration_fee` from the venues table
- [x] Set booking status to `"pre_booked"` instead of `"confirmed"`
- [x] Store `registration_fee_paid` (the amount charged) on the booking record
- [x] Store `remaining_balance` (total - registration_fee) on the booking record
- [x] Update the response to include `is_pre_booking: true`, `registration_fee_paid`, and `remaining_balance`
- [x] Create in-app notification for user: title "Pre-Booking Confirmed", body with venue name, date, and fee paid
- [x] Create in-app notification for admin: title "New Pre-Booking", body with user name, venue name, and remaining balance
- [x] Send push notification to user if `push_token` exists
- [ ] Test with a Razorpay test payment to verify status is `pre_booked`

**Requirements**: 1.1, 1.2, 1.3, 3.1, 3.2, 4.3

## Task 4: Server — WhatsApp Notification to Venue Owner

- [x] Add `AOC_PREBOOKING_TEMPLATE_NAME` to `.env` file with placeholder value `prebooking_alert`
- [x] Create `sendWhatsAppPreBookingAlert(ownerPhone, templateParams)` function in `admin/server/index.js`
- [x] Use the same AOC WhatsApp API structure as `sendWhatsAppOTP`
- [x] In `verify-payment`, after marking as `pre_booked`, fetch venue owner's phone via `venues.owner_id → owners.phone_number`
- [x] Call `sendWhatsAppPreBookingAlert` as fire-and-forget (don't await or block response)
- [x] If venue has no owner or owner has no phone, log warning and skip
- [ ] Test that WhatsApp failure does not affect the booking response

**Requirements**: 12.1, 12.2, 12.3, 12.4

## Task 5: Server — Modify Webhook `handlePaymentCaptured` for Pre-Booking

- [x] In `handlePaymentCaptured`, check if order notes contain `registration_fee > 0`
- [x] If yes, set booking status to `"pre_booked"` instead of `"confirmed"`
- [x] Store `registration_fee_paid` and `remaining_balance` on the booking record
- [x] Create pre-booking notifications (user + admin) same as in verify-payment
- [x] Send WhatsApp to venue owner (fire-and-forget)
- [ ] Test by simulating a webhook payload with registration_fee in notes

**Requirements**: 1.2, 3.1, 4.3, 12.1

## Task 6: Server — New Endpoint `POST /api/bookings/submit-transaction-id`

- [x] Create new route `POST /api/bookings/submit-transaction-id` with JWT auth
- [x] Validate `transaction_id` matches regex `/^[a-zA-Z0-9_-]{1,64}$/`
- [x] Validate `booking_id` exists and belongs to authenticated user
- [x] Validate booking status is `"pre_booked"`
- [x] Store `transaction_id` on the booking record
- [x] Create notification for admin: "Transaction ID Received" with user name and venue name
- [x] Return `{ success: true, message: "Transaction ID submitted successfully" }`
- [x] On database failure, return 500 with error message
- [ ] Test with valid and invalid transaction IDs

**Requirements**: 7.1, 7.2, 7.3, 7.4

## Task 7: Server — New Endpoint `POST /api/admin/bookings/confirm-payment`

- [x] Create new route `POST /api/admin/bookings/confirm-payment` with JWT auth
- [x] Validate `transaction_id` matches regex `/^[a-zA-Z0-9_-]{1,64}$/`
- [x] Validate booking exists and has status `"pre_booked"`
- [x] Update booking status to `"confirmed"`
- [x] Store `transaction_id` on booking record
- [x] Set `paid_at` to current timestamp
- [x] Create in-app notification for user: "Booking Fully Confirmed" with venue name, date, session, guests, total, transaction ID
- [x] Send push notification to user: "Booking Fully Confirmed" with booking_id and venue_id in data payload
- [x] Return full booking details in response (venue name, date, session, guests, fees, total, transaction_id, confirmed_at)
- [ ] Test the full flow: pre_booked → confirm-payment → verified confirmed status

**Requirements**: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.4

## Task 8: Server — Mandatory Registration Fee Validation on Venue Endpoints

- [x] In `POST /api/venues` (admin create), add validation: reject if `registration_fee` is missing, null, or ≤ 0
- [x] In `POST /api/venues/:id/approve`, add validation: check venue's `registration_fee > 0` before approving
- [ ] In `POST /api/owners/venues` (owner submit), add validation: reject if `registration_fee` is missing or ≤ 0
- [x] Return 400 with `{ error: "Registration fee is required" }` on validation failure
- [ ] Test each endpoint with zero, null, and valid registration fees

**Requirements**: 10.1, 10.2, 10.3

## Task 9: Mobile App — Update Booking Summary in `booking-detail.tsx`

- [x] In the booking summary section, change "Pay at Venue (Balance)" label to "Balance Due (via Agent)"
- [x] Ensure the "Pay Now" amount shows only the registration fee
- [x] Update the bottom bar button text from "Confirm & Pay" to "Pre-Book & Pay" when registration fee applies
- [x] Verify the Razorpay payment amount is the registration fee (already handled by server)
- [ ] Test the UI displays correct amounts for various venue registration fees

**Requirements**: 1.4, 1.5

## Task 10: Mobile App — Create Pre-Booking Confirmation Screen

- [x] Create new file `app/pre-booking-confirmed.tsx`
- [x] Display success icon/animation at the top
- [x] Display message: "Pre-booking is successful and our agent will contact you for further proceedings"
- [x] Display pre-booking details: venue name, date, session, registration fee paid, remaining balance
- [x] Add "View Booking" button that navigates to `view-booking` screen with booking ID
- [x] Add "Back to Home" button
- [x] Update `booking-detail.tsx` to navigate to `pre-booking-confirmed` instead of `booking-confirmed` after successful payment verification
- [x] Update the `verifyPayment` response handling to check `is_pre_booking` flag and route accordingly
- [ ] Test the full flow from payment to confirmation screen

**Requirements**: 2.1, 2.2, 2.3, 2.4

## Task 11: Mobile App — Update `view-booking.tsx` with Pre-Booking Status & Progress

- [x] Add booking status badge at the top: "Pre-Booked" (amber), "Confirmed" (green), "Pending" (gray), "Cancelled" (red)
- [x] When status is `"pre_booked"`, display progress indicator with 4 steps:
  - "Registration Fee Paid" → completed (green check)
  - "Agent Contact" → in progress (pulsing dot)
  - "Full Payment" → pending (gray)
  - "Booking Confirmed" → pending (gray)
- [x] When status is `"pre_booked"`, show "Submit Transaction ID" input field with submit button
- [x] Validate transaction ID client-side: 1–64 chars, alphanumeric + hyphens/underscores only
- [x] Call `POST /api/bookings/submit-transaction-id` on submit
- [x] Show success toast on successful submission
- [x] Show error message on failure with retry option
- [x] Add `useFocusEffect` to refresh booking data when screen gains focus
- [ ] Test progress indicator states and transaction ID submission

**Requirements**: 7.1, 7.4, 8.1, 8.2, 8.5

## Task 12: Mobile App — Confirmed Booking View in `view-booking.tsx`

- [x] When status is `"confirmed"`, display green "Booking Confirmed" badge with checkmark icon
- [x] Replace progress indicator with complete booking confirmation card:
  - Venue name and image
  - Booking date and session time
  - Number of guests
  - Payment breakdown: registration fee + remaining balance = total
  - Transaction ID reference
  - Confirmation timestamp
- [x] Hide the "Submit Transaction ID" input when status is confirmed
- [ ] Add deep-link handling: when user taps "Booking Fully Confirmed" notification, navigate to this screen
- [ ] Test the confirmed state UI with mock data

**Requirements**: 6.3, 6.5, 8.3, 8.4

## Task 13: Mobile App — Update API Client (`lib/api.ts`)

- [x] Add `submitTransactionId(bookingId, transactionId)` function calling `POST /api/bookings/submit-transaction-id`
- [x] Update `verifyPayment` response type to include `is_pre_booking`, `registration_fee_paid`, `remaining_balance`
- [x] Add type for the extended booking response with new fields
- [x] Ensure error handling returns structured error messages for display

**Requirements**: 7.2, 1.3

## Task 14: Admin Panel — Pre-Booked Status Badge & Booking Details

- [x] In `admin/src/features/owner-portal/owner-bookings.tsx`, add "Pre-Booked" badge variant (amber/orange color)
- [x] Add columns/fields showing: registration fee paid, remaining balance, user contact (phone + email)
- [x] Only show "Pre-Booked" badge when remaining_balance > 0
- [x] Add filter option to show only pre-booked bookings
- [ ] Test badge rendering for different booking statuses

**Requirements**: 4.1, 4.2

## Task 15: Admin Panel — Confirm Payment Dialog & Action

- [x] Create `admin/src/features/owner-portal/confirm-payment-dialog.tsx` component
- [x] Add "Confirm Payment" button on pre-booked booking rows
- [x] Dialog contains: transaction ID input field, booking summary, confirm button, cancel button
- [x] Validate transaction ID: 1–64 chars, `/^[a-zA-Z0-9_-]{1,64}$/`
- [x] Show validation error inline if invalid
- [x] On confirm, call `POST /api/admin/bookings/confirm-payment`
- [x] On success, close dialog, refresh booking list, show success toast
- [x] On error, show error message in dialog
- [ ] Test the full admin confirmation flow

**Requirements**: 5.1, 5.2, 5.3, 5.4, 5.5

## Task 16: Admin Panel — Registration Fee Validation on Venue Forms

- [ ] In venue creation form, make `registration_fee` a required field with min value > 0
- [ ] In venue approval flow, check that `registration_fee > 0` before allowing approval
- [ ] Show validation error: "Registration fee is required and must be greater than zero"
- [ ] Disable approve button if registration fee is missing or zero
- [ ] Test form validation with zero, empty, and valid values

**Requirements**: 10.1, 10.2

## Task 17: Mobile App — Filter Venues Without Registration Fee

- [x] In the venue listing/search API call or client-side filter, exclude venues where `registration_fee` is 0 or null
- [x] Alternatively, add server-side filter in `GET /api/venues` to only return venues with `registration_fee > 0`
- [x] Verify no venues with zero fee appear in the mobile app
- [ ] Test with a mix of venues (some with fee, some without)

**Requirements**: 10.4

## Task 18: Integration Testing — End-to-End Pre-Booking Flow

- [ ] Test: Create order → Pay registration fee → Verify payment → Status is `pre_booked`
- [ ] Test: User submits transaction ID → Admin sees notification → Admin confirms → Status is `confirmed`
- [ ] Test: User notification received on confirmation with full booking details
- [ ] Test: View booking screen updates from pre-booked to confirmed on refresh
- [ ] Test: WhatsApp notification sent to venue owner (or logged if template not configured)
- [ ] Test: Venues without registration fee are not visible in mobile app

**Requirements**: All
