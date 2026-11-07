import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 600 } });

test.beforeEach(async ({ page }) => {
  await page.goto('/dashboard');
  await expect(
    page.getByRole('heading', { name: 'Good things start with trust.', exact: true }),
  ).toBeVisible();
});

test('uses the application palette for primary actions and active navigation', async ({ page }) => {
  const palette = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return ['--brand-primary', '--brand-hover', '--surface', '--ink'].map((name) => {
      const color = styles.getPropertyValue(name).trim().toUpperCase();
      return color.length === 4
        ? '#' + [...color.slice(1)].map((digit) => digit.repeat(2)).join('')
        : color;
    });
  });
  expect(palette).toEqual(['#433BCA', '#38319C', '#FFFFFF', '#000000']);
  await expect(page.locator('body')).toHaveCSS('color', 'rgb(0, 0, 0)');
  await expect(page.getByTestId('stat-card').first()).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  );

  const primary = page.getByRole('button', { name: 'Create project', exact: true });
  await expect(primary).toHaveCSS('background-color', 'rgb(67, 59, 202)');
  await expect(primary).toHaveCSS('color', 'rgb(255, 255, 255)');
  await primary.hover();
  await expect(primary).toHaveCSS('background-color', 'rgb(56, 49, 156)');
  await expect(
    page
      .getByRole('navigation', { name: 'Workspace navigation' })
      .getByRole('link', { name: 'Overview', exact: true }),
  ).toHaveCSS('color', 'rgb(56, 49, 156)');
});

test('hides document and nested scrollbars without disabling scrolling', async ({ page }) => {
  const sidebar = page.locator('[data-slot="sidebar-inner"]');
  for (const element of [page.locator('html'), page.locator('body'), sidebar]) {
    await expect(element).toHaveCSS('scrollbar-width', 'none');
    expect(
      await element.evaluate((node) => getComputedStyle(node, '::-webkit-scrollbar').display),
    ).toBe('none');
  }

  await page.mouse.move(1000, 450);
  await page.mouse.wheel(0, 500);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  await sidebar.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect.poll(() => sidebar.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(
    page
      .getByRole('navigation', { name: 'Workspace settings' })
      .getByRole('link', { name: 'Settings', exact: true }),
  ).toBeVisible();
});

test('uses palette tokens consistently for charts and integration cards', async ({ page }) => {
  await page.route('**/api/state', async (route) => {
    const response = await route.fetch();
    const state = await response.json();
    await route.fulfill({
      response,
      json: {
        ...state,
        receipts: ['accept', 'reject', 'customize', 'withdraw'].map((action) => ({ action })),
      },
    });
  });
  await page.reload();
  const segments = page.getByTestId('consent-breakdown-bar').locator(':scope > div');
  await expect(segments).toHaveCount(4);
  const colors = await segments.evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).backgroundColor),
  );
  expect(new Set(colors).size).toBe(4);
  expect(colors).toEqual(
    await page
      .getByTestId('consent-legend-swatch')
      .evaluateAll((elements) =>
        elements.map((element) => getComputedStyle(element).backgroundColor),
      ),
  );

  await page.getByRole('link', { name: 'Integrations', exact: true }).click();
  const logos = page.getByTestId('integration-logo');
  await expect(logos).toHaveCount(8);
  for (const logo of await logos.all()) {
    await expect(logo).toHaveClass(/bg-\(--(?:accent-background|accent-strong|muted-background)\)/);
  }
});
