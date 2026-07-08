import { getPayload } from 'payload';
import type { Where } from 'payload';
import config from '@/payload.config';
import { formatNaira } from '@/lib/money';
import { computeRevenue, monthStart } from '@/lib/dashboard-stats';
import styles from './DashboardStats.module.scss';

// `where` is typed as Payload's exported `Where` (not the brief's `object`) so this typechecks against the installed version.
async function countLaptops(payload: Awaited<ReturnType<typeof getPayload>>, where: Where) {
  const res = await payload.count({ collection: 'laptops', where });
  return res.totalDocs;
}

const DASH = '—';

export default async function DashboardStats() {
  const payload = await getPayload({ config });
  const now = new Date();

  const [publishedResult, outOfStockResult, lowStockResult, monthOrdersResult, pendingResult] = await Promise.allSettled([
    countLaptops(payload, { status: { equals: 'published' } }),
    countLaptops(payload, { and: [{ status: { equals: 'published' } }, { stock: { equals: 0 } }] }),
    countLaptops(payload, { and: [{ status: { equals: 'published' } }, { stock: { greater_than: 0 } }, { stock: { less_than_equal: 2 } }] }),
    payload.find({ collection: 'orders', limit: 1000, where: { saleDate: { greater_than_equal: monthStart(now).toISOString() } } }),
    payload.count({ collection: 'orders', where: { deliveryStatus: { equals: 'pending' } } }),
  ]);

  const logFailure = (stat: string, err: unknown) => {
    if (typeof payload.logger?.error === 'function') {
      payload.logger.error({ err, msg: 'dashboard stat query failed', stat });
    } else {
      console.error('dashboard stat query failed', stat, err);
    }
  };

  const published = publishedResult.status === 'fulfilled' ? String(publishedResult.value) : DASH;
  if (publishedResult.status === 'rejected') logFailure('published', publishedResult.reason);

  const outOfStock = outOfStockResult.status === 'fulfilled' ? String(outOfStockResult.value) : DASH;
  if (outOfStockResult.status === 'rejected') logFailure('outOfStock', outOfStockResult.reason);

  const lowStock = lowStockResult.status === 'fulfilled' ? String(lowStockResult.value) : DASH;
  if (lowStockResult.status === 'rejected') logFailure('lowStock', lowStockResult.reason);

  const monthOrdersCount = monthOrdersResult.status === 'fulfilled' ? String(monthOrdersResult.value.totalDocs) : DASH;
  if (monthOrdersResult.status === 'rejected') logFailure('monthOrders', monthOrdersResult.reason);

  const revenue =
    monthOrdersResult.status === 'fulfilled'
      ? formatNaira(computeRevenue(monthOrdersResult.value.docs.map((o) => ({ salePrice: o.salePrice }))))
      : DASH;

  const pending = pendingResult.status === 'fulfilled' ? String(pendingResult.value.totalDocs) : DASH;
  if (pendingResult.status === 'rejected') logFailure('pending', pendingResult.reason);

  const cards = [
    { label: 'Published', value: published, href: '/admin/collections/laptops?where[status][equals]=published' },
    { label: 'Out of stock', value: outOfStock, href: '/admin/collections/laptops?where[stock][equals]=0' },
    {
      label: 'Low stock (1–2)',
      value: lowStock,
      href: '/admin/collections/laptops?where[and][0][status][equals]=published&where[and][1][stock][greater_than]=0&where[and][2][stock][less_than_equal]=2',
    },
    { label: 'Sales this month', value: monthOrdersCount, href: '/admin/collections/orders' },
    { label: 'Revenue this month', value: revenue, href: '/admin/collections/orders' },
    { label: 'Pending deliveries', value: pending, href: '/admin/collections/orders?where[deliveryStatus][equals]=pending' },
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {cards.map((c) => (
          <a key={c.label} className={styles.card} href={c.href}>
            <span className={styles.label}>{c.label}</span>
            <span className={styles.value}>{c.value}</span>
          </a>
        ))}
      </div>
      <div className={styles.actions}>
        <a className={styles.action} href="/admin/collections/orders/create">Record a sale</a>
        <a className={styles.action} href="/admin/collections/laptops/create">Add laptop</a>
        <a className={styles.action} href="/" target="_blank" rel="noreferrer">View storefront</a>
      </div>
    </div>
  );
}
