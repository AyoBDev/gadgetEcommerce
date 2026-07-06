import { test, expect } from '@playwright/test';

test.describe('Admin publish flow', () => {
  test('admin can log in and reach the laptops collection', async ({ page, context }) => {
    await page.goto('/admin');
    // Requires ADMIN_EMAIL / ADMIN_PASSWORD to be set locally.
    const email = process.env.ADMIN_EMAIL ?? 'admin@jaysmart.ng';
    const password = process.env.ADMIN_PASSWORD ?? 'change-me-on-first-deploy';
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/admin/, { timeout: 15_000 });

    // The Payload session cookie is set slightly after the client-side
    // redirect fires (Next.js Server Action response lands a moment later),
    // so a plain page.goto() right after waitForURL can race ahead of it
    // and bounce back to the login screen. Poll for the cookie instead of
    // using a fixed sleep.
    await expect(async () => {
      const cookies = await context.cookies();
      expect(cookies.some((c) => c.name === 'payload-token')).toBe(true);
    }).toPass({ timeout: 10_000 });

    await page.goto('/admin/collections/laptops');
    await expect(page.getByRole('heading', { name: /laptops/i })).toBeVisible({ timeout: 15_000 });
  });
});
