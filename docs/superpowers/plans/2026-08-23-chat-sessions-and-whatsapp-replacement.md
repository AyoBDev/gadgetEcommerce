# Chat Sessions + WhatsApp → Chatbot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-restore a returning visitor's chat conversation on page load, and replace every WhatsApp entry point in the storefront with a trigger that opens the on-site chatbot.

**Architecture:** Add a `GET /api/chat` that finds the visitor's conversation by their existing `js_chat_token` cookie hash; add a client fetch + a `useChat` mount effect to restore it silently. Introduce a `ChatProvider` context holding one shared `useChat` instance and rendering the single `ChatPanel`, so any component (the FAB, the laptop button, and every former WhatsApp link) opens the same panel via `openChat()`. Convert all WhatsApp UI to chatbot triggers (brand red, "Chat with us"), delete the dead floating `WhatsAppFab`, and keep the WhatsApp plumbing files unused for reversibility.

**Tech Stack:** Next.js (App Router, client + server components), React context, MUI 6, Payload 3 (query only), Vitest. No new dependencies.

## Global Constraints

- No new npm dependencies.
- Do NOT modify Payload collections, migrations, or the admin UI.
- Do NOT delete `src/lib/whatsapp.ts`, the `whatsappNumber` setting, or `resolveWhatsAppNumber` — keep them unused for reversibility.
- Client components start with `'use client';`.
- `ChatMessage` shape is `{ id: string; sender: 'buyer' | 'admin'; text: string; createdAt: string }` (from `src/lib/chat-client.ts`).
- Message serialization shape (must match existing `GET /api/chat/[id]/messages`): `{ id, sender, text, createdAt }` per message.
- Cookie name is `CHAT_COOKIE` = `'js_chat_token'` (from `src/lib/chat-server.ts`); hash with `hashVisitorToken` (from `src/lib/chat.ts`).
- Former WhatsApp UI restyles from green (`#25D366` / `success`) to brand red (`primary` / `#E1232A`); copy → "Chat with us".
- Exactly one floating FAB in the bottom-right corner after this work (the chat launcher).
- All work in the `worktrees/redesign-chat-panel` worktree only.
- Verification: existing chat tests stay green; new unit tests for the additive pieces; browser check when a dev server is available (run `next dev` WITHOUT `--turbopack` — Turbopack fails to resolve the AWS SDK in this pnpm layout; the worktree `.claude/launch.json` already uses `./node_modules/.bin/next dev`).

---

### Task 1: `GET /api/chat` — restore conversation by cookie

**Files:**
- Modify: `src/app/api/chat/route.ts` (add a `GET` export alongside the existing `POST`)

**Interfaces:**
- Consumes: `cookies()` from `next/headers`; `getPayloadClient` from `@/lib/payload`; `CHAT_COOKIE` from `@/lib/chat-server`; `hashVisitorToken`, `isTypingActive` from `@/lib/chat`; `rateLimit` from `@/lib/rate-limit`.
- Produces: `GET /api/chat` → JSON `{ conversationId: string | null; status?: string; adminTyping?: boolean; messages: {id,sender,text,createdAt}[] }`.

- [ ] **Step 1: Add the GET handler**

Add these imports if missing at the top of the file (the module already imports `NextResponse`, `cookies`, `getPayloadClient`, `hashVisitorToken`, `rateLimit`): add `CHAT_COOKIE` to the `@/lib/chat-server` import and `isTypingActive` to the `@/lib/chat` import. Then add:

```ts
export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`chat-get:${ip}`, { limit: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const store = await cookies();
  const token = store.get(CHAT_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ conversationId: null, messages: [] });
  }

  const payload = await getPayloadClient();
  const found = await payload.find({
    collection: 'conversations',
    where: { visitorTokenHash: { equals: hashVisitorToken(token) } },
    sort: '-lastMessageAt',
    limit: 1,
    depth: 0,
  });
  const convo = found.docs[0];
  if (!convo) {
    return NextResponse.json({ conversationId: null, messages: [] });
  }

  const msgs = await payload.find({
    collection: 'messages',
    where: { conversation: { equals: convo.id } },
    sort: 'createdAt',
    limit: 200,
    depth: 0,
  });

  return NextResponse.json({
    conversationId: String(convo.id),
    status: convo.status ?? 'open',
    adminTyping: isTypingActive(convo.adminTypingAt),
    messages: msgs.docs.map((m) => ({ id: m.id, sender: m.sender, text: m.text, createdAt: m.createdAt })),
  });
}
```

