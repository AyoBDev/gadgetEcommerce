import type { Payload } from 'payload';
import type { LaptopFormOption } from '@/components/admin/LaptopForm';

export type LaptopFormOptions = {
  brands: LaptopFormOption[];
  categories: LaptopFormOption[];
  media: LaptopFormOption[];
};

export async function getLaptopFormOptions(payload: Payload): Promise<LaptopFormOptions> {
  const [brands, categories, media] = await Promise.all([
    payload.find({ collection: 'categories', where: { type: { equals: 'brand' } }, limit: 200, sort: 'name', select: { name: true } }),
    payload.find({ collection: 'categories', where: { type: { equals: 'useCase' } }, limit: 200, sort: 'name', select: { name: true } }),
    payload.find({ collection: 'media', limit: 500, sort: 'createdAt', select: { alt: true, url: true, sizes: true, filename: true } }),
  ]);

  return {
    brands: brands.docs.map((b) => ({ id: b.id, name: b.name })),
    categories: categories.docs.map((c) => ({ id: c.id, name: c.name })),
    media: media.docs.map((m) => ({
      id: m.id,
      name: m.alt || m.filename || `Media ${m.id}`,
      thumbnailURL: m.sizes?.thumbnail?.url ?? m.url ?? null,
    })),
  };
}