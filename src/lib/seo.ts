import type { Metadata } from 'next';
import type { Laptop, Setting } from '@/payload-types';
import { koboToNaira } from '@/lib/money';

function firstImageUrl(laptop: Laptop): string | undefined {
  const first = laptop.gallery?.[0]?.image;
  if (first && typeof first === 'object' && 'url' in first) return first.url ?? undefined;
  return undefined;
}

function defaultDescription(laptop: Laptop): string {
  const specs = laptop.specs ?? {};
  const parts = [
    specs.processor,
    specs.ram ? `${specs.ram}GB RAM` : undefined,
    specs.storage,
  ].filter(Boolean);
  return `Buy ${laptop.title}${parts.length ? ' — ' + parts.join(', ') : ''}. Preowned laptop in Nigeria with 7-day warranty.`;
}

export function buildLaptopMetadata(laptop: Laptop): Metadata {
  const title = laptop.seo?.metaTitle ?? laptop.title;
  const description = laptop.seo?.metaDescription ?? defaultDescription(laptop);
  const ogImage = firstImageUrl(laptop);
  return {
    title,
    description,
    alternates: { canonical: `/laptops/${laptop.slug}` },
    openGraph: {
      title,
      description,
      type: 'website',
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}

export function buildProductJsonLd(laptop: Laptop, serverUrl: string) {
  const brand = typeof laptop.brand === 'object' ? laptop.brand?.name : undefined;
  const image = firstImageUrl(laptop);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: laptop.title,
    description: laptop.seo?.metaDescription ?? defaultDescription(laptop),
    sku: String(laptop.id),
    image: image ? [image] : undefined,
    brand: brand ? { '@type': 'Brand', name: brand } : undefined,
    itemCondition: 'https://schema.org/UsedCondition',
    offers: {
      '@type': 'Offer',
      url: `${serverUrl}/laptops/${laptop.slug}`,
      priceCurrency: 'NGN',
      price: koboToNaira(laptop.price),
      availability: laptop.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };
}

export function buildOrganizationJsonLd(settings: Setting, serverUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: settings.businessName,
    address: settings.businessAddress,
    telephone: settings.businessPhone,
    email: settings.supportEmail,
    url: serverUrl,
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