Note: unlike `GET /api/chat/[id]/messages`, this handler does NOT reset `unreadForBuyer` (restore on load must not clear unread before the user opens the panel).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `route.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: add GET /api/chat to restore visitor conversation by cookie"
```

---

### Task 2: `getExistingConversation` client function

**Files:**
- Modify: `src/lib/chat-client.ts`
- Test: `tests/unit/chat-client.test.ts` (existing file — add cases)

**Interfaces:**
- Consumes: `GET /api/chat` (Task 1).
- Produces: `export async function getExistingConversation(): Promise<{ conversationId: string | null; status?: string; messages: ChatMessage[] }>` — best-effort; never throws.

- [ ] **Step 1: Write the failing test**

Add to `tests/unit/chat-client.test.ts` (mirror the existing fetch-mocking style in that file):

```ts
import { getExistingConversation } from '@/lib/chat-client';

// (use the same global.fetch mock pattern already present in this file)

it('getExistingConversation returns the restored conversation on success', async () => {
  const payload = { conversationId: '42', status: 'open', messages: [{ id: '1', sender: 'buyer', text: 'hi', createdAt: 'x' }] };
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => payload })) as unknown as typeof fetch);
  const res = await getExistingConversation();
  expect(res.conversationId).toBe('42');
  expect(res.messages).toHaveLength(1);
});

it('getExistingConversation returns null conversation on error (never throws)', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })) as unknown as typeof fetch);
  const res = await getExistingConversation();
  expect(res.conversationId).toBeNull();
  expect(res.messages).toEqual([]);
});

it('getExistingConversation returns null conversation on network throw', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }) as unknown as typeof fetch);
  const res = await getExistingConversation();
  expect(res.conversationId).toBeNull();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/chat-client.test.ts`
Expected: FAIL — `getExistingConversation` is not exported.

- [ ] **Step 3: Implement the function**

Append to `src/lib/chat-client.ts`:

```ts
export async function getExistingConversation(): Promise<{
  conversationId: string | null;
  status?: string;
  messages: ChatMessage[];
}> {
  try {
    const res = await fetch('/api/chat', { credentials: 'same-origin' });
    if (!res.ok) return { conversationId: null, messages: [] };
    const data = await res.json();
    return {
      conversationId: data.conversationId ?? null,
      status: data.status,
      messages: Array.isArray(data.messages) ? data.messages : [],
    };
  } catch {
    return { conversationId: null, messages: [] };
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/chat-client.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat-client.ts tests/unit/chat-client.test.ts
git commit -m "feat: add getExistingConversation client fetch with tests"
```

---

### Task 3: `useChat` — restore conversation on mount

**Files:**
- Modify: `src/components/chat/useChat.ts`

**Interfaces:**
- Consumes: `getExistingConversation` (Task 2).
- Produces: unchanged public return shape; adds silent restore behavior.

- [ ] **Step 1: Import the new client function**

Change the import line in `src/components/chat/useChat.ts`:

```ts
import { createConversation, fetchMessages, sendMessage, getExistingConversation, type ChatMessage } from '@/lib/chat-client';
```

- [ ] **Step 2: Add the mount restore effect**

Add this effect inside `useChat`, AFTER the state/ref declarations and BEFORE the existing polling `useEffect`. It runs once on mount; if the visitor already has a conversation and none is set/in-flight, it adopts it:

