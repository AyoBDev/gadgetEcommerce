import { describe, it, expect } from 'vitest';
import { buildQueryString } from '@/lib/admin-query';

describe('buildQueryString', () => {
  it('serializes sort, limit, and page', () => {
    expect(buildQueryString({ sort: '-updatedAt', limit: 24, page: 2 }))
      .toContain('sort=-updatedAt');
    expect(buildQueryString({ sort: '-updatedAt', limit: 24, page: 2 }))
      .toContain('limit=24');
    expect(buildQueryString({ sort: '-updatedAt', limit: 24, page: 2 }))
      .toContain('page=2');
  });
  it('serializes a nested where clause as where[a][b][equals]=v', () => {
    const qs = buildQueryString({ where: { status: { equals: 'published' } } });
    expect(qs).toContain('where[status][equals]=published');
  });
  it('handles array where values (and-clauses)', () => {
    const qs = buildQueryString({
      where: { and: [{ status: { equals: 'published' } }, { stock: { greater_than: 0 } }] },
    });
    expect(qs).toContain('where[and][0][status][equals]=published');
    expect(qs).toContain('where[and][1][stock][greater_than]=0');
  });
  it('omits empty/undefined params', () => {
    expect(buildQueryString({})).toBe('');
    expect(buildQueryString({ sort: '', limit: undefined, page: undefined, where: undefined })).toBe('');
  });
  it('encodes special characters in values', () => {
    const qs = buildQueryString({ where: { title: { contains: 'MacBook Pro 14"' } } });
    expect(qs).toContain('where[title][contains]=MacBook%20Pro%2014%22');
  });
});