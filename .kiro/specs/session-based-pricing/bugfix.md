# Bugfix Requirements Document

## Introduction

The venue booking application uses three fixed booking sessions (Morning: 8AM–4PM, Evening: 5PM–12AM, Full Day: 8AM–12AM), but the pricing model asks admins/owners to enter `price_per_hour` and `price_per_day`. The booking calculation multiplies `price_per_hour × session_hours`, which is an indirect and confusing way to price fixed-duration sessions. Additionally, `price_per_day` is only used for display on listing cards and is never used in any booking calculation, creating a disconnect between what owners configure and what users are charged.

This inconsistency causes confusion for venue owners (who think they're setting hourly rates) and for users (who see "/hour" and "Per Day" labels but can only book fixed sessions).

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an admin or owner creates/edits a venue THEN the system asks for `price_per_hour` and `price_per_day` fields, which do not correspond to the fixed-session booking model

1.2 WHEN a user books a Morning session (8 hours) THEN the system calculates the total as `price_per_hour × 8 + ₹500 service fee` instead of using a direct session price

1.3 WHEN a user books an Evening session (7 hours) THEN the system calculates the total as `price_per_hour × 7 + ₹500 service fee` instead of using a direct session price

1.4 WHEN a user books a Full Day session (16 hours) THEN the system calculates the total as `price_per_hour × 16 + ₹500 service fee` instead of using a direct session price

1.5 WHEN a user views the venue detail page THEN the system displays `price_per_hour` with a "/hour" label and `price_per_day` with a "Per Day" label, neither of which reflects the actual session-based pricing

1.6 WHEN a user views venue listing cards THEN the system displays `price_per_day` which is never used in booking calculations and may not match the actual full-day session cost

1.7 WHEN `price_per_day` is set by an owner THEN the system never uses this value in any booking calculation, making it a misleading display-only field with no guaranteed accuracy

### Expected Behavior (Correct)

2.1 WHEN an admin or owner creates/edits a venue THEN the system SHALL present three explicit session price fields: `price_morning`, `price_evening`, and `price_full_day`

2.2 WHEN a user books a Morning session THEN the system SHALL calculate the total as `price_morning + ₹500 service fee`

2.3 WHEN a user books an Evening session THEN the system SHALL calculate the total as `price_evening + ₹500 service fee`

2.4 WHEN a user books a Full Day session THEN the system SHALL calculate the total as `price_full_day + ₹500 service fee`

2.5 WHEN a user views the venue detail page THEN the system SHALL display session-based pricing (e.g., prices for Morning, Evening, and Full Day sessions) instead of "/hour" and "Per Day" labels

2.6 WHEN a user views venue listing cards THEN the system SHALL display the `price_full_day` value (or a "starting from" price using the lowest session price)

2.7 WHEN a venue is migrated from the old pricing model THEN the system SHALL auto-calculate session prices as: `price_morning = price_per_hour × 8`, `price_evening = price_per_hour × 7`, `price_full_day = price_per_hour × 16`

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user completes a booking THEN the system SHALL CONTINUE TO add a ₹500 service fee to the session subtotal

3.2 WHEN a venue has a registration fee configured THEN the system SHALL CONTINUE TO use the registration fee as the "pay now" amount with the balance due at the venue

3.3 WHEN a user selects a date and session on the booking page THEN the system SHALL CONTINUE TO check availability against blocked dates and existing bookings

3.4 WHEN existing bookings are stored in the database THEN the system SHALL CONTINUE TO preserve their recorded amounts unchanged (no retroactive recalculation)

3.5 WHEN a user sorts venues by price (low/high) on listing pages THEN the system SHALL CONTINUE TO sort venues by price correctly using the displayed price field

3.6 WHEN an admin approves or rejects a venue THEN the system SHALL CONTINUE TO follow the existing approval workflow without changes

---

## Bug Condition (Formal)

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type BookingPriceCalculation
  OUTPUT: boolean
  
  // The bug condition is met whenever a booking price is calculated
  // using hourly rate × session hours instead of a direct session price
  RETURN X.pricingModel = "hourly_derived" 
         AND X.sessionType IN {"morning", "evening", "fullday"}
END FUNCTION
```

```pascal
// Property: Fix Checking - Session prices used directly
FOR ALL X WHERE isBugCondition(X) DO
  result ← calculateBookingTotal'(X)
  ASSERT result.subtotal = X.venue.sessionPrice(X.sessionType)
  ASSERT result.total = result.subtotal + 500
END FOR
```

```pascal
// Property: Preservation Checking - Non-pricing behavior unchanged
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR
```