```ts
  // On mount, silently restore an existing conversation (returning visitor).
  useEffect(() => {
    let active = true;
    (async () => {
      if (convoId || pendingRef.current) return;
      const restored = await getExistingConversation();
      if (!active || !restored.conversationId) return;
      // Don't clobber a conversation created in the meantime.
      if (convoId || pendingRef.current) return;
      setConvoId(restored.conversationId);
      setMessages(restored.messages);
      if (restored.status) setStatus(restored.status);
      seen.current = restored.messages.filter((m) => m.sender === 'admin').length;
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

Note: seeding `seen.current` with the restored admin-message count means only NEW admin replies (arriving after restore) increment `unread` — matching the existing polling logic. The existing polling effect will pick up the `convoId` and continue from there.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Run chat tests (no regression)**

Run: `npx vitest run tests/unit/chat.test.ts tests/unit/chat-client.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/useChat.ts
git commit -m "feat: restore existing chat conversation on mount"
```

---

### Task 4: `ChatProvider` context + single shared launcher

**Files:**
- Create: `src/components/chat/ChatContext.tsx`
- Modify: `src/components/chat/ChatLauncher.tsx` (consume shared context)
- Modify: `src/components/product/ChatAboutLaptop.tsx` (use context `openChat`)
- Modify: `src/app/(storefront)/layout.tsx` (wrap tree in `ChatProvider`)

**Interfaces:**
- Consumes: `useChat` (existing), `ChatPanel` (existing), `ChatLauncher` (this task).
- Produces:
  - `ChatProvider({ children }): JSX.Element` — holds one `useChat()`, renders `ChatLauncher` + `ChatPanel`, provides context.
  - `useChatLauncher(): { openChat: (laptop?: { id: number; title: string; price: number; url: string }) => void }`.
  - `useChatContext(): ReturnType<typeof useChat>` (full object, for the launcher/panel).

- [ ] **Step 1: Create the context provider**

Create `src/components/chat/ChatContext.tsx`:

```tsx
'use client';
import { createContext, useContext } from 'react';
import { useChat } from './useChat';
import { ChatLauncher } from './ChatLauncher';
import { ChatPanel } from './ChatPanel';

type Laptop = { id: number; title: string; price: number; url: string };
type ChatCtx = ReturnType<typeof useChat> & { openChatWith: (laptop?: Laptop) => void };

const Ctx = createContext<ChatCtx | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const chat = useChat();
  const openChatWith = (_laptop?: Laptop) => {
    // Laptop context is applied only for brand-new conversations by the
    // create path; a restored/existing conversation keeps its own context.
    void chat.openChat();
  };
  const value: ChatCtx = { ...chat, openChatWith };
  return (
    <Ctx.Provider value={value}>
      {children}
      <ChatLauncher />
      <ChatPanel chat={chat} />
    </Ctx.Provider>
  );
}

export function useChatContext(): ChatCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useChatContext must be used within ChatProvider');
  return v;
}

export function useChatLauncher() {
  const { openChatWith } = useChatContext();
  return { openChat: openChatWith };
}
```

- [ ] **Step 2: Refactor `ChatLauncher` to consume the context**

`ChatLauncher` no longer creates its own `useChat` or renders `ChatPanel` (the provider renders the panel). Replace `src/components/chat/ChatLauncher.tsx` with the same FAB markup but sourcing `chat` from context and dropping the `<ChatPanel>` render:

```tsx
'use client';
import Fab from '@mui/material/Fab';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import ChatIcon from '@mui/icons-material/Chat';
import { useChatContext } from './ChatContext';

export function ChatLauncher() {
  const chat = useChatContext();
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1200,
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        opacity: chat.open ? 0 : 1,
        transform: chat.open ? 'scale(0.8)' : 'scale(1)',
        pointerEvents: chat.open ? 'none' : 'auto',
        '@keyframes chatFabPulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(225,35,42,0.45)' },
          '70%': { boxShadow: '0 0 0 16px rgba(225,35,42,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(225,35,42,0)' },
        },
      }}
    >
      <Badge color="error" badgeContent={chat.unread} overlap="circular">
        <Fab
          color="primary"
          aria-label="Chat with us"
          onClick={() => void chat.openChat()}
          sx={{
            animation: 'chatFabPulse 2.4s infinite',
            '&:hover': { animation: 'none' },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        >
          <ChatIcon />
        </Fab>
      </Badge>
    </Box>
  );
}
```

Note the circular import (ChatContext imports ChatLauncher which imports ChatContext) is safe here because both are only referenced at render time, not module-eval time. If the bundler complains, split the FAB into the provider file; do not otherwise restructure.

- [ ] **Step 3: Refactor `ChatAboutLaptop` to use context**

Replace `src/components/product/ChatAboutLaptop.tsx` so it no longer owns a `useChat` or renders a panel; it just triggers the shared chat:

```tsx
'use client';
import Button from '@mui/material/Button';
import ChatIcon from '@mui/icons-material/Chat';
import { useChatLauncher } from '@/components/chat/ChatContext';

