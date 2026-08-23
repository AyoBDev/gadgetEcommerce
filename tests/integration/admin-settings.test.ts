import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPayloadClient } from '@/lib/payload';
import type { Setting } from '@/payload-types';

describe('admin settings', () => {
  let payload: Awaited<ReturnType<typeof getPayloadClient>>;
  let original: Setting;

  beforeAll(async () => {
    payload = await getPayloadClient();
    original = await payload.findGlobal({ slug: 'settings' });
  });

  afterAll(async () => {
    await payload.updateGlobal({ slug: 'settings', data: original });
  });

  it('persists settings via the local API (the settings save path)', async () => {
    const testData = {
      whatsappNumber: '2348000000000',
      businessName: 'Jaysmart',
      businessAddress: original.businessAddress ?? 'Test Address, Lagos',
      businessPhone: original.businessPhone ?? '08000000000',
      deliveryFeeLagos: Number(original.deliveryFeeLagos) ?? 500000,
      deliveryFeeOther: Number(original.deliveryFeeOther) ?? 1500000,
      supportEmail: `settings-test-${Date.now()}@jaysmart.ng`,
    };

    const updated = await payload.updateGlobal({ slug: 'settings', data: testData });
    expect(updated.supportEmail).toBe(testData.supportEmail);
    expect(updated.whatsappNumber).toBe(testData.whatsappNumber);
    expect(updated.businessName).toBe('Jaysmart');

    const reread = await payload.findGlobal({ slug: 'settings' });
    expect(reread.supportEmail).toBe(testData.supportEmail);
    expect(reread.deliveryFeeLagos).toBe(Number(original.deliveryFeeLagos) ?? 500000);
  });
});