# Payload-native buyer chat — Design

## Goal

Replace buyer-facing WhatsApp and Chatwoot messaging with one branded chat system. Buyers chat from the storefront; staff manage conversations in Payload admin. Each conversation may be linked to a laptop.

## Scope (v1)

- Anonymous buyer identity held in an opaque, secure, httpOnly cookie.
- `conversations` collection: visitor token hash, laptop relation, status (`open`/`resolved`), last-message time, unread counts.
- `messages` collection: conversation relation, sender (`buyer`/`admin`), text, read time.
- Public API routes authorize only the visitor token for its own conversations; Payload-authenticated users reply as admin.
- Storefront chat drawer with message history, send box, unread badge, and product summary.
- Existing “Chat to buy” and product chat controls create/open a laptop-linked conversation.
- Payload admin Conversations collection with laptop, last message, unread buyer count, status, and message list.
- Typing presence stored with an expiry timestamp and refreshed while the composer is active; clients poll every 2 seconds.
- Browser push: service worker + VAPID subscription collection. Admin opts in from Payload; buyer messages send web-push and always increment the in-app unread badge as fallback.

## Non-goals

Attachments, multi-agent routing, payment collection, read receipts, and mobile-native push apps.

## Security

- Never expose a conversation ID without its visitor token.
- Rate-limit public create/send endpoints.
- Sanitize and length-limit text; no HTML rendering.
- VAPID private key remains server-only.

## Verification

- Unit: visitor authorization, context creation, typing expiry, unread counts.
- Integration: buyer cannot read another buyer's conversation; admin reply changes unread state.
- Browser: product-linked chat, typing indication both sides, Payload reply, and mocked push delivery.
