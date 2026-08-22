# Chat Popup Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the right-anchored MUI `Drawer` chat surface with a bold, playful floating popup panel (Intercom/Crisp style) animated with CSS + MUI only, reusing the existing `useChat` data layer unchanged.

**Architecture:** Three new presentational client components — `ChatPanel` (popup shell, same props contract as the old `ChatDrawer`), `ChatBubble` (single animated message), `TypingDots` (animated indicator). Two call sites (`ChatLauncher`, `ChatAboutLaptop`) swap `ChatDrawer` → `ChatPanel`; `ChatLauncher` also gains an idle launcher pulse. `ChatDrawer` is deleted once both call sites migrate. No data-layer, API, or collection changes.

**Tech Stack:** Next.js (client components), React, MUI 6 (`@mui/material`, `@emotion`), CSS keyframes via MUI `sx`. Test runner: Vitest (`vitest run`). No new dependencies.

## Global Constraints

- No new npm dependencies. Animations are CSS keyframes + MUI primitives only (no Framer Motion).
- Do not modify `src/components/chat/useChat.ts`, `src/lib/chat-client.ts`, `src/lib/chat-server.ts`, `src/lib/chat.ts`, API routes, migrations, or collections.
- `ChatPanel` MUST keep the exact same props contract as the old `ChatDrawer`: `{ chat: ReturnType<typeof useChat>; laptopSummary?: string }`.
- All components are client components (`'use client'` first line).
- Every animation MUST have a `@media (prefers-reduced-motion: reduce)` fallback (fade-only or none), consistent with `src/lib/theme.ts` button handling.
- Reuse theme tokens: brand red `#E1232A`, gradient partner `#b4171d`, `success.main` `#25D366`, spring bezier `cubic-bezier(.34,1.56,.64,1)`, Space Grotesk display font (via theme `h3`), 8px base radius.
- The codebase has no component render-test tooling (no `@testing-library/react`) and does not unit-test components; do NOT add such tooling. Verification for these presentational components is: existing chat test suite stays green + browser-preview visual check.
- All work happens in the `worktrees/redesign-chat-panel` worktree only.

---

### Task 1: `TypingDots` — animated typing indicator

**Files:**
- Create: `src/components/chat/TypingDots.tsx`

**Interfaces:**
- Consumes: nothing (self-contained).
- Produces: `export function TypingDots(): JSX.Element` — three bouncing dots inside an admin-style bubble. No props.

- [ ] **Step 1: Create the component**

```tsx
'use client';
import Box from '@mui/material/Box';

const BOUNCE = {
  '@keyframes chatDotBounce': {
    '0%, 80%, 100%': { transform: 'translateY(0)', opacity: 0.4 },
    '40%': { transform: 'translateY(-4px)', opacity: 1 },
  },
};

export function TypingDots() {
  return (
    <Box
      aria-label="Admin is typing"
      sx={{
        alignSelf: 'flex-start',
        display: 'flex',
        gap: 0.6,
        bgcolor: 'grey.100',
        borderRadius: '18px 18px 18px 4px',
        px: 1.5,
        py: 1.25,
        ...BOUNCE,
      }}
    >
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: 'text.secondary',
            animation: 'chatDotBounce 1.2s infinite ease-in-out',
            animationDelay: `${i * 0.15}s`,
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
              opacity: 0.6,
            },
          }}
        />
      ))}
    </Box>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `TypingDots.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/TypingDots.tsx
git commit -m "feat: add animated typing-dots indicator for chat"
```

---

### Task 2: `ChatBubble` — single animated message

**Files:**
- Create: `src/components/chat/ChatBubble.tsx`

**Interfaces:**
- Consumes: `ChatMessage['sender']` shape — `sender` is `'buyer' | 'admin'`.
- Produces: `export function ChatBubble(props: { text: string; sender: 'buyer' | 'admin' }): JSX.Element`.

- [ ] **Step 1: Create the component**

```tsx
'use client';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

const SPRING = 'cubic-bezier(.34,1.56,.64,1)';

