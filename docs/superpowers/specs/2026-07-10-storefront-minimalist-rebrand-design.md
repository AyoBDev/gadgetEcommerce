# Storefront Minimalist Rebrand — Design

**Date:** 2026-07-10
**Branch:** phase-1-foundation
**Status:** Approved (pending spec review)

## Goal

Make the storefront feel like the Payload admin dashboard — generous whitespace,
low visual noise, neutral white surfaces, hairline borders instead of shadows —
and re-color it around the Jaysmart logo. The logo's vivid red becomes the single
brand accent on a black-on-white base. Applied as a full page-by-page pass.

## Brand palette (from the logo)

Sampled from `~/Downloads/PHOTO-2026-07-09-01-23-12.jpg` (now copied to
`public/logo.jpg`). The logo is red + black on white.

| Token | Current | New | Notes |
|---|---|---|---|
| `primary.main` | `#003178` (blue) | `#E1232A` (logo red) | Primary CTAs, prices, links, active states |
| `primary.contrastText` | `#ffffff` | `#ffffff` | |
| `secondary.main` | `#1b6d24` (green) | `#1A1A1A` (near-black) | Secondary/neutral CTAs |
| `success.main` (new) | — | `#25D366` (WhatsApp green) | **WhatsApp buttons keep green** |
| `text.primary` | `#0b1d2d` | `#111111` | |
| `text.secondary` | `#434652` | `#6B6B6B` | |
| `background.default` | `#f7f9ff` (blue tint) | `#FFFFFF` (pure white) | matches admin |
| `background.paper` | `#ffffff` | `#ffffff` | |
| `divider` (new) | (MUI default) | `#EAEAEA` | hairline, admin-style |

`#E1232A` is the standardized brand red; sampling the anti-aliased logo edges
gave a spread of `#EA4045`–`#E12329`, and this value reads true to the mark.

WhatsApp actions stay green via a dedicated `success` palette entry (WhatsApp
brand green `#25D366`) rather than the old MUI green, so the intent is explicit.

## Surface & whitespace language (match the admin)

The admin's card style is the template: `background: white; border: 1px solid
var(--theme-elevation-100); border-radius: 6px; padding: 1.25rem` with a subtle
hover — **no drop shadows**.

1. **Flatten shadows** — replace MUI elevation / `boxShadow` on cards, papers,
   and the app bar with a `1px solid #EAEAEA` hairline border. Prefer
   `variant="outlined"` + `elevation={0}` on MUI surfaces.
2. **Increase breathing room** — bump section vertical padding, card padding, and
   grid `spacing`/`gap` up a step so content sits on white with air around it.
3. **Reduce fills** — remove decorative background colors and tinted panels;
   surfaces are white, with the faintest gray (`#F7F7F7`) only where separation
   is genuinely needed.
4. **Consistent radius** — keep the theme `borderRadius: 8`; drop the larger
   `borderRadius: 3` (=24px) rounding on hero/image boxes down to the base radius.
5. **Lighten type weight** — reduce `h1` weight 800 → 700 to feel less heavy,
   matching the admin's restraint. Rest of the type scale is unchanged.

## Logo integration

- Copy the logo to `public/logo.jpg` (done).
- Wire it into `TopNavBar` as the brand element (replacing/augmenting the current
  text wordmark), linking to `/`, using `next/image` with an explicit
  width/height and `priority` in the nav.
- Add it to the `Footer` brand area at a smaller size.
- Because the source is a 2560×2560 JPG on a white field, render it at a small
  fixed height (e.g. 40px in nav, 32px in footer) and let width auto-scale;
  no cropping/processing required for v1.

## Scope: page-by-page pass

Theme lands first (everything inherits it), then a deliberate whitespace/color
pass in this order:

1. **Global chrome** — `TopNavBar`, `TrustBanner`, `Footer` (sets the tone
   everywhere; includes logo wiring).
2. **Home** (`(storefront)/page.tsx`) — `HeroSection`, `CategoryCard`,
   `WhyBuyFromUs`, `Testimonials`, `CompareTeaser`, `SmartFinder`/`QuickFinder`.
3. **Laptops list** (`(storefront)/laptops/page.tsx`) — `LaptopFilters`,
   `ProductCard` grid.
4. **Laptop detail** (`(storefront)/laptops/[slug]/page.tsx`) — `LaptopGallery`,
   `LaptopSpecsTable`, `product/*` (TrustBox, KeySpecs, StockPill,
   ConditionBadge, AddonsSection, WhatsAppCallout, CompareCallout,
   RelatedProducts), `ProductDetailActions`.
5. **Compare, Wishlist, not-found** (`compare/`, `wishlist/`,
   `not-found.tsx`, `SavedLaptopsView`).

Each page/component gets: neutralized colors, hairline borders instead of
shadows, tightened-then-widened spacing for whitespace, red reserved for
CTAs / prices / active states, WhatsApp buttons green.

## Out of scope (YAGNI)

- No new components or layout restructuring.
- No dark mode.
- No changes to the admin (it is the reference, already clean).
- No logo image processing (transparent PNG, SVG tracing) — v1 uses the JPG.
- Typography scale unchanged except the `h1` weight reduction.

## Testing / verification

- Run the dev server and visually verify each page via the preview tools
  (screenshots for layout, `preview_inspect` for exact colors — confirm primary
  buttons render `#E1232A`, backgrounds pure white, borders hairline gray).
- Confirm WhatsApp buttons render green.
- Confirm the logo appears in nav and footer and links home.
- Check mobile (`preview_resize`) for the nav and product grid.
- No console/build errors.

## Risks / notes

- Restarting the dev server may be needed if admin importMap goes stale
  (see project memory), but this work is storefront-only.
- The logo JPG has a white background; on white surfaces it will blend
  seamlessly (intended). If a bordered container is ever wanted around it,
  that's a later polish item, not v1.
