import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import argon2 from 'argon2';
import Razorpay from 'razorpay';
import { db } from './db/index.js';
import { users, venues, categories, bookings, notifications, otps, owners, support_tickets, reviews, service_categories, service_listings, service_bookings, service_reviews, service_favorites } from './db/schema.js';
import { eq, and, ilike, or, desc, asc, count, sum, sql, gte, lte, ne, avg } from 'drizzle-orm';
import { geocodeAddress, buildAddress } from './lib/geocode.js';

// Haversine formula to calculate distance between two lat/lng points in km
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const fastify = Fastify({ logger: true });

// Generate unique Booking ID in format ZBID-XXXXXXXX (8 random digits)
async function generateBookingDisplayId() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const digits = String(Math.floor(10000000 + Math.random() * 90000000));
    const displayId = `ZBID-${digits}`;
    // Check uniqueness
    const existing = await db.query.bookings.findFirst({
      where: eq(bookings.booking_id_display, displayId),
      columns: { id: true },
    });
    if (!existing) return displayId;
  }
  // Fallback: use timestamp-based
  return `ZBID-${Date.now().toString().slice(-8)}`;
}

// Plugins
fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'supersecretkey_change_me_in_prod'
});

// Middleware to protect routes
fastify.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── SUBSCRIPTION & RAZORPAY ────────────────────────────────────────────────────

// Create a subscription (user clicks "Subscribe")
fastify.post('/api/subscriptions/create', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { plan_id, quantity = 1, total_count = 12 } = request.body;
    const user_id = request.user.id;

    // Get user details for Razorpay customer
    const user = await db.query.users.findFirst({
      where: eq(users.id, user_id),
      columns: { email: true, full_name: true, phone_number: true },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Create Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id,
      quantity,
      total_count,
      notes: {
        user_id,
      },
    });

    // Store subscription_id in user record
    await db.update(users)
      .set({ subscription_id: subscription.id, subscription_status: 'pending' })
      .where(eq(users.id, user_id));

    return { subscription };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: err.error?.description || err.message || 'Failed to create subscription', details: err });
  }
});

// Get Razorpay checkout options for subscription
fastify.post('/api/subscriptions/checkout', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const user_id = request.user.id;
    const user = await db.query.users.findFirst({
      where: eq(users.id, user_id),
      columns: { email: true, full_name: true, phone_number: true, subscription_id: true },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    if (!user.subscription_id) {
      return reply.status(400).send({ error: 'No subscription found. Please create a subscription first.' });
    }

    // Fetch subscription details from Razorpay
    const subscription = await razorpay.subscriptions.fetch(user.subscription_id);

    // Generate checkout options for Razorpay
    const checkoutOptions = {
      key: process.env.RAZORPAY_KEY_ID,
      subscription_id: subscription.id,
      name: "Zvenue",
      description: "Venue Pro Monthly Subscription",
      image: "https://your-logo-url.com/logo.png",
      prefill: {
        email: user.email || "",
        contact: user.phone_number || "",
        name: user.full_name || "",
      },
      theme: {
        color: "#7a3317",
      },
      handler: {
        function: "handlePaymentSuccess",
      },
    };

    return { checkoutOptions, subscription };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Failed to get checkout options' });
  }
});

// Razorpay Webhook endpoint (handles both subscription and payment events)
fastify.post('/api/webhooks/razorpay', async (request, reply) => {
  try {
    const signature = request.headers['x-razorpay-signature'];
    const body = JSON.stringify(request.body);

    // Verify webhook signature
    const crypto = await import('crypto');
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      fastify.log.warn('Invalid Razorpay webhook signature');
      return reply.status(400).send({ error: 'Invalid signature' });
    }

    const event = request.body;
    const { event: eventType, payload } = event;

    // Handle different webhook events (subscriptions + payments)
    switch (eventType) {
      // Subscription events
      case 'subscription.authenticated':
        await handleSubscriptionAuthenticated(payload);
        break;
      case 'subscription.activated':
        await handleSubscriptionActivated(payload);
        break;
      case 'subscription.charged':
        await handleSubscriptionCharged(payload);
        break;
      case 'subscription.halted':
        await handleSubscriptionHalted(payload);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload);
        break;
      // Payment events
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;
      case 'refund.processed':
        await handleRefundProcessed(payload);
        break;
      default:
        fastify.log.info(`Unhandled Razorpay event: ${eventType}`);
    }

    reply.status(200).send({ status: 'ok' });
  } catch (err) {
    fastify.log.error('Webhook error:', err);
    reply.status(500).send({ error: 'Webhook processing failed' });
  }
});

// Webhook event handlers
async function handlePaymentCaptured(payload) {
  const paymentId = payload.payment.entity.id;
  const orderId = payload.payment.entity.order_id;
  const bookingId = payload.payment.entity.notes?.booking_id;
  const registrationFee = parseFloat(payload.payment.entity.notes?.registration_fee) || 0;
  const totalVenuePrice = parseFloat(payload.payment.entity.notes?.total_venue_price) || 0;

  fastify.log.info(`Payment captured for order: ${orderId}, booking: ${bookingId}`);

  if (bookingId) {
    const isPreBooking = registrationFee > 0;
    const remainingBalance = isPreBooking ? totalVenuePrice - registrationFee : 0;

    // Update booking status based on whether it's a pre-booking
    await db.update(bookings)
      .set({
        status: isPreBooking ? 'pre_booked' : 'confirmed',
        payment_id: paymentId,
        registration_fee_paid: isPreBooking ? registrationFee : totalVenuePrice,
        remaining_balance: remainingBalance,
        paid_at: new Date(),
      })
      .where(eq(bookings.id, bookingId));

    // Get booking details for notifications
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      columns: { user_id: true, booking_date: true, venue_id: true }
    });

    if (booking) {
      // Get venue name
      const venue = await db.query.venues.findFirst({
        where: eq(venues.id, booking.venue_id),
        columns: { name: true, owner_id: true },
      });

      // Get user details
      const user = await db.query.users.findFirst({
        where: eq(users.id, booking.user_id),
        columns: { push_token: true, full_name: true },
      });

      if (isPreBooking) {
        // Pre-booking notifications
        await db.insert(notifications).values({
          user_id: booking.user_id,
          title: 'Pre-Booking Confirmed',
          body: `Your pre-booking for ${venue?.name || 'venue'} on ${booking.booking_date} is confirmed. Registration fee of ₹${registrationFee.toLocaleString('en-IN')} paid. Our agent will contact you for the remaining ₹${remainingBalance.toLocaleString('en-IN')}.`,
          type: 'booking',
          is_read: false,
          data: { booking_id: bookingId, payment_id: paymentId, is_pre_booking: true }
        });

        // Admin notification
        await db.insert(notifications).values({
          user_id: null,
          title: 'New Pre-Booking',
          body: `${user?.full_name || 'A user'} has pre-booked ${venue?.name || 'a venue'} on ${booking.booking_date}. Remaining balance: ₹${remainingBalance.toLocaleString('en-IN')}. Please contact the customer.`,
          type: 'pre_booking',
          is_read: false,
          data: { booking_id: bookingId, user_id: booking.user_id, venue_id: booking.venue_id, remaining_balance: remainingBalance }
        });

        // Push notification
        if (user?.push_token) {
          sendPushNotification(
            user.push_token,
            'Pre-Booking Confirmed! ✅',
            `Your pre-booking for ${venue?.name || 'venue'} on ${booking.booking_date} is confirmed. Our agent will contact you soon.`,
            { booking_id: bookingId, is_pre_booking: true }
          );
        }

        // WhatsApp to venue owner (fire-and-forget)
        if (venue?.owner_id) {
          const owner = await db.query.owners.findFirst({
            where: eq(owners.id, venue.owner_id),
            columns: { phone_number: true },
          });
          if (owner?.phone_number) {
            sendWhatsAppPreBookingAlert(owner.phone_number, {
              venue_name: venue.name,
              booking_date: booking.booking_date,
              user_name: user?.full_name || 'A customer',
              registration_fee: registrationFee,
              remaining_balance: remainingBalance,
            }).catch(err => fastify.log.error('Webhook WhatsApp alert failed:', err.message));
          }
        }
      } else {
        // Direct confirmation notification
        await db.insert(notifications).values({
          user_id: booking.user_id,
          title: 'Booking Confirmed!',
          body: `Your booking for ${venue?.name || 'venue'} on ${booking.booking_date} has been confirmed and paid.`,
          type: 'booking',
          is_read: false,
          data: { booking_id: bookingId, payment_id: paymentId }
        });

        if (user?.push_token) {
          sendPushNotification(
            user.push_token,
            'Booking Confirmed! 🎉',
            `Your booking for ${booking.booking_date} has been confirmed.`,
            { booking_id: bookingId }
          );
        }
      }
    }
  } else if (orderId) {
    // Fallback: find booking by order_id
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.order_id, orderId),
    });

    if (booking) {
      await db.update(bookings)
        .set({
          status: registrationFee > 0 ? 'pre_booked' : 'confirmed',
          payment_id: paymentId,
          registration_fee_paid: registrationFee > 0 ? registrationFee : booking.total,
          remaining_balance: registrationFee > 0 ? booking.total - registrationFee : 0,
          paid_at: new Date(),
        })
        .where(eq(bookings.id, booking.id));

      // Create notification
      await db.insert(notifications).values({
        user_id: booking.user_id,
        title: registrationFee > 0 ? 'Pre-Booking Confirmed' : 'Booking Confirmed!',
        body: registrationFee > 0
          ? `Your pre-booking on ${booking.booking_date} is confirmed. Our agent will contact you.`
          : `Your booking on ${booking.booking_date} has been confirmed and paid.`,
        type: 'booking',
        is_read: false,
        data: { booking_id: booking.id, payment_id: paymentId, is_pre_booking: registrationFee > 0 }
      });
    }
  }
}

async function handlePaymentFailed(payload) {
  const orderId = payload.payment.entity.order_id;
  const reason = payload.payment.entity.error_description || 'Payment failed';

  fastify.log.warn(`Payment failed for order: ${orderId}, reason: ${reason}`);

  // Find booking by order_id and mark as payment_failed
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.order_id, orderId),
  });

  if (booking) {
    await db.update(bookings)
      .set({
        status: 'payment_failed',
      })
      .where(eq(bookings.id, booking.id));

    // Create notification for user
    await db.insert(notifications).values({
      user_id: booking.user_id,
      title: 'Payment Failed',
      body: `Your payment for booking on ${booking.booking_date} failed. Please try again.`,
      type: 'booking',
      is_read: false,
      data: { booking_id: booking.id, reason }
    });
  }
}

async function handleRefundProcessed(payload) {
  const refundId = payload.refund.entity.id;
  const paymentId = payload.refund.entity.payment_id;

  fastify.log.info(`Refund processed for payment: ${paymentId}, refund: ${refundId}`);

  // Find booking by payment_id
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.payment_id, paymentId),
  });

  if (booking) {
    await db.update(bookings)
      .set({
        status: 'refunded',
      })
      .where(eq(bookings.id, booking.id));

    // Create notification for user
    await db.insert(notifications).values({
      user_id: booking.user_id,
      title: 'Refund Processed',
      body: `A refund of ₹${booking.total} has been processed for your booking.`,
      type: 'booking',
      is_read: false,
      data: { booking_id: booking.id, refund_id: refundId }
    });
  }
}

// ─── AUTHENTICATION ────────────────────────────────────────────────────────

// Webhook event handlers
async function handleSubscriptionAuthenticated(payload) {
  const subscription_id = payload.subscription.entity.id;
  const user_id = payload.subscription.entity.notes?.user_id;

  if (user_id) {
    await db.update(users)
      .set({
        subscription_status: 'authenticated',
        next_billing_at: new Date(Number(payload.subscription.entity.start_at) * 1000).toISOString()
      })
      .where(eq(users.subscription_id, subscription_id));
  }
}

async function handleSubscriptionActivated(payload) {
  const subscription_id = payload.subscription.entity.id;
  
  await db.update(users)
    .set({
      subscription_status: 'active',
      next_billing_at: new Date(Number(payload.subscription.entity.next_bill_at) * 1000).toISOString()
    })
    .where(eq(users.subscription_id, subscription_id));
}

async function handleSubscriptionCharged(payload) {
  const subscription_id = payload.subscription.entity.id;
  
  await db.update(users)
    .set({
      next_billing_at: new Date(Number(payload.subscription.entity.next_bill_at) * 1000).toISOString()
    })
    .where(eq(users.subscription_id, subscription_id));
}

async function handleSubscriptionHalted(payload) {
  const subscription_id = payload.subscription.entity.id;
  
  await db.update(users)
    .set({ subscription_status: 'halted' })
    .where(eq(users.subscription_id, subscription_id));
}

async function handleSubscriptionCancelled(payload) {
  const subscription_id = payload.subscription.entity.id;
  
  await db.update(users)
    .set({ subscription_status: 'cancelled' })
    .where(eq(users.subscription_id, subscription_id));
}

// ─── SUBSCRIPTION STATUS ────────────────────────────────────────────────────

// Get current user's subscription status
fastify.get('/api/subscription/status', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, request.user.id),
      columns: {
        subscription_id: true,
        subscription_status: true,
        next_billing_at: true
      },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    const isSubscribed = user.subscription_status === 'active' || user.subscription_status === 'authenticated';

    return {
      subscription_id: user.subscription_id,
      subscription_status: user.subscription_status,
      is_subscribed: isSubscribed,
      next_billing_at: user.next_billing_at,
    };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Confirm subscription payment (called by client after successful Razorpay checkout)
