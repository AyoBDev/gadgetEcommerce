# Admin as a Store-Management App — Design

**Date:** 2026-07-08
**Status:** Approved, ready for planning

## Problem

The Payload admin currently works functionally (login, collections, globals all load) but reads as a bare CMS: a flat list of collections, no landing dashboard, no operational metrics. The store owner wants the admin to serve as a **store-management app** for a Nigerian preowned-laptop business that sells via WhatsApp — so staff can see inventory health at a glance, record sales manually, and track revenue and fulfillment.

## Goals

1. Record sales manually (staff-entered) with a new `Orders` collection.
2. A store-management dashboard landing with KPI cards for inventory and sales.
3. A grouped, icon-labeled left menu instead of the default flat list.

## Non-Goals

- Online checkout / payment processing (sales are WhatsApp-based, entered by staff).
- Customer accounts, carts, or a public order history.
- Analytics charts / time-series graphs (KPIs are single-value cards this pass).
- Multi-quantity orders (one order = one laptop unit; see auto-update rule).

## Existing context

- Payload 3.85, Next.js 15.4 (App Router), Postgres adapter, MUI already a dependency.
- `src/collections/`: `Users`, `Media`, `Categories`, `Laptops`. Global: `Settings`.
- Laptops have: `status` (draft/published/sold), `stock` (number, default 1), `price`/`compareAtPrice` (kobo), `condition`.
- `src/lib/money.ts` exposes `formatNaira(kobo)` — reuse for revenue formatting.
- Access-control pattern: staff read/create/update, admin-only delete (`req.user?.role === 'admin'`).
- Laptops `afterChange` calls `revalidatePath` (wrapped in try/catch for CLI/test safety).

## Component 1 — `Orders` collection

New file `src/collections/Orders.ts`, registered in `payload.config.ts` collections array (after `Laptops`).

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| `laptop` | relationship → `laptops` | required |
| `salePrice` | number | required, min 0, in kobo. Description: "In kobo (Naira × 100)". |
| `buyerName` | text | optional |
| `buyerPhone` | text | optional; WhatsApp/phone |
| `saleDate` | date | required, `defaultValue` = now |
| `paymentStatus` | select | `pending` / `paid`, default `pending` |
| `deliveryStatus` | select | `pending` / `delivered`, default `pending` |

**Admin config:**
- `admin.group: 'Sales'`
- `useAsTitle`: `orderLabel` — a virtual/`admin.components`-free approach is preferred, but Payload needs a real field for `useAsTitle`. Use a `orderLabel` text field, hidden (`admin.hidden: true`), populated in a `beforeChange` hook as `"{laptop title} — {saleDate}"`. If resolving the laptop title in the hook is awkward, fall back to `useAsTitle: 'saleDate'` with `defaultColumns` making the row readable.
- `defaultColumns`: `['laptop', 'salePrice', 'buyerName', 'paymentStatus', 'deliveryStatus', 'saleDate']`.

**Access:** mirror existing pattern —
- `read`: `Boolean(req.user)`
- `create`: `Boolean(req.user)`
- `update`: `Boolean(req.user)`
- `delete`: `req.user?.role === 'admin'`

**Auto-update hook (`afterChange`, create only):**
- On `operation === 'create'`, load the linked laptop and:
  - decrement `stock` by 1 (floor at 0),
  - if resulting `stock === 0`, set `status = 'sold'`.
- Perform the update via `req.payload.update({ collection: 'laptops', id, data, overrideAccess: false, req })` so the laptop's own `afterChange` revalidation fires.
- Only `create` adjusts stock — editing or deleting an order does **not** re-adjust, to avoid double-counting. Document this limitation in a code comment.
- Wrap in try/catch consistent with the codebase's revalidation guard so seeds/tests don't break.

**Testing:** unit test the stock-decrement/auto-sold logic (stock 2→1 stays published; stock 1→0 flips to sold; never below 0).

## Component 2 — Store-management dashboard (`beforeDashboard`)

