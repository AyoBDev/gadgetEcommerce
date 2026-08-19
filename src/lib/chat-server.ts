import 'server-only';
import { generateVisitorToken, tokensMatch } from '@/lib/chat';

export const CHAT_COOKIE = 'js_chat_token';
export const CHAT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type CookieStore = {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, opts: Record<string, unknown>): void;
};

export function readOrCreateToken(store: CookieStore, isProd: boolean): { token: string; created: boolean } {
  const existing = store.get(CHAT_COOKIE)?.value;
  if (existing) return { token: existing, created: false };
  const token = generateVisitorToken();
  store.set(CHAT_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: CHAT_COOKIE_MAX_AGE,
  });
  return { token, created: true };
}

export type PayloadLike = {
  findByID(args: { collection: 'conversations'; id: string }): Promise<{ id: string; visitorTokenHash?: string } | null>;
};

export async function authorizeConversation(
  payload: PayloadLike,
  conversationId: string,
  rawToken: string | undefined,
): Promise<{ id: string; visitorTokenHash?: string } | null> {
  try {
    const convo = await payload.findByID({ collection: 'conversations', id: conversationId });
    if (!convo) return null;
    return tokensMatch(rawToken, convo.visitorTokenHash) ? convo : null;
  } catch {
    return null;
  }
}
