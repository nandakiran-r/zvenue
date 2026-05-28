/**
 * Backend API Integration Tests
 * Run: node --test tests/api.test.js
 * Requires: server running on localhost:3001
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

const BASE = 'http://localhost:3001';

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

describe('Health Check', () => {
  it('GET /health returns ok', async () => {
    const { status, data } = await request('GET', '/health');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.status, 'ok');
    assert.ok(data.uptime >= 0);
    assert.ok(data.timestamp);
  });
});

describe('Public Endpoints', () => {
  it('GET /api/service-categories returns 9 categories', async () => {
    const { status, data } = await request('GET', '/api/service-categories');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.length, 9);
    assert.ok(data[0].name);
    assert.ok(data[0].icon);
  });

  it('GET /api/service-listings returns listings', async () => {
    const { status, data } = await request('GET', '/api/service-listings');
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
    assert.ok(data[0].name);
    assert.ok(data[0].price > 0);
  });

  it('GET /api/venues returns venues', async () => {
    const { status, data } = await request('GET', '/api/venues');
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
  });

  it('GET /api/search returns typed results', async () => {
    const { status, data } = await request('GET', '/api/search?q=Royal');
    assert.strictEqual(status, 200);
    assert.ok(data.venues);
    assert.ok(data.services);
    assert.ok(data.venues.length > 0);
    data.venues.forEach(v => assert.strictEqual(v.type, 'venue'));
    data.services.forEach(s => assert.strictEqual(s.type, 'service'));
  });

  it('GET /api/search with short query returns empty', async () => {
    const { status, data } = await request('GET', '/api/search?q=a');
    assert.strictEqual(status, 200);
    assert.deepStrictEqual(data, { venues: [], services: [] });
  });
});

describe('Auth Endpoints', () => {
  it('POST /api/auth/sign-in with wrong credentials returns 401', async () => {
    const { status, data } = await request('POST', '/api/auth/sign-in', { email: 'wrong@test.com', password: 'wrong' });
    assert.strictEqual(status, 401);
    assert.ok(data.error);
  });

  it('POST /api/auth/send-otp with unregistered phone returns 404', async () => {
    const { status, data } = await request('POST', '/api/auth/send-otp', { phone_number: '+910000000000' });
    assert.strictEqual(status, 404);
    assert.ok(data.error.includes('not registered'));
  });

  it('POST /api/auth/sign-up with invalid email returns 400', async () => {
    const { status, data } = await request('POST', '/api/auth/sign-up', { first_name: 'T', last_name: 'U', email: 'bad', phone_number: '+919999999999' });
    assert.strictEqual(status, 400);
    assert.ok(data.error.includes('email'));
  });
});

describe('Protected Endpoints (no token)', () => {
  it('GET /api/admin/service-bookings returns 401 without token', async () => {
    const { status } = await request('GET', '/api/admin/service-bookings');
    assert.strictEqual(status, 401);
  });

  it('POST /api/service-bookings/create-order returns 401 without token', async () => {
    const { status } = await request('POST', '/api/service-bookings/create-order', { service_listing_id: 'x', quantity: 1 });
    assert.strictEqual(status, 401);
  });

  it('GET /api/service-favorites returns 401 without token', async () => {
    const { status } = await request('GET', '/api/service-favorites');
    assert.strictEqual(status, 401);
  });
});

describe('Password Reset', () => {
  it('POST /api/owners/request-password-reset with unknown email returns 404', async () => {
    const { status, data } = await request('POST', '/api/owners/request-password-reset', { email: 'nobody@test.com' });
    assert.strictEqual(status, 404);
  });

  it('POST /api/admin/request-password-reset with unknown email returns 404', async () => {
    const { status } = await request('POST', '/api/admin/request-password-reset', { email: 'nobody@test.com' });
    assert.strictEqual(status, 404);
  });

  it('POST /api/owners/verify-reset-otp with wrong OTP returns 400', async () => {
    const { status } = await request('POST', '/api/owners/verify-reset-otp', { phone_number: '+919876543210', otp: '000000', new_password: 'newpass123' });
    assert.strictEqual(status, 400);
  });
});

describe('Rate Limiting', () => {
  it('Allows normal request volume', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => request('GET', '/health'))
    );
    results.forEach(r => assert.strictEqual(r.status, 200));
  });
});
