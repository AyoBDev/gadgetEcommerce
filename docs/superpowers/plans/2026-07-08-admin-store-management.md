# Admin Store-Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Payload admin into a store-management app: a sales-recording `Orders` collection that auto-adjusts inventory, a KPI-card dashboard landing, and a grouped icon menu.

**Architecture:** Business logic (stock adjustment on sale; dashboard stat computation) is extracted into pure, unit-tested functions in `src/lib/`. Payload collection hooks and admin React components are thin shells over those functions. Admin UI (dashboard cards, custom Nav) is registered via `admin.components` and verified in the running admin browser.

**Tech Stack:** Payload 3.85, Next.js 15.4 (App Router), Postgres adapter (dev **push** mode — no migration files for local dev), Vitest (unit + integration via Payload local API), MUI icons (already a dependency).

## Global Constraints

- Money is stored in **kobo** (Naira × 100), integer. Format for display with `formatNaira(kobo)` from `src/lib/money.ts`.
- Access-control pattern: staff (`Boolean(req.user)`) read/create/update; admin-only delete (`req.user?.role === 'admin'`).
- Hooks that call framework side-effects (revalidatePath, cascading updates) are wrapped in try/catch so CLI seeds and tests don't break.
- Admin UI colors use Payload CSS custom properties (`var(--theme-elevation-*)`, `var(--theme-text)`, etc.) — never hard-coded colors.
- Any new admin component must be added to `src/app/(payload)/admin/importMap.js` — regenerate with `pnpm payload generate:importmap`, do not hand-edit.
- Tests run with `pnpm test` (Vitest, `fileParallelism: false`). Integration tests use `getPayloadClient()` and must clean up every record they create.
- After changing collections/config, regenerate types with `pnpm payload generate:types`.

---

### Task 1: Stock-adjustment logic (pure function)

Pure function computing a laptop's new stock/status after one unit sells. Extracted so it is unit-testable without a DB.

**Files:**
- Create: `src/lib/inventory.ts`
- Test: `tests/unit/inventory.test.ts`

**Interfaces:**
- Produces: `applySaleToStock(current: { stock: number; status: string }): { stock: number; status: string }` — returns new stock (decremented by 1, floored at 0) and status (`'sold'` when new stock is 0, otherwise unchanged).

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/inventory.test.ts
import { describe, it, expect } from 'vitest';
import { applySaleToStock } from '@/lib/inventory';

