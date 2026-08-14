import { describe, it, expect } from 'vitest';
import {
  MAX_MESSAGE_LEN,
  generateVisitorToken,
  hashVisitorToken,
  tokensMatch,
  sanitizeMessageText,
  buildLaptopSummary,
  isTypingActive,
} from '@/lib/chat';

describe('generateVisitorToken', () => {
  it('returns 64 hex chars and differs each call', () => {
    const a = generateVisitorToken();
    const b = generateVisitorToken();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });
});

describe('hashVisitorToken + tokensMatch', () => {
  it('hash is stable, 64 hex chars, and not the raw token', () => {
    const t = generateVisitorToken();
    const h = hashVisitorToken(t);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).toBe(hashVisitorToken(t));
    expect(h).not.toBe(t);
  });
  it('tokensMatch true only for the matching token', () => {
    const t = generateVisitorToken();
    const h = hashVisitorToken(t);
    expect(tokensMatch(t, h)).toBe(true);
    expect(tokensMatch(generateVisitorToken(), h)).toBe(false);
  });
  it('tokensMatch is false and never throws on missing input', () => {
    const h = hashVisitorToken(generateVisitorToken());
    expect(tokensMatch(undefined, h)).toBe(false);
    expect(tokensMatch('abc', undefined)).toBe(false);
    expect(tokensMatch(undefined, undefined)).toBe(false);
    expect(tokensMatch('short', h)).toBe(false);
  });
});

describe('sanitizeMessageText', () => {
  it('trims, keeps newlines, drops control chars', () => {
    expect(sanitizeMessageText('  hi\nthere  ')).toBe('hi\nthere');
  });
  it('returns empty string for non-strings and blanks', () => {
    expect(sanitizeMessageText(undefined)).toBe('');
    expect(sanitizeMessageText(42)).toBe('');
    expect(sanitizeMessageText('   ')).toBe('');
  });
  it('caps at MAX_MESSAGE_LEN', () => {
    const long = 'a'.repeat(MAX_MESSAGE_LEN + 50);
    expect(sanitizeMessageText(long)).toHaveLength(MAX_MESSAGE_LEN);
  });
});

describe('buildLaptopSummary', () => {
  it('formats title and naira price', () => {
    expect(buildLaptopSummary({ title: 'Dell 7490', price: 28_000_000, url: 'https://x.ng/l/dell' }))
      .toBe('Dell 7490 — ₦280,000');
  });
});

describe('isTypingActive', () => {
  it('true within ttl, false beyond, false for empty', () => {
    expect(isTypingActive(new Date().toISOString(), 5000)).toBe(true);
    expect(isTypingActive(new Date(Date.now() - 10_000).toISOString(), 5000)).toBe(false);
    expect(isTypingActive(undefined)).toBe(false);
    expect(isTypingActive('not-a-date')).toBe(false);
  });
});
