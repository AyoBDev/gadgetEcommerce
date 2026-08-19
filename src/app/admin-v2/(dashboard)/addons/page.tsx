import Link from 'next/link';
import { getPayloadClient } from '@/lib/payload';
import { AdminListTable, type AdminColumn } from '@/components/admin/AdminListTable';
import { AdminDeleteButton } from '@/components/admin/AdminDeleteButton';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { formatNaira } from '@/lib/money';
import type { Addon } from '@/payload-types';

const LIMIT = 20;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminAddonsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const payload = await getPayloadClient();
  const search = typeof params.search === 'string' ? params.search : undefined;
  const page = Math.max(1, parseInt(typeof params.page === 'string' ? params.page : '1', 10) || 1);

  const result = await payload.find({
    collection: 'addons',
    where: search ? { name: { contains: search } } : {},
    sort: 'name',
    limit: LIMIT,
    page,
    depth: 0,
    select: {
      name: true,
      price: true,
      icon: true,
      active: true,
      updatedAt: true,
    },
  });

  const columns: AdminColumn<Addon>[] = [
    { key: 'name', label: 'Add-on', render: (row) => <Typography variant="body2" fontWeight={600}>{row.name}</Typography> },
    { key: 'price', label: 'Price', render: (row) => <Typography variant="body2">{formatNaira(row.price)}</Typography> },
    { key: 'icon', label: 'Icon', render: (row) => <Typography variant="body2">{row.icon || '—'}</Typography> },
    {
      key: 'active',
      label: 'Status',
      render: (row) => <Chip label={row.active ? 'Active' : 'Hidden'} size="small" color={row.active ? 'success' : 'default'} />,
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      render: (row) => <Typography variant="body2">{new Date(row.updatedAt).toLocaleDateString()}</Typography>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => <AdminDeleteButton collection="addons" id={row.id} />,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 2 }}>
        Add-ons
      </Typography>
      <AdminListTable
        columns={columns}
        rows={result.docs as unknown as Addon[]}
        rowKey={(row) => row.id}
        rowHref={(row) => `/admin-v2/addons/${row.id}`}
        totalDocs={result.totalDocs}
        page={page}
        limit={LIMIT}
        toolbar={
          <Button component={Link} href="/admin-v2/addons/new" variant="contained" size="small">
            Add add-on
          </Button>
        }
        emptyText="No add-ons found."
      />
    </Box>
  );
}