import type { CollectionConfig } from 'payload';
import { applySaleToStock } from '@/lib/inventory';

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    group: 'Sales',
    useAsTitle: 'orderLabel',
    defaultColumns: ['laptop', 'salePrice', 'buyerName', 'paymentStatus', 'deliveryStatus', 'saleDate'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => req.user?.role === 'admin',
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Build a human label for useAsTitle from the laptop title + date.
        if (operation === 'create' && data?.laptop) {
          try {
            const laptop = await req.payload.findByID({ collection: 'laptops', id: data.laptop });
            const date = (data.saleDate ?? new Date().toISOString()).slice(0, 10);
            data.orderLabel = `${laptop?.title ?? 'Laptop'} — ${date}`;
          } catch {
            // Label is cosmetic; never block a sale on it.
          }
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // Only the initial sale adjusts inventory. Editing an order later does
        // NOT re-adjust stock, to avoid double-counting.
        if (operation !== 'create') return;
        const laptopId = typeof doc.laptop === 'object' ? doc.laptop.id : doc.laptop;
        try {
          const laptop = await req.payload.findByID({ collection: 'laptops', id: laptopId });
          if (!laptop) return;
          const next = applySaleToStock({ stock: laptop.stock, status: laptop.status });
          await req.payload.update({
            collection: 'laptops',
            id: laptopId,
            // Cast is coupled to Laptop.status's literal union: applySaleToStock
            // returns a generic `status: string`, so it can't be inferred here.
            data: next as { stock: number; status: 'draft' | 'published' | 'sold' },
            req,
          });
        } catch (err) {
          // Inventory sync is best-effort; never fail the sale record itself.
          // Log so an order-vs-inventory divergence (sale recorded, stock not
          // decremented) is observable instead of silently swallowed.
          req.payload.logger.error({
            err,
            msg: 'Stock adjustment failed after order create; laptop stock was not decremented',
            orderId: doc.id,
            laptopId,
          });
        }
      },
    ],
  },
  fields: [
    { name: 'laptop', type: 'relationship', relationTo: 'laptops', required: true },
    { name: 'salePrice', type: 'number', required: true, min: 0,
      admin: { description: 'Actual sale price in kobo (Naira × 100)' } },
    { name: 'buyerName', type: 'text' },
    { name: 'buyerPhone', type: 'text', admin: { description: 'WhatsApp / phone' } },
    { name: 'saleDate', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
    { name: 'paymentStatus', type: 'select', required: true, defaultValue: 'pending', options: [
      { label: 'Pending', value: 'pending' },
      { label: 'Paid', value: 'paid' },
    ]},
    { name: 'deliveryStatus', type: 'select', required: true, defaultValue: 'pending', options: [
      { label: 'Pending', value: 'pending' },
      { label: 'Delivered', value: 'delivered' },
    ]},
    { name: 'orderLabel', type: 'text', admin: { hidden: true } },
  ],
};
