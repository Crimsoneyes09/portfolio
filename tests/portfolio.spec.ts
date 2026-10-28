import { test, expect } from '@playwright/test';

const routes = ['/', '/work/primis', '/work/cinepop', '/resume', '/projects', '/not-a-page'];
const studies = [
  { slug: 'primis', heading: 'Payroll history and payment recovery.', next: 'cinepop' },
  { slug: 'cinepop', heading: 'Account access to protected playback.', next: 'primis' },
];

test('employment homepage leads with two professional cases and a role inquiry', async ({ page, browserName }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Alexander Parayno.');
  await expect(page.locator('.hero-role')).toContainText('Backend focus.');
  await expect(page.locator('#work article')).toHaveCount(2);
  for (const slug of ['primis', 'cinepop']) await expect(page.locator(`#work a[href="/work/${slug}"]`)).toHaveCount(1);
  for (const id of ['work', 'capabilities', 'about', 'contact']) await expect(page.locator(`#${id}`)).toHaveCount(1);
  await expect(page.locator('[data-compensation]')).toHaveCount(0);
  await expect(page.locator('#contact a[href="mailto:parayno.alexander.m@gmail.com"]')).toBeVisible();
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('hiring readers can reach a readable resume and print it without site chrome', async ({ page }) => {
  await page.goto('/');
  await page.locator('.hero').getByRole('link', { name: 'View résumé', exact: true }).click();
  await expect(page).toHaveURL(/\/resume\/?$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Alexander Parayno');
  await expect(page.getByRole('heading', { name: 'Selected professional experience' })).toBeVisible();
  await expect(page.locator('.resume-sheet')).toContainText('Coral System Technologies');
  await expect(page.locator('.resume-sheet')).toContainText('Go8 Technology');
  await expect(page.locator('.resume-sheet a[href="mailto:parayno.alexander.m@gmail.com"]')).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.site-header')).not.toBeVisible();
  await expect(page.locator('.resume-actions')).not.toBeVisible();
  await expect(page.locator('.resume-sheet')).toBeVisible();
});

test('capability links reach the specific work their labels promise', async ({ page }) => {
  for (const [name, destination, content] of [
    [/payroll/i, '/work/primis#compensation', 'work date'],
    [/CinePop/, '/work/cinepop#cinepop-walkthrough', 'Firebase Authentication'],
    [/Aurum/, '/#experience-internship', 'Aurum Platform'],
  ] as const) {
    await page.goto('/');
    await page.locator('#capabilities').getByRole('link', { name }).click();
    await expect(page).toHaveURL(destination);
    const target = page.locator(new URL(page.url()).hash);
    await expect(target).toBeInViewport();
    await expect(target).toContainText(content);
  }
});

test('employment facts agree across the homepage, resume and case studies', async ({ page }) => {
  await page.goto('/');
  const home = await page.locator('.experience-list article').evaluateAll(rows => rows.map(row => ({
    company: row.querySelector('h3')!.textContent,
    period: row.querySelector('.eyebrow')!.textContent,
    role: row.querySelector('.experience-role')!.textContent,
  })));
  expect(home.map(job => job.period)).toEqual(['December 2025 onward', 'June–October 2025', 'February–May 2025']);
  await page.goto('/resume');
  const resume = await page.locator('.resume-job').evaluateAll(rows => rows.map(row => ({
    company: row.querySelector('h3')!.textContent,
    period: row.querySelector('.resume-job-heading p')!.textContent,
    role: row.querySelector('.experience-role')!.textContent,
  })));
  expect(resume).toEqual(home);
  for (const [index, slug] of ['primis', 'cinepop'].entries()) {
    await page.goto(`/work/${slug}`);
    const context = page.locator('.case-facts > div').filter({ has: page.getByText('Context', { exact: true }) });
    await expect(context).toContainText(home[index].company!);
    await expect(context).toContainText(home[index].period!);
  }
});

for (const study of studies) {
  test(`${study.slug} is directly readable with working story and next-case navigation`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(`/work/${study.slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(study.heading);
    for (const id of ['work', 'capabilities', 'about', 'contact']) await expect(page.locator(`header a[href="/#${id}"]`)).toBeVisible();
    if (study.slug === 'primis') for (const id of ['compensation', 'attendance', 'payments']) {
      await page.locator(`a[href="#${id}"]`).click();
      await expect(page.locator(`#${id}`)).toBeInViewport();
    }
    await expect(page.getByRole('link', { name: 'Back to selected work' })).toHaveAttribute('href', '/#work');
    await expect(page.locator('.case-next a[href="/projects#contact"]')).toBeVisible();
    await page.locator(`.case-next a[href="/work/${study.next}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/work/${study.next}/?$`));
    expect(errors).toEqual([]);
  });
}

for (const route of ['/not-a-page', '/work/lighten']) {
  test(`${route} returns a useful real 404`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found.');
    await page.getByRole('link', { name: 'Return home' }).click();
    await expect(page).toHaveURL('/');
  });
}

