import { describe, it, expect } from 'vitest';
import { getPayloadClient } from '@/lib/payload';

describe('Categories slug hook', () => {
  it('auto-generates slug from name on create', async () => {
    const payload = await getPayloadClient();
    const created = await payload.create({
      collection: 'categories',
      data: { name: 'HP EliteBook', type: 'brand', icon: 'laptop_mac' },
    });
    expect(created.slug).toBe('hp-elitebook');
    await payload.delete({ collection: 'categories', id: created.id });
  });

  it('accepts explicit slug', async () => {
    const payload = await getPayloadClient();
    const created = await payload.create({
      collection: 'categories',
      data: { name: 'Dell Latitude', slug: 'dell-latitude-custom', type: 'brand', icon: 'laptop_windows' },
    });
    expect(created.slug).toBe('dell-latitude-custom');
    await payload.delete({ collection: 'categories', id: created.id });
  });
});

describe('Laptops slug hook', () => {
  it('auto-generates slug from title on create', async () => {
    const payload = await getPayloadClient();
    const brand = await payload.create({
      collection: 'categories',
      data: { name: 'HP', type: 'brand', icon: 'laptop_mac' },
    });
    const useCase = await payload.create({
      collection: 'categories',
      data: { name: 'Programming', type: 'useCase', icon: 'code' },
    });
    const laptop = await payload.create({
      collection: 'laptops',
      data: {
        title: 'HP EliteBook 840 G5 Core i5 8th Gen',
        brand: brand.id,
        category: useCase.id,
        price: 35_000_000,
        condition: 'grade-a',
        stock: 1,
        status: 'draft',
        warrantyDays: 7,
      },
    });
    expect(laptop.slug).toBe('hp-elitebook-840-g5-core-i5-8th-gen');
    await payload.delete({ collection: 'laptops', id: laptop.id });
    await payload.delete({ collection: 'categories', id: brand.id });
    await payload.delete({ collection: 'categories', id: useCase.id });
  });
});
