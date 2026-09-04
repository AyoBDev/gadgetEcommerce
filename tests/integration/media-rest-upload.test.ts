import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPayloadClient } from '@/lib/payload';

/**
 * Exercises the REST endpoint the admin UI actually posts to.
 *
 * Payload's REST API reads document fields from a JSON string in `_payload`;
 * sibling multipart fields are ignored and surface as
 * "The following field is invalid: Alt". The Local API takes a plain object,
 * so unit/Local-API tests do NOT cover this — hence the HTTP-level test.
 */
const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';
const EMAIL = 'media-rest-test@jaysmart.local';
const PASSWORD = 'MediaRestTest-' + Math.random().toString(36).slice(2, 12);

// A minimal valid 8x8 PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAgMAAAAPn2FeAAAADFBMVEX/AIj/AIj/AIj/AIhwyPplAAAAAXRSTlMAQObYZgAAABJJREFUCNdjYGBgYGRgYGBgAAAAFAAB1a1DWgAAAABJRU5ErkJggg==',
  'base64',
);

let cookie = '';
let userId: number | string | null = null;
const uploaded: (number | string)[] = [];

async function serverUp() {
  try {
    const r = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
    return r.ok;
  } catch {
    return false;
  }
}

beforeAll(async () => {
  if (!(await serverUp())) return;
  const payload = await getPayloadClient();
  const created = await payload.create({
    collection: 'users',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { email: EMAIL, password: PASSWORD, name: 'Media REST Test', role: 'admin' } as any,
  });
  userId = created.id;
  const res = await fetch(`${BASE}/api/users/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  cookie = (res.headers.get('set-cookie') ?? '').split(';')[0] ?? '';
});

afterAll(async () => {
  const payload = await getPayloadClient();
  for (const id of uploaded) {
    await payload.delete({ collection: 'media', id }).catch(() => {});
  }
  if (userId != null) {
    await payload.delete({ collection: 'users', id: userId }).catch(() => {});
  }
});

async function upload(form: FormData) {
  return fetch(`${BASE}/api/media`, { method: 'POST', headers: { cookie }, body: form });
}

describe('media REST upload', () => {
  it('accepts fields sent in _payload (the shape the admin UI posts)', async () => {
    if (!(await serverUp())) return;
    const form = new FormData();
    form.append('file', new Blob([PNG], { type: 'image/png' }), 'rest-test.png');
    form.append('_payload', JSON.stringify({ alt: 'rest test alt' }));

    const res = await upload(form);
    const json = await res.json();
    expect(res.status).toBe(201);
    const doc = json.doc ?? json;
    expect(doc.alt).toBe('rest test alt');
    uploaded.push(doc.id);
  });

  it('rejects fields sent as sibling form parts — the regression this guards', async () => {
    if (!(await serverUp())) return;
    const form = new FormData();
    form.append('file', new Blob([PNG], { type: 'image/png' }), 'rest-test-2.png');
    form.append('alt', 'ignored when not in _payload');

    const res = await upload(form);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(JSON.stringify(json)).toMatch(/alt/i);
  });
});
