export function applySaleToStock(
  current: { stock: number; status: string },
): { stock: number; status: string } {
  const stock = Math.max(0, current.stock - 1);
  const status = stock === 0 ? 'sold' : current.status;
  return { stock, status };
}