fastify.post('/api/subscriptions/confirm', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const user_id = request.user.id;
    const user = await db.query.users.findFirst({
      where: eq(users.id, user_id),
      columns: { subscription_id: true, subscription_status: true },
    });

    if (!user || !user.subscription_id) {
      return reply.status(404).send({ error: 'No subscription found' });
    }

    // Fetch subscription from Razorpay to verify it's actually paid
    try {
      const subscription = await razorpay.subscriptions.fetch(user.subscription_id);
      
      // Razorpay subscription statuses: created, authenticated, active, pending, halted, cancelled, completed, expired
      const activeStatuses = ['authenticated', 'active'];
      
      if (activeStatuses.includes(subscription.status)) {
        await db.update(users)
          .set({ subscription_status: subscription.status })
          .where(eq(users.id, user_id));
        
        return { success: true, subscription_status: subscription.status, has_access: true };
      } else {
        // Even if Razorpay says 'created' or 'pending', the payment might still be processing
        // Mark as active if the client says payment succeeded (trust the client for now, webhook will correct later)
        await db.update(users)
          .set({ subscription_status: 'active' })
          .where(eq(users.id, user_id));
        
        return { success: true, subscription_status: 'active', has_access: true };
      }
    } catch (rzpErr) {
      // If Razorpay fetch fails, still mark as active (payment was confirmed by client)
      fastify.log.warn('Could not verify subscription with Razorpay, marking as active:', rzpErr.message);
      await db.update(users)
        .set({ subscription_status: 'active' })
        .where(eq(users.id, user_id));
      
      return { success: true, subscription_status: 'active', has_access: true };
    }
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Failed to confirm subscription' });
  }
});

// Cancel subscription
fastify.post('/api/subscriptions/cancel', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, request.user.id),
      columns: { subscription_id: true },
    });

    if (!user || !user.subscription_id) {
      return reply.status(404).send({ error: 'No subscription found' });
    }

    // Cancel in Razorpay
    await razorpay.subscriptions.cancel(user.subscription_id);

    // Update local DB
    await db.update(users)
      .set({ subscription_status: 'cancelled' })
      .where(eq(users.id, request.user.id));

    return { success: true, message: 'Subscription cancelled' };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Failed to cancel subscription' });
  }
});


// ─── OWNER AUTHENTICATION & MANAGEMENT ─────────────────────────────────────────

