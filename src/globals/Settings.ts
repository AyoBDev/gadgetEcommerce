import type { GlobalConfig } from 'payload';

export const Settings: GlobalConfig = {
  slug: 'settings',
  admin: { group: 'Store' },
  access: {
    read: () => true,
    update: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'whatsappNumber', type: 'text', required: true, admin: { description: 'E.164 without + (e.g. 2348012345678)' } },
    { name: 'businessName', type: 'text', required: true, defaultValue: 'Jaysmart' },
    { name: 'businessAddress', type: 'textarea' },
    { name: 'businessPhone', type: 'text' },
    { name: 'deliveryFeeLagos', type: 'number', required: true, defaultValue: 500_000, admin: { description: 'Kobo. 500,000 = ₦5,000' } },
    { name: 'deliveryFeeOther', type: 'number', required: true, defaultValue: 1_500_000, admin: { description: 'Kobo. 1,500,000 = ₦15,000' } },
    { name: 'supportEmail', type: 'email', required: true },
  ],
};
