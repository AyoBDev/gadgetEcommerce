# Storefront Homepage-System Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the product-detail, laptops-listing, compare, and wishlist pages to read as siblings of the homepage, using its design system (tinted/grain bands, radial-glow studio washes, `SectionHeading`, `Reveal`, floating shadows).

**Architecture:** Extract the homepage hero's radial-diffusion wash into a shared `StudioWash`, add two presentational wrappers (`PageHero`, `SectionBand`), then recompose the four pages with them. Pure layout + styling; no data, query, routing, SEO, or store changes.

**Tech Stack:** Next.js App Router (RSC), MUI v6 (`@mui/material`, `Grid2`, `sx`, `createTheme` with `cssVariables`), TypeScript, vitest + Playwright.

## Global Constraints

> **REVISED 2026-08-23 after rebase onto origin/main.** The homepage design
> system changed: the hero is now a **dark `night` band**, not a light tint.
> Palette (`src/lib/theme.ts`): `night {main:#0E0E0F, light:#1A1A1C,
> contrastText:#F4F2EE}`, `background {default:#F6F5F2, paper:#FFFFFF}`, `tint
> {main:#FCEBEA}`, `grey {50:#F1F0ED, 100:#EFEDE8, 200:#E4E1DC}`, `ink
> {main:#161512}`, `divider:#E4E1DC`, `borderRadius:10`. Body font is Instrument
> Sans. **Tasks 1 & 2 are already committed** (StudioWash re-derived to the dark
> wash: `0a2aff2`; SectionBand: `57e8108`). Task 3 (PageHero) and Tasks 4–7 use
> the tones below.

- Follow existing MUI patterns: `sx` props, `Grid2` (`import Grid from '@mui/material/Grid2'`), theme tokens. Tone tokens available: `night.main` (+ `night.contrastText` for text), `background.paper`, `grey.50`, `tint.main`, `primary.main`, `divider`. No new CSS files; grain via existing `className="grain"`.
- **`PageHero` renders a dark `night` band** (`bgcolor:'night.main'`, `color:'night.contrastText'`) with `StudioWash`, matching the homepage hero. Its subtitle uses muted light `rgba(244,242,238,0.75)`.
- **`StudioWash` is dark-on-black** (red glows on near-black). Only place it on `night` bands. Do NOT put it on light (`tint`/`white`) cards — it won't read. Light empty-state cards use `tint.main` + `.grain` WITHOUT StudioWash.
- **Preserve heading levels and section text** the e2e relies on (`tests/e2e/storefront.spec.ts`): product page keeps an h1 title and h3 product-card headings; listing keeps an h1; "warranty" text stays present on product pages.
- Preserve ALL existing behavior: Payload queries, JSON-LD scripts, breadcrumbs, filters, `ProductDetailActions`, `ChatAboutLaptop`, store logic in `SavedLaptopsView` (`fetchLaptopsByIds`, hydration gate, id-order preservation, `clear`). NOTE: the chat merge changed several product components (`ChatAboutLaptop`, `WhatsAppCallout`, `AddonsSection`) — re-read the current file before editing; do not assume old line numbers.
- `PageHero`, `SectionBand`, `StudioWash` MUST be presentational — no hooks, no data, no `'use client'` — so they work in both server and client pages.
- Sticky buy-panel desktop offset: navbar is `AppBar position="fixed"` with `Toolbar minHeight: 80` (`src/components/TopNavBar.tsx`); the layout wraps content in `Box sx={{ pt: 10 }}` (80px). Sticky `top` = `96` (80 + 16 breathing room).
- Gate every task on: source typecheck clean via `rm -rf .next/types && pnpm typecheck 2>&1 | grep "error TS"` (expect zero lines — stale `.next/types/app/admin/*` are pre-existing noise, not yours), no NEW lint in touched files (`pnpm lint 2>&1 | grep -i <file>` empty; ~21 pre-existing lint issues elsewhere are out of scope), and `pnpm test` stays green (**currently 85 passing** after the chat merge). Visual tasks additionally verified via the running dev server + screenshot.
- Reduced-motion: rely on existing `Reveal` (already guards `prefers-reduced-motion`) and theme button transitions; add no unguarded motion.

