import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const svg = await readFile(new URL('../src/assets/social-preview.svg', import.meta.url), 'utf8');
  await page.setContent(`<style>body{margin:0}</style>${svg}`);
  await page.screenshot({ path: new URL('../public/social-preview.png', import.meta.url).pathname });
} finally {
  await browser.close();
}
