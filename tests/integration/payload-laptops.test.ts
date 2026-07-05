import { describe, it, expect } from 'vitest';
import { getPayloadClient } from '@/lib/payload';

describe('payload accessor', () => {
  it('returns a client with a find method', async () => {
    const payload = await getPayloadClient();
    expect(typeof payload.find).toBe('function');
  });

  it('memoizes the client across calls', async () => {
    const a = await getPayloadClient();
    const b = await getPayloadClient();
    expect(a).toBe(b);
  });
});
