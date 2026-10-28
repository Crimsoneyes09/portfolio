import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
for (const route of ['/', '/work/primis', '/work/cinepop', '/resume', '/projects', '/not-a-page']) {
  test(`accessible page structure and contrast: ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(results.violations).toEqual([]);
    // Decorative arrow glyph contrast needs visual review; other incomplete checks need investigation.
    expect(results.incomplete.filter(result => result.id !== 'color-contrast')).toEqual([]);
  });
}

test('all date states expose accessible controls and feedback', async ({ page }) => {
  await page.goto('/work/primis#compensation');
  for (const value of ['2026-05-31', '2026-06-16']) {
    await page.getByRole('combobox', { name: 'Work date' }).selectOption(value);
    const results = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(results.violations).toEqual([]);
  }
});
