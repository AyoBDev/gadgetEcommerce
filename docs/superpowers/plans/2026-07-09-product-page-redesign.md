# Product Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the laptop product page to match the supplied mockup using the existing MUI theme, backed by a new staff-managed `Addons` collection and a related-products section.

**Architecture:** Testable logic (WhatsApp message builders, the related-laptops query filter) lives in pure functions in `src/lib/`, unit-tested first. The `Addons` collection is verified with a Payload local-API integration test. The page is recomposed from small single-purpose MUI section components under `src/components/product/`, verified in the browser by the controller.

**Tech Stack:** Next.js 15.4 (App Router), Payload 3.85 (Postgres dev **push** mode), MUI v6 (existing `src/lib/theme.ts` — already the mockup's blue/green palette), Vitest (unit + integration via Payload local API).

## Global Constraints

- Money is in **kobo** (integer). Format for display with `formatNaira(kobo)` from `src/lib/money.ts`.
- Storefront is **MUI only** — do NOT add Tailwind. Use the existing theme; no global theme changes.
- Access-control pattern: read/create/update = `Boolean(req.user)`; delete = `req.user?.role === 'admin'`.
- `payload generate:types` / `generate:importmap` CLIs are **broken** here — `src/payload-types.ts` is hand-maintained. Hand-add the `Addon` type; collections need no importMap entry. New Postgres table auto-created by dev push.
- WhatsApp links use `buildWhatsAppLink(number, message)` from `src/lib/whatsapp.ts` and `resolveWhatsAppNumber(settings)` from `src/lib/settings.ts`.
- No cart / no "Add to Cart" button. Buy Now opens WhatsApp.
- Render the laptop's real `description` richText — do NOT invent the mockup's 4-quadrant description.
- Tests: `pnpm test` (Vitest, `fileParallelism: false`). Integration tests use `getPayloadClient()` and must clean up every record created. After collection/config changes, hand-update `src/payload-types.ts` (do not run codegen). Run `pnpm typecheck` before each commit.
- No AI attribution in commits.

---

### Task 1: WhatsApp message builders (pure functions)

Extract the product-page WhatsApp message strings into pure, unit-tested functions.

**Files:**
- Modify: `src/lib/whatsapp.ts`
- Test: `tests/unit/whatsapp.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `buildInquiryMessage(args: { title: string; price: number; url: string }): string`
  - `buildAddonWhatsAppMessage(args: { title: string; price: number; url: string; addonName: string; addonPrice: number }): string`
  - (existing `buildWhatsAppLink(number, message)` unchanged.)

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/whatsapp.test.ts
import { describe, it, expect } from 'vitest';
import { buildWhatsAppLink, buildInquiryMessage, buildAddonWhatsAppMessage } from '@/lib/whatsapp';

describe('buildWhatsAppLink', () => {
  it('builds a wa.me link with encoded message', () => {
    expect(buildWhatsAppLink('2348012345678', 'hi there')).toBe(
      'https://wa.me/2348012345678?text=hi%20there',
    );
  });
});

describe('buildInquiryMessage', () => {
  it('includes title, formatted price, and url', () => {
    const msg = buildInquiryMessage({ title: 'Dell Latitude 7490', price: 28_000_000, url: 'https://x.ng/laptops/dell' });
    expect(msg).toBe("Hi, I'm interested in the Dell Latitude 7490 (₦280,000) — https://x.ng/laptops/dell");
  });
});

describe('buildAddonWhatsAppMessage', () => {
  it('includes the laptop and the add-on with formatted prices', () => {
    const msg = buildAddonWhatsAppMessage({
      title: 'Dell Latitude 7490', price: 28_000_000, url: 'https://x.ng/laptops/dell',
      addonName: 'Premium Laptop Bag', addonPrice: 1_500_000,
    });
    expect(msg).toBe(
      "Hi, I'd like the Dell Latitude 7490 (₦280,000) plus the Premium Laptop Bag (+₦15,000) — https://x.ng/laptops/dell",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- whatsapp`
Expected: FAIL — `buildInquiryMessage` / `buildAddonWhatsAppMessage` not exported.

- [ ] **Step 3: Add the builders**

```ts
// src/lib/whatsapp.ts
import { formatNaira } from '@/lib/money';

/** Builds a wa.me deep link with a pre-filled message. Safe for client + server. */
export function buildWhatsAppLink(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function buildInquiryMessage(args: { title: string; price: number; url: string }): string {
  return `Hi, I'm interested in the ${args.title} (${formatNaira(args.price)}) — ${args.url}`;
}

