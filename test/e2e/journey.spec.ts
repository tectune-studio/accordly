import { test, expect } from '@playwright/test';
let projectId: string;
let firstRelease: string;
test.describe.serial('local product workflow', () => {
  test('create, edit, publish and retrieve a project', async ({ page, request }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Good things start with trust.' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Create project', exact: true }).click();
    await page.getByLabel('Project name').fill('Browser test ' + Date.now());
    await page.getByLabel('Website domain').fill('browser.example');
    await page.getByRole('button', { name: 'Create project →' }).click();
    await expect(page.getByRole('heading', { name: 'Banner Studio', exact: true })).toBeVisible();
    await page.getByLabel('Banner title').fill('Your choice comes first.');
    await page.getByRole('button', { name: 'Publish banner' }).click();
    await expect(page.getByText('Your consent experience is published.')).toBeVisible();
    const state = await (await request.get('/api/state')).json();
    const p = state.projects.at(-1);
    projectId = p.id;
    firstRelease = p.activeRelease;
    const config = await request.get(`/api/public/${projectId}/current`);
    expect(config.status()).toBe(200);
    expect((await config.json()).title).toBe('Your choice comes first.');
    const sdk = await request.get('/api/sdk/0.1.0/consent.js');
    expect(sdk.status()).toBe(200);
    expect(await sdk.text()).toContain('export function createConsentManager');
  });
  test('browser blocks before consent, persists choices and stops after withdrawal', async ({
    page,
    request,
  }) => {
    await page.goto('/demo?project=' + projectId);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByTestId('analytics-status')).toHaveText('Blocked');
    await expect(page.getByTestId('marketing-status')).toHaveText('Blocked');
    await page.getByRole('button', { name: 'Reject optional', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByTestId('analytics-status')).toHaveText('Blocked');
    await expect(page.getByRole('status')).toHaveText(
      'Receipt stored. View it in Consent records.',
    );
    await page.getByRole('button', { name: 'Manage my preferences' }).click();
    await page.getByRole('checkbox', { name: /Analytics/ }).check();
    await page.getByRole('button', { name: 'Save preferences', exact: true }).click();
    await expect(page.getByTestId('analytics-status')).toHaveText('Running');
    await expect(page.getByTestId('marketing-status')).toHaveText('Blocked');
    await expect(page.getByRole('status')).toHaveText(
      'Receipt stored. View it in Consent records.',
    );
    await page.reload();
    await expect(page.getByTestId('analytics-status')).toHaveText('Running');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await page.getByRole('button', { name: 'Manage my preferences' }).click();
    await page.getByRole('button', { name: 'Accept all', exact: true }).click();
    await expect(page.getByTestId('marketing-status')).toHaveText('Running');
    await expect(page.getByRole('status')).toHaveText(
      'Receipt stored. View it in Consent records.',
    );
    await page.getByRole('button', { name: 'Withdraw optional consent' }).click();
    await expect(page.getByTestId('analytics-status')).toHaveText('Blocked');
    await expect(page.getByTestId('marketing-status')).toHaveText('Blocked');
    await expect(page.getByRole('status')).toHaveText(
      'Receipt stored. View it in Consent records.',
    );
    const state = await (await request.get('/api/state')).json();
    const receipts = state.receipts.filter((r: any) => r.projectId === projectId);
    expect(receipts.map((r: any) => r.action)).toEqual([
      'withdraw',
      'accept',
      'customize',
      'reject',
    ]);
    const duplicate = await request.post('/api/receipts', { data: receipts[0] });
    expect(duplicate.status()).toBe(202);
    expect((await duplicate.json()).duplicate).toBe(true);
  });
  test('publication keeps old versions intact and supports rollback', async ({ request, page }) => {
    let state = await (await request.get('/api/state')).json();
    const p = state.projects.find((p: any) => p.id === projectId);
    expect(
      (
        await request.post(`/api/projects/${projectId}/draft`, {
          data: { ...p.draft, title: 'A new version' },
        })
      ).status(),
    ).toBe(200);
    const release = await (
      await request.post(`/api/projects/${projectId}/publish`, { data: {} })
    ).json();
    expect(release.id).not.toBe(firstRelease);
    expect(
      (await (await request.get(`/api/public/${projectId}/${firstRelease}`)).json()).title,
    ).toBe('Your choice comes first.');
    expect((await (await request.get(`/api/public/${projectId}/current`)).json()).title).toBe(
      'A new version',
    );
    await request.post(`/api/projects/${projectId}/rollback`, {
      data: { releaseId: firstRelease },
    });
    expect((await (await request.get(`/api/public/${projectId}/current`)).json()).version).toBe(
      firstRelease,
    );
    await page.goto('/');
    await page.getByRole('link', { name: 'Consent records', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Consent records', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Withdraw', exact: true }).first()).toBeVisible();
    const exported = await request.get('/api/export');
    expect(exported.headers()['content-disposition']).toContain('attachment');
    expect((await exported.json()).receipts.length).toBeGreaterThanOrEqual(4);
  });
  test('invalid receipts, unsafe config and cross-origin writes are rejected', async ({
    request,
  }) => {
    const before = await (await request.get('/api/state')).json();
    const receipt = before.receipts.find((r: any) => r.projectId === projectId);
    expect(
      (
        await request.post('/api/receipts', {
          data: {
            ...receipt,
            receiptId: crypto.randomUUID(),
            choices: { necessary: false, analytics: true, marketing: true },
          },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await request.post('/api/projects', {
          headers: { Origin: 'https://attacker.example' },
          data: { name: 'Bad', domain: 'bad.example' },
        })
      ).status(),
    ).toBe(400);
    const p = before.projects.find((p: any) => p.id === projectId);
    expect(
      (
        await request.post(`/api/projects/${projectId}/draft`, {
          data: { ...p.draft, privacyUrl: 'javascript:alert(1)' },
        })
      ).status(),
    ).toBe(400);
  });
  test('responsive navigation and simulated billing are usable', async ({ page, request }) => {
    await request.post('/api/billing', { data: { plan: 'free' } });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Good things start with trust.' }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('link', { name: 'Billing', exact: true }).click();
    await expect(page.getByText('Explore plans in demo mode.')).toBeVisible();
    await page.getByRole('button', { name: 'Try Starter in demo' }).click();
    await expect(page.getByText('Demo plan changed. No payment was taken.')).toBeVisible();
  });
});
