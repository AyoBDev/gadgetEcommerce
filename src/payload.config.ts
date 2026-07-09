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
    pool: { connectionString: process.env.DATABASE_URL },
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
        forcePathStyle: true,
      },
    }),
  ],
});
