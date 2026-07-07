import 'server-only';
import { cache } from 'react';
import { getPayloadClient } from '@/lib/payload';
import type { Setting } from '@/payload-types';

/**
 * Fetches the site Settings global. Wrapped in React's `cache` so multiple
 * components rendering in the same request share a single query.
 *
 * Falls back to sensible defaults (and the WhatsApp env var) if the global
 * hasn't been populated yet, so the storefront never renders broken links.
 */
export const getSettings = cache(async (): Promise<Setting> => {
  const payload = await getPayloadClient();
  const settings = await payload.findGlobal({ slug: 'settings' });
  return settings;
});

/**
 * Resolves the WhatsApp number, preferring the CMS Settings value and falling
 * back to the build-time env var if Settings hasn't been configured.
 */
export function resolveWhatsAppNumber(settings?: Pick<Setting, 'whatsappNumber'> | null): string {
  return settings?.whatsappNumber || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
}
