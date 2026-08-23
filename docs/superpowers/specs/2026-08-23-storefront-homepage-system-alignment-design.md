# Storefront redesign — align inner pages to the homepage design system

**Date:** 2026-08-23
**Status:** Approved (design), pending implementation plan

## Goal

Redesign the four inner storefront pages so they read as siblings of the
homepage, using the homepage's established design system: tinted section
bands, grain texture, radial-glow "frosted studio" washes, `SectionHeading`
accents, `Reveal` scroll animations, floating drop-shadows, and Space Grotesk
display type.

Scope: **full visual overhaul**, with freedom to **restructure layout** where it
improves the design — provided all existing data, links, filters, store
behavior, and actions keep working.

### Pages in scope

| Page | Route | Renders |
| --- | --- | --- |
| Product detail | `/laptops/[slug]` | `src/app/(storefront)/laptops/[slug]/page.tsx` |
| Laptops listing | `/laptops` | `src/app/(storefront)/laptops/page.tsx` |
| Compare | `/compare` | `SavedLaptopsView mode="compare"` |
| Wishlist | `/wishlist` | `SavedLaptopsView mode="wishlist"` |

Compare and Wishlist both render the single `SavedLaptopsView` component, so
redesigning that one component covers both pages.

## The homepage design system (the vocabulary to spread)

Extracted from `src/app/(storefront)/page.tsx`, `HeroSection.tsx`,
`SectionHeading.tsx`, `Reveal.tsx`, `theme.ts`, and `globals.css`:

- **Tinted section bands** — full-bleed `Box` with `bgcolor: 'tint.main'`
  (soft red `#FCF1F1`) or `grey.50`, alternating with white; generous
  `py: { xs: 6, md: 8 }`.
- **`.grain` texture** (`globals.css`) — data-URI SVG noise via `::after`,
  applied with `className="grain"` on tinted sections.
- **Radial-glow diffusion washes** — the hero's "frosted studio" effect: left
  warm-red diffusion, right cool milky diffusion, top white bloom, bottom red
  deepen (see `HeroSection.tsx` lines 20–53).
- **`SectionHeading`** — h2 with a short brand-red accent bar; titles every
  section.
- **`Reveal`** — scroll-triggered fade-up, staggered with `delay` (ms).
- **Floating drop-shadow** under product imagery (hero laptop technique:
  a blurred radial ground-shadow + `drop-shadow()` filter on the image).
- **`.num`** class for prices/stats (JetBrains Mono, tabular figures; naira
  glyph now covered via `latin-ext` subset).
- **Spring-y buttons** with red-glow hover on primary CTAs (theme defaults).

## Shared foundations (new)

Two new presentational components keep the pages consistent and avoid repeating
wash/grain markup. Both are pure/presentational (no hooks, no data), safe in
server and client pages.

### `<PageHero>` — `src/components/PageHero.tsx`

Full-bleed tinted band (`tint.main` + `.grain`) carrying the homepage's radial
diffusions and top bloom, holding a page title (Space Grotesk h1), an optional
subtitle line, and optional slots for breadcrumb and actions.

Props:
```ts
{
  title: ReactNode;
  subtitle?: ReactNode;
  breadcrumb?: ReactNode;   // rendered above title
  actions?: ReactNode;      // rendered on the right / below title
  children?: ReactNode;     // optional extra content inside the band
}
```

Internals: reuse the four diffusion `Box`es from `HeroSection` (extract shared
so both use the same wash — see Isolation below). Content sits in a
`Container maxWidth="lg"` with `py: { xs: 5, md: 8 }`.

### `<SectionBand>` — `src/components/SectionBand.tsx`

Thin wrapper for alternating full-bleed section backgrounds so every page gets
the homepage's white/tinted rhythm with consistent padding.

Props:
```ts
{
  tone?: 'white' | 'grey' | 'tint';   // default 'white'
  grain?: boolean;                     // add .grain (default: true when tone !== 'white')
  py?: ResponsiveValue;                // default { xs: 6, md: 8 }
  children: ReactNode;
}
```
Renders `<Box sx={{ bgcolor, py }} className={grain ? 'grain' : undefined}>` with
an inner `Container maxWidth="lg"`.

