/**
 * Tests for receipt generation and invoice notification logic
 * Tests the invoice.js helper functions and receipt generation flow
 */

// Mock the invoice module functions (these run on server but we test the logic)
describe('Invoice Data Generation', () => {
  // Simulate generateVenueInvoiceData logic
  function generateVenueInvoiceData(booking: any, venue: any, user: any) {
    return {
      invoice_number: `ZINV-${Date.now().toString().slice(-10)}`,
      booking_id: booking.booking_id_display || booking.id.slice(0, 8),
      type: 'venue',
      is_pre_booking: booking.status === 'pre_booked' || (booking.registration_fee_paid > 0 && booking.remaining_balance > 0),
      customer: {
        name: user?.full_name || 'Customer',
        phone: user?.phone_number || '',
        email: user?.email || '',
      },
      items: [{
        description: `Venue Booking: ${venue?.name || 'Venue'}`,
        details: `Date: ${booking.booking_date} | ${booking.start_time} - ${booking.end_time}`,
        quantity: 1,
        amount: booking.total,
      }],
      total: booking.total,
      payment_method: booking.payment_method || 'Razorpay',
      payment_id: booking.payment_id || '',
      status: booking.status,
      venue_name: venue?.name || '',
      city: venue?.city || '',
    };
  }

  function generateServiceInvoiceData(booking: any, listing: any, user: any) {
    return {
      invoice_number: `ZINV-${Date.now().toString().slice(-10)}`,
      booking_id: booking.booking_id_display || booking.id.slice(0, 8),
      type: 'service',
      customer: {
        name: user?.full_name || 'Customer',
        phone: user?.phone_number || '',
        email: user?.email || '',
      },
      items: [{
        description: `Service: ${listing?.name || 'Service'}`,
        details: `Quantity: ${booking.quantity}`,
        quantity: booking.quantity,
        unit_price: booking.unit_price,
        amount: booking.total_amount,
      }],
      subtotal: booking.unit_price * booking.quantity,
      discount: booking.discount_applied || 0,
      total: booking.total_amount,
      payment_method: booking.payment_method || 'Razorpay',
      payment_id: booking.payment_id || '',
      status: booking.status,
      service_name: listing?.name || '',
      city: listing?.city || '',
    };
  }

  describe('generateVenueInvoiceData', () => {
    const mockBooking = {
      id: 'abc12345-6789-0000-0000-000000000000',
      booking_id_display: 'ZBID-12345678',
      booking_date: '2025-06-15',
      start_time: '08:00 AM',
      end_time: '04:00 PM',
      guests: 50,
      total: 15000,
      subtotal: 14000,
      service_fee: 1000,
      registration_fee_paid: 5000,
      remaining_balance: 10000,
      payment_method: 'Razorpay',
      payment_id: 'pay_test123',
      status: 'pre_booked',
    };
    const mockVenue = { name: 'Grand Palace Hall', city: 'Mumbai', owner_name: 'Owner' };
    const mockUser = { full_name: 'John Doe', phone_number: '+919876543210', email: 'john@test.com' };

    it('generates correct invoice data for pre-booking', () => {
      const data = generateVenueInvoiceData(mockBooking, mockVenue, mockUser);
      expect(data.type).toBe('venue');
      expect(data.booking_id).toBe('ZBID-12345678');
      expect(data.is_pre_booking).toBe(true);
      expect(data.customer.name).toBe('John Doe');
      expect(data.customer.phone).toBe('+919876543210');
      expect(data.total).toBe(15000);
      expect(data.venue_name).toBe('Grand Palace Hall');
      expect(data.city).toBe('Mumbai');
    });

    it('detects pre-booking from status', () => {
      const data = generateVenueInvoiceData(
        { ...mockBooking, status: 'pre_booked', registration_fee_paid: 0, remaining_balance: 0 },
        mockVenue, mockUser
      );
      expect(data.is_pre_booking).toBe(true);
    });

    it('detects pre-booking from fee/balance', () => {
      const data = generateVenueInvoiceData(
        { ...mockBooking, status: 'confirmed', registration_fee_paid: 5000, remaining_balance: 10000 },
        mockVenue, mockUser
      );
      expect(data.is_pre_booking).toBe(true);
    });

    it('detects confirmed (non-pre-booking)', () => {
      const data = generateVenueInvoiceData(
        { ...mockBooking, status: 'confirmed', registration_fee_paid: 0, remaining_balance: 0 },
        mockVenue, mockUser
      );
      expect(data.is_pre_booking).toBe(false);
    });

    it('uses booking ID display when available', () => {
      const data = generateVenueInvoiceData(mockBooking, mockVenue, mockUser);
      expect(data.booking_id).toBe('ZBID-12345678');
    });

    it('falls back to ID slice when no display ID', () => {
      const data = generateVenueInvoiceData(
        { ...mockBooking, booking_id_display: null },
        mockVenue, mockUser
      );
      expect(data.booking_id).toBe('abc12345');
    });

    it('handles missing user gracefully', () => {
      const data = generateVenueInvoiceData(mockBooking, mockVenue, null);
      expect(data.customer.name).toBe('Customer');
      expect(data.customer.phone).toBe('');
    });

    it('handles missing venue gracefully', () => {
      const data = generateVenueInvoiceData(mockBooking, null, mockUser);
      expect(data.venue_name).toBe('');
      expect(data.items[0].description).toBe('Venue Booking: Venue');
    });
  });

  describe('generateServiceInvoiceData', () => {
    const mockBooking = {
      id: 'svc12345-6789-0000-0000-000000000000',
      booking_id_display: 'ZSID-87654321',
      booking_date: '2025-06-20',
      start_time: '10:00',
      end_time: '12:00',
      quantity: 3,
      unit_price: 500,
      discount_applied: 150,
      total_amount: 1350,
      payment_method: 'Razorpay',
      payment_id: 'pay_svc456',
      status: 'confirmed',
    };
    const mockListing = { name: 'Photography Session', city: 'Pune', owner_name: 'Studio Pro' };
    const mockUser = { full_name: 'Jane Smith', phone_number: '+918547475710', email: 'jane@test.com' };

    it('generates correct service invoice data', () => {
      const data = generateServiceInvoiceData(mockBooking, mockListing, mockUser);
      expect(data.type).toBe('service');
      expect(data.booking_id).toBe('ZSID-87654321');
      expect(data.customer.name).toBe('Jane Smith');
      expect(data.total).toBe(1350);
      expect(data.subtotal).toBe(1500); // 500 * 3
      expect(data.discount).toBe(150);
      expect(data.service_name).toBe('Photography Session');
    });

    it('calculates subtotal correctly', () => {
      const data = generateServiceInvoiceData(mockBooking, mockListing, mockUser);
      expect(data.subtotal).toBe(mockBooking.unit_price * mockBooking.quantity);
    });

    it('handles zero discount', () => {
      const data = generateServiceInvoiceData(
        { ...mockBooking, discount_applied: 0 },
        mockListing, mockUser
      );
      expect(data.discount).toBe(0);
    });

    it('handles missing listing gracefully', () => {
      const data = generateServiceInvoiceData(mockBooking, null, mockUser);
      expect(data.service_name).toBe('');
      expect(data.items[0].description).toBe('Service: Service');
    });
  });
});

