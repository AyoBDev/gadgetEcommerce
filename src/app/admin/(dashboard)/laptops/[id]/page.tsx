import { notFound } from 'next/navigation';
import { getPayloadClient } from '@/lib/payload';
import { getLaptopFormOptions } from '@/lib/admin-options';
import { LaptopForm } from '@/components/admin/LaptopForm';

export default async function EditLaptopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await getPayloadClient();
  const laptop = await payload.findByID({ collection: 'laptops', id, depth: 1 }).catch(() => null);
  if (!laptop) notFound();
  const options = await getLaptopFormOptions(payload);
  return <LaptopForm initial={laptop} {...options} />;
}