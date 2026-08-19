import Link from 'next/link';
import { getPayloadClient } from '@/lib/payload';
import type { Where } from 'payload';
import { AdminListTable, type AdminColumn } from '@/components/admin/AdminListTable';
import { AdminDeleteButton } from '@/components/admin/AdminDeleteButton';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import type { Category } from '@/payload-types';

const LIMIT = 20;

const TYPE_COLORS: Record<string, 'default' | 'info' | 'secondary'> = {
  brand: 'info',
  useCase: 'secondary',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminCategoriesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const payload = await getPayloadClient();
  const search = typeof params.search === 'string' ? params.search : undefined;
  const type = typeof params.type === 'string' ? params.type : undefined;
  const page = Math.max(1, parseInt(typeof params.page === 'string' ? params.page : '1', 10) || 1);

  const and: Where[] = [];
  if (type && type !== 'all') and.push({ type: { equals: type } });
  if (search) and.push({ or: [{ name: { contains: search } }, { slug: { contains: search } }] });
  const where: Where = and.length > 0 ? { and } : {};

  const result = await payload.find({
    collection: 'categories',
    where,
    sort: 'name',
    limit: LIMIT,
    page,
    depth: 0,
    select: {
      name: true,
      slug: true,
      type: true,
      updatedAt: true,
    },
  });

  const columns: AdminColumn<Category>[] = [
    {
      key: 'name',
      label: 'Category',
      render: (row) => (
        <Stack>
          <Typography variant="body2" fontWeight={600}>
            {row.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            /{row.slug}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => <Chip label={row.type === 'brand' ? 'Brand' : 'Use case'} size="small" color={TYPE_COLORS[row.type] ?? 'default'} />,
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      render: (row) => <Typography variant="body2">{new Date(row.updatedAt).toLocaleDateString()}</Typography>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => <AdminDeleteButton collection="categories" id={row.id} />,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 2 }}>
        Categories
      </Typography>
      <AdminListTable
        columns={columns}
        rows={result.docs as unknown as Category[]}
        rowKey={(row) => row.id}
        rowHref={(row) => `/admin-v2/categories/${row.id}`}
        totalDocs={result.totalDocs}
        page={page}
        limit={LIMIT}
        toolbar={
          <Button component={Link} href="/admin-v2/categories/new" variant="contained" size="small">
            Add category
          </Button>
        }
        emptyText="No categories found."
      />
    </Box>
  );
}