import type { MetadataRoute } from 'next';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin/', '/api/', '/checkout/', '/cart/', '/account/', '/order/', '/wishlist', '/compare'] }],
    sitemap: `${SERVER_URL}/sitemap.xml`,
  };
}
