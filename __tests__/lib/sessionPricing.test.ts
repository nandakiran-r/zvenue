/**
 * Bug Condition Exploration Test - Session-Based Pricing
 *
 * Validates: Requirements 2.2, 2.3, 2.4
 *
 * Property 1: Bug Condition - Hourly Rate Multiplication Instead of Direct Session Price
 *
 * These tests assert the EXPECTED (correct) behavior:
 * - Booking subtotals should use direct session prices (price_morning, price_evening, price_full_day)
 * - NOT price_per_hour × session hours
 *
 * EXPECTED OUTCOME: Tests FAIL on unfixed code because the current implementation
 * uses `price_per_hour × hours` instead of direct session prices.
 * Failure confirms the bug exists.
 */

import { calculateBookingTotal, type SessionInfo, type VenuePricing } from '@/lib/pricing';

describe('Bug Condition: Session Price Direct Lookup', () => {
  // Venue where session prices differ from price_per_hour × hours
  const venue: VenuePricing = {
    price_per_hour: 1000,
    price_per_day: 12000,
    price_morning: 7000,
    price_evening: 6000,
    price_full_day: 12000,
  };

  const morningSession: SessionInfo = { id: 'morning', hours: 8 };
  const eveningSession: SessionInfo = { id: 'evening', hours: 7 };
  const fulldaySession: SessionInfo = { id: 'fullday', hours: 16 };

  describe('Morning session pricing', () => {
    it('should use price_morning (7000) as subtotal, not price_per_hour × 8 (8000)', () => {
      const result = calculateBookingTotal(venue, morningSession);

      // Expected: subtotal = price_morning = 7000
      // Bug: subtotal = price_per_hour × 8 = 1000 × 8 = 8000
      expect(result.subtotal).toBe(7000);
    });

    it('should calculate total as price_morning + service fee (7000 + 500 = 7500)', () => {
      const result = calculateBookingTotal(venue, morningSession);

      // Expected: total = 7000 + 500 = 7500
      // Bug: total = 8000 + 500 = 8500
      expect(result.total).toBe(7500);
    });
  });

  describe('Evening session pricing', () => {
    it('should use price_evening (6000) as subtotal, not price_per_hour × 7 (7000)', () => {
      const result = calculateBookingTotal(venue, eveningSession);

      // Expected: subtotal = price_evening = 6000
      // Bug: subtotal = price_per_hour × 7 = 1000 × 7 = 7000
      expect(result.subtotal).toBe(6000);
    });

    it('should calculate total as price_evening + service fee (6000 + 500 = 6500)', () => {
      const result = calculateBookingTotal(venue, eveningSession);

      // Expected: total = 6000 + 500 = 6500
      // Bug: total = 7000 + 500 = 7500
      expect(result.total).toBe(6500);
    });
  });

  describe('Full Day session pricing', () => {
    it('should use price_full_day (12000) as subtotal, not price_per_hour × 16 (16000)', () => {
      const result = calculateBookingTotal(venue, fulldaySession);

      // Expected: subtotal = price_full_day = 12000
      // Bug: subtotal = price_per_hour × 16 = 1000 × 16 = 16000
      expect(result.subtotal).toBe(12000);
    });

    it('should calculate total as price_full_day + service fee (12000 + 500 = 12500)', () => {
      const result = calculateBookingTotal(venue, fulldaySession);

      // Expected: total = 12000 + 500 = 12500
      // Bug: total = 16000 + 500 = 16500
      expect(result.total).toBe(12500);
    });
  });

  describe('Service fee consistency', () => {
    it('should always add ₹500 service fee when a session is selected', () => {
      const morningResult = calculateBookingTotal(venue, morningSession);
      const eveningResult = calculateBookingTotal(venue, eveningSession);
      const fulldayResult = calculateBookingTotal(venue, fulldaySession);

      expect(morningResult.serviceFee).toBe(500);
      expect(eveningResult.serviceFee).toBe(500);
      expect(fulldayResult.serviceFee).toBe(500);
    });

    it('should have ₹0 service fee when no session is selected', () => {
      const result = calculateBookingTotal(venue, null);
      expect(result.serviceFee).toBe(0);
      expect(result.subtotal).toBe(0);
      expect(result.total).toBe(0);
    });
  });
});
