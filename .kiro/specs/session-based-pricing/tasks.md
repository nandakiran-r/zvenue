# Implementation Plan

## Overview

This task list implements the session-based pricing bugfix using the exploratory bugfix workflow: write tests to understand the bug, write preservation tests to protect existing behavior, implement the fix, then validate everything passes.

## Tasks

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Hourly Rate Multiplication Instead of Direct Session Price
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases: venues with `price_per_hour` set and session prices that differ from `price_per_hour × hours`
  - Create test file `__tests__/lib/sessionPricing.test.ts`
  - Extract the pricing calculation logic from `app/booking-detail.tsx` into a testable function (or test inline logic via mock)
  - Test that for a venue with `price_per_hour = 1000`, `price_morning = 7000`, `price_evening = 6000`, `price_full_day = 12000`:
    - Morning booking subtotal should be `7000` (not `1000 × 8 = 8000`)
    - Evening booking subtotal should be `6000` (not `1000 × 7 = 7000`)
    - Full Day booking subtotal should be `12000` (not `1000 × 16 = 16000`)
    - Total should be `subtotal + 500` service fee
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists because the current code uses `price_per_hour × hours`)
  - Document counterexamples found (e.g., "calculateBookingTotal({session: 'morning', venue: {price_per_hour: 1000, price_morning: 7000}}) returns 8500 instead of 7500")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.2, 2.3, 2.4_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Service Fee, Registration Fee Flow, and Availability Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Create test file `__tests__/lib/sessionPricingPreservation.test.ts`
  - Observe on UNFIXED code:
    - Service fee is always ₹500 when a session is selected (hoursBooked > 0)
    - Service fee is ₹0 when no session is selected (hoursBooked = 0)
    - When `registration_fee > 0`: payNow = registration_fee, balanceAtVenue = total - registration_fee
    - When `registration_fee = 0`: payNow = total, balanceAtVenue = 0
  - Write property-based tests using fast-check:
    - For all positive session prices and any session type, service fee is always 500
    - For all venues with registration_fee > 0, payNow equals registration_fee and balance equals total - registration_fee
    - For all venues with registration_fee = 0, payNow equals total and balance equals 0
    - For all non-pricing operations (availability checks), behavior is unchanged
  - Verify tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 3. Fix for session-based pricing - replace hourly multiplication with direct session price lookup

  - [ ] 3.1 Add session price columns to database schema
    - Add `price_morning` (real, default 0), `price_evening` (real, default 0), `price_full_day` (real, default 0) columns to venues table in `admin/server/db/schema.js`
    - Keep existing `price_per_hour` and `price_per_day` columns for backward compatibility
    - _Bug_Condition: isBugCondition(input) where venue has price_per_hour but no session price fields_
    - _Expected_Behavior: venue record contains price_morning, price_evening, price_full_day fields_
    - _Preservation: Existing columns remain unchanged, no data loss_
    - _Requirements: 2.1, 2.7_

  - [ ] 3.2 Create Drizzle migration for session price columns
    - Generate migration that adds the three new columns
    - Auto-populate from existing data: `price_morning = price_per_hour × 8`, `price_evening = price_per_hour × 7`, `price_full_day = price_per_hour × 16`
    - Ensure no venue has NULL session prices after migration
    - _Bug_Condition: venues with only price_per_hour need session prices derived_
    - _Expected_Behavior: All venues have price_morning, price_evening, price_full_day populated_
    - _Preservation: Existing booking records and price_per_hour/price_per_day values unchanged_
    - _Requirements: 2.7, 3.4_

  - [ ] 3.3 Update DbVenue interface in `lib/types.ts`
    - Add `price_morning: number`, `price_evening: number`, `price_full_day: number` to the DbVenue interface
    - Keep `price_per_hour` and `price_per_day` for backward compatibility
    - _Requirements: 2.1_

  - [ ] 3.4 Replace pricing calculation in `app/booking-detail.tsx`
    - Replace `const subtotal = hourlyRate * hoursBooked` with session price lookup:
      ```typescript
      const sessionPriceMap = { morning: venue?.price_morning, evening: venue?.price_evening, fullday: venue?.price_full_day };
      const subtotal = sessionPriceMap[currentSession?.id] ?? 0;
      ```
    - Keep service fee logic unchanged: `const serviceFee = subtotal > 0 ? 500 : 0`
    - Keep registration fee flow unchanged
    - _Bug_Condition: isBugCondition(input) where calculationMethod = "price_per_hour × session.hours"_
    - _Expected_Behavior: result.subtotal = venue.price_[sessionType], result.total = subtotal + 500_
    - _Preservation: Service fee (₹500), registration fee flow, availability checking unchanged_
    - _Requirements: 2.2, 2.3, 2.4, 3.1, 3.2_

  - [ ] 3.5 Update venue detail display in `app/venue-detail.tsx`
    - Replace "/hour" price display with session-based pricing (e.g., "Morning: ₹X", "Evening: ₹Y", "Full Day: ₹Z")
    - Remove or replace "Per Day" stat that showed `price_per_day`
    - _Expected_Behavior: Display shows actual session prices that match booking calculations_
    - _Preservation: Non-pricing UI (images, amenities, reviews, map) unchanged_
    - _Requirements: 2.5_

  - [ ] 3.6 Update admin venue form in `admin/src/features/venues/index.tsx`
    - Replace `Price/Hour` and `Price/Day` inputs with `Price Morning (₹)`, `Price Evening (₹)`, `Price Full Day (₹)` inputs
    - Update `defaultVenueForm` to include `price_morning: 0, price_evening: 0, price_full_day: 0`
    - Update form validation: all three session prices must be > 0
    - Update payload construction to send session price fields
    - _Expected_Behavior: Admin can set explicit session prices_
    - _Preservation: Approval workflow, other form fields unchanged_
    - _Requirements: 2.1, 3.6_

  - [ ] 3.7 Update owner portal form in `admin/src/features/owner-portal/owner-venues.tsx`
    - Replace `Price/Hour` and `Price/Day` inputs with session price inputs
    - Update form state, table display column, and payload
    - _Expected_Behavior: Owner can set explicit session prices_
    - _Preservation: Owner approval workflow unchanged_
    - _Requirements: 2.1, 3.6_

  - [ ] 3.8 Update server API in `admin/server/index.js`
    - Add `price_morning`, `price_evening`, `price_full_day` to ALLOWED_VENUE_FIELDS whitelist
    - Add validation: session prices must be numeric and > 0
    - Update any venue listing queries that sort by price to use `price_full_day` for sorting
    - _Expected_Behavior: API accepts and persists session price fields_
    - _Preservation: Other API endpoints, authentication, error handling unchanged_
    - _Requirements: 2.1, 3.5_

  - [ ] 3.9 Update listing cards in `app/(tabs)/home.tsx`, `app/(tabs)/search.tsx`, `app/(tabs)/favorites.tsx`, `app/category-venues.tsx`
    - Replace `price_per_day` display with `price_full_day` (or "From ₹X" using lowest session price)
    - Ensure price sorting uses `price_full_day` field
    - _Expected_Behavior: Listing cards show price_full_day which matches actual full-day booking cost_
    - _Preservation: Card layout, images, ratings, other non-pricing display unchanged_
    - _Requirements: 2.6, 3.5_

  - [ ] 3.10 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Session Price Direct Lookup
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed - subtotals now use direct session prices)
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ] 3.11 Verify preservation tests still pass
    - **Property 2: Preservation** - Service Fee, Registration Fee Flow, and Availability Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in service fee, registration fee, availability)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 4. Checkpoint - Ensure all tests pass
  - Run full test suite: `npx vitest --run`
  - Ensure bug condition test (task 1) now passes
  - Ensure preservation tests (task 2) still pass
  - Ensure no other existing tests are broken
  - Verify migration runs cleanly on a test database
  - Ask the user if questions arise

## Task Dependency Graph

```json
{
  "waves": [
    ["1", "2"],
    ["3.1"],
    ["3.2"],
    ["3.3"],
    ["3.4", "3.6", "3.7", "3.8"],
    ["3.5", "3.9"],
    ["3.10", "3.11"],
    ["4"]
  ]
}
```

## Notes

- Tasks 1 and 2 must be completed BEFORE any implementation tasks (3.x) to establish the bug condition and preservation baseline
- The exploration test (task 1) is expected to FAIL on unfixed code — this confirms the bug exists
- The preservation tests (task 2) are expected to PASS on unfixed code — this captures baseline behavior
- After implementation, task 3.10 re-runs the exploration test (should now PASS) and task 3.11 re-runs preservation tests (should still PASS)
- The migration (task 3.2) auto-populates session prices from existing `price_per_hour` values so no venue data is lost
- `price_per_hour` and `price_per_day` columns are kept for backward compatibility but will no longer be used in booking calculations
