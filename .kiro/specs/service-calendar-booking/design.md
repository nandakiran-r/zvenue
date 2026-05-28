# Technical Design Document

## Overview

This feature adds calendar-based date/session booking to services, replicating the venue booking pattern. The main deliverable is a new `service-booking-detail.tsx` page that mirrors `booking-detail.tsx` but adapted for service listings. The existing service payment flow (Razorpay WebView) is preserved — we just add date/session selection before payment. Backend changes are required to support a booked-dates endpoint and accept date/time in the order creation API.

## Architecture

The service booking flow becomes a 3-step process matching venues:

```
service-detail.tsx ("Book Now" button)
    → service-booking-detail.tsx (NEW: calendar + session + quantity + pay)
        → Razorpay WebView (payment)
            → service-booking-confirmed.tsx (updated: shows date/session)
```

Key architectural decisions:
- **New page, not modal:** The calendar booking is a full-screen page (`app/service-booking-detail.tsx`), not embedded in service-detail. This keeps service-detail focused on information display.
- **Reuse pattern, not component:** The calendar logic is copied from `booking-detail.tsx` rather than extracted into a shared component. This avoids coupling the two flows and allows independent evolution. A shared component can be extracted later if needed.
- **Backend-first availability:** Booked dates come from the server. The calendar disables dates/sessions based on API response, same as venues.
- **Extend existing API types:** `ServiceCreateOrderInput` gains optional `booking_date`, `start_time`, `end_time` fields. The backend handles these if present.

## Components and Interfaces

### New Page: `app/service-booking-detail.tsx`

```typescript
// Route params
type Params = { id: string }; // service listing ID

// Internal state (mirrors booking-detail.tsx)
const [listing, setListing] = useState<DbServiceListing | null>(null);
const [loading, setLoading] = useState(true);
const [submitting, setSubmitting] = useState(false);

// Calendar state
const [currentMonth, setCurrentMonth] = useState(new Date());
const [selectedDate, setSelectedDate] = useState<string | null>(null);
const [bookedDates, setBookedDates] = useState<BookedDateEntry[]>([]);
const [blockedDates, setBlockedDates] = useState<string[]>([]);

// Session state
const [selectedSession, setSelectedSession] = useState<string | null>(null);

// Quantity
const [quantity, setQuantity] = useState(1);

// Payment
const [paymentModalVisible, setPaymentModalVisible] = useState(false);
const [paymentHtml, setPaymentHtml] = useState<string | null>(null);
const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
```

### Updated Interface: `ServiceCreateOrderInput`

```typescript
export interface ServiceCreateOrderInput {
  service_listing_id: string;
  quantity: number;
  booking_date: string;    // NEW: "YYYY-MM-DD"
  start_time: string;      // NEW: "08:00 AM"
  end_time: string;        // NEW: "12:00 PM"
}
```

### Updated Interface: `DbServiceBooking`

```typescript
export interface DbServiceBooking {
  // ... existing fields ...
  booking_date: string | null;   // NEW
  start_time: string | null;     // NEW
  end_time: string | null;       // NEW
}
```

### New API Function: `fetchServiceBookedDates`

```typescript
export interface ServiceBookedDateEntry {
  booking_date: string;
  start_time: string;
  end_time: string;
}

export async function fetchServiceBookedDates(listingId: string): Promise<{
  bookings: ServiceBookedDateEntry[];
  blocked_dates: string[];
}> {
  const { data } = await api.get(`/api/service-listings/${listingId}/booked-dates`);
  if (Array.isArray(data)) {
    return { bookings: data, blocked_dates: [] };
  }
  return data;
}
```

### Session Constants (Shared)

```typescript
const SESSIONS = [
  { id: 'morning', label: 'Morning Session', time: '08:00 AM – 12:00 PM', start: '08:00 AM', end: '12:00 PM', hours: 4 },
  { id: 'afternoon', label: 'Afternoon Session', time: '01:00 PM – 05:00 PM', start: '01:00 PM', end: '05:00 PM', hours: 4 },
  { id: 'fullday', label: 'Full Day', time: '08:00 AM – 05:00 PM', start: '08:00 AM', end: '05:00 PM', hours: 9 },
];
```

### Modified: `service-detail.tsx`

```typescript
// "Book Now" button navigates instead of triggering payment directly
const handleBookNow = () => {
  if (!isSignedIn) {
    showAlert({ ... "Please log in to book this service." ... });
    return;
  }
  router.push({ pathname: "/service-booking-detail" as any, params: { id: listing.id } });
};
```

## Data Models

