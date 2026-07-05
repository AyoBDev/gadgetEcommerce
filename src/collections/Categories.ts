import type { CollectionConfig } from 'payload';

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'type', type: 'select', options: ['brand', 'useCase'], required: true },
    { name: 'icon', type: 'text' },
    { name: 'description', type: 'text' },
  ],
};
