import { notFound } from 'next/navigation';
import { getPayloadClient } from '@/lib/payload';
import { AdminEditForm, type AdminFieldConfig } from '@/components/admin/AdminEditForm';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Addon } from '@/payload-types';

type Props = { params: Promise<{ id: string }> };

export default async function AdminAddonEditPage({ params }: Props) {
  const { id } = await params;
  const payload = await getPayloadClient();
  const addon = await payload.findByID({ collection: 'addons', id, depth: 0 }).catch(() => null);
  if (!addon) notFound();

  const fields: AdminFieldConfig[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'price', label: 'Price (kobo)', type: 'number', required: true },
    { key: 'icon', label: 'Icon', type: 'text' },
    { key: 'active', label: 'Active on storefront', type: 'checkbox', defaultValue: true },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 2 }}>
        Edit add-on
      </Typography>
      <AdminEditForm
        collection="addons"
        id={id}
        initial={addon as unknown as Record<string, unknown>}
        fields={fields}
        cancelHref="/admin-v2/addons"
      />
    </Box>
  );
}