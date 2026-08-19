import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, _resetRateLimits } from '@/lib/rate-limit';

describe('rateLimit', () => {
  beforeEach(() => _resetRateLimits());
  it('allows up to the limit then blocks', () => {
    const key = 'ip:1';
    for (let i = 0; i < 5; i++) expect(rateLimit(key, { limit: 5, windowMs: 60000 })).toBe(true);
    expect(rateLimit(key, { limit: 5, windowMs: 60000 })).toBe(false);
  });
  it('keys are independent', () => {
    expect(rateLimit('ip:a', { limit: 1 })).toBe(true);
    expect(rateLimit('ip:a', { limit: 1 })).toBe(false);
    expect(rateLimit('ip:b', { limit: 1 })).toBe(true);
  });
});
