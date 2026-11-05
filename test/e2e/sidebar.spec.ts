import { test, expect, type Page } from '@playwright/test';

const routes = [
  { name: 'Overview', path: '/', heading: 'Good things start with trust.' },
  { name: 'Projects', path: '/projects', heading: 'Projects' },
  { name: 'Banner Studio', path: '/banner-studio', heading: 'Banner Studio' },
  { name: 'Consent records', path: '/consent-records', heading: 'Consent records' },
  { name: 'Integrations', path: '/integrations', heading: 'Integrations' },
  { name: 'Billing', path: '/billing', heading: 'Billing' },
  { name: 'Settings', path: '/settings', heading: 'Settings' },
];

async function expectRoute(page: Page, route: (typeof routes)[number]) {
  await expect(page).toHaveURL(route.path);
  await expect(page.getByRole('heading', { name: route.heading, exact: true })).toBeVisible();
  const sidebar = page.locator('[data-slot="sidebar"][data-state]');
  const link = sidebar.getByRole('link', { name: route.name, exact: true });
  await expect(link).toHaveAttribute('href', route.path);
  await expect(link).toHaveAttribute('aria-current', 'page');
  await expect(link).toHaveAttribute('data-active', 'true');
  await expect(sidebar.locator('a[aria-current="page"]')).toHaveCount(1);
}

test.describe('workspace route navigation', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  for (const route of routes) {
    test(`loads ${route.name} directly and after refresh`, async ({ page }) => {
      await page.goto(route.path);
      await expectRoute(page, route);
      await page.reload();
      await expectRoute(page, route);
    });
  }

  test('links every menu to its URL and supports back and forward without resetting the sidebar', async ({
    page,
  }) => {
    await page.goto('/');
    await expectRoute(page, routes[0]);
    const sidebar = page.locator('[data-slot="sidebar"][data-state]');
    await page.getByRole('button', { name: 'Toggle Sidebar', exact: true }).click();
    await expect(sidebar).toHaveAttribute('data-state', 'collapsed');

    const visits = [...routes.slice(1), routes[0]];
    for (const route of visits) {
      await sidebar.getByRole('link', { name: route.name, exact: true }).click();
      await expectRoute(page, route);
      await expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    }

    for (const route of [...routes].reverse()) {
      await page.goBack();
      await expectRoute(page, route);
      await expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    }
    for (const route of visits) {
      await page.goForward();
      await expectRoute(page, route);
      await expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    }

    await sidebar.getByRole('link', { name: 'Projects', exact: true }).click();
    await expectRoute(page, routes[1]);
    await sidebar.getByRole('link', { name: 'Accordly home', exact: true }).click();
    await expectRoute(page, routes[0]);
    await expect(sidebar).toHaveAttribute('data-state', 'collapsed');
  });
});