---

## File Structure

**New files:**
- `src/components/StudioWash.tsx` — the four radial-diffusion `Box`es + top bloom, extracted from `HeroSection`. One responsibility: render the frosted-studio glow layer.
- `src/components/PageHero.tsx` — full-bleed tinted+grain band with `StudioWash`, holding title/subtitle/breadcrumb/actions slots.
- `src/components/SectionBand.tsx` — full-bleed alternating-background section wrapper (`white`/`grey`/`tint`, optional grain) with inner `Container`.

**Modified files:**
- `src/components/HeroSection.tsx` — replace inline wash markup with `<StudioWash />` (behavior unchanged).
- `src/app/(storefront)/laptops/[slug]/page.tsx` — tinted hero band + sticky buy panel + `SectionBand` body sections.
- `src/app/(storefront)/laptops/page.tsx` — `PageHero` + `SectionBand` + staggered `Reveal` grid + tinted empty state.
- `src/components/SavedLaptopsView.tsx` — `PageHero` + tinted `.grain` empty state (compare + wishlist).

---

### Task 1: Extract `StudioWash` and adopt it in `HeroSection` — ✅ DONE (`0a2aff2`)

> Completed and re-derived during the rebase onto origin/main. `StudioWash` now
> holds the **dark-hero wash** (red glows on near-black): left warm-red
> `rgba(225,35,42,0.22)`, right milky `rgba(255,255,255,0.05)`, top bloom
> `rgba(255,255,255,0.06)`, bottom red `rgba(225,35,42,0.10)`. `HeroSection`
> renders it inside its `night.main` band. Homepage verified. The code below is
> the original (light-wash) version, superseded — do not re-run this task.

Extract the hero's radial-diffusion wash so `HeroSection` and `PageHero` render the identical glow. Refactor-in-place; `HeroSection`'s rendered output must be unchanged.

**Files:**
- Create: `src/components/StudioWash.tsx`
- Modify: `src/components/HeroSection.tsx:17-53` (replace inline wash `Box`es)
- Verify against: `src/app/globals.css` (`.grain`), `tests/e2e/storefront.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `export function StudioWash(): JSX.Element` — an `aria-hidden` absolutely-positioned layer (`position:absolute; inset:0; pointerEvents:none`) containing the four diffusion boxes. Caller must place it inside a `position:relative` container.

- [ ] **Step 1: Create `StudioWash.tsx`** with the exact four diffusion boxes currently inline in `HeroSection` (lines 20–53): the wrapping `Box aria-hidden sx={{ position:'absolute', inset:0, pointerEvents:'none' }}` containing left warm-red diffusion, right cool milky diffusion, top white bloom, and bottom red-tint deepen. Copy the `sx` values verbatim.

```tsx
import Box from '@mui/material/Box';

/**
 * Frosted "studio" glow layer used on tinted hero bands. Renders an
 * aria-hidden, absolutely-positioned diffusion wash. Place inside a
 * position:relative container (the tinted band).
 */
