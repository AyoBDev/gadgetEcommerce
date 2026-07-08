import { describe, it, expect } from 'vitest';
import { getPayloadClient } from '@/lib/payload';
import type { Laptop } from '@/payload-types';

async function makeLaptop(stock: number) {
  const payload = await getPayloadClient();
  const brand = await payload.create({
    collection: 'categories',
    data: { name: `Brand ${Date.now()}`, type: 'brand', icon: 'laptop_mac' },
  });
  const laptop = await payload.create({
    collection: 'laptops',
    data: {
      title: `Order Test Laptop ${Date.now()}`,
      brand: brand.id,
      price: 30_000_000,
      condition: 'grade-a',
      stock,
      status: 'published',
      warrantyDays: 7,
    } as unknown as Laptop,
  });
  return { payload, brand, laptop };
}

describe('Orders stock-adjust hook', () => {
  it('decrements stock on sale and keeps laptop published', async () => {
    const { payload, brand, laptop } = await makeLaptop(3);
    const order = await payload.create({
      collection: 'orders',
      data: { laptop: laptop.id, salePrice: 29_000_000, saleDate: new Date().toISOString() },
    });
    const after = await payload.findByID({ collection: 'laptops', id: laptop.id });
    expect(after.stock).toBe(2);
    expect(after.status).toBe('published');
    await payload.delete({ collection: 'orders', id: order.id });
    await payload.delete({ collection: 'laptops', id: laptop.id });
    await payload.delete({ collection: 'categories', id: brand.id });
  });

  it('marks laptop sold when the last unit sells', async () => {
    const { payload, brand, laptop } = await makeLaptop(1);
    const order = await payload.create({
      collection: 'orders',
      data: { laptop: laptop.id, salePrice: 29_000_000, saleDate: new Date().toISOString() },
    });
    const after = await payload.findByID({ collection: 'laptops', id: laptop.id });
    expect(after.stock).toBe(0);
    expect(after.status).toBe('sold');
    await payload.delete({ collection: 'orders', id: order.id });
    await payload.delete({ collection: 'laptops', id: laptop.id });
    await payload.delete({ collection: 'categories', id: brand.id });
  });
});
