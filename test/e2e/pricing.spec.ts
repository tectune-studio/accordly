import { test, expect } from '@playwright/test';

test('pricing shows the six plans and annual totals without changing monthly allowances', async ({
  page,
}) => {
  await page.goto('/billing');
  for (const name of ['Cloud Free', 'Starter', 'Pro', 'Business', 'Agency', 'Enterprise'])
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  const starter = page
    .locator('article')
    .filter({ has: page.getByRole('heading', { name: 'Starter', exact: true }) });
  await expect(starter).toContainText('$12');
  await expect(starter).toContainText('25,000 MUV');
  await page.getByRole('button', { name: 'Annual — 2 months free' }).click();
  await expect(starter).toContainText('$120');
  await expect(starter).toContainText('Save $24/year');
  await expect(starter).toContainText('25,000 MUV');
  await expect(
    page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: 'Pro', exact: true }) }),
  ).toContainText('$490');
  await expect(
    page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: 'Business', exact: true }) }),
  ).toContainText('$1,490');
});