export function StudioWash() {
  return (
    <Box aria-hidden sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <Box sx={{
        position: 'absolute', left: '-15%', top: '10%', width: '55%', height: '90%',
        background: 'radial-gradient(60% 55% at 55% 45%, rgba(255,215,210,0.85) 0%, rgba(255,215,210,0.45) 35%, rgba(255,215,210,0) 72%)',
        filter: 'blur(40px)', borderRadius: '50%', transform: 'rotate(-8deg)',
      }} />
      <Box sx={{
        position: 'absolute', right: '-18%', top: '20%', width: '58%', height: '92%',
        background: 'radial-gradient(58% 52% at 42% 50%, rgba(250,240,240,0.9) 0%, rgba(250,240,240,0.5) 32%, rgba(250,240,240,0) 72%)',
        filter: 'blur(44px)', borderRadius: '50%', transform: 'rotate(10deg)',
      }} />
      <Box sx={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(70% 40% at 50% 0%, rgba(255,255,255,0.85), transparent 70%)',
      }} />
      <Box sx={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(80% 40% at 50% 100%, rgba(225,35,42,0.06), transparent 70%)',
      }} />
    </Box>
  );
}
```

- [ ] **Step 2: Replace the inline wash in `HeroSection.tsx`** — delete lines 20–53 (the `aria-hidden` wash block and its four children) and render `<StudioWash />` in their place, immediately after the opening `<Box className="grain" ...>`. Add `import { StudioWash } from '@/components/StudioWash';`.

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS, no errors.

- [ ] **Step 4: Verify hero renders identically.** Ensure dev server running (`preview_start {name:'jaysmart-dev'}`), navigate to `/`, screenshot the hero. Confirm the glow/laptop look unchanged vs. before.

- [ ] **Step 5: Run test suite**

Run: `pnpm test`
Expected: 58 passed (no regressions).

- [ ] **Step 6: Commit**

```bash
git add src/components/StudioWash.tsx src/components/HeroSection.tsx
git commit -m "refactor: extract StudioWash glow layer from HeroSection"
```

---

### Task 2: Add `SectionBand` wrapper — ✅ DONE (`57e8108`)

> Completed and survived the rebase clean. Three tones (`white`/`grey`/`tint`);
> the dark hero band is `PageHero`'s responsibility, so no `night` tone here. Do
> not re-run.


**Files:**
- Create: `src/components/SectionBand.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces:
```ts
export type SectionTone = 'white' | 'grey' | 'tint';
export function SectionBand(props: {
  tone?: SectionTone;               // default 'white'
  grain?: boolean;                  // default: true when tone !== 'white'
  py?: { xs: number; md: number };  // default { xs: 6, md: 8 }
  maxWidth?: 'lg' | false;          // default 'lg'; false = no inner Container
  children: React.ReactNode;
  id?: string;
}): JSX.Element;
```

- [ ] **Step 1: Create `SectionBand.tsx`.**

```tsx
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import type { ReactNode } from 'react';

export type SectionTone = 'white' | 'grey' | 'tint';

const BG: Record<SectionTone, string> = {
  white: 'background.paper',
  grey: 'grey.50',
  tint: 'tint.main',
};

/** Full-bleed section band with alternating background + optional grain. */
export function SectionBand({
  tone = 'white',
  grain,
  py = { xs: 6, md: 8 },
  maxWidth = 'lg',
  children,
  id,
}: {
  tone?: SectionTone;
  grain?: boolean;
  py?: { xs: number; md: number };
  maxWidth?: 'lg' | false;
  children: ReactNode;
  id?: string;
}) {
  const showGrain = grain ?? tone !== 'white';
  return (
    <Box id={id} className={showGrain ? 'grain' : undefined} sx={{ bgcolor: BG[tone], py }}>
      {maxWidth === false ? children : <Container maxWidth={maxWidth}>{children}</Container>}
    </Box>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/SectionBand.tsx
git commit -m "feat: add SectionBand alternating-background wrapper"
```

---

### Task 3: Add `PageHero` band

**Files:**
- Create: `src/components/PageHero.tsx`

**Interfaces:**
- Consumes: `StudioWash` (Task 1).
- Produces:
```ts
export function PageHero(props: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  breadcrumb?: React.ReactNode;  // above title
  actions?: React.ReactNode;     // right of title on desktop, below on mobile
  children?: React.ReactNode;    // extra content inside the band
}): JSX.Element;
```

- [ ] **Step 1: Create `PageHero.tsx`.** Dark `night`+grain full-bleed band with `StudioWash`, `Container maxWidth="lg"`, `py:{xs:5,md:8}`. Title uses `variant="h1"` (inherits `night.contrastText`). Subtitle uses muted light. Actions row sits opposite the title on desktop.

```tsx
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { StudioWash } from '@/components/StudioWash';

/** Homepage-style dark hero band for inner pages (matches the night hero). */
export function PageHero({
  title,
  subtitle,
  breadcrumb,
  actions,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Box className="grain" sx={{ position: 'relative', bgcolor: 'night.main', color: 'night.contrastText', overflow: 'hidden' }}>
      <StudioWash />
      <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 5, md: 8 } }}>
        {breadcrumb && <Box sx={{ mb: 2 }}>{breadcrumb}</Box>}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
          spacing={2}
        >
          <Stack spacing={1}>
            <Typography variant="h1">{title}</Typography>
            {subtitle && (
              <Typography variant="body1" sx={{ color: 'rgba(244,242,238,0.75)' }}>{subtitle}</Typography>
            )}
          </Stack>
          {actions && <Box>{actions}</Box>}
        </Stack>
        {children}
      </Container>
    </Box>
  );
}
```

