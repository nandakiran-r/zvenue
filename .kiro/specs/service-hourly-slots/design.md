# Technical Design Document

## Overview

Replace the 3-session service booking UI with a dynamic 30-minute slot grid. The slot grid is generated based on per-listing configuration (opening/closing times, max duration). Users select consecutive slots. The backend stores start_time/end_time in 24-hour HH:MM format. Blocked slots are stored as a JSON array on the listing.

## Architecture

```
Service Listing (DB)
├── opening_time: "09:00"
├── closing_time: "18:00"
├── max_booking_duration: 120 (minutes)
└── blocked_slots: [{ date, start, end }]

User Flow:
  Pick Date → Fetch booked-dates → Generate slot grid → Select consecutive slots → Confirm & Pay
```

## Components and Interfaces

### Slot Generation Function

```typescript
interface TimeSlot {
  id: string;        // "09:00", "09:30", "10:00"...
  label: string;     // "9:00 AM", "9:30 AM"...
  startTime: string; // "09:00" (24hr)
  endTime: string;   // "09:30" (24hr)
  status: 'available' | 'selected' | 'booked' | 'blocked' | 'past';
}

function generateSlots(
  openingTime: string,   // "09:00"
  closingTime: string,   // "18:00"
  bookedRanges: { start: string; end: string }[],
  blockedRanges: { start: string; end: string }[],
  selectedDate: string,  // for past-time check
): TimeSlot[]
```

### Consecutive Selection Logic

```typescript
interface SlotSelection {
  startSlotId: string;  // "10:00"
  endSlotId: string;    // "11:30" (end of last selected slot)
  count: number;        // number of slots selected
  duration: number;     // total minutes
}

function handleSlotTap(
  tappedSlotId: string,
  currentSelection: SlotSelection | null,
  maxSlots: number,
  allSlots: TimeSlot[],
): SlotSelection | null
```

**Selection rules:**
1. Tap an available slot → start new selection (1 slot)
2. Tap the slot immediately after current selection → extend selection (if under max)
3. Tap the slot immediately before current selection → extend backward
4. Tap a non-adjacent slot → start new selection from that slot
5. Tap an already-selected slot → shrink selection (deselect from that point)

### Updated Service Listing Type

```typescript
interface DbServiceListing {
  // ... existing fields ...
  opening_time: string | null;         // "09:00" (24hr), default "08:00"
  closing_time: string | null;         // "18:00" (24hr), default "20:00"
  max_booking_duration: number | null; // minutes, default 480
  blocked_slots: BlockedSlot[] | null; // JSON array
}

interface BlockedSlot {
  date: string;   // "2026-06-16"
  start: string;  // "12:00"
  end: string;    // "14:00"
}
```

### Updated Booked-Dates API Response

```typescript
interface ServiceBookedDatesResponse {
  bookings: { booking_date: string; start_time: string; end_time: string }[];
  blocked_dates: string[];
  blocked_slots: { date: string; start: string; end: string }[];
}
```

## Data Models

### Database Changes (service_listings table)

```sql
ALTER TABLE "service_listings" ADD COLUMN "opening_time" varchar(5) DEFAULT '08:00';
ALTER TABLE "service_listings" ADD COLUMN "closing_time" varchar(5) DEFAULT '20:00';
ALTER TABLE "service_listings" ADD COLUMN "max_booking_duration" integer DEFAULT 480;
ALTER TABLE "service_listings" ADD COLUMN "blocked_slots" jsonb DEFAULT '[]';
```

### Time Format

All times stored in **24-hour HH:MM format** in the database:
- "08:00", "08:30", "09:00"... "19:30", "20:00"
- Display to user in 12-hour format: "8:00 AM", "8:30 AM"... "7:30 PM", "8:00 PM"

### Slot Grid Layout

```
3 columns × N rows
Each cell: 30-min slot showing start time
Colors: available (white/surface), selected (primary), disabled (grey)
```

## Error Handling

| Scenario | Handling |
|----------|----------|
| Listing has no time config | Use defaults (08:00-20:00, max 480min) |
| User tries to exceed max duration | Disable further slot selection, show "Maximum X hours reached" |
| Slot becomes booked while user is selecting | On payment attempt, backend returns conflict error |
| blocked_slots JSON is malformed | Treat as empty array, log warning |
| Old bookings with "08:00 AM" format | Convert to 24hr for slot overlap check |

## Correctness Properties

### Property 1: Slot Generation Completeness
For any valid opening_time and closing_time, the generated slots SHALL cover every 30-minute interval from opening to closing without gaps or overlaps.
**Validates: Requirements 2.1, 2.3**

### Property 2: Consecutive Selection Invariant
At any point during selection, the selected slots SHALL form a contiguous sequence with no gaps, and the total count SHALL not exceed max_booking_duration / 30.
**Validates: Requirements 3.2, 3.4**

### Property 3: Overlap Detection Correctness
A slot SHALL be marked as booked if and only if its time range [start, end) overlaps with any existing booking's [start_time, end_time) range.
**Validates: Requirements 4.2**

## Testing Strategy

- Unit test: `generateSlots()` with various opening/closing times
- Unit test: `handleSlotTap()` selection logic (extend, shrink, new selection, max limit)
- Unit test: overlap detection with old-format and new-format bookings
- Integration: booking flow end-to-end with slot selection
- E2E: Maestro test for slot selection UI

## Files Modified

| File | Change |
|------|--------|
| `admin/server/db/schema.js` | Add 4 columns to service_listings |
| `admin/server/drizzle/0007_service_time_slots.sql` | Migration |
| `admin/server/index.js` | Update booked-dates endpoint to include blocked_slots |
| `lib/serviceTypes.ts` | Update DbServiceListing type |
| `lib/timeSlots.ts` | **NEW** — slot generation + selection logic |
| `app/service-booking-detail.tsx` | Replace session UI with slot grid |
| `app/service-booking-confirmed.tsx` | Update time display |
| `app/view-service-booking.tsx` | Update time display |
| `app/(tabs)/my-bookings.tsx` | Update time display |
| `__tests__/lib/timeSlots.test.ts` | **NEW** — unit tests |
