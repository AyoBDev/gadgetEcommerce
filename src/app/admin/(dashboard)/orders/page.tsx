import { Suspense } from 'react';
import { getPayloadClient } from '@/lib/payload';
import type { Where } from 'payload';
import { AdminListTable, type AdminColumn } from '@/components/admin/AdminListTable';
import { OrderListToolbar } from '@/components/admin/OrderListToolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import { formatNaira } from '@/lib/money';
import type { Order, Laptop } from '@/payload-types';

const LIMIT = 20;

const PAYMENT_COLORS: Record<string, 'default' | 'success' | 'warning'> = {
  pending: 'warning',
  paid: 'success',
};

const DELIVERY_COLORS: Record<string, 'default' | 'success' | 'warning'> = {
  pending: 'warning',
  delivered: 'success',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const payload = await getPayloadClient();

  const paymentStatus = typeof params.payment === 'string' ? params.payment : undefined;
  const deliveryStatus = typeof params.delivery === 'string' ? params.delivery : undefined;
  const search = typeof params.search === 'string' ? params.search : undefined;
  const page = Math.max(1, parseInt(typeof params.page === 'string' ? params.page : '1', 10) || 1);

  const and: Where[] = [];
  if (paymentStatus && paymentStatus !== 'all') and.push({ paymentStatus: { equals: paymentStatus } });
  if (deliveryStatus && deliveryStatus !== 'all') and.push({ deliveryStatus: { equals: deliveryStatus } });
  if (search) {
    and.push({
      or: [
        { buyerName: { contains: search } },
        { buyerPhone: { contains: search } },
        { orderLabel: { contains: search } },
      ],
    });
  }
  const where: Where = and.length > 0 ? { and } : {};

  const result = await payload.find({
    collection: 'orders',
    where,
    sort: '-saleDate',
    limit: LIMIT,
    page,
    depth: 1,
    select: {
      laptop: true,
      salePrice: true,
      buyerName: true,
      buyerPhone: true,
      saleDate: true,
      paymentStatus: true,
      deliveryStatus: true,
      orderLabel: true,
      updatedAt: true,
    },
  });

  const columns: AdminColumn<Order>[] = [
    {
      key: 'orderLabel',
      label: 'Order',
      render: (row) => (
        <Stack>
          <Typography variant="body2" fontWeight={600}>
            {row.orderLabel ?? `Order #${row.id}`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(row.saleDate).toLocaleString()}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'laptop',
      label: 'Laptop',
      render: (row) => <Typography variant="body2">{(row.laptop as Laptop)?.title ?? '—'}</Typography>,
    },
    {
      key: 'salePrice',
      label: 'Sale price',
      render: (row) => <Typography variant="body2">{formatNaira(row.salePrice)}</Typography>,
    },
    {
      key: 'buyer',
      label: 'Buyer',
      render: (row) => (
        <Stack>
          <Typography variant="body2">{row.buyerName || '—'}</Typography>
          <Typography variant="caption" color="text.secondary">{row.buyerPhone || ''}</Typography>
        </Stack>
      ),
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (row) => <Chip label={row.paymentStatus ?? 'pending'} size="small" color={row.paymentStatus ? PAYMENT_COLORS[row.paymentStatus] ?? 'default' : 'default'} />,
    },
    {
      key: 'deliveryStatus',
      label: 'Delivery',
      render: (row) => <Chip label={row.deliveryStatus ?? 'pending'} size="small" color={row.deliveryStatus ? DELIVERY_COLORS[row.deliveryStatus] ?? 'default' : 'default'} />,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 2 }}>
        Orders
      </Typography>
      <AdminListTable
        columns={columns}
        rows={result.docs as unknown as Order[]}
        rowKey={(row) => row.id}
        rowHref={(row) => `/admin/orders/${row.id}`}
        totalDocs={result.totalDocs}
        page={page}
        limit={LIMIT}
        toolbar={
          <Suspense fallback={null}>
            <OrderListToolbar />
          </Suspense>
        }
        emptyText="No orders match these filters."
      />
    </Box>
  );
}