describe('applySaleToStock', () => {
  it('decrements stock and keeps status when stock remains', () => {
    expect(applySaleToStock({ stock: 3, status: 'published' }))
      .toEqual({ stock: 2, status: 'published' });
  });

  it('marks sold when stock reaches zero', () => {
    expect(applySaleToStock({ stock: 1, status: 'published' }))
      .toEqual({ stock: 0, status: 'sold' });
  });

  it('never goes below zero and marks sold', () => {
    expect(applySaleToStock({ stock: 0, status: 'published' }))
      .toEqual({ stock: 0, status: 'sold' });
  });

  it('leaves an already-sold laptop sold at zero', () => {
    expect(applySaleToStock({ stock: 0, status: 'sold' }))
      .toEqual({ stock: 0, status: 'sold' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- inventory`
Expected: FAIL — cannot find module `@/lib/inventory`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/inventory.ts
export function applySaleToStock(
  current: { stock: number; status: string },
): { stock: number; status: string } {
  const stock = Math.max(0, current.stock - 1);
  const status = stock === 0 ? 'sold' : current.status;
  return { stock, status };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- inventory`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/inventory.ts tests/unit/inventory.test.ts
git commit -m "feat: add applySaleToStock inventory helper"
```

---

### Task 2: Orders collection + stock-adjust hook

The `orders` collection with fields, access control, and an `afterChange` (create-only) hook that applies `applySaleToStock` to the linked laptop. Dev push auto-creates the `orders` table.

**Files:**
- Create: `src/collections/Orders.ts`
- Modify: `src/payload.config.ts` (import `Orders`, add to `collections` array after `Laptops`)
- Test: `tests/integration/payload-orders.test.ts`

**Interfaces:**
- Consumes: `applySaleToStock` from `src/lib/inventory.ts` (Task 1).
- Produces: `Orders` collection (slug `orders`). Recording an order (`create`) decrements the linked laptop's stock and flips status to `sold` at 0.

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/payload-orders.test.ts
import { describe, it, expect } from 'vitest';
import { getPayloadClient } from '@/lib/payload';
import type { Laptop } from '@/payload-types';

async function makeLaptop(stock: number) {
  const payload = await getPayloadClient();
  const brand = await payload.create({
    collection: 'categories',
    data: { name: `Brand ${Date.now()}`, type: 'brand', icon: 'laptop_mac' },
  });
  const laptop = await payload.create({
    collection: 'laptops',
    data: {
      title: `Order Test Laptop ${Date.now()}`,
      brand: brand.id,
      price: 30_000_000,
      condition: 'grade-a',
      stock,
      status: 'published',
      warrantyDays: 7,
    } as unknown as Laptop,
  });
  return { payload, brand, laptop };
}

describe('Orders stock-adjust hook', () => {
  it('decrements stock on sale and keeps laptop published', async () => {
    const { payload, brand, laptop } = await makeLaptop(3);
    const order = await payload.create({
      collection: 'orders',
      data: { laptop: laptop.id, salePrice: 29_000_000, saleDate: new Date().toISOString() },
    });
    const after = await payload.findByID({ collection: 'laptops', id: laptop.id });
    expect(after.stock).toBe(2);
    expect(after.status).toBe('published');
    await payload.delete({ collection: 'orders', id: order.id });
    await payload.delete({ collection: 'laptops', id: laptop.id });
    await payload.delete({ collection: 'categories', id: brand.id });
  });

  it('marks laptop sold when the last unit sells', async () => {
    const { payload, brand, laptop } = await makeLaptop(1);
    const order = await payload.create({
      collection: 'orders',
      data: { laptop: laptop.id, salePrice: 29_000_000, saleDate: new Date().toISOString() },
    });
    const after = await payload.findByID({ collection: 'laptops', id: laptop.id });
    expect(after.stock).toBe(0);
    expect(after.status).toBe('sold');
    await payload.delete({ collection: 'orders', id: order.id });
    await payload.delete({ collection: 'laptops', id: laptop.id });
    await payload.delete({ collection: 'categories', id: brand.id });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- payload-orders`
Expected: FAIL — collection `orders` does not exist / validation error.

- [ ] **Step 3: Write the collection**

```ts
// src/collections/Orders.ts
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
        try {
          const laptopId = typeof doc.laptop === 'object' ? doc.laptop.id : doc.laptop;
          const laptop = await req.payload.findByID({ collection: 'laptops', id: laptopId });
          if (!laptop) return;
          const next = applySaleToStock({ stock: laptop.stock, status: laptop.status });
          await req.payload.update({
            collection: 'laptops',
            id: laptopId,
            data: next,
            req,
          });
        } catch {
          // Inventory sync is best-effort; never fail the sale record itself.
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
```

- [ ] **Step 4: Register the collection**

In `src/payload.config.ts`: add `import { Orders } from '@/collections/Orders';` with the other collection imports, and change the collections array to `collections: [Users, Media, Categories, Laptops, Orders],`.

- [ ] **Step 5: Regenerate types**

Run: `pnpm payload generate:types`
Expected: `src/payload-types.ts` updates to include an `Order` type; no errors.

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test -- payload-orders`
Expected: PASS (2 tests). Dev push creates the `orders` table on first Payload init.

- [ ] **Step 7: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/collections/Orders.ts src/payload.config.ts src/payload-types.ts tests/integration/payload-orders.test.ts
git commit -m "feat: add Orders collection with stock-adjust on sale"
```

---

### Task 3: Dashboard stats computation (pure function)

Pure function turning raw counts/orders into the six KPI values. Unit-tested; the React card renders its output.

**Files:**
- Create: `src/lib/dashboard-stats.ts`
- Test: `tests/unit/dashboard-stats.test.ts`

**Interfaces:**
- Produces:
  - `type DashboardStats = { publishedCount: number; outOfStockCount: number; lowStockCount: number; salesThisMonth: number; revenueThisMonthKobo: number; pendingDeliveries: number }`
  - `computeRevenue(orders: { salePrice: number }[]): number` — sums `salePrice`.
  - `monthStart(now: Date): Date` — first instant of `now`'s month (UTC), for the "this month" order query.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/dashboard-stats.test.ts
import { describe, it, expect } from 'vitest';
import { computeRevenue, monthStart } from '@/lib/dashboard-stats';

describe('computeRevenue', () => {
  it('sums salePrice across orders', () => {
    expect(computeRevenue([{ salePrice: 100 }, { salePrice: 250 }])).toBe(350);
  });
  it('returns 0 for no orders', () => {
    expect(computeRevenue([])).toBe(0);
  });
});

describe('monthStart', () => {
  it('returns the first day of the month at midnight UTC', () => {
    const d = monthStart(new Date('2026-07-08T15:30:00.000Z'));
    expect(d.toISOString()).toBe('2026-07-01T00:00:00.000Z');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- dashboard-stats`
Expected: FAIL — cannot find module `@/lib/dashboard-stats`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/dashboard-stats.ts
export type DashboardStats = {
  publishedCount: number;
  outOfStockCount: number;
  lowStockCount: number;
  salesThisMonth: number;
  revenueThisMonthKobo: number;
  pendingDeliveries: number;
};

export function computeRevenue(orders: { salePrice: number }[]): number {
  return orders.reduce((sum, o) => sum + o.salePrice, 0);
}

export function monthStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- dashboard-stats`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/dashboard-stats.ts tests/unit/dashboard-stats.test.ts
git commit -m "feat: add dashboard stats helpers"
```

---

### Task 4: Dashboard KPI cards component

Server component that queries Payload for the six KPIs and renders a themed card grid + quick-actions. Wired via `admin.components.beforeDashboard`. Verified in the running admin (React admin components aren't meaningfully unit-testable; the data logic they call is covered by Tasks 1 & 3).

**Files:**
- Create: `src/components/admin/DashboardStats.tsx`
- Create: `src/components/admin/DashboardStats.module.scss`
- Modify: `src/payload.config.ts` (add `admin.components.beforeDashboard`)
- Modify: `src/app/(payload)/admin/importMap.js` (regenerated, not hand-edited)

**Interfaces:**
- Consumes: `computeRevenue`, `monthStart`, `DashboardStats` (Task 3); `formatNaira` (`src/lib/money.ts`); the `orders` collection (Task 2).

- [ ] **Step 1: Write the component**

```tsx
// src/components/admin/DashboardStats.tsx
import { getPayload } from 'payload';
import config from '@/payload.config';
import { formatNaira } from '@/lib/money';
import { computeRevenue, monthStart } from '@/lib/dashboard-stats';
import styles from './DashboardStats.module.scss';

async function countLaptops(payload: Awaited<ReturnType<typeof getPayload>>, where: object) {
  const res = await payload.count({ collection: 'laptops', where });
  return res.totalDocs;
}

export default async function DashboardStats() {
  const payload = await getPayload({ config });
  const now = new Date();

  const [published, outOfStock, lowStock, monthOrders, pending] = await Promise.all([
    countLaptops(payload, { status: { equals: 'published' } }),
    countLaptops(payload, { and: [{ status: { equals: 'published' } }, { stock: { equals: 0 } }] }),
    countLaptops(payload, { and: [{ status: { equals: 'published' } }, { stock: { greater_than: 0 } }, { stock: { less_than_equal: 2 } }] }),
    payload.find({ collection: 'orders', limit: 1000, where: { saleDate: { greater_than_equal: monthStart(now).toISOString() } } }),
    payload.count({ collection: 'orders', where: { deliveryStatus: { equals: 'pending' } } }),
  ]);

  const revenue = computeRevenue(monthOrders.docs.map((o) => ({ salePrice: o.salePrice })));

  const cards = [
    { label: 'Published', value: String(published), href: '/admin/collections/laptops?where[status][equals]=published' },
    { label: 'Out of stock', value: String(outOfStock), href: '/admin/collections/laptops?where[stock][equals]=0' },
    { label: 'Low stock (1–2)', value: String(lowStock), href: '/admin/collections/laptops' },
    { label: 'Sales this month', value: String(monthOrders.totalDocs), href: '/admin/collections/orders' },
    { label: 'Revenue this month', value: formatNaira(revenue), href: '/admin/collections/orders' },
    { label: 'Pending deliveries', value: String(pending.totalDocs), href: '/admin/collections/orders?where[deliveryStatus][equals]=pending' },
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {cards.map((c) => (
          <a key={c.label} className={styles.card} href={c.href}>
            <span className={styles.label}>{c.label}</span>
            <span className={styles.value}>{c.value}</span>
          </a>
        ))}
      </div>
      <div className={styles.actions}>
        <a className={styles.action} href="/admin/collections/orders/create">Record a sale</a>
        <a className={styles.action} href="/admin/collections/laptops/create">Add laptop</a>
        <a className={styles.action} href="/" target="_blank" rel="noreferrer">View storefront</a>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the styles (Payload theme vars only)**

```scss
// src/components/admin/DashboardStats.module.scss
.wrap { margin-bottom: 2rem; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}
.card {
  display: flex;
  flex-direction: column;
  gap: .5rem;
  padding: 1.25rem;
  border-radius: 6px;
  background: var(--theme-elevation-50);
  border: 1px solid var(--theme-elevation-100);
  color: var(--theme-text);
  text-decoration: none;
  transition: background .15s ease;
  &:hover { background: var(--theme-elevation-100); }
}
.label { font-size: .8rem; color: var(--theme-elevation-500); text-transform: uppercase; letter-spacing: .03em; }
.value { font-size: 1.75rem; font-weight: 700; }
.actions { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 1rem; }
.action {
  padding: .5rem 1rem;
  border-radius: 4px;
  background: var(--theme-elevation-100);
  color: var(--theme-text);
  text-decoration: none;
  font-size: .9rem;
  &:hover { background: var(--theme-elevation-150); }
}
```

- [ ] **Step 3: Wire beforeDashboard**

In `src/payload.config.ts`, add to the `admin` object:

```ts
  admin: {
    user: 'users',
    meta: { title: 'Jaysmart Admin', titleSuffix: '— Jaysmart' },
    components: {
      beforeDashboard: ['@/components/admin/DashboardStats#default'],
    },
  },
```

- [ ] **Step 4: Regenerate the import map**

Run: `pnpm payload generate:importmap`
Expected: `importMap.js` gains an entry for `@/components/admin/DashboardStats`.

- [ ] **Step 5: Verify in the running admin**

Start the dev server (preview_start `jaysmart-dev`), log in at `/admin/login` (admin@jaysmart.ng / value from `.env.local` `ADMIN_PASSWORD`), and confirm on `/admin`:
- Six KPI cards render above the default dashboard with real numbers.
- Revenue shows a ₦ value.
- Cards and quick-action links navigate correctly.
- Toggle dark mode (account menu) — cards remain readable (theme vars).

Capture a screenshot as proof.

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/DashboardStats.tsx src/components/admin/DashboardStats.module.scss src/payload.config.ts "src/app/(payload)/admin/importMap.js"
git commit -m "feat: add store-management KPI cards to admin dashboard"
```

---

### Task 5: Group collections + globals in the menu

Add `admin.group` to every collection/global so Payload renders labeled menu sections. This alone delivers grouped headers (the Task 6 fallback path).

**Files:**
- Modify: `src/collections/Laptops.ts`, `src/collections/Categories.ts`, `src/collections/Media.ts`, `src/collections/Users.ts`, `src/globals/Settings.ts`

**Interfaces:**
- Produces: groups — Catalog (Laptops, Categories, Media), Sales (Orders — already set in Task 2), Store (Settings), Admin (Users).

- [ ] **Step 1: Add groups**

In each file's `admin` object add the `group` key:
- `Laptops.ts`: `group: 'Catalog'` (merge into existing `admin`)
- `Categories.ts`: `group: 'Catalog'`
- `Media.ts`: `group: 'Catalog'`
- `Users.ts`: `group: 'Admin'`
- `Settings.ts`: change `group: 'Configuration'` → `group: 'Store'`

Example for `Laptops.ts` (existing `admin` gains one line):

```ts
  admin: {
    group: 'Catalog',
    useAsTitle: 'title',
    defaultColumns: ['title', 'brand', 'price', 'status', 'stock', 'updatedAt'],
    listSearchableFields: ['title', 'slug', 'specs.processor'],
  },
```

- [ ] **Step 2: Verify in the running admin**

Reload `/admin`. The left menu now shows grouped headers: Catalog, Sales, Store, Admin. Screenshot as proof.

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/collections/Laptops.ts src/collections/Categories.ts src/collections/Media.ts src/collections/Users.ts src/globals/Settings.ts
git commit -m "feat: group admin nav into Catalog/Sales/Store/Admin"
```

---

### Task 6: Custom Nav with icons

Custom `Nav` component that renders the grouped entries with an MUI icon per item plus a Dashboard home link, wired via `admin.components.Nav`. **Fallback:** if the custom Nav fights the framework (broken active state, lost logout/account, or render errors), skip it and keep Task 5's grouped headers; record that the fallback shipped in the commit message and stop.

**Files:**
- Create: `src/components/admin/Nav.tsx`
- Create: `src/components/admin/Nav.module.scss`
- Modify: `src/payload.config.ts` (`admin.components.Nav`)
- Modify: `src/app/(payload)/admin/importMap.js` (regenerated)

**Interfaces:**
- Consumes: `@payloadcms/ui` `useConfig`/`Link`/`Logout` primitives and `@mui/icons-material` icons.

- [ ] **Step 1: Inspect available Nav building blocks**

Read `node_modules/@payloadcms/ui/dist/exports/client/index.d.ts` for the exported `NavGroup`, `Link`, `Logout`, `useConfig`, and the default `Nav` implementation under `node_modules/@payloadcms/next/dist/.../Nav`. Confirm which primitives are exported before writing the component. (Do not invent APIs — read the version installed here.)

- [ ] **Step 2: Write the Nav component**

Build a `'use client'` component that:
- reads collections/globals + their `admin.group` from `useConfig()`,
- renders a top "Dashboard" link (`/admin`),
- renders each group as a section header with its entries, each entry prefixed by an MUI icon (map: Catalog→`Inventory2`, Sales→`PointOfSale`, Store→`Storefront`, Admin→`AdminPanelSettings`; fall back to a generic icon),
- reuses Payload's active-link styling by applying the same class the default Nav uses (discovered in Step 1) or `usePathname()` to set an `active` class,
- keeps the account/logout controls the default Nav provides.

Write the concrete component using only the primitives confirmed in Step 1. Colors via `var(--theme-*)` in `Nav.module.scss`.

- [ ] **Step 3: Wire the Nav**

In `src/payload.config.ts` `admin.components`, add `Nav: '@/components/admin/Nav#default'`.

- [ ] **Step 4: Regenerate the import map**

Run: `pnpm payload generate:importmap`
Expected: `importMap.js` gains the `Nav` entry.

- [ ] **Step 5: Verify in the running admin**

Reload `/admin`. Confirm:
- Grouped menu with an icon per item and a Dashboard link.
- Active item is highlighted when on its collection.
- Account/logout still work; navigating between collections works.
- Light and dark mode both readable.

If any of these fail and can't be fixed quickly, revert this task's changes (`git checkout -- .` on the task's files + regenerate importmap) and keep Task 5's result. Screenshot the shipped state as proof.

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/Nav.tsx src/components/admin/Nav.module.scss src/payload.config.ts "src/app/(payload)/admin/importMap.js"
git commit -m "feat: custom grouped admin nav with icons"
```

(If the fallback path was taken, commit message: `chore: keep grouped nav headers (custom Nav deferred)` and note why.)

---

### Task 7: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: all unit + integration tests pass, including the new inventory, dashboard-stats, and orders tests.

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Manual smoke in the admin**

In the running admin: record a sale for a laptop with stock 1, confirm the laptop flips to Sold and stock 0, and confirm the dashboard "Sales this month" / "Revenue this month" increment. Delete the test order and restore the laptop afterward (or use a throwaway laptop).

- [ ] **Step 4: Final commit (if any verification fixes were needed)**

```bash
git add -A
git commit -m "test: verify admin store-management end to end"
```

---

## Notes / follow-ups (out of scope)

- **Production migrations:** local dev uses Postgres push mode. Before deploying, generate a real migration for the `orders` table (`pnpm payload migrate:create`) — tracked separately, not part of this plan.
- **Order edits/deletes** do not re-adjust inventory by design (documented in the hook). A future phase could add reconciliation if needed.
- **Sales analytics over time** (charts, trends) are a future phase; this plan ships single-value KPI cards only.
