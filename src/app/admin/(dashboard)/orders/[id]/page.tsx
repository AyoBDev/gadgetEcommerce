import { notFound } from 'next/navigation';
import { getPayloadClient } from '@/lib/payload';
import { AdminEditForm, type AdminFieldConfig } from '@/components/admin/AdminEditForm';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Order } from '@/payload-types';

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderEditPage({ params }: Props) {
  const { id } = await params;
  const payload = await getPayloadClient();
  const [order, laptops] = await Promise.all([
    payload.findByID({ collection: 'orders', id, depth: 1 }).catch(() => null),
    payload.find({ collection: 'laptops', limit: 1000, sort: 'title', select: { title: true } }),
  ]);
  if (!order) notFound();
  const options = laptops.docs.map((l) => ({ id: l.id, name: l.title }));

  const fields: AdminFieldConfig[] = [
    { key: 'laptop', label: 'Laptop', type: 'relationship', relationshipOptions: options, required: true },
    { key: 'salePrice', label: 'Sale price (kobo)', type: 'number', required: true },
    { key: 'buyerName', label: 'Buyer name', type: 'text' },
    { key: 'buyerPhone', label: 'Buyer phone', type: 'text' },
    { key: 'saleDate', label: 'Sale date', type: 'date', required: true },
    { key: 'paymentStatus', label: 'Payment status', type: 'select', options: [
      { label: 'Pending', value: 'pending' },
      { label: 'Paid', value: 'paid' },
    ], required: true },
    { key: 'deliveryStatus', label: 'Delivery status', type: 'select', options: [
      { label: 'Pending', value: 'pending' },
      { label: 'Delivered', value: 'delivered' },
    ], required: true },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 2 }}>
        Order #{order.id}
      </Typography>
      <AdminEditForm collection="orders" id={id} initial={order as unknown as Record<string, unknown>} fields={fields} cancelHref="/admin/orders" />
    </Box>
  );
}