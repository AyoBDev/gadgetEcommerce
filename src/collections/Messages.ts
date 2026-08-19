import type { CollectionConfig } from 'payload';
import { sanitizeMessageText } from '@/lib/chat';

export const Messages: CollectionConfig = {
  slug: 'messages',
  admin: {
    group: 'Support',
    useAsTitle: 'text',
    defaultColumns: ['conversation', 'sender', 'text', 'createdAt'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'conversation', type: 'relationship', relationTo: 'conversations',
      required: true, index: true },
    { name: 'sender', type: 'select', required: true, options: [
      { label: 'Buyer', value: 'buyer' },
      { label: 'Admin', value: 'admin' },
    ]},
    { name: 'text', type: 'text', required: true,
      hooks: { beforeValidate: [({ value }) => sanitizeMessageText(value)] } },
    { name: 'readAt', type: 'date' },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation !== 'create') return;
        const convoId = typeof doc.conversation === 'object' ? doc.conversation.id : doc.conversation;
        try {
          const convo = await req.payload.findByID({ collection: 'conversations', id: convoId });
          if (!convo) return;
          const bumpAdmin = doc.sender === 'buyer';
          await req.payload.update({
            collection: 'conversations',
            id: convoId,
            data: {
              lastMessageAt: new Date().toISOString(),
              unreadForAdmin: (convo.unreadForAdmin ?? 0) + (bumpAdmin ? 1 : 0),
              unreadForBuyer: (convo.unreadForBuyer ?? 0) + (bumpAdmin ? 0 : 1),
            },
            req,
          });
        } catch (err) {
          req.payload.logger.error({ err, msg: 'Failed to update conversation after message create', convoId });
        }
      },
    ],
  },
};
