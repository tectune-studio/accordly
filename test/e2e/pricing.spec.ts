import { test, expect } from '@playwright/test';

test('billing shows four plans and annual totals without changing monthly allowances', async ({
  page,
}) => {
  await page.goto('/billing');
  const plans = [
    {
      name: 'Starter',
      monthly: '$12',
      annual: '$120',
      savings: '$24',
      domains: '1 domain',
      muv: '25,000 MUV',
      retention: '12-month consent logs',
    },
    {
      name: 'Pro',
      monthly: '$49',
      annual: '$490',
      savings: '$98',
      domains: '3 domains',
      muv: '150,000 MUV',
      retention: '24-month consent logs',
    },
    {
      name: 'Business',
      monthly: '$149',
      annual: '$1,490',
      savings: '$298',
      domains: '10 domains + subdomains',
      muv: '750,000 MUV',
      retention: '36-month consent logs',
    },
  ];
  const card = (name: string) =>
    page.getByRole('article').filter({ has: page.getByRole('heading', { name, exact: true }) });
  const interval = page.getByRole('group', { name: 'Billing interval' });
  const monthly = interval.getByRole('button', { name: 'Monthly', exact: true });
  const annual = interval.getByRole('button', { name: 'Annual — 2 months free', exact: true });
  await expect(page.getByRole('article')).toHaveCount(4);
  await expect(monthly).toHaveAttribute('aria-pressed', 'true');
  await expect(annual).toHaveAttribute('aria-pressed', 'false');
  for (const plan of plans) {
    await expect(card(plan.name).getByRole('heading')).toBeVisible();
    await expect(card(plan.name).locator('p').first()).toHaveText(`${plan.monthly}/month`);
    await expect(card(plan.name).getByText(plan.domains, { exact: true })).toBeVisible();
    await expect(card(plan.name).getByText(plan.muv, { exact: true })).toBeVisible();
    await expect(card(plan.name).getByText(plan.retention, { exact: true })).toBeVisible();
  }
  const agency = card('Agency');
  await expect(agency.getByRole('heading')).toBeVisible();
  await expect(agency.locator('p').first()).toHaveText('From $199/month + per-project fees');
  await expect(agency.getByText('Unlimited client projects', { exact: true })).toHaveCount(2);
  await expect(
    agency.getByText('Usage allowance agreed in your quote', { exact: true }),
  ).toBeVisible();
  await expect(agency.getByText('Custom consent log retention', { exact: true })).toBeVisible();
  await expect(
    agency.getByRole('button', { name: 'Custom quote required', exact: true }),
  ).toBeDisabled();

  await annual.click();
  await expect(annual).toHaveAttribute('aria-pressed', 'true');
  await expect(monthly).toHaveAttribute('aria-pressed', 'false');
  for (const plan of plans) {
    await expect(card(plan.name).locator('p').first()).toHaveText(`${plan.annual}/year`);
    await expect(
      card(plan.name).getByText(
        `Billed annually. Save ${plan.savings}/year. MUV allowance resets monthly.`,
        { exact: true },
      ),
    ).toBeVisible();
    await expect(card(plan.name).getByText(plan.domains, { exact: true })).toBeVisible();
    await expect(card(plan.name).getByText(plan.muv, { exact: true })).toBeVisible();
    await expect(card(plan.name).getByText(plan.retention, { exact: true })).toBeVisible();
  }
  await expect(agency.locator('p').first()).toHaveText('From $199/month + per-project fees');
  await expect(
    agency.getByText('Usage allowance agreed in your quote', { exact: true }),
  ).toBeVisible();
  await expect(
    agency.getByRole('button', { name: 'Custom quote required', exact: true }),
  ).toBeDisabled();

  await monthly.click();
  for (const plan of plans) {
    await expect(card(plan.name).locator('p').first()).toHaveText(`${plan.monthly}/month`);
    await expect(card(plan.name).getByText(/Billed annually/)).toHaveCount(0);
    await expect(card(plan.name).getByText(plan.muv, { exact: true })).toBeVisible();
  }
});
