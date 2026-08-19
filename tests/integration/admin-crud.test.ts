import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPayloadClient } from '@/lib/payload';

const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';
const email = `admin-crud-${Date.now()}@jaysmart.ng`;
const password = 'Strong-Pass-1234';

let cookieHeader = '';
let userId: number | undefined;

beforeAll(async () => {
  const payload = await getPayloadClient();
  const user = await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: {
      name: 'Admin CRUD Test',
      email,
      password,
      role: 'admin',
    } as never,
  });
  userId = user.id as number;

  const res = await fetch(`${base}/api/users/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  expect(res.status).toBe(200);
  const token = (res.headers.get('set-cookie') ?? '').match(/payload-token=([^;]+)/)?.[1];
  expect(token).toBeTruthy();
  cookieHeader = `payload-token=${token}`;
});

afterAll(async () => {
  if (userId) {
    const payload = await getPayloadClient();
    await payload.delete({ collection: 'users', overrideAccess: true, id: String(userId) });
  }
});

function authed(path: string, init?: RequestInit) {
  return fetch(`${base}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', cookie: cookieHeader, ...(init?.headers ?? {}) },
  });
}

describe('Admin phase-2 CRUD via REST', () => {
  it('creates, edits and deletes an order (record-a-sale flow)', async () => {
    const payload = await getPayloadClient();
    const laptopRes = await authed('/api/laptops', {
      method: 'POST',
      body: JSON.stringify({
        title: `Order test laptop ${Date.now()}`,
        brand: 60,
        price: 10_000_000,
        condition: 'grade-a',
        status: 'draft',
      }),
    });
    expect(laptopRes.status).toBe(201);
    const laptopDoc = await laptopRes.json();
    const laptopId = laptopDoc.doc.id;
    try {
      const create = await authed('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          laptop: laptopId,
          salePrice: 9_500_000,
          buyerName: 'CRUD Buyer',
          buyerPhone: '0800',
          paymentStatus: 'pending',
          deliveryStatus: 'pending',
        }),
      });
      expect(create.status).toBe(201);
      const doc = await create.json();

      const orderLabel = await payload.findByID({ collection: 'orders', id: doc.doc.id });
      expect(orderLabel.orderLabel).toBeTruthy();

      const patch = await authed(`/api/orders/${doc.doc.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus: 'paid', deliveryStatus: 'delivered' }),
      });
      expect(patch.status).toBe(200);
      const after = await payload.findByID({ collection: 'orders', id: doc.doc.id });
      expect(after.paymentStatus).toBe('paid');
      expect(after.deliveryStatus).toBe('delivered');

      const del = await authed(`/api/orders/${doc.doc.id}`, { method: 'DELETE' });
      expect(del.status).toBe(200);
    } finally {
      await payload.delete({ collection: 'laptops', id: laptopId });
    }
  });

  it('creates and updates a user with a role', async () => {
    const unique = Date.now();
    const create = await authed('/api/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Staff Person',
        email: `staff-${unique}@jaysmart.ng`,
        password: 'Staff-Pass-1234',
        role: 'staff',
      }),
    });
    expect(create.status).toBe(201);
    const doc = await create.json();
    try {
      const patch = await authed(`/api/users/${doc.doc.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: 'admin', name: 'Staff Person Renamed' }),
      });
      expect(patch.status).toBe(200);
      const payload = await getPayloadClient();
      const after = await payload.findByID({ collection: 'users', id: doc.doc.id });
      expect(after.role).toBe('admin');
      expect(after.name).toBe('Staff Person Renamed');
    } finally {
      const payload = await getPayloadClient();
      await payload.delete({ collection: 'users', overrideAccess: true, id: doc.doc.id });
    }
  });

  it('creates a category with auto-generated slug and edits it', async () => {
    const unique = Date.now();
    const create = await authed('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name: `CRUD Category ${unique}`, type: 'useCase' }),
    });
    expect(create.status).toBe(201);
    const doc = await create.json();
    try {
      expect(doc.doc.slug).toBeTruthy();

      const patch = await authed(`/api/categories/${doc.doc.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ type: 'brand' }),
      });
      expect(patch.status).toBe(200);
      const payload = await getPayloadClient();
      const after = await payload.findByID({ collection: 'categories', id: doc.doc.id });
      expect(after.type).toBe('brand');
    } finally {
      const payload = await getPayloadClient();
      await payload.delete({ collection: 'categories', id: doc.doc.id });
    }
  });

  it('creates, toggles and deletes an add-on', async () => {
    const create = await authed('/api/addons', {
      method: 'POST',
      body: JSON.stringify({ name: 'CRUD Addon', price: 500_000, icon: 'mouse', active: true }),
    });
    expect(create.status).toBe(201);
    const doc = await create.json();
    try {
      const patch = await authed(`/api/addons/${doc.doc.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: false }),
      });
      expect(patch.status).toBe(200);
      const payload = await getPayloadClient();
      const after = await payload.findByID({ collection: 'addons', id: doc.doc.id });
      expect(after.active).toBe(false);

      const del = await authed(`/api/addons/${doc.doc.id}`, { method: 'DELETE' });
      expect(del.status).toBe(200);
    } finally {
      const payload = await getPayloadClient();
      await payload.delete({ collection: 'addons', id: doc.doc.id }).catch(() => undefined);
    }
  });
});