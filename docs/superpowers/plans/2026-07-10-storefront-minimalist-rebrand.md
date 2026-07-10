# Storefront Minimalist Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Jaysmart storefront to feel like the minimalist Payload admin — white surfaces, hairline borders, generous whitespace — recolored around the logo's red, with the logo wired into the nav and footer.

**Architecture:** The storefront is theme-driven MUI. Task 1 rewrites `src/lib/theme.ts` (the single source of color/spacing truth) so every page inherits the new palette and flatter surface language. Tasks 2–6 then do a page-by-page pass replacing hardcoded `grey.*` fills and `boxShadow` with hairline borders, repointing WhatsApp buttons to a new green `success` palette, and adding the logo.

**Tech Stack:** Next.js (App Router, custom build — read `node_modules/next/dist/docs/` before non-trivial Next work), Payload CMS, MUI v6/Grid2, `next/image`, `next/font` (Inter).

## Global Constraints

- Brand red (primary): `#E1232A`. Near-black (secondary): `#1A1A1A`. WhatsApp green (success): `#25D366`. Text primary `#111111`, secondary `#6B6B6B`. Background `#FFFFFF`. Divider `#EAEAEA`.
- **WhatsApp buttons/links stay green** — every WhatsApp CTA must reference `success.main`/`success.dark`, NOT `secondary`.
- Prefer hairline `1px solid` + `borderColor: 'divider'` over `boxShadow`/elevation on surfaces.
- All color must go through theme tokens (`primary`, `secondary`, `success`, `text.*`, `divider`, `background.*`). No new hardcoded hex in components.
- Storefront only — do NOT touch `src/app/(payload)` or `src/components/admin/*`.
- Verification is browser-based (preview tools), not unit tests. Each task ends by visually confirming the change and committing.
- This work is in the `phase-1-foundation` worktree at `/Users/mac/Documents/Vscode/jaysmart/worktrees/phase-1-foundation`.

## File Structure

- `src/lib/theme.ts` — MUI theme; palette, typography, surface defaults (Task 1).
- `src/components/TopNavBar.tsx`, `Footer.tsx`, `TrustBanner.tsx` — global chrome + logo (Task 2).
- `src/app/(storefront)/page.tsx` + `HeroSection.tsx`, `CategoryCard.tsx`, `WhyBuyFromUs.tsx`, `Testimonials.tsx`, `CompareTeaser.tsx` — home (Task 3).
- `src/app/(storefront)/laptops/page.tsx` + `LaptopFilters.tsx`, `ProductCard.tsx`, `ProductCardActions.tsx` — list (Task 4).
- `src/app/(storefront)/laptops/[slug]/page.tsx` + `LaptopGallery.tsx`, `LaptopSpecsTable.tsx`, `ProductDetailActions.tsx`, `product/*` — detail (Task 5).
- `src/app/(storefront)/compare/page.tsx`, `wishlist/page.tsx`, `not-found.tsx`, `SavedLaptopsView.tsx` — remaining pages (Task 6).

---

## Task 1: Rewrite the MUI theme

**Files:**
- Modify: `src/lib/theme.ts`

**Interfaces:**
- Produces: theme palette tokens `primary.main` (`#E1232A`), `secondary.main` (`#1A1A1A`), `success.main` (`#25D366`), `text.primary`/`text.secondary`, `background.default` (`#FFFFFF`), `divider` (`#EAEAEA`). Later tasks reference these tokens by name (`success.main` for WhatsApp, `divider` for hairlines).

- [ ] **Step 1: Rewrite the theme file**

Replace the whole file with:

```tsx
'use client';

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: { main: '#E1232A', contrastText: '#ffffff' },
    secondary: { main: '#1A1A1A', contrastText: '#ffffff' },
    success: { main: '#25D366', contrastText: '#ffffff' }, // WhatsApp green
    error: { main: '#ba1a1a', contrastText: '#ffffff' },
    background: { default: '#ffffff', paper: '#ffffff' },
    text: { primary: '#111111', secondary: '#6B6B6B' },
    divider: '#EAEAEA',
    grey: { 50: '#FAFAFA', 100: '#F7F7F7' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
    h1: { fontSize: '48px', lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: 700 },
    h2: { fontSize: '24px', lineHeight: '32px', fontWeight: 700 },
    h3: { fontSize: '20px', lineHeight: '28px', fontWeight: 700 },
    body1: { fontSize: '18px', lineHeight: '28px', fontWeight: 400 },
    body2: { fontSize: '16px', lineHeight: '24px', fontWeight: 400 },
    caption: { fontSize: '14px', lineHeight: '20px', fontWeight: 400 },
    button: { fontSize: '12px', lineHeight: '16px', letterSpacing: '0.05em', fontWeight: 700, textTransform: 'uppercase' },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, paddingBlock: 12, paddingInline: 24, boxShadow: 'none' },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined', elevation: 0 },
      styleOverrides: {
        root: { borderColor: '#EAEAEA', boxShadow: 'none' },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
  },
});
```

