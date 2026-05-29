# Implementation Plan: Service Hourly Time Slots

## Overview

Replace the 3-session service booking system with a flexible 30-minute slot grid. Service providers configure operating hours and max booking duration. Users select consecutive slots. Includes database migration, backend API update, frontend slot grid UI, and unit tests.

## Tasks

- [x] 1. Database migration — add time config columns to service_listings
  - Create `admin/server/drizzle/0007_service_time_slots.sql`
  - Add `opening_time` varchar(5) DEFAULT '08:00'
  - Add `closing_time` varchar(5) DEFAULT '20:00'
  - Add `max_booking_duration` integer DEFAULT 480
  - Add `blocked_slots` jsonb DEFAULT '[]'
  - Update `admin/server/db/schema.js` with new columns
  - Run migration against the database

- [x] 2. Update service types and API response
  - In `lib/serviceTypes.ts`: add `opening_time`, `closing_time`, `max_booking_duration`, `blocked_slots` to `DbServiceListing`
  - Add `BlockedSlot` interface: `{ date: string; start: string; end: string }`
  - Update `ServiceBookedDatesResponse` to include `blocked_slots` array
  - In backend `index.js`: update `GET /api/service-listings/:id/booked-dates` to return `blocked_slots` from the listing

- [x] 3. Create time slot utility module
  - Create `lib/timeSlots.ts` with:
    - `generateSlots(openingTime, closingTime, bookedRanges, blockedRanges, selectedDate)` → returns TimeSlot[]
    - `handleSlotTap(tappedId, currentSelection, maxSlots, allSlots)` → returns new selection or null
    - `formatTime24to12(time24: string)` → "09:00" → "9:00 AM"
    - `formatTime12to24(time12: string)` → "9:00 AM" → "09:00"
    - `isSlotOverlapping(slotStart, slotEnd, rangeStart, rangeEnd)` → boolean
    - `getSelectionSummary(selection)` → { startLabel, endLabel, duration }
  - Export all functions and types

- [x] 4. Write unit tests for time slot utilities
  - Create `__tests__/lib/timeSlots.test.ts`
  - Test: generateSlots produces correct number of slots for 09:00-18:00 (18 slots)
  - Test: generateSlots marks booked slots correctly
  - Test: generateSlots marks blocked slots correctly
  - Test: generateSlots marks past slots for today
  - Test: handleSlotTap starts new selection on first tap
  - Test: handleSlotTap extends selection on adjacent tap
  - Test: handleSlotTap resets on non-adjacent tap
  - Test: handleSlotTap respects max slot limit
  - Test: handleSlotTap shrinks selection when tapping selected slot
  - Test: formatTime24to12 converts correctly
  - Test: isSlotOverlapping detects overlaps correctly
  - Test: old-format "08:00 AM" bookings are handled
  - Run tests and verify all pass

- [x] 5. Replace session UI with slot grid in service-booking-detail.tsx
  - Remove SESSIONS constant and all session-related state/logic
  - Import slot utilities from `lib/timeSlots.ts`
  - Add state: `selectedSlots: SlotSelection | null`
  - Generate slots using listing's `opening_time`, `closing_time`
  - Fetch blocked_slots from booked-dates API response
  - Render Slot_Grid: 3-column grid of TouchableOpacity cells
  - Style slots by status: available (white border), selected (primary fill), disabled (grey)
  - Show selection summary below grid: "10:00 AM – 12:00 PM (2 hours)"
  - Update "Confirm & Pay" to use selection's start_time and end_time
  - Send times in 24-hour format to API

- [x] 6. Update booking display pages
  - In `app/service-booking-confirmed.tsx`: display time range from params (convert 24hr to 12hr for display)
  - In `app/view-service-booking.tsx`: display `start_time – end_time` (handle both old "08:00 AM" and new "08:00" formats)
  - In `app/(tabs)/my-bookings.tsx`: show time range on service booking cards (handle null gracefully)

- [x] 7. Update backend booked-dates endpoint
  - In `admin/server/index.js`: modify `GET /api/service-listings/:id/booked-dates`
  - Fetch the listing's `blocked_slots` field
  - Filter blocked_slots to only include entries for dates >= today
  - Return `{ bookings, blocked_dates, blocked_slots }` in the response
  - Ensure backward compatibility (old clients that don't expect blocked_slots still work)

- [x] 8. Final verification and cleanup
  - Run all Jest tests (existing + new timeSlots tests)
  - Verify TypeScript compilation passes
  - Test: slot grid renders correctly with default config (08:00-20:00)
  - Test: slot grid renders correctly with custom config (09:00-18:00)
  - Test: selecting slots works (tap, extend, shrink, max limit)
  - Test: booked slots are disabled
  - Test: booking creation sends correct start_time/end_time
  - Test: confirmation page shows correct time range
  - Test: old bookings still display correctly
  - Remove any unused session-related code

## Task Dependency Graph

```json
{
  "waves": [
    {"wave": 1, "tasks": [1, 2, 3]},
    {"wave": 2, "tasks": [4, 7]},
    {"wave": 3, "tasks": [5, 6]},
    {"wave": 4, "tasks": [8]}
  ]
}
```

Wave 1: Schema + types + utility module (parallel). Wave 2: Tests + backend update. Wave 3: Frontend UI changes. Wave 4: Final verification.

## Notes

- Times are stored in 24-hour format (HH:MM) in the database but displayed in 12-hour format (h:mm AM/PM) to users.
- The slot grid replaces the 3-session cards entirely — no backward-compatible "session mode" is needed in the UI.
- Old bookings with "08:00 AM" format start_time will be converted to 24hr for overlap checking in the slot generation function.
- The `blocked_slots` field on service_listings is managed by the owner via the admin panel. Admin panel changes are out of scope for this task (can be added later).
- Default values ensure existing listings work without any owner action.