for (const width of [320, 390, 768, 1440]) {
  test(`all retained pages reflow and expose contact at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
      await expect(page.locator('h1')).toBeVisible();
      for (const link of await page.locator('header nav a').all()) await expect(link).toBeVisible();
      await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Contact', exact: true }).click();
      await expect(page.locator('#contact')).toBeInViewport();
    }
  });
}

test('text scaling and WCAG spacing preserve content and controls', async ({ page }) => {
  for (const route of routes) {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(route);
    const originalSize = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
    await page.addStyleTag({ content: `:root{font-size:${originalSize * 2}px!important} body *{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important} p{margin-bottom:2em!important}` });
    expect(await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize))).toBe(originalSize * 2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
    for (const select of await page.locator('select').all()) {
      const size = await select.evaluate(element => {
        const style = getComputedStyle(element);
        return { height: element.getBoundingClientRect().height, needed: Math.max(parseFloat(style.lineHeight) || 0, parseFloat(style.fontSize)) + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth) };
      });
      expect(Math.round(size.height), 'enlarged select must fit its line box and padding').toBeGreaterThanOrEqual(Math.round(size.needed));
    }
    await expect(page.locator('h1')).toBeVisible();
  }
});

test('project illustrations reflow with enlarged mobile text and preserve readable amounts', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await page.addStyleTag({ content: ':root{font-size:34px!important}body *{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}' });
  for (const preview of await page.locator('.project-preview').all()) {
    expect(await preview.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  for (const amount of await page.locator('.rate-ledger strong').all()) {
    const lines = await amount.evaluate(element => { const range = document.createRange(); range.selectNodeContents(element); return range.getClientRects().length; });
    expect(lines, 'each amount must stay on one readable line').toBe(1);
  }
});

test('public content excludes academic material, unsupported metrics and private evidence paths', async ({ page }) => {
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator('body')).not.toContainText(/Lighten|Grade 4|Magna Cum Laude|STI College|GPA|Thesis|President’s Lister|TensorFlow|NLTK|spaCy|20%|\/Users\/|PORTFOLIO_BRIEF|IMPLEMENTATION_PLAN|ef8768b90/i);
    await expect(page.locator('a[download], a[href*="linkedin.com"], a[href*="github.com"]')).toHaveCount(0);
  }
});

test('local links, fragments and assets resolve without placeholders', async ({ page, request }) => {
  const checked = new Set<string>();
  for (const route of routes) {
    await page.goto(route);
    const pageURL = page.url();
    const targets = await page.locator('a[href], link[href], script[src], img[src]').evaluateAll(elements => elements.map(e => e.getAttribute('href') ?? e.getAttribute('src') ?? ''));
    for (const target of targets) {
      if (target.startsWith('mailto:')) continue;
      expect(target).not.toBe('#');
      const url = new URL(target, pageURL);
      if (['https://primis.coralsystem.net/', 'https://play.google.com/store/apps/details?id=com.aurum.platform&hl=en'].includes(url.href)) continue;
      expect(url.origin).toBe(new URL(page.url()).origin);
      if (checked.has(url.href)) continue;
      checked.add(url.href);
      expect((await request.get(url.pathname)).status(), target).toBe(url.pathname === '/not-a-page' ? 404 : 200);
      if (url.hash) {
        await page.goto(url.pathname + url.hash);
        await expect(page.locator(`[id="${decodeURIComponent(url.hash.slice(1))}"]`)).toHaveCount(1);
      }
    }
  }
});

test('case introductions lead to scoped artifacts and the real Primis product', async ({ page }) => {
  for (const [slug, anchor, label] of [
    ['primis', 'compensation-example', 'Try the rate example'],
    ['cinepop', 'cinepop-walkthrough', 'See the app integrations'],
  ]) {
    await page.goto(`/work/${slug}`);
    const header = page.locator('.case-header');
    await expect(header.locator('.contribution-scope dt')).toHaveText(['My work', 'Integrated with']);
    const artifactLink = header.getByRole('link', { name: label });
    await expect(artifactLink).toHaveAttribute('href', `#${anchor}`);
    await artifactLink.click();
    await expect(page.locator(`#${anchor}`)).toBeInViewport();
    if (slug === 'primis') await expect(header.getByRole('link', { name: 'PRIMIS product website' })).toHaveAttribute('href', 'https://primis.coralsystem.net/');
    else {
      await expect(page.locator(`#${anchor} .ownership-list > div`)).toHaveCount(3);
      await expect(page.locator(`#${anchor} figcaption`)).toContainText('Original');
      await expect(page.locator('body')).not.toContainText(/coming soon|upload evidence/i);
      await expect(page.locator('a[href*="cinepop.film"]')).toHaveCount(0);
    }
  }
});

