import { expect, test } from '@playwright/test';

test('public home exposes pricing, source, and local authentication links', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    /Collect consent\.\s*Block the rest\./,
  );
  await expect(page.getByRole('link', { name: 'Log In', exact: true })).toHaveAttribute(
    'href',
    '/sign-in',
  );
  await expect(page.getByRole('link', { name: 'Sign Up', exact: true })).toHaveAttribute(
    'href',
    '/sign-up',
  );
  await expect(page.getByRole('link', { name: /View GitHub/ })).toHaveAttribute(
    'href',
    'https://github.com/tectune-studio/accordly',
  );
  const pricingLink = page.getByRole('link', { name: 'Pricing', exact: true });
  await expect(pricingLink).toHaveAttribute('href', '#pricing');
  await pricingLink.click();
  await expect(page).toHaveURL(/\/#pricing$/);
  const pricing = page.locator('#pricing');
  await pricing.getByRole('button', { name: /^Currency:/ }).click();
  await pricing.getByRole('option', { name: 'US Dollar ($)', exact: true }).click();

  const plans = [
    { name: 'Starter', monthly: '$12', yearlyMonthly: '$10', annual: '$120', muv: '25,000' },
    { name: 'Pro', monthly: '$49', yearlyMonthly: '$40.83', annual: '$490', muv: '150,000' },
    {
      name: 'Business',
      monthly: '$149',
      yearlyMonthly: '$124.17',
      annual: '$1,490',
      muv: '750,000',
    },
  ];
  const card = (name: string) =>
    pricing.getByRole('article').filter({ has: page.getByRole('heading', { name, exact: true }) });
  const monthly = pricing.getByRole('button', { name: 'Monthly', exact: true });
  const yearly = pricing.getByRole('button', { name: 'Yearly', exact: true });
  await expect(pricing.getByRole('article')).toHaveCount(4);
  await expect(monthly).toHaveAttribute('aria-pressed', 'true');
  await expect(yearly).toHaveAttribute('aria-pressed', 'false');
  for (const plan of plans) {
    await expect(card(plan.name).getByRole('heading')).toBeVisible();
    await expect(card(plan.name).locator('[data-price]')).toHaveText(`${plan.monthly} per month`);
    await expect(card(plan.name).getByText('Billed monthly', { exact: true })).toBeVisible();
    await expect(
      card(plan.name).getByText(`${plan.muv} MUV per month`, { exact: true }),
    ).toBeVisible();
    await expect(card(plan.name).getByRole('link', { name: 'Explore Features' })).toHaveAttribute(
      'href',
      '#features',
    );
  }
  const agency = card('Agency');
  await expect(agency.getByRole('heading')).toBeVisible();
  await expect(agency.locator('[data-price]')).toHaveText('$199 per month');
  await expect(agency.getByText('From', { exact: true })).toBeVisible();
  await expect(agency.getByText('Custom visitor allowance', { exact: true })).toBeVisible();
  await expect(agency.getByText('Plus per-project rates. Annual terms by quote.')).toBeVisible();

  await yearly.click();
  await expect(yearly).toHaveAttribute('aria-pressed', 'true');
  await expect(monthly).toHaveAttribute('aria-pressed', 'false');
  for (const plan of plans) {
    await expect(card(plan.name).locator('[data-price]')).toHaveText(
      `${plan.yearlyMonthly} per month`,
    );
    await expect(
      card(plan.name).getByText(`Billed yearly at ${plan.annual}`, { exact: true }),
    ).toBeVisible();
    await expect(card(plan.name).getByText('2 months free', { exact: true })).toBeVisible();
    await expect(
      card(plan.name).getByText(`${plan.muv} MUV per month`, { exact: true }),
    ).toBeVisible();
  }
  await expect(agency.locator('[data-price]')).toHaveText('$199 per month');
  await expect(agency.getByText('Plus per-project rates. Annual terms by quote.')).toBeVisible();
  await expect(agency.getByText('Custom visitor allowance', { exact: true })).toBeVisible();

  await monthly.click();
  for (const plan of plans) {
    await expect(card(plan.name).locator('[data-price]')).toHaveText(`${plan.monthly} per month`);
    await expect(card(plan.name).getByText('Billed monthly', { exact: true })).toBeVisible();
    await expect(card(plan.name).getByText('2 months free', { exact: true })).toHaveCount(0);
  }
});

test('landing preview works and dashboard remains separate', async ({ page }) => {
  await page.goto('/');
  const preview = page.locator('[data-consent-card]');
  const necessary = preview.getByRole('checkbox', { name: 'Necessary cookies', exact: true });
  const analytics = preview.getByRole('checkbox', { name: 'Analytical cookies', exact: true });
  const advertising = preview.getByRole('checkbox', {
    name: 'Advertising/profiling cookies',
    exact: true,
  });
  await expect(preview.getByRole('status')).toHaveText('↳ Try it. This is an interactive preview.');
  await preview.getByRole('button', { name: 'Reject', exact: true }).click();
  await expect(preview.getByRole('status')).toHaveText('✓ Optional categories rejected');
  await preview.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(necessary).toBeChecked();
  await expect(necessary).toBeDisabled();
  await expect(analytics).not.toBeChecked();
  await expect(advertising).not.toBeChecked();
  await analytics.check();
  await preview.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(preview.getByRole('status')).toHaveText('✓ Custom Preferences saved');
  await expect(preview.getByRole('checkbox')).toHaveCount(0);
  await preview.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(analytics).toBeChecked();
  await expect(advertising).not.toBeChecked();
  await preview.getByRole('button', { name: 'Accept', exact: true }).click();
  await expect(preview.getByRole('status')).toHaveText('✓ All optional categories accepted');
  await expect(preview.getByRole('checkbox')).toHaveCount(0);
  await preview.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(necessary).toBeChecked();
  await expect(analytics).toBeChecked();
  await expect(advertising).toBeChecked();
  await preview.getByRole('button', { name: 'Reject', exact: true }).click();
  await expect(preview.getByRole('status')).toHaveText('✓ Optional categories rejected');
  await preview.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(necessary).toBeChecked();
  await expect(analytics).not.toBeChecked();
  await expect(advertising).not.toBeChecked();

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
    const layout = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: innerWidth,
      overflowing: Array.from(document.querySelectorAll('body *'))
        .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
        .map((element) => ({
          tag: element.tagName,
          class: element.className,
          right: element.getBoundingClientRect().right,
        }))
        .slice(0, 15),
    }));
    expect(layout.width, JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport);
  });
}
