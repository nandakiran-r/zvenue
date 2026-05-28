# Implementation Plan: Service Calendar Booking

## Overview

This plan adds calendar-based date/session booking to services, mirroring the existing venue booking flow. The work spans frontend text changes, a new booking page, API additions, type extensions, and updates to confirmation/detail pages.

## Tasks

- [x] 1. Rename "Buy Now" to "Book Now" and update related text
  - In `app/service-detail.tsx`: change button text from "Buy Now" to "Book Now"
  - In `app/service-detail.tsx`: change login prompt from "Please log in to purchase this service" to "Please log in to book this service"
  - In `app/service-detail.tsx`: change subscriber benefit text from "on every purchase" to "on every booking"
  - In `app/(tabs)/my-bookings.tsx`: change empty state text from "Your service purchases will appear here" to "Your service bookings will appear here"
  - Verify no other "Buy Now" or "purchase" references remain in service-related files

- [x] 2. Extend service types with date/time fields
  - In `lib/serviceTypes.ts`: add `booking_date: string | null`, `start_time: string | null`, `end_time: string | null` to `DbServiceBooking` interface
  - In `lib/serviceTypes.ts`: add `booking_date: string`, `start_time: string`, `end_time: string` to `ServiceCreateOrderInput` interface
  - In `lib/serviceTypes.ts`: add `ServiceBookedDateEntry` interface: `{ booking_date: string; start_time: string; end_time: string }`
  - Verify TypeScript compilation passes after type changes

- [x] 3. Add `fetchServiceBookedDates` API function
  - In `lib/serviceApi.ts`: add `fetchServiceBookedDates(listingId: string)` function that calls `GET /api/service-listings/:id/booked-dates`
  - The function should return `{ bookings: ServiceBookedDateEntry[]; blocked_dates: string[] }`
  - Handle both array format (legacy) and object format (new) in the response, same as `fetchVenueBookedDates`
  - Export the function

- [x] 4. Create `service-booking-detail.tsx` page — structure and data loading
  - Create `app/service-booking-detail.tsx` with route param `{ id: string }` (service listing ID)
  - Add header with back button and title "Book Service"
  - Fetch service listing via `fetchServiceListingById(id)` on mount
  - Fetch booked dates via `fetchServiceBookedDates(id)` on mount
  - Display service card at top: image, name, city, price
  - Show loading indicator while data loads
  - Show error state if listing not found
  - Require authentication (redirect to login if not signed in)

- [x] 5. Add calendar component to service booking page
  - Add calendar state: `currentMonth`, `selectedDate`, `bookedDates`, `blockedDates`
  - Implement `calendarDays` useMemo generating the month grid (copy pattern from `booking-detail.tsx`)
  - Implement `goToPrevMonth` and `goToNextMonth` navigation
  - Implement `handleDateSelect` to set selected date and reset session
  - Render calendar grid with: month header, day labels (Sun-Sat), date cells
  - Style date cells: selected (primary), booked (orange dot), past (grey/disabled), today (border)
  - Disable past dates and blocked dates (not tappable)
  - Add calendar legend: Selected, Has bookings, Past

- [x] 6. Add session selection to service booking page
  - Define SESSIONS constant (Morning, Afternoon, Full Day) matching venue booking
  - Show session cards only when a date is selected
  - Implement `bookedSessionsForDate` useMemo that checks which sessions are taken for the selected date
  - Mark booked sessions as disabled with "Booked" label
  - If full-day is booked, mark all sessions as booked
  - If both morning and afternoon are booked, mark full-day as booked
  - Highlight selected session with active style
  - Implement `isSessionBooked` helper function

- [x] 7. Add quantity selector and pricing summary to service booking page
  - Show quantity selector (+/- buttons) when date and session are selected
  - Default quantity to 1, minimum 1, maximum `listing.quantity_available`
  - Show warning when max is reached
  - Calculate pricing: unitPrice × quantity = subtotal
  - Apply subscriber discount if user is subscribed and listing has `subscriber_discount_percent`
  - Display pricing breakdown: subtotal, discount (if any), total
  - Update pricing in real-time as quantity changes

