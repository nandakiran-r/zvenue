import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Dashboard Stats ───────────────────────────────────────────────────────
app.get('/api/dashboard/stats', async (_req, res) => {
  try {
    const [
      { count: totalVenues },
      { count: totalBookings },
      { count: totalUsers },
      { count: totalCategories },
      { data: bookings },
      { count: pendingBookings },
      { count: confirmedBookings },
      { count: cancelledBookings },
    ] = await Promise.all([
      supabase.from('venues').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('total'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
    ]);

    const totalRevenue = (bookings || []).reduce((sum, b) => sum + (b.total || 0), 0);
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    res.json({
      totalVenues: totalVenues || 0,
      totalBookings: totalBookings || 0,
      totalUsers: totalUsers || 0,
      totalCategories: totalCategories || 0,
      totalRevenue,
      avgBookingValue,
      pendingBookings: pendingBookings || 0,
      confirmedBookings: confirmedBookings || 0,
      cancelledBookings: cancelledBookings || 0,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Dashboard Recent Bookings ─────────────────────────────────────────────
app.get('/api/dashboard/recent-bookings', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, venue:venues(name, city, image_url), user:users(full_name, email, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Dashboard Revenue by Month ────────────────────────────────────────────
app.get('/api/dashboard/revenue-chart', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('total, created_at')
      .order('created_at', { ascending: true });
    if (error) throw error;

    // Group by month
    const monthly = {};
    (data || []).forEach(b => {
      const month = new Date(b.created_at).toLocaleString('en', { month: 'short', year: 'numeric' });
      monthly[month] = (monthly[month] || 0) + (b.total || 0);
    });

    res.json(Object.entries(monthly).map(([month, revenue]) => ({ month, revenue })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Dashboard Bookings by Category ────────────────────────────────────────
app.get('/api/dashboard/bookings-by-category', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('venue:venues(category:categories(name))');
    if (error) throw error;

    const counts = {};
    (data || []).forEach(b => {
      const catName = b.venue?.category?.name || 'Other';
      counts[catName] = (counts[catName] || 0) + 1;
    });

    res.json(Object.entries(counts).map(([name, count]) => ({ name, count })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Venues CRUD ───────────────────────────────────────────────────────────
app.get('/api/venues', async (req, res) => {
  try {
    let query = supabase.from('venues').select('*, category:categories(*)');
    if (req.query.search) {
      query = query.or(`name.ilike.%${req.query.search}%,city.ilike.%${req.query.search}%`);
    }
    if (req.query.category_id) {
      query = query.eq('category_id', req.query.category_id);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/venues/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('*, category:categories(*)')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/venues', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('venues')
      .insert(req.body)
      .select('*, category:categories(*)')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/venues/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('venues')
      .update(req.body)
      .eq('id', req.params.id)
      .select('*, category:categories(*)')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/venues/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('venues').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Categories CRUD ───────────────────────────────────────────────────────
app.get('/api/categories', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { data, error } = await supabase.from('categories').insert(req.body).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Bookings CRUD ─────────────────────────────────────────────────────────
app.get('/api/bookings', async (req, res) => {
  try {
    let query = supabase
      .from('bookings')
      .select('*, venue:venues(name, city, image_url, category:categories(name)), user:users(full_name, email, avatar_url)');
    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }
    if (req.query.search) {
      // Search by venue name or user name
      query = query.or(`venue.name.ilike.%${req.query.search}%`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bookings/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, venue:venues(*, category:categories(*)), user:users(*)')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/bookings/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update(req.body)
      .eq('id', req.params.id)
      .select('*, venue:venues(name, city, image_url), user:users(full_name, email)')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('bookings').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Users ─────────────────────────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
  try {
    let query = supabase.from('users').select('*');
    if (req.query.search) {
      query = query.or(`full_name.ilike.%${req.query.search}%,email.ilike.%${req.query.search}%`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    // Also get booking count per user
    const userIds = (data || []).map(u => u.id);
    if (userIds.length > 0) {
      const { data: bookingCounts } = await supabase
        .from('bookings')
        .select('user_id');

      const countMap = {};
      (bookingCounts || []).forEach(b => {
        countMap[b.user_id] = (countMap[b.user_id] || 0) + 1;
      });

      const enriched = (data || []).map(u => ({
        ...u,
        booking_count: countMap[u.id] || 0,
      }));
      res.json(enriched);
    } else {
      res.json(data || []);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;

    // Get user's bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, venue:venues(name, city, image_url)')
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false });

    res.json({ ...data, bookings: bookings || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Notifications ─────────────────────────────────────────────────────────
app.get('/api/notifications', async (req, res) => {
  try {
    let query = supabase.from('notifications').select('*, user:users(full_name, email)');
    if (req.query.user_id) {
      query = query.eq('user_id', req.query.user_id);
    }
    const { data, error } = await query.order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(req.body)
      .select('*, user:users(full_name, email)')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/broadcast', async (req, res) => {
  try {
    const { title, body, type } = req.body;
    const { data: users, error: usersError } = await supabase.from('users').select('id');
    if (usersError) throw usersError;

    const notifications = (users || []).map(u => ({
      user_id: u.id,
      title,
      body,
      type: type || 'announcement',
      is_read: false,
      data: {},
    }));

    if (notifications.length > 0) {
      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) throw error;
    }

    res.json({ success: true, count: notifications.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('notifications').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Dashboard: Top Venues ─────────────────────────────────────────────────
app.get('/api/dashboard/top-venues', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('id, name, city, rating, review_count, image_url, category:categories(name)')
      .order('rating', { ascending: false })
      .limit(5);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Dashboard: City Distribution ──────────────────────────────────────────
app.get('/api/dashboard/city-distribution', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('venues').select('city');
    if (error) throw error;

    const counts = {};
    (data || []).forEach(v => {
      const city = v.city || 'Unknown';
      counts[city] = (counts[city] || 0) + 1;
    });

    res.json(Object.entries(counts).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`ZVenue Admin API running on http://localhost:${PORT}`);
});
