/**
 * Bulk-import laptops from a JSON file into Payload via the Local API.
 *
 * The JSON references brand / useCase categories BY NAME; this script resolves
 * each name to an existing Category (matched case-insensitively) or creates it,
 * then links the laptop by id. Slugs, publishedAt, and revalidation run through
 * the collections' own hooks.
 *
 * Usage (from the project root):
 *
 *   # local DB
 *   DATABASE_URL=postgres://mac@localhost:5432/jaysmart_dev \
 *   PAYLOAD_SECRET=local-dev-secret-32-chars-minimum-xx \
 *     pnpm seed:laptops scripts/data/laptops.json
 *
 *   # Railway / any already-migrated database (public URL needs SSL).
 *   # IMPORTANT: pass NODE_ENV=production so Payload connects in migration mode.
 *   # Without it, Payload runs dev "push" and writes a `dev` row (batch -1) into
 *   # payload_migrations, which then makes `payload migrate` a no-op-that-looks-
 *   # applied and can break the deploy's start command. Against a migrated DB,
 *   # always seed in production mode:
 *   NODE_ENV=production \
 *   DATABASE_URL='postgres://…public…' DATABASE_SSL=true \
 *   PAYLOAD_SECRET='<your railway PAYLOAD_SECRET>' \
 *     pnpm seed:laptops scripts/data/laptops.json
 *
 * Re-running is safe: a laptop whose slug already exists is skipped (not
 * duplicated), and existing categories are reused.
 */
import { getPayload } from 'payload';
import { readFileSync } from 'node:fs';
import config from '@/payload.config';
import { generateSlug } from '@/lib/slug';
import type { Category, Laptop } from '@/payload-types';

type SeedLaptop = {
  title: string;
  brand: string; // category name, type "brand"
  category?: string; // category name, type "useCase"
  price: number; // kobo
  compareAtPrice?: number; // kobo
  condition: 'grade-a' | 'grade-b' | 'grade-c';
  specs?: {
    processor?: string;
    ram?: number;
    storage?: string;
    screenSize?: number;
    batteryHealth?: number;
    os?: string;
  };
  warrantyDays?: number;
  stock?: number;
  status?: 'draft' | 'published' | 'sold';
};

async function main() {
  // `payload run` strips the "run <script>" args, so the datafile is argv[2].
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: pnpm seed:laptops <path-to-json>');
    process.exit(1);
  }
  console.log(`Seeding laptops from ${file}…`);

  const laptops: SeedLaptop[] = JSON.parse(readFileSync(file, 'utf8'));
  console.log(`Parsed ${laptops.length} laptop(s). Initializing Payload…`);
  const payload = await getPayload({ config });

  // Cache of category name (lowercased) + type -> id, resolving or creating.
  const categoryCache = new Map<string, number>();

  async function resolveCategory(name: string, type: 'brand' | 'useCase'): Promise<number> {
    const key = `${type}:${name.trim().toLowerCase()}`;
    const cached = categoryCache.get(key);
    if (cached) return cached;

    const existing = await payload.find({
      collection: 'categories',
      where: { and: [{ name: { equals: name } }, { type: { equals: type } }] },
      limit: 1,
    });

    let id: number;
    if (existing.docs[0]) {
      id = existing.docs[0].id as number;
    } else {
      const created = await payload.create({
        collection: 'categories',
        data: {
          name,
          type,
          slug: generateSlug(name),
          icon: type === 'brand' ? 'laptop_mac' : 'category',
        } as unknown as Category,
      });
      id = created.id as number;
      console.log(`  + created ${type} category "${name}" (id ${id})`);
    }
    categoryCache.set(key, id);
    return id;
  }

  let created = 0;
  let skipped = 0;

  for (const l of laptops) {
    const slug = generateSlug(l.title);

    const dupe = await payload.find({
      collection: 'laptops',
      where: { slug: { equals: slug } },
      limit: 1,
    });
    if (dupe.docs[0]) {
      console.log(`- skip (exists): ${l.title}`);
      skipped++;
      continue;
    }

    const brandId = await resolveCategory(l.brand, 'brand');
    const categoryId = l.category ? await resolveCategory(l.category, 'useCase') : undefined;

    await payload.create({
      collection: 'laptops',
      // Cast mirrors tests/integration/payload-orders.test.ts: Payload's create()
      // overload otherwise demands a `draft` field. The slug is provided (the
      // beforeValidate hook can't be expressed in the type), so `as unknown as
      // Laptop` is the established pattern in this repo.
      data: {
        title: l.title,
        slug,
        brand: brandId,
        ...(categoryId ? { category: categoryId } : {}),
        price: l.price,
        ...(l.compareAtPrice ? { compareAtPrice: l.compareAtPrice } : {}),
        condition: l.condition,
        specs: l.specs ?? {},
        warrantyDays: l.warrantyDays ?? 7,
        stock: l.stock ?? 1,
        status: l.status ?? 'published',
      } as unknown as Laptop,
    });
    console.log(`+ created: ${l.title}`);
    created++;
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped}.`);
}

// Top-level await: `payload run` awaits this module's evaluation, so awaiting
// main() here keeps the process alive until seeding finishes. (A fire-and-forget
// `main()` would let the process exit before any DB work ran.)
try {
  await main();
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