- [x] 8. Add payment flow to service booking page
  - Add "Confirm & Pay" button at bottom, disabled until date + session + quantity are valid
  - On tap: call `createServiceOrder({ service_listing_id, quantity, booking_date, start_time, end_time })`
  - Generate Razorpay checkout HTML (copy pattern from `booking-detail.tsx` or existing `service-detail.tsx`)
  - Open payment WebView modal
  - Handle payment success: call `verifyServicePayment`, navigate to confirmation
  - Handle payment cancel: close modal, show info toast
  - Handle payment failure: close modal, show error toast
  - Pass booking date and session info to confirmation page params

- [x] 9. Update service-detail.tsx to navigate to booking page
  - Replace `handleBuyNow` logic: instead of creating order directly, navigate to `/service-booking-detail` with listing ID
  - Remove quantity selector from service-detail page (moved to booking page)
  - Remove payment WebView modal from service-detail page (moved to booking page)
  - Remove `createServiceOrder`, `verifyServicePayment` imports if no longer used here
  - Remove `paymentModalVisible`, `paymentHtml`, `pendingBookingId`, `submitting` state if no longer used
  - Keep the "Book Now" button in the bottom bar, just change its action to navigate
  - Rename `handleBuyNow` to `handleBookNow`
  - Rename style `buyButton` to `bookButton` and `buyButtonText` to `bookButtonText`

- [x] 10. Update service-booking-confirmed.tsx with date/session info
  - Accept new route params: `bookingDate`, `session` (session label)
  - Display booking date in readable format (e.g., "28 May 2026") in the details card
  - Display session time (e.g., "Morning Session: 8:00 AM – 12:00 PM") in the details card
  - Keep existing fields: service name, quantity, total, booking ID

- [x] 11. Update view-service-booking.tsx with date/session info
  - Display `booking.booking_date` in the "Booking Details" card (formatted as readable date)
  - Display `booking.start_time` – `booking.end_time` as the session/time slot
  - Handle null values gracefully (for old bookings without date/time)

- [x] 12. Update my-bookings service cards to show booking date
  - In `app/(tabs)/my-bookings.tsx`: display `booking.booking_date` on each service booking card (if present)
  - Format as short date (e.g., "28 May 2026")
  - Handle null booking_date for legacy bookings (show "Date not set" or hide)

- [x] 13. Final verification and cleanup
  - Verify TypeScript compilation passes across all modified files
  - Verify service-detail shows "Book Now" and navigates to booking page
  - Verify calendar renders correctly with month navigation
  - Verify booked dates/sessions are disabled
  - Verify quantity bounds work correctly
  - Verify pricing calculation with and without subscriber discount
  - Verify payment flow completes successfully
  - Verify confirmation page shows date and session
  - Verify view-service-booking shows date and session
  - Verify my-bookings shows date on service cards
  - Remove any unused imports or dead code

## Task Dependency Graph

```json
{
  "waves": [
    {"wave": 1, "tasks": [1, 2, 3]},
    {"wave": 2, "tasks": [4]},
    {"wave": 3, "tasks": [5, 6, 7]},
    {"wave": 4, "tasks": [8, 9]},
    {"wave": 5, "tasks": [10, 11, 12]},
    {"wave": 6, "tasks": [13]}
  ]
}
```

Wave 1 (text changes, types, API function) has no dependencies and can be done in parallel. Wave 2 creates the page skeleton. Wave 3 adds the interactive components (calendar, sessions, quantity) in parallel. Wave 4 wires up payment and updates service-detail navigation. Wave 5 updates downstream pages. Wave 6 is final verification.

## Notes

- **Backend dependency:** Tasks 3 and 8 depend on backend endpoints (`GET /api/service-listings/:id/booked-dates` and extended `POST /api/service-bookings/create-order`). If the backend isn't ready, mock the responses during frontend development.
- **Calendar code duplication:** The calendar logic in the new page is copied from `booking-detail.tsx`. A shared `CalendarPicker` component can be extracted in a future refactor.
- **Backward compatibility:** The `booking_date`, `start_time`, `end_time` fields on `DbServiceBooking` are nullable to support existing bookings that were created without dates.
- **No session-based pricing for services:** Unlike venues (hourly rate × hours), services use a flat unit price. The session determines delivery time, not cost.
