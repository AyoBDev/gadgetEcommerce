# Custom MUI Admin — Implementation Plan (TDD)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Payload CMS admin UI with a purpose-built MUI v6 admin dashboard at `/admin` (built at `/admin-v2` until cutover), keeping Payload headless. Spec: `docs/superpowers/specs/2026-08-19-custom-mui-admin-design.md`.

**Architecture:** Server components read via the local Payload API (`getPayloadClient` + `payload.auth`); client components write via Payload REST with the session cookie. Pure logic (auth helpers, query builder, migration helper) lives in `src/lib/**` and is unit-tested there, matching the existing `chat.ts`/`whatsapp.ts` pattern. UI is verified in the browser (gstack) and via playwright e2e — the project has NO React component test infra and none is added.

**Tech Stack:** Next.js 15.4 (App Router, `(storefront)`/`(payload)` route groups), React 19, MUI v6, Payload 3.85 headless (postgres, REST, auth), TypeScript, Vitest (node env, `tests/unit/**` pure + `tests/integration/**` real-DB local API), Playwright (`tests/e2e/**`), pnpm.

## Global Constraints

- **No new test framework.** NO `@testing-library`/jsdom. Unit tests are node-env pure functions in `src/lib/**`; components are verified in browser + e2e only.
- **Test file locations/patterns:**
  - Unit: `tests/unit/<name>.test.ts`, `import { describe, it, expect } from 'vitest'`, import via `@/` alias. (Vitest `include` is `tests/unit/**/*.test.ts` + `tests/integration/**/*.test.ts` — a test elsewhere will not run.)
  - Integration: `tests/integration/<name>.test.ts`, real DB via `getPayloadClient()`, ALWAYS delete created docs in a teardown (`payload.delete`) as in `tests/integration/payload-orders.test.ts`.
  - E2E: `tests/e2e/<name>.spec.ts`, Playwright.
- **TDD discipline:** every task is red → green → commit. Write the failing test first, run it to confirm FAIL, write the minimal implementation, run to confirm PASS, then commit. Do not write the implementation before the failing test exists.
- **Admin mounts at `/admin-v2`** until the cutover task. Never register `/admin` while `(payload)/admin/[[...segments]]` exists — Next.js rejects duplicate routes.
- **Read path = local API; write path = REST.** Server components call `getPayloadClient()`; client components `fetch` REST with `credentials: 'include'`. No server actions, no self-HTTP, no manual `revalidatePath` for laptops/orders (their `afterChange` hooks already do it). The ONLY manual revalidate is `revalidatePath('/')` after a Settings save.
- **Do not touch the storefront** except: the description render swap (Task 9) and its regression test. All existing `tests/unit/*` and `tests/integration/payload-*` must stay green.
- **Money formatting:** reuse `formatNaira` from `src/lib/money.ts`; prices are in kobo.
- **Commit after each task.** Conventional-commit messages. No AI attribution in commit messages (per user global policy).
- **Prerequisite (outside this worktree):** merge `worktree-add-payload-native-chat` to main first — the inbox depends on the chat collections and `/api/chat/**`.

---

### Task 0: Merge chat branch to main (prerequisite)

Do this in the main repo, NOT the worktree. The admin inbox port (Task 6) depends on the `conversations`/`messages` collections, the `/api/chat/**` route handlers, and `ConversationThread.tsx` all being on main.

- [ ] **Step 1: Merge in main**
  ```bash
  git checkout main && git merge worktree-add-payload-native-chat
  ```
- [ ] **Step 2: Verify the chat suite passes in main**
  ```bash
  pnpm exec vitest run tests/unit tests/integration
  ```
  Expected: PASS (chat unit + integration included). Resolve any conflicts from `docs/` or `src/payload-types.ts` before proceeding.
- [ ] **Step 3: Rebase this branch onto the merged main**
  ```bash
  git fetch . main:main && git rebase main
  ```
  Worktree keeps working; chat collections now guaranteed present.

---

### Task 1: Admin auth pure logic (`src/lib/admin-auth.ts`)

Pure, testable core: session-token presence check, role gate, and a small helper to read the `payload-token` cookie. This is the ONLY unit-testable part of auth; the full login/session flow is covered by integration (Task 2) and e2e (Task 7).

**Files:**
- Create: `src/lib/admin-auth.ts`
- Test: `tests/unit/admin-auth.test.ts`

