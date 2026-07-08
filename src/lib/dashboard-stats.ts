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