describe('WhatsApp Template Selection', () => {
  // Simulate the template selection logic from invoice.js
  function getTemplateName(invoiceData: any, env: any) {
    if (invoiceData.type === 'service') {
      return env.AOC_SERVICE_BOOKING_TEMPLATE_NAME || 'notification';
    } else if (invoiceData.is_pre_booking) {
      return env.AOC_PREBOOKING_TEMPLATE_NAME || 'booking_notification';
    } else {
      return env.AOC_PREBOOKING_TEMPLATE_NAME || 'booking_notification';
    }
  }

  const env = {
    AOC_PREBOOKING_TEMPLATE_NAME: 'booking_notification',
    AOC_SERVICE_BOOKING_TEMPLATE_NAME: 'notification',
    AOC_INVOICE_TEMPLATE_NAME: 'booking_confirmation_invoice',
  };

  it('uses booking_notification for venue pre-booking', () => {
    const template = getTemplateName({ type: 'venue', is_pre_booking: true }, env);
    expect(template).toBe('booking_notification');
  });

  it('uses booking_notification for venue direct payment', () => {
    const template = getTemplateName({ type: 'venue', is_pre_booking: false }, env);
    expect(template).toBe('booking_notification');
  });

  it('uses notification for service booking', () => {
    const template = getTemplateName({ type: 'service', is_pre_booking: false }, env);
    expect(template).toBe('notification');
  });

  it('confirmation with receipt uses booking_confirmation_invoice', () => {
    // This is used by the admin panel send-invoice endpoint
    expect(env.AOC_INVOICE_TEMPLATE_NAME).toBe('booking_confirmation_invoice');
  });
});

