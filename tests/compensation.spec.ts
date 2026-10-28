import { test, expect, type Locator } from '@playwright/test';

const route = '/work/primis#compensation';
const examples = [
  ['2026-05-31', 'No rate effective yet', null],
  ['2026-06-10', 'Rate A', '100.00'],
  ['2026-06-15', 'Rate A', '100.00'],
  ['2026-06-16', 'Rate B', '120.00'],
  ['2026-06-20', 'Rate B', '120.00'],
] as const;

async function expectWorkedExample(demo: Locator) {
  const table = demo.getByRole('table', { name: 'Two payable workdays · fictional units' });
  await expect(table).toBeVisible();
  await expect(table.getByRole('columnheader')).toHaveCount(5);
  await expect(table.locator('tbody tr')).toHaveCount(2);
  await expect(table.locator('tbody tr').nth(0).locator('th,td')).toHaveText(['15 June 2026', 'A', '100.00', '1', '100.00']);
  await expect(table.locator('tbody tr').nth(1).locator('th,td')).toHaveText(['16 June 2026', 'B', '120.00', '1', '120.00']);
  await expect(table.locator('tfoot th, tfoot td')).toHaveText(['Example total', '2', '220.00']);
  await expect(demo.locator('[data-counterexample]')).toContainText('240.00');
  await expect(demo.locator('[data-counterexample]')).toContainText('220.00');
  await expect(demo.getByRole('heading', { name: 'How the rate is chosen' })).toBeVisible();
  await expect(demo.locator('.demo-heading')).toContainText('Fictional dates and amounts');
  await expect(demo.locator('.demo-heading')).toContainText('Taxes and deductions are excluded.');
}

test('effective-date lookup computes boundary results without rewriting the saved record', async ({ page }) => {
  await page.goto(route);
  const demo = page.locator('[data-compensation]');
  const date = demo.getByRole('combobox', { name: 'Work date' });
  const result = demo.locator('[data-result]');
  const saved = demo.locator('[data-saved-record]');
  await expect(demo).toHaveCount(1);
  await expect(date.locator('option')).toHaveCount(5);
  await expect(date).toHaveValue('2026-06-10');
  const original = await saved.innerText();
  expect(original).toContain('10 June 2026');
  expect(original).toContain('Rate A');
  for (const [value, expected, amount] of [...examples, examples[4], examples[1]]) {
    await date.selectOption(value);
    await expect(result).toContainText(expected);
    if (amount) await expect(result).toContainText(`${amount} units per payable day`);
    else await expect(result).not.toContainText(/\d+\.\d{2}/);
    expect(await saved.innerText()).toBe(original);
  }
  await expect(result).toContainText('2026');
  await expect(demo).toContainText('Independent example');
  await expect(demo.locator('button[aria-pressed]')).toHaveCount(0);
});

test('worked amounts use each work date and total integer hundredths', async ({ page }) => {
  await page.goto(route);
  const demo = page.locator('[data-compensation]');
  await expectWorkedExample(demo);
  const amounts = await demo.locator('[data-version]').evaluateAll(nodes => nodes.map(node => Number((node as HTMLElement).dataset.amountHundredths)));
  expect(amounts).toEqual([10000, 12000]);
  expect(amounts.reduce((total, value) => total + value, 0)).toBe(22000);
  await demo.getByRole('combobox').selectOption('2026-06-20');
  await expectWorkedExample(demo);
});

test('the independent example exposes its real date-rule source and expected checks', async ({ page }) => {
  await page.goto(route);
  const sample = page.locator('#date-rule-source');
  await sample.getByText('Read the date-rule code', { exact: true }).click();
  await expect(sample.locator('code')).toBeVisible();
  await expect(sample.locator('code')).toContainText('export function rateForDate');
  await expect(sample).toContainText('Independent portfolio code');
  await expect(page.getByRole('status')).toHaveAttribute('aria-live', 'polite');
});

test('unexpected programmatic input cannot produce a valid-looking rate', async ({ page }) => {
  await page.goto(route);
  const date = page.getByRole('combobox', { name: 'Work date' });
  await date.evaluate(select => {
    if (!(select instanceof HTMLSelectElement)) throw new Error('Expected native select');
    const option = new Option('Unexpected date', '2026-06-99');
    select.append(option);
    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('[data-result]')).toHaveText('Choose one of the example dates.');
});

test('native select keyboard keeps focus and updates the result', async ({ page, browserName }) => {
  await page.goto(route);
  const date = page.getByRole('combobox', { name: 'Work date' });
  await date.focus();
  // Native type-ahead works across the target engines, including macOS select popups.
  await date.press('2');
  await expect(date).toHaveValue('2026-06-20');
  await expect(date).toBeFocused();
  await expect(page.locator('[data-result]')).toContainText('Rate B');
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(date).not.toBeFocused();
});

for (const blocked of [false, true]) {
  test(`${blocked ? 'blocked scripts' : 'no JavaScript'} leave complete examples without inert controls`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: blocked });
    if (blocked) await context.route('**/*', async route => {
      if (route.request().resourceType() !== 'document') return route.continue();
      const response = await route.fetch();
      await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': "script-src 'none'" } });
    });
    const page = await context.newPage();
    await page.goto(route);
    const demo = page.locator('[data-compensation]');
    await expect(demo.getByRole('combobox')).toHaveCount(0);
    await expect(demo.locator('[data-fallback]')).toBeVisible();
    await expect(demo.locator('[data-fallback]')).toContainText('15 June 2026 → Rate A');
    await expect(demo.locator('[data-fallback]')).toContainText('16 June 2026 → Rate B');
    await expect(demo.locator('[data-saved-record]')).toContainText('Rate A');
    await expectWorkedExample(demo);
    await expect(page.getByRole('link', { name: 'Back to selected work' })).toBeVisible();
    await context.close();
  });
}

test('reduced motion keeps date feedback immediate', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route);
  const date = page.getByRole('combobox', { name: 'Work date' });
  await date.selectOption('2026-06-20');
  await expect(page.locator('[data-result]')).toContainText('Rate B');
  expect(await date.evaluate(e => getComputedStyle(e).transitionDuration)).toBe('0s');
});

test('touch can reach the native date control and choose a result', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(route);
  const date = page.getByRole('combobox', { name: 'Work date' });
  await date.tap();
  await date.selectOption('2026-06-20');
  await expect(page.locator('[data-result]')).toContainText('Rate B');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});
