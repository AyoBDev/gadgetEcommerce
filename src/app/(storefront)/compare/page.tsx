import type { Metadata } from 'next';
import { SavedLaptopsView } from '@/components/SavedLaptopsView';
import { getSettings, resolveWhatsAppNumber } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'Compare laptops',
  robots: { index: false },
};

export default async function ComparePage() {
  const settings = await getSettings();
  return <SavedLaptopsView mode="compare" whatsappNumber={resolveWhatsAppNumber(settings)} />;
}
