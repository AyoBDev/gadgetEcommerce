import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPayloadClient } from '@/lib/payload';
import type { User } from '@/payload-types';

const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';
const email = `admin-login-${Date.now()}@jaysmart.ng`;
const password = 'Strong-Pass-1234';

let userId: number | undefined;

beforeAll(async () => {
  const payload = await getPayloadClient();
  const user = await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: {
      name: 'Admin Login Test',
      email,
      password,
      role: 'admin',
    } as { name: string; email: string; password: string; role: 'admin' },
  });
  userId = user.id as number;
});

afterAll(async () => {
  if (userId) {
    const payload = await getPayloadClient();
    await payload.delete({ collection: 'users', overrideAccess: true, id: String(userId) });
  }
});

describe('Admin login via Payload REST', () => {
  it('POST /api/users/login returns the user and a session cookie', async () => {
    const res = await fetch(`${base}/api/users/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user?.email).toBe(email);
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('payload-token');
  });

  it('rejects wrong credentials with 400', async () => {
    const res = await fetch(`${base}/api/users/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'wrong-password' }),
    });
    expect(res.status).toBe(401);
  });
});