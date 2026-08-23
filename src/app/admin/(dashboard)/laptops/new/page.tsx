import { getPayloadClient } from '@/lib/payload';
import { getLaptopFormOptions } from '@/lib/admin-options';
import { LaptopForm } from '@/components/admin/LaptopForm';

export default async function NewLaptopPage() {
  const payload = await getPayloadClient();
  const options = await getLaptopFormOptions(payload);
  return <LaptopForm initial={null} {...options} />;
}