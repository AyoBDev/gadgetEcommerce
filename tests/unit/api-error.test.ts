import { describe, it, expect } from 'vitest';
import { formatApiError } from '@/lib/api-error';

describe('formatApiError', () => {
  it('prefers Payload field-level validation errors over the generic message', () => {
    const json = {
      message: 'The following field is invalid: slug',
      errors: [{ path: 'slug', message: 'Value must be unique' }],
    };
    expect(formatApiError(json, 'fallback')).toBe('slug: Value must be unique');
  });

  it('prefers the human-readable label over the raw path', () => {
    const json = {
      message: 'The following field is invalid: Price',
      errors: [{ label: 'Price', path: 'price', message: 'Must be a whole number.' }],
    };
    expect(formatApiError(json, 'fallback')).toBe('Price: Must be a whole number.');
  });

  it('joins multiple field errors', () => {
    const json = {
      errors: [
        { path: 'title', message: 'Required' },
        { path: 'price', message: 'Must be greater than 0' },
      ],
    };
    expect(formatApiError(json, 'fallback')).toBe('title: Required · price: Must be greater than 0');
  });

  it('omits the path when the error has none', () => {
    expect(formatApiError({ errors: [{ message: 'Something broke' }] }, 'fallback')).toBe('Something broke');
  });

  it('falls back to the top-level message when there are no field errors', () => {
    expect(formatApiError({ message: 'Unauthorized' }, 'fallback')).toBe('Unauthorized');
  });

  it('uses the fallback for empty, malformed, or null payloads', () => {
    expect(formatApiError(null, 'fallback')).toBe('fallback');
    expect(formatApiError({}, 'fallback')).toBe('fallback');
    expect(formatApiError({ errors: [] }, 'fallback')).toBe('fallback');
    expect(formatApiError('nope', 'fallback')).toBe('fallback');
    expect(formatApiError({ errors: [{ nope: true }] }, 'fallback')).toBe('fallback');
  });
});
