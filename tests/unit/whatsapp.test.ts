import { describe, it, expect } from 'vitest';
import { buildWhatsAppLink, buildInquiryMessage, buildAddonWhatsAppMessage } from '@/lib/whatsapp';

describe('buildWhatsAppLink', () => {
  it('builds a wa.me link with encoded message', () => {
    expect(buildWhatsAppLink('2348012345678', 'hi there')).toBe(
      'https://wa.me/2348012345678?text=hi%20there',
    );
  });
});

describe('buildInquiryMessage', () => {
  it('includes title, formatted price, and url', () => {
    const msg = buildInquiryMessage({ title: 'Dell Latitude 7490', price: 28_000_000, url: 'https://x.ng/laptops/dell' });
    expect(msg).toBe("Hi, I'm interested in the Dell Latitude 7490 (₦280,000) — https://x.ng/laptops/dell");
  });
});

describe('buildAddonWhatsAppMessage', () => {
  it('includes the laptop and the add-on with formatted prices', () => {
    const msg = buildAddonWhatsAppMessage({
      title: 'Dell Latitude 7490', price: 28_000_000, url: 'https://x.ng/laptops/dell',
      addonName: 'Premium Laptop Bag', addonPrice: 1_500_000,
    });
    expect(msg).toBe(
      "Hi, I'd like the Dell Latitude 7490 (₦280,000) plus the Premium Laptop Bag (+₦15,000) — https://x.ng/laptops/dell",
    );
  });
});