export function buildAddonWhatsAppMessage(args: {
  title: string;
  price: number;
  url: string;
  addonName: string;
  addonPrice: number;
}): string {
  return `Hi, I'd like the ${args.title} (${formatNaira(args.price)}) plus the ${args.addonName} (+${formatNaira(args.addonPrice)}) — ${args.url}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- whatsapp`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/whatsapp.ts tests/unit/whatsapp.test.ts
git commit -m "feat: add product-page WhatsApp message builders"
```

---

### Task 2: `Addons` collection

New collection for the upsell add-ons, verified via Payload local API.

**Files:**
- Create: `src/collections/Addons.ts`
- Modify: `src/payload.config.ts` (import + register after `Orders`)
- Modify: `src/payload-types.ts` (hand-add `Addon` type + collections-map entry)
- Test: `tests/integration/payload-addons.test.ts`

**Interfaces:**
- Produces: `addons` collection (slug `addons`) with fields `name` (text), `price` (number, kobo), `icon` (text), `active` (checkbox, default true). `Addon` type in `payload-types.ts`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/payload-addons.test.ts
import { describe, it, expect } from 'vitest';
import { getPayloadClient } from '@/lib/payload';

describe('Addons collection', () => {
  it('creates an add-on and defaults active to true', async () => {
    const payload = await getPayloadClient();
    const addon = await payload.create({
      collection: 'addons',
      data: { name: 'Premium Laptop Bag', price: 1_500_000, icon: 'work' },
    });
    expect(addon.name).toBe('Premium Laptop Bag');
    expect(addon.price).toBe(1_500_000);
    expect(addon.active).toBe(true);
    await payload.delete({ collection: 'addons', id: addon.id });
  });

  it('can filter to active add-ons only', async () => {
    const payload = await getPayloadClient();
    const on = await payload.create({ collection: 'addons', data: { name: 'Mouse', price: 850_000, icon: 'mouse', active: true } });
    const off = await payload.create({ collection: 'addons', data: { name: 'Old', price: 100, icon: 'memory', active: false } });
    const res = await payload.find({ collection: 'addons', where: { active: { equals: true } }, limit: 50 });
    const names = res.docs.map((d) => d.name);
    expect(names).toContain('Mouse');
    expect(names).not.toContain('Old');
    await payload.delete({ collection: 'addons', id: on.id });
    await payload.delete({ collection: 'addons', id: off.id });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- payload-addons`
Expected: FAIL — collection `addons` does not exist.

- [ ] **Step 3: Write the collection**

```ts
// src/collections/Addons.ts
import type { CollectionConfig } from 'payload';

export const Addons: CollectionConfig = {
  slug: 'addons',
  admin: {
    group: 'Catalog',
    useAsTitle: 'name',
    defaultColumns: ['name', 'price', 'active'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'price', type: 'number', required: true, min: 0,
      admin: { description: 'In kobo (Naira × 100)' } },
    { name: 'icon', type: 'text',
      admin: { description: 'Material Symbols name, e.g. work, mouse, memory' } },
    { name: 'active', type: 'checkbox', defaultValue: true,
      admin: { description: 'Only active add-ons show on the storefront' } },
  ],
};
```

- [ ] **Step 4: Register the collection**

In `src/payload.config.ts`: add `import { Addons } from '@/collections/Addons';` with the other collection imports, and change the collections array to `collections: [Users, Media, Categories, Laptops, Orders, Addons],`.

- [ ] **Step 5: Hand-add the type to `payload-types.ts`**

Add `addons: Addon;` to the `Config['collections']` map (after `orders: Order;`), and add this interface near the `Order` interface:

```ts
export interface Addon {
  id: number;
  name: string;
  price: number;
  icon?: string | null;
  active?: boolean | null;
  updatedAt: string;
  createdAt: string;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test -- payload-addons`
Expected: PASS (2 tests). Dev push auto-creates the `addons` table.

- [ ] **Step 7: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/collections/Addons.ts src/payload.config.ts src/payload-types.ts tests/integration/payload-addons.test.ts
git commit -m "feat: add Addons collection for product-page upsell"
```

---

### Task 3: Related-laptops query helper

Pure function returning the Payload `where` clause for related laptops, unit-tested for shape.

**Files:**
- Create: `src/lib/related-laptops.ts`
- Test: `tests/unit/related-laptops.test.ts`

**Interfaces:**
- Produces: `relatedLaptopsWhere(args: { laptopId: number; brandId: number; categoryId?: number | null }): Where` — a Payload `Where` selecting published laptops that share the brand OR category, excluding the laptop itself. When `categoryId` is nullish, the `or` contains only the brand clause.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/related-laptops.test.ts
import { describe, it, expect } from 'vitest';
import { relatedLaptopsWhere } from '@/lib/related-laptops';

describe('relatedLaptopsWhere', () => {
  it('matches published laptops sharing brand or category, excluding self', () => {
    const where = relatedLaptopsWhere({ laptopId: 5, brandId: 2, categoryId: 3 });
    expect(where).toEqual({
      and: [
        { status: { equals: 'published' } },
        { id: { not_equals: 5 } },
        { or: [{ brand: { equals: 2 } }, { category: { equals: 3 } }] },
      ],
    });
  });

  it('uses brand only when category is absent', () => {
    const where = relatedLaptopsWhere({ laptopId: 5, brandId: 2, categoryId: null });
    expect(where).toEqual({
      and: [
        { status: { equals: 'published' } },
        { id: { not_equals: 5 } },
        { or: [{ brand: { equals: 2 } }] },
      ],
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- related-laptops`
Expected: FAIL — cannot find module `@/lib/related-laptops`.

- [ ] **Step 3: Write the helper**

```ts
// src/lib/related-laptops.ts
import type { Where } from 'payload';

export function relatedLaptopsWhere(args: {
  laptopId: number;
  brandId: number;
  categoryId?: number | null;
}): Where {
  const or: Where[] = [{ brand: { equals: args.brandId } }];
  if (args.categoryId != null) {
    or.push({ category: { equals: args.categoryId } });
  }
  return {
    and: [
      { status: { equals: 'published' } },
      { id: { not_equals: args.laptopId } },
      { or },
    ],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- related-laptops`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/related-laptops.ts tests/unit/related-laptops.test.ts
git commit -m "feat: add related-laptops query helper"
```

---

### Task 4: Presentational section components

Small single-purpose MUI components for the hero-right column and standalone sections. No data fetching; pure props. Verified when composed into the page (Task 6) — this task is the building blocks + typecheck.

**Files:**
- Create: `src/components/product/StockPill.tsx`
- Create: `src/components/product/ConditionBadge.tsx`
- Create: `src/components/product/TrustBox.tsx`
- Create: `src/components/product/KeySpecs.tsx`
- Create: `src/components/product/CompareCallout.tsx`
- Create: `src/components/product/WhatsAppCallout.tsx`

**Interfaces:**
- Consumes: `Laptop` type; `formatNaira`.
- Produces (all default-exported React components):
  - `StockPill({ stock }: { stock: number })`
  - `ConditionBadge({ condition }: { condition: Laptop['condition'] })`
  - `TrustBox({ batteryHealth }: { batteryHealth?: number | null })`
  - `KeySpecs({ laptop }: { laptop: Laptop })`
  - `CompareCallout()` (links to `/compare`)
  - `WhatsAppCallout({ href }: { href: string })`

- [ ] **Step 1: Write `StockPill.tsx`**

```tsx
// src/components/product/StockPill.tsx
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function StockPill({ stock }: { stock: number }) {
  const inStock = stock > 0;
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: inStock ? 'secondary.main' : 'error.main' }} />
      <Typography variant="button" sx={{ color: 'text.primary' }}>
        {inStock ? `IN STOCK (${stock} AVAILABLE)` : 'SOLD'}
      </Typography>
    </Stack>
  );
}
```

- [ ] **Step 2: Write `ConditionBadge.tsx`**

```tsx
// src/components/product/ConditionBadge.tsx
import Chip from '@mui/material/Chip';
import VerifiedIcon from '@mui/icons-material/Verified';
import type { Laptop } from '@/payload-types';