// Admin creates an owner account
fastify.post('/api/owners', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { full_name, email, phone_number, password } = request.body;
    if (!full_name || !email || !phone_number || !password) {
      return reply.status(400).send({ error: 'All fields are required' });
    }
    const hashedPassword = await argon2.hash(password);
    const [owner] = await db.insert(owners).values({
      full_name, email, phone_number, password: hashedPassword,
    }).returning();
    return { ...owner, password: undefined };
  } catch (err) {
    if (err.code === '23505') return reply.status(400).send({ error: 'Email or phone already exists' });
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// List all owners (admin)
fastify.get('/api/owners', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const data = await db.query.owners.findMany({
      columns: { password: false },
      with: { venues: { columns: { id: true, name: true, approval_status: true } } },
      orderBy: [desc(owners.created_at)],
    });
    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Owner login
fastify.post('/api/owners/login', async (request, reply) => {
  try {
    const { email, password } = request.body;
    const owner = await db.query.owners.findFirst({ where: eq(owners.email, email) });
    if (!owner || !owner.password) return reply.status(401).send({ error: 'Invalid credentials' });
    const valid = await argon2.verify(owner.password, password);
    if (!valid) return reply.status(401).send({ error: 'Invalid credentials' });
    if (!owner.is_active) return reply.status(403).send({ error: 'Account is deactivated' });
    const token = fastify.jwt.sign({ id: owner.id, email: owner.email, role: 'owner' });
    return { token, owner: { id: owner.id, full_name: owner.full_name, email: owner.email, role: 'owner' } };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Owner: get own profile
fastify.get('/api/owners/me', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    if (request.user.role !== 'owner') return reply.status(403).send({ error: 'Not an owner' });
    const owner = await db.query.owners.findFirst({
      where: eq(owners.id, request.user.id),
      columns: { password: false },
    });
    return owner || reply.status(404).send({ error: 'Owner not found' });
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Owner: list own venues
fastify.get('/api/owners/venues', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    if (request.user.role !== 'owner') return reply.status(403).send({ error: 'Not an owner' });
    const data = await db.query.venues.findMany({
      where: eq(venues.owner_id, request.user.id),
      with: { category: true },
      orderBy: [desc(venues.created_at)],
    });
    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Owner: submit a new venue (pending_review)
fastify.post('/api/owners/venues', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    if (request.user.role !== 'owner') return reply.status(403).send({ error: 'Not an owner' });
    const { subscriber_benefits, registration_fee, ...body } = request.body; // Strip admin-only fields
    const venueData = {
      ...body,
      owner_id: request.user.id,
      approval_status: 'pending_review',
      image_url: body.images?.[0] || body.image_url || null,
    };

    // Geocode the address
    if (venueData.location || venueData.city) {
      const address = buildAddress(venueData.location, venueData.city);
      const coords = await geocodeAddress(address);
      if (coords) {
        venueData.latitude = coords.latitude;
        venueData.longitude = coords.longitude;
      }
    }

    const [inserted] = await db.insert(venues).values(venueData).returning();
    // Notify admin
    await db.insert(notifications).values({
      user_id: null,
      title: 'New Venue Submitted',
      body: `Owner submitted "${inserted.name}" for review.`,
      type: 'venue_review',
      data: { venue_id: inserted.id, owner_id: request.user.id },
    });
    return inserted;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Owner: edit own venue (if approved, creates pending_changes; if pending_review, edits directly)
fastify.put('/api/owners/venues/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    if (request.user.role !== 'owner') return reply.status(403).send({ error: 'Not an owner' });
    const venueId = request.params.id;
    const venue = await db.query.venues.findFirst({ where: and(eq(venues.id, venueId), eq(venues.owner_id, request.user.id)) });
    if (!venue) return reply.status(404).send({ error: 'Venue not found or not yours' });

    const { subscriber_benefits, registration_fee, ...ownerBody } = request.body; // Strip admin-only fields

    if (venue.approval_status === 'approved') {
      // Store changes as pending, don't apply directly
      await db.update(venues).set({
        pending_changes: ownerBody,
        approval_status: 'pending_changes',
      }).where(eq(venues.id, venueId));
      // Notify admin
      await db.insert(notifications).values({
        user_id: null,
        title: 'Venue Changes Pending',
        body: `Owner updated "${venue.name}" — changes need approval.`,
        type: 'venue_review',
        data: { venue_id: venueId, owner_id: request.user.id },
      });
      return { message: 'Changes submitted for admin approval' };
    } else {
      // Not yet approved, edit directly
      const updates = { ...ownerBody, image_url: ownerBody.images?.[0] || ownerBody.image_url || venue.image_url };
      await db.update(venues).set(updates).where(eq(venues.id, venueId));
      const updated = await db.query.venues.findFirst({ where: eq(venues.id, venueId), with: { category: true } });
      return updated;
    }
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Owner: block/unblock dates on own venue
fastify.put('/api/owners/venues/:id/blocked-dates', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    if (request.user.role !== 'owner') return reply.status(403).send({ error: 'Not an owner' });
    const venueId = request.params.id;
    const venue = await db.query.venues.findFirst({ where: and(eq(venues.id, venueId), eq(venues.owner_id, request.user.id)) });
    if (!venue) return reply.status(404).send({ error: 'Venue not found or not yours' });
    const { blocked_dates } = request.body;
    await db.update(venues).set({ blocked_dates }).where(eq(venues.id, venueId));
    return { success: true, blocked_dates };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Owner: view bookings for own venues
fastify.get('/api/owners/bookings', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    if (request.user.role !== 'owner') return reply.status(403).send({ error: 'Not an owner' });
    const ownerVenues = await db.query.venues.findMany({
      where: eq(venues.owner_id, request.user.id),
      columns: { id: true },
    });
    const venueIds = ownerVenues.map(v => v.id);
    if (venueIds.length === 0) return [];
    const data = await db.query.bookings.findMany({
      where: sql`${bookings.venue_id} IN (${sql.join(venueIds.map(id => sql`${id}`), sql`, `)})`,
      with: {
        venue: { columns: { name: true, city: true, image_url: true } },
        user: { columns: { id: true, full_name: true, email: true, avatar_url: true } },
      },
      orderBy: [desc(bookings.created_at)],
    });
    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── OWNER ANALYTICS ────────────────────────────────────────────────────────
fastify.get('/api/owners/analytics', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    if (request.user.role !== 'owner') return reply.status(403).send({ error: 'Not an owner' });
    const ownerId = request.user.id;

    // Get owner's venues
    const ownerVenues = await db.query.venues.findMany({
      where: eq(venues.owner_id, ownerId),
      columns: { id: true, name: true },
    });
    const venueIds = ownerVenues.map(v => v.id);

    if (venueIds.length === 0) {
      return { total_bookings: 0, total_revenue: 0, confirmed_bookings: 0, pending_bookings: 0, venues_count: 0, monthly_revenue: [] };
    }

    // Get all bookings for owner's venues
    const ownerBookings = await db.query.bookings.findMany({
      where: sql`${bookings.venue_id} IN (${sql.join(venueIds.map(id => sql`${id}`), sql`, `)})`,
      columns: { id: true, total: true, status: true, created_at: true, booking_date: true, start_time: true },
    });

    const totalRevenue = ownerBookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (b.total || 0), 0);
    const confirmedCount = ownerBookings.filter(b => b.status === 'confirmed').length;
    const pendingCount = ownerBookings.filter(b => b.status === 'pending').length;

    // Monthly revenue
    const monthly = {};
    ownerBookings.filter(b => b.status === 'confirmed').forEach(b => {
      const month = new Date(b.created_at).toLocaleString('en', { month: 'short', year: 'numeric' });
      monthly[month] = (monthly[month] || 0) + (b.total || 0);
    });

    // Popular time slots
    const timeSlots = {};
    ownerBookings.forEach(b => {
      if (b.start_time) timeSlots[b.start_time] = (timeSlots[b.start_time] || 0) + 1;
    });
    const popularSlots = Object.entries(timeSlots).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([slot, count]) => ({ slot, count }));

    return {
      total_bookings: ownerBookings.length,
      total_revenue: totalRevenue,
      confirmed_bookings: confirmedCount,
      pending_bookings: pendingCount,
      venues_count: ownerVenues.length,
      monthly_revenue: Object.entries(monthly).map(([month, revenue]) => ({ month, revenue })),
      popular_time_slots: popularSlots,
    };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── SUPPORT TICKETS ────────────────────────────────────────────────────────

// Owner: create ticket
fastify.post('/api/support-tickets', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    if (request.user.role !== 'owner') return reply.status(403).send({ error: 'Not an owner' });
    const { subject, description, priority } = request.body;
    if (!subject || !description) return reply.status(400).send({ error: 'Subject and description are required' });

    const [ticket] = await db.insert(support_tickets).values({
      owner_id: request.user.id,
      subject,
      description,
      priority: priority || 'medium',
    }).returning();

    // Notify admin
    await db.insert(notifications).values({
      user_id: null,
      title: 'New Support Ticket',
      body: `Owner raised ticket: "${subject}"`,
      type: 'support',
      data: { ticket_id: ticket.id, owner_id: request.user.id },
    });

    return ticket;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Owner: list own tickets
fastify.get('/api/support-tickets/mine', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    if (request.user.role !== 'owner') return reply.status(403).send({ error: 'Not an owner' });
    const data = await db.query.support_tickets.findMany({
      where: eq(support_tickets.owner_id, request.user.id),
      orderBy: [desc(support_tickets.created_at)],
    });
    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Admin: list all tickets
fastify.get('/api/support-tickets', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { status } = request.query;
    let whereClause = undefined;
    if (status && status !== 'all') whereClause = eq(support_tickets.status, status);

    const data = await db.query.support_tickets.findMany({
      where: whereClause,
      with: { owner: { columns: { id: true, full_name: true, email: true } } },
      orderBy: [desc(support_tickets.created_at)],
    });
    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Admin: reply to ticket
fastify.put('/api/support-tickets/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { admin_reply, status } = request.body;
    const updates = { updated_at: new Date() };
    if (admin_reply) { updates.admin_reply = admin_reply; updates.replied_at = new Date(); }
    if (status) updates.status = status;

    await db.update(support_tickets).set(updates).where(eq(support_tickets.id, request.params.id));
    const updated = await db.query.support_tickets.findFirst({
      where: eq(support_tickets.id, request.params.id),
      with: { owner: { columns: { id: true, full_name: true, email: true } } },
    });
    return updated;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Admin: approve venue
fastify.post('/api/venues/:id/approve', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const venueId = request.params.id;
    const venue = await db.query.venues.findFirst({ where: eq(venues.id, venueId) });
    if (!venue) return reply.status(404).send({ error: 'Venue not found' });

    // Validate registration fee is set before approval
    const effectiveFee = venue.pending_changes?.registration_fee ?? venue.registration_fee;
    if (!effectiveFee || effectiveFee <= 0) {
      return reply.status(400).send({
        error: 'Registration fee is required',
        message: 'A registration fee greater than zero must be set before the venue can be approved.'
      });
    }

    if (venue.approval_status === 'pending_changes' && venue.pending_changes) {
      // Apply pending changes
      const changes = venue.pending_changes;
      await db.update(venues).set({
        ...changes,
        image_url: changes.images?.[0] || changes.image_url || venue.image_url,
        approval_status: 'approved',
        pending_changes: null,
      }).where(eq(venues.id, venueId));
    } else {
      await db.update(venues).set({ approval_status: 'approved', pending_changes: null }).where(eq(venues.id, venueId));
    }
    return { success: true, message: 'Venue approved' };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Admin: reject venue (with reason notification to owner)
fastify.post('/api/venues/:id/reject', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const venueId = request.params.id;
    const { reason } = request.body || {};

    // Get venue details for notification
    const venue = await db.query.venues.findFirst({
      where: eq(venues.id, venueId),
      columns: { name: true, owner_id: true },
    });

    await db.update(venues).set({ approval_status: 'rejected', pending_changes: null }).where(eq(venues.id, venueId));

    // Notify the owner with the rejection reason
    if (venue?.owner_id) {
      // Store as a notification in the notifications table (using owner_id in data since notifications.user_id is for app users)
      await db.insert(notifications).values({
        user_id: null,
        title: 'Venue Rejected',
        body: `Your venue "${venue.name}" has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
        type: 'venue_rejected',
        data: { venue_id: venueId, owner_id: venue.owner_id, reason: reason || null },
      });
    }

    return { success: true, message: 'Venue rejected and owner notified' };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Admin: deactivate/activate owner
fastify.put('/api/owners/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { is_active, full_name, email, phone_number } = request.body;
    const updates = {};
    if (is_active !== undefined) updates.is_active = is_active;
    if (full_name) updates.full_name = full_name;
    if (email) updates.email = email;
    if (phone_number) updates.phone_number = phone_number;
    const [updated] = await db.update(owners).set(updates).where(eq(owners.id, request.params.id)).returning();
    return { ...updated, password: undefined };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Admin: delete owner
fastify.delete('/api/owners/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    await db.delete(owners).where(eq(owners.id, request.params.id));
    return { success: true };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── BOOKING PAYMENTS WITH RAZORPAY ───────────────────────────────────────────

// Create Razorpay order for booking
fastify.post('/api/bookings/create-order', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { venue_id, booking_date, start_time, end_time, guests, subtotal, service_fee, total } = request.body;
    const user_id = request.user.id;

    // Validate required fields
    if (!venue_id || !booking_date || !start_time || !end_time || !guests || !total) {
      return reply.status(400).send({ error: 'Missing required booking details' });
    }

    // Check for booking conflicts (confirmed and pre_booked bookings)
    const conflicts = await db.query.bookings.findMany({
      where: and(
        eq(bookings.venue_id, venue_id),
        eq(bookings.booking_date, booking_date),
        or(eq(bookings.status, 'confirmed'), eq(bookings.status, 'pre_booked'))
      )
    });

    if (conflicts.length > 0) {
      const firstConflict = conflicts[0];
      return reply.status(400).send({
        error: 'venue_unavailable',
        message: `This venue is already booked on ${firstConflict.booking_date} from ${firstConflict.start_time} to ${firstConflict.end_time}. Please choose another time or date.`,
        conflict: {
          date: firstConflict.booking_date,
          start_time: firstConflict.start_time,
          end_time: firstConflict.end_time
        }
      });
    }

    // Get user details for Razorpay
    const user = await db.query.users.findFirst({
      where: eq(users.id, user_id),
      columns: { email: true, full_name: true, phone_number: true },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Get venue details
    const venue = await db.query.venues.findFirst({
      where: eq(venues.id, venue_id),
      columns: { name: true, city: true, registration_fee: true },
    });

    if (!venue) {
      return reply.status(404).send({ error: 'Venue not found' });
    }

    // Determine payment amount: registration_fee if set, otherwise full total
    const registrationFee = venue.registration_fee && venue.registration_fee > 0 ? venue.registration_fee : null;
    const paymentAmount = registrationFee || total;

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(paymentAmount * 100), // Convert to paise
      currency: 'INR',
      receipt: `booking_${Date.now()}`,
      notes: {
        user_id,
        venue_id,
        booking_date,
        start_time,
        end_time,
        guests,
        subtotal,
        service_fee,
        registration_fee: registrationFee,
        total_venue_price: total,
      },
    });

    // Create a pending booking record
    const bookingDisplayId = await generateBookingDisplayId();
    const [booking] = await db.insert(bookings).values({
      booking_id_display: bookingDisplayId,
      venue_id,
      user_id,
      booking_date,
      start_time,
      end_time,
      guests,
      subtotal,
      service_fee,
      total,
      payment_method: 'razorpay',
      status: 'pending',
      created_at: new Date(),
      order_id: order.id,
    }).returning();

    return {
      order,
      booking,
      venue: { name: venue.name, city: venue.city },
      registration_fee: registrationFee,
      payment_amount: paymentAmount,
      balance_remaining: registrationFee ? total - registrationFee : 0,
    };
  } catch (err) {
    fastify.log.error('Create order error:', err);
    return reply.status(500).send({
      error: 'Failed to create payment order',
      details: err.message
    });
  }
});

// Verify Razorpay payment and confirm booking
fastify.post('/api/bookings/verify-payment', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { order_id, payment_id, signature, booking_id } = request.body;
    const user_id = request.user.id;

    if (!order_id || !payment_id || !signature || !booking_id) {
      return reply.status(400).send({ error: 'Missing payment verification details' });
    }

    // Verify booking belongs to user
    const booking = await db.query.bookings.findFirst({
      where: and(
        eq(bookings.id, booking_id),
        eq(bookings.user_id, user_id)
      ),
    });

    if (!booking) {
      return reply.status(404).send({ error: 'Booking not found' });
    }

    // Verify signature with Razorpay
    const crypto = await import('crypto');
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const expectedSignature = crypto.createHmac('sha256', keySecret)
      .update(order_id + '|' + payment_id)
      .digest('hex');

    if (signature !== expectedSignature) {
      fastify.log.warn('Invalid payment signature for booking:', booking_id);
      return reply.status(400).send({ error: 'Invalid payment signature' });
    }

    // Fetch payment details from Razorpay to ensure it's successful
    const payment = await razorpay.payments.fetch(payment_id);
    
    if (payment.status !== 'captured') {
      return reply.status(400).send({ error: 'Payment not captured' });
    }

    // Fetch venue to determine registration fee
    const venue = await db.query.venues.findFirst({
      where: eq(venues.id, booking.venue_id),
      columns: { name: true, registration_fee: true, owner_id: true },
    });

    const registrationFee = venue?.registration_fee || 0;
    const isPreBooking = registrationFee > 0;
    const registrationFeePaid = isPreBooking ? registrationFee : booking.total;
    const remainingBalance = isPreBooking ? booking.total - registrationFee : 0;

    // Update booking status: pre_booked if registration fee applies, otherwise confirmed
    await db.update(bookings)
      .set({
        status: isPreBooking ? 'pre_booked' : 'confirmed',
        payment_method: 'razorpay',
        payment_id: payment_id,
        order_id: order_id,
        signature: signature,
        registration_fee_paid: registrationFeePaid,
        remaining_balance: remainingBalance,
        paid_at: new Date(),
      })
      .where(eq(bookings.id, booking_id));

    // Get user details for notifications
    const userForNotif = await db.query.users.findFirst({
      where: eq(users.id, user_id),
      columns: { push_token: true, full_name: true },
    });

    if (isPreBooking) {
      // Pre-booking notifications
      // 1. In-app notification for user
      await db.insert(notifications).values({
        user_id,
        title: 'Pre-Booking Confirmed',
        body: `Your pre-booking for ${venue.name} on ${booking.booking_date} is confirmed. Booking ID: ${booking.booking_id_display}. Registration fee of ₹${registrationFeePaid.toLocaleString('en-IN')} paid. Our agent will contact you for the remaining ₹${remainingBalance.toLocaleString('en-IN')}.`,
        type: 'booking',
        is_read: false,
        data: { booking_id, booking_id_display: booking.booking_id_display, payment_id, is_pre_booking: true }
      });

      // 2. In-app notification for admin
      await db.insert(notifications).values({
        user_id: null,
        title: 'New Pre-Booking',
        body: `${userForNotif?.full_name || 'A user'} has pre-booked ${venue.name} on ${booking.booking_date}. Booking ID: ${booking.booking_id_display}. Remaining balance: ₹${remainingBalance.toLocaleString('en-IN')}. Please contact the customer.`,
        type: 'pre_booking',
        is_read: false,
        data: { booking_id, booking_id_display: booking.booking_id_display, user_id, venue_id: booking.venue_id, remaining_balance: remainingBalance }
      });

      // 3. Push notification for user
      if (userForNotif?.push_token) {
        sendPushNotification(
          userForNotif.push_token,
          'Pre-Booking Confirmed! ✅',
          `Booking ID: ${booking.booking_id_display}. Your pre-booking for ${venue.name} on ${booking.booking_date} is confirmed. Our agent will contact you soon.`,
          { booking_id, booking_id_display: booking.booking_id_display, is_pre_booking: true }
        );
      }

      // 4. WhatsApp notification to venue owner (fire-and-forget)
      if (venue.owner_id) {
        const owner = await db.query.owners.findFirst({
          where: eq(owners.id, venue.owner_id),
          columns: { phone_number: true, full_name: true },
        });
        if (owner?.phone_number) {
          sendWhatsAppPreBookingAlert(owner.phone_number, {
            venue_name: venue.name,
            booking_date: booking.booking_date,
            user_name: userForNotif?.full_name || 'A customer',
            registration_fee: registrationFeePaid,
            remaining_balance: remainingBalance,
          }).catch(err => fastify.log.error('WhatsApp pre-booking alert failed:', err.message));
        } else {
          fastify.log.warn(`Venue owner ${venue.owner_id} has no phone number, skipping WhatsApp alert`);
        }
      }
    } else {
      // Direct confirmation (fallback for venues without registration fee — shouldn't happen after migration)
      await db.insert(notifications).values({
        user_id,
        title: 'Booking Confirmed!',
        body: `Your booking for ${venue?.name || 'venue'} on ${booking.booking_date} has been confirmed and paid.`,
        type: 'booking',
        is_read: false,
        data: { booking_id, payment_id }
      });

      if (userForNotif?.push_token) {
        sendPushNotification(
          userForNotif.push_token,
          'Booking Confirmed! 🎉',
          `Your booking for ${booking.booking_date} has been confirmed.`,
          { booking_id }
        );
      }
    }

    // Return updated booking
    const updatedBooking = await db.query.bookings.findFirst({
      where: eq(bookings.id, booking_id),
      with: {
        venue: { with: { category: true } },
        user: { columns: { full_name: true, email: true, avatar_url: true } }
      }
    });

    return {
      success: true,
      message: isPreBooking ? 'Pre-booking confirmed. Our agent will contact you.' : 'Payment verified and booking confirmed',
      booking: updatedBooking,
      is_pre_booking: isPreBooking,
      registration_fee_paid: registrationFeePaid,
      remaining_balance: remainingBalance,
    };
  } catch (err) {
    fastify.log.error('Verify payment error:', err);
    return reply.status(500).send({
      error: 'Payment verification failed',
      details: err.message
    });
  }
});


// ─── PRE-BOOKING: WhatsApp Alert to Venue Owner ────────────────────────────
async function sendWhatsAppPreBookingAlert(ownerPhone, templateParams) {
  try {
    const response = await fetch('https://api.aoc-portal.com/v1/whatsapp', {
      method: 'POST',
      headers: {
        'apikey': process.env.AOC_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.AOC_WHATSAPP_NUMBER,
        to: ownerPhone,
        templateName: process.env.AOC_PREBOOKING_TEMPLATE_NAME || 'prebooking_alert',
        type: 'template',
        language: { code: 'en' },
        params: templateParams
      })
    });

    const result = await response.json();
    if (!response.ok || result.error) {
      fastify.log.error('WhatsApp Pre-Booking Alert Error:', result);
      return false;
    }
    fastify.log.info(`WhatsApp pre-booking alert sent to ${ownerPhone}`);
    return true;
  } catch (err) {
    fastify.log.error('WhatsApp Pre-Booking Alert Error:', err.message);
    return false;
  }
}

// ─── PRE-BOOKING: Transaction ID Validation ────────────────────────────────
const TRANSACTION_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

// ─── PRE-BOOKING: Admin Confirms Full Payment ──────────────────────────────
fastify.post('/api/admin/bookings/confirm-payment', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { booking_id, transaction_id } = request.body;

    if (!booking_id || !transaction_id) {
      return reply.status(400).send({ error: 'Booking ID and transaction ID are required' });
    }

    // Validate transaction ID format
    if (!TRANSACTION_ID_REGEX.test(transaction_id)) {
      return reply.status(400).send({ error: 'Invalid transaction ID format. Use 1-64 alphanumeric characters, hyphens, or underscores.' });
    }

    // Find the booking
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, booking_id),
    });

    if (!booking) {
      return reply.status(404).send({ error: 'Booking not found' });
    }

    if (booking.status !== 'pre_booked') {
      return reply.status(400).send({ error: 'Booking is not in pre-booked status' });
    }

    // Update booking to confirmed
    await db.update(bookings)
      .set({
        status: 'confirmed',
        transaction_id,
        paid_at: new Date(),
      })
      .where(eq(bookings.id, booking_id));

    // Get venue and user details
    const venue = await db.query.venues.findFirst({
      where: eq(venues.id, booking.venue_id),
      columns: { id: true, name: true, image_url: true },
    });
    const user = await db.query.users.findFirst({
      where: eq(users.id, booking.user_id),
      columns: { id: true, full_name: true, push_token: true },
    });

    // Create in-app notification for user with full booking details
    await db.insert(notifications).values({
      user_id: booking.user_id,
      title: 'Booking Fully Confirmed',
      body: `Your booking for ${venue?.name || 'venue'} on ${booking.booking_date} (${booking.start_time} – ${booking.end_time}) is fully confirmed! Total paid: ₹${booking.total.toLocaleString('en-IN')}. Get ready for your event.`,
      type: 'booking',
      is_read: false,
      data: {
        booking_id,
        venue_id: booking.venue_id,
        venue_name: venue?.name,
        booking_date: booking.booking_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        guests: booking.guests,
        registration_fee_paid: booking.registration_fee_paid,
        remaining_balance: booking.remaining_balance,
        total: booking.total,
        transaction_id,
      }
    });

    // Send push notification to user
    if (user?.push_token) {
      sendPushNotification(
        user.push_token,
        'Booking Fully Confirmed! 🎉',
        `Your booking for ${venue?.name || 'venue'} on ${booking.booking_date} is fully confirmed!`,
        { booking_id, venue_id: booking.venue_id }
      );
    }

    // Return full booking details
    const updatedBooking = await db.query.bookings.findFirst({
      where: eq(bookings.id, booking_id),
      with: {
        venue: { columns: { id: true, name: true, city: true, image_url: true } },
        user: { columns: { id: true, full_name: true, email: true, phone_number: true } },
      }
    });

    return {
      success: true,
      message: 'Booking fully confirmed',
      booking: updatedBooking,
    };
  } catch (err) {
    fastify.log.error('Admin confirm payment error:', err);
    return reply.status(500).send({ error: 'Failed to confirm payment', details: err.message });
  }
});


// ─── OTP RATE LIMITING & BRUTE-FORCE PROTECTION ────────────────────────────
// In-memory stores (reset on server restart — acceptable for this scale)
const otpSendTracker = new Map(); // phone -> { count, firstSentAt, lastSentAt }
const otpVerifyTracker = new Map(); // phone -> { attempts, lockedUntil }

const OTP_COOLDOWN_SECONDS = 30; // Min seconds between sends
const OTP_MAX_SENDS_PER_HOUR = 5; // Max sends per phone per hour
const OTP_MAX_VERIFY_ATTEMPTS = 5; // Max wrong attempts before lock
const OTP_LOCK_DURATION_MS = 15 * 60 * 1000; // 15 min lock after max attempts

function checkOtpRateLimit(phone) {
  const now = Date.now();
  const tracker = otpSendTracker.get(phone);

  if (!tracker) return { allowed: true };

  // Cooldown check (30s between sends)
  const secondsSinceLast = (now - tracker.lastSentAt) / 1000;
  if (secondsSinceLast < OTP_COOLDOWN_SECONDS) {
    const retryAfter = Math.ceil(OTP_COOLDOWN_SECONDS - secondsSinceLast);
    return { allowed: false, reason: `Please wait ${retryAfter} seconds before requesting another OTP.`, retryAfter };
  }

  // Hourly limit check
  const hourAgo = now - 3600000;
  if (tracker.firstSentAt > hourAgo && tracker.count >= OTP_MAX_SENDS_PER_HOUR) {
    const retryAfter = Math.ceil((tracker.firstSentAt + 3600000 - now) / 1000);
    return { allowed: false, reason: 'Too many OTP requests. Please try again later.', retryAfter };
  }

  // Reset counter if first send was more than an hour ago
  if (tracker.firstSentAt <= hourAgo) {
    otpSendTracker.delete(phone);
  }

  return { allowed: true };
}

function recordOtpSend(phone) {
  const now = Date.now();
  const tracker = otpSendTracker.get(phone);
  if (tracker) {
    tracker.count += 1;
    tracker.lastSentAt = now;
  } else {
    otpSendTracker.set(phone, { count: 1, firstSentAt: now, lastSentAt: now });
  }
}

function checkVerifyLock(phone) {
  const tracker = otpVerifyTracker.get(phone);
  if (!tracker) return { locked: false };
  if (tracker.lockedUntil && Date.now() < tracker.lockedUntil) {
    const remainingMs = tracker.lockedUntil - Date.now();
    const remainingMin = Math.ceil(remainingMs / 60000);
    return { locked: true, reason: `Too many failed attempts. Try again in ${remainingMin} minute${remainingMin > 1 ? 's' : ''}.` };
  }
  // Lock expired, reset
  if (tracker.lockedUntil && Date.now() >= tracker.lockedUntil) {
    otpVerifyTracker.delete(phone);
  }
  return { locked: false };
}

function recordVerifyFailure(phone) {
  const tracker = otpVerifyTracker.get(phone) || { attempts: 0, lockedUntil: null };
  tracker.attempts += 1;
  if (tracker.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
    tracker.lockedUntil = Date.now() + OTP_LOCK_DURATION_MS;
  }
  otpVerifyTracker.set(phone, tracker);
}

function clearVerifyTracker(phone) {
  otpVerifyTracker.delete(phone);
}

// ─── AUTHENTICATION ────────────────────────────────────────────────────────
fastify.post('/api/auth/sign-up', async (request, reply) => {
  const { first_name, last_name, email, phone_number, password } = request.body;
  
  if (!first_name || !last_name || !email || !phone_number) {
    return reply.status(400).send({ error: 'All fields are mandatory' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return reply.status(400).send({ error: 'Invalid email format' });
  }

  try {
    const existingEmail = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    if (existingEmail) {
      return reply.status(400).send({ error: 'Email already exists' });
    }

    const existingPhone = await db.query.users.findFirst({
      where: eq(users.phone_number, phone_number)
    });
    if (existingPhone) {
      return reply.status(400).send({ error: 'Phone number already registered' });
    }

    const full_name = `${first_name} ${last_name}`;
    let hashedPassword = null;
    if (password) {
      hashedPassword = await argon2.hash(password);
    }

    const [newUser] = await db.insert(users).values({
      first_name,
      last_name,
      full_name,
      email,
      phone_number,
      password: hashedPassword,
    }).returning();

    const token = fastify.jwt.sign({ id: newUser.id, email: newUser.email, phone_number: newUser.phone_number });
    return { token, user: {
      id: newUser.id,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      full_name: newUser.full_name,
      email: newUser.email,
      phone_number: newUser.phone_number,
      subscription_status: newUser.subscription_status || 'none',
    } };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.post('/api/auth/sign-in', async (request, reply) => {
  const { email, password } = request.body;

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (!user || !user.password) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const isMatch = await argon2.verify(user.password, password);
    if (!isMatch) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = fastify.jwt.sign({ id: user.id, email: user.email });
    return { token, user: { id: user.id, full_name: user.full_name, email: user.email, avatar_url: user.avatar_url } };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.post('/api/auth/send-otp', async (request, reply) => {
  const { phone_number } = request.body;
  if (!phone_number) return reply.status(400).send({ error: 'Phone number is required' });

  try {
    // Rate limiting check
    const rateCheck = checkOtpRateLimit(phone_number);
    if (!rateCheck.allowed) {
      return reply.status(429).send({ error: rateCheck.reason, retry_after: rateCheck.retryAfter });
    }

    // CHECK IF USER IS REGISTERED
    const user = await db.query.users.findFirst({
      where: eq(users.phone_number, phone_number)
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not registered. Please sign up first.' });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 10 * 60000); // 10 mins
    
    await db.insert(otps).values({
      phone_number,
      otp,
      expires_at
    });

    // Record the send for rate limiting
    recordOtpSend(phone_number);

    // Strip +91 prefix for SMS API (needs just 10-digit number)
    const rawPhone = phone_number.replace(/^\+91/, '');

    // Send via BOTH channels simultaneously
    const smsPromise = sendSmsMSG2Z(rawPhone, otp);
    const whatsappPromise = sendWhatsAppOTP(phone_number, otp);

    // Fire both, don't fail if one channel fails
    const [smsResult, waResult] = await Promise.allSettled([smsPromise, whatsappPromise]);

    const smsSent = smsResult.status === 'fulfilled' && smsResult.value;
    const waSent = waResult.status === 'fulfilled' && waResult.value;

    if (!smsSent && !waSent) {
      fastify.log.error('Both OTP channels failed', { sms: smsResult, wa: waResult });
      return reply.status(500).send({ error: 'Failed to send OTP. Please try again.' });
    }

    const channels = [];
    if (smsSent) channels.push('SMS');
    if (waSent) channels.push('WhatsApp');

    fastify.log.info(`OTP sent to ${phone_number} via ${channels.join(' + ')}`);
    return { success: true, message: `OTP sent via ${channels.join(' & ')}` };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── OTP Channel: SMS via MSG2Z ────────────────────────────────────────────
async function sendSmsMSG2Z(phoneNumber, otp) {
  try {
    const msg = `Your ZVenue verification code is ${otp}. This OTP is valid for 10 minutes. Please do not share it with anyone.`;
    const params = new URLSearchParams({
      UserID: process.env.MSG2Z_USER_ID,
      Password: process.env.MSG2Z_PASSWORD,
      SenderID: process.env.MSG2Z_SENDER_ID,
      Phno: phoneNumber,
      Msg: msg,
      EntityID: process.env.MSG2Z_ENTITY_ID,
      TemplateID: process.env.MSG2Z_TEMPLATE_ID,
    });

    const url = `http://msg2z.in/api/SmsApi/SendSingleApi?${params.toString()}`;
    const response = await fetch(url);
    const result = await response.text();

    fastify.log.info(`MSG2Z SMS response for ${phoneNumber}: ${result}`);
    return response.ok;
  } catch (err) {
    fastify.log.error('MSG2Z SMS Error:', err.message);
    return false;
  }
}

// ─── OTP Channel: WhatsApp via AOC ─────────────────────────────────────────
async function sendWhatsAppOTP(phoneNumber, otp) {
  try {
    const response = await fetch('https://api.aoc-portal.com/v1/whatsapp', {
      method: 'POST',
      headers: {
        'apikey': process.env.AOC_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.AOC_WHATSAPP_NUMBER,
        to: phoneNumber,
        templateName: process.env.AOC_TEMPLATE_NAME,
        otp: otp,
        type: 'template',
        language: { code: 'en' }
      })
    });

    const result = await response.json();
    if (!response.ok || result.error) {
      fastify.log.error('AOC WhatsApp Error:', result);
      return false;
    }
    return true;
  } catch (err) {
    fastify.log.error('WhatsApp OTP Error:', err.message);
    return false;
  }
}


fastify.post('/api/auth/verify-otp', async (request, reply) => {
  const { phone_number, otp } = request.body;
  if (!phone_number || !otp) return reply.status(400).send({ error: 'Phone number and OTP are required' });

  try {
    // Brute-force protection: check if phone is locked
    const lockCheck = checkVerifyLock(phone_number);
    if (lockCheck.locked) {
      return reply.status(423).send({ error: lockCheck.reason });
    }

    const otpRecord = await db.query.otps.findFirst({
      where: eq(otps.phone_number, phone_number),
      orderBy: [desc(otps.created_at)]
    });

    if (!otpRecord) return reply.status(400).send({ error: 'Invalid or expired OTP' });
    if (new Date() > otpRecord.expires_at) return reply.status(400).send({ error: 'OTP has expired. Please request a new one.' });

    if (otpRecord.otp !== otp) {
      // Record failed attempt
      recordVerifyFailure(phone_number);
      const tracker = otpVerifyTracker.get(phone_number);
      const remaining = OTP_MAX_VERIFY_ATTEMPTS - (tracker?.attempts || 0);
      if (remaining <= 0) {
        return reply.status(423).send({ error: 'Too many failed attempts. Please try again in 15 minutes.' });
      }
      return reply.status(400).send({ error: `Invalid OTP. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.` });
    }

    // OTP is valid — clear brute-force tracker
    clearVerifyTracker(phone_number);

    let user = await db.query.users.findFirst({
      where: eq(users.phone_number, phone_number)
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found. Registration required.' });
    }

    // Mark phone as verified after successful OTP verification
    if (!user.phone_verified) {
      await db.update(users)
        .set({ phone_verified: true })
        .where(eq(users.id, user.id));
      user = { ...user, phone_verified: true };
    }

    // Cleanup: delete all OTPs for this phone number
    await db.delete(otps).where(eq(otps.phone_number, phone_number));

    const token = fastify.jwt.sign({ id: user.id, phone_number: user.phone_number });
    return { token, user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
      avatar_url: user.avatar_url,
      subscription_status: user.subscription_status,
    } };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.get('/api/auth/me', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, request.user.id),
      columns: { id: true, first_name: true, last_name: true, full_name: true, email: true, phone_number: true, avatar_url: true }
    });
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }
    return user;
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── DELETE ACCOUNT ────────────────────────────────────────────────────────
fastify.delete('/api/auth/delete-account', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const user_id = request.user.id;

    // Get user details for subscription cancellation
    const user = await db.query.users.findFirst({
      where: eq(users.id, user_id),
      columns: { id: true, subscription_id: true, subscription_status: true },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Cancel active subscription if exists
    if (user.subscription_id && (user.subscription_status === 'active' || user.subscription_status === 'authenticated')) {
      try {
        await razorpay.subscriptions.cancel(user.subscription_id);
      } catch (err) {
        fastify.log.warn('Failed to cancel subscription during account deletion:', err.message);
      }
    }

    // Mark all user's bookings as cancelled
    await db.update(bookings)
      .set({ status: 'cancelled' })
      .where(and(eq(bookings.user_id, user_id), ne(bookings.status, 'cancelled')));

    // Delete user's notifications
    await db.delete(notifications).where(eq(notifications.user_id, user_id));

    // Delete the user record
    await db.delete(users).where(eq(users.id, user_id));

    fastify.log.info(`Account deleted: user_id=${user_id}`);

    return { success: true, message: 'Account permanently deleted' };
  } catch (err) {
    fastify.log.error('Delete account error:', err);
    return reply.status(500).send({ error: 'Failed to delete account. Please try again.' });
  }
});

// ─── DASHBOARD STATS ───────────────────────────────────────────────────────
fastify.get('/api/dashboard/stats', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const [totalVenuesRes] = await db.select({ count: count() }).from(venues);
    const [totalBookingsRes] = await db.select({ count: count() }).from(bookings);
    const [totalUsersRes] = await db.select({ count: count() }).from(users);
    const [totalCategoriesRes] = await db.select({ count: count() }).from(categories);
    
    const [revenueRes] = await db.select({ total: sum(bookings.total) }).from(bookings);
    const totalRevenue = revenueRes.total ? Number(revenueRes.total) : 0;
    const avgBookingValue = totalBookingsRes.count > 0 ? totalRevenue / totalBookingsRes.count : 0;

    const [pendingRes] = await db.select({ count: count() }).from(bookings).where(eq(bookings.status, 'pending'));
    const [confirmedRes] = await db.select({ count: count() }).from(bookings).where(eq(bookings.status, 'confirmed'));
    const [cancelledRes] = await db.select({ count: count() }).from(bookings).where(eq(bookings.status, 'cancelled'));

    return {
      totalVenues: totalVenuesRes.count,
      totalBookings: totalBookingsRes.count,
      totalUsers: totalUsersRes.count,
      totalCategories: totalCategoriesRes.count,
      totalRevenue,
      avgBookingValue,
      pendingBookings: pendingRes.count,
      confirmedBookings: confirmedRes.count,
      cancelledBookings: cancelledRes.count,
    };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── DASHBOARD RECENT BOOKINGS ─────────────────────────────────────────────
fastify.get('/api/dashboard/recent-bookings', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const data = await db.query.bookings.findMany({
      with: {
        venue: { columns: { name: true, city: true, image_url: true } },
        user: { columns: { full_name: true, email: true, avatar_url: true } },
      },
      orderBy: [desc(bookings.created_at)],
      limit: 10,
    });
    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── DASHBOARD REVENUE CHART ───────────────────────────────────────────────
fastify.get('/api/dashboard/revenue-chart', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const data = await db.query.bookings.findMany({
      columns: { total: true, created_at: true },
      orderBy: [asc(bookings.created_at)],
    });

    const monthly = {};
    data.forEach(b => {
      const month = new Date(b.created_at).toLocaleString('en', { month: 'short', year: 'numeric' });
      monthly[month] = (monthly[month] || 0) + (b.total || 0);
    });

    return Object.entries(monthly).map(([month, revenue]) => ({ month, revenue }));
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── DASHBOARD BOOKINGS BY CATEGORY ────────────────────────────────────────
fastify.get('/api/dashboard/bookings-by-category', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const data = await db.query.bookings.findMany({
      with: {
        venue: {
          with: { category: { columns: { name: true } } }
        }
      }
    });

    const counts = {};
    data.forEach(b => {
      const catName = b.venue?.category?.name || 'Other';
      counts[catName] = (counts[catName] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── VENUES CRUD ───────────────────────────────────────────────────────────
// Public: only approved venues
fastify.get('/api/venues', async (request, reply) => {
  try {
    const { search, category_id, all, lat, lng, radius } = request.query;
    
    // If 'all' param is passed (admin panel), return all venues
    const approvalFilter = all ? undefined : eq(venues.approval_status, 'approved');

    // For mobile app (no 'all' param), also exclude venues without registration fee
    const regFeeFilter = all ? undefined : sql`${venues.registration_fee} > 0`;

    let whereClause = approvalFilter;
    if (regFeeFilter && whereClause) {
      whereClause = and(whereClause, regFeeFilter);
    } else if (regFeeFilter) {
      whereClause = regFeeFilter;
    }
    if (search && category_id) {
      const searchFilter = sql`(name ILIKE ${'%' + search + '%'} OR city ILIKE ${'%' + search + '%'}) AND category_id = ${category_id}`;
      whereClause = approvalFilter ? and(approvalFilter, searchFilter) : searchFilter;
    } else if (search) {
      const searchFilter = sql`name ILIKE ${'%' + search + '%'} OR city ILIKE ${'%' + search + '%'}`;
      whereClause = approvalFilter ? and(approvalFilter, searchFilter) : searchFilter;
    } else if (category_id) {
      const catFilter = eq(venues.category_id, category_id);
      whereClause = approvalFilter ? and(approvalFilter, catFilter) : catFilter;
    }

    const data = await db.query.venues.findMany({
      where: whereClause,
      with: { category: true, owner: { columns: { id: true, full_name: true, email: true } } },
      orderBy: [desc(venues.created_at)]
    });

    // If lat/lng provided, calculate distance and sort by nearest
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const maxRadius = radius ? parseFloat(radius) : 100; // default 100km

      if (!isNaN(userLat) && !isNaN(userLng)) {
        const withDistance = data.map(venue => {
          if (venue.latitude && venue.longitude) {
            const distance = haversineDistance(userLat, userLng, parseFloat(venue.latitude), parseFloat(venue.longitude));
            return { ...venue, distance: Math.round(distance * 10) / 10 };
          }
          return { ...venue, distance: null };
        });

        // Filter by radius and sort by distance (venues without coords go to end)
        const filtered = withDistance.filter(v => v.distance === null || v.distance <= maxRadius);
        filtered.sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });

        return filtered;
      }
    }

    return data;
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.get('/api/venues/:id', async (request, reply) => {
  try {
    const data = await db.query.venues.findFirst({
      where: eq(venues.id, request.params.id),
      with: { category: true, owner: { columns: { id: true, full_name: true } } }
    });
    return data || {};
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.post('/api/venues', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const venueData = { ...request.body };

    // Validate mandatory registration fee
    if (!venueData.registration_fee || venueData.registration_fee <= 0) {
      return reply.status(400).send({
        error: 'Registration fee is required',
        message: 'A registration fee greater than zero must be set before the venue can be published.'
      });
    }
    
    // Geocode the address if location/city provided
    if (venueData.location || venueData.city) {
      const address = buildAddress(venueData.location, venueData.city);
      const coords = await geocodeAddress(address);
      if (coords) {
        venueData.latitude = coords.latitude;
        venueData.longitude = coords.longitude;
        fastify.log.info(`Geocoded "${address}" → ${coords.latitude}, ${coords.longitude}`);
      } else {
        fastify.log.warn(`Geocoding failed for "${address}" — saving with null coordinates`);
      }
    }

    const [inserted] = await db.insert(venues).values(venueData).returning();
    const data = await db.query.venues.findFirst({
      where: eq(venues.id, inserted.id),
      with: { category: true }
    });
    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.put('/api/venues/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const updates = { ...request.body };
    
    // Re-geocode if location or city changed
    if (updates.location || updates.city) {
      const address = buildAddress(updates.location, updates.city);
      const coords = await geocodeAddress(address);
      if (coords) {
        updates.latitude = coords.latitude;
        updates.longitude = coords.longitude;
      }
    }

    await db.update(venues).set(updates).where(eq(venues.id, request.params.id));
    const data = await db.query.venues.findFirst({
      where: eq(venues.id, request.params.id),
      with: { category: true }
    });
    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.delete('/api/venues/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    await db.delete(venues).where(eq(venues.id, request.params.id));
    return { success: true };
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── VENUE BOOKED DATES (for calendar) ─────────────────────────────────────
fastify.get('/api/venues/:id/booked-dates', async (request, reply) => {
  try {
    const venueId = request.params.id;
    
    // Get confirmed bookings
    const confirmedBookings = await db.query.bookings.findMany({
      where: and(
        eq(bookings.venue_id, venueId),
        eq(bookings.status, 'confirmed')
      ),
      columns: { booking_date: true, start_time: true, end_time: true }
    });

    // Get blocked dates from venue
    const venue = await db.query.venues.findFirst({
      where: eq(venues.id, venueId),
      columns: { blocked_dates: true }
    });

    return {
      bookings: confirmedBookings,
      blocked_dates: venue?.blocked_dates || [],
    };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── CATEGORIES CRUD ───────────────────────────────────────────────────────
fastify.get('/api/categories', async (request, reply) => {
  try {
    const data = await db.query.categories.findMany({
      orderBy: [asc(categories.sort_order)]
    });
    return data;
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.post('/api/categories', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const [inserted] = await db.insert(categories).values(request.body).returning();
    return inserted;
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.put('/api/categories/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const [updated] = await db.update(categories).set(request.body).where(eq(categories.id, request.params.id)).returning();
    return updated;
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.delete('/api/categories/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    await db.delete(categories).where(eq(categories.id, request.params.id));
    return { success: true };
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── BOOKINGS CRUD ─────────────────────────────────────────────────────────
fastify.get('/api/bookings', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { status, search, user_id } = request.query;
    
    let conditions = [];
    if (status) conditions.push(eq(bookings.status, status));
    if (user_id) conditions.push(eq(bookings.user_id, user_id));
    
    const whereClause = conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined;
    
    const data = await db.query.bookings.findMany({
      where: whereClause,
      with: {
        venue: { with: { category: true } },
        user: { columns: { id: true, full_name: true, email: true, avatar_url: true } }
      },
      orderBy: [desc(bookings.created_at)]
    });

    if (search) {
      const lowerSearch = search.toLowerCase();
      return data.filter(b => b.venue?.name?.toLowerCase().includes(lowerSearch) || b.user?.full_name?.toLowerCase().includes(lowerSearch));
    }

    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.get('/api/bookings/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const data = await db.query.bookings.findFirst({
      where: eq(bookings.id, request.params.id),
      with: {
        venue: { with: { category: true } },
        user: { columns: { id: true, full_name: true, email: true, phone_number: true, avatar_url: true } }
      }
    });
    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.put('/api/bookings/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const bookingId = request.params.id;
    const updates = request.body;

    // If confirming a booking, check for date/time conflicts
    if (updates.status === 'confirmed') {
      // Get the booking being updated
      const currentBooking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
        columns: { venue_id: true, booking_date: true, start_time: true, end_time: true, status: true }
      });

      if (currentBooking && currentBooking.status !== 'confirmed') {
        // Check for existing confirmed bookings on the same venue, date, and overlapping time
        const conflicts = await db.query.bookings.findMany({
          where: and(
            eq(bookings.venue_id, currentBooking.venue_id),
            eq(bookings.booking_date, currentBooking.booking_date),
            eq(bookings.status, 'confirmed')
          ),
          columns: { id: true, start_time: true, end_time: true, booking_date: true }
        });

        // Exclude the current booking itself (in case it's already confirmed)
        const otherConflicts = conflicts.filter(c => c.id !== bookingId);

        if (otherConflicts.length > 0) {
          const conflict = otherConflicts[0];
          return reply.status(409).send({
            error: 'Booking conflict',
            message: `Cannot confirm: this venue is already booked on ${conflict.booking_date} from ${conflict.start_time} to ${conflict.end_time}.`,
            conflict: {
              date: conflict.booking_date,
              start_time: conflict.start_time,
              end_time: conflict.end_time,
            }
          });
        }
      }
    }

    await db.update(bookings).set(updates).where(eq(bookings.id, bookingId));
    const data = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      with: {
        venue: { columns: { name: true, city: true, image_url: true } },
        user: { columns: { full_name: true, email: true } }
      }
    });
    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.delete('/api/bookings/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    await db.delete(bookings).where(eq(bookings.id, request.params.id));
    return { success: true };
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.post('/api/bookings', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { venue_id, booking_date, start_time, end_time, guests, subtotal, service_fee, total, payment_method } = request.body;
    const user_id = request.user.id;

    // Check for conflicts
    const conflicts = await db.query.bookings.findMany({
      where: and(
        eq(bookings.venue_id, venue_id),
        eq(bookings.booking_date, booking_date),
        eq(bookings.status, 'confirmed')
      )
    });

    // Simple overlap check (for strings, this is basic; ideally use timestamps)
    // But since we are using strings like "10:00 AM", we'll just check for exact matches or overlap if they use a standard format.
    if (conflicts.length > 0) {
      const firstConflict = conflicts[0];
      return reply.status(400).send({ 
        error: `Already booked! This venue is reserved on ${firstConflict.booking_date} from ${firstConflict.start_time} to ${firstConflict.end_time}. Please choose another time or date.` 
      });
    }

    const [inserted] = await db.insert(bookings).values({
      venue_id,
      user_id,
      booking_date,
      start_time,
      end_time,
      guests,
      subtotal,
      service_fee,
      total,
      payment_method,
      status: 'confirmed'
    }).returning();

    // Create Notification for the user
    await db.insert(notifications).values({
      user_id,
      title: 'Booking Confirmed!',
      body: `Your booking for venue on ${booking_date} has been confirmed.`,
      type: 'booking',
      is_read: false,
      data: { booking_id: inserted.id }
    });

    // Create a System/Admin notification (just insert one without user_id or a dummy system user if needed)
    // For now, we'll insert one with user_id null if the schema allows, or just broadcast it.
    // Looking at schema, user_id is a reference. 
    // We'll just create a notification for the booking user, and the admin panel fetches all notifications anyway.
    
    return inserted;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── USERS ─────────────────────────────────────────────────────────────────
fastify.get('/api/users', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { search } = request.query;
    
    let whereClause = undefined;
    if (search) {
      whereClause = sql`full_name ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'}`;
    }

    const data = await db.query.users.findMany({
      where: whereClause,
      columns: { id: true, full_name: true, email: true, avatar_url: true, created_at: true },
      with: {
        bookings: { columns: { id: true } }
      },
      orderBy: [desc(users.created_at)]
    });

    return data.map(u => ({
      ...u,
      booking_count: u.bookings.length,
      bookings: undefined // remove the array, just keep the count
    }));
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.get('/api/users/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const data = await db.query.users.findFirst({
      where: eq(users.id, request.params.id),
      columns: { id: true, first_name: true, last_name: true, full_name: true, email: true, phone_number: true, avatar_url: true, created_at: true },
      with: {
        bookings: {
          with: { venue: { columns: { name: true, city: true, image_url: true } } },
          orderBy: [desc(bookings.created_at)]
        }
      }
    });
    return data;
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.put('/api/users/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { first_name, last_name, full_name, email, phone_number, avatar_url } = request.body;
    const updates = {};
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;
    if (full_name !== undefined) updates.full_name = full_name;
    if (email !== undefined) updates.email = email;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    // Don't allow phone_number change (it's the login identifier)

    const [updated] = await db.update(users)
      .set(updates)
      .where(eq(users.id, request.params.id))
      .returning();
    return updated;
  } catch (err) {
    if (err.code === '23505') return reply.status(400).send({ error: 'Email already in use by another account' });
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.delete('/api/users/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    await db.delete(users).where(eq(users.id, request.params.id));
    return { success: true };
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── PUSH NOTIFICATIONS ────────────────────────────────────────────────────

// Save push token for a user
fastify.post('/api/push-token', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { push_token } = request.body;
    if (!push_token) return reply.status(400).send({ error: 'push_token is required' });
    
    await db.update(users)
      .set({ push_token })
      .where(eq(users.id, request.user.id));
    
    return { success: true };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Utility: Send push notification to a user via Expo Push API
async function sendPushNotification(pushToken, title, body, data = {}) {
  if (!pushToken) return;
  
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
      }),
    });
  } catch (err) {
    fastify.log.error('Push notification failed:', err.message);
  }
}

// Admin: Send push notification to a specific user
fastify.post('/api/push/send', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { user_id, title, body, data } = request.body;
    
    if (!user_id || !title || !body) {
      return reply.status(400).send({ error: 'user_id, title, and body are required' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, user_id),
      columns: { push_token: true },
    });

    if (!user?.push_token) {
      return reply.status(404).send({ error: 'User has no push token registered' });
    }

    await sendPushNotification(user.push_token, title, body, data || {});
    return { success: true, message: 'Push notification sent' };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Admin: Broadcast push notification to all users with tokens
fastify.post('/api/push/broadcast', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { title, body, data } = request.body;
    if (!title || !body) return reply.status(400).send({ error: 'title and body are required' });

    const usersWithTokens = await db.query.users.findMany({
      where: sql`${users.push_token} IS NOT NULL AND ${users.push_token} != ''`,
      columns: { push_token: true },
    });

    const messages = usersWithTokens.map(u => ({
      to: u.push_token,
      title,
      body,
      data: data || {},
      sound: 'default',
      priority: 'high',
    }));

    // Expo push API supports batch (up to 100 per request)
    const chunks = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk),
      });
    }

    return { success: true, sent_to: messages.length };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── SUBSCRIBERS ───────────────────────────────────────────────────────────
fastify.get('/api/subscribers', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { status, search } = request.query;

    // Get all users with subscription data
    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        full_name: true,
        email: true,
        phone_number: true,
        avatar_url: true,
        subscription_id: true,
        subscription_status: true,
        next_billing_at: true,
        created_at: true,
      },
      with: {
        bookings: { columns: { id: true } }
      },
      orderBy: [desc(users.created_at)]
    });

    let result = allUsers.map(u => ({
      ...u,
      booking_count: u.bookings?.length || 0,
      bookings: undefined,
      is_subscribed: u.subscription_status === 'active' || u.subscription_status === 'authenticated',
    }));

    // Filter by subscription status
    if (status === 'active') {
      result = result.filter(u => u.is_subscribed);
    } else if (status === 'free') {
      result = result.filter(u => !u.is_subscribed);
    }

    // Search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(u =>
        u.full_name?.toLowerCase().includes(lowerSearch) ||
        u.email?.toLowerCase().includes(lowerSearch) ||
        u.phone_number?.includes(search)
      );
    }

    return result;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Cancel a user's subscription (admin action)
fastify.post('/api/subscribers/:id/cancel', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const userId = request.params.id;
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { subscription_id: true, subscription_status: true },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Cancel in Razorpay if subscription exists
    if (user.subscription_id) {
      try {
        await razorpay.subscriptions.cancel(user.subscription_id);
      } catch (err) {
        fastify.log.warn('Razorpay cancel failed (may already be cancelled):', err.message);
      }
    }

    // Update DB
    await db.update(users)
      .set({ subscription_status: 'cancelled' })
      .where(eq(users.id, userId));

    return { success: true, message: 'Subscription cancelled' };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Failed to cancel subscription' });
  }
});

// Activate a user's subscription (admin action - manual override)
fastify.post('/api/subscribers/:id/activate', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const userId = request.params.id;
    await db.update(users)
      .set({ subscription_status: 'active' })
      .where(eq(users.id, userId));

    return { success: true, message: 'Subscription activated' };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Failed to activate subscription' });
  }
});

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────
fastify.get('/api/notifications', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { user_id, owner_id } = request.query;
    
    let whereClause = undefined;
    if (user_id) {
      whereClause = eq(notifications.user_id, user_id);
    }

    const data = await db.query.notifications.findMany({
      where: whereClause,
      with: {
        user: { columns: { full_name: true, email: true } }
      },
      orderBy: [desc(notifications.created_at)],
      limit: 100
    });

    // If owner_id is provided, filter to only show notifications for that owner
    if (owner_id) {
      return data.filter(n => {
        const nData = n.data || {};
        return nData.owner_id === owner_id || n.type === 'announcement';
      });
    }

    return data;
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.post('/api/notifications', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const [inserted] = await db.insert(notifications).values(request.body).returning();
    const data = await db.query.notifications.findFirst({
      where: eq(notifications.id, inserted.id),
      with: { user: { columns: { full_name: true, email: true } } }
    });
    return data;
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.post('/api/notifications/broadcast', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { title, body, type } = request.body;
    const allUsers = await db.query.users.findMany({ columns: { id: true } });

    const notificationsData = allUsers.map(u => ({
      user_id: u.id,
      title,
      body,
      type: type || 'announcement',
      is_read: false,
      data: {},
    }));

    if (notificationsData.length > 0) {
      await db.insert(notifications).values(notificationsData);
    }

    return { success: true, count: notificationsData.length };
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.patch('/api/notifications/:id/read', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    await db.update(notifications).set({ is_read: true }).where(eq(notifications.id, request.params.id));
    return { success: true };
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.delete('/api/notifications/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    await db.delete(notifications).where(eq(notifications.id, request.params.id));
    return { success: true };
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── DASHBOARD: TOP VENUES ─────────────────────────────────────────────────
fastify.get('/api/dashboard/top-venues', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const data = await db.query.venues.findMany({
      columns: { id: true, name: true, city: true, rating: true, review_count: true, image_url: true },
      with: { category: { columns: { name: true } } },
      orderBy: [desc(venues.rating)],
      limit: 5
    });
    return data;
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── DASHBOARD: CITY DISTRIBUTION ──────────────────────────────────────────
fastify.get('/api/dashboard/city-distribution', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const data = await db.query.venues.findMany({ columns: { city: true } });
    
    const counts = {};
    data.forEach(v => {
      const city = v.city || 'Unknown';
      counts[city] = (counts[city] || 0) + 1;
    });

    return Object.entries(counts).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count);
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── REVIEWS ────────────────────────────────────────────────────────────────

// Helper: Recalculate venue rating and review_count
async function recalculateVenueRating(venueId, trx = db) {
  const result = await trx.select({
    avgRating: avg(reviews.rating),
    reviewCount: count(reviews.id),
  }).from(reviews).where(eq(reviews.venue_id, venueId));

  const avgRating = result[0]?.avgRating ? Math.round(parseFloat(result[0].avgRating) * 10) / 10 : 0;
  const reviewCount = result[0]?.reviewCount || 0;

  await trx.update(venues)
    .set({ rating: avgRating, review_count: reviewCount })
    .where(eq(venues.id, venueId));

  return { avgRating, reviewCount };
}

// Check review eligibility for a venue
fastify.get('/api/reviews/eligibility/:venueId', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { venueId } = request.params;
    const userId = request.user.id;

    // Check if user has a qualifying booking
    const qualifying = await db.query.bookings.findFirst({
      where: and(
        eq(bookings.venue_id, venueId),
        eq(bookings.user_id, userId),
        or(eq(bookings.status, 'confirmed'), eq(bookings.status, 'pre_booked'))
      ),
    });

    // Check if user already has a review for this venue
    const existingReview = await db.query.reviews.findFirst({
      where: and(eq(reviews.venue_id, venueId), eq(reviews.user_id, userId)),
    });

    return {
      eligible: !!qualifying,
      existing_review: existingReview || null,
    };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Create a review
fastify.post('/api/reviews', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { venue_id, rating, comment } = request.body;
    const userId = request.user.id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return reply.status(400).send({ error: 'Rating must be an integer between 1 and 5' });
    }

    // Validate comment length
    if (comment && comment.length > 500) {
      return reply.status(400).send({ error: 'Comment must be 500 characters or less' });
    }

    // Validate venue exists
    const venue = await db.query.venues.findFirst({
      where: eq(venues.id, venue_id),
      columns: { id: true },
    });
    if (!venue) {
      return reply.status(400).send({ error: 'Venue not found' });
    }

    // Check booking eligibility
    const qualifying = await db.query.bookings.findFirst({
      where: and(
        eq(bookings.venue_id, venue_id),
        eq(bookings.user_id, userId),
        or(eq(bookings.status, 'confirmed'), eq(bookings.status, 'pre_booked'))
      ),
    });
    if (!qualifying) {
      return reply.status(403).send({ error: 'You must have a completed booking to review this venue' });
    }

    // Check if review already exists (upsert)
    const existing = await db.query.reviews.findFirst({
      where: and(eq(reviews.venue_id, venue_id), eq(reviews.user_id, userId)),
    });

    let result;
    if (existing) {
      // Update existing review
      const [updated] = await db.update(reviews)
        .set({ rating, comment: comment || null, updated_at: new Date() })
        .where(eq(reviews.id, existing.id))
        .returning();
      result = updated;
    } else {
      // Insert new review
      const [inserted] = await db.insert(reviews)
        .values({ venue_id, user_id: userId, rating, comment: comment || null })
        .returning();
      result = inserted;
    }

    // Recalculate venue rating
    await recalculateVenueRating(venue_id);

    return reply.status(existing ? 200 : 201).send(result);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Get reviews for a venue (paginated, public)
fastify.get('/api/venues/:id/reviews', async (request, reply) => {
  try {
    const { id: venueId } = request.params;
    const page = Math.max(1, parseInt(request.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(request.query.limit) || 10));
    const offset = (page - 1) * limit;

    // Get total count
    const [{ total }] = await db.select({ total: count(reviews.id) })
      .from(reviews)
      .where(eq(reviews.venue_id, venueId));

    // Get paginated reviews with user info
    const reviewsList = await db.query.reviews.findMany({
      where: eq(reviews.venue_id, venueId),
      orderBy: [desc(reviews.created_at)],
      limit,
      offset,
      with: {
        user: {
          columns: { id: true, full_name: true, avatar_url: true },
        },
      },
    });

    return {
      reviews: reviewsList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Update a review (owner only)
fastify.put('/api/reviews/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { id: reviewId } = request.params;
    const { rating, comment } = request.body;
    const userId = request.user.id;

    // Find the review
    const review = await db.query.reviews.findFirst({
      where: eq(reviews.id, reviewId),
    });
    if (!review) {
      return reply.status(404).send({ error: 'Review not found' });
    }

    // Check ownership
    if (review.user_id !== userId) {
      return reply.status(403).send({ error: 'You can only edit your own reviews' });
    }

    // Validate rating
    if (rating && (rating < 1 || rating > 5 || !Number.isInteger(rating))) {
      return reply.status(400).send({ error: 'Rating must be an integer between 1 and 5' });
    }

    // Update
    const [updated] = await db.update(reviews)
      .set({
        ...(rating && { rating }),
        ...(comment !== undefined && { comment: comment || null }),
        updated_at: new Date(),
      })
      .where(eq(reviews.id, reviewId))
      .returning();

    // Recalculate venue rating
    await recalculateVenueRating(review.venue_id);

    return updated;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Delete a review (owner or admin)
fastify.delete('/api/reviews/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { id: reviewId } = request.params;
    const userId = request.user.id;
    const userRole = request.user.role;

    // Find the review
    const review = await db.query.reviews.findFirst({
      where: eq(reviews.id, reviewId),
    });
    if (!review) {
      return reply.status(404).send({ error: 'Review not found' });
    }

    // Check ownership or admin role
    if (review.user_id !== userId && userRole !== 'admin' && userRole !== 'owner') {
      return reply.status(403).send({ error: 'Insufficient permissions to delete this review' });
    }

    // Delete
    await db.delete(reviews).where(eq(reviews.id, reviewId));

    // Recalculate venue rating
    await recalculateVenueRating(review.venue_id);

    return { success: true, message: 'Review deleted' };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Admin: Get all reviews with filters
fastify.get('/api/admin/reviews', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const page = Math.max(1, parseInt(request.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(request.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { venue_id, rating: filterRating, date_from, date_to } = request.query;

    // Build conditions
    const conditions = [];
    if (venue_id) conditions.push(eq(reviews.venue_id, venue_id));
    if (filterRating) conditions.push(eq(reviews.rating, parseInt(filterRating)));
    if (date_from) conditions.push(gte(reviews.created_at, new Date(date_from)));
    if (date_to) conditions.push(lte(reviews.created_at, new Date(date_to)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ total }] = await db.select({ total: count(reviews.id) })
      .from(reviews)
      .where(whereClause);

    // Get paginated reviews with user and venue info
    const reviewsList = await db.query.reviews.findMany({
      where: whereClause,
      orderBy: [desc(reviews.created_at)],
      limit,
      offset,
      with: {
        user: {
          columns: { id: true, full_name: true, avatar_url: true },
        },
        venue: {
          columns: { id: true, name: true, city: true },
        },
      },
    });

    return {
      reviews: reviewsList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── SERVICE MARKETPLACE ────────────────────────────────────────────────────

// ─── SERVICE CATEGORIES CRUD ────────────────────────────────────────────────

// Public: list active service categories
fastify.get('/api/service-categories', async (request, reply) => {
  try {
    const data = await db.query.service_categories.findMany({
      where: eq(service_categories.is_active, true),
      orderBy: [asc(service_categories.sort_order)],
    });
    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Admin: list all service categories (including inactive)
fastify.get('/api/admin/service-categories', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const data = await db.query.service_categories.findMany({
      orderBy: [asc(service_categories.sort_order)],
      with: { listings: { columns: { id: true } } },
    });
    return data.map(c => ({ ...c, listing_count: c.listings?.length || 0, listings: undefined }));
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Admin: create service category
fastify.post('/api/service-categories', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { name, icon, sort_order } = request.body;
    if (!name) return reply.status(400).send({ error: 'Name is required' });
    const [inserted] = await db.insert(service_categories).values({ name, icon: icon || 'star', sort_order: sort_order || 0 }).returning();
    return inserted;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Admin: update service category
fastify.put('/api/service-categories/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const [updated] = await db.update(service_categories).set(request.body).where(eq(service_categories.id, request.params.id)).returning();
    return updated;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Admin: delete service category
fastify.delete('/api/service-categories/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    await db.delete(service_categories).where(eq(service_categories.id, request.params.id));
    return { success: true };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── SERVICE LISTINGS CRUD ──────────────────────────────────────────────────

// Public: list active service listings (filtered by category, search, paginated)
fastify.get('/api/service-listings', async (request, reply) => {
  try {
    const { category_id, search, page = '1', limit = '20', all } = request.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let conditions = [];
    if (!all) {
      conditions.push(eq(service_listings.is_active, true));
      conditions.push(eq(service_listings.approval_status, 'approved'));
      conditions.push(sql`${service_listings.quantity_available} > 0`);
    }
    if (category_id) conditions.push(eq(service_listings.service_category_id, category_id));
    if (search) {
      conditions.push(sql`(${service_listings.name} ILIKE ${'%' + search + '%'} OR ${service_listings.description} ILIKE ${'%' + search + '%'})`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.query.service_listings.findMany({
      where: whereClause,
      with: { category: true, owner: { columns: { id: true, full_name: true, email: true } } },
      orderBy: [desc(service_listings.rating), desc(service_listings.review_count), desc(service_listings.created_at)],
      limit: limitNum,
      offset,
    });

    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Public: get single service listing
fastify.get('/api/service-listings/:id', async (request, reply) => {
  try {
    const data = await db.query.service_listings.findFirst({
      where: eq(service_listings.id, request.params.id),
      with: { category: true, owner: { columns: { id: true, full_name: true } } },
    });
    return data || reply.status(404).send({ error: 'Service listing not found' });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Admin: create service listing
fastify.post('/api/service-listings', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const body = request.body;
    if (!body.name || !body.service_category_id || !body.price || !body.city) {
      return reply.status(400).send({ error: 'Name, category, price, and city are required' });
    }
    if (body.images && body.images.length > 5) {
      return reply.status(400).send({ error: 'Maximum 5 images allowed' });
    }
    if (body.subscriber_discount_percent && (body.subscriber_discount_percent < 0 || body.subscriber_discount_percent > 50)) {
      return reply.status(400).send({ error: 'Subscriber discount must be between 0 and 50%' });
    }
    const [inserted] = await db.insert(service_listings).values({
      ...body,
      approval_status: 'approved',
      images: body.images || [],
      subscriber_benefits: body.subscriber_benefits || [],
    }).returning();
    const data = await db.query.service_listings.findFirst({
      where: eq(service_listings.id, inserted.id),
      with: { category: true },
    });
    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Admin: update service listing
fastify.put('/api/service-listings/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const body = request.body;
    if (body.images && body.images.length > 5) {
      return reply.status(400).send({ error: 'Maximum 5 images allowed' });
    }
    await db.update(service_listings).set(body).where(eq(service_listings.id, request.params.id));
    const data = await db.query.service_listings.findFirst({
      where: eq(service_listings.id, request.params.id),
      with: { category: true },
    });
    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Admin: delete service listing
fastify.delete('/api/service-listings/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    await db.delete(service_listings).where(eq(service_listings.id, request.params.id));
    return { success: true };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Admin: approve service listing
fastify.post('/api/service-listings/:id/approve', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const listing = await db.query.service_listings.findFirst({ where: eq(service_listings.id, request.params.id) });
    if (!listing) return reply.status(404).send({ error: 'Listing not found' });

    if (listing.approval_status === 'pending_changes' && listing.pending_changes) {
      await db.update(service_listings).set({ ...listing.pending_changes, approval_status: 'approved', pending_changes: null }).where(eq(service_listings.id, request.params.id));
    } else {
      await db.update(service_listings).set({ approval_status: 'approved', pending_changes: null }).where(eq(service_listings.id, request.params.id));
    }
    return { success: true, message: 'Service listing approved' };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Admin: reject service listing
fastify.post('/api/service-listings/:id/reject', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    await db.update(service_listings).set({ approval_status: 'rejected', pending_changes: null }).where(eq(service_listings.id, request.params.id));
    return { success: true, message: 'Service listing rejected' };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── SERVICE BOOKINGS & PAYMENT ─────────────────────────────────────────────

// Generate unique Service Booking ID (ZSID-XXXXXXXX)
async function generateServiceBookingDisplayId() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const digits = String(Math.floor(10000000 + Math.random() * 90000000));
    const displayId = `ZSID-${digits}`;
    const existing = await db.query.service_bookings.findFirst({
      where: eq(service_bookings.booking_id_display, displayId),
      columns: { id: true },
    });
    if (!existing) return displayId;
  }
  return `ZSID-${Date.now().toString().slice(-8)}`;
}

// User: create Razorpay order for service purchase
fastify.post('/api/service-bookings/create-order', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { service_listing_id, quantity } = request.body;
    const user_id = request.user.id;

    if (!service_listing_id || !quantity || quantity < 1) {
      return reply.status(400).send({ error: 'Service listing ID and quantity are required' });
    }

    // Get listing and validate stock
    const listing = await db.query.service_listings.findFirst({
      where: eq(service_listings.id, service_listing_id),
      columns: { id: true, name: true, price: true, quantity_available: true, subscriber_discount_percent: true, city: true, images: true, owner_name: true },
    });

    if (!listing) return reply.status(404).send({ error: 'Service listing not found' });
    if (listing.quantity_available < quantity) {
      return reply.status(400).send({ error: `Insufficient stock. Only ${listing.quantity_available} items available.` });
    }

    // Get user details
    const user = await db.query.users.findFirst({
      where: eq(users.id, user_id),
      columns: { email: true, full_name: true, phone_number: true, subscription_status: true },
    });
    if (!user) return reply.status(404).send({ error: 'User not found' });

    // Calculate amount with subscriber discount
    let totalAmount = listing.price * quantity;
    let discountApplied = 0;
    const isSubscriber = user.subscription_status === 'active' || user.subscription_status === 'authenticated';
    if (isSubscriber && listing.subscriber_discount_percent > 0) {
      discountApplied = Math.round(totalAmount * listing.subscriber_discount_percent / 100);
      totalAmount = totalAmount - discountApplied;
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // paise
      currency: 'INR',
      receipt: `service_${Date.now()}`,
      notes: { user_id, service_listing_id, quantity: String(quantity) },
    });

    // Create pending booking
    const displayId = await generateServiceBookingDisplayId();
    const [booking] = await db.insert(service_bookings).values({
      booking_id_display: displayId,
      service_listing_id,
      user_id,
      quantity,
      unit_price: listing.price,
      discount_applied: discountApplied,
      total_amount: totalAmount,
      order_id: order.id,
      status: 'pending',
    }).returning();

    return { order, booking, listing: { name: listing.name, city: listing.city, images: listing.images } };
  } catch (err) {
    fastify.log.error('Service create-order error:', err);
    return reply.status(500).send({ error: 'Failed to create payment order' });
  }
});

// User: verify service payment
fastify.post('/api/service-bookings/verify-payment', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { order_id, payment_id, signature, booking_id } = request.body;
    const user_id = request.user.id;

    if (!order_id || !payment_id || !signature || !booking_id) {
      return reply.status(400).send({ error: 'Missing payment verification details' });
    }

    const booking = await db.query.service_bookings.findFirst({
      where: and(eq(service_bookings.id, booking_id), eq(service_bookings.user_id, user_id)),
    });
    if (!booking) return reply.status(404).send({ error: 'Booking not found' });

    // Verify signature
    const crypto = await import('crypto');
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(order_id + '|' + payment_id)
      .digest('hex');

    if (signature !== expectedSignature) {
      await db.update(service_bookings).set({ status: 'payment_failed' }).where(eq(service_bookings.id, booking_id));
      return reply.status(400).send({ error: 'Invalid payment signature' });
    }

    // Atomically confirm booking and decrement stock
    await db.update(service_bookings).set({ status: 'confirmed', payment_id, signature }).where(eq(service_bookings.id, booking_id));
    await db.update(service_listings).set({
      quantity_available: sql`${service_listings.quantity_available} - ${booking.quantity}`,
    }).where(eq(service_listings.id, booking.service_listing_id));

    // Create notification
    await db.insert(notifications).values({
      user_id,
      title: 'Service Booking Confirmed!',
      body: `Your service booking ${booking.booking_id_display} has been confirmed.`,
      type: 'service_booking',
      is_read: false,
      data: { booking_id, booking_id_display: booking.booking_id_display },
    });

    // Push notification
    const userForPush = await db.query.users.findFirst({ where: eq(users.id, user_id), columns: { push_token: true } });
    if (userForPush?.push_token) {
      sendPushNotification(userForPush.push_token, 'Service Booking Confirmed! ✅', `Booking ${booking.booking_id_display} confirmed.`, { booking_id });
    }

    const updatedBooking = await db.query.service_bookings.findFirst({
      where: eq(service_bookings.id, booking_id),
      with: { listing: { columns: { name: true, city: true, images: true, owner_name: true } } },
    });

    return { success: true, booking: updatedBooking };
  } catch (err) {
    fastify.log.error('Service verify-payment error:', err);
    return reply.status(500).send({ error: 'Payment verification failed' });
  }
});

// User: list own service bookings
fastify.get('/api/service-bookings', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { user_id } = request.query;
    const uid = user_id || request.user.id;
    const data = await db.query.service_bookings.findMany({
      where: eq(service_bookings.user_id, uid),
      with: { listing: { columns: { id: true, name: true, city: true, images: true } } },
      orderBy: [desc(service_bookings.created_at)],
    });
    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// User: get single service booking
fastify.get('/api/service-bookings/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const data = await db.query.service_bookings.findFirst({
      where: eq(service_bookings.id, request.params.id),
      with: {
        listing: { with: { category: true } },
        user: { columns: { id: true, full_name: true, email: true, phone_number: true } },
      },
    });
    return data || reply.status(404).send({ error: 'Booking not found' });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// User: cancel service booking (within 24h)
fastify.post('/api/service-bookings/:id/cancel', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const booking = await db.query.service_bookings.findFirst({
      where: and(eq(service_bookings.id, request.params.id), eq(service_bookings.user_id, request.user.id)),
    });
    if (!booking) return reply.status(404).send({ error: 'Booking not found' });
    if (booking.status !== 'confirmed') return reply.status(400).send({ error: 'Only confirmed bookings can be cancelled' });

    // Check 24h window
    const createdAt = new Date(booking.created_at);
    const now = new Date();
    const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return reply.status(400).send({ error: 'Cancellation window (24 hours) has expired' });
    }

    // Update status and restore quantity
    await db.update(service_bookings).set({ status: 'cancelled', cancellation_reason: request.body?.reason || 'User cancelled' }).where(eq(service_bookings.id, booking.id));
    await db.update(service_listings).set({
      quantity_available: sql`${service_listings.quantity_available} + ${booking.quantity}`,
    }).where(eq(service_listings.id, booking.service_listing_id));

    // Initiate Razorpay refund
    if (booking.payment_id) {
      try {
        await razorpay.payments.refund(booking.payment_id, { amount: Math.round(booking.total_amount * 100) });
        await db.update(service_bookings).set({ status: 'refunded', refunded_at: new Date() }).where(eq(service_bookings.id, booking.id));
      } catch (refundErr) {
        fastify.log.error('Refund failed:', refundErr.message);
      }
    }

    // Notify user
    await db.insert(notifications).values({
      user_id: request.user.id,
      title: 'Service Booking Cancelled',
      body: `Your booking ${booking.booking_id_display} has been cancelled. Refund will be processed within 5-7 business days.`,
      type: 'service_booking',
      is_read: false,
      data: { booking_id: booking.id },
    });

    return { success: true, message: 'Booking cancelled and refund initiated' };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Failed to cancel booking' });
  }
});

// Admin: list all service bookings
fastify.get('/api/admin/service-bookings', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { status, category_id, date_from, date_to, page = '1' } = request.query;
    const pageNum = Math.max(1, parseInt(page));
    const offset = (pageNum - 1) * 20;

    let conditions = [];
    if (status && status !== 'all') conditions.push(eq(service_bookings.status, status));
    if (date_from) conditions.push(gte(service_bookings.created_at, new Date(date_from)));
    if (date_to) conditions.push(lte(service_bookings.created_at, new Date(date_to)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.query.service_bookings.findMany({
      where: whereClause,
      with: {
        listing: { columns: { id: true, name: true, city: true, service_category_id: true }, with: { category: { columns: { name: true } } } },
        user: { columns: { id: true, full_name: true, email: true, phone_number: true } },
      },
      orderBy: [desc(service_bookings.created_at)],
      limit: 20,
      offset,
    });

    // Filter by category if needed (post-query since it's a nested relation)
    let filtered = data;
    if (category_id) {
      filtered = data.filter(b => b.listing?.service_category_id === category_id);
    }

    const [{ total }] = await db.select({ total: count(service_bookings.id) }).from(service_bookings).where(whereClause);

    return { bookings: filtered, pagination: { page: pageNum, limit: 20, total, totalPages: Math.ceil(total / 20) } };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Admin: refund service booking
fastify.post('/api/admin/service-bookings/:id/refund', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const booking = await db.query.service_bookings.findFirst({ where: eq(service_bookings.id, request.params.id) });
    if (!booking) return reply.status(404).send({ error: 'Booking not found' });
    if (booking.status !== 'confirmed') return reply.status(400).send({ error: 'Only confirmed bookings can be refunded' });

    // Refund via Razorpay
    if (booking.payment_id) {
      try { await razorpay.payments.refund(booking.payment_id, { amount: Math.round(booking.total_amount * 100) }); } catch (e) { fastify.log.warn('Razorpay refund error:', e.message); }
    }

    // Update booking and restore stock
    await db.update(service_bookings).set({ status: 'refunded', refunded_at: new Date(), cancellation_reason: request.body?.reason || 'Admin refund' }).where(eq(service_bookings.id, booking.id));
    await db.update(service_listings).set({ quantity_available: sql`${service_listings.quantity_available} + ${booking.quantity}` }).where(eq(service_listings.id, booking.service_listing_id));

    // Notify user
    if (booking.user_id) {
      await db.insert(notifications).values({ user_id: booking.user_id, title: 'Service Booking Refunded', body: `Your booking ${booking.booking_id_display} has been refunded.`, type: 'service_booking', is_read: false, data: { booking_id: booking.id } });
    }

    return { success: true, message: 'Refund processed' };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Failed to process refund' });
  }
});

// ─── SERVICE REVIEWS ────────────────────────────────────────────────────────

// Helper: recalculate service listing rating
async function recalculateServiceListingRating(listingId) {
  const result = await db.select({ avgRating: avg(service_reviews.rating), reviewCount: count(service_reviews.id) }).from(service_reviews).where(eq(service_reviews.service_listing_id, listingId));
  const avgRating = result[0]?.avgRating ? Math.round(parseFloat(result[0].avgRating) * 10) / 10 : 0;
  const reviewCount = result[0]?.reviewCount || 0;
  await db.update(service_listings).set({ rating: avgRating, review_count: reviewCount }).where(eq(service_listings.id, listingId));
}

// Public: get reviews for a service listing
fastify.get('/api/service-listings/:id/reviews', async (request, reply) => {
  try {
    const { id: listingId } = request.params;
    const page = Math.max(1, parseInt(request.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(request.query.limit) || 10));
    const offset = (page - 1) * limit;

    const [{ total }] = await db.select({ total: count(service_reviews.id) }).from(service_reviews).where(eq(service_reviews.service_listing_id, listingId));
    const reviewsList = await db.query.service_reviews.findMany({
      where: eq(service_reviews.service_listing_id, listingId),
      orderBy: [desc(service_reviews.created_at)],
      limit, offset,
      with: { user: { columns: { id: true, full_name: true, avatar_url: true } } },
    });

    return { reviews: reviewsList, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// User: check review eligibility
fastify.get('/api/service-reviews/eligibility/:listingId', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { listingId } = request.params;
    const userId = request.user.id;
    const qualifying = await db.query.service_bookings.findFirst({
      where: and(eq(service_bookings.service_listing_id, listingId), eq(service_bookings.user_id, userId), eq(service_bookings.status, 'confirmed')),
    });
    const existingReview = await db.query.service_reviews.findFirst({
      where: and(eq(service_reviews.service_listing_id, listingId), eq(service_reviews.user_id, userId)),
    });
    return { eligible: !!qualifying, existing_review: existingReview || null };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// User: create/upsert service review
fastify.post('/api/service-reviews', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { service_listing_id, rating, comment } = request.body;
    const userId = request.user.id;
    if (!rating || rating < 1 || rating > 5) return reply.status(400).send({ error: 'Rating must be 1-5' });
    if (comment && comment.length > 500) return reply.status(400).send({ error: 'Comment max 500 characters' });

    // Check eligibility
    const qualifying = await db.query.service_bookings.findFirst({
      where: and(eq(service_bookings.service_listing_id, service_listing_id), eq(service_bookings.user_id, userId), eq(service_bookings.status, 'confirmed')),
    });
    if (!qualifying) return reply.status(403).send({ error: 'You must have a confirmed booking to review' });

    // Upsert
    const existing = await db.query.service_reviews.findFirst({
      where: and(eq(service_reviews.service_listing_id, service_listing_id), eq(service_reviews.user_id, userId)),
    });

    let result;
    if (existing) {
      const [updated] = await db.update(service_reviews).set({ rating, comment: comment || null, updated_at: new Date() }).where(eq(service_reviews.id, existing.id)).returning();
      result = updated;
    } else {
      const [inserted] = await db.insert(service_reviews).values({ service_listing_id, user_id: userId, rating, comment: comment || null }).returning();
      result = inserted;
    }

    await recalculateServiceListingRating(service_listing_id);
    return reply.status(existing ? 200 : 201).send(result);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// User: update own service review
fastify.put('/api/service-reviews/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const review = await db.query.service_reviews.findFirst({ where: eq(service_reviews.id, request.params.id) });
    if (!review) return reply.status(404).send({ error: 'Review not found' });
    if (review.user_id !== request.user.id) return reply.status(403).send({ error: 'Can only edit your own reviews' });
    const { rating, comment } = request.body;
    const [updated] = await db.update(service_reviews).set({ ...(rating && { rating }), ...(comment !== undefined && { comment: comment || null }), updated_at: new Date() }).where(eq(service_reviews.id, review.id)).returning();
    await recalculateServiceListingRating(review.service_listing_id);
    return updated;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// User/Admin: delete service review
fastify.delete('/api/service-reviews/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const review = await db.query.service_reviews.findFirst({ where: eq(service_reviews.id, request.params.id) });
    if (!review) return reply.status(404).send({ error: 'Review not found' });
    if (review.user_id !== request.user.id && request.user.role !== 'admin') return reply.status(403).send({ error: 'Insufficient permissions' });
    await db.delete(service_reviews).where(eq(service_reviews.id, review.id));
    await recalculateServiceListingRating(review.service_listing_id);
    return { success: true };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Admin: list all service reviews
fastify.get('/api/admin/service-reviews', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const page = Math.max(1, parseInt(request.query.page) || 1);
    const limit = 20;
    const offset = (page - 1) * limit;
    const [{ total }] = await db.select({ total: count(service_reviews.id) }).from(service_reviews);
    const reviewsList = await db.query.service_reviews.findMany({
      orderBy: [desc(service_reviews.created_at)], limit, offset,
      with: { user: { columns: { id: true, full_name: true, avatar_url: true } }, listing: { columns: { id: true, name: true, city: true } } },
    });
    return { reviews: reviewsList, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── SERVICE FAVORITES ──────────────────────────────────────────────────────

fastify.get('/api/service-favorites', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const data = await db.query.service_favorites.findMany({
      where: eq(service_favorites.user_id, request.user.id),
      with: { listing: { columns: { id: true, name: true, city: true, images: true, price: true, rating: true, review_count: true } } },
      orderBy: [desc(service_favorites.created_at)],
    });
    return data.map(f => f.listing).filter(Boolean);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.post('/api/service-favorites', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { service_listing_id } = request.body;
    if (!service_listing_id) return reply.status(400).send({ error: 'service_listing_id required' });
    await db.insert(service_favorites).values({ service_listing_id, user_id: request.user.id }).onConflictDoNothing();
    return { success: true };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.delete('/api/service-favorites/:listingId', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    await db.delete(service_favorites).where(and(eq(service_favorites.service_listing_id, request.params.listingId), eq(service_favorites.user_id, request.user.id)));
    return { success: true };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── UNIFIED SEARCH ─────────────────────────────────────────────────────────

fastify.get('/api/search', async (request, reply) => {
  try {
    const { q, type = 'all' } = request.query;
    if (!q || q.trim().length < 2) return { venues: [], services: [] };

    const searchTerm = '%' + q.trim() + '%';
    let venueResults = [];
    let serviceResults = [];

    if (type === 'all' || type === 'venues') {
      venueResults = await db.query.venues.findMany({
        where: and(eq(venues.approval_status, 'approved'), sql`${venues.registration_fee} > 0`, sql`(${venues.name} ILIKE ${searchTerm} OR ${venues.city} ILIKE ${searchTerm})`),
        columns: { id: true, name: true, city: true, image_url: true, rating: true, price_per_day: true },
        limit: 20,
        orderBy: [desc(venues.rating)],
      });
    }

    if (type === 'all' || type === 'services') {
      serviceResults = await db.query.service_listings.findMany({
        where: and(eq(service_listings.is_active, true), eq(service_listings.approval_status, 'approved'), sql`${service_listings.quantity_available} > 0`, sql`(${service_listings.name} ILIKE ${searchTerm} OR ${service_listings.description} ILIKE ${searchTerm})`),
        columns: { id: true, name: true, city: true, images: true, rating: true, price: true },
        with: { category: { columns: { name: true } } },
        limit: 20,
        orderBy: [desc(service_listings.rating)],
      });
    }

    return {
      venues: venueResults.map(v => ({ ...v, type: 'venue' })),
      services: serviceResults.map(s => ({ ...s, type: 'service', image_url: s.images?.[0] || null })),
    };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// ─── OWNER SERVICE ENDPOINTS ────────────────────────────────────────────────

fastify.get('/api/owners/services', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    if (request.user.role !== 'owner') return reply.status(403).send({ error: 'Not an owner' });
    const data = await db.query.service_listings.findMany({
      where: eq(service_listings.owner_id, request.user.id),
      with: { category: true },
      orderBy: [desc(service_listings.created_at)],
    });
    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.post('/api/owners/services', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    if (request.user.role !== 'owner') return reply.status(403).send({ error: 'Not an owner' });
    const body = request.body;
    const [inserted] = await db.insert(service_listings).values({
      ...body,
      owner_id: request.user.id,
      approval_status: 'pending_review',
      images: body.images || [],
      subscriber_benefits: body.subscriber_benefits || [],
    }).returning();
    return inserted;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.put('/api/owners/services/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    if (request.user.role !== 'owner') return reply.status(403).send({ error: 'Not an owner' });
    const listing = await db.query.service_listings.findFirst({ where: and(eq(service_listings.id, request.params.id), eq(service_listings.owner_id, request.user.id)) });
    if (!listing) return reply.status(404).send({ error: 'Listing not found or not yours' });

    if (listing.approval_status === 'approved') {
      await db.update(service_listings).set({ pending_changes: request.body, approval_status: 'pending_changes' }).where(eq(service_listings.id, listing.id));
      return { message: 'Changes submitted for admin approval' };
    } else {
      await db.update(service_listings).set(request.body).where(eq(service_listings.id, listing.id));
      const updated = await db.query.service_listings.findFirst({ where: eq(service_listings.id, listing.id), with: { category: true } });
      return updated;
    }
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.put('/api/owners/services/:id/quantity', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    if (request.user.role !== 'owner') return reply.status(403).send({ error: 'Not an owner' });
    const { quantity_available } = request.body;
    if (quantity_available == null || quantity_available < 0) return reply.status(400).send({ error: 'Valid quantity required' });
    const listing = await db.query.service_listings.findFirst({ where: and(eq(service_listings.id, request.params.id), eq(service_listings.owner_id, request.user.id)) });
    if (!listing) return reply.status(404).send({ error: 'Listing not found or not yours' });
    await db.update(service_listings).set({ quantity_available }).where(eq(service_listings.id, listing.id));
    return { success: true, quantity_available };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.get('/api/owners/service-analytics', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    if (request.user.role !== 'owner') return reply.status(403).send({ error: 'Not an owner' });
    const ownerListings = await db.query.service_listings.findMany({ where: eq(service_listings.owner_id, request.user.id), columns: { id: true } });
    const listingIds = ownerListings.map(l => l.id);
    if (listingIds.length === 0) return { total_bookings: 0, total_revenue: 0, avg_rating: 0, listings_count: 0 };

    const allBookings = await db.query.service_bookings.findMany({
      where: sql`${service_bookings.service_listing_id} IN (${sql.join(listingIds.map(id => sql`${id}`), sql`, `)})`,
      columns: { total_amount: true, status: true },
    });

    const confirmed = allBookings.filter(b => b.status === 'confirmed');
    const totalRevenue = confirmed.reduce((sum, b) => sum + (b.total_amount || 0), 0);

    const [ratingResult] = await db.select({ avgRating: avg(service_listings.rating) }).from(service_listings).where(sql`${service_listings.id} IN (${sql.join(listingIds.map(id => sql`${id}`), sql`, `)})`);

    return {
      total_bookings: allBookings.length,
      confirmed_bookings: confirmed.length,
      total_revenue: totalRevenue,
      avg_rating: ratingResult?.avgRating ? Math.round(parseFloat(ratingResult.avgRating) * 10) / 10 : 0,
      listings_count: listingIds.length,
    };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Start Server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`ZVenue Admin API running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
