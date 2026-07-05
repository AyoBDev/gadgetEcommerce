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
