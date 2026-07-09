import type { Where } from 'payload';

export function relatedLaptopsWhere(args: {
  laptopId: number;
  brandId: number;
  categoryId?: number | null;
}): Where {
  const or: Where[] = [{ brand: { equals: args.brandId } }];
  if (args.categoryId != null) {
    or.push({ category: { equals: args.categoryId } });
  }
  return {
    and: [
      { status: { equals: 'published' } },
      { id: { not_equals: args.laptopId } },
      { or },
    ],
  };
}
