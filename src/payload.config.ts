import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

import { Users } from '@/collections/Users';
import { Media } from '@/collections/Media';
import { Categories } from '@/collections/Categories';
import { Laptops } from '@/collections/Laptops';
import { Orders } from '@/collections/Orders';
import { Addons } from '@/collections/Addons';
import { Settings } from '@/globals/Settings';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: 'users',
    meta: { title: 'Jaysmart Admin', titleSuffix: '— Jaysmart' },
    components: {
      Nav: '@/components/admin/Nav#default',
      beforeDashboard: ['@/components/admin/DashboardStats#default'],
    },
  },
  editor: lexicalEditor(),
  collections: [Users, Media, Categories, Laptops, Orders, Addons],
  globals: [Settings],
  secret: process.env.PAYLOAD_SECRET ?? '',
  sharp,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
      // Managed Postgres (Railway public URL, Supabase, etc.) terminates TLS
      // with a self-signed cert. Set DATABASE_SSL=true to enable SSL without
      // certificate verification. Leave unset for Railway's private network
      // URL or local Postgres, which don't use SSL.
      ...(process.env.DATABASE_SSL === 'true'
        ? { ssl: { rejectUnauthorized: false } }
        : {}),
    },
  }),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  plugins: [
    s3Storage({
      collections: { media: true },
      bucket: process.env.S3_BUCKET ?? '',
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
        },
        // Path-style works for most S3-compatible providers (MinIO, Tigris,
        // Cloudflare R2). Set S3_FORCE_PATH_STYLE=false only if your provider
        // requires virtual-hosted-style URLs.
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
      },
    }),
  ],
});
