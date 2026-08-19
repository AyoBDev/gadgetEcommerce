# Custom MUI Admin Dashboard — Design

## Goal

Replace the Payload CMS admin UI with a purpose-built, branded admin dashboard for running the Jaysmart store. Payload remains as a headless backend (collections, auth, REST API, S3 uploads); the admin becomes a normal MUI v6 app inside the existing Next.js `(storefront)` app. This gives full control of look-and-feel — KPI dashboard, catalog management, order ledger, and the buyer-chat inbox in one place — without rebuilding CRUD, auth, uploads, or chat from scratch.

## Architecture

- **Headless Payload**: delete the `src/app/(payload)` route group so the CMS admin UI is no longer mounted. Collections (`laptops`, `categories`, `orders`, `addons`, `media`, `users`, `conversations`, `messages`) and the `settings` global keep working through Payload's REST API and local API. Auth stays Payload's `users` collection (`email`/`password`, `role: admin | staff`, session cookie).
- **Admin app**: new route group `src/app/admin/**` inside the storefront Next.js app. Server components fetch data from Payload's REST API with the session cookie; mutations go through route handlers or server actions that proxy to the same API.
- **Shared theme**: reuse `ThemeRegistry`, `theme` (primary `#E1232A`, Inter/Space Grotesk, MUI v6) and the existing storefront components where possible.
- **Realtime chat**: the buyer-chat collections and `/api/chat/**` route handlers are unchanged. The admin inbox is a MUI port of `ConversationThread.tsx`, polling the same `/api/conversations/[id]` and `/api/messages` endpoints.

## Scope (v1)

- **Auth**: login page (`POST /api/users/login` sets `payload-token` cookie), logout, server-side session gate on `layout.tsx` via `/api/users/me`, `role` checks for admin-only actions.
- **Shell**: MUI sidebar (Dashboard, Laptops, Orders, Conversations w/ open-count badge, Add-ons, Categories, Media, Settings, Users, View storefront, Logout) + topbar with page title and quick actions.
- **Dashboard**: KPI cards (published, sales this month, revenue, pending deliveries) from `dashboard-stats.ts` logic; attention panel (open conversations, low stock 1–2); quick actions; recent-orders table.
- **Catalog**: laptops list (search, brand/status filters, sort, status chips) + edit form (all fields, gallery array, stock/status controls, SEO group, slug); categories CRUD (brand/useCase); add-ons CRUD.
- **Sales**: orders ledger (filter by payment/delivery status) + order detail (laptop, buyer, price, status toggles) + record-a-sale form.
- **Conversations inbox**: list of conversations (sort by last-message, unread-for-admin badge, status) + thread view (port of `ConversationThread.tsx` restyled to match the buyer-side `ChatDrawer`).
- **Media**: upload grid using `POST /api/media` (multipart) — keeps S3 storage, sharp image sizes, and focal point.
- **Settings**: edit the `settings` global (WhatsApp number, business info, delivery fees, support email).

## Non-goals

Web push (deferred Task 8 of the chat plan), audit log, paginated infinities beyond list defaults, mobile-optimized admin (desktop-first, responsive sidebar collapses), multi-tenant, i18n of the admin UI, replacing the storefront's Payload reads (storefront keeps `getPayloadClient`).

## Reused assets

| Asset | Where it goes |
| --- | --- |
| `ThemeRegistry`, `theme`, `StoreProvider` | admin `layout.tsx` |
| `dashboard-stats.ts`, `money.ts` | dashboard queries + formatting |
| `DashboardStats.tsx` query logic | dashboard server component |
| `ConversationThread.tsx` | conversations thread (MUI restyle) |
| `ChatDrawer.tsx` styling | message bubble styles in admin inbox |
| `Nav.tsx` group/icon mapping | MUI sidebar menu |
| `ChatAboutLaptop`, `useChat`, `ChatDrawer` | unchanged, storefront side |
| `payload-types.ts` | typed admin payloads (types stay valid headless) |

## Data layer

- Read: server components `fetch` Payload REST with cookie: `/api/laptops?where=…&sort=…&depth=1`, `/api/orders`, `/api/globals/settings`, `/api/conversations`, `/api/messages`, `/api/categories`, `/api/addons`, `/api/media`, `/api/users`.
- Write: route handlers / server actions proxy `POST`/`PATCH`/`DELETE` to the same API with the session cookie. No `getPayloadClient()` in the admin.
- Revalidation: after mutations that affect the storefront (laptop status/stock, settings), call `revalidatePath`/`revalidateTag` for the touched storefront routes (mirroring the existing `Laptops.afterChange` hooks).

## Security

- Admin routes gated in `layout.tsx` (server): no cookie → redirect `/admin/login`; invalid session → logout + redirect. Middleware as first gate only; real checks in server components/route handlers.
- Admin-only mutations (delete, role changes, settings update) enforce `role === 'admin'` in the route handlers even if the UI hides the controls.
- Session cookie: `httpOnly`, `secure` in production, `sameSite: Lax` (Payload defaults).
- No HTML rendering of message text in the inbox (matches existing chat sanitization).
- VAPID private key (chat Task 8) stays server-only when eventually added.

## Verification

- Unit: dashboard stat helpers, admin auth helper (session parse/role gate), list-filter param builders.
- Integration: login → dashboard loads stats; create/edit laptop via REST; order create decrements stock; admin reply flips unread-for-buyer; buyer cannot access admin routes.
- Browser (gstack): login flow, dashboard renders KPIs, laptop edit saves + storefront reflects revalidation, conversation thread replies and shows typing, settings save persists, responsive sidebar on desktop width.
- E2E (playwright): existing `tests/e2e/*` still pass after removing `(payload)` route group; add admin login + dashboard smoke test.

## Migration

1. Scaffold `src/app/admin/**` (shell + auth gate) alongside the existing `(payload)` admin.
2. Port DashboardStats → dashboard page; port ConversationThread → inbox thread.
3. Build catalog/sales/media/settings pages against the REST API.
4. Remove `src/app/(payload)/**`, `importMap.js`, admin block from `payload.config.ts`; delete now-unused `Nav.tsx`/`DashboardStats.tsx`/SCSS.
5. Drop unused deps: `@payloadcms/ui`, `@payloadcms/richtext-lexical` (if descriptions downgrade to textarea) — verify nothing else imports them.

## Effort estimate

~1–2 weeks solo: shell+auth 1–2d, dashboard 1d (mostly reuse), laptops/orders forms 3–4d, inbox 1d, media/settings/users/categories/addons 2–3d, migration+polish 2d.