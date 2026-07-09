/**
 * This file was hand-authored to match Payload's generated-types conventions,
 * because `payload generate:types` currently fails in this environment due to
 * a tsx/Node ESM-CJS interop bug in `payload/dist/bin/loadEnv.js` when loading
 * `@next/env`. Keep this file's shape in sync with the collection/global field
 * definitions in `src/collections/*.ts` and `src/globals/*.ts` until the CLI
 * can be run successfully.
 */
import type { SerializedEditorState } from 'lexical';

export interface Config {
  collections: {
    users: User;
    media: Media;
    categories: Category;
    laptops: Laptop;
    orders: Order;
    addons: Addon;
  };
  globals: {
    settings: Setting;
  };
}

declare module 'payload' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface GeneratedTypes extends Config {}
}

export interface User {
  id: number;
  name: string;
  role: 'admin' | 'staff';
  email: string;
  updatedAt: string;
  createdAt: string;
}

export interface Media {
  id: number;
  alt: string;
  caption?: string | null;
  updatedAt: string;
  createdAt: string;
  url?: string | null;
  thumbnailURL?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  focalX?: number | null;
  focalY?: number | null;
  sizes?: {
    thumbnail?: MediaSize;
    card?: MediaSize;
    hero?: MediaSize;
  };
}

export interface MediaSize {
  url?: string | null;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  filesize?: number | null;
  filename?: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug?: string | null;
  type: 'brand' | 'useCase';
  icon?: string | null;
  description?: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface Laptop {
  id: number;
  title: string;
  slug: string;
  brand: number | Category;
  category?: (number | Category) | null;
  price: number;
  compareAtPrice?: number | null;
  condition: 'grade-a' | 'grade-b' | 'grade-c';
  specs?: {
    processor?: string | null;
    ram?: number | null;
    storage?: string | null;
    screenSize?: number | null;
    batteryHealth?: number | null;
    os?: string | null;
  };
  gallery: {
    image: number | Media;
    id?: string | null;
  }[];
  description?: SerializedEditorState | null;
  warrantyDays: number;
  stock: number;
  status: 'draft' | 'published' | 'sold';
  seo?: {
    metaTitle?: string | null;
    metaDescription?: string | null;
    ogImage?: (number | Media) | null;
  };
  publishedAt?: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface Order {
  id: number;
  laptop: number | Laptop;
  salePrice: number;
  buyerName?: string | null;
  buyerPhone?: string | null;
  saleDate: string;
  paymentStatus?: 'pending' | 'paid' | null;
  deliveryStatus?: 'pending' | 'delivered' | null;
  orderLabel?: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface Addon {
  id: number;
  name: string;
  price: number;
  icon?: string | null;
  active?: boolean | null;
  updatedAt: string;
  createdAt: string;
}

export interface Setting {
  id: number;
  whatsappNumber: string;
  businessName: string;
  businessAddress?: string | null;
  businessPhone?: string | null;
  deliveryFeeLagos: number;
  deliveryFeeOther: number;
  supportEmail: string;
  updatedAt?: string | null;
  createdAt?: string | null;
}
