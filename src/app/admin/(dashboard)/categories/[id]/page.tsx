import { notFound } from 'next/navigation';
import { getPayloadClient } from '@/lib/payload';
import { AdminEditForm, type AdminFieldConfig } from '@/components/admin/AdminEditForm';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Category } from '@/payload-types';

type Props = { params: Promise<{ id: string }> };

export default async function AdminCategoryEditPage({ params }: Props) {
  const { id } = await params;
  const payload = await getPayloadClient();
  const category = await payload.findByID({ collection: 'categories', id, depth: 0 }).catch(() => null);
  if (!category) notFound();

  const fields: AdminFieldConfig[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'slug', label: 'Slug', type: 'text', helperText: 'Auto-generated from name if left blank' },
    { key: 'type', label: 'Type', type: 'select', options: [
      { label: 'Brand', value: 'brand' },
      { label: 'Use case', value: 'useCase' },
    ], required: true },
    { key: 'icon', label: 'Icon', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 2 }}>
        Edit category
      </Typography>
      <AdminEditForm
        collection="categories"
        id={id}
        initial={category as unknown as Record<string, unknown>}
        fields={fields}
        cancelHref="/admin/categories"
      />
    </Box>
  );
}