### Service Booking Page Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│              service-booking-detail.tsx                       │
│                                                              │
│  On Mount:                                                   │
│  ├── fetchServiceListingById(id) → listing state             │
│  └── fetchServiceBookedDates(id) → bookedDates, blockedDates │
│                                                              │
│  User Selects: date → session → quantity                     │
│                                                              │
│  On "Confirm & Pay":                                         │
│  ├── createServiceOrder({                                    │
│  │     service_listing_id, quantity,                         │
│  │     booking_date, start_time, end_time                    │
│  │   })                                                      │
│  ├── Open Razorpay WebView                                   │
│  ├── verifyServicePayment({ order_id, payment_id,            │
│  │     signature, booking_id })                              │
│  └── Navigate to service-booking-confirmed                   │
└─────────────────────────────────────────────────────────────┘
```

### Pricing Calculation

```typescript
const unitPrice = listing.price;
const subtotal = unitPrice * quantity;
const discountPercent = isSubscribed ? listing.subscriber_discount_percent : 0;
const discount = Math.round(subtotal * discountPercent / 100);
const total = subtotal - discount;
```

Note: Services use a flat price per unit (no hourly rate). The session selection determines *when* the service is delivered, not the price. This differs from venues where session hours affect pricing.

## Error Handling

| Scenario | Handling |
|----------|----------|
| Service listing not found | Show error, navigate back |
| Booked dates API fails | Show retry button, allow booking without availability info (optimistic) |
| Session already booked (race condition) | Backend returns error on create-order; show "This session was just booked" message |
| Payment fails | Show error toast, remain on booking page with selections preserved |
| Payment cancelled | Show info toast, remain on booking page |
| Network error during payment verification | Show "Contact support" message with booking ID |
| Quantity exceeds available | Disable + button, show warning |

## Correctness Properties

### Property 1: Date/Session Required Before Payment
The "Confirm & Pay" button MUST be disabled until both `selectedDate` and `selectedSession` are non-null and quantity is ≥ 1.
**Validates: Requirements 7.1**

### Property 2: Booked Session Exclusion
A session marked as booked for the selected date MUST NOT be selectable. The `isSessionBooked` check MUST account for full-day bookings blocking all sessions.
**Validates: Requirements 4.2, 4.4, 4.5**

### Property 3: Calendar Date Constraints
Past dates and blocked dates MUST be disabled (not tappable). The `isPast` check uses `formatDateKey(new Date())` as the boundary.
**Validates: Requirements 3.3**

### Property 4: Quantity Bounds
Quantity MUST be ≥ 1 and ≤ `listing.quantity_available`. The increment function MUST check the upper bound before updating.
**Validates: Requirements 5.2, 5.3**

### Property 5: Payment Data Integrity
The `createServiceOrder` call MUST include the exact `booking_date`, `start_time`, and `end_time` from the user's selection. No defaults or fallbacks.
**Validates: Requirements 7.1**

## Testing Strategy

- Verify "Book Now" text appears on service-detail (not "Buy Now")
- Verify tapping "Book Now" navigates to service-booking-detail page
- Verify calendar renders with correct month, days, and booked date indicators
- Verify past dates are not tappable
- Verify session selection appears only after date is selected
- Verify booked sessions show "Booked" and are disabled
- Verify quantity +/- respects bounds
- Verify pricing updates when quantity changes
- Verify subscriber discount is applied correctly
- Verify "Confirm & Pay" is disabled until date + session + quantity are set
- Verify Razorpay WebView opens with correct amount
- Verify successful payment navigates to confirmation with date/session info
- Verify failed/cancelled payment shows error and stays on page
- Verify confirmation page shows booking date and session
- Verify view-service-booking page shows date and session

## Files Modified

| File | Change |
|------|--------|
| `app/service-detail.tsx` | Rename "Buy Now" → "Book Now", change `handleBuyNow` to navigate to booking page |
| `app/service-booking-detail.tsx` | **NEW** — Calendar booking page for services |
| `app/service-booking-confirmed.tsx` | Add date/session display to confirmation |
| `app/view-service-booking.tsx` | Add date/session to booking details card |
| `app/(tabs)/my-bookings.tsx` | Update empty state text; show date on service booking cards |
| `lib/serviceApi.ts` | Add `fetchServiceBookedDates` function |
| `lib/serviceTypes.ts` | Extend `ServiceCreateOrderInput` and `DbServiceBooking` with date/time fields |

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Backend doesn't have booked-dates endpoint yet | Frontend can be built first; mock the API response during development |
| Backend create-order doesn't accept date/time yet | Add fields as optional initially; backend ignores unknown fields |
| Calendar code duplication with booking-detail.tsx | Acceptable for now; extract shared calendar component in future iteration |
| Service may not need sessions (e.g., product delivery) | Sessions are required for this implementation; future: make sessions optional per service category |
