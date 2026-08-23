# Decisions

## 2026-08-19 — Admin dashboard look & feel

Complaint: Payload's admin UI feels like a generic CMS content manager, not an operations dashboard for running the store. Options considered: (1) deep-customize Payload's admin (stay inside its component system + CSS vars, marginal look improvement, weeks); (2) Directus pointed at the same Postgres (modern dashboard OOTB, ~1–2wks, but separate Vue app and the chat inbox/stat components become Vue extensions — loses embedded Next.js integration); (3) headless Payload + custom MUI admin in Next.js (full control of look-and-feel using the existing MUI theme, keeps auth/CRUD/uploads/chat REST intact, ~1–2 wks); (4) drop Payload entirely and rebuild CRUD+auth+uploads+rich text (~3–5 wks, discards working chat feature). Chosen: option 3 — headless Payload backend with a purpose-built MUI admin. Cheapest path to the required look-and-feel that preserves the already-built buyer-chat feature and its collections/API. See `docs/superpowers/specs/2026-08-19-custom-mui-admin-design.md`.

## 2026-08-09 — Buyer chat

Options considered: retain self-hosted Chatwoot (mature inbox, notifications, routing); adopt a realtime chat service (less backend work, another managed system); build a Payload-native MVP (full storefront/product/admin integration, but owns messaging operations). Chosen: Payload-native MVP because Jaysmart is a single-store operation and needs one admin workspace. Scope is deliberately text chat, typing presence, and browser push, with rate limits and authorization included from the start.