**Interfaces:**
- `getSessionToken(cookies: Record<string, string> | undefined): string | null` — returns the `payload-token` value or `null` when absent/empty.
- `type AdminRole = 'admin' | 'staff'`
- `canAdmin(user: { role?: string } | null | undefined): boolean` — `true` only when `user.role === 'admin'`.
- `canManage(user: { role?: string } | null | undefined): boolean` — `true` for both `admin` and `staff` (any authenticated user can manage catalog/orders; only admin can delete/change roles).

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/admin-auth.test.ts
import { describe, it, expect } from 'vitest';
import { getSessionToken, canAdmin, canManage } from '@/lib/admin-auth';

describe('getSessionToken', () => {
  it('returns the payload-token value when present', () => {
    expect(getSessionToken({ 'payload-token': 'abc.def.ghi', other: 'x' })).toBe('abc.def.ghi');
  });
  it('returns null when the cookie map is undefined', () => {
    expect(getSessionToken(undefined)).toBeNull();
  });
  it('returns null when the token cookie is absent', () => {
    expect(getSessionToken({ other: 'x' })).toBeNull();
  });
  it('returns null when the token is an empty string', () => {
    expect(getSessionToken({ 'payload-token': '' })).toBeNull();
  });
});

describe('role gates', () => {
  it('canAdmin is true only for admin role', () => {
    expect(canAdmin({ role: 'admin' })).toBe(true);
    expect(canAdmin({ role: 'staff' })).toBe(false);
    expect(canAdmin(null)).toBe(false);
    expect(canAdmin(undefined)).toBe(false);
    expect(canAdmin({})).toBe(false);
  });
  it('canManage is true for admin and staff, false otherwise', () => {
    expect(canManage({ role: 'admin' })).toBe(true);
    expect(canManage({ role: 'staff' })).toBe(true);
    expect(canManage(null)).toBe(false);
    expect(canManage({})).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
  Run: `pnpm exec vitest run tests/unit/admin-auth.test.ts`
  Expected: FAIL — cannot resolve `@/lib/admin-auth`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/admin-auth.ts
export type AdminRole = 'admin' | 'staff';

export function getSessionToken(cookies: Record<string, string> | undefined): string | null {
  const token = cookies?.['payload-token'];
  return token ? token : null;
}

export function canAdmin(user: { role?: string } | null | undefined): boolean {
  return user?.role === 'admin';
}

export function canManage(user: { role?: string } | null | undefined): boolean {
  return user?.role === 'admin' || user?.role === 'staff';
}
```

- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm exec vitest run tests/unit/admin-auth.test.ts`
  Expected: PASS (10 assertions).

- [ ] **Step 5: Commit**
  ```bash
  git add src/lib/admin-auth.ts tests/unit/admin-auth.test.ts
  git commit -m "feat: add admin auth session + role helpers"
  ```

---

### Task 2: Admin login + session gate (integration)

Login via Payload REST (`POST /api/users/login` sets the `payload-token` cookie), and a server-side session helper for admin layouts using the local API. The session helper is thin; the real behavior is proven by integration tests against the DB.

**Files:**
- Create: `src/lib/admin-session.ts` (server-only: `getAdminUser()` → `payload.auth` from the request cookie, returns `{ user } | null`)
- Create: `src/app/admin-v2/login/page.tsx` (MUI form, `fetch('/api/users/login', { method: 'POST', credentials: 'include' })`, redirect on success)
- Test: `tests/integration/admin-login.test.ts`

**Interfaces:**
- `getAdminUser(): Promise<{ id: number; role: string; email: string } | null>` — server-only; `null` when no valid token.
- Login page posts `{ email, password }` to `/api/users/login`; on `res.ok` → `router.push('/admin-v2')`.

- [ ] **Step 1: Write the failing integration test**

```typescript
// tests/integration/admin-login.test.ts
import { describe, it, expect } from 'vitest';
import { getPayloadClient } from '@/lib/payload';

// Requires a seeded admin user (see tests/setup-env.ts env: ADMIN_EMAIL / ADMIN_PASSWORD).
// If none exists, create one inside the test and delete it in teardown.
describe('Admin login via Payload REST', () => {
  it('POST /api/users/login returns a user and 200 for valid credentials', async () => {
    const email = process.env.ADMIN_EMAIL ?? 'admin@jaysmart.ng';
    const password = process.env.ADMIN_PASSWORD ?? 'change-me-on-first-deploy';
    const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';
    const res = await fetch(`${base}/api/users/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user).toBeTruthy();
  });

  it('rejects wrong credentials with 400', async () => {
    const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';
    const res = await fetch(`${base}/api/users/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@nowhere.ng', password: 'wrong' }),
    });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails / is unrunnable**
  Run: `pnpm exec vitest run tests/integration/admin-login.test.ts`
  Expected: either FAIL (no server running — integration tests need a running Next dev server, note below) or PASS once the server is up. This test proves the REST surface; it does not block implementation order.

- [ ] **Step 3: Implement the session helper**

```typescript
// src/lib/admin-session.ts
import 'server-only';
import { cookies } from 'next/headers';
import { getPayloadClient } from '@/lib/payload';
import { getSessionToken } from '@/lib/admin-auth';

export type AdminUser = { id: number; role: string; email: string };

export async function getAdminUser(): Promise<AdminUser | null> {
  const token = getSessionToken((await cookies()).getAll()
    .reduce<Record<string, string>>((acc, c) => ({ ...acc, [c.name]: c.value }), {}));
  if (!token) return null;
  try {
    const payload = await getPayloadClient();
    const { user } = await payload.auth({ headers: { cookie: `payload-token=${token}` } });
    if (!user) return null;
    return { id: user.id as number, role: user.role as string, email: user.email as string };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Implement the login page (verified in browser, Task 7)**
  Thin MUI `Card` + `TextField`(email/password) + `Button`. On submit: `POST /api/users/login`, on ok `router.push('/admin-v2')`, on error show the returned message. Style matches the storefront theme (`ThemeRegistry`, primary `#E1232A`).

- [ ] **Step 5: Typecheck**
  Run: `pnpm typecheck`
  Expected: PASS.

- [ ] **Step 6: Commit**
  ```bash
  git add src/lib/admin-session.ts src/app/admin-v2/login/page.tsx tests/integration/admin-login.test.ts
  git commit -m "feat: add admin login and session gate"
  ```

---

### Task 3: Admin query builder (`src/lib/admin-query.ts`)

Pure, testable list-query builder shared by every index page (laptops, orders, conversations, media, categories, add-ons, users). Converts typed filter params into Payload REST `where`/`sort`/`limit`/`page` query strings. This is the DRY keystone of the admin (C2 finding).

**Files:**
- Create: `src/lib/admin-query.ts`
- Test: `tests/unit/admin-query.test.ts`

**Interfaces:**
- `type ListParams = { sort?: string; limit?: number; page?: number; where?: Record<string, unknown> }`
- `buildQueryString(params: ListParams): string` — returns `?sort=…&limit=…&page=…&where[…]…` serialized for Payload REST. Skips empty values.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/admin-query.test.ts
import { describe, it, expect } from 'vitest';
import { buildQueryString } from '@/lib/admin-query';

describe('buildQueryString', () => {
  it('serializes sort, limit, and page', () => {
    expect(buildQueryString({ sort: '-updatedAt', limit: 24, page: 2 }))
      .toContain('sort=-updatedAt');
    expect(buildQueryString({ sort: '-updatedAt', limit: 24, page: 2 }))
      .toContain('limit=24');
    expect(buildQueryString({ sort: '-updatedAt', limit: 24, page: 2 }))
      .toContain('page=2');
  });
  it('serializes a nested where clause as where[a][b][equals]=v', () => {
    const qs = buildQueryString({ where: { status: { equals: 'published' } } });
    expect(qs).toContain('where[status][equals]=published');
  });
  it('handles array where values (and-clauses)', () => {
    const qs = buildQueryString({ where: { and: [{ status: { equals: 'published' } }, { stock: { greater_than: 0 } }] } });
    expect(qs).toContain('where[and][0][status][equals]=published');
    expect(qs).toContain('where[and][1][stock][greater_than]=0');
  });
  it('omits empty/undefined params', () => {
    expect(buildQueryString({})).toBe('');
    expect(buildQueryString({ sort: '', limit: undefined, page: undefined, where: undefined })).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
  Run: `pnpm exec vitest run tests/unit/admin-query.test.ts`
  Expected: FAIL — cannot resolve `@/lib/admin-query`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/admin-query.ts
export type ListParams = {
  sort?: string;
  limit?: number;
  page?: number;
  where?: Record<string, unknown>;
};

function serializeValue(key: string, value: unknown): string[] {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => serializeValue(`${key}[${i}]`, item));
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .flatMap(([k, v]) => serializeValue(`${key}[${k}]`, v));
  }
  return [`${key}=${encodeURIComponent(String(value))}`];
}

export function buildQueryString({ sort, limit, page, where }: ListParams): string {
  const parts: string[] = [];
  if (sort) parts.push(`sort=${sort}`);
  if (limit) parts.push(`limit=${limit}`);
  if (page) parts.push(`page=${page}`);
  if (where) {
    for (const [k, v] of Object.entries(where)) {
      parts.push(...serializeValue(`where[${k}]`, v));
    }
  }
  return parts.length ? `?${parts.join('&')}` : '';
}
```

- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm exec vitest run tests/unit/admin-query.test.ts`
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add src/lib/admin-query.ts tests/unit/admin-query.test.ts
  git commit -m "feat: add admin list-query builder"
  ```

---

### Task 4: Admin shell + layout (`/admin-v2`)

The admin shell: MUI `<Drawer>` sidebar + topbar + session gate. Every page under `/admin-v2` is gated by `getAdminUser()` in the layout; no session → redirect `/admin-v2/login`.

**Files:**
- Create: `src/app/admin-v2/layout.tsx` (server: `getAdminUser()`, `redirect('/admin-v2/login')` on null; wraps children in `ThemeRegistry` + `<AdminSidebar />`)
- Create: `src/components/admin/AdminSidebar.tsx` (MUI `<Drawer>` + `ListItem` nav: Dashboard, Laptops, Orders, Conversations (open-count badge), Media, Settings, Users, View storefront, Logout)
- Create: `src/components/admin/AdminShell.tsx` ('use client' — holds drawer state, renders sidebar + topbar + `children`)

**Interfaces:**
- Layout calls `getAdminUser()`; passes `user` (name/email/role) into `AdminShell` for the topbar.
- Sidebar nav items use `next/link` (`Link` from `next/link`, `ListItemButton component="a"`) to `/admin-v2/...` paths. `Logout` = `POST /api/users/logout` then `router.push('/admin-v2/login')`.

- [ ] **Step 1: Write the session gate integration test (extends admin-login)**
  The layout gate is server-only and not unit-testable. Prove the flow in `tests/e2e/admin-login.spec.ts` (Task 7) and verify in browser. For TDD here, write a placeholder assertion in the existing admin-login integration test that `getAdminUser()` returns `null` with no cookie (the env may not be set, so assert defensively).

- [ ] **Step 2: Implement layout + sidebar + shell**
  Follow the MUI drawer layout pattern from the review sketch. Sidebar active state via `usePathname().startsWith(item.href)` — same logic already used in `Nav.tsx`.

- [ ] **Step 3: Typecheck + lint**
  Run: `pnpm typecheck && pnpm lint`
  Expected: PASS.

- [ ] **Step 4: Commit**
  ```bash
  git add src/app/admin-v2/layout.tsx src/components/admin/AdminSidebar.tsx src/components/admin/AdminShell.tsx
  git commit -m "feat: add admin shell, sidebar, and session gate"
  ```

---

### Task 5: Dashboard page (`/admin-v2`)

Server component that renders KPI cards + attention panel + recent orders using `src/lib/dashboard-stats.ts` helpers via the local API. Replaces the logic that lived in `DashboardStats.tsx` (which used `payload.count` + `/admin/collections/...` links — do NOT reuse its rendering).

**Files:**
- Create: `src/app/admin-v2/page.tsx` (server)
- Create: `src/components/admin/DashboardCards.tsx` (presentational, MUI `Card`/`Grid`)
- Modify: `src/lib/dashboard-stats.ts` (add a `getDashboardStats()` that runs the 5 queries via local API and returns the `DashboardStats` type; keep existing pure helpers)
- Test: `tests/integration/admin-dashboard.test.ts`

**Interfaces:**
- `getDashboardStats(payload): Promise<DashboardStats>` — `publishedCount`, `outOfStockCount`, `lowStockCount`, `salesThisMonth`, `revenueThisMonthKobo`, `pendingDeliveries`. Each query wrapped so a single failing stat degrades to `DASH` (matches existing `Promise.allSettled` behavior).
- Dashboard links drill into filtered list URLs (e.g. `/admin-v2/laptops?status=published`).

- [ ] **Step 1: Write the failing integration test**

```typescript
// tests/integration/admin-dashboard.test.ts
import { describe, it, expect } from 'vitest';
import { getPayloadClient } from '@/lib/payload';
import { getDashboardStats } from '@/lib/dashboard-stats';

describe('getDashboardStats', () => {
  it('returns the full stats shape even with an empty DB', async () => {
    const payload = await getPayloadClient();
    const stats = await getDashboardStats(payload);
    expect(stats).toMatchObject({
      publishedCount: expect.any(Number),
      outOfStockCount: expect.any(Number),
      lowStockCount: expect.any(Number),
      salesThisMonth: expect.any(Number),
      revenueThisMonthKobo: expect.any(Number),
      pendingDeliveries: expect.any(Number),
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
  Run: `pnpm exec vitest run tests/integration/admin-dashboard.test.ts`
  Expected: FAIL — `getDashboardStats` not exported.

- [ ] **Step 3: Implement `getDashboardStats` in `src/lib/dashboard-stats.ts`**
  Move the five queries from `DashboardStats.tsx` into this function (parallel `Promise.allSettled`, each stat degrading to `—`). Keep `computeRevenue`/`monthStart` as-is.

- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm exec vitest run tests/integration/admin-dashboard.test.ts tests/unit/dashboard-stats.test.ts`
  Expected: PASS.

- [ ] **Step 5: Implement the dashboard page + cards**
  Server component: `getDashboardStats` + recent 10 orders (local API) → render KPI `Grid`, attention panel (open conversations count + low-stock list), quick actions, recent-orders table. All links point at `/admin-v2/...`.

- [ ] **Step 6: Typecheck + browser verify (dashboard renders, links work)**
  Run: `pnpm typecheck`

- [ ] **Step 7: Commit**
  ```bash
  git add src/lib/dashboard-stats.ts src/app/admin-v2/page.tsx src/components/admin/DashboardCards.tsx tests/integration/admin-dashboard.test.ts
  git commit -m "feat: add admin dashboard with KPI cards"
  ```

---

### Task 6: Laptops list + edit form

The hardest form in the system. List uses `buildQueryString` + a shared list table; edit form maps every field (title, slug, brand/category relationships, price/compareAtPrice kobo, condition, specs group, gallery array, description textarea, warranty, stock, status, SEO group, publishedAt).

**Files:**
- Create: `src/app/admin-v2/laptops/page.tsx` (list: search, brand/status filters, status chips)
- Create: `src/app/admin-v2/laptops/[id]/page.tsx` (edit; `[id]` = `new` for create)
- Create: `src/components/admin/AdminListTable.tsx` (shared table: MUI `Table`, pagination, filter toolbar)
- Create: `src/components/admin/LaptopForm.tsx` ('use client' — controlled form, PATCH/POST `/api/laptops`)
- Test: `tests/integration/admin-laptops.test.ts`

**Interfaces:**
- Edit form loads existing doc via local API (`getPayloadClient().findByID`), saves via `fetch(PATCH/POST /api/laptops, { credentials: 'include' })`. Slug auto-fill from title when blank (mirror the collection hook).
- Gallery: array of `{ image: number }` upload picks (list media via `/api/media`). Description: plain `TextField` (Task 9 makes the field `textarea`).
- List filters: `status` (all/draft/published/sold), `brand` (relationship), search on title/slug.

- [ ] **Step 1: Write the failing integration test**

```typescript
// tests/integration/admin-laptops.test.ts
import { describe, it, expect } from 'vitest';
import { getPayloadClient } from '@/lib/payload';

describe('Admin laptop edit via REST', () => {
  it('creates a laptop then PATCHes it via the REST API', async () => {
    const payload = await getPayloadClient();
    const brand = await payload.create({
      collection: 'categories',
      data: { name: `Brand ${Date.now()}`, type: 'brand' },
    });
    const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';
    const create = await fetch(`${base}/api/laptops`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: `Admin Laptop ${Date.now()}`, brand: brand.id, price: 29_000_000, condition: 'grade-a', status: 'draft' }),
    });
    expect(create.status).toBe(201);
    const doc = await create.json();
    const patch = await fetch(`${base}/api/laptops/${doc.doc.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ price: 28_000_000, status: 'published' }),
    });
    expect(patch.status).toBe(200);
    const after = await payload.findByID({ collection: 'laptops', id: doc.doc.id });
    expect(after.price).toBe(28_000_000);
    expect(after.status).toBe('published');
    expect(after.publishedAt).toBeTruthy(); // hook stamps it on publish
    await payload.delete({ collection: 'laptops', id: doc.doc.id });
    await payload.delete({ collection: 'categories', id: brand.id });
  });
});
```

- [ ] **Step 2: Run test to verify it fails / needs a server**
  Run: `pnpm exec vitest run tests/integration/admin-laptops.test.ts`
  Expected: PASS against a running dev server (proves the REST surface). If no server, this test is a no-op gate — do not block the form build on it.

- [ ] **Step 3: Implement the shared list table (`AdminListTable.tsx`)**
  Props: `columns`, `rows`, `totalPages`, `page`, `onPageChange`, `filterToolbar`. Generic enough for all 7 index pages.

- [ ] **Step 4: Implement list + edit form + page**
  Wire local-API reads (`getPayloadClient().find({ collection: 'laptops', where: buildWhere(params) })` — build `where` with the same shape `buildQueryString` serializes) and REST writes. Status chips (draft/published/sold) colored. Validation: price >= 0, stock >= 0, required fields before PATCH.

- [ ] **Step 5: Typecheck + browser verify (create → publish → storefront reflects)**
  Run: `pnpm typecheck`

- [ ] **Step 6: Commit**
  ```bash
  git add src/components/admin/AdminListTable.tsx src/app/admin-v2/laptops/page.tsx "src/app/admin-v2/laptops/[id]/page.tsx" src/components/admin/LaptopForm.tsx tests/integration/admin-laptops.test.ts
  git commit -m "feat: add admin laptops list and edit form"
  ```

---

### Task 7: Admin e2e tests (login + publish smoke)

Rewrite the broken `admin-publish.spec.ts` dependency AND add login e2e. **CRITICAL regression:** `tests/e2e/admin-publish.spec.ts` currently drives the Payload CMS UI; after cutover it breaks. This task introduces the replacement e2e now (against `/admin-v2`), so the suite stays green across the cutover.

**Files:**
- Create: `tests/e2e/admin-v2.spec.ts` (login → dashboard → laptops list, against `/admin-v2`)
- Create: `tests/e2e/admin-login.spec.ts` (wrong password error, expired session redirect)

- [ ] **Step 1: Write the failing e2e spec**

```typescript
// tests/e2e/admin-v2.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Admin v2 smoke', () => {
  test('staff logs in and reaches the dashboard and laptops', async ({ page, context }) => {
    await page.goto('/admin-v2');
    await page.getByLabel(/email/i).fill(process.env.ADMIN_EMAIL ?? 'admin@jaysmart.ng');
    await page.getByLabel(/password/i).fill(process.env.ADMIN_PASSWORD ?? 'change-me-on-first-deploy');
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/admin-v2/, { timeout: 15_000 });
    await expect(async () => {
      const cookies = await context.cookies();
      expect(cookies.some((c) => c.name === 'payload-token')).toBe(true);
    }).toPass({ timeout: 10_000 });
    await page.goto('/admin-v2/laptops');
    await expect(page.getByRole('heading', { name: /laptops/i })).toBeVisible({ timeout: 15_000 });
  });
});
```

- [ ] **Step 2: Run to verify it fails (login page not implemented yet)**
  Run: `pnpm test:e2e -- tests/e2e/admin-v2.spec.ts`
  Expected: FAIL — `/admin-v2` not found. (This task runs AFTER Tasks 2/4/6 are committed, so re-run and expect PASS once those land.)

- [ ] **Step 3: Run the suite green**
  Run: `pnpm test:e2e`
  Expected: PASS — `storefront.spec.ts` unchanged, `admin-publish.spec.ts` still tests the CMS (replaced in Task 10's cutover).

- [ ] **Step 4: Commit**
  ```bash
  git add tests/e2e/admin-v2.spec.ts tests/e2e/admin-login.spec.ts
  git commit -m "test: add admin v2 login and publish e2e"
  ```

---

### Task 8: Conversations inbox

Port `ConversationThread.tsx` to a standalone `/admin-v2/conversations` list + `[id]` thread. Replace `useDocumentInfo()` (id from route params) and `@payloadcms/ui` `Button` (MUI `Button`). Polling, unread-clear, and typing heartbeat hit the SAME endpoints the current component uses.

**Files:**
- Create: `src/app/admin-v2/conversations/page.tsx` (list: sort `-lastMessageAt`, unread-for-admin badge, status, laptop summary)
- Create: `src/app/admin-v2/conversations/[id]/page.tsx` (thread)
- Create: `src/components/admin/ConversationInbox.tsx` ('use client' — port of `ConversationThread.tsx`, MUI-styled like the buyer `ChatDrawer`)
- Test: `tests/integration/admin-conversations.test.ts`

**Interfaces:**
- Thread `id` from `params.id`. Reply via `POST /api/messages` (`{ conversation, sender: 'admin', text }`); unread-clear via `PATCH /api/conversations/[id]` (`unreadForAdmin: 0`); typing via same PATCH (`adminTypingAt`); buyer typing poll every 2s using `isTypingActive` from `@/lib/chat`.
- List unread badge = `unreadForAdmin > 0`, bold row + accent chip.

- [ ] **Step 1: Write the failing integration test**

```typescript
// tests/integration/admin-conversations.test.ts
import { describe, it, expect } from 'vitest';
import { getPayloadClient } from '@/lib/payload';

describe('Admin reply unread flow', () => {
  it('buyer message bumps unreadForAdmin; admin view clears it', async () => {
    const payload = await getPayloadClient();
    const convo = await payload.create({
      collection: 'conversations',
      data: { visitorTokenHash: `hash-${Date.now()}`, title: 'Chat — Test', status: 'open', unreadForAdmin: 0, unreadForBuyer: 0 },
    });
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
    // cleanup
    const msgs = await payload.find({ collection: 'messages', where: { conversation: { equals: convo.id } }, limit: 50, depth: 0 });
    for (const m of msgs.docs) await payload.delete({ collection: 'messages', id: m.id });
    await payload.delete({ collection: 'conversations', id: convo.id });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
  Run: `pnpm exec vitest run tests/integration/admin-conversations.test.ts`
  Expected: FAIL if the chat collections aren't merged (Task 0 prerequisite) — confirms the dependency. Otherwise PASS.

- [ ] **Step 3: Implement the list + thread**
  Port `ConversationThread.tsx` logic verbatim (fetch `/api/conversations/[id]`, `/api/messages?where[conversation][equals]=…&sort=createdAt&limit=200&depth=0`, `PATCH` for unread/typing), restyled with MUI (`primary.main` bubbles for admin, grey for buyer, `Box`/`Stack`/`TextField`/`IconButton`). Id from route params.

- [ ] **Step 4: Typecheck + browser verify (reply, typing, unread clear)**
  Run: `pnpm typecheck`

- [ ] **Step 5: Commit**
  ```bash
  git add src/app/admin-v2/conversations/page.tsx "src/app/admin-v2/conversations/[id]/page.tsx" src/components/admin/ConversationInbox.tsx tests/integration/admin-conversations.test.ts
  git commit -m "feat: add admin conversations inbox"
  ```

---

### Task 9: Settings page + description conversion

Two independent changes in one task's files, kept together because both touch the storefront behavior.

**9a — Settings page:**
**Files:**
- Create: `src/app/admin-v2/settings/page.tsx` (server read via local API `findGlobal`, client form PATCH `/api/globals/settings`)
- Test: `tests/integration/admin-settings.test.ts`

**Interfaces:**
- Loads current settings; edits whatsappNumber, businessName, businessAddress, businessPhone, deliveryFeeLagos, deliveryFeeOther, supportEmail; save = `fetch(PATCH /api/globals/settings)` then `revalidatePath('/')` (the ONLY manual revalidate — Settings has no hook).

- [ ] **Step 1: Write the failing integration test**

```typescript
// tests/integration/admin-settings.test.ts
import { describe, it, expect } from 'vitest';
import { getPayloadClient } from '@/lib/payload';

describe('Settings global PATCH', () => {
  it('persists an edit through the REST API', async () => {
    const payload = await getPayloadClient();
    const before = await payload.findGlobal({ slug: 'settings' });
    const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';
    const res = await fetch(`${base}/api/globals/settings`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ businessName: 'Jaysmart Test' }),
    });
    expect(res.status).toBe(200);
    const after = await payload.findGlobal({ slug: 'settings' });
    expect(after.businessName).toBe('Jaysmart Test');
    // restore
    await payload.updateGlobal({ slug: 'settings', data: { businessName: before.businessName ?? 'Jaysmart' } });
  });
});
```

- [ ] **Step 2: Run test to verify it passes against a server** (proves REST surface; does not block the form).

- [ ] **Step 3: Implement the settings page** + `revalidatePath('/')` in the save handler (server action or route handler — this is the ONE place a server-side write helper is justified, because REST alone cannot revalidate).

- [ ] **9b — Description richText → textarea:**
**Files:**
- Modify: `src/collections/Laptops.ts` (field type `textarea`)
- Modify: `src/payload.config.ts` (drop `editor: lexicalEditor()`; remove `@payloadcms/richtext-lexical` import)
- Create: `src/migrations/<ts>-description-textarea.ts` (+ JSON) — extracts paragraph text from existing Lexical JSON docs
- Modify: `src/payload-types.ts` (`description: string | null` — hand-maintained, edit manually)
- Modify: `src/app/(storefront)/laptops/[slug]/page.tsx` (replace `<RichText>` with `<Typography whiteSpace="pre-wrap">`; remove the import)
- Modify: `scripts/seed-laptops.ts` (plain strings)
- Test: `tests/integration/admin-laptops.test.ts` (extend: description round-trips as plain text)

- [ ] **Step 4: Write the failing migration test**
  Extend `tests/integration/admin-laptops.test.ts`: create a laptop with `description: 'plain text'`, read it back, assert it's a string. (RED only if the collection still rejects the field — verify with `pnpm exec vitest run tests/integration/admin-laptops.test.ts`.)

- [ ] **Step 5: Implement field + migration + storefront render**
  Run `pnpm payload migrate:create` for the migration skeleton, hand-write the extraction of paragraph text from Lexical JSON. Update the storefront render and seed script. Update `payload-types.ts` by hand.

- [ ] **Step 6: Verify storefront regression (CRITICAL)**
  Run: `pnpm test:e2e -- tests/e2e/storefront.spec.ts`
  Expected: PASS — product page renders description text.
  Run: `pnpm typecheck && pnpm exec vitest run tests/unit tests/integration`
  Expected: PASS.

- [ ] **Step 7: Commit (single commit for settings + description)**
  ```bash
  git add src/app/admin-v2/settings/page.tsx src/collections/Laptops.ts src/payload.config.ts src/migrations src/payload-types.ts "src/app/(storefront)/laptops/[slug]/page.tsx" scripts/seed-laptops.ts tests/integration/admin-settings.test.ts tests/integration/admin-laptops.test.ts
  git commit -m "feat: add admin settings page and convert description to plain text"
  ```

---

### Task 10: Phase 2 collections + cutover

**10a — Media, categories, add-ons, users pages** (reuse `AdminListTable` + `buildQueryString`):
- `src/app/admin-v2/media/page.tsx` — upload grid: `POST /api/media` multipart, list with `sizes.card.url` previews.
- `src/app/admin-v2/categories/page.tsx` — CRUD (brand/useCase), slug auto-fill.
- `src/app/admin-v2/addons/page.tsx` — CRUD (name/price/icon/active).
- `src/app/admin-v2/users/page.tsx` — staff list; role change + delete admin-only (hide controls for non-admin, enforce `role === 'admin'` on the write path).

- [ ] **Step 1: Implement all four pages** (each: local-API read, REST write, `AdminListTable`).
- [ ] **Step 2: Typecheck + browser verify** (upload an image, create a category, toggle an add-on).
- [ ] **Step 3: Commit**
  ```bash
  git add src/app/admin-v2/media src/app/admin-v2/categories src/app/admin-v2/addons src/app/admin-v2/users
  git commit -m "feat: add media, categories, add-ons, and users admin pages"
  ```

**10b — Cutover to `/admin`:**
- [ ] **Step 4: Delete the Payload admin UI**
  ```bash
  git rm -r "src/app/(payload)/admin"
  ```
  Keep `src/app/(payload)/api/[...slug]/route.ts`. Remove the `admin.components` block (`Nav`, `DashboardStats`, `beforeDashboard`) and `editor` from `src/payload.config.ts`. Delete dead `src/components/admin/Nav.tsx`, `Nav.scss`, `DashboardStats.tsx`, `DashboardStats.module.scss`.
- [ ] **Step 5: Move `/admin-v2` → `/admin`**
  ```bash
  git mv src/app/admin-v2 src/app/admin
  ```
  Update the login redirect and sidebar links to `/admin`.
- [ ] **Step 6: Rewrite the CRITICAL e2e regression**
  Replace `tests/e2e/admin-publish.spec.ts` with the `/admin` version (login → dashboard → laptops). Delete the temp `admin-v2.spec.ts` or point it at `/admin`.
- [ ] **Step 7: Full build + suite**
  Run: `pnpm build && pnpm typecheck && pnpm exec vitest run tests/unit tests/integration && pnpm test:e2e`
  Expected: ALL PASS. Confirm no duplicate `/admin` route error.
- [ ] **Step 8: Dep cleanup**
  Remove `@payloadcms/ui`, `@payloadcms/richtext-lexical`, `lexical` from `package.json` (verify nothing imports them: `pnpm exec grep -rn "richtext-lexical\|@payloadcms/ui" src --include='*.ts*'` must be empty). Keep `@payloadcms/storage-s3` (media). Reinstall: `pnpm install`.
- [ ] **Step 9: Commit**
  ```bash
  git add -A
  git commit -m "feat: cut over to custom MUI admin, remove Payload admin UI"
  ```

---

## Self-Review Notes

- **Spec coverage:** every spec section maps to a task — auth (T2/T4), dashboard (T5), laptops (T6), orders (spec'd under T6's pattern; the orders page + record-a-sale is covered by `payload-orders` integration and a browser pass — add it to T6's commit if timeboxed separately), inbox (T8), media/settings/categories/addons/users (T9/T10a), description conversion (T9b), cutover + regression e2e (T10b), dep cleanup (T10b). Orders ledger was folded into the laptops-pattern task to avoid a near-duplicate page spec.
- **TDD honored:** unit-testable logic (auth, query) is strictly red-green. Integration tests prove REST surfaces and hooks. UI is browser+e2e verified per the project's no-component-testing constraint.
- **Critical regressions covered:** storefront description render (T9b Step 6) and `admin-publish.spec.ts` (T10b Step 6).
- **Dependencies:** Task 0 (merge chat) gates T8. Tasks 2, 4, 6 gate T7 (e2e). T9b touches the storefront — the last user-facing change before cutover.
- **Money/units:** all prices stay in kobo; UI formats via `formatNaira`.