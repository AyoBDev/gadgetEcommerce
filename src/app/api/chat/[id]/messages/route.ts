import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPayloadClient } from '@/lib/payload';
import { authorizeConversation, CHAT_COOKIE } from '@/lib/chat-server';
import { sanitizeMessageText } from '@/lib/chat';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

async function tokenFromCookies() {
  const store = await cookies();
  return store.get(CHAT_COOKIE)?.value;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const conversationId = Number(id);
  if (!Number.isInteger(conversationId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const token = await tokenFromCookies();
  const payload = await getPayloadClient();
  const convo = await authorizeConversation(payload as any, String(conversationId), token);
  if (!convo) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const msgs = await payload.find({
    collection: 'messages',
    where: { conversation: { equals: conversationId } },
    sort: 'createdAt',
    limit: 200,
    depth: 0,
  });
  // Buyer viewing clears their unread count.
  await payload.update({ collection: 'conversations', id: conversationId, data: { unreadForBuyer: 0 } });

  return NextResponse.json({
    status: (convo as any).status ?? 'open',
    messages: msgs.docs.map((m: any) => ({ id: m.id, sender: m.sender, text: m.text, createdAt: m.createdAt })),
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const conversationId = Number(id);
  if (!Number.isInteger(conversationId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`chat-send:${ip}`, { limit: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const token = await tokenFromCookies();
  const payload = await getPayloadClient();
  const convo = await authorizeConversation(payload as any, String(conversationId), token);
  if (!convo) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const text = sanitizeMessageText(body?.text);
  if (!text) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

  const message = await payload.create({
    collection: 'messages',
    data: { conversation: conversationId, sender: 'buyer', text },
  });
  return NextResponse.json({
    message: { id: message.id, sender: 'buyer', text: message.text, createdAt: message.createdAt },
  }, { status: 201 });
}
