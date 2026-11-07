import { expect, test } from '@playwright/test';

test('landing content and metadata are present without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Collect consent.');
  await expect(page.getByText('A real choice. Every time.', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'We value your privacy.', exact: true }),
  ).toBeVisible();
  await expect(page.locator('meta[name="keywords"]')).toHaveAttribute('content', /cookie consent/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Accordly/);
  const structuredData = JSON.parse(
    (await page.locator('#landing-structured-data').textContent()) ?? '{}',
  );
  expect(structuredData['@graph'].map((entity: { '@type': string }) => entity['@type'])).toContain(
    'SoftwareApplication',
  );
  await context.close();
});

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`landing hydrates cleanly with ${reducedMotion} motion`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.emulateMedia({ reducedMotion });
    await page.goto('/');
    const preview = page.locator('[data-hero]');
    const analytics = preview.getByRole('checkbox', { name: 'Analytical cookies', exact: true });
    const advertising = preview.getByRole('checkbox', {
      name: 'Advertising/profiling cookies',
      exact: true,
    });
    const necessary = preview.getByRole('checkbox', { name: 'Necessary cookies', exact: true });
    await preview.getByRole('button', { name: 'Edit', exact: true }).click();
    await analytics.check();
    await preview.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(preview.getByRole('status')).toHaveText('✓ Custom Preferences saved');
    await preview.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(analytics).toBeChecked();
    await expect(advertising).not.toBeChecked();
    await expect(necessary).toBeChecked();
    await expect(necessary).toBeDisabled();
    await preview.getByRole('button', { name: 'Accept', exact: true }).click();
    await expect(preview.getByRole('status')).toHaveText('✓ All optional categories accepted');
    await preview.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(analytics).toBeChecked();
    await expect(advertising).toBeChecked();
    await page.locator('#product').scrollIntoViewIfNeeded();
    await expect(page.getByText('A real choice. Every time.', { exact: true })).toBeVisible();
    await page.emulateMedia({
      reducedMotion: reducedMotion === 'reduce' ? 'no-preference' : 'reduce',
    });
    await preview.getByRole('button', { name: 'Reject', exact: true }).click();
    await expect(preview.getByRole('status')).toHaveText('✓ Optional categories rejected');
    await preview.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(analytics).not.toBeChecked();
    await expect(advertising).not.toBeChecked();
    await expect(necessary).toBeChecked();
    expect(
      errors.filter((error) => /hydrat|didn't match|server rendered|server-rendered/i.test(error)),
    ).toEqual([]);
    expect(errors.filter((error) => /TypeError|ReferenceError/.test(error))).toEqual([]);
  });
}
