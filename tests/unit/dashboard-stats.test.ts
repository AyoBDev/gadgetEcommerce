import { describe, it, expect } from 'vitest';
import { computeRevenue, monthStart } from '@/lib/dashboard-stats';

describe('computeRevenue', () => {
  it('sums salePrice across orders', () => {
    expect(computeRevenue([{ salePrice: 100 }, { salePrice: 250 }])).toBe(350);
  });
  it('returns 0 for no orders', () => {
    expect(computeRevenue([])).toBe(0);
  });
});

describe('monthStart', () => {
  it('returns the first day of the month at midnight UTC', () => {
    const d = monthStart(new Date('2026-07-08T15:30:00.000Z'));
    expect(d.toISOString()).toBe('2026-07-01T00:00:00.000Z');
  });
});
