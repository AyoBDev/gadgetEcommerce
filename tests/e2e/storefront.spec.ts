import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@jaysmart.ng';
const ADMIN_PASSWORD = 'change-me-on-first-deploy';

test.describe('Storefront', () => {
  test('product page renders description as plain text (not richText)', async ({ page, request }) => {
    // Create a laptop with a plain-text description to prove the Lexical → textarea
    // conversion renders safely without the RichText component.
    const login = await request.post('/api/users/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    expect(login.status()).toBe(200);

    const unique = Date.now();
    const create = await request.post('/api/laptops', {
      data: {
        title: `Desc regression ${unique}`,
        slug: `desc-regression-${unique}`,
        brand: 60,
        price: 450000,
        condition: 'grade-a',
        warrantyDays: 14,
        stock: 1,
        status: 'published',
        description: 'Line one of the description.\nLine two with <b>not html</b>.',
      },
    });
    expect(create.status()).toBe(201);
    const laptop = (await create.json()).doc;
    const url = `/laptops/${laptop.slug}`;

    try {
      await page.goto(url);
      await expect(page.getByText('Product Description')).toBeVisible();
      await expect(page.getByText(/Line one of the description\./)).toBeVisible();
      // The literal `<b>` must render as text, never as a styled element.
      await expect(page.locator('b', { hasText: 'not html' })).toHaveCount(0);
    } finally {
      await request.delete(`/api/laptops/${laptop.id}`);
    }
  });

  test('homepage renders hero, categories, and featured deals', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Laptops in Nigeria/i);
    await expect(page.getByText(/Shop by category/i)).toBeVisible();
    await expect(page.getByText(/Featured deals/i)).toBeVisible();
  });

  test('user can navigate to listing and open a product', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /browse all laptops/i }).click();
    await expect(page).toHaveURL(/\/laptops/);
    const firstCard = page.getByRole('heading', { level: 3 }).first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();
    await expect(page).toHaveURL(/\/laptops\/.+/);
    await expect(page.getByText(/warranty/i).first()).toBeVisible();
  });

  test('product page emits Product JSON-LD', async ({ page }) => {
    await page.goto('/laptops');
    const firstLink = page.getByRole('heading', { level: 3 }).first();
    await firstLink.click();
    await expect(page).toHaveURL(/\/laptops\/.+/);

    const productLd = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      for (const script of scripts) {
        const parsed = JSON.parse(script.textContent ?? '{}');
        if (parsed['@type'] === 'Product') return parsed;
      }
      return null;
    });

    expect(productLd).toBeTruthy();
    expect(productLd.offers.priceCurrency).toBe('NGN');
  });

  test('sitemap includes laptops', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const xml = await res.text();
    expect(xml).toContain('/laptops');
  });

  test('robots blocks admin', async ({ request }) => {
    const res = await request.get('/robots.txt');
    const txt = await res.text();
    expect(txt).toMatch(/Disallow:.*admin/);
  });
});
