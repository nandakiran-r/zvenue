# Session-Based Pricing Bugfix Design

## Overview

The venue booking application uses three fixed booking sessions (Morning 8AM–4PM, Evening 5PM–12AM, Full Day 8AM–12AM), but the pricing model stores `price_per_hour` and `price_per_day` and derives session costs via multiplication. This creates a mismatch between what owners configure and what users are charged. The fix introduces explicit session price fields (`price_morning`, `price_evening`, `price_full_day`) in the database, admin panel, owner portal, mobile app, and API layer so that booking calculations use direct session prices instead of hourly-rate multiplication.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — when a booking total is calculated using `price_per_hour × session_hours` instead of a direct session price
- **Property (P)**: The desired behavior — booking totals use `venue.price_[session_id] + ₹500 service fee` directly
- **Preservation**: Existing behaviors that must remain unchanged — service fee logic, registration fee flow, availability checking, existing booking records, approval workflow
- **SESSIONS**: The three hardcoded booking sessions defined in `app/booking-detail.tsx`: morning (8h), evening (7h), fullday (16h)
- **calculateBookingTotal**: The inline pricing logic in `app/booking-detail.tsx` that computes `hourlyRate * hoursBooked + serviceFee`
- **venues schema**: The Drizzle ORM table definition in `admin/server/db/schema.js` containing `price_per_hour` and `price_per_day` columns
- **DbVenue**: The TypeScript interface in `lib/types.ts` representing a venue record

## Bug Details

### Bug Condition

The bug manifests when a user books any session and the system calculates the price by multiplying `price_per_hour × session.hours` instead of reading a direct session price from the venue record. This means owners must reverse-engineer an hourly rate that produces the correct session prices, and `price_per_day` is a display-only field with no guaranteed accuracy relative to actual booking costs.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type BookingPriceCalculation
  OUTPUT: boolean
  
  RETURN input.venue HAS FIELD "price_per_hour"
         AND input.venue DOES NOT HAVE FIELDS ["price_morning", "price_evening", "price_full_day"]
         AND input.sessionType IN ["morning", "evening", "fullday"]
         AND input.calculationMethod = "price_per_hour × session.hours"
