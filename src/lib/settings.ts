import 'server-only';
import { cache } from 'react';
import { getPayloadClient } from '@/lib/payload';
import type { Setting } from '@/payload-types';

/**
 * Default Settings used when the database is unreachable — most importantly at
 * build time on hosts (e.g. Railway) whose builders cannot reach the runtime
 * database. Values mirror the Settings global's own field defaults; the
 * WhatsApp number comes from the env var via resolveWhatsAppNumber's fallback.
 */
const FALLBACK_SETTINGS: Setting = {
  id: 0,
  whatsappNumber: '',
  businessName: 'Jaysmart',
  businessAddress: null,
  businessPhone: null,
  deliveryFeeLagos: 500_000,
  deliveryFeeOther: 1_500_000,
  supportEmail: '',
};

/**
 * Fetches the site Settings global. Wrapped in React's `cache` so multiple
 * components rendering in the same request share a single query.
 *
 * Falls back to sensible defaults (and the WhatsApp env var) if the global
 * hasn't been populated yet — or if the database is unreachable (build-time
 * prerender on a builder without database access) — so the storefront never
 * renders broken links and the build never fails on a DB error here.
 */
export const getSettings = cache(async (): Promise<Setting> => {
  try {
    const payload = await getPayloadClient();
    return await payload.findGlobal({ slug: 'settings' });
  } catch {
    return FALLBACK_SETTINGS;
  }
});

/**
 * Resolves the WhatsApp number, preferring the CMS Settings value and falling
 * back to the build-time env var if Settings hasn't been configured.
 */
export function resolveWhatsAppNumber(settings?: Pick<Setting, 'whatsappNumber'> | null): string {
  return settings?.whatsappNumber || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
}
