# Storefront redesign — align inner pages to the homepage design system

**Date:** 2026-08-23
**Status:** Approved (design); **revised 2026-08-23 after rebase onto origin/main** — homepage design system changed to a dark `night`-band hero. See "Design-basis revision" below.

## Design-basis revision (post-rebase)

After this branch was rebased onto the updated `origin/main` (which merged the
chat-panel work), the **homepage design system changed materially**. The hero is
now a **near-black `night` band**, not a light red-tinted wash. All tone
references in this spec are updated accordingly. The current palette
(`src/lib/theme.ts`):

- `night: { main: '#0E0E0F', light: '#1A1A1C', contrastText: '#F4F2EE' }` — the
  dark "spine" band used for hero/stats/finder/footer.
- `background: { default: '#F6F5F2', paper: '#FFFFFF' }` — warm off-white.
- `tint: { main: '#FCEBEA' }` — soft red-washed light band.
- `grey: { 50: '#F1F0ED', 100: '#EFEDE8', 200: '#E4E1DC' }`.
- `ink: { main: '#161512' }`; `divider: '#E4E1DC'`; `shape.borderRadius: 10`.
- Body font is **Instrument Sans** (`--font-inter` variable); display is Space Grotesk.
- Hero CTA uses the **chat launcher** (`useChatLauncher().openChat()`), not a
  WhatsApp button.

`StudioWash` now holds the **dark-hero wash** (red glows on black): left warm-red
glow `rgba(225,35,42,0.22)`, right cool milky `rgba(255,255,255,0.05)`, top bloom
`rgba(255,255,255,0.06)`, bottom red deepen `rgba(225,35,42,0.10)`.

## Goal

Redesign the four inner storefront pages so they read as siblings of the
homepage, using the homepage's current design system: the **dark `night` hero
band**, grain texture, radial-glow "studio" washes, `SectionHeading` accents,
`Reveal` scroll animations, floating drop-shadows, and Space Grotesk display type.

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

- **Section bands** — full-bleed `Box` alternating `night.main` (dark spine),
  `background.paper`, `grey.50`, and `tint.main`; generous `py: { xs: 6, md: 8 }`.
  The homepage uses the `night` band for hero/stats/finder/footer and light
  bands (`background.paper`/`grey.50`) for the content sections.
- **`.grain` texture** (`globals.css`) — data-URI SVG noise via `::after`,
  applied with `className="grain"` on any band (especially the `night` and
  tinted ones).
- **Radial-glow diffusion washes** — the hero's dark "studio" effect: red glows
  on a near-black base, extracted into `StudioWash` (see values above).
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

Full-bleed **dark `night` band** (`bgcolor: 'night.main'`, `color:
'night.contrastText'`, `.grain`) carrying `StudioWash`, holding a page title
(Space Grotesk h1), an optional subtitle line, and optional slots for breadcrumb
and actions. This matches the homepage hero so inner pages open on the same dark
spine. Subtitle text uses a muted light (`rgba(244,242,238,0.75)`) for contrast
on the dark base.

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

Props (as implemented, `57e8108`):
```ts
{
  tone?: 'white' | 'grey' | 'tint';    // default 'white'
  grain?: boolean;                     // add .grain (default: true when tone !== 'white')
  py?: { xs: number; md: number };     // default { xs: 6, md: 8 }
  maxWidth?: 'lg' | false;             // default 'lg'
  children: ReactNode;
  id?: string;
}
```
Background map: white→`background.paper`, grey→`grey.50`, tint→`tint.main`.
Renders `<Box sx={{ bgcolor, py }} className={grain ? 'grain' : undefined}>` with
an inner `Container maxWidth="lg"`. The **dark `night` hero band is `PageHero`'s
job**, not a `SectionBand` tone — body sections only use white/grey/tint, so
`SectionBand` needs no `night` tone.

### Extract the diffusion wash — DONE

The four radial-diffusion `Box`es lived inline in `HeroSection`; they are now
extracted into `src/components/StudioWash.tsx`, holding the **dark-hero wash**
(red glows on near-black). `HeroSection` and `PageHero` both render it. This was
completed during the rebase; `HeroSection`'s rendered output is unchanged from
the current `origin/main` hero.

## Per-page designs

### 1. Product detail (`/laptops/[slug]`)

The showcase page; largest transformation.

- **Dark hero band**: wrap breadcrumb + hero split (gallery ↔ buy panel) in a
  full-bleed `night.main` + `.grain` band with `StudioWash`, so the gallery sits
  on the same dark studio spine as the homepage hero. Breadcrumb + title text use
  `night.contrastText` / muted light. Add a **floating ground-shadow** under the
  gallery image (dark-appropriate `rgba(0,0,0,0.5)`).
- **Buy panel**:
  - Keep every action and datum: `ChatAboutLaptop`, `ProductDetailActions`
    (wishlist/compare), `StockPill`, `TrustBox`, price, compare-at price,
    condition badge, "checkout coming soon" note.
  - Put the price block on a **white `background.paper` card** that lifts off the
    dark band (so price/actions stay legible against `night.main`). The whole buy
    panel sits on a paper card for contrast on the dark hero.
  - Make the buy panel **sticky on desktop** (`position: sticky; top: <navbar
    offset>`), so it stays visible while the specs scroll. Non-sticky on mobile
    (single column). Guard so a short panel never causes layout issues.
- **Body sections** below the hero band alternate white / `grey.50` via
  `SectionBand`: KeySpecs → Description → Add-ons → CompareCallout →
  RelatedProducts → WhatsAppCallout. Each titled with `SectionHeading` where it
  has a heading, and wrapped in `Reveal` (extend the existing partial usage).
- `RelatedProducts` reuses `ProductCard` unchanged.

### 2. Laptops listing (`/laptops`)

- Replace the plain title stack with **`<PageHero>`** (dark `night` band): title
  "Shop UK used laptops", subtitle "`{totalDocs}` in stock" (count in `.num`).
  Breadcrumb optional.
- Below, a white `SectionBand` with **filters sidebar + product grid**. Restyle
  `LaptopFilters` into a cleaner card. Grid unchanged (reuses `ProductCard`);
  stagger cards with `Reveal delay={i * 60}`.
- **Empty state** ("No laptops match those filters") gets a **`tint.main` +
  `.grain` card** (no `StudioWash` — that wash is dark-on-black and would not
  read on a light card) + a "clear filters" affordance, instead of plain text.

### 3 & 4. Compare + Wishlist (`SavedLaptopsView`)

One component covers both pages.

- Add **`<PageHero>`** (dark `night` band) with the mode's title (`Your
  wishlist` / `Compare laptops`) and a short mode-specific subtitle. Keep the
  "Clear all" button as a `PageHero` action.
- Grid restyled to match; **empty state** becomes a **`tint.main` + `.grain`
  card** (no `StudioWash`, per the listing-page note), not the current plain
  outlined box, keeping the "Browse laptops" CTA.
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