test('payment illustration distinguishes replay, verification and delivery', async ({ page }) => {
  await page.goto('/work/primis#payments');
  await page.getByText('Read more: payment retries and safeguards', { exact: true }).click();
  const trace = page.locator('.event-trace');
  await expect(trace.locator('li')).toHaveCount(4);
  await expect(trace.locator('li').nth(0)).toContainText('not yet verified');
  await expect(trace.locator('li').nth(1)).toContainText('does not establish payment success');
  await expect(trace.locator('li').nth(2)).toContainText('verified before');
  const matrix = page.getByRole('table', { name: 'Payment safeguards' });
  await expect(matrix.getByRole('rowheader')).toHaveText(['Invoice authority', 'Verified outcomes', 'Independent retries', 'Unresolved outcomes']);
  await expect(matrix).toContainText('does not mean failed');
});

test('metadata stays unique with a healthy social asset and no fabricated domain', async ({ page }) => {
  const titles = new Set<string>(), descriptions = new Set<string>();
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toHaveCount(1);
    titles.add(await page.title());
    descriptions.add(await page.locator('meta[name="description"]').getAttribute('content') ?? '');
    await expect(page.locator('link[rel="canonical"],meta[property="og:url"],meta[property="og:image"]')).toHaveCount(0);
  }
  expect(titles.size).toBe(routes.length);
  expect(descriptions.size).toBe(routes.length);
  expect(await page.evaluate(async () => { const image = new Image(); image.src = '/social-preview.png'; await image.decode(); return [image.naturalWidth, image.naturalHeight]; })).toEqual([1200, 630]);
});

test('reading text and primary targets retain comfortable sizes', async ({ page }) => {
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      const copy = await page.locator('.reading-copy').evaluateAll(nodes => nodes.map(n => parseFloat(getComputedStyle(n).fontSize)));
      expect(copy.length, route).toBeGreaterThan(0);
      for (const size of copy) expect(size).toBeGreaterThanOrEqual(17);
      const targets = await page.locator('.site-nav a,.button,.project-link,.back-link,.story-nav a,.case-next a,.artifact-links a,select').evaluateAll(nodes => nodes.map(n => ({ text: n.textContent, width: n.getBoundingClientRect().width, height: n.getBoundingClientRect().height })));
      for (const target of targets) {
        expect(target.width, target.text ?? '').toBeGreaterThanOrEqual(44);
        expect(target.height, target.text ?? '').toBeGreaterThanOrEqual(44);
      }
    }
  }
});
