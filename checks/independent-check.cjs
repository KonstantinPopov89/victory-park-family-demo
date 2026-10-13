'use strict';

// Independent acceptance scenarios, exercised in disposable browser contexts.
// This script writes reports/screenshots only; it never edits or publishes the site.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const base = process.env.VP_QA_BASE || process.env.BASE_URL || 'http://127.0.0.1:8792/catalog-v2/';
const oldBase = process.env.VP_QA_OLD || process.env.OLD_URL || 'http://127.0.0.1:8792/';
const out = process.env.VP_QA_OUT || process.env.OUTPUT_DIR || path.resolve(__dirname, '../qa/independent-local');
const site = process.env.VP_QA_SITE || path.resolve(__dirname, '../site');
const OLD_STATE = 'vp.integrated.v1', OLD_ORDER = 'vp.integrated.order.v1';
const SAVED = 'vp.catalog.v2.saved', STATE = 'vp.catalog.v2.commerce', ORDER = 'vp.catalog.v2.order';
const results = [], runtimeErrors = [], boundaryEvents = [], requests = [];
fs.mkdirSync(out, { recursive: true });
function url(file) { return new URL(file, base).href; }
function msg(e) { return String(e?.message || e).replace(/\s+/g, ' ').slice(0, 1200); }
function md(s) { return String(s).replace(/\|/g, '\\|').replace(/\n/g, ' '); }
async function check(id, title, fn) {
  if (process.env.VP_QA_ONLY && !process.env.VP_QA_ONLY.split(',').includes(id)) return;
  try { const detail = await fn(); results.push({ id, title, status: 'PASS', detail: detail ?? '' }); }
  catch (e) { results.push({ id, title, status: 'FAIL', detail: msg(e) }); }
  console.log(`${id}: ${results.at(-1).status} ${results.at(-1).detail}`);
}
async function go(page, file) {
  const response = await page.goto(url(file), { waitUntil: 'networkidle' });
  assert.equal(response?.status(), 200, `HTTP ${response?.status()}: ${page.url()}`);
  await page.evaluate(() => document.fonts.ready);
}
async function fresh(browser, run, opts = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block', acceptDownloads: true, ...opts });
  context.setDefaultTimeout(7000);
  await context.exposeBinding('__independentBoundary', (_, event) => boundaryEvents.push(event));
  await context.addInitScript(({ newPath }) => {
    if (!location.pathname.startsWith(newPath)) return;
    for (const method of ['getItem', 'setItem', 'removeItem', 'clear']) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function (...args) {
        if (method === 'clear' || String(args[0]).startsWith('vp.integrated')) window.__independentBoundary({ method, key: args[0] ?? '*', path: location.pathname });
        return original.apply(this, args);
      };
    }
    if (navigator.locks?.request) {
      const original = navigator.locks.request.bind(navigator.locks);
      navigator.locks.request = function (name, ...args) {
        if (String(name).startsWith('vp.integrated')) window.__independentBoundary({ method: 'lock', key: name, path: location.pathname });
        return original(name, ...args);
      };
    }
  }, { newPath: new URL(base).pathname });
  context.on('page', p => {
    p.on('pageerror', e => runtimeErrors.push({ url: p.url(), error: msg(e) }));
    p.on('response', r => { if (r.status() >= 400) runtimeErrors.push({ url: r.url(), error: `HTTP ${r.status()}` }); });
    p.on('request', r => requests.push({ method: r.method(), url: r.url() }));
  });
  const page = await context.newPage();
  try { return await run(page, context); } finally { await context.close(); }
}
function cards(page) { return page.locator('article').filter({ has: page.getByRole('button', { name: /Сохранить|Сохранено|Убрать из сохран/i }) }); }
function saveButton(card) { return card.getByRole('button', { name: /Сохранить|Сохранено|Убрать из сохран/i }).first(); }
async function saved(page) { return page.evaluate(() => window.VPCatalog.getSaved()); }
async function stored(page, key) { return page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), key); }
async function noOverflow(page) {
  const measure = await page.evaluate(() => ({ width: innerWidth, client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  assert.ok(measure.scroll <= measure.client + 1, JSON.stringify(measure)); return measure;
}
async function selectSome(page, n = 3) {
  const names = [];
  for (let i = 0; i < n; i++) {
    const card = cards(page).nth(i); names.push(await card.getByRole('heading').first().innerText());
    await saveButton(card).click();
  }
  assert.equal((await saved(page)).length, n); return names;
}
async function directPurchase(page) {
  await go(page, 'demo-purchase.html#direct');
  await page.locator('#product-demo-calm [data-action="quantity"][data-value="2"]').click();
  const state = await stored(page, STATE);
  assert.equal(state.party.length, 0, 'Direct purchase silently added a family');
  assert.equal(state.cart.lines.filter(l => l.rideId === 'demo-calm').reduce((n, l) => n + l.quantity, 0), 2);
  assert.equal(await page.locator('input[type=email]:visible,input[type=tel]:visible').count(), 0);
  const scenario = page.locator('#scenario');
  if (await scenario.count()) {
    if (!await scenario.isVisible()) await scenario.locator('xpath=ancestor::details[1]').locator('summary').click();
    await scenario.selectOption('success');
  }
  await page.locator('#checkout-form button[type=submit]').click();
  await page.locator('#receipt .demo-ticket').first().waitFor({ state: 'visible' });
  const order = await stored(page, ORDER);
  assert.equal(order.status, 'success'); assert.equal(order.total, 1800);
  assert.equal(await page.locator('.demo-ticket').count(), 2);
  assert.equal(await page.locator('#copy-email').isVisible(), false);
  return order;
}
async function seedOld(page) {
  await page.goto(new URL('attractions.html', oldBase).href, { waitUntil: 'networkidle' });
  return page.evaluate(({ stateKey, orderKey }) => {
    const s = VP.sampleState();
    s.selections.real = ['wheel-of-happiness'];
    s.cart = { lines: [{ id: 'independent-old-ticket', productId: 'ticket', rideId: 'demo-calm', personId: null, quantity: 2, unitPrice: 900, visitDate: '', mode: 'demo' }], sourcePlanKey: null, scope: 'direct' };
    const order = VP.snapshotOrder(s, 'old-isolation-fixture', '2026-10-13T12:00:00.000Z');
    if (!order) throw new Error('Cannot build valid old-order fixture');
    order.status = 'success';
    if (!VP.validateOrder(order)) throw new Error('Old-order fixture invalid');
    const fixture = { state: JSON.stringify(s), order: JSON.stringify(order) };
    localStorage.setItem(stateKey, fixture.state); localStorage.setItem(orderKey, fixture.order);
    return fixture;
  }, { stateKey: OLD_STATE, orderKey: OLD_ORDER });
}

async function run(browser) {
  await check('C00', 'Canary: save, tickets, return before broad QA', () => fresh(browser, async page => {
    await go(page, 'attractions.html'); await selectSome(page, 1); const before = await saved(page);
    await page.locator('#catalog-saved-bar a[href="tickets.html"]').click(); await page.waitForURL('**/tickets.html');
    assert.ok((await page.locator('#saved-attractions').innerText()).includes('Колесо счастья'));
    await page.locator('.back-link').click(); await page.waitForURL('**/attractions.html');
    assert.deepEqual(await saved(page), before); return 'One saved attraction survives the actual UI round trip';
  }));
  if (results.at(-1)?.id === 'C00' && results.at(-1).status === 'FAIL') throw new Error('Critical canary failed; broad QA stopped');

  await check('A01', 'Real catalog first, no family questionnaire or teaching assortment', () => fresh(browser, async page => {
    await go(page, 'attractions.html');
    assert.equal(await cards(page).count(), 11);
    assert.match(await page.locator('main').innerText(), /Колесо счастья/);
    assert.equal(await page.locator('#family,[data-action="add-adult"],[data-action="add-child"],[data-action="sample"],[data-action="mode"]').count(), 0);
    assert.equal(await page.locator('main input,main select').count(), 0, 'Unexpected required questionnaire/input');
    assert.equal(await page.locator('[id^="ride-demo-"]').count(), 0);
    assert.deepEqual(await saved(page), []);
    const first = cards(page).first(), box = await first.boundingBox(), action = await saveButton(first).boundingBox();
    assert.ok(box.y < 844, `First card below initial viewport: ${box.y}px`);
    assert.ok(action.y + action.height <= 844, `First save action below initial viewport: ${action.y}px`);
    const photo = await first.locator('img').evaluate(img => ({ complete: img.complete, naturalWidth: img.naturalWidth }));
    assert.ok(photo.complete && photo.naturalWidth > 0);
    await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
    await page.screenshot({ path: path.join(out, 'attractions-390-initial.png') });
    return { firstCardTop: box.y, firstActionBottom: action.y + action.height, photo };
  }));
  await check('A02', 'Unknown rules cannot become an admission guarantee or fake age filter', () => fresh(browser, async page => {
    await go(page, 'attractions.html');
    const text = await page.locator('main').innerText();
    assert.match(text, /ограничен|рост|правил|условия допуска/i);
    assert.match(text, /уточн|не подтвержден|неизвестн/i);
    assert.equal(await page.locator('[data-change="age"],[data-change="height"],[data-action="focus-person"]').count(), 0);
    for (let i = 0; i < await cards(page).count(); i++) assert.doesNotMatch(await cards(page).nth(i).innerText(), /допуск подтверждён|подходит всей семье|можно всем|от \d+ лет/i);
    return 'No fabricated admission or age classification in the real catalog';
  }));
  await check('A03', 'Three saved rides survive reload, tickets and return without a family', () => fresh(browser, async page => {
    await go(page, 'attractions.html'); const names = await selectSome(page);
    const before = await saved(page); await page.reload({ waitUntil: 'networkidle' }); assert.deepEqual(await saved(page), before);
    await go(page, 'tickets.html');
    for (const name of names) assert.ok((await page.locator('main').innerText()).includes(name), `Saved ride missing on tickets: ${name}`);
    assert.equal(await page.locator('[data-action="quantity"]').count(), 0, 'Real informational list became purchasable products');
    assert.ok(await page.locator('a[href^="demo-purchase.html"]').count() > 0);
    assert.match(await page.locator('main').innerText(), /учебн|демо/i);
    await go(page, 'attractions.html'); assert.deepEqual(await saved(page), before);
    assert.equal((await stored(page, STATE))?.cart?.lines?.length || 0, 0);
    return { actions: 3, saved: before, names };
  }));
  await check('A04', 'Saved list synchronizes between new-version tabs', () => fresh(browser, async (page, context) => {
    await go(page, 'attractions.html'); const other = await context.newPage(); await go(other, 'attractions.html');
    await saveButton(cards(page).first()).click();
    await other.waitForFunction(() => window.VPCatalog.getSaved().length === 1);
    assert.deepEqual(await saved(other), await saved(page));
    await saveButton(cards(other).nth(1)).click();
    await page.waitForFunction(() => window.VPCatalog.getSaved().length === 2);
    assert.deepEqual(await saved(other), await saved(page));
    return 'Two tabs observed each other’s save; neither selection lost';
  }));
  await check('A05', 'Details close with Escape, restore focus and preserve scroll', () => fresh(browser, async page => {
    await go(page, 'attractions.html'); const button = cards(page).nth(5).getByRole('button', { name: /Подробнее/ });
    await button.scrollIntoViewIfNeeded(); await button.focus(); const before = await page.evaluate(() => scrollY);
    await page.keyboard.press('Enter'); const dialog = page.getByRole('dialog'); await dialog.waitFor({ state: 'visible' });
    assert.match(await dialog.innerText(), /уточн|не подтвержден|ограничен|рост/i);
    await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' });
    assert.ok(await button.evaluate(el => el === document.activeElement), 'Focus did not return to details opener');
    const after = await page.evaluate(() => scrollY); assert.ok(Math.abs(after - before) <= 3, `Scroll changed ${before} to ${after}`);
    return { before, after };
  }));
  await check('A06', 'Named attraction deep link opens its details, unknown id stays safe', () => fresh(browser, async page => {
    await go(page, 'attractions.html?ride=wheel-of-happiness');
    const dialog = page.getByRole('dialog'); await dialog.waitFor({ state: 'visible' }); assert.match(await dialog.innerText(), /Колесо счастья/);
    await page.keyboard.press('Escape');
    await go(page, 'attractions.html?ride=unknown-qa-ride'); assert.equal(await cards(page).count(), 11); assert.deepEqual(await saved(page), []);
  }));
  await check('A07', 'Mobile menu keyboard and Escape return focus', () => fresh(browser, async page => {
    await go(page, 'attractions.html'); const button = page.locator('#vp-menu-toggle');
    await button.focus(); await page.keyboard.press('Enter'); await page.locator('#vp-mobile-nav').waitFor({ state: 'visible' });
    assert.equal(await button.getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Tab'); assert.ok(await page.evaluate(() => Boolean(document.activeElement?.closest('#vp-mobile-nav'))));
    await page.keyboard.press('Escape'); assert.equal(await button.getAttribute('aria-expanded'), 'false');
    assert.ok(await button.evaluate(el => el === document.activeElement));
  }));
  for (const width of [320, 390, 768, 1440]) {
    await check('A08-' + width, `Pages and details have no horizontal overflow at ${width}px`, () => fresh(browser, async page => {
      const dimensions = [];
      for (const file of ['index.html', 'attractions.html', 'tickets.html', 'demo-purchase.html']) {
        await go(page, file); dimensions.push({ file, ...await noOverflow(page) });
      }
      await go(page, 'attractions.html'); await cards(page).first().getByRole('button', { name: /Подробнее/ }).click();
      await noOverflow(page); const box = await page.getByRole('dialog').boundingBox(); assert.ok(box.x >= 0 && box.x + box.width <= width + 1);
      return dimensions;
    }, { viewport: { width, height: 844 } }));
  }
  await check('A09', 'Unavailable browser storage is visible and in-tab saving remains useful', () => fresh(browser, async page => {
    await page.addInitScript(() => { for (const m of ['getItem', 'setItem', 'removeItem']) Storage.prototype[m] = function () { throw new DOMException('QA storage blocked', 'SecurityError'); }; });
    await go(page, 'attractions.html'); await saveButton(cards(page).first()).click();
    assert.equal((await saved(page)).length, 1); assert.equal(await page.evaluate(() => VPCatalog.isPersistent()), false);
    assert.match(await page.locator('body').innerText(), /не сохран|не закрывай|потер|недоступ|только.*вклад/i);
    return 'Current tab retains the saved ride and warning states the persistence limit';
  }));
  await check('A10', 'Old order and family remain byte-for-byte intact while new UI saves and buys', () => fresh(browser, async (page, context) => {
    assert.equal(new URL(base).origin, new URL(oldBase).origin, 'This isolation test requires one shared origin');
    const fixture = await seedOld(page); await page.reload({ waitUntil: 'networkidle' });
    const oldBefore = await page.evaluate(({ stateKey, orderKey }) => ({ state: localStorage.getItem(stateKey), order: localStorage.getItem(orderKey) }), { stateKey: OLD_STATE, orderKey: OLD_ORDER });
    assert.deepEqual(oldBefore, fixture);
    const newer = await context.newPage(); await go(newer, 'attractions.html?ride=wheel-of-happiness'); await newer.keyboard.press('Escape');
    assert.deepEqual(await saved(newer), [], 'New version imported old real selections'); await selectSome(newer, 2);
    const o = await directPurchase(newer); assert.notEqual(o.id, 'old-isolation-fixture');
    const after = await page.evaluate(({ stateKey, orderKey }) => ({ state: localStorage.getItem(stateKey), order: localStorage.getItem(orderKey) }), { stateKey: OLD_STATE, orderKey: OLD_ORDER });
    assert.deepEqual(after, fixture);
    await page.goto(new URL('tickets.html', oldBase).href, { waitUntil: 'networkidle' });
    assert.match(await page.locator('#receipt').innerText(), /old-isolation-fixture/);
    assert.equal(await page.locator('.demo-ticket').count(), 2);
    return { oldOrder: 'old-isolation-fixture', newOrder: o.id, oldBytesIntact: true };
  }));
  await check('A11', 'Demo tickets are issued and downloadable without a contact', () => fresh(browser, async page => {
    const order = await directPurchase(page);
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('[data-action="save-tickets"]').click()]);
    const target = path.join(out, 'issued-test-tickets.html'); await download.saveAs(target);
    const html = fs.readFileSync(target, 'utf8'); assert.ok(html.includes(order.id)); assert.match(html.replace(/\s/g, ''), /1800AMD/); assert.match(html, /не действуют|Не действует/i);
    await page.reload({ waitUntil: 'networkidle' }); await page.locator('.demo-ticket').first().waitFor({ state: 'visible' });
    assert.equal((await stored(page, ORDER)).id, order.id);
    return { orderId: order.id, amount: order.total, tickets: 2, downloadSha256: crypto.createHash('sha256').update(html).digest('hex') };
  }));
  await check('A11b', 'Package and personal pass issue together without family form or plus/minus counters', () => fresh(browser, async page => {
    await go(page, 'demo-purchase.html#direct');
    assert.equal(await page.getByRole('button', { name: /^[+−–-]$/ }).count(), 0);
    await page.locator('[data-action="product-focus"][data-product="package"]').click();
    await page.locator('#product-package [data-action="quantity"][data-value="1"]').click();
    await page.locator('[data-action="product-focus"][data-product="unlimited"]').click();
    await page.locator('#product-unlimited [data-action="quantity"][data-value="1"]').click();
    const state = await stored(page, STATE); assert.equal(state.party.length, 0);
    assert.deepEqual(state.cart.lines.map(l => l.productId).sort(), ['package5', 'unlimited']);
    assert.equal(await page.locator('input[type=email]:visible,input[type=tel]:visible').count(), 0);
    // An undated personal pass must not silently become a confirmed order.
    await page.locator('#checkout-form button[type=submit]').click();
    assert.equal(await stored(page, ORDER), null); assert.match(await page.locator('#checkout-errors').innerText(), /дат/i);
    await page.locator('#cart [data-action="date-tomorrow"]').click(); const date = await page.locator('#visit-date').inputValue();
    assert.match(date, /^20\d\d-\d\d-\d\d$/);
    await page.locator('#checkout-form button[type=submit]').click(); await page.locator('.demo-ticket').first().waitFor({ state: 'visible' });
    const order = await stored(page, ORDER); assert.equal(order.total, 9900); assert.equal(order.status, 'success');
    assert.equal(await page.locator('.demo-ticket').count(), 2); assert.equal(await page.locator('#copy-email').isVisible(), false);
    assert.equal(order.lines.find(l => l.productId === 'unlimited').visitDate, date);
    assert.ok(order.lines.every(l => Array.isArray(l.terms) && l.terms.length > 0));
    assert.match(await page.locator('#receipt').innerText(), /5 катаний|Общий пакет/); assert.match(await page.locator('#receipt').innerText(), /безлимит/i);
    return { products: order.lines.map(l => l.productId), amount: order.total, passDate: date, family: 0, tickets: 2 };
  }));
  await check('A12', 'Core navigation remains within the new version', () => fresh(browser, async page => {
    const checked = [];
    for (const file of ['index.html', 'attractions.html', 'tickets.html', 'demo-purchase.html']) {
      await go(page, file);
      const links = await page.locator('header a[href],nav a[href]').evaluateAll(els => els.map(el => ({ text: el.textContent.trim(), href: el.href })));
      for (const link of links) {
        const target = new URL(link.href);
        if (target.origin === new URL(base).origin && /(?:index|attractions|tickets|demo-purchase)\.html$/.test(target.pathname)) assert.ok(target.pathname.startsWith(new URL(base).pathname), `${file}: escaped new version ${link.href}`);
      }
      checked.push({ file, links });
    }
    return checked;
  }));
  await check('A13', 'New code does not contain old storage namespace, global clear or old payment lock', async () => {
    const checked = [];
    for (const name of fs.readdirSync(site).filter(n => /\.(?:js|html)$/.test(n))) {
      const source = fs.readFileSync(path.join(site, name), 'utf8');
      assert.doesNotMatch(source, /vp\.integrated(?:\.|['"])/, `Old namespace remains in ${name}`);
      assert.doesNotMatch(source, /(?:localStorage|sessionStorage)\.clear\s*\(/, `Global clear in ${name}`);
      checked.push(name);
    }
    assert.deepEqual(boundaryEvents, [], 'Runtime access to old state or shared lock detected'); return checked;
  });
  await check('S01', 'Rendered catalog, handoff and demo purchase screenshots', () => fresh(browser, async page => {
    const files = [];
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      for (const file of ['attractions.html', 'tickets.html', 'demo-purchase.html']) {
        await go(page, file);
        if (file === 'attractions.html') await selectSome(page, 2);
        for (const image of await page.locator('img[loading=lazy]').all()) { await image.scrollIntoViewIfNeeded(); await image.evaluate(img => img.decode().catch(() => {})); }
        await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
        const name = file.replace('.html', '') + '-' + width + '-full.png';
        await page.screenshot({ path: path.join(out, name), fullPage: true }); files.push(name);
        if (file === 'attractions.html' && width === 390) {
          await page.screenshot({ path: path.join(out, 'attractions-390-viewport.png') }); files.push('attractions-390-viewport.png');
        }
      }
      if (width === 390) { await go(page, 'attractions.html'); for (const id of await saved(page)) await page.locator('[data-save="' + id + '"]').first().click(); }
    }
    return files;
  }));
  await check('A14', 'Runtime and resources are clean, no non-GET transmission during tests', async () => {
    assert.deepEqual(runtimeErrors, []);
    assert.deepEqual(requests.filter(r => !['GET', 'HEAD'].includes(r.method)), []);
    return { requests: requests.length, errors: 0, oldBoundaryEvents: boundaryEvents.length };
  });
}

(async () => {
  const executablePath = process.env.CHROME_PATH || (fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome') ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/google-chrome');
  const browser = await chromium.launch({ executablePath, headless: true });
  try { await run(browser); }
  catch (e) { results.push({ id: 'RUN', title: 'Uncaught runner failure', status: 'FAIL', detail: msg(e) }); }
  finally { await browser.close(); }
  const report = { timestamp: new Date().toISOString(), base, oldBase, status: results.some(r => r.status === 'FAIL') ? 'FAIL' : 'PASS', checks: results, runtimeErrors, boundaryEvents, selectedChecks: process.env.VP_QA_ONLY || 'all', scope: 'Browser acceptance in fresh isolated profiles. Not a performance benchmark, physical-device test, publication approval, or evidence of user conversion.' };
  fs.writeFileSync(path.join(out, 'independent-qa.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(out, 'independent-qa.md'), ['# Independent browser acceptance', '', `Status: ${report.status}. Base: ${base}. Old version: ${oldBase}.`, '', report.scope, '', '| Scenario | Result | Evidence |', '|---|---|---|', ...results.map(r => `| ${md(r.id + ': ' + r.title)} | ${r.status} | ${md(typeof r.detail === 'object' ? JSON.stringify(r.detail) : r.detail)} |`), ''].join('\n'));
  console.log(JSON.stringify({ status: report.status, passed: results.filter(r => r.status === 'PASS').length, total: results.length, report: path.join(out, 'independent-qa.json') }));
  if (report.status !== 'PASS') process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
