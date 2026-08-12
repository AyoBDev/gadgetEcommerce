# Payload-native Buyer Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace buyer-facing WhatsApp/Chatwoot messaging with one branded chat: buyers chat from the storefront, staff reply in Payload admin, each conversation optionally linked to a laptop.

**Architecture:** Two Payload collections (`conversations`, `messages`) own the data. An anonymous buyer is identified by an opaque token stored in an httpOnly cookie; its SHA-256 hash is persisted on the conversation. Public REST route handlers under `src/app/api/chat/**` authorize a buyer only for their own conversation (cookie token → hash match); admins reply through Payload's own authenticated local API/admin UI. A `'use client'` storefront drawer polls for messages and typing presence; the product page's chat controls open a laptop-linked conversation. Web-push (VAPID) is the final, independently-deferrable layer with an in-app unread badge as the always-on fallback.

**Tech Stack:** Next.js 15.4 (App Router, `(storefront)`/`(payload)` route groups, `src/app/api/**` route handlers), React 19, MUI v6, Payload 3.85 (postgres adapter), TypeScript, Vitest (node env: `tests/unit/**` pure logic + `tests/integration/**` real-DB local API), pnpm, `web-push` for VAPID.

## Global Constraints

- **This is a customized Next.js (see `AGENTS.md`).** Before writing any route handler, cookie code, or Payload local-API call, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices. Do not assume API shapes from training data.
- **Payload codegen is broken on this machine** (`generate:types`/`importmap` CLIs fail). `src/payload-types.ts` and the admin importMap are **hand-maintained** — edit them by hand; never run the codegen CLIs. After adding an admin component, the dev server must be restarted or the importMap error appears stale.
- **No new test framework.** No React component testing infra (`@testing-library`/jsdom absent) — do NOT add it. Pure logic → `tests/unit/<name>.test.ts` (`import { describe, it, expect, vi } from 'vitest'`, subject via `@/` alias). Collection/authorization behavior → `tests/integration/<name>.test.ts` using `getPayloadClient()` against a real Postgres, cleaning up every created doc (see `tests/integration/payload-orders.test.ts`). Components/drawers → browser preview only.
- **Integration tests need a running Postgres** (`DATABASE_URL` in `.env.local`, loaded by `tests/setup-env.ts`). If unavailable, the task's integration step is blocked — say so and stop; do not fake a pass.
- **Money is stored in kobo (minor units).** Reuse `formatNaira` from `@/lib/money` for any displayed price (`28_000_000` → `₦280,000`). Never hand-format currency.
- **Security (from spec):** never expose a conversation to anyone but its token holder or an authenticated admin; rate-limit public create/send; sanitize + length-limit text; render text as plain text (no HTML/`dangerouslySetInnerHTML`); VAPID private key stays server-only (no `NEXT_PUBLIC_` prefix).
- **Cookie:** opaque token, `httpOnly`, `secure` in production, `sameSite: 'lax'`, `path: '/'`, long-lived (1 year). Mirror the security posture of `Users.auth.cookies`.
- **Config via env:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (browser-exposed subscribe key), `VAPID_PRIVATE_KEY` + `VAPID_SUBJECT` (server-only). Web-push features no-op cleanly when unset.
- **Do not touch WhatsApp/Chatwoot elsewhere in this plan's non-chat scope.** This plan removes the storefront `WhatsAppFab` and swaps the product page's two WhatsApp action buttons for chat controls; it leaves add-ons, related products, top nav, and `WhatsAppCallout` alone unless a task says otherwise. The Chatwoot worktree is a separate, superseded branch — do not merge or reference its code.
- **Commit after each task** with conventional-commit messages. **No AI attribution** in commit messages, code comments, or docs (per user global policy).
- **Non-goals (v1):** attachments, multi-agent routing, payment collection, read receipts, mobile-native push.

---

### Task 1: Chat pure logic — token, hashing, sanitize, attributes (`src/lib/chat.ts`)

Pure, browser-and-node-safe helpers with no Payload/Next imports, unit-tested in isolation. This is the trust boundary's math: token generation, constant-time-ish hash compare, text sanitation/length cap, and the laptop-context summary.

**Files:**
- Create: `src/lib/chat.ts`
- Test: `tests/unit/chat.test.ts`

**Interfaces:**
- Consumes: `formatNaira` from `@/lib/money`; Node `crypto` (`randomBytes`, `createHash`, `timingSafeEqual`).
- Produces:
  - `const MAX_MESSAGE_LEN = 2000`
  - `function generateVisitorToken(): string` — 32 random bytes hex (64 chars).
  - `function hashVisitorToken(token: string): string` — lowercase hex SHA-256 of the token.
  - `function tokensMatch(rawToken: string | undefined, storedHash: string | undefined): boolean` — `false` unless both present and `hashVisitorToken(rawToken)` equals `storedHash` via length-safe `timingSafeEqual`; never throws.
  - `function sanitizeMessageText(input: unknown): string` — coerce to string, strip control chars except `\n`/`\t`, collapse to `\n`, trim, hard-cap to `MAX_MESSAGE_LEN`. Returns `''` for non-strings/empty.
  - `type LaptopContext = { title: string; price: number; url: string }`
  - `function buildLaptopSummary(laptop: LaptopContext): string` — `` `${title} — ${formatNaira(price)}` `` (url carried separately by callers; summary is display text).

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/chat.test.ts
import { describe, it, expect } from 'vitest';
import {
  MAX_MESSAGE_LEN,
  generateVisitorToken,
  hashVisitorToken,
  tokensMatch,
  sanitizeMessageText,
  buildLaptopSummary,
} from '@/lib/chat';

describe('generateVisitorToken', () => {
  it('returns 64 hex chars and differs each call', () => {
    const a = generateVisitorToken();
    const b = generateVisitorToken();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });
});

describe('hashVisitorToken + tokensMatch', () => {
  it('hash is stable, 64 hex chars, and not the raw token', () => {
    const t = generateVisitorToken();
    const h = hashVisitorToken(t);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).toBe(hashVisitorToken(t));
    expect(h).not.toBe(t);
  });
  it('tokensMatch true only for the matching token', () => {
    const t = generateVisitorToken();
    const h = hashVisitorToken(t);
    expect(tokensMatch(t, h)).toBe(true);
    expect(tokensMatch(generateVisitorToken(), h)).toBe(false);
  });
  it('tokensMatch is false and never throws on missing input', () => {
    const h = hashVisitorToken(generateVisitorToken());
    expect(tokensMatch(undefined, h)).toBe(false);
    expect(tokensMatch('abc', undefined)).toBe(false);
    expect(tokensMatch(undefined, undefined)).toBe(false);
    expect(tokensMatch('short', h)).toBe(false);
  });
});

describe('sanitizeMessageText', () => {
  it('trims, keeps newlines, drops control chars', () => {
    expect(sanitizeMessageText('  hi\nthere  ')).toBe('hi\nthere');
  });
  it('returns empty string for non-strings and blanks', () => {
    expect(sanitizeMessageText(undefined)).toBe('');
    expect(sanitizeMessageText(42)).toBe('');
    expect(sanitizeMessageText('   ')).toBe('');
  });
  it('caps at MAX_MESSAGE_LEN', () => {
    const long = 'a'.repeat(MAX_MESSAGE_LEN + 50);
    expect(sanitizeMessageText(long)).toHaveLength(MAX_MESSAGE_LEN);
  });
});

