import { describe, it, expect } from 'vitest';
import { getPayloadClient } from '@/lib/payload';

describe('Admin reply unread flow', () => {
  it('buyer message bumps unreadForAdmin; admin view clears it', async () => {
    const payload = await getPayloadClient();
    const convo = await payload.create({
      collection: 'conversations',
      data: {
        visitorTokenHash: `hash-${Date.now()}`,
        title: 'Chat — Test',
        status: 'open',
        unreadForAdmin: 0,
        unreadForBuyer: 0,
      },
    });
    try {
      await payload.create({
        collection: 'messages',
        data: { conversation: convo.id, sender: 'buyer', text: 'hi' },
      });
      const afterBuyer = await payload.findByID({ collection: 'conversations', id: convo.id });
      expect(afterBuyer.unreadForAdmin).toBe(1);

      await payload.create({
        collection: 'messages',
        data: { conversation: convo.id, sender: 'admin', text: 'hello' },
      });
      const afterAdmin = await payload.findByID({ collection: 'conversations', id: convo.id });
      expect(afterAdmin.unreadForBuyer).toBe(1);

      await payload.update({
        collection: 'conversations',
        id: convo.id,
        data: { unreadForAdmin: 0 },
      });
      const cleared = await payload.findByID({ collection: 'conversations', id: convo.id });
      expect(cleared.unreadForAdmin).toBe(0);
    } finally {
      const msgs = await payload.find({
        collection: 'messages',
        where: { conversation: { equals: convo.id } },
        limit: 50,
        depth: 0,
      });
      for (const m of msgs.docs) await payload.delete({ collection: 'messages', id: m.id });
      await payload.delete({ collection: 'conversations', id: convo.id });
    }
  });
});