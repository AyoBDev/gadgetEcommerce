import type { MetadataRoute } from 'next';
import { getPayloadClient } from '@/lib/payload';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient();
  const [laptops, categories] = await Promise.all([
    payload.find({ collection: 'laptops', where: { status: { equals: 'published' } }, limit: 1000, depth: 0 }),
    payload.find({ collection: 'categories', limit: 200, depth: 0 }),
  ]);

  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SERVER_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SERVER_URL}/laptops`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
  ];

  const laptopEntries: MetadataRoute.Sitemap = laptops.docs.map((l) => ({
    url: `${SERVER_URL}/laptops/${l.slug}`,
    lastModified: new Date(l.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.docs.map((c) => ({
    url: c.type === 'brand'
      ? `${SERVER_URL}/laptops?brand=${c.slug}`
      : `${SERVER_URL}/laptops?useCase=${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticEntries, ...laptopEntries, ...categoryEntries];
}
