import { describe, it, expect } from 'vitest';
import { getPayloadClient } from '@/lib/payload';

describe('Addons collection', () => {
  it('creates an add-on and defaults active to true', async () => {
    const payload = await getPayloadClient();
    const addon = await payload.create({
      collection: 'addons',
      data: { name: 'Premium Laptop Bag', price: 1_500_000, icon: 'work' },
    });
    expect(addon.name).toBe('Premium Laptop Bag');
    expect(addon.price).toBe(1_500_000);
    expect(addon.active).toBe(true);
    await payload.delete({ collection: 'addons', id: addon.id });
  });

  it('can filter to active add-ons only', async () => {
    const payload = await getPayloadClient();
    const on = await payload.create({ collection: 'addons', data: { name: 'Mouse', price: 850_000, icon: 'mouse', active: true } });
    const off = await payload.create({ collection: 'addons', data: { name: 'Old', price: 100, icon: 'memory', active: false } });
    const res = await payload.find({ collection: 'addons', where: { active: { equals: true } }, limit: 50 });
    const names = res.docs.map((d) => d.name);
    expect(names).toContain('Mouse');
    expect(names).not.toContain('Old');
    await payload.delete({ collection: 'addons', id: on.id });
    await payload.delete({ collection: 'addons', id: off.id });
  });
});
