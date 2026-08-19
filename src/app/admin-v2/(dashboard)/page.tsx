import Link from 'next/link';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import { getPayloadClient } from '@/lib/payload';
import { getDashboardStats } from '@/lib/dashboard-stats';
import { formatNaira } from '@/lib/money';

type DashboardCard = { label: string; value: string; href: string };

export default async function AdminDashboardPage() {
  const payload = await getPayloadClient();
  const stats = await getDashboardStats(payload);
  const [lowStockRes, recentOrdersRes] = await Promise.allSettled([
    payload.find({
      collection: 'laptops',
      limit: 6,
      where: { and: [{ status: { equals: 'published' } }, { stock: { greater_than: 0 } }, { stock: { less_than_equal: 2 } }] },
      select: { title: true, slug: true, stock: true },
    }),
    payload.find({ collection: 'orders', limit: 10, sort: '-saleDate', depth: 1 }),
  ]);

  const cards: DashboardCard[] = [
    { label: 'Published', value: String(stats.publishedCount), href: '/admin-v2/laptops?status=published' },
    { label: 'Out of stock', value: String(stats.outOfStockCount), href: '/admin-v2/laptops?status=published&stock=out' },
    { label: 'Low stock (1–2)', value: String(stats.lowStockCount), href: '/admin-v2/laptops?status=published&stock=low' },
    { label: 'Sales this month', value: String(stats.salesThisMonth), href: '/admin-v2/orders' },
    { label: 'Revenue this month', value: formatNaira(stats.revenueThisMonthKobo), href: '/admin-v2/orders' },
    { label: 'Pending deliveries', value: String(stats.pendingDeliveries), href: '/admin-v2/orders?deliveryStatus=pending' },
  ];

  const recentOrders = recentOrdersRes.status === 'fulfilled' ? recentOrdersRes.value.docs : [];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Dashboard
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button component={Link} href="/admin-v2/laptops/new" variant="contained">
            Add laptop
          </Button>
          <Button component={Link} href="/admin-v2/orders/new" variant="outlined">
            Record a sale
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {cards.map((card) => (
          <Grid key={card.label} xs={12} sm={6} md={4}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
              <CardContent component={Link} href={card.href} sx={{ display: 'block', textDecoration: 'none' }}>
                <Typography variant="body2" color="text.secondary">
                  {card.label}
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid xs={12} lg={8}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight={700}>
                Recent orders
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Laptop</TableCell>
                    <TableCell>Sale price</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Delivery</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography color="text.secondary">No orders yet.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{(order.laptop as { title?: string })?.title ?? `#${order.id}`}</TableCell>
                      <TableCell>{formatNaira(order.salePrice)}</TableCell>
                      <TableCell>{new Date(order.saleDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.paymentStatus ?? 'pending'}
                          size="small"
                          color={order.paymentStatus === 'paid' ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.deliveryStatus ?? 'pending'}
                          size="small"
                          color={order.deliveryStatus === 'delivered' ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
        <Grid xs={12} lg={4}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider', mb: 3 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight={700}>
                Low stock
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              {lowStockRes.status !== 'fulfilled' || lowStockRes.value.docs.length === 0 ? (
                <Typography color="text.secondary">All good — no low-stock laptops.</Typography>
              ) : (
                <Stack spacing={1}>
                  {lowStockRes.value.docs.map((laptop) => (
                    <Box
                      key={laptop.id}
                      component={Link}
                      href={`/admin-v2/laptops/${laptop.id}`}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        textDecoration: 'none',
                        p: 1,
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'grey.50' },
                      }}
                    >
                      <Typography variant="body2">{laptop.title}</Typography>
                      <Chip label={`${laptop.stock} left`} size="small" color="warning" variant="outlined" />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
</Box>
  );
}