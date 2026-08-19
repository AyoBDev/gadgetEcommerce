import { Suspense } from 'react';
import { getPayloadClient } from '@/lib/payload';
import type { Where } from 'payload';
import { AdminListTable, type AdminColumn } from '@/components/admin/AdminListTable';
import { AdminDeleteButton } from '@/components/admin/AdminDeleteButton';
import { UserListToolbar } from '@/components/admin/UserListToolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import type { User } from '@/payload-types';

const LIMIT = 20;

const ROLE_COLORS: Record<string, 'default' | 'primary' | 'secondary'> = {
  admin: 'primary',
  staff: 'default',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const payload = await getPayloadClient();
  const search = typeof params.search === 'string' ? params.search : undefined;
  const role = typeof params.role === 'string' ? params.role : undefined;
  const page = Math.max(1, parseInt(typeof params.page === 'string' ? params.page : '1', 10) || 1);

  const and: Where[] = [];
  if (role && role !== 'all') and.push({ role: { equals: role } });
  if (search) and.push({ or: [{ email: { contains: search } }, { name: { contains: search } }] });
  const where: Where = and.length > 0 ? { and } : {};

  const result = await payload.find({
    collection: 'users',
    where,
    sort: 'name',
    limit: LIMIT,
    page,
    depth: 0,
    select: {
      email: true,
      name: true,
      role: true,
      updatedAt: true,
    },
  });

  const columns: AdminColumn<User>[] = [
    {
      key: 'email',
      label: 'User',
      render: (row) => (
        <Stack>
          <Typography variant="body2" fontWeight={600}>
            {row.email}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.name}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => <Chip label={row.role} size="small" color={ROLE_COLORS[row.role] ?? 'default'} />,
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      render: (row) => <Typography variant="body2">{new Date(row.updatedAt).toLocaleDateString()}</Typography>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => <AdminDeleteButton collection="users" id={row.id} />,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 2 }}>
        Users
      </Typography>
      <AdminListTable
        columns={columns}
        rows={result.docs as unknown as User[]}
        rowKey={(row) => row.id}
        rowHref={(row) => `/admin-v2/users/${row.id}`}
        totalDocs={result.totalDocs}
        page={page}
        limit={LIMIT}
        toolbar={
          <Suspense fallback={null}>
            <UserListToolbar />
          </Suspense>
        }
        emptyText="No users found."
      />
    </Box>
  );
}