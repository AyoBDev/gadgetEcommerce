import type { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    maxLoginAttempts: 5,
    lockTime: 5 * 60 * 1000,
    tokenExpiration: 60 * 60 * 8,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  admin: { group: 'Admin', useAsTitle: 'email', defaultColumns: ['email', 'name', 'role'] },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req, id }) => req.user?.role === 'admin' || req.user?.id === id,
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'select', required: true, defaultValue: 'staff', options: [
      { label: 'Admin', value: 'admin' },
      { label: 'Staff', value: 'staff' },
    ], access: { update: ({ req }) => req.user?.role === 'admin' } },
  ],
};
