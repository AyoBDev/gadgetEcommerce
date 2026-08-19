import { describe, it, expect } from 'vitest';
import { getPayloadClient } from '@/lib/payload';
import { authorizeConversation } from '@/lib/chat-server';
import { generateVisitorToken, hashVisitorToken } from '@/lib/chat';

describe('conversation authorization (real DB)', () => {
  it('one buyer cannot access another buyer conversation', async () => {
    const payload = await getPayloadClient();
    const tokenA = generateVisitorToken();
    const tokenB = generateVisitorToken();
    const convo = await payload.create({
      collection: 'conversations',
      data: { visitorTokenHash: hashVisitorToken(tokenA), status: 'open' },
    });

    const convoId = String(convo.id);
    expect(await authorizeConversation(payload as any, convoId, tokenA)).toBeTruthy();
    expect(await authorizeConversation(payload as any, convoId, tokenB)).toBeNull();
    expect(await authorizeConversation(payload as any, convoId, undefined)).toBeNull();

    await payload.delete({ collection: 'conversations', id: convo.id });
  });
});
