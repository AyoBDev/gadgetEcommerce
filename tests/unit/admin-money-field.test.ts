import { describe, it, expect } from 'vitest';
import { koboToNaira, nairaToKobo } from '@/lib/money';

/**
 * The admin forms display money in Naira and store integer kobo. These pin the
 * conversion the `money` field type performs at each edge.
 */
describe('admin money field conversion', () => {
  it('renders stored kobo as Naira for the input', () => {
    expect(koboToNaira(45_000_000)).toBe(450_000);
    expect(koboToNaira(1_500_000)).toBe(15_000);
    expect(koboToNaira(0)).toBe(0);
  });

  it('converts typed Naira back to integer kobo', () => {
    expect(nairaToKobo(450_000)).toBe(45_000_000);
    expect(nairaToKobo(15_000)).toBe(1_500_000);
  });

  it('round-trips without drift', () => {
    for (const kobo of [0, 100, 45_000_000, 92_000_000, 1_500_000]) {
      expect(nairaToKobo(koboToNaira(kobo))).toBe(kobo);
    }
  });

  it('keeps kobo integral for prices with a decimal Naira part', () => {
    // ₦450,000.50 -> 45,000,050 kobo, not a float.
    expect(nairaToKobo(450_000.5)).toBe(45_000_050);
    expect(Number.isInteger(nairaToKobo(1234.56))).toBe(true);
  });
});