const RISE = {
  '@keyframes chatBubbleRise': {
    from: { opacity: 0, transform: 'translateY(8px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
};

export function ChatBubble({ text, sender }: { text: string; sender: 'buyer' | 'admin' }) {
  const isBuyer = sender === 'buyer';
  const bubble = (
    <Box
      sx={{
        maxWidth: '80%',
        px: 1.75,
        py: 1.25,
        color: isBuyer ? 'common.white' : 'text.primary',
        background: isBuyer
          ? 'linear-gradient(135deg, #E1232A, #b4171d)'
          : (t) => t.palette.grey[100],
        borderRadius: isBuyer ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        boxShadow: isBuyer ? '0 4px 12px -6px rgba(225,35,42,0.5)' : 'none',
        ...RISE,
        animation: `chatBubbleRise 0.26s ${SPRING} both`,
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'chatBubbleRise 0.15s ease both',
        },
      }}
    >
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {text}
      </Typography>
    </Box>
  );

  if (isBuyer) {
    return <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>{bubble}</Box>;
  }

  return (
    <Stack direction="row" spacing={1} alignItems="flex-end">
      <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 13 }}>J</Avatar>
      {bubble}
    </Stack>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `ChatBubble.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/ChatBubble.tsx
git commit -m "feat: add animated chat message bubble"
```

---

### Task 3: `ChatPanel` — floating popup shell

**Files:**
- Create: `src/components/chat/ChatPanel.tsx`

**Interfaces:**
- Consumes: `TypingDots` (Task 1, no props); `ChatBubble` (Task 2, `{ text, sender }`); `useChat` return shape from `./useChat` — uses `open`, `setOpen`, `messages` (`{ id, text, sender }[]`), `send(text): Promise<void>`, `notifyTyping()`, `adminTyping`.
- Produces: `export function ChatPanel({ chat, laptopSummary }: { chat: ReturnType<typeof useChat>; laptopSummary?: string }): JSX.Element`.

- [ ] **Step 1: Create the component**

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Grow from '@mui/material/Grow';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import type { useChat } from './useChat';
import { ChatBubble } from './ChatBubble';
import { TypingDots } from './TypingDots';

const SPRING = 'cubic-bezier(.34,1.56,.64,1)';

export function ChatPanel({
  chat,
  laptopSummary,
}: {
  chat: ReturnType<typeof useChat>;
  laptopSummary?: string;
}) {
  const { open, setOpen, messages, send, notifyTyping, adminTyping } = chat;
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, adminTyping]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft('');
    try {
      await send(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <Grow
      in={open}
      style={{ transformOrigin: 'bottom right' }}
      timeout={{ enter: 320, exit: 180 }}
      easing={{ enter: SPRING, exit: 'ease' }}
      mountOnEnter
      unmountOnExit
    >
      <Box
        role="dialog"
        aria-label="Chat with us"
        sx={{
          position: 'fixed',
          zIndex: 1300,
          bottom: { xs: 12, sm: 96 },
          right: { xs: 12, sm: 24 },
          left: { xs: 12, sm: 'auto' },
          width: { xs: 'auto', sm: 380 },
          maxHeight: 'min(70vh, 600px)',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow:
            '0 12px 40px -8px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.04), 0 0 32px -12px rgba(225,35,42,0.25)',
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 2,
            py: 1.75,
            background: 'linear-gradient(135deg, #E1232A, #b4171d)',
            color: 'common.white',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  boxShadow: '0 0 0 0 rgba(37,211,102,0.6)',
                  '@keyframes chatOnlinePulse': {
                    '0%': { boxShadow: '0 0 0 0 rgba(37,211,102,0.6)' },
                    '70%': { boxShadow: '0 0 0 6px rgba(37,211,102,0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(37,211,102,0)' },
                  },
                  animation: 'chatOnlinePulse 2s infinite',
                  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                }}
              />
              <Typography variant="h3" sx={{ fontSize: 18, color: 'common.white' }}>
                Chat with us
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', display: 'block', mt: 0.25 }} noWrap>
              {laptopSummary ?? 'Typically replies in minutes'}
            </Typography>
          </Box>
          <IconButton aria-label="Close chat" onClick={() => setOpen(false)} sx={{ color: 'common.white' }}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {/* Messages */}
        <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2, bgcolor: 'background.paper' }}>
          {messages.length === 0 ? (
            <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ height: '100%', textAlign: 'center', color: 'text.secondary', py: 4 }}>
              <Box sx={{ fontSize: 36, lineHeight: 1 }}>💬</Box>
              <Typography variant="body2" color="text.secondary">
                Send us a message and our team will reply shortly.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              {messages.map((m) => (
                <ChatBubble key={m.id} text={m.text} sender={m.sender} />
              ))}
              {adminTyping && <TypingDots />}
            </Stack>
          )}
        </Box>

        {/* Input */}
        <Stack direction="row" spacing={1} sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            size="small"
            placeholder="Type a message"
            aria-label="Message"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              notifyTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: '999px' },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
                borderWidth: 2,
              },
            }}
          />
          <IconButton
            aria-label="Send message"
            color="primary"
            onClick={() => void handleSend()}
            disabled={sending || !draft.trim()}
            sx={{
              transition: `transform 0.2s ${SPRING}`,
              '&:not(:disabled):active': { transform: 'scale(0.9) rotate(-8deg)' },
              '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:active': { transform: 'none' } },
            }}
          >
            <SendIcon />
          </IconButton>
        </Stack>
      </Box>
    </Grow>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `ChatPanel.tsx`. If `m.sender` type mismatches `ChatBubble`'s `'buyer' | 'admin'`, confirm `ChatMessage['sender']` in `src/lib/chat-client.ts` and align the `ChatBubble` prop type to it (do not change chat-client).

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/ChatPanel.tsx
git commit -m "feat: add floating chat popup panel"
```

---

### Task 4: Migrate call sites and add launcher pulse; remove `ChatDrawer`

**Files:**
- Modify: `src/components/chat/ChatLauncher.tsx`
- Modify: `src/components/product/ChatAboutLaptop.tsx:4-5,22` (import + render)
- Delete: `src/components/chat/ChatDrawer.tsx`

**Interfaces:**
- Consumes: `ChatPanel` (Task 3, `{ chat, laptopSummary? }`); `useChat` (`unread`, `openChat`, `open`).
- Produces: nothing new (updates existing exports `ChatLauncher`, `ChatAboutLaptop`).

- [ ] **Step 1: Update `ChatLauncher.tsx` (render ChatPanel + idle pulse)**

Replace the whole file with:

```tsx
'use client';
import Fab from '@mui/material/Fab';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import ChatIcon from '@mui/icons-material/Chat';
import { useChat } from './useChat';
import { ChatPanel } from './ChatPanel';

