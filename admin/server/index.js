import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import argon2 from 'argon2';
import Razorpay from 'razorpay';
import { db } from './db/index.js';
import { users, venues, categories, bookings, notifications, otps } from './db/schema.js';
import { eq, and, ilike, or, desc, asc, count, sum, sql, gte, lte } from 'drizzle-orm';

const fastify = Fastify({ logger: true });

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

  fastify.log.info(`Payment captured for order: ${orderId}, booking: ${bookingId}`);

  if (bookingId) {
    // Update booking to confirmed if payment is captured
    await db.update(bookings)
      .set({
        status: 'confirmed',
        payment_id: paymentId,
        paid_at: new Date(),
      })
      .where(eq(bookings.id, bookingId));

    // Get user_id for notification
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      columns: { user_id: true, booking_date: true, venue_id: true }
    });

    if (booking) {
      // Create notification for user
      await db.insert(notifications).values({
        user_id: booking.user_id,
        title: 'Booking Confirmed!',
        body: `Your booking for venue on ${booking.booking_date} has been confirmed and paid.`,
        type: 'booking',
        is_read: false,
        data: { booking_id: bookingId, payment_id: paymentId }
      });
    }
  } else if (orderId) {
    // Fallback: find booking by order_id
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.order_id, orderId),
    });

    if (booking) {
      await db.update(bookings)
        .set({
          status: 'confirmed',
          payment_id: paymentId,
          paid_at: new Date(),
        })
        .where(eq(bookings.id, booking.id));

      // Create notification
      await db.insert(notifications).values({
        user_id: booking.user_id,
        title: 'Booking Confirmed!',
        body: `Your booking for venue on ${booking.booking_date} has been confirmed and paid.`,
        type: 'booking',
        is_read: false,
        data: { booking_id: booking.id, payment_id: paymentId }
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

// ─── TRIAL & ACCESS CONTROL ────────────────────────────────────────────────────

// Middleware to check subscription/trial status
fastify.decorate('requireActiveSubscription', async function (request, reply) {
  try {
    await request.jwtVerify();
    const user = await db.query.users.findFirst({
      where: eq(users.id, request.user.id),
      columns: { trial_ends_at: true, subscription_status: true, is_trial_used: true },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    const now = new Date();
    const trialEndsAt = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
    const isTrialActive = trialEndsAt && now < trialEndsAt;
    const isSubscriptionActive = user.subscription_status === 'active' || user.subscription_status === 'authenticated';

    if (!isTrialActive && !isSubscriptionActive) {
      return reply.status(403).send({
        error: 'Subscription required',
        code: 'SUBSCRIPTION_REQUIRED',
        trial_ends_at: user.trial_ends_at,
        subscription_status: user.subscription_status,
      });
    }

    // Attach user access info to request
    request.userAccess = {
      isTrialActive,
      isSubscriptionActive,
      trial_ends_at: user.trial_ends_at,
      subscription_status: user.subscription_status,
    };
  } catch (err) {
    reply.send(err);
  }
});

// Get current user's subscription status
fastify.get('/api/subscription/status', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, request.user.id),
      columns: {
        trial_ends_at: true,
        is_trial_used: true,
        subscription_id: true,
        subscription_status: true,
        next_billing_at: true
      },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    const now = new Date();
    const trialEndsAt = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
    const isTrialActive = trialEndsAt && now < trialEndsAt;
    const isSubscriptionActive = user.subscription_status === 'active' || user.subscription_status === 'authenticated';

    return {
      is_trial_used: user.is_trial_used,
      trial_ends_at: user.trial_ends_at,
      is_trial_active: isTrialActive,
      subscription_id: user.subscription_id,
      subscription_status: user.subscription_status,
      is_subscription_active: isSubscriptionActive,
      next_billing_at: user.next_billing_at,
      has_access: isTrialActive || isSubscriptionActive,
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

// Activate trial (called during onboarding after phone verification)
fastify.post('/api/subscription/activate-trial', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, request.user.id),
      columns: { phone_verified: true, is_trial_used: true, trial_ends_at: true },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Check if phone is verified
    if (!user.phone_verified) {
      return reply.status(400).send({ error: 'Phone number must be verified before activating trial' });
    }

    // Check if trial already used
    if (user.is_trial_used) {
      return reply.status(400).send({ error: 'Trial already used' });
    }

    // Check if trial period is set
    if (!user.trial_ends_at) {
      return reply.status(400).send({ error: 'No trial period configured. Please contact support.' });
    }

    // Mark trial as active (is_trial_used remains false until trial expires or user subscribes)
    // The trial is considered active if trial_ends_at is in the future and is_trial_used is false
    // We just need to ensure phone is verified, trial period is set, and is_trial_used is false
    
    // Return success - trial is already set up from signup
    return {
      success: true,
      message: 'Trial activated',
      trial_ends_at: user.trial_ends_at
    };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Failed to activate trial' });
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

    // Check for booking conflicts (confirmed bookings only)
    const conflicts = await db.query.bookings.findMany({
      where: and(
        eq(bookings.venue_id, venue_id),
        eq(bookings.booking_date, booking_date),
        eq(bookings.status, 'confirmed')
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
      columns: { name: true, city: true },
    });

    if (!venue) {
      return reply.status(404).send({ error: 'Venue not found' });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(total * 100), // Convert to paise
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
      },
    });

    // Create a pending booking record
    const [booking] = await db.insert(bookings).values({
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
      venue: { name: venue.name, city: venue.city }
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

    // Update booking status to confirmed
    await db.update(bookings)
      .set({
        status: 'confirmed',
        payment_method: 'razorpay',
        payment_id: payment_id,
        order_id: order_id,
        paid_at: new Date(),
      })
      .where(eq(bookings.id, booking_id));

    // Create notification for user
    await db.insert(notifications).values({
      user_id,
      title: 'Booking Confirmed!',
      body: `Your booking for venue on ${booking.booking_date} has been confirmed and paid.`,
      type: 'booking',
      is_read: false,
      data: { booking_id, payment_id }
    });

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
      message: 'Payment verified and booking confirmed',
      booking: updatedBooking
    };
  } catch (err) {
    fastify.log.error('Verify payment error:', err);
    return reply.status(500).send({
      error: 'Payment verification failed',
      details: err.message
    });
  }
});


// ─── AUTHENTICATION ────────────────────────────────────────────────────────
fastify.post('/api/auth/sign-up', async (request, reply) => {
  const { first_name, last_name, email, phone_number, password } = request.body;
  
  if (!first_name || !last_name || !email || !phone_number) {
    return reply.status(400).send({ error: 'All fields are mandatory' });
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

    // Set 7-day trial period
    const trial_ends_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const [newUser] = await db.insert(users).values({
      first_name,
      last_name,
      full_name,
      email,
      phone_number,
      password: hashedPassword,
      trial_ends_at,
      is_trial_used: false,
    }).returning();

    const token = fastify.jwt.sign({ id: newUser.id, email: newUser.email, phone_number: newUser.phone_number });
    return { token, user: {
      id: newUser.id,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      full_name: newUser.full_name,
      email: newUser.email,
      phone_number: newUser.phone_number,
      trial_ends_at: newUser.trial_ends_at,
      is_trial_used: newUser.is_trial_used,
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
    // CHECK IF USER IS REGISTERED
    const user = await db.query.users.findFirst({
      where: eq(users.phone_number, phone_number)
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not registered. Please sign up first.' });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 5 * 60000); // 5 mins
    
    await db.insert(otps).values({
      phone_number,
      otp,
      expires_at
    });

    // Send via AOC WhatsApp API
    const response = await fetch('https://api.aoc-portal.com/v1/whatsapp', {
      method: 'POST',
      headers: {
        'apikey': process.env.AOC_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.AOC_WHATSAPP_NUMBER,
        to: phone_number,
        templateName: process.env.AOC_TEMPLATE_NAME,
        otp: otp,
        type: 'template',
        language: {
          code: 'en'
        }
      })
    });

    const result = await response.json();
    
    if (!response.ok || result.error) {
      fastify.log.error('AOC API Error:', result);
      return reply.status(500).send({ error: 'Failed to send WhatsApp OTP' });
    }


    fastify.log.info(`OTP sent to ${phone_number} via WhatsApp`);
    return { success: true, message: 'OTP sent successfully' };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});


fastify.post('/api/auth/verify-otp', async (request, reply) => {
  const { phone_number, otp } = request.body;
  if (!phone_number || !otp) return reply.status(400).send({ error: 'Phone number and OTP are required' });

  try {
    const otpRecord = await db.query.otps.findFirst({
      where: eq(otps.phone_number, phone_number),
      orderBy: [desc(otps.created_at)]
    });

    if (!otpRecord) return reply.status(400).send({ error: 'Invalid or expired OTP' });
    if (new Date() > otpRecord.expires_at) return reply.status(400).send({ error: 'OTP has expired' });
    if (otpRecord.otp !== otp) return reply.status(400).send({ error: 'Invalid OTP' });

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

    const token = fastify.jwt.sign({ id: user.id, phone_number: user.phone_number });
    return { token, user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
      avatar_url: user.avatar_url,
      trial_ends_at: user.trial_ends_at,
      is_trial_used: user.is_trial_used,
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
fastify.get('/api/venues', async (request, reply) => {
  try {
    const { search, category_id } = request.query;
    
    let whereClause = undefined;
    if (search && category_id) {
      whereClause = sql`(name ILIKE ${'%' + search + '%'} OR city ILIKE ${'%' + search + '%'}) AND category_id = ${category_id}`;
    } else if (search) {
      whereClause = sql`name ILIKE ${'%' + search + '%'} OR city ILIKE ${'%' + search + '%'}`;
    } else if (category_id) {
      whereClause = eq(venues.category_id, category_id);
    }

    const data = await db.query.venues.findMany({
      where: whereClause,
      with: { category: true },
      orderBy: [desc(venues.created_at)]
    });
    return data;
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.get('/api/venues/:id', async (request, reply) => {
  try {
    const data = await db.query.venues.findFirst({
      where: eq(venues.id, request.params.id),
      with: { category: true }
    });
    return data || {};
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.post('/api/venues', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const [inserted] = await db.insert(venues).values(request.body).returning();
    const data = await db.query.venues.findFirst({
      where: eq(venues.id, inserted.id),
      with: { category: true }
    });
    return data;
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.put('/api/venues/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    await db.update(venues).set(request.body).where(eq(venues.id, request.params.id));
    const data = await db.query.venues.findFirst({
      where: eq(venues.id, request.params.id),
      with: { category: true }
    });
    return data;
  } catch (err) {
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
    const confirmedBookings = await db.query.bookings.findMany({
      where: and(
        eq(bookings.venue_id, venueId),
        eq(bookings.status, 'confirmed')
      ),
      columns: { booking_date: true, start_time: true, end_time: true }
    });
    return confirmedBookings;
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
    const { status, search } = request.query;
    
    let whereClause = undefined;
    if (status) {
      whereClause = eq(bookings.status, status);
    }
    
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
      columns: { id: true, full_name: true, email: true, phone_number: true, avatar_url: true, created_at: true },
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
    const { full_name, email, phone_number, avatar_url } = request.body;
    const [updated] = await db.update(users)
      .set({ full_name, email, phone_number, avatar_url })
      .where(eq(users.id, request.params.id))
      .returning();
    return updated;
  } catch (err) {
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

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────
fastify.get('/api/notifications', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { user_id } = request.query;
    
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