- [ ] **Step 2: Start the dev server and verify it builds**

Use the preview tools: `preview_start` (create `.claude/launch.json` with the dev command + port if absent), then `preview_logs` (level error) — Expected: no build/compile errors.

- [ ] **Step 3: Verify primary color changed**

Load the home page, then `preview_inspect` a primary contained button (e.g. the hero "Browse all laptops" button) for `background-color`. Expected: `rgb(225, 35, 42)` (`#E1232A`), NOT the old blue.

- [ ] **Step 4: Commit**

```bash
git add src/lib/theme.ts
git commit -m "feat(theme): recolor storefront to logo red on white, flatten surfaces"
```

---

## Task 2: Global chrome + logo (nav, trust banner, footer)

**Files:**
- Modify: `src/components/TopNavBar.tsx`
- Modify: `src/components/TrustBanner.tsx`
- Modify: `src/components/Footer.tsx`

**Interfaces:**
- Consumes: theme tokens from Task 1 (`primary`, `divider`, `grey.100`).
- Public asset: `/logo.jpg` (2560×2560, white background) — already committed.

- [ ] **Step 1: Add the logo to the nav brand in `TopNavBar.tsx`**

Add `import Image from 'next/image';` near the other imports. Replace the brand `<Typography ...>Certified Preowned Laptops</Typography>` block with the logo image linking home:

```tsx
<Box component={Link} href="/" sx={{ display: 'inline-flex', alignItems: 'center', lineHeight: 0 }} aria-label="Jaysmart home">
  <Image src="/logo.jpg" alt="Jaysmart Global Ventures" width={40} height={40} priority
    style={{ height: 40, width: 'auto' }} />
</Box>
```

(`Box` is already imported.)

- [ ] **Step 2: Neutralize the TrustBanner fill**

In `TrustBanner.tsx`, the banner currently sits on `grey.100` with everything in `primary.main` (now red — too loud). Change the wrapper `Box` `bgcolor` from `'grey.100'` to `'grey.50'`, and change the item icon/label color from `'primary.main'` to `'text.secondary'` (keep only the border as separation). Concretely:
- `<Box sx={{ bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider', py: 1.5 }}>`
- `<Box sx={{ color: 'text.secondary' }}>{item.icon}</Box>`
- `<Typography variant="button" sx={{ color: 'text.secondary' }}>{item.label}</Typography>`

- [ ] **Step 3: Update the Footer — logo + hairline + hover color**

In `Footer.tsx`:
- Add `import Image from 'next/image';`.
- Change the footer wrapper from `bgcolor: 'grey.100'` to a white background with a top hairline: `<Box component="footer" sx={{ bgcolor: 'background.default', borderTop: 1, borderColor: 'divider', mt: 8, py: 6 }}>`.
- Replace the `<Typography variant="h3" ...>Certified Preowned Laptops</Typography>` brand line with:

```tsx
<Box sx={{ mb: 2, lineHeight: 0 }}>
  <Image src="/logo.jpg" alt="Jaysmart Global Ventures" width={32} height={32} style={{ height: 32, width: 'auto' }} />
</Box>
```

- Change every link hover from `'&:hover': { color: 'secondary.main' }` to `'&:hover': { color: 'primary.main' }` (there are several; `secondary` is now near-black, so red hover reads better). Use replace-all on the exact string `'&:hover': { color: 'secondary.main' }` → `'&:hover': { color: 'primary.main' }` within this file.

- [ ] **Step 4: Verify in the browser**

