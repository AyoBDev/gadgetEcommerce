import { describe, it, expect } from 'vitest';
import { validateKobo } from '@/lib/validate-kobo';

// The built-in Payload validation this delegates to needs `req.t` to resolve
// its own error strings; a passthrough stub keeps the assertions readable.
const t = (key: string) => key;

function run(value: number | null | undefined, opts: { required?: boolean; min?: number; max?: number } = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return validateKobo(value as any, { req: { t }, ...opts } as any);
}

describe('validateKobo', () => {
  it('accepts whole kobo amounts', () => {
    expect(run(45_000_000, { required: true })).toBe(true);
    expect(run(0, { required: true, min: 0 })).toBe(true);
  });

  it('rejects a fractional amount', () => {
    const result = run(45_000_000.5, { required: true });
    expect(typeof result).toBe('string');
    expect(result).toMatch(/whole number/i);
  });

  it('rejects non-finite amounts', () => {
    expect(typeof run(Number.NaN, { required: true })).toBe('string');
    expect(typeof run(Number.POSITIVE_INFINITY, { required: true })).toBe('string');
  });

  it('allows an empty optional field', () => {
    expect(run(null)).toBe(true);
    expect(run(undefined)).toBe(true);
  });

  // A custom `validate` replaces Payload's built-in entirely, so these guard
  // against silently dropping required/min/max enforcement.
  it('still enforces required', () => {
    expect(typeof run(null, { required: true })).toBe('string');
  });

  it('still enforces min', () => {
    expect(typeof run(-1, { required: true, min: 0 })).toBe('string');
  });

  it('still enforces max', () => {
    expect(typeof run(500, { required: true, max: 100 })).toBe('string');
  });
});
