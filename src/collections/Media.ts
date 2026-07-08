import type { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Catalog', useAsTitle: 'alt' },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  upload: {
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 400, position: 'centre' },
      { name: 'card', width: 600, height: 400, position: 'centre' },
      { name: 'hero', width: 1200, height: 800, position: 'centre' },
    ],
    focalPoint: true,
  },
  fields: [
    { name: 'alt', type: 'text', required: true, admin: { description: 'Descriptive alt text for accessibility and SEO' } },
    { name: 'caption', type: 'text' },
  ],
};
