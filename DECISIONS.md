# Decisions

## 2026-08-09 — Buyer chat

Options considered: retain self-hosted Chatwoot (mature inbox, notifications, routing); adopt a realtime chat service (less backend work, another managed system); build a Payload-native MVP (full storefront/product/admin integration, but owns messaging operations). Chosen: Payload-native MVP because Jaysmart is a single-store operation and needs one admin workspace. Scope is deliberately text chat, typing presence, and browser push, with rate limits and authorization included from the start.