### Extract the diffusion wash

The four radial-diffusion `Box`es currently live inline in `HeroSection`.
Extract them into a shared `<StudioWash />` (or a small module exporting the sx
objects) so `HeroSection` and `PageHero` render identical washes. This is a
targeted refactor in service of the goal — `HeroSection`'s behavior is unchanged.

## Per-page designs

### 1. Product detail (`/laptops/[slug]`)

The showcase page; largest transformation.

- **Tinted hero band**: wrap breadcrumb + hero split (gallery ↔ buy panel) in a
  full-bleed `tint.main` + `.grain` band with the studio wash, so the gallery
  sits in the same frosted-studio light as the homepage hero. Add a **floating
  ground-shadow** under the gallery image.
- **Buy panel**:
  - Keep every action and datum: `ChatAboutLaptop`, `ProductDetailActions`
    (wishlist/compare), `StockPill`, `TrustBox`, price, compare-at price,
    condition badge, "checkout coming soon" note.
  - Put the price block on a subtle white card that lifts off the tint.
  - Make the buy panel **sticky on desktop** (`position: sticky; top: <navbar
    offset>`), so it stays visible while the specs scroll. Non-sticky on mobile
    (single column). Guard so a short panel never causes layout issues.
- **Body sections** below the hero band alternate white / `grey.50` via
  `SectionBand`: KeySpecs → Description → Add-ons → CompareCallout →
  RelatedProducts → WhatsAppCallout. Each titled with `SectionHeading` where it
  has a heading, and wrapped in `Reveal` (extend the existing partial usage).
- `RelatedProducts` reuses `ProductCard` unchanged.

### 2. Laptops listing (`/laptops`)

- Replace the plain title stack with **`<PageHero>`**: title "Shop UK used
  laptops", subtitle "`{totalDocs}` in stock" (count in `.num`), on the tinted
  wash. Breadcrumb optional.
- Below, a white `SectionBand` with **filters sidebar + product grid**. Restyle
  `LaptopFilters` into a cleaner card. Grid unchanged (reuses `ProductCard`);
  stagger cards with `Reveal delay={i * 60}`.
- **Empty state** ("No laptops match those filters") gets a tinted `.grain`
  card with the studio glow + a "clear filters" affordance, instead of plain
  text.

### 3 & 4. Compare + Wishlist (`SavedLaptopsView`)

One component covers both pages.

- Add **`<PageHero>`** with the mode's title (`Your wishlist` / `Compare
  laptops`) and a short mode-specific subtitle, on the tinted wash. Keep the
  "Clear all" button as a `PageHero` action.
- Grid restyled to match; **empty state** becomes a tinted `.grain` card with
  the studio glow (not the current plain outlined box), keeping the "Browse
  laptops" CTA.
- Loading spinner and all store behavior — `fetchLaptopsByIds`, hydration gate,
  id-order preservation, `clear` — untouched.

## Isolation & boundaries

- `PageHero`, `SectionBand`, `StudioWash` are presentational: one clear purpose,
  no data or store deps, usable from server or client components.
- `SavedLaptopsView` stays a client component; the new presentational pieces are
  server/client-agnostic, so no `'use client'` boundary problems.
- No changes to data fetching, Payload queries, SEO/JSON-LD, routing, filters,
  or store logic. This is layout + styling only, plus the two new presentational
  components and the wash extraction.

## Out of scope

- No changes to `ProductCard`, `LaptopGallery`, chat, or store internals beyond
  restyling wrappers.
- No new data, collections, or API changes.
- Dark mode (the theme is light-only today).
- The other inner components not on these four pages.

## Success criteria

- All four pages visibly share the homepage's design language (tinted/grain
  bands, studio washes, SectionHeadings, Reveal, floating shadows).
- Every existing action, link, filter, and store behavior still works.
- No regressions in SSR, reduced-motion, or the naira/price rendering.
- Buy panel sticky on desktop, graceful on mobile.
- Verified in the running dev server (screenshots of each page).