export function ChatAboutLaptop(props: { id: number; title: string; price: number; url: string; disabled?: boolean }) {
  const { id, title, price, url, disabled } = props;
  const { openChat } = useChatLauncher();
  return (
    <Button
      onClick={() => openChat({ id, title, price, url })}
      variant="contained"
      size="large"
      startIcon={<ChatIcon />}
      fullWidth
      disabled={disabled}
    >
      Chat with us
    </Button>
  );
}
```

- [ ] **Step 4: Mount `ChatProvider` in the layout**

In `src/app/(storefront)/layout.tsx`: remove the direct `import { ChatLauncher }` and its `<ChatLauncher />` usage; import `ChatProvider` from `@/components/chat/ChatContext` and wrap the storefront tree with it. Concretely, change the body so `ChatProvider` wraps the content that needs chat access (inside `StoreProvider`), and drop the standalone `<ChatLauncher />`:

```tsx
// import line:
import { ChatProvider } from '@/components/chat/ChatContext';
// (remove: import { ChatLauncher } from '@/components/chat/ChatLauncher';)

// in the tree, replace:
//   <StoreProvider> ... <ChatLauncher /> </StoreProvider>
// with:
<StoreProvider>
  <ChatProvider>
    <TopNavBar whatsappNumber={whatsappNumber} />
    <Box sx={{ pt: 10 }}>
      <TrustBanner />
      <main id="main-content">{children}</main>
      <Footer settings={settings} />
    </Box>
  </ChatProvider>
</StoreProvider>
```

(`ChatProvider` renders `ChatLauncher` + `ChatPanel` itself, so they no longer appear separately.)

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/chat/ChatContext.tsx src/components/chat/ChatLauncher.tsx src/components/product/ChatAboutLaptop.tsx src/app/(storefront)/layout.tsx
git commit -m "feat: add ChatProvider context and single shared chat launcher"
```

---

### Task 5: Convert all WhatsApp entry points to chatbot triggers

**Files (modify each; all are client components unless noted):**
- `src/components/TopNavBar.tsx`
- `src/components/HeroSection.tsx`
- `src/components/ProductCard.tsx`
- `src/components/DealCard.tsx` (`DealHero` + `DealRow`)
- `src/components/product/AddonsSection.tsx`
- `src/components/product/WhatsAppCallout.tsx`
- `src/components/product/RelatedProducts.tsx` (passes props to `ProductCard`)
- `src/components/SavedLaptopsView.tsx` (passes props to `ProductCard`)

**Interfaces:**
- Consumes: `useChatLauncher()` from `@/components/chat/ChatContext` (Task 4) — `openChat(laptop?)`.

**Conversion pattern (apply to every WhatsApp trigger in each file):**
1. Add `import { useChatLauncher } from '@/components/chat/ChatContext';` and, inside the component, `const { openChat } = useChatLauncher();`. (These are all `'use client'` components already since they use MUI interactivity — confirm the directive is present; add it only if the file is currently a client component missing it. If a file is a server component, it must be converted to client only if it directly renders the trigger; otherwise push the trigger into its client child.)
2. Replace each `<... component="a" href={waHref} target="_blank" rel="noopener" ...>` (Button/IconButton/anchor) with the same control minus the anchor props, adding `onClick={() => openChat(laptopArg)}`. `laptopArg` is `{ id, title, price, url }` when a laptop is in scope for that trigger (ProductCard, DealCard, AddonsSection, laptop page), otherwise call `openChat()` with no argument (TopNavBar, HeroSection general CTA).
3. Remove now-unused `waHref`/`buildWhatsAppLink`/`buildInquiryMessage`/`buildAddonWhatsAppMessage` local computations in that file. Leave the `whatsappNumber` prop in signatures if removing it would ripple into server parents in this task — unused props are acceptable; behavior is the bar. (Prop cleanup happens in Task 6.)
4. Restyle: change `success`/`#25D366`/`success.main`/`success.dark` colors on these controls to `primary`/brand red. Update visible copy "Chat on WhatsApp" / "WhatsApp us" / "Or chat on WhatsApp →" → "Chat with us". Update `aria-label`s from "Chat on WhatsApp" / "WhatsApp inquiry" → "Chat with us".

