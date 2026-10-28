import { test, expect } from '@playwright/test';

test('project clients can enter directly, inspect shared work and send a brief', async ({ page }) => {
  const response = await page.goto('/projects');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Have a feature in mind?');
  for (const id of ['services', 'examples', 'process', 'contact']) await expect(page.locator(`#${id}`)).toHaveCount(1);
  await page.locator('.hero').getByRole('link', { name: 'Discuss your project' }).click();
  await expect(page.locator('#contact')).toBeInViewport();
  for (const action of ['Discuss a feature', 'Discuss an integration', 'Discuss a fix']) {
    await page.goto('/projects#services');
    await page.locator('#services').getByRole('link', { name: action, exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Tell me about your project.' })).toBeInViewport();
    await expect(page.locator('#contact a.button')).toBeInViewport();
  }
  const href = await page.locator('#contact a.button').getAttribute('href') ?? '';
  expect(href).toContain('subject=Project%20inquiry');
  expect(href).toContain('%0D%0A');
  expect(href).not.toContain('+');
  const email = new URL(href);
  expect(email.protocol).toBe('mailto:');
  expect(email.pathname).toBe('parayno.alexander.m@gmail.com');
  expect(email.searchParams.get('subject')).toBe('Project inquiry');
  expect(email.searchParams.get('body')).toContain('What needs help:');
  for (const slug of ['primis', 'cinepop']) {
    await page.goto('/projects#examples');
    await page.locator(`#examples a[href="/work/${slug}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/work/${slug}/?$`));
    await page.locator('.case-next').getByRole('link', { name: 'Discuss a project' }).click();
    await expect(page).toHaveURL(/\/projects\/?#contact$/);
  }
});

test('visitors can switch entry pages without a mode selector', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Project help' }).click();
  await expect(page).toHaveURL(/\/projects\/?$/);
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Full-time portfolio' }).click();
  await expect(page).toHaveURL('/');
});

test('the project page works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/projects');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Have a feature in mind?');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Contact', exact: true }).click();
  await expect(page.locator('#contact')).toBeInViewport();
  await expect(page.locator('#contact a.button')).toHaveAttribute('href', /^mailto:/);
  await context.close();
});
