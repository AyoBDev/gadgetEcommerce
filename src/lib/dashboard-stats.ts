import type { Payload } from 'payload';

export type DashboardStats = {
  publishedCount: number;
  outOfStockCount: number;
  lowStockCount: number;
  salesThisMonth: number;
  revenueThisMonthKobo: number;
  pendingDeliveries: number;
};

export function computeRevenue(orders: { salePrice: number }[]): number {
  return orders.reduce((sum, o) => sum + o.salePrice, 0);
}

export function monthStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function getDashboardStats(payload: Payload): Promise<DashboardStats> {
  const now = new Date();

  const [publishedResult, outOfStockResult, lowStockResult, monthOrdersResult, pendingResult] =
    await Promise.allSettled([
      payload.count({ collection: 'laptops', where: { status: { equals: 'published' } } }),
      payload.count({
        collection: 'laptops',
        where: { and: [{ status: { equals: 'published' } }, { stock: { equals: 0 } }] },
      }),
      payload.count({
        collection: 'laptops',
        where: {
          and: [
            { status: { equals: 'published' } },
            { stock: { greater_than: 0 } },
            { stock: { less_than_equal: 2 } },
          ],
        },
      }),
      payload.find({
        collection: 'orders',
        limit: 1000,
        where: { saleDate: { greater_than_equal: monthStart(now).toISOString() } },
      }),
      payload.count({ collection: 'orders', where: { deliveryStatus: { equals: 'pending' } } }),
    ]);

  const logFailure = (stat: string, err: unknown) => {
    if (typeof payload.logger?.error === 'function') {
      payload.logger.error({ err, msg: 'dashboard stat query failed', stat });
    } else {
      console.error('dashboard stat query failed', stat, err);
    }
  };

  const value = (result: PromiseSettledResult<{ totalDocs: number }>, stat: string) => {
    if (result.status === 'fulfilled') return result.value.totalDocs;
    logFailure(stat, result.reason);
    return 0;
  };

  return {
    publishedCount: value(publishedResult, 'published'),
    outOfStockCount: value(outOfStockResult, 'outOfStock'),
    lowStockCount: value(lowStockResult, 'lowStock'),
    salesThisMonth: value(monthOrdersResult, 'monthOrders'),
    revenueThisMonthKobo:
      monthOrdersResult.status === 'fulfilled'
        ? computeRevenue(monthOrdersResult.value.docs.map((o) => ({ salePrice: o.salePrice })))
        : 0,
    pendingDeliveries: value(pendingResult, 'pending'),
  };
}
