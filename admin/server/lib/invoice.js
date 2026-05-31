/**
 * Invoice generation and WhatsApp delivery for ZVenue
 * 
 * NOTIFICATION FLOW:
 * ─────────────────────────────────────────────────────────────────────
 * 1. VENUE PRE-BOOKING (customer pays registration fee):
 *    - Customer gets: "booking_notification" template (auto, on payment)
 *    - Owner gets: "pre_booking_owner_notification" template (auto, on payment)
 * 
 * 2. VENUE FULL CONFIRMATION (admin confirms full payment):
 *    - Customer gets: "booking_confirmation_invoice" template (manual, from admin panel with PDF receipt)
 *    - This is the ONLY confirmation message — sent with the receipt PDF
 * 
 * 3. SERVICE BOOKING (customer pays full amount):
 *    - Customer gets: "notification" template (auto, on payment)
 *    - Confirmation with receipt: "booking_confirmation_invoice" (manual, from admin panel)
 * 
 * TEMPLATES USED:
 *    - booking_notification → venue pre-booking (customer)
 *    - pre_booking_owner_notification → venue pre-booking (owner, 3 vars: venue, customer, date)
 *    - notification → service booking (customer)
 *    - booking_confirmation_invoice → confirmation with receipt (both venue & service, manual from admin)
 * ─────────────────────────────────────────────────────────────────────
 */

// Generate invoice data from a venue booking
export function generateVenueInvoiceData(booking, venue, user) {
  const invoiceNumber = `ZINV-${Date.now().toString().slice(-10)}`;
  return {
    invoice_number: invoiceNumber,
    booking_id: booking.booking_id_display || booking.id.slice(0, 8),
    type: 'venue',
    is_pre_booking: booking.status === 'pre_booked' || (booking.registration_fee_paid > 0 && booking.remaining_balance > 0),
    customer: {
      name: user?.full_name || 'Customer',
      phone: user?.phone_number || '',
      email: user?.email || '',
    },
    owner: {
      name: venue?.owner_name || 'Venue Owner',
      phone: '',
    },
    items: [
      {
        description: `Venue Booking: ${venue?.name || 'Venue'}`,
        details: `Date: ${booking.booking_date} | ${booking.start_time} - ${booking.end_time}`,
        quantity: 1,
        amount: booking.total,
      },
    ],
    subtotal: booking.subtotal || booking.total,
    service_fee: booking.service_fee || 0,
    registration_fee_paid: booking.registration_fee_paid || 0,
    remaining_balance: booking.remaining_balance || 0,
    total: booking.total,
    payment_method: booking.payment_method || 'Razorpay',
    payment_id: booking.payment_id || '',
    status: booking.status,
    venue_name: venue?.name || '',
    city: venue?.city || '',
    generated_at: new Date().toISOString(),
  };
}

// Generate invoice data from a service booking
export function generateServiceInvoiceData(booking, listing, user) {
  const invoiceNumber = `ZINV-${Date.now().toString().slice(-10)}`;
  return {
    invoice_number: invoiceNumber,
    booking_id: booking.booking_id_display || booking.id.slice(0, 8),
    type: 'service',
    customer: {
      name: user?.full_name || 'Customer',
      phone: user?.phone_number || '',
      email: user?.email || '',
    },
    owner: {
      name: listing?.owner_name || 'Service Provider',
      phone: '',
    },
    items: [
      {
        description: `Service: ${listing?.name || 'Service'}`,
        details: `Quantity: ${booking.quantity}`,
        quantity: booking.quantity,
        unit_price: booking.unit_price,
        amount: booking.total_amount,
      },
    ],
    subtotal: booking.unit_price * booking.quantity,
    discount: booking.discount_applied || 0,
    total: booking.total_amount,
    payment_method: booking.payment_method || 'Razorpay',
    payment_id: booking.payment_id || '',
    status: booking.status,
    service_name: listing?.name || '',
    city: listing?.city || '',
    generated_at: new Date().toISOString(),
  };
}

/**
 * Send WhatsApp notification to customer on booking/pre-booking
 * This is the AUTO notification sent immediately when payment is made.
 * 
 * For VENUE pre-booking: uses "booking_notification" template
 * For SERVICE booking: uses "notification" template
 * 
 * NOTE: Venue full confirmation is NOT sent here — it's sent manually
 * from admin panel using "booking_confirmation_invoice" with the PDF receipt.
 */
export async function sendWhatsAppInvoice(phoneNumber, invoiceData, logger) {
  try {
    if (!phoneNumber || !process.env.AOC_API_KEY) {
      if (logger) logger.warn('WhatsApp invoice skipped: no phone or API key');
      return false;
    }

    const bookingId = invoiceData.booking_id || 'N/A';

    // Choose template based on booking type
    let templateName;
    if (invoiceData.type === 'service') {
      // Service booking → "notification" template
      templateName = process.env.AOC_SERVICE_BOOKING_TEMPLATE_NAME || 'notification';
    } else if (invoiceData.is_pre_booking) {
      // Venue pre-booking → "booking_notification" template
      templateName = process.env.AOC_PREBOOKING_TEMPLATE_NAME || 'booking_notification';
    } else {
      // Venue direct full payment (rare case) → also use pre-booking template
      // Full confirmation with receipt is sent manually from admin panel
      templateName = process.env.AOC_PREBOOKING_TEMPLATE_NAME || 'booking_notification';
    }

    const response = await fetch('https://api.aoc-portal.com/v1/whatsapp', {
      method: 'POST',
      headers: {
        'apikey': process.env.AOC_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.AOC_WHATSAPP_NUMBER,
        to: phoneNumber,
        templateName,
        type: 'template',
        components: {
          body: {
            params: [bookingId]
          }
        }
      }),
    });

    const result = await response.json();
    if (!response.ok || result.error) {
      if (logger) logger.error('WhatsApp booking notification error:', result);
      return false;
    }

    if (logger) logger.info(`WhatsApp booking notification sent to ${phoneNumber} for ${bookingId} (template: ${templateName})`);
    return true;
  } catch (err) {
    if (logger) logger.error('WhatsApp booking notification failed:', err.message);
    return false;
  }
}

/**
 * Send owner notification about new pre-booking (WhatsApp)
 * Uses "pre_booking_owner_notification" template with 3 variables:
 *   1. venue_name
 *   2. customer_name  
 *   3. booking_date + session
 */
export async function sendOwnerBookingAlert(ownerPhone, invoiceData, logger) {
  try {
    if (!ownerPhone || !process.env.AOC_API_KEY) return false;

    const bookingId = invoiceData.booking_id || 'N/A';

    const response = await fetch('https://api.aoc-portal.com/v1/whatsapp', {
      method: 'POST',
      headers: {
        'apikey': process.env.AOC_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.AOC_WHATSAPP_NUMBER,
        to: ownerPhone,
        templateName: process.env.AOC_OWNER_PREBOOKING_TEMPLATE_NAME || 'pre_booking_owner_notification',
        type: 'template',
        components: {
          body: {
            params: [bookingId]
          }
        }
      }),
    });

    const result = await response.json();
    if (!response.ok || result.error) {
      if (logger) logger.error('Owner WhatsApp alert error:', result);
      return false;
    }
    return true;
  } catch (err) {
    if (logger) logger.error('Owner WhatsApp alert failed:', err.message);
    return false;
  }
}
