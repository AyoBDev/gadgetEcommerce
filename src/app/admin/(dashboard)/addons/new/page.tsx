import { getPayloadClient } from '@/lib/payload';
import { AdminEditForm, type AdminFieldConfig } from '@/components/admin/AdminEditForm';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default async function AdminAddonNewPage() {
  const fields: AdminFieldConfig[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'price', label: 'Price (kobo)', type: 'number', required: true, helperText: 'In kobo (Naira × 100)' },
    { key: 'icon', label: 'Icon', type: 'text', helperText: 'Supported keyword: work/bag, mouse, memory/ram, keyboard, headphones, cable/charger, storage/ssd, laptop' },
    { key: 'active', label: 'Active on storefront', type: 'checkbox', defaultValue: true },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 2 }}>
        Add add-on
      </Typography>
      <AdminEditForm collection="addons" fields={fields} cancelHref="/admin/addons" />
    </Box>
  );
}