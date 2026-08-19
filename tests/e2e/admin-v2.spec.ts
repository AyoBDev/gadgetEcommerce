import { test, expect } from '@playwright/test';

// Requires ADMIN_EMAIL / ADMIN_PASSWORD to be set locally, or a seeded
// admin@jaysmart.ng user (created via the seed script / first boot).
const email = process.env.ADMIN_EMAIL ?? 'admin@jaysmart.ng';
const password = process.env.ADMIN_PASSWORD ?? 'change-me-on-first-deploy';

test.describe('Admin v2 smoke', () => {
  test('staff logs in and reaches the dashboard and laptops', async ({ page, context }) => {
    await page.goto('/admin-v2');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/admin-v2\/?$/, { timeout: 15_000 });

    await expect(async () => {
      const cookies = await context.cookies();
      expect(cookies.some((c) => c.name === 'payload-token')).toBe(true);
    }).toPass({ timeout: 10_000 });

    await page.goto('/admin-v2/laptops');
    await expect(page.getByRole('heading', { name: /laptops/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: /add laptop/i })).toBeVisible();
  });

  test('settings page saves and confirms', async ({ page }) => {
    await page.goto('/admin-v2/login');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/admin-v2\/?$/, { timeout: 15_000 });

    await page.goto('/admin-v2/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel(/support email/i)).toBeVisible();
    await page.getByRole('button', { name: /save settings/i }).click();
    await expect(page.getByText(/settings saved/i)).toBeVisible();
  });

  test('phase-2 pages render and media uploads', async ({ page }) => {
    await page.goto('/admin-v2/login');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/admin-v2\/?$/, { timeout: 15_000 });

    for (const [path, heading] of [
      ['/admin-v2/orders', 'Orders'],
      ['/admin-v2/orders/new', 'Record a sale'],
      ['/admin-v2/media', 'Media'],
      ['/admin-v2/users', 'Users'],
      ['/admin-v2/users/new', 'Add user'],
      ['/admin-v2/categories', 'Categories'],
      ['/admin-v2/addons', 'Add-ons'],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 15_000 });
    }

    // Media upload flow: pick a file, upload, then the new row appears.
    await page.goto('/admin-v2/media');
    await page.setInputFiles('#media-file-input', 'tests/e2e/fixtures/1px.png');
    await page.getByLabel(/alt text/i).fill(`e2e alt ${Date.now()}`);
    await page.getByRole('button', { name: /^upload$/i }).click();
    await expect(page.getByText(/1px.png/)).toBeVisible({ timeout: 15_000 });
  });

  test('wrong password shows an error and stays on login', async ({ page }) => {
    await page.goto('/admin-v2');
    await page.getByLabel(/email/i).fill('nobody@nowhere.ng');
    await page.getByLabel(/password/i).fill('wrong-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/login failed|check your credentials/i)).toBeVisible();
    await expect(page).toHaveURL(/\/admin-v2\/login/);
  });
});