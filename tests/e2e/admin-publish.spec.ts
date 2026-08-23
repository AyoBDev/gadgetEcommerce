import { test, expect } from '@playwright/test';

// Requires ADMIN_EMAIL / ADMIN_PASSWORD to be set locally, or a seeded
// admin@jaysmart.ng user (created via the seed script / first boot).
const email = process.env.ADMIN_EMAIL ?? 'admin@jaysmart.ng';
const password = process.env.ADMIN_PASSWORD ?? 'change-me-on-first-deploy';

// CRITICAL regression: this suite drives the custom MUI admin at /admin.
// It must keep working after any Payload admin removal or route change.
test.describe('Admin publish flow', () => {
  test('admin can log in and reach the dashboard and laptops', async ({ page, context }) => {
    await page.goto('/admin');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/admin\/?$/, { timeout: 15_000 });

    // The Payload session cookie is set slightly after the client-side
    // redirect fires, so poll for the cookie instead of a fixed sleep.
    await expect(async () => {
      const cookies = await context.cookies();
      expect(cookies.some((c) => c.name === 'payload-token')).toBe(true);
    }).toPass({ timeout: 10_000 });

    await page.goto('/admin/laptops');
    await expect(page.getByRole('heading', { name: /laptops/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: /add laptop/i })).toBeVisible();
  });
});
