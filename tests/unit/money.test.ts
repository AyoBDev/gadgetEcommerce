import { describe, it, expect } from 'vitest';
import { koboToNaira, nairaToKobo, formatNaira } from '@/lib/money';

describe('money', () => {
  it('converts kobo to naira', () => {
    expect(koboToNaira(35_000_000)).toBe(350_000);
  });

  it('converts naira to kobo', () => {
    expect(nairaToKobo(350_000)).toBe(35_000_000);
  });

  it('formats kobo as Nigerian currency', () => {
    expect(formatNaira(35_000_000)).toBe('₦350,000');
  });

  it('formats zero correctly', () => {
    expect(formatNaira(0)).toBe('₦0');
  });

  it('throws on non-integer kobo', () => {
    expect(() => koboToNaira(1.5)).toThrow();
  });
});
