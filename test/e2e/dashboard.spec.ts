import { test, expect } from '@playwright/test';

test('creates a project, saves drafts, publishes and restores versions through extracted views', async ({
  page,
  request,
}) => {
  const name = 'Dashboard refactor ' + Date.now();
  await page.setViewportSize({ width: 1440, height: 2400 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.getByRole('textbox', { name: 'Project name', exact: true }).fill(name);
  await page.getByRole('textbox', { name: 'Website domain', exact: true }).fill('refactor.example');
  await page.getByRole('button', { name: 'Create project →', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Banner Studio', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const projectId = await page
    .getByRole('combobox', { name: 'Select project', exact: true })
    .inputValue();

  const title = page.getByRole('textbox', { name: 'Banner title', exact: true });
  const save = page.getByRole('button', { name: 'Save draft', exact: true });
  await title.fill('A refactored consent experience');
  await save.click();
  await expect(page.getByRole('status')).toContainText('Draft saved');
  await expect(save).toBeDisabled();
  await page.getByRole('button', { name: 'Publish banner', exact: false }).click();
  await expect(page.getByRole('status')).toContainText('Your consent experience is published.');
  const firstConfig = await (await request.get(`/api/public/${projectId}/current`)).json();
  expect(firstConfig.title).toBe('A refactored consent experience');

  await title.fill('A second immutable version');
  await page.getByRole('button', { name: 'Publish banner', exact: false }).click();
  await expect(page.getByRole('status')).toContainText('Your consent experience is published.');
  await expect(page.getByRole('button', { name: 'Restore version', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Restore version', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Previous release restored');
  const restored = await (await request.get(`/api/public/${projectId}/current`)).json();
  expect(restored.title).toBe(firstConfig.title);
  await expect(title).toHaveValue('A second immutable version');

  await page
    .getByRole('navigation', { name: 'Workspace navigation' })
    .getByRole('link', { name: 'Projects', exact: true })
    .click();
  await page.getByRole('textbox', { name: 'Search projects', exact: true }).fill(name);
  await page.getByRole('button', { name: 'Manage project', exact: false }).click();
  await expect(page.getByRole('combobox', { name: 'Select project', exact: true })).toHaveValue(
    projectId,
  );
});
