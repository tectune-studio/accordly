import { expect, test } from '@playwright/test';

for (const width of [375, 1440]) {
  for (const reducedMotion of ['reduce', 'no-preference'] as const) {
    test(`landing header follows scroll direction at ${width}px with ${reducedMotion}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion });
      await page.goto('/');
      const header = page.locator('[data-landing-header]');
      await expect(header).toHaveAttribute('data-hidden', 'false');
      // An interactive client island confirms hydration before we start scrolling.
      await page
        .locator('[data-hero]')
        .getByRole('button', { name: 'Reject', exact: true })
        .click();
      await expect(page.getByRole('status')).toContainText('rejected');
      await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'instant' }));
      await expect(header).toHaveAttribute('data-hidden', 'true');
      await expect
        .poll(() => header.evaluate((element) => element.getBoundingClientRect().bottom))
        .toBeLessThanOrEqual(1);
      await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
      await expect(header).toHaveAttribute('data-hidden', 'false');
      await expect
        .poll(() => header.evaluate((element) => element.getBoundingClientRect().top))
        .toBe(0);
      await page.evaluate(() => window.scrollTo({ top: 1000, behavior: 'instant' }));
      await expect(header).toHaveAttribute('data-hidden', 'true');
      await header.getByRole('link', { name: 'Product', exact: true }).focus();
      await expect(header).toHaveAttribute('data-hidden', 'false');
      await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }));
      await expect(header).toHaveAttribute('data-hidden', 'false');
      await page.evaluate(() => {
        (document.activeElement as HTMLElement)?.blur();
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
      await expect(header).toHaveAttribute('data-hidden', 'false');
      if (reducedMotion === 'reduce') {
        await expect(header).toHaveCSS('transition-duration', '0s');
      }
    });
  }
}
