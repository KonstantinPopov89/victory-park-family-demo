import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { OUTPUT, NEW_BASE, NEW_PAGES, writeResult } from './manifest.mjs';

fs.mkdirSync(OUTPUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true });
const results = [];
try {
  for (const width of [320, 390, 768, 1440]) {
    for (const pageName of NEW_PAGES) {
      const context = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce', serviceWorkers: 'block' });
      const page = await context.newPage();
      const runtimeErrors = [];
      page.on('pageerror', error => runtimeErrors.push(error.message));
      const record = { page: pageName, width, url: `${NEW_BASE}${pageName}.html` };
      try {
        const response = await page.goto(record.url, { waitUntil: 'networkidle', timeout: 45000 });
        record.httpStatus = response.status();
        await page.evaluate(() => document.fonts.ready);
        // Scroll loads lazy images without replacing their source or changing the published page.
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < height; y += 650) {
          await page.evaluate(position => window.scrollTo(0, position), y);
          await page.waitForTimeout(50);
        }
        await page.evaluate(async () => { await Promise.allSettled([...document.images].map(img => img.decode())); window.scrollTo(0, 0); });
        record.metrics = await page.evaluate(() => ({ viewport: innerWidth, clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, brokenImages: [...document.images].filter(img => !img.complete || img.naturalWidth === 0).map(img => img.getAttribute('src')), headings: [...document.querySelectorAll('h1')].map(h => h.textContent.trim()) }));
        record.screenshot = `public-${pageName}-${width}.png`;
        await page.screenshot({ path: path.join(OUTPUT, record.screenshot), fullPage: true, animations: 'disabled' });
        if (pageName === 'attractions' && width === 390) {
          record.firstScreen = 'public-attractions-first-screen-390.png';
          await page.screenshot({ path: path.join(OUTPUT, record.firstScreen), fullPage: false, animations: 'disabled' });
        }
        record.runtimeErrors = runtimeErrors;
        record.status = response.status() === 200 && record.metrics.scrollWidth <= record.metrics.clientWidth + 1 && record.metrics.brokenImages.length === 0 && runtimeErrors.length === 0 ? 'PASS' : 'FAIL';
      } catch (error) { record.status = 'FAIL'; record.error = error.message; }
      results.push(record);
      await context.close();
      console.log(JSON.stringify({ page: pageName, width, status: record.status }));
    }
  }
} finally { await browser.close(); }
const status = results.length === 16 && results.every(r => r.status === 'PASS') ? 'PASS' : 'FAIL';
writeResult('public-visual.json', { status, timestamp: new Date().toISOString(), scope: 'Public responsive rendering, resource decoding and horizontal overflow. Screenshots still require human visual inspection; this status alone is not visual-design approval.', results });
if (status !== 'PASS') process.exitCode = 1;