Reload the page. `preview_screenshot` the top of the home page — Expected: logo visible in the nav, trust banner is quiet gray (not red), no shadow under the app bar (hairline only). Scroll to footer, `preview_screenshot` — Expected: white footer with a top hairline and the logo. `preview_console_logs` (level error) — Expected: no `next/image` errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/TopNavBar.tsx src/components/TrustBanner.tsx src/components/Footer.tsx
git commit -m "feat(chrome): add logo to nav/footer, neutralize trust banner, hairline footer"
```

---

## Task 3: Home page pass

**Files:**
- Modify: `src/app/(storefront)/page.tsx`
- Modify: `src/components/HeroSection.tsx`
- Modify: `src/components/CategoryCard.tsx`
- Modify: `src/components/WhyBuyFromUs.tsx`
- Modify: `src/components/Testimonials.tsx`
- Modify: `src/components/CompareTeaser.tsx`

**Interfaces:**
- Consumes: theme tokens (`success.main` for WhatsApp, `divider`, `grey.50/100`).

- [ ] **Step 1: Repoint the Hero WhatsApp button to green**

In `HeroSection.tsx`, the "WhatsApp us" button uses `sx={{ bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}`. Change to `sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}`. Also reduce the hero image container rounding from `borderRadius: 3` to `borderRadius: 2`.

- [ ] **Step 2: Flatten remaining home surfaces**

For each of `CategoryCard.tsx`, `WhyBuyFromUs.tsx`, `Testimonials.tsx`, `CompareTeaser.tsx`, and `page.tsx`: open the file and, for every occurrence, replace decorative fills and shadows to match the admin:
- `bgcolor: 'grey.100'` → `bgcolor: 'grey.50'` (or remove if the element already sits on white and a `1px solid divider` border gives enough separation — prefer a border over a fill for cards).
- Any `boxShadow: N` / `elevation={N>0}` on a Card/Paper → remove (Task 1 defaults Cards to outlined/flat; for `Paper` add `variant="outlined"` and `elevation={0}`).
- Any hover `boxShadow` (e.g. `'&:hover': { boxShadow: 3 }`) → replace with a border-color darken: `'&:hover': { borderColor: 'text.primary' }`.
- Increase top-level section vertical padding one step where present (e.g. `py: 6` → `py: 8`, `py: 8` → `py: 10`) so sections breathe. Do not change `Container maxWidth`.

Keep red for CTAs/active states only; body text stays `text.primary`/`text.secondary`.

- [ ] **Step 3: Verify the home page**

Reload. `preview_screenshot` the full home page. Expected: white sections with airy spacing, cards separated by hairline borders (no drop shadows), primary CTAs red, WhatsApp CTA green. `preview_inspect` the WhatsApp button `background-color` → Expected `rgb(37, 211, 102)` (`#25D366`). `preview_console_logs` (error) → none.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(storefront)/page.tsx" src/components/HeroSection.tsx src/components/CategoryCard.tsx src/components/WhyBuyFromUs.tsx src/components/Testimonials.tsx src/components/CompareTeaser.tsx
git commit -m "feat(home): whitespace + hairline pass, green WhatsApp CTA"
```

---

## Task 4: Laptops list page pass

**Files:**
- Modify: `src/app/(storefront)/laptops/page.tsx`
- Modify: `src/components/LaptopFilters.tsx`
- Modify: `src/components/ProductCard.tsx`
- Modify: `src/components/ProductCardActions.tsx`

**Interfaces:**
- Consumes: theme tokens; `ProductCard` already uses `variant="outlined"`.

- [ ] **Step 1: Fix ProductCard surface + WhatsApp button**

In `ProductCard.tsx`:
- Card hover: change `'&:hover': { boxShadow: 3 }` → `'&:hover': { borderColor: 'text.primary' }`.
- Image well: `bgcolor: 'grey.100'` → `bgcolor: 'grey.50'`.
- WhatsApp `IconButton`: change `sx={{ bgcolor: 'secondary.main', color: 'white', '&:hover': { bgcolor: 'secondary.dark' } }}` → `sx={{ bgcolor: 'success.main', color: 'white', '&:hover': { bgcolor: 'success.dark' } }}`.
- The price `<Typography variant="h2" sx={{ color: 'primary.main' }}>` now renders red — that is intended (price is the accent). Leave it.
- The condition chip `color="success"` now renders green and the discount chip `color="error"` renders dark red — both fine; leave them.

- [ ] **Step 2: Flatten filters + page surfaces**

In `LaptopFilters.tsx`, `ProductCardActions.tsx`, and `laptops/page.tsx`: apply the same rules as Task 3 Step 2 — `grey.100`→`grey.50` or border, remove `boxShadow`/elevation, hover-shadow→hover-border, and give the filter panel a `1px solid divider` border instead of any shadow. Bump the grid `spacing` one step if it currently looks cramped (e.g. `spacing={2}`→`spacing={3}`).

- [ ] **Step 3: Verify the list page**

Navigate to `/laptops`. `preview_screenshot`. Expected: product cards on white with hairline borders, red price, red "Buy now", green WhatsApp icon button, roomy grid gaps. `preview_resize` to mobile (375px) and screenshot — Expected: grid reflows cleanly, nav logo still fits. `preview_console_logs` (error) → none.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(storefront)/laptops/page.tsx" src/components/LaptopFilters.tsx src/components/ProductCard.tsx src/components/ProductCardActions.tsx
git commit -m "feat(list): flatten product cards + filters, green WhatsApp, roomier grid"
```

---

## Task 5: Laptop detail page pass

