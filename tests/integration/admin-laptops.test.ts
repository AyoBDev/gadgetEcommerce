import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPayloadClient } from '@/lib/payload';

const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';
const email = `admin-laptops-${Date.now()}@jaysmart.ng`;
const password = 'Strong-Pass-1234';

let cookieHeader = '';
let userId: number | undefined;

beforeAll(async () => {
  const payload = await getPayloadClient();
  const user = await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: {
      name: 'Admin Laptops Test',
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
  const setCookie = res.headers.get('set-cookie') ?? '';
  const token = setCookie.match(/payload-token=([^;]+)/)?.[1];
  expect(token).toBeTruthy();
  cookieHeader = `payload-token=${token}`;
});

afterAll(async () => {
  if (userId) {
    const payload = await getPayloadClient();
    await payload.delete({ collection: 'users', overrideAccess: true, id: String(userId) });
  }
});

describe('Admin laptop edit via REST', () => {
  it('creates a laptop then PATCHes it via the REST API', async () => {
    const payload = await getPayloadClient();
    const brand = await payload.create({
      collection: 'categories',
      data: { name: `Brand ${Date.now()}`, type: 'brand' },
    });
    try {
      const create = await fetch(`${base}/api/laptops`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify({
          title: `Admin Laptop ${Date.now()}`,
          brand: brand.id,
          price: 29_000_000,
          condition: 'grade-a',
          status: 'draft',
        }),
      });
      expect(create.status).toBe(201);
      const doc = await create.json();

      const patch = await fetch(`${base}/api/laptops/${doc.doc.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify({ price: 28_000_000, status: 'published' }),
      });
      expect(patch.status).toBe(200);

      const after = await payload.findByID({ collection: 'laptops', id: doc.doc.id });
      expect(after.price).toBe(28_000_000);
      expect(after.status).toBe('published');
      expect(after.publishedAt).toBeTruthy();

      await payload.delete({ collection: 'laptops', id: doc.doc.id });
    } finally {
      await payload.delete({ collection: 'categories', id: brand.id });
    }
  });
});