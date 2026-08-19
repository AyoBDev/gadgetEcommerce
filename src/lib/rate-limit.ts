type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, opts?: { limit?: number; windowMs?: number }): boolean {
  const limit = opts?.limit ?? 20;
  const windowMs = opts?.windowMs ?? 60_000;
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

export function _resetRateLimits(): void {
  buckets.clear();
}
