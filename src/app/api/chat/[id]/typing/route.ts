import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPayloadClient } from '@/lib/payload';
import { authorizeConversation, CHAT_COOKIE } from '@/lib/chat-server';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

async function tokenFromCookies() {
  const store = await cookies();
  return store.get(CHAT_COOKIE)?.value;
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const conversationId = Number(id);
  if (!Number.isInteger(conversationId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`chat-typing:${ip}`, { limit: 60, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const token = await tokenFromCookies();
  const payload = await getPayloadClient();
  const convo = await authorizeConversation(payload as any, String(conversationId), token);
  if (!convo) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await payload.update({
    collection: 'conversations',
    id: conversationId,
    data: { buyerTypingAt: new Date().toISOString() },
  });

  return new NextResponse(null, { status: 204 });
}
