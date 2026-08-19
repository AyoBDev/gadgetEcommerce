import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { formatNaira } from '@/lib/money';

export const MAX_MESSAGE_LEN = 2000;

export function generateVisitorToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashVisitorToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function tokensMatch(rawToken: string | undefined, storedHash: string | undefined): boolean {
  if (!rawToken || !storedHash) return false;
  try {
    const a = Buffer.from(hashVisitorToken(rawToken), 'hex');
    const b = Buffer.from(storedHash, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function sanitizeMessageText(input: unknown): string {
  if (typeof input !== 'string') return '';
  // Drop control chars except tab/newline; normalize CRLF to LF.
  const cleaned = input
    .replace(/\r\n?/g, '\n')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .trim();
  return cleaned.slice(0, MAX_MESSAGE_LEN);
}

export type LaptopContext = { title: string; price: number; url: string };

export function buildLaptopSummary(laptop: LaptopContext): string {
  return `${laptop.title} — ${formatNaira(laptop.price)}`;
}

export function isTypingActive(at: string | Date | null | undefined, ttlMs = 5000): boolean {
  if (!at) return false;
  const t = new Date(at).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < ttlMs;
}
