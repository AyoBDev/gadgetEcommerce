import { getPayloadClient } from '@/lib/payload';
import { AdminEditForm, type AdminFieldConfig } from '@/components/admin/AdminEditForm';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default async function AdminUserNewPage() {
  const fields: AdminFieldConfig[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'text', required: true },
    { key: 'password', label: 'Password', type: 'password', required: true },
    { key: 'role', label: 'Role', type: 'select', options: [
      { label: 'Staff', value: 'staff' },
      { label: 'Admin', value: 'admin' },
    ], required: true },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 2 }}>
        Add user
      </Typography>
      <AdminEditForm collection="users" fields={fields} cancelHref="/admin-v2/users" />
    </Box>
  );
}