- [ ] **Step 2: Typecheck + lint (stale-cache-aware)**

Run: `rm -rf .next/types && pnpm typecheck 2>&1 | grep "error TS"` — expect zero lines.
Run: `pnpm lint 2>&1 | grep -i PageHero` — expect zero lines.

- [ ] **Step 3: Commit**

```bash
git add src/components/PageHero.tsx
git commit -m "feat: add PageHero dark hero band"
```

---

### Task 4: Redesign laptops listing page (`/laptops`)

Swap the plain title stack for `PageHero`; wrap the filters+grid in a white `SectionBand`; stagger cards with `Reveal`; tint the empty state. Preserve the query logic and the h1 + h3-card headings the e2e checks.

**Files:**
- Modify: `src/app/(storefront)/laptops/page.tsx:67-95`
- Consumes: `PageHero` (Task 3), `SectionBand` (Task 2), existing `Reveal`, `ProductCard`, `LaptopFilters`.

- [ ] **Step 1: Rewrite the returned JSX** of `LaptopsPage`. Keep everything above `return` (query building, `Promise.all`, `whatsappNumber`, `breadcrumb`) unchanged. Replace the `<Container>…</Container>` return body with:

```tsx
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <PageHero
        title="Shop UK used laptops"
        subtitle={
          <>
            <Box component="span" className="num" sx={{ color: 'night.contrastText', fontWeight: 700 }}>
              {laptopsRes.totalDocs}
            </Box>{' '}in stock
          </>
        }
      />
      <SectionBand tone="white">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 3 }}>
            <LaptopFilters brands={brandsRes.docs} useCases={useCasesRes.docs} />
          </Grid>
          <Grid size={{ xs: 12, md: 9 }}>
            {laptopsRes.docs.length === 0 ? (
              <Box className="grain" sx={{
                position: 'relative', overflow: 'hidden', bgcolor: 'tint.main',
                borderRadius: 2, textAlign: 'center', py: { xs: 6, md: 10 }, px: 3,
              }}>
                {/* NOTE: no <StudioWash /> here — that wash is dark-on-black and
                    won't read on this light tint card. Plain tint + grain only. */}
                <Stack spacing={2} sx={{ position: 'relative', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    No laptops match those filters. Try clearing one.
                  </Typography>
                  <Button variant="contained" component={Link} href="/laptops">Clear filters</Button>
                </Stack>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {laptopsRes.docs.map((laptop, i) => (
                  <Grid key={laptop.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Reveal delay={i * 60}>
                      <ProductCard laptop={laptop} whatsappNumber={whatsappNumber} />
                    </Reveal>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      </SectionBand>
    </>
  );
```

- [ ] **Step 2: Update imports** at the top of the file: add `import Link from 'next/link';` (if absent), `import Button from '@mui/material/Button';`, `import { PageHero } from '@/components/PageHero';`, `import { SectionBand } from '@/components/SectionBand';`, `import { Reveal } from '@/components/Reveal';`. Do NOT import `StudioWash` here (the empty state no longer uses it). Remove now-unused `Container`/`Stack`/`Typography` imports only if truly unused (lint will flag).

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS (fix any unused-import lint errors by removing them).

- [ ] **Step 4: Visual verify.** Dev server up; navigate to `/laptops`. Screenshot. Confirm: tinted PageHero with "N in stock", filters sidebar, grid of cards revealing in. Navigate to `/laptops?brand=nonexistent` or a filter with no results to confirm the tinted empty state (or temporarily hit a query returning zero). Confirm h1 present and card headings are h3 (`read_page`).

- [ ] **Step 5: Run test suite**