export function ChatLauncher() {
  const chat = useChat();
  return (
    <>
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
          // Idle pulse ring behind the FAB.
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
      <ChatPanel chat={chat} />
    </>
  );
}
```

- [ ] **Step 2: Update `ChatAboutLaptop.tsx` (import + render swap)**

Change the import line `import { ChatDrawer } from '@/components/chat/ChatDrawer';` to:

```tsx
import { ChatPanel } from '@/components/chat/ChatPanel';
```

Change the render line `<ChatDrawer chat={chat} laptopSummary={title} />` to:

```tsx
<ChatPanel chat={chat} laptopSummary={title} />
```

- [ ] **Step 3: Delete the old drawer**

```bash
git rm src/components/chat/ChatDrawer.tsx
```

- [ ] **Step 4: Verify no lingering references**

Run: `grep -rn "ChatDrawer" src`
Expected: no output.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/chat/ChatLauncher.tsx src/components/product/ChatAboutLaptop.tsx
git commit -m "feat: swap chat drawer for popup panel and add launcher pulse"
```

---

### Task 5: Regression + visual verification

**Files:** none (verification only).

- [ ] **Step 1: Run the chat test suite (must stay green — data layer untouched)**

Run: `npx vitest run tests/unit/chat-client.test.ts tests/unit/chat-server.test.ts tests/unit/chat.test.ts tests/integration/chat-send.test.ts tests/integration/chat-authorization.test.ts`
Expected: all pass. (These target `useChat`/server logic, which this plan does not modify.)

- [ ] **Step 2: Full typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Browser-preview visual check**

Start the dev server (`preview_start` with the project's dev config) and, on any storefront page and a laptop detail page, confirm:
- FAB shows the idle pulse ring; hover pauses it.
- Clicking the FAB (or the laptop "Chat with us" button) pops the panel in from the bottom-right corner with the spring overshoot; FAB dims/hides.
- Header shows the red gradient, pulsing green dot, title, and subtitle (`laptopSummary` on laptop pages, else "Typically replies in minutes").
- Empty state shows the 💬 prompt.
- Sending a message shows a right-aligned red gradient buyer bubble that rises in; admin replies render left-aligned with avatar; typing dots animate when `adminTyping`.
- Close animates out (faster reverse) and the FAB returns.
- At mobile width the panel is a rounded floating card inset from both edges (not an edge-to-edge drawer).
- With OS "reduce motion" on, animations degrade to fades/none and nothing breaks.

- [ ] **Step 4: Commit (if any fixes were needed during verification)**

```bash
git add -A
git commit -m "fix: chat panel verification adjustments"
```

---

## Self-Review

**Spec coverage:**
- Floating popup panel replacing drawer → Task 3 + Task 4. ✓
- Same props contract → Task 3 interface + Global Constraints. ✓
- Bold/playful visuals (gradient header, gradient buyer bubbles, avatar, glow) → Tasks 2, 3. ✓
- Entrance/exit spring animation → Task 3 (`Grow` with spring easing). ✓
- Message stagger → Task 2 (per-bubble mount animation). ✓
- Animated typing dots → Task 1. ✓
- Launcher idle pulse + dim-when-open → Task 4. ✓
- Both entry points migrated → Task 4. ✓
- `ChatDrawer` removed → Task 4. ✓
- Reduced-motion fallbacks everywhere → Tasks 1–4. ✓
- Data layer untouched; tests stay green → Global Constraints + Task 5. ✓
- No new dependencies → Global Constraints; note in plan replaced the spec's optional render smoke test (no test tooling exists) with suite regression + browser check. ✓

**Placeholder scan:** No TBD/TODO; all code blocks are complete. ✓

**Type consistency:** `ChatBubble` prop `sender: 'buyer' | 'admin'` matches `ChatMessage.sender` usage in `ChatPanel` (Task 3 Step 2 guards against mismatch). `ChatPanel` props match old `ChatDrawer` contract used by both call sites. `TypingDots` takes no props, called with none. ✓
