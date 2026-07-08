import type { CollectionConfig } from 'payload';
import { generateSlug } from '@/lib/slug';

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: { group: 'Catalog', useAsTitle: 'name', defaultColumns: ['name', 'type', 'slug'] },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'Auto-generated from name if left blank' },
      hooks: {
        beforeValidate: [
          ({ data, value }) => value ?? (data?.name ? generateSlug(data.name) : undefined),
        ],
      },
    },
    { name: 'type', type: 'select', required: true, options: [
      { label: 'Brand', value: 'brand' },
      { label: 'Use case', value: 'useCase' },
    ]},
    { name: 'icon', type: 'text', admin: { description: 'Material Symbols icon name, e.g. laptop_mac' } },
    { name: 'description', type: 'text' },
  ],
};