Run: `pnpm test`
Expected: 58 passed.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(storefront)/laptops/page.tsx"
git commit -m "feat: redesign laptops listing with homepage design system"
```

---

### Task 5: Redesign product detail page (`/laptops/[slug]`) — dark hero band + sticky buy panel

Wrap breadcrumb + hero split in a **dark `night` studio band**; gallery + title sit on the dark band with light text; the whole buy panel sits on ONE white paper card (so its existing light-mode children — StockPill, TrustBox, actions — render correctly against the dark band). Add a floating shadow under the gallery; make the buy panel sticky on desktop. Body sections handled in Task 6.

**Files:**
- Modify: `src/app/(storefront)/laptops/[slug]/page.tsx` (hero region — RE-READ current file first; the chat merge changed line numbers and `ChatAboutLaptop`)
- Consumes: `StudioWash` (Task 1), existing `LaptopGallery`, `ConditionBadge`, buy-panel components.

**IMPORTANT — re-read before editing:** The chat merge modified this page and `ChatAboutLaptop`. Open the current file and confirm the exact JSX/props of the hero region and `ChatAboutLaptop`/`ProductDetailActions` usage. Preserve those props exactly; only restructure the surrounding layout as shown.

- [ ] **Step 1: Replace the outer `<Container>` opening + breadcrumb + hero `<Grid>`** (keep the two JSON-LD `<script>` tags). Wrap breadcrumb and hero split in a **dark `night.main` `.grain` band with `StudioWash`**; breadcrumb + title text are light; the buy panel is one paper card. Keep the existing body-sections `<Stack>` but move it out of the band (see Task 6). Structure:

```tsx
  return (
    <>
      <script key="product-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script key="breadcrumb-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Hero band — dark studio wash (matches homepage night hero) */}
      <Box className="grain" sx={{ position: 'relative', bgcolor: 'night.main', color: 'night.contrastText', overflow: 'hidden' }}>
        <StudioWash />
        <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 4, md: 8 } }}>
          <Breadcrumbs sx={{ mb: 3, color: 'rgba(244,242,238,0.6)', '& a': { color: 'rgba(244,242,238,0.85)' } }}>
            <Link href="/">Home</Link>
            <Link href="/laptops">Laptops</Link>
            <Typography sx={{ color: 'night.contrastText' }}>{laptop.title}</Typography>
          </Breadcrumbs>
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 7 }}>
              <Box sx={{ position: 'relative' }}>
                {/* floating ground shadow under the gallery (dark-appropriate) */}
                <Box aria-hidden sx={{
                  position: 'absolute', left: '12%', right: '12%', bottom: -8, height: 26,
                  background: 'radial-gradient(50% 100% at 50% 50%, rgba(0,0,0,0.5), transparent 70%)',
                  filter: 'blur(8px)', zIndex: 0,
                }} />
                <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 2 }}>
                  <ConditionBadge condition={laptop.condition} />
                </Box>
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <LaptopGallery images={gallery} />
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ position: { md: 'sticky' }, top: { md: 96 } }}>
                {/* Title + subtitle sit on the dark band with light text */}
                <Stack spacing={1} sx={{ mb: 3 }}>
                  <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 40 }, letterSpacing: '-0.025em' }}>{laptop.title}</Typography>
                  {subtitle && <Typography variant="h3" sx={{ fontWeight: 500, color: 'rgba(244,242,238,0.75)' }}>{subtitle}</Typography>}
                </Stack>
                {/* Whole buy panel on ONE paper card so its light-mode children read on the dark band */}
                <Box sx={{ bgcolor: 'background.paper', color: 'text.primary', border: 1, borderColor: 'divider', borderRadius: 2.5, p: { xs: 2.5, md: 3 } }}>
                  <Stack spacing={2.5}>
                    <Stack direction="row" spacing={2} alignItems="baseline">
                      <Typography className="num" sx={{ color: 'primary.main', fontSize: { xs: 32, md: 40 }, fontWeight: 700, lineHeight: 1 }}>
                        {formatNaira(laptop.price)}
                      </Typography>
                      {laptop.compareAtPrice && (
                        <Typography className="num" sx={{ color: 'text.secondary', textDecoration: 'line-through', fontSize: 15 }}>
                          {formatNaira(laptop.compareAtPrice)}
                        </Typography>
                      )}
                    </Stack>
                    <StockPill stock={laptop.stock} />
                    <TrustBox batteryHealth={laptop.specs?.batteryHealth} />
                    <Stack spacing={1.5}>
                      <ChatAboutLaptop id={laptop.id} title={laptop.title} price={laptop.price} url={url} disabled={laptop.stock === 0} />
                    </Stack>
                    <ProductDetailActions laptopId={laptop.id} />
                    {/* checkout note — already inside the paper card, so a plain tinted strip */}
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="caption">
                        Note: online checkout is coming soon. For now, tap <strong>Chat with us</strong> to place your order.
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* body sections — Task 6 fills this in */}
      {/* KeySpecs / Description / Addons / CompareCallout / RelatedProducts / WhatsAppCallout */}
    </>
  );
