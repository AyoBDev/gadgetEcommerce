# Chat Popup Panel — Frontend Redesign

**Date:** 2026-08-22
**Status:** Approved design, pending implementation plan

## Goal

Replace the right-anchored MUI `Drawer` chat surface with a floating popup
**panel** (the Intercom / Crisp / Drift pattern): a compact rounded card that
pops up above the bottom-right launcher instead of covering a full screen edge.
Visual direction is **bold & playful** with branded red styling and lively but
tasteful CSS animation. No new dependencies — CSS keyframes plus MUI primitives
only.

This is a **presentation-only** change. The `useChat` data layer — polling,
typing presence, unread counting, conversation creation — is reused unchanged.
No API routes, Payload collections, hooks, or server logic are modified.

## Non-goals

- No changes to `useChat.ts`, `chat-client.ts`, `chat-server.ts`, API routes,
  migrations, or collections.
- No new npm dependencies (no Framer Motion). Animations are CSS + MUI only.
- No changes to the admin-side chat.
- No change to the laptop-page "Chat with us" button's placement or copy —
  only which component it opens.

## Current state (what we're replacing)

- `src/components/chat/ChatDrawer.tsx` — right-anchored `Drawer`, plain header,
  message bubbles, input row. **Replaced.**
- `src/components/chat/ChatLauncher.tsx` — fixed bottom-right FAB + `Badge`,
  renders `ChatDrawer`. **Updated** to render the new panel + add launcher pulse.
- `src/components/product/ChatAboutLaptop.tsx` — "Chat with us" button that
  opens `ChatDrawer`. **Updated** to open the new panel (import swap only).
- `src/components/chat/useChat.ts` — data hook. **Unchanged.**

The theme (`src/lib/theme.ts`) already provides: brand red `#E1232A`, Space
Grotesk display font, Inter body font, `success.main` `#25D366`, an 8px base
radius, and a spring overshoot bezier `cubic-bezier(.34,1.56,.64,1)` used on
buttons. The redesign reuses these tokens.

## Architecture

Same props contract as `ChatDrawer` so both entry points swap with a one-line
import change:

```ts
function ChatPanel({ chat, laptopSummary }: {
  chat: ReturnType<typeof useChat>;
  laptopSummary?: string;
}): JSX.Element
```

### New components (each single-purpose)

1. **`ChatPanel.tsx`** — the popup shell.
   - `position: fixed`, anchored bottom-right (`bottom: 96px`, `right: 24px`) so
     it floats above the launcher FAB. `zIndex` above the FAB (>1200).
   - Width `380px` desktop; on `xs` becomes a near-full-width rounded floating
     card (`left: 12px, right: 12px, width: auto`, `bottom: 12px`) — a floating
     card, **not** an edge-to-edge drawer. Max-height `min(70vh, 600px)`, body
     scrolls internally.
   - `borderRadius: 20`, layered shadow
     `0 12px 40px -8px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.04)` plus a faint
     red-tinted glow.
   - Rendered mounted-but-hidden (mirrors the drawer's `keepMounted`) and toggled
     by `chat.open`; controlled via `chat.setOpen`.
   - Structure: header band / scrollable message list / input row.
   - Manages local UI state only: `draft`, `sending`, input focus on open,
     autoscroll to bottom on new messages (both carried over from `ChatDrawer`).

2. **`ChatBubble.tsx`** — one message.
   - Props: `{ text, sender }` (`'buyer' | 'admin'`).
   - Buyer: red gradient fill (`linear-gradient(135deg,#E1232A,#b4171d)`), white
     text, right-aligned, tail corner `borderRadius: 18px 18px 4px 18px`.
   - Admin: `grey.100` surface, `text.primary`, left-aligned with a small
     circular red avatar to its left, mirrored tail `18px 18px 18px 4px`.
   - Entrance: slide-up + fade (`translateY(8px)→0`, opacity `0→1`, ~260ms,
     spring bezier). Applied once on mount so freshly arriving messages animate.

3. **`TypingDots.tsx`** — animated "admin is typing".
   - Three dots inside an admin-style bubble, CSS `@keyframes` bounce with
     staggered `animation-delay` (0/0.15/0.3s).
   - Shown when `chat.adminTyping` is true.

### Updated components

- **`ChatLauncher.tsx`**
  - Keeps the fixed `Fab` + unread `Badge`.
  - Adds an **idle pulse**: a soft expanding red ring behind the FAB (slow
    `@keyframes`, ~2.4s loop), paused on hover and when the panel is open.
  - Dims/fades the FAB slightly while the panel is open (panel is the focus).
  - Renders `<ChatPanel chat={chat} />` instead of `<ChatDrawer …>`.

- **`ChatAboutLaptop.tsx`**
  - Import swap: `ChatDrawer` → `ChatPanel`. Button and copy unchanged.

## Visual & motion spec (bold & playful)

### Header
- Red gradient band `linear-gradient(135deg,#E1232A,#b4171d)`, white text.
- Title "Chat with us" in Space Grotesk (theme `h3` family, ~18px).
- Subtitle line: `laptopSummary` when provided, otherwise
  "Typically replies in minutes".
- Pulsing green online dot (`success.main`) next to the title.
- Close button (white icon) → `chat.setOpen(false)`.

### Panel entrance / exit
- Enter: from launcher corner — `transform: scale(0.85) translateY(12px)`,
  opacity 0 → `scale(1) translateY(0)`, opacity 1; ~320ms; overshoot bezier
  `cubic-bezier(.34,1.56,.64,1)`; `transform-origin: bottom right`.
- Exit: quicker reverse fade + scale (~180ms, standard ease).

### Messages
- Bubbles as specified in `ChatBubble` above; max width `80%`.
- New-message stagger via per-bubble mount animation.
- Empty state: centered friendly prompt with a chat/wave glyph and the copy
  "Send us a message and our team will reply shortly."

### Micro-interactions
- Send button: icon nudges/scales on click (reuse button spring feel).
- Input: brand-red focus ring; Enter (without Shift) sends; `notifyTyping()`
  fires on change (carried over unchanged).

### Reduced motion
- Every animation guarded by `@media (prefers-reduced-motion: reduce)` →
  degrade to a plain instant/fade state (pulse off, stagger off, entrance = fade
  only). Consistent with existing theme button handling.

## Data flow

Unchanged. `ChatPanel` consumes the same `useChat` return object the drawer did:
`open`, `setOpen`, `messages`, `send`, `notifyTyping`, `adminTyping`. Unread and
`openChat` remain owned by `ChatLauncher` / `ChatAboutLaptop` exactly as today.

## Testing / verification

- Existing chat tests target `useChat` and server logic (unchanged) → must keep
  passing. Run the unit + integration chat tests to confirm no regression.
- No new unit tests required for pure presentation, but a lightweight render
  smoke test of `ChatPanel` (renders, shows bubbles by sender, shows typing
  dots when `adminTyping`) is worth adding.
- Visual verification in the browser preview: entrance/exit animation, buyer vs
  admin bubble styling, typing dots, empty state, mobile floating-card width,
  launcher pulse, and `prefers-reduced-motion` fallback.

## Files

**New**
- `src/components/chat/ChatPanel.tsx`
- `src/components/chat/ChatBubble.tsx`
- `src/components/chat/TypingDots.tsx`

**Modified**
- `src/components/chat/ChatLauncher.tsx` (render ChatPanel + pulse)
- `src/components/product/ChatAboutLaptop.tsx` (import swap)

**Removed**
- `src/components/chat/ChatDrawer.tsx` (once both call sites migrated)
