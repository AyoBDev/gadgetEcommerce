import { describe, it, expect } from 'vitest';
import { getPayloadClient } from '@/lib/payload';
import type { Laptop } from '@/payload-types';

/**
 * Prices are integer kobo. `formatNaira` renders them on every storefront card,
 * so a fractional amount reaching the database is a site-wide display hazard —
 * these assert the collection itself refuses one.
 */
describe('kobo price validation', () => {
  async function withBrand<T>(fn: (brandId: number) => Promise<T>): Promise<T> {
    const payload = await getPayloadClient();
    const brand = await payload.create({
      collection: 'categories',
      data: { name: `Kobo Test Brand ${Date.now()}`, type: 'brand', icon: 'laptop_mac' },
    });
    try {
      return await fn(brand.id);
    } finally {
      await payload.delete({ collection: 'categories', id: brand.id });
    }
  }

  const baseLaptop = (brandId: number, price: number) => ({
    title: `Kobo Test Laptop ${Date.now()}`,
    brand: brandId,
    price,
    condition: 'grade-a',
    stock: 1,
    status: 'draft',
    warrantyDays: 30,
  }) as unknown as Laptop;

  it('rejects a laptop with a fractional price', async () => {
    const payload = await getPayloadClient();
    await withBrand(async (brandId) => {
      await expect(
        payload.create({ collection: 'laptops', data: baseLaptop(brandId, 45_000_000.5) }),
      ).rejects.toThrow();
    });
  });

  it('rejects a fractional compareAtPrice', async () => {
    const payload = await getPayloadClient();
    await withBrand(async (brandId) => {
      await expect(
        payload.create({
          collection: 'laptops',
          data: { ...baseLaptop(brandId, 45_000_000), compareAtPrice: 50_000_000.25 } as unknown as Laptop,
        }),
      ).rejects.toThrow();
    });
  });

  it('accepts a whole-kobo price', async () => {
    const payload = await getPayloadClient();
    await withBrand(async (brandId) => {
      const laptop = await payload.create({
        collection: 'laptops',
        data: baseLaptop(brandId, 45_000_000),
      });
      expect(laptop.price).toBe(45_000_000);
      await payload.delete({ collection: 'laptops', id: laptop.id });
    });
  });

  it('rejects a fractional addon price', async () => {
    const payload = await getPayloadClient();
    await expect(
      payload.create({
        collection: 'addons',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { name: `Kobo Test Addon ${Date.now()}`, price: 1_500.75, active: true } as any,
      }),
    ).rejects.toThrow();
  });
});