END FUNCTION
```

### Examples

- **Morning session**: Owner sets `price_per_hour = 1000`. User books morning → system calculates `1000 × 8 = ₹8,000 + ₹500 = ₹8,500`. Owner actually wanted to charge ₹7,000 for morning but has no way to set that directly.
- **Evening session**: Owner sets `price_per_hour = 1000`. User books evening → system calculates `1000 × 7 = ₹7,000 + ₹500 = ₹7,500`. The evening price is forced to be exactly 7/8 of the morning price.
- **Full Day session**: Owner sets `price_per_hour = 1000`, `price_per_day = 12000`. User books full day → system calculates `1000 × 16 = ₹16,000 + ₹500 = ₹16,500`. The displayed `price_per_day` of ₹12,000 is never used in the calculation.
- **Listing card mismatch**: Venue card shows "₹12,000 Per Day" but actual full-day booking costs ₹16,500 (including service fee), creating user confusion.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- The ₹500 service fee must continue to be added to the session subtotal for all bookings
- The registration fee "pay now" / "balance at venue" flow must remain unchanged
- Date and session availability checking against blocked dates and existing bookings must remain unchanged
- All existing booking records in the database must retain their original amounts (no retroactive recalculation)
- Venue sorting by price on listing pages must continue to work correctly
- The admin approval/rejection workflow must remain unchanged
- Venue image gallery, amenities, reviews, and all non-pricing UI must remain unchanged

**Scope:**
All inputs that do NOT involve booking price calculation or price display should be completely unaffected by this fix. This includes:
- User authentication and subscription flows
- Booking date selection and availability logic
- Payment processing via Razorpay
- Push notifications and WhatsApp alerts
- Owner account management
- Category management

## Hypothesized Root Cause

Based on the bug description, the most likely issues are:

1. **Schema Design Mismatch**: The database schema (`admin/server/db/schema.js`) only has `price_per_hour` and `price_per_day` columns. There are no columns for individual session prices, forcing the application to derive session costs from hourly rates.

2. **Hardcoded Calculation in Mobile App**: In `app/booking-detail.tsx`, the pricing logic is inline: `const subtotal = hourlyRate * hoursBooked`. This directly multiplies the hourly rate by session hours rather than looking up a session-specific price.

3. **Disconnected Display Field**: `price_per_day` exists in the schema and is displayed on venue detail pages and listing cards, but is never used in any booking calculation. It's a manual entry with no validation against actual session pricing.

4. **Type System Gap**: The `DbVenue` interface in `lib/types.ts` only defines `price_per_hour` and `price_per_day`, so there's no type-level support for session prices throughout the stack.

5. **Admin/Owner Form Design**: Both the admin panel (`admin/src/features/venues/index.tsx`) and owner portal (`admin/src/features/owner-portal/owner-venues.tsx`) only present `price_per_hour` and `price_per_day` input fields, giving no way to set session-specific prices.

## Correctness Properties

Property 1: Bug Condition - Session Price Direct Lookup

_For any_ booking where a user selects a session (morning, evening, or fullday) for a venue that has session price fields populated, the fixed booking calculation SHALL use `venue.price_[session_id]` as the subtotal (not `price_per_hour × hours`), and the total SHALL equal `venue.price_[session_id] + 500`.

**Validates: Requirements 2.2, 2.3, 2.4**

Property 2: Preservation - Non-Pricing Behavior Unchanged

_For any_ operation that does not involve booking price calculation or price display (availability checks, payment processing, registration fee flow, existing booking records, approval workflow), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

Property 3: Migration Correctness - Auto-Calculated Session Prices

_For any_ venue migrated from the old pricing model, the migration SHALL set `price_morning = price_per_hour × 8`, `price_evening = price_per_hour × 7`, and `price_full_day = price_per_hour × 16`, ensuring no venue has null session prices after migration.

**Validates: Requirements 2.7**

Property 4: Admin/Owner Input - Session Price Fields

_For any_ venue create or update operation through the admin panel or owner portal, the system SHALL accept and persist `price_morning`, `price_evening`, and `price_full_day` values, and these SHALL be the values used in subsequent booking calculations.

**Validates: Requirements 2.1**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `admin/server/db/schema.js`

**Change**: Add session price columns to venues table

**Specific Changes**:
1. **Add Schema Columns**: Add `price_morning` (real, default 0), `price_evening` (real, default 0), `price_full_day` (real, default 0) columns to the venues table definition.

2. **Create Migration**: Write a Drizzle migration that:
   - Adds the three new columns
   - Populates them from existing data: `price_morning = price_per_hour × 8`, `price_evening = price_per_hour × 7`, `price_full_day = price_per_hour × 16`
   - Keeps `price_per_hour` and `price_per_day` for backward compatibility (can be deprecated later)

**File**: `lib/types.ts`

**Change**: Update DbVenue interface

**Specific Changes**:
3. **Add Type Fields**: Add `price_morning: number`, `price_evening: number`, `price_full_day: number` to the `DbVenue` interface.

**File**: `app/booking-detail.tsx`

**Change**: Replace hourly calculation with direct session price lookup

**Specific Changes**:
4. **Replace Pricing Logic**: Change from:
   ```typescript
   const subtotal = hourlyRate * hoursBooked;
   ```
   To:
   ```typescript
   const sessionPriceMap = { morning: venue?.price_morning, evening: venue?.price_evening, fullday: venue?.price_full_day };
   const subtotal = sessionPriceMap[currentSession?.id] ?? 0;
   ```

**File**: `app/venue-detail.tsx`

**Change**: Update price display to show session prices

**Specific Changes**:
5. **Update Price Display**: Replace the `/hour` price display in the pricing block and the `Per Day` stat with session-based pricing information (e.g., show lowest session price as "from ₹X" or show full-day price).

**File**: `admin/src/features/venues/index.tsx`

**Change**: Replace price_per_hour/price_per_day form fields with session price fields

**Specific Changes**:
6. **Update Admin Form**: Replace the `Price/Hour` and `Price/Day` inputs with `Price Morning (₹)`, `Price Evening (₹)`, and `Price Full Day (₹)` inputs. Update `defaultVenueForm`, form state, validation, and payload construction.

**File**: `admin/src/features/owner-portal/owner-venues.tsx`

**Change**: Replace price_per_hour/price_per_day form fields with session price fields

**Specific Changes**:
7. **Update Owner Form**: Same changes as admin form — replace hourly/daily inputs with session price inputs. Update form state, table display column, and payload.

**File**: `admin/server/index.js`

**Change**: Update venue API endpoints to handle new fields

**Specific Changes**:
8. **Update API Layer**: Ensure venue create/update endpoints accept and persist `price_morning`, `price_evening`, `price_full_day`. Update any venue listing queries that sort by price to use `price_full_day` (or the appropriate session price) for sorting.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate booking price calculations for each session type and assert that the result matches a direct session price rather than an hourly multiplication. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Morning Session Calculation Test**: Create a venue with `price_per_hour = 1000` and `price_morning = 7000`. Calculate morning booking total. On unfixed code, result will be `8000 + 500 = 8500` instead of `7000 + 500 = 7500` (will fail on unfixed code)
2. **Evening Session Calculation Test**: Create a venue with `price_per_hour = 1000` and `price_evening = 6000`. Calculate evening booking total. On unfixed code, result will be `7000 + 500 = 7500` instead of `6000 + 500 = 6500` (will fail on unfixed code)
3. **Full Day Session Calculation Test**: Create a venue with `price_per_hour = 1000` and `price_full_day = 12000`. Calculate full day booking total. On unfixed code, result will be `16000 + 500 = 16500` instead of `12000 + 500 = 12500` (will fail on unfixed code)
4. **Price Display Consistency Test**: Verify that the price shown on listing cards matches the actual full-day booking cost (will fail on unfixed code if `price_per_day ≠ price_per_hour × 16`)

**Expected Counterexamples**:
- Booking totals do not match direct session prices because the calculation multiplies hourly rate by hours
- Possible causes: inline multiplication logic in booking-detail.tsx, missing session price fields in schema

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := calculateBookingTotal_fixed(input)
  ASSERT result.subtotal = input.venue.price_[input.sessionType]
  ASSERT result.total = result.subtotal + 500
  ASSERT result.total != input.venue.price_per_hour * input.session.hours + 500
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalBehavior(input) = fixedBehavior(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for service fee addition, registration fee flow, and availability checking, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Service Fee Preservation**: Verify that ₹500 service fee is always added to the session subtotal regardless of pricing model
2. **Registration Fee Flow Preservation**: Verify that when `registration_fee > 0`, the "pay now" amount equals the registration fee and balance equals `total - registration_fee`
3. **Availability Check Preservation**: Verify that blocked dates and existing bookings still prevent double-booking
4. **Existing Booking Amounts Preservation**: Verify that no existing booking records have their amounts modified by the migration

### Unit Tests

- Test booking price calculation with each session type using direct session prices
- Test migration logic: verify `price_morning = price_per_hour × 8`, `price_evening = price_per_hour × 7`, `price_full_day = price_per_hour × 16`
- Test edge cases: venue with zero prices, venue with very large prices, venue with missing session price fields (fallback behavior)
- Test admin/owner form validation: all three session prices must be > 0
- Test API endpoint accepts and returns new session price fields

### Property-Based Tests

- Generate random venue configurations with varying session prices and verify booking totals always equal `session_price + 500`
- Generate random venues and verify migration produces correct session prices from hourly rates
- Generate random non-pricing operations and verify they produce identical results before and after the fix
- Generate random session selections and verify the correct session price field is used for each session type

### Integration Tests

- Test full booking flow: create venue with session prices → user selects session → verify correct total displayed → complete payment
- Test admin creates venue with session prices → verify prices appear correctly in mobile app
- Test owner edits venue session prices → verify updated prices used in next booking
- Test migration: run migration on test database with existing venues → verify all venues have correct session prices
- Test listing card display: verify `price_full_day` (or lowest session price) is shown and sorting works correctly
