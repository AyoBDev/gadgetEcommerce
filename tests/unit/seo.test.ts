import { describe, it, expect } from 'vitest';
import { buildProductJsonLd, buildBreadcrumbJsonLd, buildLaptopMetadata } from '@/lib/seo';

const baseLaptop = {
  id: 1,
  title: 'HP EliteBook 840 G5',
  slug: 'hp-elitebook-840-g5',
  price: 35_000_000,
  stock: 1,
  condition: 'grade-a' as const,
  description: null,
  brand: { id: 1, name: 'HP', slug: 'hp' },
  gallery: [{ image: { url: '/media/laptop-1.jpg', alt: 'HP laptop' } }],
  seo: { metaTitle: null, metaDescription: null, ogImage: null },
};

describe('SEO helpers', () => {
  it('builds Product JSON-LD with NGN currency in kobo→naira', () => {
    const ld = buildProductJsonLd(baseLaptop as any, 'https://jaysmart.ng');
    expect(ld['@type']).toBe('Product');
    expect((ld.offers as any).priceCurrency).toBe('NGN');
    expect((ld.offers as any).price).toBe(350_000);
    expect((ld.offers as any).availability).toBe('https://schema.org/InStock');
  });

  it('marks out-of-stock laptops OutOfStock', () => {
    const ld = buildProductJsonLd({ ...baseLaptop, stock: 0 } as any, 'https://jaysmart.ng');
    expect((ld.offers as any).availability).toBe('https://schema.org/OutOfStock');
  });

  it('builds breadcrumb list with positions', () => {
    const ld = buildBreadcrumbJsonLd([
      { name: 'Home', url: 'https://jaysmart.ng' },
      { name: 'Laptops', url: 'https://jaysmart.ng/laptops' },
    ]);
    expect((ld.itemListElement as any[])[0].position).toBe(1);
    expect((ld.itemListElement as any[])[1].position).toBe(2);
  });

  it('falls back title/description when seo fields missing', () => {
    const meta = buildLaptopMetadata(baseLaptop as any);
    expect(meta.title).toBe('HP EliteBook 840 G5');
    expect(typeof meta.description).toBe('string');
  });
});
