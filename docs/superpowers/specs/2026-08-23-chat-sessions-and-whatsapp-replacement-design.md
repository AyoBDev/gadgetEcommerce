# Chat Sessions + WhatsApp → Chatbot Replacement

**Date:** 2026-08-23
**Status:** Approved design, pending implementation plan

## Goal

Two related changes to the storefront chat:

1. **Session persistence (auto-restore):** a returning visitor's existing
   conversation loads automatically on page load, so opening the chat shows
   their history and any admin replies made while they were away.
2. **Replace WhatsApp with the chatbot everywhere:** every WhatsApp entry
   point across the storefront opens the on-site chat panel instead of a
   `wa.me` deep link. The chatbot becomes the single customer-contact channel.

## Background (current state)

- **Admin endpoint:** replies happen in Payload's built-in admin at
  `/admin/collections/conversations` (custom thread UI:
  `src/components/admin/ConversationThread.tsx`, collection
  `src/collections/Conversations.ts`). No change needed here.
- **Session identity already exists server-side:** `src/lib/chat-server.ts`
  sets a 1-year httpOnly cookie `js_chat_token` (`CHAT_COOKIE`), and each
  conversation stores `visitorTokenHash` (indexed). The gap is purely on the
  frontend: `useChat` starts with `convoId = null` every load and only ever
  *creates* a new conversation; it never looks up the visitor's existing one.
- **Buyer API today:** `POST /api/chat` (always creates),
  `GET/POST /api/chat/[id]/messages`, `POST /api/chat/[id]/typing`.
- **WhatsApp entry points** are plain server-rendered `<a href={waHref}>`
  links spread across ~10 components (see list below), built via
  `src/lib/whatsapp.ts` + `resolveWhatsAppNumber`.

## Non-goals

- No changes to the Payload admin, the Conversations/Messages collections,
  or migrations.
- Do NOT delete the WhatsApp plumbing (`lib/whatsapp.ts`,
  `whatsappNumber` setting, `resolveWhatsAppNumber`). We stop the UI from
  using it, keeping the change reversible. Full removal can be a later task.
- No new npm dependencies.
- No change to the chat panel's visual design (done in the prior task).

---

## Part A — Session persistence (auto-restore)

### A1. New route: `GET /api/chat`

Add a `GET` handler to `src/app/api/chat/route.ts` (alongside the existing
`POST`). It:

- Reads the `js_chat_token` cookie via `cookies()`. If absent, returns
  `{ conversationId: null, messages: [] }` (200) — do NOT create a cookie or
  conversation on GET.
- Hashes the token (`hashVisitorToken`) and queries Payload:
  `find({ collection: 'conversations', where: { visitorTokenHash: { equals: hash } }, sort: '-lastMessageAt', limit: 1 })`.
- If none found, returns `{ conversationId: null, messages: [] }`.
- If found, loads that conversation's messages (same shape the messages
  route returns) and returns
  `{ conversationId: <id>, status: <convo.status>, messages: [...] }`.
- Rate-limited by IP like the POST (`chat-get:<ip>`, same limit/window).
- `export const dynamic = 'force-dynamic'` already set on the module.

Reuse the existing message-serialization logic. If message serialization
currently lives inline in the messages route, extract a small shared helper
(e.g. `serializeMessages` in `src/lib/chat-server.ts` or a local module) so
GET `/api/chat` and GET `/api/chat/[id]/messages` return identical shapes.
The extraction is in-scope only if needed to avoid duplication.

### A2. New client function

In `src/lib/chat-client.ts`:

```ts
export async function getExistingConversation(): Promise<{
  conversationId: string | null;
  status?: string;
  messages: ChatMessage[];
}>
```

Calls `GET /api/chat` with `credentials: 'same-origin'`. On non-OK or network
error, resolves to `{ conversationId: null, messages: [] }` (best-effort —
never throws, so a lookup failure just means "start fresh").

### A3. `useChat` change

On mount, run a one-time effect that calls `getExistingConversation()`:

- If it returns a `conversationId`, set `convoId` (and seed `messages`/`status`
  from the response). This triggers the existing polling effect, so history is
  present before the user opens the panel.
- If it returns `null`, do nothing — the existing `ensure()`/`createConversation`
  path still runs on first open for brand-new visitors.
- Guard against races with the existing `pendingRef`/`ensure()` dedupe: if a
  create is already in flight or `convoId` is already set, skip the restore.
- Silent: no UI flash, no auto-open. The panel still opens only on user action.

**Result:** returning visitors see their thread and unread admin replies
(unread logic in `useChat` already compares admin message counts).

---

## Part B — WhatsApp → chatbot (all entry points)

### B1. Shared chat access via context

The blocker: WhatsApp links are server-rendered `<a>` tags across many
components, while the chat opens through a client-side `useChat` hook, and
independent `useChat` instances don't share open-state. Solution: one shared
instance exposed via context.

- **New `src/components/chat/ChatContext.tsx`:** a `ChatProvider` client
  component that holds a single `useChat()` instance and renders the one
  `ChatPanel`. It exposes, via context, at least `openChat(laptop?)` and the
  `chat` object. A `useChatLauncher()` hook returns `openChat`.
- **Mount once** in the storefront layout (`src/app/(storefront)/layout.tsx`),
  wrapping the tree, and render `ChatLauncher` (the FAB) from within the
  provider so the FAB and all in-page triggers drive the **same** panel.
