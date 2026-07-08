import { describe, it, expect } from 'vitest';
import { applySaleToStock } from '@/lib/inventory';

describe('applySaleToStock', () => {
  it('decrements stock and keeps status when stock remains', () => {
    expect(applySaleToStock({ stock: 3, status: 'published' }))
      .toEqual({ stock: 2, status: 'published' });
  });

  it('marks sold when stock reaches zero', () => {
    expect(applySaleToStock({ stock: 1, status: 'published' }))
      .toEqual({ stock: 0, status: 'sold' });
  });

  it('never goes below zero and marks sold', () => {
    expect(applySaleToStock({ stock: 0, status: 'published' }))
      .toEqual({ stock: 0, status: 'sold' });
  });

  it('leaves an already-sold laptop sold at zero', () => {
    expect(applySaleToStock({ stock: 0, status: 'sold' }))
      .toEqual({ stock: 0, status: 'sold' });
  });
});
