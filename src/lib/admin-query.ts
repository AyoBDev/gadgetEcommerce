export type ListParams = {
  sort?: string;
  limit?: number;
  page?: number;
  where?: Record<string, unknown>;
};

function serializeValue(key: string, value: unknown): string[] {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => serializeValue(`${key}[${i}]`, item));
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .flatMap(([k, v]) => serializeValue(`${key}[${k}]`, v));
  }
  return [`${key}=${encodeURIComponent(String(value))}`];
}

export function buildQueryString({ sort, limit, page, where }: ListParams): string {
  const parts: string[] = [];
  if (sort) parts.push(`sort=${sort}`);
  if (limit) parts.push(`limit=${limit}`);
  if (page) parts.push(`page=${page}`);
  if (where) {
    for (const [k, v] of Object.entries(where)) {
      parts.push(...serializeValue(`where[${k}]`, v));
    }
  }
  return parts.length ? `?${parts.join('&')}` : '';
}