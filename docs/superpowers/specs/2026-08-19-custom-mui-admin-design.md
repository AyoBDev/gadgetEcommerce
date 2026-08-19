# Custom MUI Admin Dashboard — Design

## Goal

Replace the Payload CMS admin UI with a purpose-built, branded admin dashboard for running the Jaysmart store. Payload remains as a headless backend (collections, auth, REST API, S3 uploads); the admin becomes a normal MUI v6 app inside the existing Next.js app. This gives full control of look-and-feel — KPI dashboard, catalog management, order ledger, and the buyer-chat inbox in one place — without rebuilding auth, uploads, or chat from scratch.

## Architecture

- **Headless Payload**: delete the CMS admin UI at `src/app/(payload)/admin/**` only. **KEEP `src/app/(payload)/api/[...slug]/route.ts`** — it mounts the entire REST API (`/api/users/login`, `/api/users/me`, `/api/laptops`, `/api/orders`, `/api/conversations`, `/api/messages`, `/api/globals/settings`, `/api/media`) that the new admin and the chat feature depend on. Deleting the whole `(payload)` group silently breaks everything (verified: `api/[...slug]/route.ts` exports `REST_GET/POST/PATCH/DELETE`).
- **Route cutover**: the Payload catch-all (`(payload)/admin/[[...segments]]`) and the new `src/app/admin` BOTH resolve to `/admin` — Next.js rejects duplicate routes at build. Build the new admin at **`/admin-v2`** until cutover, then delete the Payload admin tree and move the new admin to `/admin` in one commit. No downtime window.
- **Read path (server components)**: use the local Payload API (`getPayloadClient`) and verify the session with `payload.auth` — no self-HTTP, no manual cookie forwarding, no `force-dynamic` caveats, and it matches how the storefront already reads (`src/lib/payload.ts`, `src/lib/settings.ts`).
- **Write path (client components)**: REST with the session cookie (`credentials: 'include'`), matching the existing `ConversationThread` fetch pattern. No server actions. Storefront revalidation is handled by the existing `Laptops.afterChange` / `Orders.afterChange` hooks — **do not add redundant revalidation**. Exception: the `Settings` global has NO revalidation hook, so settings edits need an explicit `revalidatePath('/')` in the settings write path (otherwise edits don't reach the storefront until rebuild).
- **Dependency**: the buyer-chat feature (10 commits on `worktree-add-payload-native-chat`, collections + `/api/chat/**` + `ConversationThread`) must be merged to main before this lands — the inbox depends on it.

```
admin requests
   │
   ├─ server components (reads) ──getPayloadClient()──► Payload local API ──► Postgres
   │                              └─ payload.auth(session cookie)          │
   │                                                                       │
   └─ client components (writes) ──fetch POST/PATCH/DELETE──► Payload REST  ─┘
                                  credentials: 'include'   (api/[...slug])
                                                            │
                                                            ├─ afterChange hooks → revalidatePath(storefront)
                                                            └─ Settings: explicit revalidatePath('/') in write path
```

## Scope (v1)

Phased (strangler fig). **Phase 1** lands first, then **Phase 2** fills the gaps before the cutover.

**Phase 1 — core operations:**
- **Auth**: login page (`POST /api/users/login` sets `payload-token` cookie), logout, server-side session gate on the admin layout via `payload.auth`, `role` checks for admin-only actions.
- **Shell**: MUI sidebar (Dashboard, Laptops, Orders, Conversations w/ open-count badge, Settings, Logout) + topbar with page title and quick actions.
- **Dashboard**: KPI cards (published, sales this month, revenue, pending deliveries) + attention panel (open conversations, low stock 1–2) + quick actions + recent-orders table. Query logic in `src/lib/dashboard-stats.ts`; the page component stays thin.
- **Laptops**: list (search, brand/status filters, sort, status chips) + edit form (all fields, gallery array, stock/status controls, SEO group, slug) — the hardest form in the system, budgeted accordingly.
- **Orders**: ledger (filter by payment/delivery status) + order detail (laptop, buyer, price, status toggles) + record-a-sale form.
- **Conversations inbox**: list (sort by last-message, unread-for-admin badge, status) + thread view (port of `ConversationThread.tsx`, restyled to match the buyer-side `ChatDrawer`; id comes from route params, `useDocumentInfo()` replaced, `@payloadcms/ui` Button → MUI Button).

**Phase 2 — remaining collections:**
- **Media**: upload grid via `POST /api/media` (multipart) — keeps S3 storage, sharp image sizes, focal point.
- **Settings**: edit the `settings` global (WhatsApp, business info, delivery fees, support email) + `revalidatePath('/')` on save.
- **Categories**: CRUD (brand/useCase split). **Add-ons**: CRUD. **Users**: staff list (role changes admin-only).

## Data model change — description to plain text

The `description` field is `richText` (Lexical JSON); the storefront renders it with `<RichText>` at `src/app/(storefront)/laptops/[slug]/page.tsx:11,166`. **Convert it to `textarea`:**

1. Change the field type in `src/collections/Laptops.ts` from `richText` to `textarea`; drop the `editor: lexicalEditor()` block from `src/payload.config.ts`.
2. Data migration: existing documents store Lexical JSON — write a migration that extracts the plain text from each description's paragraph nodes (or replaces with empty string) so no doc is orphaned.
3. Storefront: replace `<RichText data={laptop.description} />` with a plain-text render (`<Typography>` with `whiteSpace: 'pre-wrap'`); remove the `@payloadcms/richtext-lexical/react` import.
4. `src/payload-types.ts` is hand-maintained (`autoGenerate: false`) — update `Laptop.description` to `string | null` manually.
5. Seed script `scripts/seed-laptops.ts` — descriptions become plain strings.

## Shared admin scaffolding

- **`src/lib/admin-api.ts`** (~60 lines): typed fetch wrapper (session cookie, JSON, error/empty handling) + a reusable list-query builder (`where`/`sort`/`limit`/`page` param serialization) shared by all list pages.
- **One reusable list table** component (MUI `Table` + pagination + filter toolbar) used by laptops, orders, conversations, media, categories, add-ons, users index pages. One place to fix auth/error handling.

## Reused assets (corrected)

| Asset | Reality |
| --- | --- |
| `ThemeRegistry`, `theme`, `StoreProvider` | direct reuse in admin `layout.tsx` |
| `src/lib/dashboard-stats.ts`, `money.ts` | direct reuse (helpers already extracted) |
| `ConversationThread.tsx` | port, not reuse — replace `useDocumentInfo` + `@payloadcms/ui` Button, id from route params |
| `ChatDrawer.tsx` styling | pattern for inbox bubble styling |
| `Nav.tsx` icon mapping | reference only — it is a Payload-UI component, the sidebar is a new MUI `<Drawer>` |
| `DashboardStats.tsx` query logic | reference only — it uses `getPayload` + `payload.count` + links to `/admin/collections/...`; the dashboard page reimplements queries via the local API and links to the new routes |

## Security

- Admin routes gated in the admin layout (server): no valid session → redirect `/admin-v2/login`; invalid session → logout + redirect. Middleware optional as a first gate; real checks in server components via `payload.auth`.
- Admin-only mutations (delete, role changes, settings update) enforce `role === 'admin'` in the write path even if the UI hides the controls.
- Session cookie: Payload defaults (`httpOnly`, `secure` in production, `sameSite: Lax`). Login rate-limiting: Payload's built-in `maxLoginAttempts: 5` already configured.
- No HTML rendering of message text in the inbox (existing chat sanitization).
- VAPID private key (chat Task 8) stays server-only when added.

## Verification

### Test list

**Unit (`tests/unit/`, vitest node env):**
- `admin-auth.test.ts` — session/role helpers (parse `payload-token`, role gate for admin vs staff)
- `admin-query.test.ts` — list-query builder (where/sort/limit/page serialization, filter edge cases)
- existing `dashboard-stats.test.ts` stays (helpers unchanged)

**Integration (`tests/integration/`, real DB):**
- `admin-login.test.ts` — login via REST sets session; `/api/users/me` returns user; wrong role rejected on admin-only mutation
- `admin-laptops.test.ts` — create/edit via REST, status publish→publishedAt stamp, stock decrement on order create (extends `payload-laptops`/`payload-orders`)
- `admin-conversations.test.ts` — admin reply flips `unreadForBuyer`, clears `unreadForAdmin` on view (extends chat integration tests)
- `admin-settings.test.ts` — settings PATCH persists; description plain-text migration produces valid docs

**E2E (`tests/e2e/`, playwright):**
- **REWRITE `admin-publish.spec.ts` (CRITICAL regression)** — currently drives the Payload CMS UI (`/admin` → login → `/admin/collections/laptops`); after cutover it must drive the new `/admin` (login → dashboard → laptops list). Removing the CMS admin without rewriting this test breaks the suite.
- `admin-login.spec.ts` — wrong password shows error, expired session redirects to login
- `storefront.spec.ts` — must still pass after the description-to-plain-text change (regression: product page renders description text)

**Browser (gstack):** dashboard KPIs render and drill down; laptop edit saves and storefront reflects it; inbox replies, shows typing, clears unread; settings save persists to the storefront footer; sidebar responsive at desktop width.

### Coverage diagram

```
CODE PATHS (new admin)                               USER FLOWS
[+] src/lib/admin-api.ts                               [+] Login
  ├── [★★] session fetch helper                          ├── [★★  TESTED] happy login (rewritten admin-publish)
  ├── [★★] role check (staff vs admin)                  └── [★★  TESTED] wrong password / expired session
  └── [★★] where-param builder                        [+] Dashboard
[+] src/app/admin-v2/layout.tsx                          ├── [★★  TESTED] stat helpers (dashboard-stats.test)
  ├── [★★] no-cookie redirect                            └── [GAP]  [→BROWSER] KPI render + drill-down
  └── [★★] invalid-session logout                      [+] Laptops list/edit
[+] src/app/admin-v2/laptops/**                          ├── [★★  TESTED] edit PATCH saves (admin-laptops.test)
  └── [GAP]  [→BROWSER] empty state, filter chips        └── [★   TESTED] payload-laptops integration stays
[+] src/app/admin-v2/orders/**                           [+] Conversations inbox
  └── [★★] order create decrements stock                 ├── [★★  TESTED] admin reply flips unread (admin-conversations.test)
[+] src/app/admin-v2/conversations/[id]                  ├── [★★  TESTED] chat-send / chat-authorization stay
  └── [GAP]  [→BROWSER] typing + unread clear            └── [GAP]  [→BROWSER] empty state (no conversations yet)
[+] src/app/admin-v2/settings/**                      [+] Settings PATCH
  └── [★★] persists + storefront reflects                └── [GAP]  [→BROWSER] footer updates after save
[REG] [CRITICAL] tests/e2e/admin-publish.spec.ts
      drives the Payload CMS UI — breaks on removal.
      Rewritten for the new /admin.

COVERAGE TARGET: 100% of new unit/integration paths; browser for interaction flows; 2 critical regressions
(storefront description render, admin-publish e2e).
```

## NOT in scope

- Web push (chat plan Task 8) — tracked in the chat plan, independently deferrable.
- Attachments, multi-agent routing, read receipts, mobile admin — chat non-goals, unchanged.
- Storefront migration off `getPayloadClient` — storefront keeps the local API; only the admin changes.
- i18n of the admin UI, multi-tenant, audit log.

## What already exists

- `src/lib/dashboard-stats.ts` + `money.ts` — stat helpers and Naira formatting, reused.
- `src/lib/chat*.ts` + `rate-limit.ts` — chat logic, reused by inbox + storefront unchanged.
- `ConversationThread.tsx` — inbox thread to port.
- `ThemeRegistry` + `theme` — MUI shell, reused.
- `tests/unit/{dashboard-stats,money,inventory,slug,whatsapp,chat*}.test.ts` — stay green.
- `tests/integration/{payload-*,chat-*}.test.ts` — stay green; extended by admin-* tests.

## Migration

1. Merge `worktree-add-payload-native-chat` to main (chat dependency).
2. Scaffold `/admin-v2` (shell + auth gate) alongside the existing Payload admin — no route collision.
3. Port DashboardStats queries → dashboard; port `ConversationThread` → inbox thread.
4. Build laptops + orders pages against REST writes + local-API reads.
5. Phase 2: media, settings, categories, add-ons, users.
6. Description conversion: field type, data migration, storefront render, `payload-types.ts`, seed script.
7. Cutover: delete `src/app/(payload)/admin/**` + `importMap.js` + admin block from `payload.config.ts`; move `/admin-v2` → `/admin`; rewrite `admin-publish.spec.ts`.
8. Dep cleanup: drop `@payloadcms/ui`, `@payloadcms/richtext-lexical`, `@payloadcms/storage-s3` stays (media), delete dead `Nav.tsx`/`DashboardStats.tsx`/SCSS.

## Failure modes

| Codepath | Failure | Test | Error handling | User sees |
| --- | --- | --- | --- | --- |
| Admin session check | token expired mid-use | admin-login e2e | redirect to login | ✅ clear |
| Laptop PATCH | stale data overwrite (two tabs) | admin-laptops integration | REST returns 409; form keeps prior save | ⚠️ confirm before overwrite |
| Order create | stock already 0 | payload-orders integration | hook clamps to 0 (existing) | ✅ badge shows Sold Out |
| Settings save | storefront footer stale | admin-settings integration | `revalidatePath('/')` in write path | ✅ footer updates |
| Description migration | old docs orphaned | admin-laptops integration | migration extracts paragraph text | ✅ renders as text |
| Inbox poll | network drop | chat integration | silent retry next poll | ⚠️ no indicator, next tick recovers |

## Effort estimate

**3–4 weeks solo** (corrected from the earlier optimistic 1–2 week estimate): shell+auth 2d, dashboard 1d, laptops form 3–4d, orders form 2–3d, inbox port 1d, media 1–2d, settings/categories/add-ons/users 2–3d, description conversion 1d, cutover+cleanup 2d, tests throughout. Phase 1 alone is ~2 weeks to a usable dashboard.

## Implementation tasks

- [ ] **T1 (P1)** — Merge chat branch to main — dependency for the inbox.
- [ ] **T2 (P1)** — Scaffold `/admin-v2` shell + auth gate + login page.
- [ ] **T3 (P1)** — `src/lib/admin-api.ts` + reusable list table.
- [ ] **T4 (P1)** — Dashboard page (local-API reads).
- [ ] **T5 (P1)** — Laptops list + edit form.
- [ ] **T6 (P1)** — Orders ledger + detail + record-a-sale.
- [ ] **T7 (P1)** — Conversations inbox port.
- [ ] **T8 (P2)** — Media grid.
- [ ] **T9 (P2)** — Settings page + `revalidatePath('/')`.
- [ ] **T10 (P2)** — Categories + add-ons + users pages.
- [ ] **T11 (P2)** — Description textarea conversion + data migration + storefront render.
- [ ] **T12 (P1)** — Cutover: remove `(payload)/admin`, `/admin-v2` → `/admin`, rewrite `admin-publish.spec.ts`, dep cleanup.
- [ ] **T13 (P1)** — Test suite: admin-auth, admin-query, admin-login, admin-laptops, admin-conversations, admin-settings, e2e rewrites.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | ISSUES OPEN | 10 issues, 1 critical regression |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **OUTSIDE VOICE:** ran (Codex subagent — codex CLI unavailable) — confirmed the REST-API deletion bug, caught the /admin route collision, challenged effort estimate (3-4wks), flagged Settings revalidation gap and unmerged chat dependency. All incorporated.
- **UNRESOLVED:** 0 — every finding was decided: phased scope (D1), keep REST API / delete admin only (1A), REST-only writes (2A), plain-text description (3A), shared admin-api + list table (2C), full test list (3A-test), full custom admin reaffirmed (2D), temp /admin-v2 cutover (2E), local-API server reads (2F), merge chat first (TODO 1).
- **VERDICT:** ENG REVIEW COMPLETE — 0 unresolved, 0 critical gaps. Run /ship when implementation lands.