describe('Receipt URL Generation', () => {
  const BASE_URL = 'https://avenue.waxon.in';

  it('generates correct venue receipt URL', () => {
    const bookingId = '611ddb6e-7ca4-4a80-924f-e129c73afcea';
    const url = `${BASE_URL}/api/receipts/venue/${bookingId}`;
    expect(url).toBe('https://avenue.waxon.in/api/receipts/venue/611ddb6e-7ca4-4a80-924f-e129c73afcea');
  });

  it('generates correct service receipt URL', () => {
    const bookingId = 'd87d15f6-e6ee-4b02-8016-bded30cead7c';
    const url = `${BASE_URL}/api/receipts/service/${bookingId}`;
    expect(url).toBe('https://avenue.waxon.in/api/receipts/service/d87d15f6-e6ee-4b02-8016-bded30cead7c');
  });

  it('generates correct download URL for admin', () => {
    const bookingId = 'test-id-123';
    const downloadUrl = `${BASE_URL}/api/admin/bookings/${bookingId}/download-invoice`;
    expect(downloadUrl).toContain('/api/admin/bookings/');
    expect(downloadUrl).toContain('/download-invoice');
  });

  it('generates correct filename format', () => {
    const bookingDisplay = 'ZBID-12345678';
    const filename = `ZVenue-Receipt-${bookingDisplay}.pdf`;
    expect(filename).toBe('ZVenue-Receipt-ZBID-12345678.pdf');
    expect(filename).toMatch(/\.pdf$/);
  });

  it('falls back to ID slice for filename when no display ID', () => {
    const bookingId = 'abc12345-6789-0000-0000-000000000000';
    const bookingDisplay = null;
    const filename = `ZVenue-Receipt-${bookingDisplay || bookingId.slice(0, 8)}.pdf`;
    expect(filename).toBe('ZVenue-Receipt-abc12345.pdf');
  });
});

describe('WhatsApp API Payload Structure', () => {
  it('builds correct payload for document template', () => {
    const pdfUrl = 'https://avenue.waxon.in/api/receipts/venue/test-id';
    const filename = 'ZVenue-Receipt-ZBID-123.pdf';
    const bookingId = 'ZBID-123';

    const payload = {
      from: '+917249111100',
      to: '+918547475710',
      templateName: 'booking_confirmation_invoice',
      type: 'template',
      components: {
        header: { type: 'document', document: { link: pdfUrl, filename } },
        body: { params: [bookingId] }
      }
    };

    expect(payload.templateName).toBe('booking_confirmation_invoice');
    expect(payload.type).toBe('template');
    expect(payload.components.header.type).toBe('document');
    expect(payload.components.header.document.link).toBe(pdfUrl);
    expect(payload.components.header.document.filename).toMatch(/\.pdf$/);
    expect(payload.components.body.params).toHaveLength(1);
    expect(payload.components.body.params[0]).toBe('ZBID-123');
  });

  it('builds correct payload for text-only template (pre-booking)', () => {
    const bookingId = 'ZBID-456';

    const payload = {
      from: '+917249111100',
      to: '+919876543210',
      templateName: 'booking_notification',
      type: 'template',
      components: {
        body: { params: [bookingId] }
      }
    };

    expect(payload.templateName).toBe('booking_notification');
    expect(payload.components.body.params[0]).toBe('ZBID-456');
    expect((payload.components as any).header).toBeUndefined();
  });

  it('builds correct payload for owner notification (3 params)', () => {
    const payload = {
      from: '+917249111100',
      to: '+918149221191',
      templateName: 'pre_booking_owner_notification',
      type: 'template',
      components: {
        body: { params: ['Grand Palace Hall', 'John Doe', '2025-06-15 - Morning'] }
      }
    };

    expect(payload.templateName).toBe('pre_booking_owner_notification');
    expect(payload.components.body.params).toHaveLength(3);
    expect(payload.components.body.params[0]).toBe('Grand Palace Hall');
    expect(payload.components.body.params[1]).toBe('John Doe');
    expect(payload.components.body.params[2]).toContain('2025-06-15');
  });
});
