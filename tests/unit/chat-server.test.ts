import { describe, it, expect, vi } from 'vitest';
import {
  CHAT_COOKIE,
  readOrCreateToken,
  authorizeConversation,
} from '@/lib/chat-server';
import { hashVisitorToken } from '@/lib/chat';

function fakeStore(initial?: string) {
  const bag = new Map<string, string>();
  if (initial) bag.set(CHAT_COOKIE, initial);
  return {
    store: {
      get: (n: string) => (bag.has(n) ? { value: bag.get(n)! } : undefined),
      set: vi.fn((n: string, v: string) => { bag.set(n, v); }),
    },
    bag,
  };
}

describe('readOrCreateToken', () => {
  it('returns existing token without setting cookie', () => {
    const { store } = fakeStore('existing-token');
    const r = readOrCreateToken(store, true);
    expect(r).toEqual({ token: 'existing-token', created: false });
    expect(store.set).not.toHaveBeenCalled();
  });
  it('mints and sets an httpOnly cookie when absent', () => {
    const { store } = fakeStore();
    const r = readOrCreateToken(store, true);
    expect(r.created).toBe(true);
    expect(r.token).toMatch(/^[0-9a-f]{64}$/);
    expect(store.set).toHaveBeenCalledWith(
      CHAT_COOKIE, r.token,
      expect.objectContaining({ httpOnly: true, secure: true, sameSite: 'lax', path: '/' }),
    );
  });
});

describe('authorizeConversation', () => {
  const raw = 'b'.repeat(64);
  const good = { id: 'c1', visitorTokenHash: hashVisitorToken(raw) };
  const payload = { findByID: vi.fn(async () => good) };

  it('returns the conversation when the token matches', async () => {
    expect(await authorizeConversation(payload as any, 'c1', raw)).toEqual(good);
  });
  it('returns null when the token does not match', async () => {
    expect(await authorizeConversation(payload as any, 'c1', 'c'.repeat(64))).toBeNull();
  });
  it('returns null when not found or on throw', async () => {
    expect(await authorizeConversation({ findByID: async () => null } as any, 'x', raw)).toBeNull();
    expect(await authorizeConversation({ findByID: async () => { throw new Error('db'); } } as any, 'x', raw)).toBeNull();
  });
});
