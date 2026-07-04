import { describe, it, expect } from 'vitest';
import { generateSlug } from '@/lib/slug';

describe('generateSlug', () => {
  it('lowercases and hyphenates', () => {
    expect(generateSlug('HP EliteBook 840 G5')).toBe('hp-elitebook-840-g5');
  });

  it('collapses whitespace', () => {
    expect(generateSlug('  HP   EliteBook   ')).toBe('hp-elitebook');
  });

  it('strips non-ASCII', () => {
    expect(generateSlug('Café laptop')).toBe('cafe-laptop');
  });

  it('handles quotes and punctuation', () => {
    expect(generateSlug('MacBook Pro 13" 2019 TouchBar')).toBe('macbook-pro-13-2019-touchbar');
  });

  it('returns empty string for empty input', () => {
    expect(generateSlug('')).toBe('');
  });
});
