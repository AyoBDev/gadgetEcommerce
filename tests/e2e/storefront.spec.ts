import { test, expect } from '@playwright/test';

test.describe('Storefront', () => {
  test('homepage renders hero, categories, and featured deals', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Preowned Laptops/i);
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