describe('buildLaptopSummary', () => {
  it('formats title and naira price', () => {
    expect(buildLaptopSummary({ title: 'Dell 7490', price: 28_000_000, url: 'https://x.ng/l/dell' }))
      .toBe('Dell 7490 — ₦280,000');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/unit/chat.test.ts`
Expected: FAIL — cannot resolve `@/lib/chat`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/chat.ts
import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { formatNaira } from '@/lib/money';

export const MAX_MESSAGE_LEN = 2000;

export function generateVisitorToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashVisitorToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function tokensMatch(rawToken: string | undefined, storedHash: string | undefined): boolean {
  if (!rawToken || !storedHash) return false;
  try {
    const a = Buffer.from(hashVisitorToken(rawToken), 'hex');
    const b = Buffer.from(storedHash, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function sanitizeMessageText(input: unknown): string {
  if (typeof input !== 'string') return '';
  // Drop control chars except tab/newline; normalize CRLF to LF.
  const cleaned = input
    .replace(/\r\n?/g, '\n')
    // eslint-disable-next-line no-control-regex
    .replace(/[ --]/g, '')
    .trim();
  return cleaned.slice(0, MAX_MESSAGE_LEN);
}

export type LaptopContext = { title: string; price: number; url: string };

export function buildLaptopSummary(laptop: LaptopContext): string {
  return `${laptop.title} — ${formatNaira(laptop.price)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/unit/chat.test.ts`
Expected: PASS (all describes green).

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat.ts tests/unit/chat.test.ts
git commit -m "feat: add chat pure logic — token, hashing, sanitize, laptop summary"
```

---

### Task 2: `conversations` + `messages` collections + payload-types + config wiring

The data model. Conversations hold the visitor-token hash, optional laptop relation, status, last-message time, and buyer/admin unread counts. Messages hold sender, sanitized text, and read time, and (via hook) bump the parent conversation's `lastMessageAt` + unread counters. Public read/create is closed at the collection layer — all buyer access flows through the token-authorized route handlers in Task 4; only authenticated Payload users touch these collections directly.

**Files:**
- Create: `src/collections/Conversations.ts`
- Create: `src/collections/Messages.ts`
- Modify: `src/payload.config.ts` (import both; add to `collections` array after `Orders`)
- Modify: `src/payload-types.ts` (hand-add `Conversation` + `Message` interfaces and `collections` map entries — codegen is broken, see Global Constraints)
- Test: `tests/integration/payload-chat-model.test.ts`

**Interfaces:**
- Consumes: `sanitizeMessageText` from `@/lib/chat`.
- Produces (collection slugs + field names other tasks rely on):
  - `conversations`: `visitorTokenHash: string` (indexed, admin-hidden), `laptop?: relationship→laptops`, `laptopSummary?: text`, `laptopUrl?: text`, `status: 'open'|'resolved'` (default `open`), `lastMessageAt: date`, `unreadForAdmin: number` (default 0), `unreadForBuyer: number` (default 0).
  - `messages`: `conversation: relationship→conversations` (required, indexed), `sender: 'buyer'|'admin'` (required), `text: text` (required), `readAt?: date`.
  - Payload types: `Conversation`, `Message` exported from `@/payload-types`.

- [ ] **Step 1: Write the failing integration test**

```typescript
// tests/integration/payload-chat-model.test.ts
import { describe, it, expect } from 'vitest';
import { getPayloadClient } from '@/lib/payload';

describe('chat data model', () => {
  it('creating a message bumps conversation lastMessageAt and admin unread', async () => {
    const payload = await getPayloadClient();
    const convo = await payload.create({
      collection: 'conversations',
      data: { visitorTokenHash: 'a'.repeat(64), status: 'open' },
    });
    expect(convo.unreadForAdmin).toBe(0);

    const msg = await payload.create({
      collection: 'messages',
      data: { conversation: convo.id, sender: 'buyer', text: '  hello  ' },
    });
    // text was sanitized on the way in
    expect(msg.text).toBe('hello');

    const after = await payload.findByID({ collection: 'conversations', id: convo.id });
    expect(after.unreadForAdmin).toBe(1);
    expect(after.unreadForBuyer).toBe(0);
    expect(after.lastMessageAt).toBeTruthy();

    // admin reply bumps buyer unread, not admin
    await payload.create({
      collection: 'messages',
      data: { conversation: convo.id, sender: 'admin', text: 'hi there' },
    });
    const after2 = await payload.findByID({ collection: 'conversations', id: convo.id });
    expect(after2.unreadForBuyer).toBe(1);
    expect(after2.unreadForAdmin).toBe(1);

    await payload.delete({ collection: 'messages', id: msg.id });
    await payload.delete({ collection: 'conversations', id: convo.id });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/integration/payload-chat-model.test.ts`
Expected: FAIL — collections `conversations`/`messages` do not exist (Payload throws on unknown collection). (If it fails instead with a DB-connection error, Postgres isn't running — resolve that first per Global Constraints.)

- [ ] **Step 3: Write the `conversations` collection**

```typescript
// src/collections/Conversations.ts
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
  ],
};
```

- [ ] **Step 4: Write the `messages` collection**

Sanitizes text via `beforeValidate`, and in `afterChange` (create only) bumps the parent conversation's `lastMessageAt` and the opposite side's unread count.

```typescript
// src/collections/Messages.ts
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
```

- [ ] **Step 5: Wire collections into config**

In `src/payload.config.ts`: add `import { Conversations } from '@/collections/Conversations';` and `import { Messages } from '@/collections/Messages';` alongside the other collection imports, and extend the array to `collections: [Users, Media, Categories, Laptops, Orders, Addons, Conversations, Messages]`.

- [ ] **Step 6: Hand-add Payload types**

Codegen is broken (Global Constraints). In `src/payload-types.ts`, add `Conversation` and `Message` interfaces mirroring the fields above and register them in the `Config['collections']` map (follow the exact shape of the existing `Order` interface + its map entry in that file). At minimum each interface needs: `id`, all fields declared above, `updatedAt`, `createdAt`. Relationship fields typed as `string | Laptop` / `string | Conversation` to match existing relationship typing in the file.

- [ ] **Step 7: Create the DB migration**

Payload postgres needs a migration for the new tables. Run:

```bash
pnpm migrate:create chat_collections
```

Expected: a new file under the migrations dir. If the CLI cannot reach the DB, this is blocked (same Postgres requirement) — report and stop. Do NOT hand-write migration SQL blindly.

- [ ] **Step 8: Run migration + integration test**

Run: `pnpm migrate && pnpm exec vitest run tests/integration/payload-chat-model.test.ts`
Expected: PASS — sanitize applied, unread counters and `lastMessageAt` update as asserted.

- [ ] **Step 9: Typecheck**

Run: `pnpm typecheck`
Expected: PASS — new collections and hand-added types compile.

- [ ] **Step 10: Commit**

```bash
git add src/collections/Conversations.ts src/collections/Messages.ts src/payload.config.ts src/payload-types.ts src/migrations tests/integration/payload-chat-model.test.ts
git commit -m "feat: add conversations and messages collections with unread tracking"
```

---

### Task 3: Server-side conversation authorization + cookie helpers (`src/lib/chat-server.ts`)

Server-only glue between the cookie and the collections: read/mint the visitor token cookie, and resolve+authorize a conversation for the current buyer. Unit-tested against an injected fake payload + cookie store (no real DB, no Next runtime).

**Files:**
- Create: `src/lib/chat-server.ts`
- Test: `tests/unit/chat-server.test.ts`

**Interfaces:**
- Consumes: `generateVisitorToken`, `hashVisitorToken`, `tokensMatch` from `@/lib/chat`. Accepts injected dependencies so it stays unit-testable — do NOT import `next/headers` or `getPayloadClient` inside the pure functions; callers (Task 4) pass them in.
- Produces:
  - `const CHAT_COOKIE = 'js_chat_token'`
  - `const CHAT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365`
  - `type CookieStore = { get(name: string): { value: string } | undefined; set(name: string, value: string, opts: Record<string, unknown>): void }`
  - `function readOrCreateToken(store: CookieStore, isProd: boolean): { token: string; created: boolean }` — returns existing cookie token, or mints one and sets the cookie (`httpOnly`, `secure: isProd`, `sameSite: 'lax'`, `path: '/'`, `maxAge: CHAT_COOKIE_MAX_AGE`).
  - `type PayloadLike = { findByID(args: { collection: 'conversations'; id: string }): Promise<{ id: string; visitorTokenHash?: string } | null> }`
  - `async function authorizeConversation(payload: PayloadLike, conversationId: string, rawToken: string | undefined): Promise<{ id: string; visitorTokenHash?: string } | null>` — loads the conversation; returns it only if `tokensMatch(rawToken, convo.visitorTokenHash)`; otherwise `null` (also `null` on not-found or any throw).

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/chat-server.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  CHAT_COOKIE,
  readOrCreateToken,
  authorizeConversation,
} from '@/lib/chat-server';
import { hashVisitorToken } from '@/lib/chat';

function fakeStore(initial?: string) {
  const bag = new Map<string, string>();
  if (initial) bag.set(CHAT_COOKIE, initial);
  return {
    store: {
      get: (n: string) => (bag.has(n) ? { value: bag.get(n)! } : undefined),
      set: vi.fn((n: string, v: string) => { bag.set(n, v); }),
    },
    bag,
  };
}

describe('readOrCreateToken', () => {
  it('returns existing token without setting cookie', () => {
    const { store } = fakeStore('existing-token');
    const r = readOrCreateToken(store, true);
    expect(r).toEqual({ token: 'existing-token', created: false });
    expect(store.set).not.toHaveBeenCalled();
  });
  it('mints and sets an httpOnly cookie when absent', () => {
    const { store } = fakeStore();
    const r = readOrCreateToken(store, true);
    expect(r.created).toBe(true);
    expect(r.token).toMatch(/^[0-9a-f]{64}$/);
    expect(store.set).toHaveBeenCalledWith(
      CHAT_COOKIE, r.token,
      expect.objectContaining({ httpOnly: true, secure: true, sameSite: 'lax', path: '/' }),
    );
  });
});

describe('authorizeConversation', () => {
  const raw = 'b'.repeat(64);
  const good = { id: 'c1', visitorTokenHash: hashVisitorToken(raw) };
  const payload = { findByID: vi.fn(async () => good) };

  it('returns the conversation when the token matches', async () => {
    expect(await authorizeConversation(payload as any, 'c1', raw)).toEqual(good);
  });
  it('returns null when the token does not match', async () => {
    expect(await authorizeConversation(payload as any, 'c1', 'c'.repeat(64))).toBeNull();
  });
  it('returns null when not found or on throw', async () => {
    expect(await authorizeConversation({ findByID: async () => null } as any, 'x', raw)).toBeNull();
    expect(await authorizeConversation({ findByID: async () => { throw new Error('db'); } } as any, 'x', raw)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/unit/chat-server.test.ts`
Expected: FAIL — cannot resolve `@/lib/chat-server`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/chat-server.ts
import 'server-only';
import { generateVisitorToken, tokensMatch } from '@/lib/chat';

export const CHAT_COOKIE = 'js_chat_token';
export const CHAT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type CookieStore = {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, opts: Record<string, unknown>): void;
};

export function readOrCreateToken(store: CookieStore, isProd: boolean): { token: string; created: boolean } {
  const existing = store.get(CHAT_COOKIE)?.value;
  if (existing) return { token: existing, created: false };
  const token = generateVisitorToken();
  store.set(CHAT_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: CHAT_COOKIE_MAX_AGE,
  });
  return { token, created: true };
}

export type PayloadLike = {
  findByID(args: { collection: 'conversations'; id: string }): Promise<{ id: string; visitorTokenHash?: string } | null>;
};

export async function authorizeConversation(
  payload: PayloadLike,
  conversationId: string,
  rawToken: string | undefined,
): Promise<{ id: string; visitorTokenHash?: string } | null> {
  try {
    const convo = await payload.findByID({ collection: 'conversations', id: conversationId });
    if (!convo) return null;
    return tokensMatch(rawToken, convo.visitorTokenHash) ? convo : null;
  } catch {
    return null;
  }
}
```

Note: `server-only` is aliased to a test mock in `vitest.config.ts`, so the unit test imports fine.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/unit/chat-server.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat-server.ts tests/unit/chat-server.test.ts
git commit -m "feat: add server-side chat token cookie + conversation authorization"
```

---

### Task 4: Public chat route handlers (create / list-messages / send)

The buyer-facing HTTP surface. Three endpoints under `src/app/api/chat/**`, each `force-dynamic`, using `getPayloadClient()` + `next/headers` `cookies()` + the Task 3 helpers. In-memory rate limiting keyed by IP guards create/send. Authorization test is integration (real DB); rate-limit logic is unit-tested pure.

**Files:**
- Create: `src/lib/rate-limit.ts`
- Create: `src/app/api/chat/route.ts` (POST — create-or-get conversation)
- Create: `src/app/api/chat/[id]/messages/route.ts` (GET — list; POST — send buyer message)
- Test: `tests/unit/rate-limit.test.ts`
- Test: `tests/integration/chat-authorization.test.ts`

**Interfaces:**
- Consumes: `getPayloadClient` from `@/lib/payload`; `cookies` from `next/headers`; `readOrCreateToken`, `authorizeConversation`, `CHAT_COOKIE` from `@/lib/chat-server`; `hashVisitorToken`, `sanitizeMessageText` from `@/lib/chat`.
- Produces (HTTP contract the client in Task 5 relies on):
  - `POST /api/chat` body `{ laptop?: { id: string; title: string; price: number; url: string } }` → `201 { conversationId, messages: [] }`; sets the token cookie if absent.
  - `GET /api/chat/:id/messages` → `200 { messages: Array<{ id, sender, text, createdAt }>, status }` for the authorized buyer; `403 { error }` otherwise. Resets `unreadForBuyer` to 0 as a side effect.
  - `POST /api/chat/:id/messages` body `{ text: string }` → `201 { message }` for the authorized buyer; `403`/`400`/`429` on failure.
  - `rate-limit.ts`: `function rateLimit(key: string, opts?: { limit?: number; windowMs?: number }): boolean` — returns `true` if allowed, `false` if over limit; `function _resetRateLimits(): void` (test helper).

**READ FIRST:** Before writing handlers, read `node_modules/next/dist/docs/` for the App-Router route-handler + `cookies()` guidance (async `cookies()` in this Next version) and confirm the signature for dynamic-segment context (`params` may be a Promise). The health route (`src/app/api/health/route.ts`) is the local `force-dynamic` reference.

- [ ] **Step 1: Write the failing rate-limit unit test**

```typescript
// tests/unit/rate-limit.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, _resetRateLimits } from '@/lib/rate-limit';

describe('rateLimit', () => {
  beforeEach(() => _resetRateLimits());
  it('allows up to the limit then blocks', () => {
    const key = 'ip:1';
    for (let i = 0; i < 5; i++) expect(rateLimit(key, { limit: 5, windowMs: 60000 })).toBe(true);
    expect(rateLimit(key, { limit: 5, windowMs: 60000 })).toBe(false);
  });
  it('keys are independent', () => {
    expect(rateLimit('ip:a', { limit: 1 })).toBe(true);
    expect(rateLimit('ip:a', { limit: 1 })).toBe(false);
    expect(rateLimit('ip:b', { limit: 1 })).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run tests/unit/rate-limit.test.ts`
Expected: FAIL — cannot resolve `@/lib/rate-limit`.

- [ ] **Step 3: Implement the rate limiter**

```typescript
// src/lib/rate-limit.ts
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, opts?: { limit?: number; windowMs?: number }): boolean {
  const limit = opts?.limit ?? 20;
  const windowMs = opts?.windowMs ?? 60_000;
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

export function _resetRateLimits(): void {
  buckets.clear();
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm exec vitest run tests/unit/rate-limit.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement `POST /api/chat` (create-or-get)**

```typescript
// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPayloadClient } from '@/lib/payload';
import { readOrCreateToken } from '@/lib/chat-server';
import { hashVisitorToken, buildLaptopSummary } from '@/lib/chat';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const store = await cookies();
  const isProd = process.env.NODE_ENV === 'production';
  const { token } = readOrCreateToken(store, isProd);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`chat-create:${ip}`, { limit: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const laptop = body?.laptop as { id: string; title: string; price: number; url: string } | undefined;

  const payload = await getPayloadClient();
  const data: Record<string, unknown> = {
    visitorTokenHash: hashVisitorToken(token),
    status: 'open',
  };
  if (laptop?.id) {
    data.laptop = laptop.id;
    data.laptopSummary = buildLaptopSummary(laptop);
    data.laptopUrl = laptop.url;
  }
  const convo = await payload.create({ collection: 'conversations', data });
  return NextResponse.json({ conversationId: convo.id, messages: [] }, { status: 201 });
}
```

- [ ] **Step 6: Implement `GET`/`POST /api/chat/[id]/messages`**

```typescript
// src/app/api/chat/[id]/messages/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPayloadClient } from '@/lib/payload';
import { authorizeConversation, CHAT_COOKIE } from '@/lib/chat-server';
import { sanitizeMessageText } from '@/lib/chat';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

async function tokenFromCookies() {
  const store = await cookies();
  return store.get(CHAT_COOKIE)?.value;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = await tokenFromCookies();
  const payload = await getPayloadClient();
  const convo = await authorizeConversation(payload as any, id, token);
  if (!convo) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const msgs = await payload.find({
    collection: 'messages',
    where: { conversation: { equals: id } },
    sort: 'createdAt',
    limit: 200,
    depth: 0,
  });
  // Buyer viewing clears their unread count.
  await payload.update({ collection: 'conversations', id, data: { unreadForBuyer: 0 } });

  return NextResponse.json({
    status: (convo as any).status ?? 'open',
    messages: msgs.docs.map((m: any) => ({ id: m.id, sender: m.sender, text: m.text, createdAt: m.createdAt })),
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`chat-send:${ip}`, { limit: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const token = await tokenFromCookies();
  const payload = await getPayloadClient();
  const convo = await authorizeConversation(payload as any, id, token);
  if (!convo) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const text = sanitizeMessageText(body?.text);
  if (!text) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

  const message = await payload.create({
    collection: 'messages',
    data: { conversation: id, sender: 'buyer', text },
  });
  return NextResponse.json({
    message: { id: message.id, sender: 'buyer', text: message.text, createdAt: message.createdAt },
  }, { status: 201 });
}
```

- [ ] **Step 7: Write the authorization integration test**

```typescript
// tests/integration/chat-authorization.test.ts
import { describe, it, expect } from 'vitest';
import { getPayloadClient } from '@/lib/payload';
import { authorizeConversation } from '@/lib/chat-server';
import { generateVisitorToken, hashVisitorToken } from '@/lib/chat';

describe('conversation authorization (real DB)', () => {
  it('one buyer cannot access another buyer conversation', async () => {
    const payload = await getPayloadClient();
    const tokenA = generateVisitorToken();
    const tokenB = generateVisitorToken();
    const convo = await payload.create({
      collection: 'conversations',
      data: { visitorTokenHash: hashVisitorToken(tokenA), status: 'open' },
    });

    expect(await authorizeConversation(payload as any, convo.id, tokenA)).toBeTruthy();
    expect(await authorizeConversation(payload as any, convo.id, tokenB)).toBeNull();
    expect(await authorizeConversation(payload as any, convo.id, undefined)).toBeNull();

    await payload.delete({ collection: 'conversations', id: convo.id });
  });
});
```

- [ ] **Step 8: Run tests + typecheck**

Run: `pnpm exec vitest run tests/unit/rate-limit.test.ts tests/integration/chat-authorization.test.ts && pnpm typecheck`
Expected: PASS. (Integration step needs Postgres.)

- [ ] **Step 9: Commit**

```bash
git add src/lib/rate-limit.ts "src/app/api/chat" tests/unit/rate-limit.test.ts tests/integration/chat-authorization.test.ts
git commit -m "feat: add public chat route handlers with token auth and rate limiting"
```

---

### Task 5: Storefront chat drawer + client hook + open-chat controls

The buyer UI: a floating launcher + MUI `Drawer` with history, unread badge, product summary, and a send box that polls `GET messages` every 3s. A small client hook owns fetch/poll/send state. The product page's "chat" control opens a laptop-linked conversation; the site-wide launcher opens a general one. Verified in the browser preview (no component test infra).

**Files:**
- Create: `src/lib/chat-client.ts` (browser fetch wrappers — pure-ish, no React)
- Create: `src/components/chat/useChat.ts` (`'use client'` hook)
- Create: `src/components/chat/ChatDrawer.tsx` (`'use client'`)
- Create: `src/components/chat/ChatLauncher.tsx` (`'use client'` — floating button + drawer host, general conversation)
- Create: `src/components/product/ChatAboutLaptop.tsx` (`'use client'` — product button that opens a laptop-linked conversation)
- Modify: `src/app/(storefront)/layout.tsx` (remove `WhatsAppFab`; mount `<ChatLauncher />`)
- Modify: `src/app/(storefront)/laptops/[slug]/page.tsx` (replace the two WhatsApp action buttons with `<ChatAboutLaptop .../>`; drop now-unused `ChatIcon` import only if unreferenced elsewhere)
- Test: `tests/unit/chat-client.test.ts`

**Interfaces:**
- Consumes (client): the HTTP contract from Task 4.
- Produces:
  - `chat-client.ts`: `async function createConversation(laptop?: {id;title;price;url}): Promise<{ conversationId: string }>`; `async function fetchMessages(id: string): Promise<{ status: string; messages: ChatMessage[] }>`; `async function sendMessage(id: string, text: string): Promise<ChatMessage>`; `type ChatMessage = { id: string; sender: 'buyer'|'admin'; text: string; createdAt: string }`. All use `fetch` with `credentials: 'same-origin'`.
  - `useChat(opts?: { laptop?: {...} }): { open, setOpen, messages, unread, status, send, ready }`.
  - `ChatLauncher(): JSX.Element` (general, no laptop).
  - `ChatAboutLaptop(props: { id: string; title: string; price: number; url: string; disabled?: boolean }): JSX.Element`.

- [ ] **Step 1: Write the failing client test (fetch mocked)**

```typescript
// tests/unit/chat-client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createConversation, fetchMessages, sendMessage } from '@/lib/chat-client';

beforeEach(() => { vi.restoreAllMocks(); });

describe('chat-client', () => {
  it('createConversation posts laptop and returns conversationId', async () => {
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify({ conversationId: 'c1', messages: [] }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const r = await createConversation({ id: 'l1', title: 'X', price: 100, url: 'u' });
    expect(r.conversationId).toBe('c1');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/chat');
    expect(init).toMatchObject({ method: 'POST', credentials: 'same-origin' });
  });

  it('fetchMessages returns parsed messages', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ status: 'open', messages: [{ id: 'm1', sender: 'admin', text: 'hi', createdAt: 't' }] }),
      { status: 200 })));
    const r = await fetchMessages('c1');
    expect(r.messages[0].text).toBe('hi');
  });

  it('sendMessage returns the created message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ message: { id: 'm2', sender: 'buyer', text: 'yo', createdAt: 't' } }),
      { status: 201 })));
    const m = await sendMessage('c1', 'yo');
    expect(m).toMatchObject({ id: 'm2', sender: 'buyer', text: 'yo' });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run tests/unit/chat-client.test.ts`
Expected: FAIL — cannot resolve `@/lib/chat-client`.

- [ ] **Step 3: Implement `chat-client.ts`**

```typescript
// src/lib/chat-client.ts
export type ChatMessage = { id: string; sender: 'buyer' | 'admin'; text: string; createdAt: string };

export async function createConversation(
  laptop?: { id: string; title: string; price: number; url: string },
): Promise<{ conversationId: string }> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(laptop ? { laptop } : {}),
  });
  if (!res.ok) throw new Error(`createConversation failed: ${res.status}`);
  return res.json();
}

export async function fetchMessages(id: string): Promise<{ status: string; messages: ChatMessage[] }> {
  const res = await fetch(`/api/chat/${id}/messages`, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`fetchMessages failed: ${res.status}`);
  return res.json();
}

export async function sendMessage(id: string, text: string): Promise<ChatMessage> {
  const res = await fetch(`/api/chat/${id}/messages`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`sendMessage failed: ${res.status}`);
  const { message } = await res.json();
  return message;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm exec vitest run tests/unit/chat-client.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the `useChat` hook**

Lazy-creates a conversation on first open, then polls `fetchMessages` every 3s while open. Tracks `unread` from admin messages while closed.

```tsx
// src/components/chat/useChat.ts
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createConversation, fetchMessages, sendMessage, type ChatMessage } from '@/lib/chat-client';

type Laptop = { id: string; title: string; price: number; url: string };

export function useChat(opts?: { laptop?: Laptop }) {
  const [open, setOpen] = useState(false);
  const [convoId, setConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [status, setStatus] = useState<string>('open');
  const seen = useRef(0);

  const ensure = useCallback(async () => {
    if (convoId) return convoId;
    const { conversationId } = await createConversation(opts?.laptop);
    setConvoId(conversationId);
    return conversationId;
  }, [convoId, opts?.laptop]);

  const openChat = useCallback(async () => {
    await ensure();
    setUnread(0);
    setOpen(true);
  }, [ensure]);

  const send = useCallback(async (text: string) => {
    const id = await ensure();
    const m = await sendMessage(id, text);
    setMessages((prev) => [...prev, m]);
  }, [ensure]);

  useEffect(() => {
    if (!convoId) return;
    let active = true;
    const tick = async () => {
      try {
        const { messages: msgs, status: st } = await fetchMessages(convoId);
        if (!active) return;
        setMessages(msgs);
        setStatus(st);
        const adminCount = msgs.filter((m) => m.sender === 'admin').length;
        if (!open && adminCount > seen.current) setUnread((u) => u + (adminCount - seen.current));
        seen.current = adminCount;
      } catch { /* transient; next tick retries */ }
    };
    tick();
    const iv = setInterval(tick, 3000);
    return () => { active = false; clearInterval(iv); };
  }, [convoId, open]);

  return { open, setOpen, openChat, messages, unread, status, send, ready: Boolean(convoId) };
}
```

- [ ] **Step 6: Write `ChatDrawer` (presentational) + `ChatLauncher`**

`ChatDrawer` renders a MUI `Drawer` (anchor right) with a header (optional `laptopSummary`), a scrollable message list (buyer right-aligned, admin left; render `text` as plain text — never `dangerouslySetInnerHTML`), and a send box (`TextField` + `Button`, Enter to send). `ChatLauncher` mounts a floating MUI `Fab` (with a `Badge` showing `unread`) that calls `openChat`, and hosts one `ChatDrawer` bound to `useChat()` (no laptop).

```tsx
// src/components/chat/ChatLauncher.tsx
'use client';
import Fab from '@mui/material/Fab';
import Badge from '@mui/material/Badge';
import ChatIcon from '@mui/icons-material/Chat';
import { useChat } from './useChat';
import { ChatDrawer } from './ChatDrawer';

export function ChatLauncher() {
  const chat = useChat();
  return (
    <>
      <Badge color="error" badgeContent={chat.unread} overlap="circular"
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200 }}>
        <Fab color="primary" aria-label="Chat with us" onClick={chat.openChat}>
          <ChatIcon />
        </Fab>
      </Badge>
      <ChatDrawer chat={chat} />
    </>
  );
}
```

Write `ChatDrawer.tsx` with signature `export function ChatDrawer({ chat, laptopSummary }: { chat: ReturnType<typeof useChat>; laptopSummary?: string }): JSX.Element`. Use MUI `Drawer`, `Box`, `Stack`, `TextField`, `IconButton`/`Button`, `Typography`. Keep it self-contained and accessible (`aria-label`s, focus the input on open). Match the storefront's MUI theme (no custom colors beyond theme tokens).

- [ ] **Step 7: Write `ChatAboutLaptop` (product control)**

```tsx
// src/components/product/ChatAboutLaptop.tsx
'use client';
import Button from '@mui/material/Button';
import ChatIcon from '@mui/icons-material/Chat';
import { useChat } from '@/components/chat/useChat';
import { ChatDrawer } from '@/components/chat/ChatDrawer';

export function ChatAboutLaptop(props: { id: string; title: string; price: number; url: string; disabled?: boolean }) {
  const { id, title, price, url, disabled } = props;
  const chat = useChat({ laptop: { id, title, price, url } });
  return (
    <>
      <Button onClick={chat.openChat} variant="contained" size="large" startIcon={<ChatIcon />}
        fullWidth disabled={disabled}>
        Chat with us
      </Button>
      <ChatDrawer chat={chat} laptopSummary={`${title}`} />
    </>
  );
}
```

- [ ] **Step 8: Wire into layout + product page**

In `src/app/(storefront)/layout.tsx`: remove `import { WhatsAppFab } from '@/components/WhatsAppButton';` and the `<WhatsAppFab whatsappNumber={whatsappNumber} />` line; add `import { ChatLauncher } from '@/components/chat/ChatLauncher';` and render `<ChatLauncher />` as the last child inside `<StoreProvider>`. Keep `whatsappNumber` (still passed to `<TopNavBar>`).

In `src/app/(storefront)/laptops/[slug]/page.tsx`: add `import { ChatAboutLaptop } from '@/components/product/ChatAboutLaptop';`. Replace the `<Stack spacing={1.5}>` containing the two WhatsApp buttons (the "Buy Now"/WhatsApp one and the "WhatsApp inquiry" one — lines ~145-155) so it reads:

```tsx
<Stack spacing={1.5}>
  <ChatAboutLaptop id={laptop.id} title={laptop.title} price={laptop.price} url={url}
    disabled={laptop.stock === 0} />
</Stack>
```

Then run `grep -n "ChatIcon" "src/app/(storefront)/laptops/[slug]/page.tsx"`; if the only hit is the import line, remove `import ChatIcon from '@mui/icons-material/Chat';`. Leave `waHref`, `WhatsAppCallout`, add-ons, and related products untouched.

- [ ] **Step 9: Typecheck + full unit suite**

Run: `pnpm typecheck && pnpm exec vitest run tests/unit`
Expected: PASS.

- [ ] **Step 10: Browser verification**

Ensure `.env.local` has a working `DATABASE_URL`. `preview_start` the dev server (create `.claude/launch.json` with `pnpm dev`, port 3000, if missing — do NOT use Bash to run the server). Then:
- Navigate `/`: exactly one floating chat launcher bottom-right; old WhatsApp FAB gone. Open it, send a message. Check `read_console_messages` and `read_network_requests` (POST `/api/chat` → 201, then GET `.../messages` polling 200).
- Navigate a product page `/laptops/<slug>`: "Chat with us" replaces the WhatsApp buttons; clicking opens the drawer with the laptop summary; sending creates a laptop-linked conversation.
- Navigate `/admin`: confirm no storefront launcher appears (route-group isolation).
- `computer {action: "screenshot"}` of the product page with the drawer open; share with the user.

- [ ] **Step 11: Commit**

```bash
git add src/lib/chat-client.ts src/components/chat "src/components/product/ChatAboutLaptop.tsx" "src/app/(storefront)/layout.tsx" "src/app/(storefront)/laptops/[slug]/page.tsx" tests/unit/chat-client.test.ts .claude/launch.json
git commit -m "feat: add storefront chat drawer, launcher, and product chat control"
```

---

### Task 6: Admin inbox — reply UI + read/resolve controls in Payload

Staff-facing side. Payload's auto-generated admin already lists `conversations`/`messages`; this task adds a focused reply experience: a custom admin component on the conversation edit view that shows the message thread and a reply box (creating an `admin` message via Payload's authenticated REST), plus clearing `unreadForAdmin` when opened. Verified in the browser (admin), no unit infra.

**Files:**
- Create: `src/components/admin/ConversationThread.tsx` (`'use client'` admin component)
- Modify: `src/collections/Conversations.ts` (mount the component in the edit view via `admin.components.edit` or a `ui` field; clear `unreadForAdmin` on admin read)
- Modify: `src/app/(payload)/admin/importMap.js` (hand-register the new admin component — codegen broken; restart dev server after, per memory)

**Interfaces:**
- Consumes: Payload admin React context/hooks for the current document id; `@payloadcms/ui` components; the authenticated Payload REST API (`/api/messages`, `/api/conversations/:id`) via `fetch` with `credentials: 'include'` (admin session cookie).
- Produces: an admin-only thread+reply panel on the conversation edit page.

**READ FIRST:** Read the Payload admin custom-components guide (custom edit views / `ui` fields and how to get the document id in an admin client component) before writing — Payload 3.x admin APIs differ from older versions. Confirm the correct hook for the current doc id and the importMap registration format from an existing admin component (`src/components/admin/Nav.tsx`, `src/components/admin/DashboardStats.tsx`).

- [ ] **Step 1: Add an admin reply component (thread + send)**

Create `ConversationThread.tsx`: reads the current conversation id from admin context, fetches its messages from the authenticated `/api/messages?where[conversation][equals]=<id>&sort=createdAt`, renders the thread (buyer vs admin styling; plain text), and a reply box that POSTs `/api/messages` `{ conversation: id, sender: 'admin', text }` with `credentials: 'include'`, then refetches. Use `@payloadcms/ui` primitives for visual consistency. No `dangerouslySetInnerHTML`.

- [ ] **Step 2: Mount it in the conversation edit view + clear admin unread on read**

In `Conversations.ts`, mount `ConversationThread` in the edit view (a `ui` field or `admin.components.edit.beforeDocumentControls`/equivalent — confirm the current Payload slot name from the guide read in "READ FIRST"). Add an `afterRead`/edit-time mechanism so opening a conversation in admin resets `unreadForAdmin` to 0 (simplest: a `beforeChange` is wrong here; instead have `ConversationThread` PATCH `unreadForAdmin: 0` once on mount). Keep the reset in the client component to avoid mutating on every list read.

- [ ] **Step 3: Register in importMap + restart**

Hand-add the `ConversationThread` entry to `src/app/(payload)/admin/importMap.js` matching the format of existing entries. Restart the dev server (memory: `jaysmart-admin-importmap-restart` — a new admin component needs a restart or the importMap error is stale).

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Browser verification (admin)**

With the storefront drawer, create a buyer message (Task 5). In `/admin`, open Support → Conversations → the conversation: confirm the thread shows the buyer message + laptop summary, `unreadForAdmin` shows in the list before opening and clears after, and a typed admin reply appears in the thread. Switch back to the storefront drawer and confirm the admin reply arrives (within one 3s poll) and increments the buyer unread badge when the drawer is closed. Screenshot both sides; share with the user.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/ConversationThread.tsx src/collections/Conversations.ts "src/app/(payload)/admin/importMap.js"
git commit -m "feat: add admin conversation thread with reply and unread clearing"
```

---

### Task 7: Typing presence (poll every 2s)

Both sides show a typing indicator. Store presence with an expiry timestamp on the conversation (buyer + admin), refresh it while a composer is active, and expose it via the messages GET payload (buyer) and a tiny admin fetch. Pure expiry logic is unit-tested; wiring is browser-verified.

**Files:**
- Modify: `src/lib/chat.ts` (add `isTypingActive`)
- Modify: `src/collections/Conversations.ts` (add `buyerTypingAt?: date`, `adminTypingAt?: date`)
- Modify: `src/payload-types.ts` (hand-add the two fields to `Conversation`)
- Create: `src/app/api/chat/[id]/typing/route.ts` (POST — buyer heartbeat; sets `buyerTypingAt=now`)
- Modify: `src/app/api/chat/[id]/messages/route.ts` GET (include `adminTyping: isTypingActive(convo.adminTypingAt)` in the response)
- Modify: `src/components/chat/useChat.ts` (poll includes `adminTyping`; send a buyer heartbeat while composing, throttled)
- Modify: `src/components/chat/ChatDrawer.tsx` (render "typing…" when `adminTyping`)
- Modify: `src/components/admin/ConversationThread.tsx` (POST admin typing heartbeat; show buyer typing)
- Test: extend `tests/unit/chat.test.ts`
- Create migration for the two new columns

**Interfaces:**
- Produces: `function isTypingActive(at: string | Date | null | undefined, ttlMs?: number): boolean` — `true` if `at` is within `ttlMs` (default 5000) of now; `false`/no-throw otherwise. `POST /api/chat/:id/typing` → `204` for authorized buyer (rate-limited), `403` otherwise.

- [ ] **Step 1: Write failing unit test for `isTypingActive`**

```typescript
// append to tests/unit/chat.test.ts
import { isTypingActive } from '@/lib/chat';

describe('isTypingActive', () => {
  it('true within ttl, false beyond, false for empty', () => {
    expect(isTypingActive(new Date().toISOString(), 5000)).toBe(true);
    expect(isTypingActive(new Date(Date.now() - 10_000).toISOString(), 5000)).toBe(false);
    expect(isTypingActive(undefined)).toBe(false);
    expect(isTypingActive('not-a-date')).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run tests/unit/chat.test.ts`
Expected: FAIL — `isTypingActive` not exported.

- [ ] **Step 3: Implement `isTypingActive`**

```typescript
// add to src/lib/chat.ts
export function isTypingActive(at: string | Date | null | undefined, ttlMs = 5000): boolean {
  if (!at) return false;
  const t = new Date(at).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < ttlMs;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm exec vitest run tests/unit/chat.test.ts`
Expected: PASS.

- [ ] **Step 5: Add fields + migration + typing route + wire GET**

Add `buyerTypingAt`/`adminTypingAt` date fields (admin-hidden) to `Conversations.ts`; hand-add to `payload-types.ts`; `pnpm migrate:create chat_typing` then `pnpm migrate`. Create `POST /api/chat/[id]/typing` (authorize via `authorizeConversation`, rate-limit `chat-typing:<ip>` generously e.g. limit 60/60s, set `buyerTypingAt: new Date().toISOString()`, return `204`). In the messages `GET`, add `adminTyping: isTypingActive((convo as any).adminTypingAt)` to the JSON.

- [ ] **Step 6: Wire clients**

In `useChat`: expose `adminTyping` from the poll; add `notifyTyping()` that POSTs `/api/chat/:id/typing` at most once per ~2s while the composer has focus/changes. In `ChatDrawer`, call `notifyTyping` on input change and render an "Admin is typing…" line when `adminTyping`. In `ConversationThread` (admin), POST admin typing to a small authenticated update of `adminTypingAt` (PATCH `/api/conversations/:id`) and render "Buyer is typing…" from `isTypingActive(buyerTypingAt)` (fetched in its poll).

- [ ] **Step 7: Typecheck + unit**

Run: `pnpm typecheck && pnpm exec vitest run tests/unit`
Expected: PASS.

- [ ] **Step 8: Browser verification**

Open storefront drawer and admin thread side by side. Type in one; within ~2s the other shows the typing indicator, which clears ~5s after typing stops. Screenshot; share.

- [ ] **Step 9: Commit**

```bash
git add src/lib/chat.ts src/collections/Conversations.ts src/payload-types.ts "src/app/api/chat" src/components/chat src/components/admin/ConversationThread.tsx src/migrations tests/unit/chat.test.ts
git commit -m "feat: add typing presence with expiry across buyer and admin chat"
```

---

### Task 8: Browser web-push (VAPID) with in-app unread fallback

Admin opts into browser push from Payload; new buyer messages fire a web-push to subscribed admins. The in-app unread badge (already built) is the always-on fallback, so push is purely additive and no-ops cleanly when VAPID env is unset. This is the last, independently-deferrable task.

**Files:**
- Add dependency: `web-push`
- Create: `src/collections/PushSubscriptions.ts` (admin-owned subscription records)
- Modify: `src/payload.config.ts` (register collection)
- Modify: `src/payload-types.ts` (hand-add `PushSubscription`)
- Create migration
- Create: `src/lib/push.ts` (server-only: build VAPID config from env, `sendToAll` guarded no-op when unset)
- Create: `public/chat-sw.js` (service worker: `push` → `showNotification`; `notificationclick` → focus `/admin`)
- Create: `src/app/api/push/subscribe/route.ts` (authenticated admin: persist subscription)
- Modify: `src/collections/Messages.ts` `afterChange` (on buyer message, call `push.sendToAll`)
- Create: `src/components/admin/EnablePushButton.tsx` + register in importMap (admin opt-in: register SW, subscribe with `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, POST to subscribe route)
- Test: `tests/unit/push.test.ts`

**Interfaces:**
- Produces: `getVapidConfig(env?): { publicKey; privateKey; subject } | null`; `async function sendToAll(payload, notification): Promise<void>` (no-op + return when config null or no subs; never throws into the message hook).

- [ ] **Step 1: Write failing unit test for VAPID config gate**

```typescript
// tests/unit/push.test.ts
import { describe, it, expect } from 'vitest';
import { getVapidConfig } from '@/lib/push';

describe('getVapidConfig', () => {
  it('returns null when any key missing', () => {
    expect(getVapidConfig({ publicKey: 'p', privateKey: '', subject: 'mailto:a@b.c' })).toBeNull();
    expect(getVapidConfig({ publicKey: '', privateKey: 'x', subject: 'mailto:a@b.c' })).toBeNull();
  });
  it('returns config when all present', () => {
    expect(getVapidConfig({ publicKey: 'p', privateKey: 'x', subject: 'mailto:a@b.c' }))
      .toEqual({ publicKey: 'p', privateKey: 'x', subject: 'mailto:a@b.c' });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run tests/unit/push.test.ts`
Expected: FAIL — cannot resolve `@/lib/push`.

- [ ] **Step 3: Add dependency + implement `push.ts` config gate**

```bash
pnpm add web-push && pnpm add -D @types/web-push
```

```typescript
// src/lib/push.ts
import 'server-only';
import webpush from 'web-push';

export type VapidConfig = { publicKey: string; privateKey: string; subject: string };

export function getVapidConfig(env: { publicKey?: string; privateKey?: string; subject?: string } = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
  subject: process.env.VAPID_SUBJECT,
}): VapidConfig | null {
  if (!env.publicKey || !env.privateKey || !env.subject) return null;
  return { publicKey: env.publicKey, privateKey: env.privateKey, subject: env.subject };
}

export async function sendToAll(
  payload: { find: Function; delete: Function },
  notification: { title: string; body: string; url?: string },
): Promise<void> {
  const cfg = getVapidConfig();
  if (!cfg) return;
  webpush.setVapidDetails(cfg.subject, cfg.publicKey, cfg.privateKey);
  try {
    const subs = await payload.find({ collection: 'push-subscriptions', limit: 500, depth: 0 });
    await Promise.all(subs.docs.map(async (s: any) => {
      try {
        await webpush.sendNotification(s.subscription, JSON.stringify(notification));
      } catch (err: any) {
        // 404/410 → subscription expired; prune it.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await payload.delete({ collection: 'push-subscriptions', id: s.id }).catch(() => {});
        }
      }
    }));
  } catch { /* never throw into the message hook */ }
}
```

- [ ] **Step 4: Run to verify config test passes**

Run: `pnpm exec vitest run tests/unit/push.test.ts`
Expected: PASS.

- [ ] **Step 5: Collection + migration + subscribe route + service worker**

Create `PushSubscriptions` collection (`owner: relationship→users`, `subscription: json`, access limited to authenticated users; `create/read/update/delete` require `req.user`). Register in config + hand-add type + `pnpm migrate:create push_subscriptions && pnpm migrate`. Create `POST /api/push/subscribe` (require an authenticated Payload user via `payload.auth`; persist `{ owner, subscription }`). Create `public/chat-sw.js` handling `push`→`self.registration.showNotification(title, { body, data:{ url } })` and `notificationclick`→`clients.openWindow(url ?? '/admin')`.

- [ ] **Step 6: Fire push on buyer message**

In `Messages.ts` `afterChange` (create + `sender==='buyer'` only), after the conversation update, `await sendToAll(req.payload, { title: 'New buyer message', body: doc.text.slice(0,120), url: '/admin' })`. Wrap so it never throws into the hook (helper already guards).

- [ ] **Step 7: Admin opt-in button + importMap + env docs**

Create `EnablePushButton.tsx` (admin): registers `/chat-sw.js`, `Notification.requestPermission()`, `pushManager.subscribe({ userVisibleOnly:true, applicationServerKey: urlBase64ToUint8Array(NEXT_PUBLIC_VAPID_PUBLIC_KEY) })`, POST to `/api/push/subscribe`. No-op with a clear message if `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is unset. Register in importMap; restart dev server. Document `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` in the deploy/env docs (where `NEXT_PUBLIC_SERVER_URL` etc. are documented) and note keys are generated with `npx web-push generate-vapid-keys`.

- [ ] **Step 8: Typecheck + unit**

Run: `pnpm typecheck && pnpm exec vitest run tests/unit`
Expected: PASS.

- [ ] **Step 9: Browser verification (mocked delivery acceptable)**

With VAPID keys set locally: in `/admin`, click Enable Push, grant permission (confirm a subscription row is created). From the storefront drawer, send a buyer message; confirm a system notification fires (or, if the environment blocks notifications, confirm `sendToAll` is invoked and the unread badge still increments as the fallback). Screenshot; share. Note real push requires HTTPS/localhost — document that.

- [ ] **Step 10: Commit**

```bash
git add package.json pnpm-lock.yaml src/collections/PushSubscriptions.ts src/payload.config.ts src/payload-types.ts src/lib/push.ts public/chat-sw.js "src/app/api/push" src/collections/Messages.ts src/components/admin/EnablePushButton.tsx "src/app/(payload)/admin/importMap.js" src/migrations tests/unit/push.test.ts docs
git commit -m "feat: add browser web-push for new buyer messages with in-app fallback"
```

---

## Self-Review Notes

- **Spec coverage:**
  - Anonymous buyer identity in opaque httpOnly cookie → Task 1 (token) + Task 3 (cookie) ✓
  - `conversations` collection (token hash, laptop, status, last-message, unread counts) → Task 2 ✓
  - `messages` collection (conversation, sender, text, read time) → Task 2 (`readAt`) ✓
  - Public API authorizes only the visitor token for its own conversations; Payload users reply as admin → Task 4 (buyer) + Task 6 (admin) ✓
  - Storefront chat drawer (history, send box, unread badge, product summary) → Task 5 ✓
  - "Chat to buy"/product controls create/open a laptop-linked conversation → Task 5 (`ChatAboutLaptop`) ✓
  - Admin Conversations collection (laptop, last message, unread buyer count, status, message list) → Task 2 (fields/columns) + Task 6 (thread) ✓
  - Typing presence with expiry, refreshed while composing, 2s poll → Task 7 ✓
  - Browser push (SW + VAPID subscription collection, admin opt-in, web-push + always-increment unread fallback) → Task 8 ✓
  - Security: no conversation without token → Task 3/4; rate-limit public create/send → Task 4; sanitize + length-limit, no HTML → Task 1 + Task 2 + plain-text render in Task 5/6; VAPID private key server-only → Task 8 (no `NEXT_PUBLIC_` on private key) ✓
  - Verification: unit (auth, context creation, typing expiry, unread) → Tasks 1,3,7 + integration Task 2/4; integration (cross-buyer denial, admin reply unread) → Task 4 + Task 6 browser; browser (product-linked chat, typing both sides, admin reply, mocked push) → Tasks 5,6,7,8 ✓
  - Non-goals respected (no attachments/routing/payment/read-receipts/native push) ✓
- **Placeholder scan:** each code step has real code; admin-UI steps (Task 6/7/8 client wiring) intentionally describe behavior + point to the Payload guide because exact Payload 3.x admin component APIs must be read from `node_modules` rather than guessed (flagged "READ FIRST") — these are genuinely version-specific, not lazy omissions.
- **Type consistency:** `visitorTokenHash`, `hashVisitorToken`, `tokensMatch`, `authorizeConversation`, `CHAT_COOKIE`, `sanitizeMessageText`, `buildLaptopSummary`, `isTypingActive`, `getVapidConfig`, `sendToAll`, `ChatMessage`, `useChat`, `ChatAboutLaptop`, `ChatDrawer`, `ChatLauncher` are used identically across tasks. Collection slugs `conversations`/`messages`/`push-subscriptions` consistent. Unread fields `unreadForAdmin`/`unreadForBuyer` consistent between Task 2 hook, Task 4 reset, Task 6 clear.
- **Working software early:** after Task 5 the storefront chat works end-to-end (buyer send/receive, laptop context, unread) with admin replies possible via Payload's default message editor even before Task 6's polished thread; Tasks 6-8 are additive layers. Task 8 no-ops without VAPID env, so the feature ships without it.
