import type { CollectionConfig } from 'payload';

export const Laptops: CollectionConfig = {
  slug: 'laptops',
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
  ],
};