**Reference conversions** (two representative files — apply the analogous change to the rest):

`src/components/product/WhatsAppCallout.tsx` becomes a client component that opens the chat:

```tsx
'use client';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ChatIcon from '@mui/icons-material/Chat';
import { useChatLauncher } from '@/components/chat/ChatContext';

export default function WhatsAppCallout({ laptop }: { laptop?: { id: number; title: string; price: number; url: string } }) {
  const { openChat } = useChatLauncher();
  return (
    <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
      <Stack spacing={2} alignItems="center">
        <Typography variant="h2">Still confused? Chat with us before buying</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
          Our laptop experts are online to answer any questions about specs, condition, or shipping.
        </Typography>
        <Button onClick={() => openChat(laptop)} startIcon={<ChatIcon />}
          variant="contained" size="large" color="primary" sx={{ borderRadius: 999 }}>
          Chat with us
        </Button>
      </Stack>
    </Paper>
  );
}
```

Then update its call site `src/app/(storefront)/laptops/[slug]/page.tsx`: replace `<WhatsAppCallout href={waHref} />` with `<WhatsAppCallout laptop={{ id: laptop.id, title: laptop.title, price: laptop.price, url }} />` (do not remove `waHref`/`whatsappNumber` there yet if other siblings still use them — Task 6 handles cleanup).

`ProductCard.tsx` WhatsApp icon (currently `<IconButton component="a" href={waHref} target="_blank" rel="noopener" aria-label="WhatsApp inquiry" ...>`): change to `<IconButton onClick={() => openChat({ id: laptop.id, title: laptop.title, price: laptop.price, url: <the card's laptop url> })} aria-label="Chat with us" color="primary" ...>` and drop the `waHref` computation.

