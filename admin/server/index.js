import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import argon2 from 'argon2';
import { db } from './db/index.js';
import { users, venues, categories, bookings, notifications, otps } from './db/schema.js';
import { eq, and, ilike, or, desc, asc, count, sum, sql } from 'drizzle-orm';

const fastify = Fastify({ logger: true });

// Plugins
fastify.register(cors, {
  origin: '*', // For dev
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

    const [newUser] = await db.insert(users).values({
      first_name,
      last_name,
      full_name,
      email,
      phone_number,
      password: hashedPassword
    }).returning();

    const token = fastify.jwt.sign({ id: newUser.id, email: newUser.email, phone_number: newUser.phone_number });
    return { token, user: { id: newUser.id, first_name: newUser.first_name, last_name: newUser.last_name, full_name: newUser.full_name, email: newUser.email, phone_number: newUser.phone_number } };
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

    const token = fastify.jwt.sign({ id: user.id, phone_number: user.phone_number });
    return { token, user: { id: user.id, first_name: user.first_name, last_name: user.last_name, full_name: user.full_name, email: user.email, phone_number: user.phone_number, avatar_url: user.avatar_url } };
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
    
    // Simplification for search: we'll fetch and filter if necessary since relations search in Drizzle can be complex with Postgres ILIKE on joined tables.
    let whereClause = undefined;
    if (status) {
      whereClause = eq(bookings.status, status);
    }
    
    const data = await db.query.bookings.findMany({
      where: whereClause,
      with: {
        venue: { with: { category: true } },
        user: { columns: { full_name: true, email: true, avatar_url: true } }
      },
      orderBy: [desc(bookings.created_at)]
    });

    if (search) {
      const lowerSearch = search.toLowerCase();
      return data.filter(b => b.venue?.name?.toLowerCase().includes(lowerSearch) || b.user?.full_name?.toLowerCase().includes(lowerSearch));
    }

    return data;
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.get('/api/bookings/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    const data = await db.query.bookings.findFirst({
      where: eq(bookings.id, request.params.id),
      with: {
        venue: { with: { category: true } },
        user: true
      }
    });
    return data;
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

fastify.put('/api/bookings/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  try {
    await db.update(bookings).set(request.body).where(eq(bookings.id, request.params.id));
    const data = await db.query.bookings.findFirst({
      where: eq(bookings.id, request.params.id),
      with: {
        venue: { columns: { name: true, city: true, image_url: true } },
        user: { columns: { full_name: true, email: true } }
      }
    });
    return data;
  } catch (err) {
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
      columns: { id: true, full_name: true, email: true, phone_number: true, avatar_url: true, dob: true, created_at: true },
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
    const { full_name, email, phone_number, dob, avatar_url } = request.body;
    const [updated] = await db.update(users)
      .set({ full_name, email, phone_number, dob, avatar_url })
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
