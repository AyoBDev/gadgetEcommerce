import type { CollectionConfig } from 'payload';

export const Addons: CollectionConfig = {
  slug: 'addons',
  admin: {
    group: 'Catalog',
    useAsTitle: 'name',
    defaultColumns: ['name', 'price', 'active'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'price', type: 'number', required: true, min: 0,
      admin: { description: 'In kobo (Naira × 100)' } },
    { name: 'icon', type: 'text',
      admin: { description: 'Supported keyword: work/bag, mouse, memory/ram, keyboard, headphones, cable/charger, storage/ssd, laptop. Anything else shows a cart icon.' } },
    { name: 'active', type: 'checkbox', defaultValue: true,
      admin: { description: 'Only active add-ons show on the storefront' } },
  ],
};
