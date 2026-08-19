import { getPayloadClient } from '@/lib/payload';
import { AdminEditForm, type AdminFieldConfig } from '@/components/admin/AdminEditForm';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default async function AdminOrderNewPage() {
  const payload = await getPayloadClient();
  const laptops = await payload.find({
    collection: 'laptops',
    limit: 1000,
    sort: 'title',
    select: { title: true },
  });
  const options = laptops.docs.map((l) => ({ id: l.id, name: l.title }));

  const fields: AdminFieldConfig[] = [
    { key: 'laptop', label: 'Laptop', type: 'relationship', relationshipOptions: options, required: true },
    { key: 'salePrice', label: 'Sale price (kobo)', type: 'number', required: true, helperText: 'Actual sale price in kobo (Naira × 100)' },
    { key: 'buyerName', label: 'Buyer name', type: 'text' },
    { key: 'buyerPhone', label: 'Buyer phone', type: 'text', helperText: 'WhatsApp / phone' },
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
        Record a sale
      </Typography>
      <AdminEditForm collection="orders" fields={fields} cancelHref="/admin-v2/orders" />
    </Box>
  );
}