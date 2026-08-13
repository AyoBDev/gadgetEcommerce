import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPayloadClient } from '@/lib/payload';
import { readOrCreateToken } from '@/lib/chat-server';
import { hashVisitorToken, buildLaptopSummary } from '@/lib/chat';
import { rateLimit } from '@/lib/rate-limit';
import type { Conversation } from '@/payload-types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const store = await cookies();
  const isProd = process.env.NODE_ENV === 'production';
  const { token } = readOrCreateToken(store, isProd);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`chat-create:${ip}`, { limit: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const laptop = body?.laptop as { id: string; title: string; price: number; url: string } | undefined;

  const payload = await getPayloadClient();
  const data: Record<string, unknown> = {
    visitorTokenHash: hashVisitorToken(token),
    status: 'open',
  };
  if (laptop?.id) {
    data.laptop = laptop.id;
    data.laptopSummary = buildLaptopSummary(laptop);
    data.laptopUrl = laptop.url;
  }
  const convo = await payload.create({
    collection: 'conversations',
    data: data as unknown as Omit<Conversation, 'id' | 'updatedAt' | 'createdAt'>,
  });
  return NextResponse.json({ conversationId: convo.id, messages: [] }, { status: 201 });
}