test.describe('desktop workspace sidebar', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Good things start with trust.', exact: true }),
    ).toBeVisible();
  });

  test('collapses to an icon, keeps navigation usable and restores the wordmark', async ({
    page,
  }) => {
    const sidebar = page.locator('[data-slot="sidebar"][data-state]');
    const navigation = sidebar.getByRole('navigation', { name: 'Workspace navigation' });
    const logo = sidebar
      .getByRole('link', { name: 'Accordly home', exact: true })
      .getByRole('img', { name: 'Accordly', exact: true });
    const toggle = page.getByRole('button', { name: 'Toggle Sidebar', exact: true });

    await expect(sidebar).toHaveAttribute('data-state', 'expanded');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('src', /accordly-full-dark\.png/);
    const expandedWidth = await sidebar.evaluate(
      (element) => element.getBoundingClientRect().width,
    );

    await toggle.click();
    await expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('src', /(?:\/|%2F)accordly\.png(?:\?|&|$)/);
    await expect(logo).toHaveAttribute('width', '32');
    await expect(logo).toHaveAttribute('height', '32');
    await expect
      .poll(() => sidebar.evaluate((element) => element.getBoundingClientRect().width))
      .toBeLessThan(expandedWidth);

    const projects = navigation.getByRole('link', { name: 'Projects', exact: true });
    await expect(projects).toHaveAttribute('data-sidebar', 'menu-button');
    await projects.hover();
    await expect(page.getByRole('tooltip', { name: 'Projects', exact: true })).toBeVisible();
    await projects.click();
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
    await expect(projects).toHaveAttribute('data-active', 'true');
    await expect(sidebar).toHaveAttribute('data-state', 'collapsed');

    await toggle.click();
    await expect(sidebar).toHaveAttribute('data-state', 'expanded');
    await expect(logo).toHaveAttribute('src', /accordly-full-dark\.png/);
    await expect(logo).toBeVisible();
    await expect
      .poll(() => sidebar.evaluate((element) => element.getBoundingClientRect().width))
      .toBe(expandedWidth);
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
  });

  test('keeps desktop collapse separate from the mobile drawer across viewport changes', async ({
    page,
  }) => {
    const sidebar = page.locator('[data-slot="sidebar"][data-state]');
    const toggle = page.getByRole('button', { name: 'Toggle Sidebar', exact: true });
    await toggle.click();
    await expect(sidebar).toHaveAttribute('data-state', 'collapsed');

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(sidebar).toHaveCount(0);
    const drawer = page.getByRole('dialog', { name: 'Sidebar', exact: true });
    await expect(drawer).not.toBeVisible();
    await toggle.click();
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('data-mobile', 'true');

    const mobileLogo = drawer
      .getByRole('link', { name: 'Accordly home', exact: true })
      .getByRole('img', { name: 'Accordly', exact: true });
    await expect(mobileLogo).toBeVisible();
    await expect(mobileLogo).toHaveAttribute('src', /accordly-full-dark\.png/);
    const projects = drawer
      .getByRole('navigation', { name: 'Workspace navigation' })
      .getByRole('link', { name: 'Projects', exact: true });
    await expect(projects).toBeVisible();
    await expect(projects.getByText('Projects', { exact: true })).toBeVisible();
    await expect(
      drawer
        .getByRole('navigation', { name: 'Workspace settings' })
        .getByRole('link', { name: 'Settings', exact: true })
        .getByText('Settings', { exact: true }),
    ).toBeVisible();

    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(drawer).not.toBeVisible();
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    await expect(
      sidebar
        .getByRole('link', { name: 'Accordly home', exact: true })
        .getByRole('img', { name: 'Accordly', exact: true }),
    ).toHaveAttribute('src', /(?:\/|%2F)accordly\.png(?:\?|&|$)/);
  });

  test('toggles with the sidebar keyboard shortcut', async ({ page }) => {
    const sidebar = page.locator('[data-slot="sidebar"][data-state]');
    await expect(sidebar).toHaveAttribute('data-state', 'expanded');

    await page.keyboard.press('ControlOrMeta+b');
    await expect(sidebar).toHaveAttribute('data-state', 'collapsed');

    await page.keyboard.press('ControlOrMeta+b');
    await expect(sidebar).toHaveAttribute('data-state', 'expanded');
  });
});

test.describe('mobile workspace sidebar', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Good things start with trust.', exact: true }),
    ).toBeVisible();
  });

  test('opens the drawer and closes it after navigating to Projects', async ({ page }) => {
    const drawer = page.getByRole('dialog', { name: 'Sidebar', exact: true });
    await expect(drawer).not.toBeVisible();
    await page.getByRole('button', { name: 'Toggle Sidebar', exact: true }).click();
    await expect(drawer).toBeVisible();

    const logo = drawer
      .getByRole('link', { name: 'Accordly home', exact: true })
      .getByRole('img', { name: 'Accordly', exact: true });
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('src', /accordly-full-dark\.png/);
    const settings = drawer
      .locator('[data-slot="sidebar-footer"]')
      .getByRole('navigation', { name: 'Workspace settings' })
      .getByRole('link', { name: 'Settings', exact: true });
    await expect(settings).toBeVisible();
    await expect(settings).toHaveAttribute('data-sidebar', 'menu-button');

    const navigation = drawer.getByRole('navigation', { name: 'Workspace navigation' });
    await navigation.getByRole('link', { name: 'Projects', exact: true }).click();
    await expect(page).toHaveURL('/projects');
    await expect(drawer).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
  });

  test('the home link returns to Overview and closes the drawer', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Toggle Sidebar', exact: true }).click();
    const drawer = page.getByRole('dialog', { name: 'Sidebar', exact: true });
    await expect(drawer).toBeVisible();
    await drawer.getByRole('link', { name: 'Accordly home', exact: true }).click();
    await expect(page).toHaveURL('/');
    await expect(drawer).not.toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Good things start with trust.', exact: true }),
    ).toBeVisible();
  });

  test('dismisses the drawer with its Close button and Escape', async ({ page }) => {
    const drawer = page.getByRole('dialog', { name: 'Sidebar', exact: true });
    const toggle = page.getByRole('button', { name: 'Toggle Sidebar', exact: true });

    await toggle.click();
    await expect(drawer).toBeVisible();
    const close = drawer.getByRole('button', { name: 'Close', exact: true });
    await expect(close).toBeVisible();
    await close.click();
    await expect(drawer).not.toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await expect(drawer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(
      page.getByRole('heading', { name: 'Good things start with trust.', exact: true }),
    ).toBeVisible();
  });
});