const LABEL: Record<Laptop['condition'], string> = {
  'grade-a': 'Grade A',
  'grade-b': 'Grade B',
  'grade-c': 'Grade C',
};

export default function ConditionBadge({ condition }: { condition: Laptop['condition'] }) {
  return (
    <Chip
      icon={<VerifiedIcon />}
      label={LABEL[condition]}
      color="primary"
      size="small"
      sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}
    />
  );
}
```

- [ ] **Step 3: Write `TrustBox.tsx`**

```tsx
// src/components/product/TrustBox.tsx
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

export default function TrustBox({ batteryHealth }: { batteryHealth?: number | null }) {
  const battery = typeof batteryHealth === 'number'
    ? `Verified battery health (${batteryHealth}%+)`
    : 'Verified battery health';
  const rows = [
    { icon: <VerifiedUserIcon color="primary" />, label: 'Passed 20-point inspection' },
    { icon: <BatteryChargingFullIcon color="primary" />, label: battery },
    { icon: <LocalShippingIcon color="primary" />, label: 'Instant delivery available' },
  ];
  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
      <Stack spacing={1.5}>
        {rows.map((r) => (
          <Stack key={r.label} direction="row" spacing={1.5} alignItems="center">
            {r.icon}
            <Typography variant="caption" color="text.secondary">{r.label}</Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
```

- [ ] **Step 4: Write `KeySpecs.tsx`**

```tsx
// src/components/product/KeySpecs.tsx
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Laptop } from '@/payload-types';

const CONDITION: Record<Laptop['condition'], string> = {
  'grade-a': 'Grade A',
  'grade-b': 'Grade B',
  'grade-c': 'Grade C',
};

export default function KeySpecs({ laptop }: { laptop: Laptop }) {
  const s = laptop.specs ?? {};
  const rows: { label: string; value: string }[] = [];
  if (s.processor) rows.push({ label: 'Processor', value: s.processor });
  if (typeof s.ram === 'number') rows.push({ label: 'RAM', value: `${s.ram}GB` });
  if (s.storage) rows.push({ label: 'Storage', value: s.storage });
  if (typeof s.screenSize === 'number') rows.push({ label: 'Screen Size', value: `${s.screenSize}"` });
  rows.push({ label: 'Condition', value: CONDITION[laptop.condition] });
  if (typeof s.batteryHealth === 'number') rows.push({ label: 'Battery Health', value: `${s.batteryHealth}%+` });
  if (s.os) rows.push({ label: 'OS', value: s.os });

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
      <Typography variant="h2" sx={{ mb: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
        Key Specifications
      </Typography>
      <Grid container spacing={4}>
        {rows.map((r) => (
          <Grid key={r.label} size={{ xs: 6, md: 3 }}>
            <Stack spacing={0.5}>
              <Typography variant="button" color="text.secondary">{r.label}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.value}</Typography>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
```

- [ ] **Step 5: Write `CompareCallout.tsx`**

```tsx
// src/components/product/CompareCallout.tsx
import Link from 'next/link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export default function CompareCallout() {
  return (
    <Paper sx={{ p: { xs: 3, md: 4 }, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ md: 'center' }} justifyContent="space-between">
        <Stack spacing={1}>
          <Typography variant="h2">Compare with similar laptops</Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Not sure if this is the right fit? Compare specs side by side.
          </Typography>
        </Stack>
        <Button component={Link} href="/compare" variant="outlined"
          sx={{ color: 'primary.contrastText', borderColor: 'primary.contrastText', whiteSpace: 'nowrap',
            '&:hover': { bgcolor: 'primary.contrastText', color: 'primary.main' } }}>
          Compare Devices
        </Button>
      </Stack>
    </Paper>
  );
}
```

- [ ] **Step 6: Write `WhatsAppCallout.tsx`**

```tsx
// src/components/product/WhatsAppCallout.tsx
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ChatIcon from '@mui/icons-material/Chat';

export default function WhatsAppCallout({ href }: { href: string }) {
  return (
    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.100' }}>
      <Stack spacing={2} alignItems="center">
        <Typography variant="h2">Still confused? Chat with us before buying</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
          Our laptop experts are online to answer any questions about specs, condition, or shipping.
        </Typography>
        <Button component="a" href={href} target="_blank" rel="noopener" startIcon={<ChatIcon />}
          variant="contained" size="large"
          sx={{ bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' }, borderRadius: 999 }}>
          Chat on WhatsApp
        </Button>
      </Stack>
    </Paper>
  );
}
```

- [ ] **Step 7: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/product/StockPill.tsx src/components/product/ConditionBadge.tsx src/components/product/TrustBox.tsx src/components/product/KeySpecs.tsx src/components/product/CompareCallout.tsx src/components/product/WhatsAppCallout.tsx
git commit -m "feat: add product-page section components"
```

---

### Task 5: Add-ons + related-products components

The client add-ons section (WhatsApp prefill) and the related-products grid.

**Files:**
- Create: `src/components/product/AddonsSection.tsx`
- Create: `src/components/product/RelatedProducts.tsx`
- Test: `tests/unit/addons-section.test.tsx` (render/behavior via the message builder is already unit-tested in Task 1; this file asserts the ADD href is wired). If the repo has no React test renderer configured, SKIP the render test and rely on Task 1's builder test + controller browser verification — note which was done in the report.

**Interfaces:**
- Consumes: `buildWhatsAppLink`, `buildAddonWhatsAppMessage` (Task 1); `Addon`, `Laptop` types; `formatNaira`; `ProductCard`.
- Produces:
  - `AddonsSection({ addons, whatsappNumber, laptopTitle, laptopPrice, url }: { addons: Addon[]; whatsappNumber: string; laptopTitle: string; laptopPrice: number; url: string })` — client component; each ADD is an anchor to the prefilled wa.me link. Renders nothing if `addons` is empty.
  - `RelatedProducts({ laptops, whatsappNumber }: { laptops: Laptop[]; whatsappNumber: string })` — renders nothing if `laptops` is empty.

- [ ] **Step 1: Write `AddonsSection.tsx`**

```tsx
// src/components/product/AddonsSection.tsx
'use client';

import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { formatNaira } from '@/lib/money';
import { buildWhatsAppLink, buildAddonWhatsAppMessage } from '@/lib/whatsapp';
import type { Addon } from '@/payload-types';

export default function AddonsSection({
  addons, whatsappNumber, laptopTitle, laptopPrice, url,
}: {
  addons: Addon[];
  whatsappNumber: string;
  laptopTitle: string;
  laptopPrice: number;
  url: string;
}) {
  if (addons.length === 0) return null;

  return (
    <Paper sx={{ p: { xs: 3, md: 4 }, bgcolor: 'grey.50' }}>
      <Typography variant="h2" sx={{ mb: 3 }}>Essential Add-ons</Typography>
      <Grid container spacing={3}>
        {addons.map((addon) => {
          const href = buildWhatsAppLink(
            whatsappNumber,
            buildAddonWhatsAppMessage({
              title: laptopTitle, price: laptopPrice, url,
              addonName: addon.name, addonPrice: addon.price,
            }),
          );
          return (
            <Grid key={addon.id} size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box className="material-symbols-outlined" sx={{ color: 'primary.main', fontSize: 36 }}>
                      {addon.icon || 'add_shopping_cart'}
                    </Box>
                    <Stack>
                      <Typography variant="h3">{addon.name}</Typography>
                      <Typography variant="button" sx={{ color: 'secondary.main' }}>
                        +{formatNaira(addon.price)}
                      </Typography>
                    </Stack>
                  </Stack>
                  <Button component="a" href={href} target="_blank" rel="noopener" variant="contained" size="small">
                    ADD
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
}
```

Note: the `material-symbols-outlined` font is already loaded by the storefront (used elsewhere, e.g. category icons). If a quick check shows it is NOT globally loaded, fall back to no icon (render only when `addon.icon` and the font is present) and note it in the report.

- [ ] **Step 2: Write `RelatedProducts.tsx`**

```tsx
// src/components/product/RelatedProducts.tsx
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { ProductCard } from '@/components/ProductCard';
import type { Laptop } from '@/payload-types';

export default function RelatedProducts({ laptops, whatsappNumber }: { laptops: Laptop[]; whatsappNumber: string }) {
  if (laptops.length === 0) return null;
  return (
    <Stack spacing={3}>
      <Typography variant="h2">You might also like</Typography>
      <Grid container spacing={3}>
        {laptops.map((laptop) => (
          <Grid key={laptop.id} size={{ xs: 12, sm: 6, md: 3 }}>
            <ProductCard laptop={laptop} whatsappNumber={whatsappNumber} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
```

- [ ] **Step 3: Verify the add-ons icon font is loaded**

Check `src/app/(storefront)/layout.tsx` (and any global CSS/`<head>`) for the Material Symbols stylesheet (`family=Material+Symbols+Outlined`). If present, the `material-symbols-outlined` span renders icons. If absent, edit `AddonsSection.tsx` to omit the icon `Box`. Record the finding in the report.

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/product/AddonsSection.tsx src/components/product/RelatedProducts.tsx
git commit -m "feat: add add-ons and related-products sections"
```

---

### Task 6: Recompose the product page

Wire everything into `page.tsx`: fetch related laptops + add-ons, render the hero split and all sections. Browser-verified by the controller.

**Files:**
- Modify: `src/app/(storefront)/laptops/[slug]/page.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1–5, plus existing `LaptopGallery`, `ProductDetailActions`, SEO helpers.

- [ ] **Step 1: Rewrite the page body**

Keep the existing imports for SEO/JSON-LD, `getPayloadClient`, `formatNaira`, `getSettings`/`resolveWhatsAppNumber`, `LaptopGallery`, `ProductDetailActions`, `generateStaticParams`, `generateMetadata`. Add imports for the new components, `buildInquiryMessage`, `buildWhatsAppLink`, `relatedLaptopsWhere`, and the `Addon` type. Replace the `ProductPage` component body with:

```tsx
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: 'laptops',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    depth: 2,
    limit: 1,
  });
  const laptop = res.docs[0];
  if (!laptop) notFound();

  const settings = await getSettings();
  const whatsappNumber = resolveWhatsAppNumber(settings);
  const url = `${SERVER_URL}/laptops/${laptop.slug}`;

  const brandId = typeof laptop.brand === 'object' ? laptop.brand.id : laptop.brand;
  const categoryId = laptop.category == null
    ? null
    : (typeof laptop.category === 'object' ? laptop.category.id : laptop.category);

  const [relatedRes, addonsRes] = await Promise.all([
    payload.find({
      collection: 'laptops',
      where: relatedLaptopsWhere({ laptopId: laptop.id, brandId, categoryId }),
      sort: '-publishedAt',
      limit: 4,
      depth: 1,
    }),
    payload.find({ collection: 'addons', where: { active: { equals: true } }, limit: 50 }),
  ]);
  const related = relatedRes.docs;
  const addons = addonsRes.docs as Addon[];

  const productLd = buildProductJsonLd(laptop, SERVER_URL);
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: 'Home', url: SERVER_URL },
    { name: 'Laptops', url: `${SERVER_URL}/laptops` },
    { name: laptop.title, url },
  ]);
  const waHref = buildWhatsAppLink(whatsappNumber, buildInquiryMessage({ title: laptop.title, price: laptop.price, url }));
  const gallery = (laptop.gallery ?? []).filter(
    (g): g is { image: Media; id?: string | null } => typeof g.image === 'object',
  );
  const subtitle = [
    typeof laptop.specs?.processor === 'string' ? laptop.specs.processor : null,
    typeof laptop.specs?.ram === 'number' ? `${laptop.specs.ram}GB RAM` : null,
    typeof laptop.specs?.storage === 'string' ? laptop.specs.storage : null,
  ].filter(Boolean).join(' · ');

  return (
    <>
      <script key="product-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script key="breadcrumb-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 8 } }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link href="/">Home</Link>
          <Link href="/laptops">Laptops</Link>
          <Typography color="text.primary">{laptop.title}</Typography>
        </Breadcrumbs>

        <Stack spacing={{ xs: 6, md: 8 }}>
          {/* Hero split */}
          <Grid container spacing={{ xs: 4, md: 6 }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Box sx={{ position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1 }}>
                  <ConditionBadge condition={laptop.condition} />
                </Box>
                <LaptopGallery images={gallery} />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Stack spacing={3}>
                <Stack spacing={1}>
                  <Typography variant="h1" sx={{ fontSize: { xs: 32, md: 44 } }}>{laptop.title}</Typography>
                  {subtitle && <Typography variant="h3" color="text.secondary">{subtitle}</Typography>}
                </Stack>
                <Stack direction="row" spacing={2} alignItems="baseline">
                  <Typography variant="h1" sx={{ color: 'primary.main', fontSize: 32 }}>{formatNaira(laptop.price)}</Typography>
                  {laptop.compareAtPrice && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', textDecoration: 'line-through' }}>
                      {formatNaira(laptop.compareAtPrice)}
                    </Typography>
                  )}
                </Stack>
                <StockPill stock={laptop.stock} />
                <TrustBox batteryHealth={laptop.specs?.batteryHealth} />
                <Stack spacing={1.5}>
                  <Button component="a" href={waHref} target="_blank" rel="noopener"
                    variant="contained" size="large" disabled={laptop.stock === 0} fullWidth>
                    {laptop.stock > 0 ? 'Buy Now' : 'Sold Out'}
                  </Button>
                  <Button component="a" href={waHref} target="_blank" rel="noopener"
                    variant="contained" size="large" startIcon={<ChatIcon />} fullWidth
                    sx={{ bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}>
                    WhatsApp inquiry
                  </Button>
                </Stack>
                <ProductDetailActions laptopId={laptop.id} />
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="caption">
                    Note: online checkout is coming soon. For now, tap <strong>WhatsApp inquiry</strong> to place your order.
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>

          <KeySpecs laptop={laptop} />

          {laptop.description && (
            <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h2" sx={{ mb: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                Product Description
              </Typography>
              <RichText data={laptop.description} />
            </Paper>
          )}

          <AddonsSection addons={addons} whatsappNumber={whatsappNumber}
            laptopTitle={laptop.title} laptopPrice={laptop.price} url={url} />
          <CompareCallout />
          <RelatedProducts laptops={related} whatsappNumber={whatsappNumber} />
          <WhatsAppCallout href={waHref} />
        </Stack>
      </Container>
    </>
  );
}
```

Add the imports at the top (default exports):

```tsx
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { buildWhatsAppLink, buildInquiryMessage } from '@/lib/whatsapp';
import { relatedLaptopsWhere } from '@/lib/related-laptops';
import StockPill from '@/components/product/StockPill';
import ConditionBadge from '@/components/product/ConditionBadge';
import TrustBox from '@/components/product/TrustBox';
import KeySpecs from '@/components/product/KeySpecs';
import CompareCallout from '@/components/product/CompareCallout';
import WhatsAppCallout from '@/components/product/WhatsAppCallout';
import AddonsSection from '@/components/product/AddonsSection';
import RelatedProducts from '@/components/product/RelatedProducts';
import type { Addon } from '@/payload-types';
```

For the description rendering, use Payload's richText renderer. Check how richText is rendered elsewhere in the repo first: run `grep -rn "RichText\|@payloadcms/richtext-lexical/react\|serializeLexical\|convertLexical" src/` — reuse the existing approach/import. If none exists, import `{ RichText } from '@payloadcms/richtext-lexical/react'` and render `<RichText data={laptop.description} />`. If that import path differs in this installed version, check `node_modules/@payloadcms/richtext-lexical/` exports and use the correct one; note it in the report.

- [ ] **Step 2: Remove now-unused imports**

Remove the old `Chip`, `LaptopSpecsTable` import if the specs table is fully replaced by `KeySpecs` (it is). Keep `LaptopGallery`, `ProductDetailActions`, `ChatIcon`, `Container`, `Grid`, `Stack`, `Typography`, `Button`, `Breadcrumbs`, `Link`.

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 4: Verify in the browser (controller)**

Start the dev server (preview_start `jaysmart-dev`). Create at least two active add-ons via the admin or API, and ensure ≥2 published laptops share a brand. Open a published laptop's page (`/laptops/<slug>`) and confirm:
- Hero split: gallery with condition badge, title, subtitle, price + struck compare, stock pill, trust box, Buy Now + WhatsApp buttons.
- Key Specifications card shows only present fields.
- Product Description renders the richText.
- Essential Add-ons render; clicking ADD opens a WhatsApp link whose text contains both the laptop and the add-on.
- Compare callout, Related products (≤4), WhatsApp callout render.
- Sold-out laptop: stock pill shows SOLD, Buy Now disabled.
- Mobile + desktop layout, light + dark. Capture a screenshot as proof.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(storefront)/laptops/[slug]/page.tsx"
git commit -m "feat: redesign product page to match mockup"
```

---

### Task 7: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Full test suite**

Run: `pnpm test`
Expected: all pass, including new `whatsapp`, `related-laptops`, and `payload-addons` tests.

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: End-to-end smoke (controller, browser)**

With the dev server running: seed a couple of add-ons and confirm on a real product page that the add-on ADD button's WhatsApp message is correct, related products reflect brand/category, and the page matches the mockup in light and dark, mobile and desktop. Clean up any seeded test data afterward.

- [ ] **Step 4: Final commit (if verification fixes were needed)**

```bash
git add -A
git commit -m "test: verify product page redesign end to end"
```

---

## Notes / follow-ups (out of scope)

- **Production migration:** dev uses Postgres push mode; before deploy, generate a real migration for the `addons` table (same follow-up as `orders`).
- **Per-laptop add-ons / cart:** future phases; this pass ships a global add-on pool and WhatsApp-based ordering.
- **Add-ons in admin nav:** the `Addons` collection joins the existing `Catalog` group automatically.