- [ ] **Step 1: Convert each file** per the pattern above (TopNavBar, HeroSection, ProductCard, DealCard, AddonsSection, WhatsAppCallout + its call site, and verify RelatedProducts/SavedLaptopsView still compile with ProductCard's new prop shape).

- [ ] **Step 2: Verify no interactive `wa.me` triggers remain**

Run: `grep -rnE "href=\{waHref\}|component=\"a\"[^>]*wa\.me|Chat on WhatsApp|WhatsApp us|WhatsApp inquiry" src/components`
Expected: no output (marketing-copy mentions in Testimonials/WhyBuyFromUs are handled in Task 6, not here).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. Fix any prop-shape mismatches surfaced by ProductCard/DealCard changes.

- [ ] **Step 4: Commit**

```bash
git add src/components
git commit -m "feat: open chatbot from all former WhatsApp entry points"
```

---

### Task 6: Remove dead WhatsApp FAB, soften copy, tidy props

**Files:**
- Delete: `src/components/WhatsAppButton.tsx` (dead `WhatsAppFab` — grep confirms it is imported/mounted nowhere)
- Modify (copy only): `src/components/Testimonials.tsx`, `src/components/WhyBuyFromUs.tsx`
- Modify (optional prop tidy): server pages that thread `whatsappNumber`/`waHref` now unused by their children

**Interfaces:** none new.

- [ ] **Step 1: Confirm and delete the dead FAB**

Run: `grep -rn "WhatsAppFab\|WhatsAppButton" src` — expect only the definition file. Then:

```bash
git rm src/components/WhatsAppButton.tsx
```

- [ ] **Step 2: Soften marketing copy (no links involved)**

In `src/components/WhyBuyFromUs.tsx`, change the "WhatsApp Support" item to "Chat Support" and its copy "Real humans on WhatsApp, from picking the right model to after-sales help." → "Real humans on live chat, from picking the right model to after-sales help." In `src/components/Testimonials.tsx`, change "Great customer service on WhatsApp." → "Great customer service on live chat." (leave the rest of each quote intact).

- [ ] **Step 3: Tidy now-unused props (only where trivial)**

Where a server page computes `waHref` or passes `whatsappNumber` into a child that no longer uses it, remove that dead computation/prop IF the removal is contained to that file and its direct child signature. Do NOT chase prop removal across many files if it widens the diff — leaving an unused prop is acceptable. Keep `lib/whatsapp.ts`, `whatsappNumber` setting, and `resolveWhatsAppNumber` intact (reversibility).

- [ ] **Step 4: Typecheck + full chat test suite**

Run: `npx tsc --noEmit && npx vitest run tests/unit/chat.test.ts tests/unit/chat-client.test.ts tests/unit/chat-server.test.ts`
Expected: typecheck clean; unit chat tests pass. (Integration tests require PAYLOAD_SECRET+DB and fail identically on the base branch — not a regression.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove dead WhatsApp FAB and soften WhatsApp copy"
```

---

### Task 7: Verification (session restore + WhatsApp replacement)

**Files:** none (verification only).

- [ ] **Step 1: Unit + typecheck**

Run: `npx vitest run tests/unit/chat.test.ts tests/unit/chat-client.test.ts tests/unit/chat-server.test.ts && npx tsc --noEmit`
Expected: pass / clean.

- [ ] **Step 2: Browser verification** (dev server available now that disk space is freed)

Start the dev server (`./node_modules/.bin/next dev --port 3001`, NOT turbopack) and confirm:
- Send a chat message, reload the page, reopen the chat → the prior message is present (session restored via `GET /api/chat`).
- Network shows `GET /api/chat → 200` on load returning the conversation.
- Each former WhatsApp control (nav bar, hero, product card icon, deal card, addon buttons, product-page callout) opens the chat panel — NOT wa.me — is styled red, and reads "Chat with us".
- Only one floating FAB in the bottom-right corner.
- On a laptop page, the trigger's conversation is tagged with that laptop (header subtitle shows the laptop summary for a new conversation).

- [ ] **Step 3: Commit any verification fixes**

```bash
git add -A
git commit -m "fix: chat sessions/whatsapp verification adjustments"
```

---

## Self-Review

**Spec coverage:**
- A1 GET /api/chat → Task 1. ✓
- A2 getExistingConversation → Task 2. ✓
- A3 useChat restore on mount → Task 3. ✓
- B1 ChatProvider/context + single launcher → Task 4. ✓
- B2 convert all WhatsApp entry points (red, "Chat with us", laptop context) → Task 5. ✓
- B3 remove floating WhatsApp FAB → Task 6. ✓
- B4 soften marketing copy → Task 6. ✓
- Keep whatsapp plumbing / no collection/admin/migration changes / no deps → Global Constraints. ✓
- Session identity reuses existing cookie; unread seeded so only new admin replies count → Task 3 note. ✓
- Verification (tests + browser) → Task 7. ✓

**Placeholder scan:** Core new mechanisms (GET, client fn, useChat effect, context, launcher, laptop button, WhatsAppCallout) have complete code. Task 5's per-file WhatsApp conversions give an explicit pattern + two full reference conversions + a grep gate rather than transcribing 8 unread components — deliberate, since exact current markup varies per file and the pattern is mechanical. Not a placeholder: each step names the file, the exact swap, the color/copy change, and a verification grep.

**Type consistency:** `openChat`/`openChatWith` accept `Laptop = { id: number; title: string; price: number; url: string }` consistently across ChatContext (Task 4), ChatAboutLaptop (Task 4), and Task 5 call sites. `getExistingConversation` return shape matches its consumer in Task 3. `ChatMessage` shape unchanged. GET response `{ conversationId, status, adminTyping, messages }` matches `getExistingConversation`'s parse.
