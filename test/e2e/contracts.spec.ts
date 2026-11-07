import { test, expect } from '@playwright/test';
test('v1 SDK lazily loads UI, gates DOM elements, persists secure cookies and ingests idempotent events', async ({
  page,
  request,
  context,
}) => {
  const created = await request.post('/api/projects', {
    data: { name: 'Contract test ' + Date.now(), domain: 'contract.example' },
  });
  expect(created.ok()).toBe(true);
  const project = await created.json();
  await request.post(`/api/projects/${project.id}/publish`, { data: {} });
  const config = await (await request.get(`/api/v1/config/${project.id}`)).json();
  expect(config.schemaVersion).toBe(1);
  await page.goto('/dashboard');
  let uiRequests = 0;
  page.on('request', (r) => {
    if (r.url().endsWith('/ui.js')) uiRequests++;
  });
  await page.evaluate(async (config) => {
    const w = window as any;
    w.events = [];
    const script = document.createElement('script');
    script.type = 'text/plain';
    script.dataset.consentCategory = 'analytics';
    script.textContent = 'window.__activated=(window.__activated||0)+1';
    document.head.append(script);
    const frame = document.createElement('iframe');
    frame.id = 'gated-frame';
    frame.dataset.src = '/api/state?frame=true';
    frame.dataset.consentCategory = 'marketing';
    document.body.append(frame);
    const sdkUrl = new URL('/api/sdk/0.2.0/consent.js', window.location.origin);
    const sdk = await import(/* webpackIgnore: true */ sdkUrl.href);
    w.cmp = sdk
      .createConsentManager({ config, onEvent: (e: unknown) => w.events.push(e) })
      .initialize();
  }, config);
  expect(uiRequests).toBe(0);
  expect(await page.evaluate(() => (window as any).__activated || 0)).toBe(0);
  await expect(page.locator('#gated-frame')).not.toHaveAttribute('src');
  await page.evaluate(() => (window as any).cmp.showPreferences());
  expect(uiRequests).toBe(1);
  await expect(page.getByRole('checkbox', { name: /Analytics/ })).not.toBeChecked();
  await page.getByRole('button', { name: 'Accept all', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__activated)).toBe(1);
  await expect(page.locator('#gated-frame')).toHaveAttribute('src', '/api/state?frame=true');
  const cookie = (await context.cookies()).find(
    (c) => c.name === encodeURIComponent('accordly:' + project.id),
  );
  expect(cookie?.secure).toBe(true);
  expect(cookie?.sameSite).toBe('Lax');
  const event = await page.evaluate(() => (window as any).events[0]);
  expect(event.configHash).toBe(config.configHash);
  const first = await request.post('/api/v1/events', { data: event });
  expect(first.status()).toBe(202);
  const retry = await request.post('/api/v1/events', { data: event });
  expect((await retry.json()).duplicate).toBe(true);
  expect(
    (await request.post('/api/v1/events', { data: { ...event, rawIp: '192.0.2.1' } })).status(),
  ).toBe(400);
  expect(
    (
      await request.post('/api/v1/events', { data: { ...event, configHash: 'f'.repeat(64) } })
    ).status(),
  ).toBe(400);
  await page.evaluate(() => (window as any).cmp.withdraw());
  await expect(page.locator('#gated-frame')).not.toHaveAttribute('src');
  expect(await page.evaluate(() => (window as any).__activated)).toBe(1);
});

test('classic loader sets denied Google defaults before the following head script', async ({
  page,
}) => {
  await page.route('**/loader-order-check', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html><head><script src="/api/sdk/0.2.0/loader.js"></script><script>window.observedDefaults = Array.from(window.dataLayer[0]);</script></head><body>Loader ordering</body></html>',
    }),
  );
  await page.goto('/loader-order-check');
  const defaults = await page.evaluate(() => (window as any).observedDefaults);
  expect(defaults[0]).toBe('consent');
  expect(defaults[1]).toBe('default');
  expect(defaults[2]).toEqual({
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500,
  });
});
