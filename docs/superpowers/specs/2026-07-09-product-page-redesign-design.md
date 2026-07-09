# Product Page Redesign — Design

**Date:** 2026-07-09
**Status:** Approved (design), pending spec review

## Problem

The laptop product page (`src/app/(storefront)/laptops/[slug]/page.tsx`) is a functional but plain MUI layout: gallery + a specs table + two buttons. The owner supplied a richer mockup — a hero split with a condition badge and trust box, a key-specs card, a description card, an add-ons upsell, a compare callout, related products, and a secondary WhatsApp CTA. We want the product page to match that mockup.

## Key finding (scope reducer)

The mockup was generated from a Material-3 token set whose values are **identical** to the storefront's existing MUI theme (`src/lib/theme.ts`): primary `#003178` (blue), secondary `#1b6d24` (green), background `#f7f9ff`, Inter typography scale, 8px radius. **No global theme change is needed.** The mockup is Tailwind; we recreate its look with the existing MUI system per the owner's decision (no Tailwind dependency).

## Goals

1. Rebuild the product page layout/sections to match the mockup, in MUI, using the existing theme.
2. Add a staff-managed `Addons` collection powering the "Essential Add-ons" upsell.
3. Add a "You might also like" related-products section (same brand or category).
4. Keep everything data-driven; static marketing copy only where the mockup has no backing data.

## Non-Goals

- Cart / online checkout (sales are WhatsApp-based). No "Add to Cart" button.
- Per-laptop add-ons (add-ons are a global pool this pass).
- The mockup's fixed 4-quadrant description (we render the real `description` richText instead).
- Editing the shared top nav, footer, or WhatsApp FAB (already provided by the storefront layout).
- Tailwind (recreate in MUI).

## Existing context

- Storefront is entirely MUI v6 with `ThemeRegistry` + `src/lib/theme.ts`. Product page uses `Container`/`Grid2`/`Stack`/`Typography`/`Button`/`Chip`.
- Laptop model (`src/collections/Laptops.ts`): `title`, `brand` (rel→categories, brand), `category` (rel→categories, useCase), `price`/`compareAtPrice` (kobo), `condition` (`grade-a|grade-b|grade-c`), `specs` group (`processor`, `ram` GB, `storage`, `screenSize` in, `batteryHealth` %, `os`), `gallery` (array of media), `description` (richText), `warrantyDays`, `stock`, `status`.
- Reusable components: `LaptopGallery`, `ProductDetailActions` (wishlist/compare), `ProductCard`, `TrustBanner`, `CompareTeaser`.
- Helpers: `formatNaira(kobo)` (`src/lib/money.ts`); `buildWhatsAppLink` (`src/lib/whatsapp.ts`); `getSettings`/`resolveWhatsAppNumber` (`src/lib/settings.ts`); `getPayloadClient` (`src/lib/payload.ts`).
- Access-control pattern: read/create/update = `Boolean(req.user)`, delete = `req.user?.role === 'admin'`.
- **Codegen CLIs are broken here** (`generate:types`/`generate:importmap`): `payload-types.ts` is hand-maintained; add the `Addon` type by hand. Collections do not need importMap entries. New Postgres table is auto-created via dev push.

## Component 1 — `Addons` collection

New `src/collections/Addons.ts`, registered in `payload.config.ts` (after `Orders`).

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| `name` | text | required |
| `price` | number | required, min 0, kobo. Description: "In kobo (Naira × 100)". |
| `icon` | text | Material Symbols name, e.g. `work`, `mouse`, `memory`. Description points to the icon set. |
| `active` | checkbox | default `true`. Only active add-ons render on the storefront. |

**Admin:** `admin.group: 'Catalog'`, `useAsTitle: 'name'`, `defaultColumns: ['name', 'price', 'active']`.

**Access:** read/create/update = `Boolean(req.user)`; delete = `req.user?.role === 'admin'`.

**Type:** hand-add an `Addon` interface to `src/payload-types.ts` and register `addons: Addon` in the `Config['collections']` map, mirroring the existing hand-maintained convention (as was done for `Order`).

## Component 2 — Product page data

`page.tsx` stays a server component. In addition to the existing laptop query (`depth: 2`), it fetches:

- **Related laptops:** `payload.find({ collection: 'laptops', where: { and: [ { status: { equals: 'published' } }, { id: { not_equals: laptop.id } }, { or: [ { brand: { equals: brandId } }, { category: { equals: categoryId } } ] } ] ], sort: '-publishedAt', limit: 4, depth: 1 })`. `brandId`/`categoryId` are resolved from the laptop's relationships (guard when `category` is unset). If the `or` yields nothing, the section is hidden.
- **Add-ons:** `payload.find({ collection: 'addons', where: { active: { equals: true } }, limit: 50 })`. Hidden if none.

SEO/JSON-LD (`buildProductJsonLd`, `buildBreadcrumbJsonLd`, `generateMetadata`, `generateStaticParams`) is unchanged.

## Component 3 — Page layout (MUI, existing theme)

Top-to-bottom, inside the storefront layout (which already renders top nav, footer, WhatsApp FAB):