**Files:**
- Modify: `src/app/(storefront)/laptops/[slug]/page.tsx`
- Modify: `src/components/LaptopGallery.tsx`
- Modify: `src/components/LaptopSpecsTable.tsx`
- Modify: `src/components/ProductDetailActions.tsx`
- Modify: `src/components/product/TrustBox.tsx`, `KeySpecs.tsx`, `StockPill.tsx`, `ConditionBadge.tsx`, `AddonsSection.tsx`, `WhatsAppCallout.tsx`, `CompareCallout.tsx`, `RelatedProducts.tsx`

**Interfaces:**
- Consumes: theme tokens; WhatsApp usages must move to `success.*`.

- [ ] **Step 1: Repoint all detail-page WhatsApp usages to green**

In `[slug]/page.tsx`, `product/WhatsAppCallout.tsx`, `product/AddonsSection.tsx`, and `product/StockPill.tsx`, find every `secondary.main`/`secondary.dark` that belongs to a WhatsApp CTA (buttons/links whose href comes from `buildWhatsAppLink` or labeled WhatsApp) and change to `success.main`/`success.dark`. Leave any `secondary` used for non-WhatsApp neutral emphasis as-is (it's now near-black, which is fine on the detail page).

- [ ] **Step 2: Flatten detail surfaces**

Across `LaptopGallery.tsx`, `LaptopSpecsTable.tsx`, `ProductDetailActions.tsx`, all `product/*` files, and `[slug]/page.tsx`: apply Task 3 Step 2 rules — `grey.100`→`grey.50`/border, remove `boxShadow`/elevation, hover-shadow→hover-border, give boxed sections (TrustBox, AddonsSection, specs table container) a `1px solid divider` border instead of a fill/shadow. The gallery thumbnail strip and main image well go to `grey.50`.

- [ ] **Step 3: Verify the detail page**

Navigate to a laptop detail page (`/laptops/<any-slug>` — pick one from the list page). `preview_screenshot` full page. Expected: gallery on light gray, specs/trust boxes bordered not shadowed, red primary CTA, green WhatsApp CTA, prices red. `preview_inspect` any WhatsApp CTA → `rgb(37, 211, 102)`. `preview_console_logs` (error) → none.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(storefront)/laptops/[slug]/page.tsx" src/components/LaptopGallery.tsx src/components/LaptopSpecsTable.tsx src/components/ProductDetailActions.tsx src/components/product
git commit -m "feat(detail): flatten surfaces, green WhatsApp CTAs, whitespace pass"
```

---

## Task 6: Compare, wishlist, not-found

**Files:**
- Modify: `src/app/(storefront)/compare/page.tsx`
- Modify: `src/app/(storefront)/wishlist/page.tsx`
- Modify: `src/app/(storefront)/not-found.tsx`
- Modify: `src/components/SavedLaptopsView.tsx`

**Interfaces:**
- Consumes: theme tokens.

- [ ] **Step 1: Apply the surface pass to remaining pages**

For each file, apply Task 3 Step 2 rules — `grey.100`→`grey.50`/border, remove `boxShadow`/elevation, hover-shadow→hover-border, WhatsApp usages (if any) → `success.*`. Ensure the not-found page's CTA is a red primary button and page vertical padding is generous.

- [ ] **Step 2: Verify each page**

Navigate to `/compare`, `/wishlist`, and a bad URL (e.g. `/laptops/does-not-exist` or `/nope`) for not-found. `preview_screenshot` each. Expected: consistent white/hairline/red-accent look, no shadows, no leftover blue/green-fill panels. `preview_console_logs` (error) → none.

- [ ] **Step 3: Final consistency sweep**

Run a grep to confirm no stray old-palette references remain in the storefront:

```bash
grep -rn "003178\|1b6d24\|f7f9ff\|boxShadow: [1-9]\|'&:hover': { boxShadow" src/components src/app/'(storefront)' | grep -v node_modules
```

Expected: no matches (empty output). If any remain, fix them and re-run.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(storefront)/compare/page.tsx" "src/app/(storefront)/wishlist/page.tsx" "src/app/(storefront)/not-found.tsx" src/components/SavedLaptopsView.tsx
git commit -m "feat(pages): flatten compare/wishlist/not-found to match rebrand"
```

---

## Self-Review Notes

- **Spec coverage:** palette (T1), surface/whitespace language (T1 defaults + T2–T6 per-page), logo integration (T2), WhatsApp-stays-green (T3 hero, T4 card, T5 detail — the pages that actually contain WhatsApp CTAs), page-by-page order (T2→T6). All spec sections mapped.
- **WhatsApp trap:** `secondary.main` is reused for both WhatsApp buttons and non-WhatsApp hovers (Footer). Tasks distinguish them explicitly — do not blind find-replace `secondary`→`success`.
- **Testing:** browser verification per task via preview tools; no unit tests (visual change). Final grep sweep in T6 guards against stray old values.
