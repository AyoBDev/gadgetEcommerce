import type { Metadata } from 'next';
import { SavedLaptopsView } from '@/components/SavedLaptopsView';
import { getSettings, resolveWhatsAppNumber } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'Your wishlist',
  robots: { index: false },
};

export default async function WishlistPage() {
  const settings = await getSettings();
  return <SavedLaptopsView mode="wishlist" whatsappNumber={resolveWhatsAppNumber(settings)} />;
}
