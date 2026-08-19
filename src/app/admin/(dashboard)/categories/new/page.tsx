import { getPayloadClient } from '@/lib/payload';
import { AdminEditForm, type AdminFieldConfig } from '@/components/admin/AdminEditForm';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default async function AdminCategoryNewPage() {
  const fields: AdminFieldConfig[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'slug', label: 'Slug', type: 'text', helperText: 'Auto-generated from name if left blank' },
    { key: 'type', label: 'Type', type: 'select', options: [
      { label: 'Brand', value: 'brand' },
      { label: 'Use case', value: 'useCase' },
    ], required: true },
    { key: 'icon', label: 'Icon', type: 'text', helperText: 'Material Symbols icon name, e.g. laptop_mac' },
    { key: 'description', label: 'Description', type: 'text' },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 2 }}>
        Add category
      </Typography>
      <AdminEditForm collection="categories" fields={fields} cancelHref="/admin/categories" />
    </Box>
  );
}