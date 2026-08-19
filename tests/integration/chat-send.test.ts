import { describe, it, expect } from 'vitest';
import { getPayloadClient } from '@/lib/payload';
import { generateVisitorToken, hashVisitorToken } from '@/lib/chat';

describe('buyer message creation (real DB)', () => {
  it('creates a message with a numeric conversation id', async () => {
    const payload = await getPayloadClient();
    const token = generateVisitorToken();
    const convo = await payload.create({
      collection: 'conversations',
      data: { visitorTokenHash: hashVisitorToken(token), status: 'open' },
    });

    const message = await payload.create({
      collection: 'messages',
      data: { conversation: convo.id, sender: 'buyer', text: 'hello' },
    });
    expect(message.text).toBe('hello');

    await payload.delete({ collection: 'messages', id: message.id });
    await payload.delete({ collection: 'conversations', id: convo.id });
  });
});