```

- [ ] **Step 2: Add imports** `import { StudioWash } from '@/components/StudioWash';` (verify Box, Container, Grid, Stack, Typography, Breadcrumbs, Link are imported — add any missing).

- [ ] **Step 3: Temporarily keep body sections** rendering (paste the existing `KeySpecs → … → WhatsAppCallout` block from the current file into the "body sections" placeholder wrapped in a plain `<Container maxWidth="lg" sx={{ py: {xs:6, md:8} }}><Stack spacing={{xs:6,md:8}}>…</Stack></Container>`) so the page is complete and testable at the end of this task. Task 6 restyles it into bands.

- [ ] **Step 4: Typecheck + lint (stale-cache-aware)**

Run: `rm -rf .next/types && pnpm typecheck 2>&1 | grep "error TS"` — expect zero lines.
Run: `pnpm lint 2>&1 | grep -i "slug/page"` — expect zero lines.

- [ ] **Step 5: Visual verify.** Navigate to a real product URL (from `/laptops`, click a card). Screenshot desktop. Confirm: **dark `night` studio hero** with light title/breadcrumb text, gallery with floating shadow, condition badge, the white buy-panel card holding price/stock/trust/actions (all legible), "warranty"/trust text present. Scroll and confirm the buy panel sticks below the navbar on desktop. Resize to mobile (`resize_window` preset mobile), reload, confirm single-column and panel NOT sticky-overlapping.

- [ ] **Step 6: Run test suite**

Run: `pnpm test`
Expected: 85 passed.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(storefront)/laptops/[slug]/page.tsx"
git commit -m "feat: redesign product hero with dark studio band and sticky buy panel"
```

---

### Task 6: Product detail — body sections into alternating bands

Restyle the body (KeySpecs → Description → Add-ons → CompareCallout → RelatedProducts → WhatsAppCallout) into alternating `SectionBand`s with `SectionHeading`s and `Reveal`, replacing the Task-5 placeholder container.

**Files:**
- Modify: `src/app/(storefront)/laptops/[slug]/page.tsx` (body-sections region from Task 5)
- Consumes: `SectionBand` (Task 2), existing `Reveal`, `SectionHeading`, `KeySpecs`, `AddonsSection`, `CompareCallout`, `RelatedProducts`, `WhatsAppCallout`, `RichText`.

- [ ] **Step 1: Replace the placeholder body container** with alternating bands. Each visual section becomes a `SectionBand` wrapping a `Reveal`. Description keeps its `Paper`. Assign tones for rhythm: KeySpecs `white` → Description `grey` → Add-ons `white` → CompareCallout `tint` → Related `white` → WhatsApp `grey`.

```tsx
      <SectionBand tone="white">
        <Reveal><KeySpecs laptop={laptop} /></Reveal>
      </SectionBand>

      {laptop.description && (
        <SectionBand tone="grey">
          <Reveal>
            <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h2" sx={{ mb: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                Product Description
              </Typography>
              <RichText data={laptop.description} />
            </Paper>
          </Reveal>
        </SectionBand>
      )}

      <SectionBand tone="white">
        <Reveal>
          <AddonsSection addons={addons} whatsappNumber={whatsappNumber}
            laptopTitle={laptop.title} laptopPrice={laptop.price} url={url} />
        </Reveal>
      </SectionBand>

      <SectionBand tone="tint">
        <Reveal><CompareCallout /></Reveal>
      </SectionBand>

      <SectionBand tone="white">
        <Reveal><RelatedProducts laptops={related} whatsappNumber={whatsappNumber} /></Reveal>
      </SectionBand>

      <SectionBand tone="grey">
        <Reveal><WhatsAppCallout href={waHref} /></Reveal>
      </SectionBand>
```

