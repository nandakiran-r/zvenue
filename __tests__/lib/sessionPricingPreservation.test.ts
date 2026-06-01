/**
 * Preservation Property Tests for Session-Based Pricing Bugfix
 *
 * These tests capture the CURRENT correct behavior that must be preserved
 * after the fix is implemented. They should PASS on unfixed code.
 *
 * **Validates: Requirements 3.1, 3.2**
 */

import * as fc from 'fast-check';
import { calculateBookingTotal, Session, VenuePricing } from '@/lib/pricing';

// The three fixed sessions as defined in app/booking-detail.tsx
const SESSIONS: Session[] = [
  { id: 'morning', label: 'Morning Session', time: '08:00 AM – 04:00 PM', start: '08:00 AM', end: '04:00 PM', hours: 8 },
  { id: 'evening', label: 'Evening Session', time: '05:00 PM – 12:00 AM', start: '05:00 PM', end: '12:00 AM', hours: 7 },
  { id: 'fullday', label: 'Full Day', time: '08:00 AM – 12:00 AM', start: '08:00 AM', end: '12:00 AM', hours: 16 },
];

// Arbitrary for a session selection (one of the three fixed sessions)
const sessionArb = fc.constantFrom(...SESSIONS);

// Arbitrary for a positive hourly rate (realistic venue pricing in INR)
const positiveRateArb = fc.integer({ min: 100, max: 100000 });

// Arbitrary for session prices derived from a base rate
const venuePricingArb = (regFee: number) => positiveRateArb.map(rate => ({
  price_per_hour: rate,
  price_morning: rate * 8,
  price_evening: rate * 7,
  price_full_day: rate * 16,
  registration_fee: regFee,
}));

// Arbitrary for registration fee (0 means no registration fee, positive means fee applies)
const registrationFeeArb = fc.integer({ min: 0, max: 50000 });

describe('Session Pricing Preservation Properties', () => {
  /**
   * Property: Service fee is always exactly 500 when a session is selected (hours > 0)
   *
   * **Validates: Requirements 3.1**
   */
  describe('Service Fee Property', () => {
    it('service fee is always 500 for any positive session price and any session', () => {
      fc.assert(
        fc.property(
          positiveRateArb,
          sessionArb,
          registrationFeeArb,
          (rate, session, regFee) => {
            const venue: VenuePricing = {
              price_per_hour: rate,
              price_morning: rate * 8,
              price_evening: rate * 7,
              price_full_day: rate * 16,
              registration_fee: regFee,
            };

            const result = calculateBookingTotal(venue, session);

            // Service fee must always be exactly 500 when a session is selected
            expect(result.serviceFee).toBe(500);
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  /**
   * Property: Service fee is 0 when no session is selected (hours = 0)
   *
   * **Validates: Requirements 3.1**
   */
  describe('Service Fee Zero Property', () => {
    it('service fee is 0 when no session is selected', () => {
      fc.assert(
        fc.property(
          positiveRateArb,
          registrationFeeArb,
          (rate, regFee) => {
            const venue: VenuePricing = {
              price_per_hour: rate,
              price_morning: rate * 8,
              price_evening: rate * 7,
              price_full_day: rate * 16,
              registration_fee: regFee,
            };

            // No session selected (null)
            const result = calculateBookingTotal(venue, null);

            expect(result.serviceFee).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: When registration_fee > 0, payNow equals registration_fee
   * and balanceAtVenue equals total - registration_fee
   *
   * **Validates: Requirements 3.2**
   */
  describe('Registration Fee Flow (fee > 0)', () => {
    it('payNow equals registration_fee and balanceAtVenue equals total - registration_fee', () => {
      fc.assert(
        fc.property(
          positiveRateArb,
          sessionArb,
          fc.integer({ min: 1, max: 50000 }), // registration fee > 0
          (rate, session, regFee) => {
            const venue: VenuePricing = {
              price_per_hour: rate,
              price_morning: rate * 8,
              price_evening: rate * 7,
              price_full_day: rate * 16,
              registration_fee: regFee,
            };

            const result = calculateBookingTotal(venue, session);

            expect(result.payNow).toBe(regFee);
            expect(result.balanceAtVenue).toBe(result.total - regFee);
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  /**
   * Property: When registration_fee = 0, payNow equals total
   * and balanceAtVenue equals 0
   *
   * **Validates: Requirements 3.2**
   */
  describe('Registration Fee Flow (fee = 0)', () => {
    it('payNow equals total and balanceAtVenue equals 0', () => {
      fc.assert(
        fc.property(
          positiveRateArb,
          sessionArb,
          (rate, session) => {
            const venue: VenuePricing = {
              price_per_hour: rate,
              price_morning: rate * 8,
              price_evening: rate * 7,
              price_full_day: rate * 16,
              registration_fee: 0,
            };

            const result = calculateBookingTotal(venue, session);

            expect(result.payNow).toBe(result.total);
            expect(result.balanceAtVenue).toBe(0);
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  /**
   * Property: Total always equals subtotal + serviceFee
   *
   * **Validates: Requirements 3.1**
   */
  describe('Total Calculation Property', () => {
    it('total always equals subtotal + serviceFee for any inputs', () => {
      fc.assert(
        fc.property(
          positiveRateArb,
          fc.constantFrom(null, ...SESSIONS),
          registrationFeeArb,
          (rate, session, regFee) => {
            const venue: VenuePricing = {
              price_per_hour: rate,
              price_morning: rate * 8,
              price_evening: rate * 7,
              price_full_day: rate * 16,
              registration_fee: regFee,
            };

            const result = calculateBookingTotal(venue, session);

            expect(result.total).toBe(result.subtotal + result.serviceFee);
          }
        ),
        { numRuns: 200 }
      );
    });
  });
});
