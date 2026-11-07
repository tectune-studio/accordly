import { test, expect } from '@playwright/test';

for (const width of [390, 720, 1440, 1600]) {
  test(`preserves responsive overview and dialog styling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const heading = page.getByRole('heading', {
      name: 'Good things start with trust.',
      exact: true,
    });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveCSS('font-size', width <= 720 ? '27px' : '34px');
    await expect(page.locator('main')).toHaveCSS('padding-left', width <= 720 ? '20px' : '42px');
    await expect(page.locator('main')).toHaveCSS(
      'padding-top',
      width >= 1600 ? '43px' : width <= 720 ? '25px' : '35px',
    );

    const cards = page.getByTestId('stat-card');
    await expect(cards).toHaveCount(4);
    const columns = await cards
      .first()
      .evaluate(
        (card) => getComputedStyle(card.parentElement!).gridTemplateColumns.split(' ').length,
      );
    expect(columns).toBe(width <= 720 ? 2 : 4);

    await page.getByRole('button', { name: 'Create project', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'A new space for trust.', exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveCSS('padding', width <= 720 ? '25px' : '32px');
    const name = dialog.getByRole('textbox', { name: 'Project name', exact: true });
    await expect(name).toBeFocused();
    await expect(name).toHaveCSS('font-size', '12px');
    await expect(name).toHaveCSS('border-radius', '6px');
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
}

test('styles the studio, records, integrations, billing and settings without component CSS', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const created = await request.post('/api/projects', {
    data: { name: 'Tailwind layout ' + Date.now(), domain: 'layout.example' },
  });
  expect(created.ok()).toBe(true);
  await page.goto('/');
  const navigation = page.getByRole('navigation', { name: 'Workspace navigation' });
  await navigation.getByRole('link', { name: 'Banner Studio', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Words that build trust', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Description', exact: true })).toHaveCSS(
    'line-height',
    '19.2px',
  );
  await expect(page.getByRole('textbox', { name: 'Banner title', exact: true })).toHaveCSS(
    'padding',
    '10px 12px',
  );

  await navigation.getByRole('link', { name: 'Consent records', exact: true }).click();
  await expect(page.getByRole('table')).toHaveCSS('border-collapse', 'collapse');
  await expect(page.getByRole('columnheader').first()).toHaveCSS('font-size', '9px');

  await navigation.getByRole('link', { name: 'Integrations', exact: true }).click();
  await expect(page.getByTestId('integration-logo')).toHaveCount(8);
  await expect(page.getByTestId('integration-logo').first()).toHaveCSS('width', '40px');

  const settings = page.getByRole('navigation', { name: 'Workspace settings' });
  await settings.getByRole('link', { name: 'Billing', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Billing', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Current demo plan/ })).toHaveCSS(
    'font-size',
    '14px',
  );

  await settings.getByRole('link', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveCSS(
    'border-radius',
    '6px',
  );
  await expect(
    page.getByRole('heading', { name: 'Environment status', exact: true }),
  ).toBeVisible();
});

test('preserves the mobile consent demo layout and preference controls', async ({
  page,
  request,
}) => {
  const created = await request.post('/api/projects', {
    data: { name: 'Tailwind demo ' + Date.now(), domain: 'layout-demo.example' },
  });
  expect(created.ok()).toBe(true);
  const project = await created.json();
  const published = await request.post(`/api/projects/${project.id}/publish`, { data: {} });
  expect(published.ok()).toBe(true);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo?project=' + project.id);
  await page.getByRole('button', { name: 'Reject optional', exact: true }).click();
  await expect(page.getByRole('heading', { name: /A little space/ })).toHaveCSS(
    'font-size',
    '49px',
  );
  await expect(page.locator('main')).toHaveCSS('padding', '60px 22px');
  const preferences = page.getByRole('button', { name: 'Manage my preferences', exact: true });
  await expect(preferences).toHaveCSS('font-size', '11px');
  await expect(preferences).toHaveCSS('background-color', 'rgb(67, 59, 202)');
  await expect(page.getByTestId('analytics-status')).toHaveText('Blocked');
  await preferences.click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