- `ChatLauncher` is refactored to consume the shared context instead of
  creating its own `useChat`. `ChatAboutLaptop` (laptop page button) likewise
  calls `openChat({ laptop })` from context instead of owning a `useChat`.
  Passing a laptop tags the conversation (existing `laptop`/`laptopSummary`
  fields) — but only when there is no existing restored conversation; a
  restored conversation keeps its original context.

### B2. Convert WhatsApp UI to chatbot triggers

For every entry point below: replace the `wa.me` anchor with a button (or an
anchor-styled button) whose `onClick` calls `openChat(...)` from context,
passing laptop context where a laptop is in scope. Update copy from
"Chat on WhatsApp" / "WhatsApp us" → **"Chat with us"**. Restyle the former
WhatsApp green (`#25D366` / `success`) to **brand red** (`primary` /
`#E1232A`) to match the chat panel and primary CTAs.

Entry points (client components — convert in place):
- `src/components/TopNavBar.tsx` — the "Chat on WhatsApp" icon button.
- `src/components/HeroSection.tsx` — "WhatsApp us" CTA.
- `src/components/ProductCard.tsx` — per-card WhatsApp icon → open chat with
  that laptop.
- `src/components/DealCard.tsx` — `DealHero` link + `DealRow` icon.
- `src/components/product/AddonsSection.tsx` — addon WhatsApp buttons →
  open chat with laptop context.
- `src/components/product/WhatsAppCallout.tsx` — product-page callout →
  "Chat with us" button opening the chat (rename/replace component).
- `src/components/product/RelatedProducts.tsx` — passes `whatsappNumber`
  into `ProductCard`; update to the new prop/behavior.
- `src/components/SavedLaptopsView.tsx` (wishlist/compare) — passes
  `whatsappNumber` into `ProductCard`; update accordingly.

Server components building `waHref` and passing it down
(`src/app/(storefront)/laptops/[slug]/page.tsx`, `page.tsx`, `laptops/page.tsx`,
`wishlist`, `compare`, `layout.tsx`): stop building/passing the WhatsApp link;
pass laptop context (already available) to the client child so its button opens
the chat. The `whatsappNumber` prop threading can remain temporarily unused or
be dropped per component where trivial — do not chase every prop removal if it
widens the diff; correctness of behavior is the bar.

### B3. Floating FAB

- **Remove the floating WhatsApp button** `src/components/WhatsAppButton.tsx`
  (`WhatsAppFab`) and its usage — the chat launcher FAB already occupies the
  bottom-right corner and opens the chatbot. Net result: exactly **one**
  floating FAB in the corner, opening the chat.

### B4. Copy elsewhere

Non-interactive WhatsApp *mentions* that are pure marketing copy
(`Testimonials.tsx`, `WhyBuyFromUs.tsx`) are out of scope for behavior but
should have their "WhatsApp" wording softened to "chat"/"chat support" only
if trivial; skip if it risks unrelated churn. These are copy-only, no links.

## Data flow

- Session: cookie (already set) → `GET /api/chat` finds convo by
  `visitorTokenHash` → `useChat` restores `convoId` → existing polling loads
  messages. Create-on-first-open remains the new-visitor path.
- WhatsApp replacement: any trigger → context `openChat(laptop?)` → shared
  `useChat` ensures/restores a conversation → same `ChatPanel`.

No collection, migration, or admin changes.

## Testing / verification

- **Unit:** `getExistingConversation` returns `{conversationId:null}` on
  error/empty; the `GET /api/chat` handler returns null when no cookie /
  no match and the found conversation + messages when matched (test the
  pure logic where feasible without a live DB, mirroring existing
  `chat-client`/`chat-server` unit tests). No component render tooling exists;
  don't add it.
- **Existing chat tests** must stay green (data-layer contracts unchanged
  except the additive GET).
- **Browser verification** (once disk space allows a dev server): (a) send a
  message, reload the page, reopen chat → history restored; (b) each converted
  WhatsApp entry point opens the chat panel (not wa.me), styled red, correct
  copy; (c) only one floating FAB in the corner; (d) laptop-context triggers
  tag the conversation with that laptop.

## Files

**New**
- `src/components/chat/ChatContext.tsx`
- (possibly) a shared `serializeMessages` helper if extraction is needed

**Modified**
- `src/app/api/chat/route.ts` (add GET)
- `src/lib/chat-client.ts` (add `getExistingConversation`)
- `src/components/chat/useChat.ts` (mount restore effect)
- `src/components/chat/ChatLauncher.tsx` (consume shared context)
- `src/components/product/ChatAboutLaptop.tsx` (use context `openChat`)
- `src/app/(storefront)/layout.tsx` (mount `ChatProvider`)
- WhatsApp entry points: `TopNavBar.tsx`, `HeroSection.tsx`,
  `ProductCard.tsx`, `DealCard.tsx`, `product/AddonsSection.tsx`,
  `product/WhatsAppCallout.tsx`, `product/RelatedProducts.tsx`,
  `SavedLaptopsView.tsx`, and the server pages that thread `waHref`.

**Removed**
- `src/components/WhatsAppButton.tsx` (floating `WhatsAppFab`) + its mount

**Kept (unused by UI, for reversibility)**
- `src/lib/whatsapp.ts`, `whatsappNumber` setting, `resolveWhatsAppNumber`
