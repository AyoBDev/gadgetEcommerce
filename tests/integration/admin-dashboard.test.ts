import { describe, it, expect } from 'vitest';
import { getPayloadClient } from '@/lib/payload';
import { getDashboardStats, computeRevenue, monthStart } from '@/lib/dashboard-stats';

describe('getDashboardStats', () => {
  it('returns the full stats shape even with an empty DB', async () => {
    const payload = await getPayloadClient();
    const stats = await getDashboardStats(payload);
    expect(stats).toMatchObject({
      publishedCount: expect.any(Number),
      outOfStockCount: expect.any(Number),
      lowStockCount: expect.any(Number),
      salesThisMonth: expect.any(Number),
      revenueThisMonthKobo: expect.any(Number),
      pendingDeliveries: expect.any(Number),
    });
  });

  it('reflects a new order in sales and revenue', async () => {
    const payload = await getPayloadClient();
    const brand = await payload.create({
      collection: 'categories',
      data: { name: `Brand ${Date.now()}`, type: 'brand', icon: 'laptop_mac' },
    });
    const laptop = await payload.create({
      collection: 'laptops',
      data: {
        title: `Dash Test Laptop ${Date.now()}`,
        brand: brand.id,
        price: 30_000_000,
        condition: 'grade-a',
        stock: 1,
        status: 'published',
        warrantyDays: 7,
      } as never,
    });
    const order = await payload.create({
      collection: 'orders',
      data: { laptop: laptop.id, salePrice: 29_000_000, saleDate: new Date().toISOString() },
    });
    try {
      const stats = await getDashboardStats(payload);
      expect(stats.salesThisMonth).toBeGreaterThanOrEqual(1);
      expect(stats.revenueThisMonthKobo).toBeGreaterThanOrEqual(29_000_000);
    } finally {
      await payload.delete({ collection: 'orders', id: order.id });
      await payload.delete({ collection: 'laptops', id: laptop.id });
      await payload.delete({ collection: 'categories', id: brand.id });
    }
  });
});

describe('computeRevenue + monthStart', () => {
  it('sums sale prices', () => {
    expect(computeRevenue([{ salePrice: 10 }, { salePrice: 20 }])).toBe(30);
  });
  it('monthStart is the first of the current month (UTC)', () => {
    const start = monthStart(new Date('2026-08-19T15:00:00Z'));
    expect(start.toISOString()).toBe('2026-08-01T00:00:00.000Z');
  });
});