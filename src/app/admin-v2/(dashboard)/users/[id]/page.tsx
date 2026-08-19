import { notFound } from 'next/navigation';
import { getPayloadClient } from '@/lib/payload';
import { AdminEditForm, type AdminFieldConfig } from '@/components/admin/AdminEditForm';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { User } from '@/payload-types';

type Props = { params: Promise<{ id: string }> };

export default async function AdminUserEditPage({ params }: Props) {
  const { id } = await params;
  const payload = await getPayloadClient();
  const user = await payload.findByID({ collection: 'users', id, depth: 0 }).catch(() => null);
  if (!user) notFound();

  const fields: AdminFieldConfig[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'text', required: true },
    { key: 'password', label: 'Password', type: 'password', helperText: 'Leave blank to keep the current password' },
    { key: 'role', label: 'Role', type: 'select', options: [
      { label: 'Staff', value: 'staff' },
      { label: 'Admin', value: 'admin' },
    ], required: true },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 2 }}>
        Edit user
      </Typography>
      <AdminEditForm
        collection="users"
        id={id}
        initial={user as unknown as Record<string, unknown>}
        fields={fields}
        cancelHref="/admin-v2/users"
      />
    </Box>
  );
}