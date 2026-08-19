import { getPayloadClient } from '@/lib/payload';
import type { Where } from 'payload';
import { AdminListTable, type AdminColumn } from '@/components/admin/AdminListTable';
import { LaptopListToolbar } from '@/components/admin/LaptopListToolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import { formatNaira } from '@/lib/money';
import type { Laptop, Category } from '@/payload-types';

const LIMIT = 20;

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  draft: 'default',
  published: 'success',
  sold: 'error',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminLaptopsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const payload = await getPayloadClient();

  const status = typeof params.status === 'string' ? params.status : undefined;
  const stock = typeof params.stock === 'string' ? params.stock : undefined;
  const search = typeof params.search === 'string' ? params.search : undefined;
  const page = Math.max(1, parseInt(typeof params.page === 'string' ? params.page : '1', 10) || 1);

  const and: Where[] = [];
  if (status && status !== 'all') and.push({ status: { equals: status } });
  if (stock === 'out') and.push({ stock: { equals: 0 } });
  if (stock === 'low') {
    and.push({ stock: { greater_than: 0 } }, { stock: { less_than_equal: 2 } });
  }
  if (search) {
    and.push({ or: [{ title: { contains: search } }, { slug: { contains: search } }] });
  }

  const where: Where = and.length > 0 ? { and } : {};

  const result = await payload.find({
    collection: 'laptops',
    where,
    sort: '-updatedAt',
    limit: LIMIT,
    page,
    depth: 1,
    select: {
      title: true,
      slug: true,
      brand: true,
      price: true,
      status: true,
      stock: true,
      condition: true,
      updatedAt: true,
    },
  });

  const columns: AdminColumn<Laptop>[] = [
    {
      key: 'title',
      label: 'Laptop',
      render: (row) => (
        <Stack>
          <Typography variant="body2" fontWeight={600}>
            {row.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            /laptops/{row.slug}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'brand',
      label: 'Brand',
      render: (row) => <Typography variant="body2">{(row.brand as Category)?.name ?? '—'}</Typography>,
    },
    { key: 'price', label: 'Price', render: (row) => <Typography variant="body2">{formatNaira(row.price)}</Typography> },
    {
      key: 'stock',
      label: 'Stock',
      render: (row) => (
        <Chip
          label={String(row.stock)}
          size="small"
          variant="outlined"
          color={row.stock === 0 ? 'error' : row.stock <= 2 ? 'warning' : 'default'}
        />
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Chip label={row.status} size="small" color={STATUS_COLORS[row.status] ?? 'default'} />,
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      render: (row) => <Typography variant="body2">{new Date(row.updatedAt).toLocaleDateString()}</Typography>,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 2 }}>
        Laptops
      </Typography>
      <AdminListTable
        columns={columns}
        rows={result.docs as unknown as Laptop[]}
        rowKey={(row) => row.id}
        rowHref={(row) => `/admin-v2/laptops/${row.id}`}
        totalDocs={result.totalDocs}
        page={page}
        limit={LIMIT}
        toolbar={<LaptopListToolbar />}
        emptyText="No laptops match these filters."
      />
    </Box>
  );
}