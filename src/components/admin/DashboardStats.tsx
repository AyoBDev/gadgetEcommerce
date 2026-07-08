import { getPayload } from 'payload';
import type { Where } from 'payload';
import config from '@/payload.config';
import { formatNaira } from '@/lib/money';
import { computeRevenue, monthStart } from '@/lib/dashboard-stats';
import styles from './DashboardStats.module.scss';

async function countLaptops(payload: Awaited<ReturnType<typeof getPayload>>, where: Where) {
  const res = await payload.count({ collection: 'laptops', where });
  return res.totalDocs;
}

export default async function DashboardStats() {
  const payload = await getPayload({ config });
  const now = new Date();

  const [published, outOfStock, lowStock, monthOrders, pending] = await Promise.all([
    countLaptops(payload, { status: { equals: 'published' } }),
    countLaptops(payload, { and: [{ status: { equals: 'published' } }, { stock: { equals: 0 } }] }),
    countLaptops(payload, { and: [{ status: { equals: 'published' } }, { stock: { greater_than: 0 } }, { stock: { less_than_equal: 2 } }] }),
    payload.find({ collection: 'orders', limit: 1000, where: { saleDate: { greater_than_equal: monthStart(now).toISOString() } } }),
    payload.count({ collection: 'orders', where: { deliveryStatus: { equals: 'pending' } } }),
  ]);

  const revenue = computeRevenue(monthOrders.docs.map((o) => ({ salePrice: o.salePrice })));

  const cards = [
    { label: 'Published', value: String(published), href: '/admin/collections/laptops?where[status][equals]=published' },
    { label: 'Out of stock', value: String(outOfStock), href: '/admin/collections/laptops?where[stock][equals]=0' },
    { label: 'Low stock (1–2)', value: String(lowStock), href: '/admin/collections/laptops' },
    { label: 'Sales this month', value: String(monthOrders.totalDocs), href: '/admin/collections/orders' },
    { label: 'Revenue this month', value: formatNaira(revenue), href: '/admin/collections/orders' },
    { label: 'Pending deliveries', value: String(pending.totalDocs), href: '/admin/collections/orders?where[deliveryStatus][equals]=pending' },
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