Custom **server** component at `src/components/admin/DashboardStats.tsx`, wired via `admin.components.beforeDashboard` in `payload.config.ts`. Renders above Payload's default dashboard.

Uses `req.payload` count/find queries (via `getPayload` with the config) to compute:

**Inventory row:**
- **Published laptops** — `status = published`
- **Out of stock** — `status = published AND stock = 0`
- **Low stock** — `status = published AND stock in [1,2]`

**Sales row:**
- **Sales this month** — orders where `saleDate >= start of current month` (unit count)
- **Revenue this month** — sum of `salePrice` over those orders, formatted with `formatNaira`
- **Pending deliveries** — orders where `deliveryStatus = pending`

**Rendering:**
- Responsive card grid (CSS grid, wraps on small screens).
- Each card: label, large value, subtle MUI icon.
- Cards that map to a filterable list link through to the pre-filtered collection URL
  (e.g. Out of stock → `/admin/collections/laptops?where[...]`). Where a clean filter URL
  isn't practical, link to the unfiltered list.
- Styling via Payload's own CSS custom properties (e.g. `var(--theme-elevation-*)`,
  `var(--theme-text)`) so light/dark themes match automatically. Scoped CSS module or
  inline styles using those vars — no hard-coded colors.
- **Quick actions** strip below the cards: "Record a sale" (`/admin/collections/orders/create`),
  "Add laptop" (`/admin/collections/laptops/create`), "View storefront" (`/`, new tab).

**Testing:** verify counts against seeded data in the running admin (browser); confirm ₦ formatting and light/dark rendering.

## Component 3 — Grouped menu with icons (custom `Nav`)

Two parts:

1. **Grouping** — set `admin.group` on each collection/global so Payload groups them under
   labeled headers:
   - Catalog: `Laptops`, `Categories`, `Media`
   - Sales: `Orders`
   - Store: `Settings` (global)
   - Admin: `Users`

2. **Custom Nav** — `src/components/admin/Nav.tsx`, wired via `admin.components.Nav`.
   Renders the grouped entries with an icon per item (from `@mui/icons-material`, already a
   dependency), plus a top "Dashboard" home link. Reuses Payload's active-link styling and
   CSS variables; preserves account/logout behavior.

**Risk & fallback:** a fully custom `Nav` carries more upkeep across Payload upgrades than the
KPI cards. If it fights the framework, fall back to Payload's stock nav **with** the `admin.group`
labels from part 1 (grouped headers, no per-item icons). Aim for the full custom nav; fall back
only if needed. Record which path shipped.

## Data flow

```
Staff records sale (Orders create)
        │
        ▼
Orders.afterChange (create) ──► payload.update(laptops): stock−1, sold@0
        │                                   │
        ▼                                   ▼
   Order persisted                Laptops.afterChange ──► revalidatePath(storefront)
        │
        ▼
DashboardStats (beforeDashboard) queries laptops + orders on next admin load
        │
        ▼
   KPI cards reflect updated inventory + sales
```

## Files touched

- **New:** `src/collections/Orders.ts`, `src/components/admin/DashboardStats.tsx`,
  `src/components/admin/Nav.tsx` (+ optional CSS module), order-hook unit test.
- **Edited:** `src/payload.config.ts` (register Orders, wire `beforeDashboard` + `Nav`),
  `src/collections/{Laptops,Categories,Media,Users}.ts` and `src/globals/Settings.ts`
  (add `admin.group`).
- **Regenerated:** `src/payload-types.ts`, `importMap.js` (via Payload codegen).
- **Migration:** new Postgres migration for the `orders` table.

## Success criteria

- Recording an order decrements the laptop's stock and flips it to Sold at 0.
- Admin landing shows the six KPI cards with correct counts and ₦-formatted revenue,
  matching light/dark theme.
- Left menu shows grouped sections (Catalog / Sales / Store / Admin) with icons (or grouped
  headers if the fallback path is taken).
- Existing storefront and admin flows still work; typecheck and tests pass.
