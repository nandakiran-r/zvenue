/**
 * Booking pricing calculation logic.
 *
 * Uses direct session prices (price_morning, price_evening, price_full_day).
 * Service fee is 500 when subtotal > 0, else 0.
 */

export interface Session {
  id: string;
  label: string;
  time: string;
  start: string;
  end: string;
  hours: number;
}

export interface SessionInfo {
  id: string;
  hours: number;
}

export interface VenuePricing {
  price_per_hour: number;
  price_per_day?: number;
  price_morning?: number;
  price_evening?: number;
  price_full_day?: number;
  registration_fee?: number;
}

export interface BookingPriceResult {
  subtotal: number;
  serviceFee: number;
  total: number;
  registrationFee: number;
  payNow: number;
  balanceAtVenue: number;
}

/**
 * Calculate booking total using direct session prices.
 * Looks up the session price from the venue's price_morning/price_evening/price_full_day fields.
 * Service fee is 500 when subtotal > 0, else 0.
 */
export function calculateBookingTotal(
  venue: VenuePricing | null,
  currentSession: Session | SessionInfo | null | undefined
): BookingPriceResult {
  const sessionPriceMap: Record<string, number | undefined> = {
    morning: venue?.price_morning,
    evening: venue?.price_evening,
    fullday: venue?.price_full_day,
  };

  const subtotal = (currentSession?.id ? sessionPriceMap[currentSession.id] : undefined) ?? 0;
  const serviceFee = subtotal > 0 ? 500 : 0;
  const total = subtotal + serviceFee;

  const registrationFee = venue?.registration_fee || 0;
  const payNow = registrationFee > 0 ? registrationFee : total;
  const balanceAtVenue = registrationFee > 0 ? total - registrationFee : 0;

  return {
    subtotal,
    serviceFee,
    total,
    registrationFee,
    payNow,
    balanceAtVenue,
  };
}