- [ ] **Step 2: Remove** the now-unused placeholder `<Container>`/`<Stack spacing>` wrapper and any imports left unused (lint will flag `Container`/`Stack` if no longer used elsewhere on the page — keep them if the hero band still uses them; it does).

- [ ] **Step 3: Typecheck + lint (stale-cache-aware)**

Run: `rm -rf .next/types && pnpm typecheck 2>&1 | grep "error TS"` — expect zero lines.
Run: `pnpm lint 2>&1 | grep -i "slug/page"` — expect zero lines.

- [ ] **Step 4: Visual verify.** Reload the product page. Screenshot full page (scroll). Confirm alternating white/grey/tint bands below the dark hero, each body section revealing in, Related products grid intact, add-ons and callouts functional. Confirm `RelatedProducts` card headings still h3 (read_page).

- [ ] **Step 5: Run test suite**

Run: `pnpm test`
Expected: 85 passed.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(storefront)/laptops/[slug]/page.tsx"
git commit -m "feat: lay product body sections into alternating design-system bands"
```

---

### Task 7: Redesign Compare + Wishlist (`SavedLaptopsView`)

One client component covers both `/compare` and `/wishlist`. Add `PageHero` (dark band) + `tint.main` `.grain` empty state (NO StudioWash — dark wash won't read on the light card); keep ALL store behavior.

**Files:**
- Modify: `src/components/SavedLaptopsView.tsx` (RE-READ current file first; the chat merge may have touched it)
- Consumes: `PageHero` (Task 3), `SectionBand` (Task 2), existing store logic, `ProductCard`. (Not StudioWash.)

- [ ] **Step 1: Rewrite the returned JSX** of `SavedLaptopsView`. Keep everything above `return` unchanged (store, `loading`, `laptops`, `title`, `emptyMsg`). Add a mode-specific subtitle. Replace the body:

```tsx
  const subtitle =
    mode === 'wishlist'
      ? 'Laptops you saved. Tap a card to view, or clear them all.'
      : 'Line up laptops side by side before you decide.';

  return (
    <>
      <PageHero
        title={title}
        subtitle={subtitle}
        actions={ids.length > 0 ? <Button onClick={clear} color="inherit">Clear all</Button> : undefined}
      />
      <SectionBand tone="white">
        {!store.isHydrated || loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : laptops.length === 0 ? (
          <Box className="grain" sx={{
            position: 'relative', overflow: 'hidden', bgcolor: 'tint.main',
            borderRadius: 2, py: { xs: 6, md: 10 }, px: 3, textAlign: 'center',
          }}>
            {/* NO <StudioWash /> — dark-on-black wash won't read on this light card */}
            <Stack spacing={3} sx={{ position: 'relative', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>{emptyMsg}</Typography>
              <Button variant="contained" color="primary" component={Link} href="/laptops">Browse laptops</Button>
            </Stack>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {laptops.map((laptop, i) => (
              <Grid key={laptop.id} size={{ xs: 12, sm: 6, lg: mode === 'compare' ? 3 : 4 }}>
                <Reveal delay={i * 60}>
                  <ProductCard laptop={laptop} whatsappNumber={whatsappNumber} />
                </Reveal>
              </Grid>
            ))}
          </Grid>
        )}
      </SectionBand>
    </>
  );
```

- [ ] **Step 2: Update imports** — add `import { PageHero } from '@/components/PageHero';`, `import { SectionBand } from '@/components/SectionBand';`, `import { Reveal } from '@/components/Reveal';`. Do NOT import `StudioWash` (the empty state doesn't use it). Remove now-unused `Container` import (the old top-level `<Container>` is gone; `SectionBand` provides it). Keep `Box`, `Button`, `Grid`, `Stack`, `Typography`, `CircularProgress`, `Link`.

- [ ] **Step 3: Typecheck + lint (stale-cache-aware)**

Run: `rm -rf .next/types && pnpm typecheck 2>&1 | grep "error TS"` — expect zero lines.
Run: `pnpm lint 2>&1 | grep -i SavedLaptopsView` — expect zero lines.

- [ ] **Step 4: Visual verify — empty states.** With an empty store: navigate to `/wishlist` and `/compare`, screenshot each. Confirm the **dark `night` PageHero** + light `tint` `.grain` empty card + "Browse laptops" CTA. Then add items (from `/laptops`, tap heart + compare icons on a couple cards), revisit both pages, confirm the grid + "Clear all" action, and that "Clear all" empties them.

- [ ] **Step 5: Run test suite**

Run: `pnpm test`
Expected: 85 passed.

- [ ] **Step 6: Commit**

```bash
git add src/components/SavedLaptopsView.tsx
git commit -m "feat: redesign compare and wishlist with homepage design system"
```

---

### Task 8: Full cross-page verification + e2e

Confirm the four pages cohere and nothing regressed.

**Files:** none (verification only).

- [ ] **Step 1: Typecheck + lint (source, stale-cache-aware)**

Run: `rm -rf .next/types && pnpm typecheck 2>&1 | grep "error TS"` — expect zero lines.
Run: `pnpm lint 2>&1 | grep -iE "PageHero|SectionBand|StudioWash|SavedLaptopsView|storefront"` — expect zero NEW issues in redesigned files.

- [ ] **Step 2: Unit/integration suite**

Run: `pnpm test`
Expected: 85 passed.

- [ ] **Step 3: e2e (needs dev server + DB).** Ensure dev server is up. Run: `pnpm test:e2e`. Expected: storefront spec passes. If a homepage heading assertion in `tests/e2e/storefront.spec.ts` fails on hero copy mismatch (the spec text vs the current "Buy Tested UK Used Laptops" hero), note it — it is a PRE-EXISTING mismatch NOT introduced by this redesign. Do not "fix" it by changing hero copy; flag it to the user separately.

- [ ] **Step 4: Visual sweep.** Screenshot `/laptops`, a product page, `/compare`, `/wishlist` at desktop and mobile widths. Confirm all four open on the **dark `night` PageHero** matching the homepage, share the light content bands, SectionHeadings/Reveal, and that prices render with matching ₦ size. Send screenshots to the user.

- [ ] **Step 5: Final commit (if any lint/tsc touch-ups)** and push branch.

```bash
git push -u origin redesign-storefront-homepage-system
```

---

## Self-Review

**Spec coverage:**
- Shared foundations `PageHero`/`SectionBand`/`StudioWash` → Tasks 1–3. ✅
- Product detail hero band + floating shadow + sticky buy panel → Task 5. ✅
- Product detail body alternating bands + SectionHeading/Reveal → Task 6. ✅
- Laptops listing PageHero + filters band + staggered grid + tinted empty state → Task 4. ✅
- Compare + Wishlist (one component) PageHero + tinted empty state, store untouched → Task 7. ✅
- Preserve queries/JSON-LD/breadcrumbs/filters/store → constraints + preserved verbatim in each task. ✅
- Cross-page + e2e verification → Task 8. ✅

**Placeholder scan:** No TBD/TODO. Task 5's "body sections" placeholder is an explicit, described interim step completed within the same task (Step 3) and superseded in Task 6 — not an unfilled gap. Sticky offset is a concrete `96`. Empty-state trigger for listing noted concretely (filter with no results). ✅

**Type consistency:** `SectionBand` props (`tone`/`grain`/`py`/`maxWidth`) used consistently in Tasks 4/6/7. `PageHero` props (`title`/`subtitle`/`breadcrumb`/`actions`/`children`) match usage in Tasks 4/7. `StudioWash()` no-arg, placed inside `position:relative` containers everywhere. ✅

**Testing approach note:** This codebase has no presentational-component unit tests; UI is verified via typecheck, lint, the existing vitest suite (must stay green), the Playwright storefront e2e, and browser screenshots. The plan uses those real gates rather than inventing brittle `sx`-snapshot tests — consistent with the repo's conventions.
