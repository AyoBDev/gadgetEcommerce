import type { CollectionConfig } from 'payload';

export const Conversations: CollectionConfig = {
  slug: 'conversations',
  admin: {
    group: 'Support',
    useAsTitle: 'title',
    defaultColumns: ['title', 'laptop', 'status', 'unreadForAdmin', 'lastMessageAt'],
    listSearchableFields: ['laptopSummary'],
  },
  access: {
    // Buyers never touch this collection directly — only token-authorized
    // route handlers (Task 4) using payload.* on the server, and admins.
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'visitorTokenHash', type: 'text', required: true, index: true,
      admin: { hidden: true } },
    { name: 'title', type: 'text', admin: { hidden: true },
      hooks: {
        beforeChange: [
          ({ data, value }) =>
            value ?? (data?.laptopSummary ? `Chat — ${data.laptopSummary}` : 'Chat — general'),
        ],
      },
    },
    { name: 'laptop', type: 'relationship', relationTo: 'laptops' },
    { name: 'laptopSummary', type: 'text' },
    { name: 'laptopUrl', type: 'text' },
    { name: 'status', type: 'select', required: true, defaultValue: 'open', options: [
      { label: 'Open', value: 'open' },
      { label: 'Resolved', value: 'resolved' },
    ]},
    { name: 'lastMessageAt', type: 'date', defaultValue: () => new Date().toISOString() },
    { name: 'unreadForAdmin', type: 'number', required: true, defaultValue: 0, min: 0 },
    { name: 'unreadForBuyer', type: 'number', required: true, defaultValue: 0, min: 0 },
    { name: 'buyerTypingAt', type: 'date', admin: { hidden: true } },
    { name: 'adminTypingAt', type: 'date', admin: { hidden: true } },
  ],
};
