import type { CollectionConfig } from 'payload';
import { revalidatePath } from 'next/cache';
import { generateSlug } from '@/lib/slug';

export const Laptops: CollectionConfig = {
  slug: 'laptops',
  admin: {
    group: 'Catalog',
    useAsTitle: 'title',
    defaultColumns: ['title', 'brand', 'price', 'status', 'stock', 'updatedAt'],
    listSearchableFields: ['title', 'slug', 'specs.processor'],
  },
  access: {
    read: ({ req }) => req.user ? true : { status: { equals: 'published' } },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => req.user?.role === 'admin',
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Stamp publishedAt the first time a laptop becomes published, so
        // admin-created laptops don't end up with a null publish date.
        if (data?.status === 'published' && !data.publishedAt) {
          data.publishedAt = new Date().toISOString();
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc }) => {
        try {
          revalidatePath('/');
          revalidatePath('/laptops');
          if (doc?.slug) revalidatePath(`/laptops/${doc.slug}`);
        } catch {
          // revalidatePath is unavailable during CLI seeds and tests — safe to swallow
        }
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'Auto-generated from title if left blank' },
      hooks: {
        beforeValidate: [
          ({ data, value }) => value ?? (data?.title ? generateSlug(data.title) : undefined),
        ],
      },
    },
    { name: 'brand', type: 'relationship', relationTo: 'categories', required: true,
      filterOptions: { type: { equals: 'brand' } } },
    { name: 'category', type: 'relationship', relationTo: 'categories',
      filterOptions: { type: { equals: 'useCase' } } },
    { name: 'price', type: 'number', required: true, min: 0,
      admin: { description: 'In kobo (Naira × 100)' } },
    { name: 'compareAtPrice', type: 'number', min: 0,
      admin: { description: 'In kobo; renders as strike-through if set' } },
    { name: 'condition', type: 'select', required: true, options: [
      { label: 'Grade A (like new)', value: 'grade-a' },
      { label: 'Grade B (light wear)', value: 'grade-b' },
      { label: 'Grade C (visible wear)', value: 'grade-c' },
    ]},
    {
      name: 'specs',
      type: 'group',
      fields: [
        { name: 'processor', type: 'text' },
        { name: 'ram', type: 'number', admin: { description: 'GB' } },
        { name: 'storage', type: 'text' },
        { name: 'screenSize', type: 'number', admin: { description: 'inches' } },
        { name: 'batteryHealth', type: 'number', min: 0, max: 100, admin: { description: 'percent' } },
        { name: 'os', type: 'text' },
      ],
    },
    { name: 'gallery', type: 'array',
      admin: { description: 'Product photos. Optional, but strongly recommended for published laptops.' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
      ]},
    { name: 'description', type: 'richText' },
    { name: 'warrantyDays', type: 'number', defaultValue: 7, required: true, min: 0 },
    { name: 'stock', type: 'number', defaultValue: 1, required: true, min: 0 },
    { name: 'status', type: 'select', required: true, defaultValue: 'draft', options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Published', value: 'published' },
      { label: 'Sold', value: 'sold' },
    ]},
    {
      name: 'seo',
      type: 'group',
      admin: { description: 'Search engine metadata. All fields fall back to sensible defaults.' },
      fields: [
        { name: 'metaTitle', type: 'text' },
        { name: 'metaDescription', type: 'textarea' },
        { name: 'ogImage', type: 'upload', relationTo: 'media' },
      ],
    },
    { name: 'publishedAt', type: 'date',
      admin: { position: 'sidebar', description: 'Auto-set when first published; override if needed.' } },
  ],
};
