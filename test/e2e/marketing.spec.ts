import { expect, test } from '@playwright/test';

test('public home exposes pricing, source, and local authentication links', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('permission');
  await expect(page.getByRole('link', { name: 'Log in', exact: true })).toHaveAttribute(
    'href',
    '/sign-in',
  );
  await expect(page.getByRole('link', { name: 'Sign up ↗', exact: true })).toHaveAttribute(
    'href',
    '/sign-up',
  );
  await expect(page.getByRole('link', { name: /Give us a star/ })).toHaveAttribute(
    'href',
    'https://github.com/tectune-studio/accordly',
  );
  await page.getByRole('link', { name: 'Pricing', exact: true }).click();
  const pricing = page.locator('#pricing');
  await expect(pricing.getByRole('heading', { name: 'Starter', exact: true })).toBeVisible();
  await expect(pricing.locator('.price').nth(1)).toHaveText('$12 /mo');
  await pricing.getByRole('button', { name: /Annual/ }).click();
  await expect(pricing.locator('.price').nth(1)).toHaveText('$120 /yr');
  await expect(pricing.getByText(/Paid checkout is not available yet/)).toBeVisible();

  // Pricing Plans
  await expect(pricing.locator('[data-price]').nth(1)).toHaveText('$12 per month');
  await pricing.getByRole('button', { name: /yearly/ }).click();
  await expect(pricing.locator('[data-price]').nth(1)).toHaveText('$10 per month');
  await expect(pricing.getByText('Billed yearly at $120').first()).toBeVisible();
});

test('landing preview works and dashboard remains separate', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('✓ Optional categories rejected');
  await page.goto('/dashboard');
  await expect(page.locator('.accordly-marketing')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Overview', exact: true })).toHaveAttribute(
    'href',
    '/dashboard',
  );
});

for (const width of [320, 768, 1440]) {
  test(`public home fits ${width}px with reduced motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
