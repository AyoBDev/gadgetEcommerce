import { describe, it, expect } from 'vitest';
import { getPayloadClient } from '@/lib/payload';

describe('chat data model', () => {
  it('creating a message bumps conversation lastMessageAt and admin unread', async () => {
    const payload = await getPayloadClient();
    const convo = await payload.create({
      collection: 'conversations',
      data: { visitorTokenHash: 'a'.repeat(64), status: 'open' },
    });
    expect(convo.unreadForAdmin).toBe(0);

    const msg = await payload.create({
      collection: 'messages',
      data: { conversation: convo.id, sender: 'buyer', text: '  hello  ' },
    });
    // text was sanitized on the way in
    expect(msg.text).toBe('hello');

    const after = await payload.findByID({ collection: 'conversations', id: convo.id });
    expect(after.unreadForAdmin).toBe(1);
    expect(after.unreadForBuyer).toBe(0);
    expect(after.lastMessageAt).toBeTruthy();

    // admin reply bumps buyer unread, not admin
    const reply = await payload.create({
      collection: 'messages',
      data: { conversation: convo.id, sender: 'admin', text: 'hi there' },
    });
    const after2 = await payload.findByID({ collection: 'conversations', id: convo.id });
    expect(after2.unreadForBuyer).toBe(1);
    expect(after2.unreadForAdmin).toBe(1);

    // The messages FK is ON DELETE SET NULL but conversation_id is NOT NULL,
    // so every message must be removed before the conversation can be deleted.
    await payload.delete({ collection: 'messages', id: msg.id });
    await payload.delete({ collection: 'messages', id: reply.id });
    await payload.delete({ collection: 'conversations', id: convo.id });
  });
});
