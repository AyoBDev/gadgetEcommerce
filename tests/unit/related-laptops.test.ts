import { describe, it, expect } from 'vitest';
import { relatedLaptopsWhere } from '@/lib/related-laptops';

describe('relatedLaptopsWhere', () => {
  it('matches published laptops sharing brand or category, excluding self', () => {
    const where = relatedLaptopsWhere({ laptopId: 5, brandId: 2, categoryId: 3 });
    expect(where).toEqual({
      and: [
        { status: { equals: 'published' } },
        { id: { not_equals: 5 } },
        { or: [{ brand: { equals: 2 } }, { category: { equals: 3 } }] },
      ],
    });
  });

  it('uses brand only when category is absent', () => {
    const where = relatedLaptopsWhere({ laptopId: 5, brandId: 2, categoryId: null });
    expect(where).toEqual({
      and: [
        { status: { equals: 'published' } },
        { id: { not_equals: 5 } },
        { or: [{ brand: { equals: 2 } }] },
      ],
    });
  });
});