1. **Breadcrumb** — Home / Laptops / {title} (existing).
2. **Hero split** — `Grid` 7/5 desktop, stacked mobile.
   - Left: `LaptopGallery` with a **condition badge** overlaid top-left ("Grade A/B/C" + verified icon). Thumbnail strip + "+N more" come from the gallery.
   - Right: title; subtitle (`processor · {ram}GB · storage`); **price** + struck-through `compareAtPrice` (when present); **stock pill** (green dot + `IN STOCK (N AVAILABLE)`, or `SOLD` when `stock === 0`); **mini trust box** (20-point inspection; `Verified battery {batteryHealth}%+` when set, else generic; instant delivery); CTAs **Buy Now** and **WhatsApp inquiry** (both open WhatsApp; Buy Now disabled when sold out); then existing `ProductDetailActions` (wishlist/compare) + the "online checkout coming soon" note.
3. **Key Specifications** — bordered card; 2-col mobile / 4-col desktop grid of label+value: Processor, RAM (`{ram}GB DDR`), Storage, Screen (`{screenSize}"`), Condition (verified icon + grade label), Battery Health (`{batteryHealth}%+`), OS. Each row omitted when its field is absent.
4. **Product Description** — bordered card rendering the real `description` richText (styled headings/paragraphs). Hidden if no description.
5. **Essential Add-ons** — card grid of active add-ons: icon + name + `+{formatNaira(price)}` + **ADD** button (WhatsApp prefill). Whole section hidden if none.
6. **Compare callout** — primary-colored banner → `/compare`.
7. **You might also like** — up to 4 related laptops via `ProductCard`. Hidden if zero.
8. **Secondary WhatsApp callout** — "Still confused? Chat with us" + WhatsApp button.

**New components** under `src/components/product/` (small, single-purpose):
`KeySpecs.tsx`, `TrustBox.tsx`, `AddonsSection.tsx` (client), `RelatedProducts.tsx`, `CompareCallout.tsx`, `WhatsAppCallout.tsx`, `StockPill.tsx`, `ConditionBadge.tsx`. Reuse `LaptopGallery`, `ProductDetailActions`, `ProductCard`.

## Component 4 — WhatsApp prefills

Reuse `buildWhatsAppLink` + `resolveWhatsAppNumber`.

- Main inquiry / Buy Now: `"Hi, I'm interested in the {title} ({formatNaira(price)}) — {url}"` (existing).
- Add-on ADD (client, in `AddonsSection`): `"Hi, I'd like the {title} ({formatNaira(price)}) plus the {addon.name} (+{formatNaira(addon.price)}) — {url}"`.

The server page passes the resolved WhatsApp number, laptop title, laptop price, and page URL to `AddonsSection` as props; the message is built client-side by a pure helper `buildAddonWhatsAppMessage({ title, price, url, addonName, addonPrice })` in `src/lib/whatsapp.ts` (unit-tested).

## Edge cases

- Sold out (`stock === 0`): stock pill shows `SOLD`; Buy Now disabled; WhatsApp still active.
- Missing spec fields: corresponding Key-Specs rows and the battery trust line degrade (omitted or generic).
- No `compareAtPrice`: no struck-through price.
- No active add-ons: Add-ons section hidden.
- < 4 related laptops (or none): render what exists; hide section if zero.
- Empty gallery: existing placeholder behavior.
- Laptop `category` unset: related query uses brand only.

## Testing

Matches repo patterns (Vitest; integration via Payload local API; `pnpm test`).

- **Unit (TDD):** `buildAddonWhatsAppMessage` — asserts exact prefilled text incl. ₦ formatting. If the related-laptops `where` is extracted into a helper, unit-test its shape (brand-or-category, excludes self, limit 4).
- **Integration** (`tests/integration/`, like `payload-orders.test.ts`): create `addons` + laptops via local API; assert active-only add-ons are returned and related-laptops query returns brand/category matches excluding self; assert admin-only delete on `addons`.
- **Browser verification** (controller, not a subagent): render a real product page; verify all sections, sold-out state, add-on WhatsApp link opens a correct prefilled message, related products, and mobile/desktop + light/dark. Restart dev server if a new admin component triggers a stale importMap (not expected here — no admin components added).

## Files touched

- **New:** `src/collections/Addons.ts`; `src/components/product/{KeySpecs,TrustBox,AddonsSection,RelatedProducts,CompareCallout,WhatsAppCallout,StockPill,ConditionBadge}.tsx`; unit + integration tests.
- **Edited:** `src/app/(storefront)/laptops/[slug]/page.tsx`; `src/payload.config.ts` (register `Addons`); `src/payload-types.ts` (hand-add `Addon`); `src/lib/whatsapp.ts` (add `buildAddonWhatsAppMessage`).
- **Migration:** dev push auto-creates `addons`; a real Postgres migration is a pre-prod follow-up (same as `orders`).

## Success criteria

- Product page renders all mockup sections in MUI with the existing theme, on mobile and desktop, light and dark.
- Add-ons managed in admin appear on the page; ADD opens a correct WhatsApp prefill.
- Related products show up to 4 relevant laptops; sold-out and missing-field states degrade cleanly.
- Existing SEO/JSON-LD intact; typecheck and tests pass.
