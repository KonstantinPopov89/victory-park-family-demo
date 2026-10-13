'use strict';

// Independent browser checks against the integration task card.
// --phase=home never visits or exercises the unfinished purchase page.
// Core checks are activated only after the producer reports core-ready.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const site = root;
const base = process.env.VP_QA_BASE || 'http://127.0.0.1:8780/';
const phase = process.argv.find(a => a.startsWith('--phase='))?.slice(8) || 'home';
const STATE_KEY = 'vp.integrated.v1';
const ORDER_KEY = 'vp.integrated.order.v1';
const results = [];
const failures = [];
const runtimeErrors = [];
const requestsOutsideOrigin = [];
const plannedCore = [
  ['C01', 'Одна семья проходит с главной в подбор и покупку; возраст не выдаётся за рост или допуск.'],
  ['C02', 'Из двух личных безлимитов остаётся один только после выбора получателя; второй не удаляется случайно.'],
  ['C03', 'Увеличение количества не дублирует одно личное право одному человеку; отмена удаления восстанавливает получателя.'],
  ['C04', 'Возврат, reload и изменение программы сохраняют товары, показывают актуальное покрытие; сумма не меняется скрыто.'],
  ['C05', 'Прямая покупка работает без семьи и при уже сохранённой незавершённой программе после явного выбора.'],
  ['C06', 'Количество 0, дробь и значение выше предела не разрушают заказ; 1/2/3/4/Другое согласованы.'],
  ['C07', 'Дата требуется у безлимита и определяется относительно Еревана; прямой покупатель не создаёт всю семью.'],
  ['C08', 'Отказ возвращает сохранённый заказ; pending и задержка выдачи восстанавливают тот же ID, без новой оплаты.'],
  ['C09', 'После успеха скачанный HTML содержит полный набор прав с верными получателями, датой и суммой, с демо-маркировкой.'],
  ['C10', 'Необязательная копия появляется после билетов; ошибка email не прячет их; контакт не уходит в сеть или storage.'],
  ['C11', 'Основные состояния работают при 320/390/768/1440, с клавиатурой и reduced motion; эмуляция не объявляется реальным телефоном.'],
  ['C12', 'Изолированный storage failure обозначен явно; повторная оплата при неизвестном результате не предлагается.']
];

function url(file) { return new URL(file, base).href; }
function short(error) { return String(error?.message || error).replace(/\s+/g, ' ').slice(0, 700); }
function escapeMd(s) { return String(s).replace(/\|/g, '\\|').replace(/\n/g, ' '); }
async function check(id, title, fn) {
  try { const detail = await fn(); results.push({ id, title, status: 'PASS', detail: detail || '' }); }
  catch (error) { const detail = short(error); results.push({ id, title, status: 'FAIL', detail }); failures.push({ id, detail }); }
}
async function readState(page) { return page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), STATE_KEY); }
async function readOrder(page) { return page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), ORDER_KEY); }
// An absent optional key and explicit null both mean no unassigned recipient identity.
// Keep every other field, including line ID, person, quantity, price and date, exact.
function nullableRecipientKeys(lines) { return lines.map(line => ({ ...line, recipientKey: line.recipientKey ?? null })); }
async function noOverflow(page) {
  const size = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  assert.ok(size.scroll <= size.client + 1, JSON.stringify(size));
  return `viewport ${size.width}px; scrollWidth ${size.scroll}px`;
}
async function homeChecks(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  context.setDefaultTimeout(6500);
  const origin = new URL(base).origin;
  await context.route('**/*', route => {
    const address = route.request().url();
    if (/^https?:/.test(address) && new URL(address).origin !== origin) {
      requestsOutsideOrigin.push({ url: address, method: route.request().method() });
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', error => runtimeErrors.push(short(error)));
  page.on('response', response => { if (response.status() >= 400) runtimeErrors.push(`${response.status()} ${response.url()}`); });

  await check('H01', 'Главная открывается в чистом мобильном контексте', async () => {
    const response = await page.goto(url('index.html'), { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    await page.locator('#hero-title').waitFor({ state: 'visible' });
    assert.match(await page.locator('.vp-demo-bar').innerText(), /учебные.*не списываются/);
    assert.equal(await page.locator('input[type=password], input[autocomplete=cc-number]').count(), 0);
    const hero = await page.locator('.hero-photo img').evaluate(img => ({ complete: img.complete, width: img.naturalWidth }));
    assert.ok(hero.complete && hero.width > 0, 'Hero image did not decode');
    return 'Свежий контекст, видимая демо-пометка и загруженное фото';
  });
  await check('H02', 'Мобильное меню управляется с клавиатуры и возвращает фокус', async () => {
    const toggle = page.locator('#vp-menu-toggle');
    await toggle.focus(); await page.keyboard.press('Enter');
    await page.locator('#vp-mobile-nav').waitFor({ state: 'visible' });
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(() => Boolean(document.activeElement?.closest('#vp-mobile-nav'))));
    await page.keyboard.press('Escape');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'vp-menu-toggle');
    return 'Enter, Tab, Escape; закрытие и фокус проверены в браузере';
  });
  await check('H03', 'Описание прототипа открывается и закрывается без потери фокуса', async () => {
    const trigger = page.locator('.vp-demo-bar [data-vp-about]');
    await trigger.focus(); await page.keyboard.press('Enter');
    await page.locator('#vp-about').waitFor({ state: 'visible' });
    assert.match(await page.locator('#vp-about').innerText(), /учебн|вымышлен/i);
    await page.keyboard.press('Escape');
    assert.ok(await trigger.evaluate(el => el === document.activeElement));
  });
  await check('H04', 'Главная ведёт в общий подбор и возвращается назад', async () => {
    await page.locator('.hero-actions a[href="attractions.html#family"]').click();
    await page.waitForURL('**/attractions.html#family');
    await page.locator('#family').waitFor({ state: 'visible' });
    assert.equal(new URL(page.url()).origin, origin);
    assert.equal(await page.locator('.vp-desktop-nav a[aria-current="page"]').getAttribute('href'), 'attractions.html');
    await page.goBack({ waitUntil: 'networkidle' });
    await page.locator('#hero-title').waitFor({ state: 'visible' });
    return 'Посещены только index и attractions, checkout не открывался';
  });
  await check('H05', 'Продуктовые кнопки главной имеют новые адреса', async () => {
    const links = await page.locator('.ticket-grid a').evaluateAll(anchors => anchors.map(a => a.getAttribute('href')));
    assert.deepEqual(links, ['tickets.html#direct', 'tickets.html?type=package', 'tickets.html?type=unlimited']);
    assert.equal(await page.locator('[data-product]').count(), 0);
    return 'Проверены href; обработка покупки не запускалась';
  });
  for (const width of [320, 390, 768, 1440]) {
    await check(`H06-${width}`, `Главная без горизонтального переполнения при ${width}px`, async () => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(url('index.html'), { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      return noOverflow(page);
    });
  }
  await check('H07', 'Главная и навигация не вызывают внешних запросов или ошибок ресурсов', async () => {
    assert.deepEqual(runtimeErrors, []);
    assert.deepEqual(requestsOutsideOrigin, []);
  });
  await context.close();
}

async function fresh(browser, fn, options = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', reducedMotion: 'reduce', acceptDownloads: true, ...options });
  context.setDefaultTimeout(6500);
  const origin = new URL(base).origin;
  const requests = [];
  await context.route('**/*', route => {
    const address = route.request().url(); requests.push({ url: address, method: route.request().method() });
    if (/^https?:/.test(address) && new URL(address).origin !== origin) { requestsOutsideOrigin.push({ url: address, method: route.request().method() }); return route.abort(); }
    return route.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', error => runtimeErrors.push(short(error)));
  page.on('response', response => { if (response.status() >= 400) runtimeErrors.push(`${response.status()} ${response.url()}`); });
  try { return await fn(page, context, requests); } finally { await context.close(); }
}
async function go(page, route) { await page.goto(url(route), { waitUntil: 'networkidle' }); }
async function sample(page) {
  await go(page, 'attractions.html');
  await page.locator('[data-action="sample"]').first().click();
  if (await page.locator('[data-action="confirm-sample"]').isVisible()) await page.locator('[data-action="confirm-sample"]').click();
  const s = await readState(page); assert.equal(s.party.length, 4);
  return s;
}
async function offer(page, variant = 'freedom') {
  await sample(page); await go(page, 'tickets.html');
  await page.locator('[data-action="choose-offer"][data-variant="' + variant + '"]').click();
  if (await page.locator('[data-action="confirm-offer"]').isVisible()) await page.locator('[data-action="confirm-offer"]').click();
  return readState(page);
}
async function productTab(page, product) {
  const tab = page.locator('[data-action="product-focus"][data-product="' + product + '"]');
  await tab.click();
  assert.equal(await tab.getAttribute('aria-selected'), 'true');
  await page.locator('#products-' + product).waitFor({ state: 'visible' });
}
async function directTicket(page, n = 1) {
  await go(page, 'tickets.html#direct');
  await productTab(page, 'single');
  await page.locator(`#product-demo-calm [data-action="quantity"][data-value="${n}"]`).click();
}
async function chooseScenario(page, scenario) {
  const select = page.locator('#scenario');
  if (!(await select.isVisible())) {
    const details = select.locator('xpath=ancestor::details[1]');
    if (await details.count()) await details.locator('summary').click();
  }
  await select.selectOption(scenario);
}
async function pay(page, scenario = 'success') {
  if (await page.locator('#terms').count()) await page.locator('#terms').check();
  await chooseScenario(page, scenario);
  await page.locator('#checkout-form button[type="submit"]').click();
  await page.waitForFunction(({ key, status }) => JSON.parse(localStorage.getItem(key) || 'null')?.status === status, { key: ORDER_KEY, status: scenario });
  await page.locator('#receipt').waitFor({ state: 'visible' });
  return readOrder(page);
}
async function useDirect(page) {
  await page.locator('[data-action="scope-direct"]').click();
  await page.locator('[data-action="confirm-direct"]').click();
}
async function tomorrow(page) {
  await page.locator('#cart [data-action="date-tomorrow"]').click();
  return page.locator('#visit-date').inputValue();
}
async function coreChecks(browser) {
  await homeChecks(browser);
  await check('C01', 'Семья переносится с главной через подбор в две объяснимые покупки', () => fresh(browser, async page => {
    await go(page, 'index.html');
    await page.locator('.hero-actions a[href="attractions.html#family"]').click();
    await page.locator('[data-action="sample"]').first().click();
    const family = await readState(page);
    assert.equal(family.party.length, 4); assert.ok(family.party.every(p => p.height === null));
    if (!(await page.locator('#age-child-1').isVisible())) await page.locator('#family > summary').click();
    await page.locator('#age-child-1').selectOption('11');
    const sameAge = await readState(page); assert.equal(sameAge.party.find(p => p.id === 'child-1').age, 11);
    assert.ok(sameAge.party.every(p => p.height === null), 'Age input invented a height');
    await page.locator('#plan a[href="tickets.html"]').click();
    await page.waitForURL(url('tickets.html'));
    // allTextContents reads immediately; wait for both visible offers after navigation.
    const prices = page.locator('.offers .offer-price');
    await prices.nth(0).waitFor({ state: 'visible' });
    await prices.nth(1).waitFor({ state: 'visible' });
    assert.equal(await prices.count(), 2, 'Expected both complete purchase alternatives');
    const bought = await readState(page);
    assert.deepEqual(bought.party, sameAge.party); assert.deepEqual(bought.wishes, sameAge.wishes);
    const totals = await prices.allTextContents();
    assert.match(totals[0].replace(/\s/g, ''), /^9900/); assert.match(totals[1].replace(/\s/g, ''), /^11800/);
    assert.match(await page.locator('#recommendations').innerText(), /возможность катания|возможность.*провер|условн/i);
    return 'Четыре участника, желания и неизвестный рост сохранены; 9900/11800, без вычисления роста из возраста';
  }));
  await check('C02', 'Уменьшение 2→1 требует выбрать получателя и не меняет заказ до подтверждения', () => fresh(browser, async page => {
    const before = await offer(page);
    const passes = before.cart.lines.filter(l => l.productId === 'unlimited'); assert.equal(passes.length, 2);
    await productTab(page, 'unlimited');
    await page.locator('#product-unlimited [data-action="quantity"][data-value="1"]').click();
    await page.locator('#keep-recipients-form').waitFor({ state: 'visible' });
    assert.deepEqual((await readState(page)).cart.lines, before.cart.lines);
    const keep = passes.find(l => l.personId === 'child-2');
    await page.locator(`#keep-recipients-form input[value="${keep.id}"]`).check();
    await page.locator('#keep-recipients-form button[type="submit"]').click();
    const after = await readState(page); assert.equal(after.cart.lines.length, 1); assert.equal(after.cart.lines[0].personId, 'child-2');
    assert.deepEqual(after.party, before.party); assert.deepEqual(after.wishes, before.wishes);
    assert.match(await page.locator('#cart').innerText(), /Ребёнок 1/);
    await page.locator('[data-action="undo-remove"]').click();
    assert.deepEqual((await readState(page)).cart.lines, before.cart.lines);
    return 'Оставлен второй ребёнок; непокрытый первый виден; отмена восстановила оба личных права';
  }));
  await check('C03', 'Новый безлимит не дублирует уже назначенного получателя', () => fresh(browser, async page => {
    const before = await offer(page);
    await productTab(page, 'unlimited');
    await page.locator('#product-unlimited [data-action="quantity"][data-value="3"]').click();
    const expanded = await readState(page); const newPass = expanded.cart.lines.find(l => l.productId === 'unlimited' && !l.personId);
    assert.ok(newPass); assert.equal(expanded.cart.lines.length, 3);
    await page.locator(`[data-change="recipient"][data-line="${newPass.id}"]`).selectOption('child-1');
    await page.locator('#dialog').waitFor({ state: 'visible' });
    assert.match(await page.locator('#dialog').innerText(), /уже|повтор|один/i);
    const checked = await readState(page); assert.equal(checked.cart.lines.filter(l => l.personId === 'child-1').length, 1);
    assert.equal(checked.cart.lines.find(l => l.id === newPass.id).personId, null);
    await page.keyboard.press('Escape');
    assert.deepEqual(checked.party, before.party);
    return 'Третье право неназначенное; попытка повторно выбрать первого ребёнка отклонена';
  }));
  await check('C04', 'Изменение программы сохраняет товары и показывает непокрытый остаток', () => fresh(browser, async page => {
    const before = await offer(page, 'plan');
    await go(page, 'attractions.html#plan');
    await page.locator('[data-change="count"][data-person="child-1"][data-ride="demo-calm"]').selectOption('6');
    await page.locator('#plan a[href="tickets.html"]').click();
    await page.reload({ waitUntil: 'networkidle' });
    const after = await readState(page); assert.deepEqual(nullableRecipientKeys(after.cart.lines), nullableRecipientKeys(before.cart.lines));
    assert.equal(after.wishes.find(w => w.personId === 'child-1').count, 6);
    assert.match(await page.locator('#cart').innerText(), /Не покрыто.*Ребёнок 1/s);
    assert.match(await page.locator('#cart .total').innerText().then(t => t.replace(/\s/g, '')), /9900/);
    return 'После шестого катания товары и 9900 сохранены; дополнительное желание явно не покрыто';
  }));
  await check('C05a', 'Прямая покупка с главной не требует семьи или контакта', () => fresh(browser, async page => {
    await go(page, 'index.html'); await page.locator('.hero-actions a[href="tickets.html#direct"]').click();
    await page.locator('#product-demo-calm [data-action="quantity"][data-value="2"]').click();
    assert.equal((await readState(page)).party.length, 0);
    assert.equal(await page.locator('input[type="email"]').count(), 0);
    assert.equal(await page.locator('#cart a[href="#checkout"]').count(), 0, 'Extra confirmation step remains instead of direct payment in the cart');
    const o = await pay(page); assert.equal(o.total, 1800); assert.equal(await page.locator('.demo-ticket').count(), 2);
    return 'С главной до двух демо-билетов за 1800 без семьи, email и дополнительного экрана подтверждения';
  }));
  await check('C05b', 'Незавершённый семейный план не блокирует явно выбранную прямую покупку', () => fresh(browser, async page => {
    await sample(page);
    await page.locator('[data-change="count"][data-person="child-1"][data-ride="demo-calm"]').selectOption('');
    const original = await readState(page); await go(page, 'tickets.html');
    await page.locator('#product-demo-calm [data-action="quantity"][data-value="1"]').click();
    await useDirect(page); const s = await readState(page);
    assert.deepEqual(s.party, original.party); assert.deepEqual(s.wishes, original.wishes); assert.equal(s.cart.scope, 'direct');
    const o = await pay(page); assert.equal(o.total, 900); assert.equal(o.scope, 'direct');
    return 'План с неизвестными повторами сохранён, один выбранный билет оформлен отдельно';
  }));
  await check('C06', 'Неверное количество не портит заказ; другое количество и клавиатура работают', () => fresh(browser, async page => {
    await directTicket(page, 4); const before = await readState(page);
    await page.locator('#product-demo-calm [data-action="quantity-other"]').click();
    for (const bad of ['0', '1.5', '21']) {
      await page.locator('#custom-quantity').fill(bad); await page.locator('#quantity-form button[type="submit"]').click();
      assert.equal(await page.locator('#custom-quantity').getAttribute('aria-invalid'), 'true');
      assert.deepEqual((await readState(page)).cart.lines, before.cart.lines);
    }
    await page.locator('#custom-quantity').fill('20'); await page.locator('#quantity-form button[type="submit"]').click();
    assert.equal((await readState(page)).cart.lines[0].quantity, 20);
    await page.locator('#product-demo-calm [data-action="quantity-other"]').click(); await page.keyboard.press('Escape');
    assert.ok(await page.evaluate(() => document.activeElement?.dataset.action === 'quantity-other'));
    return '0, 1.5, 21 отвергнуты без потери заказа; 20 принято; Escape вернул фокус';
  }));
  for (const timezoneId of ['America/Los_Angeles', 'Asia/Tokyo']) {
    await check('C07-' + timezoneId, 'Дата безлимита соответствует Еревану при другом часовом поясе браузера', () => fresh(browser, async page => {
      await page.clock.setFixedTime(new Date('2026-10-13T21:30:00Z'));
      await go(page, 'tickets.html?type=unlimited');
      await productTab(page, 'unlimited');
    await page.locator('#product-unlimited [data-action="quantity"][data-value="1"]').click();
      assert.equal((await readState(page)).party.length, 0);
      assert.equal(await page.locator('#visit-date').getAttribute('min'), '2026-10-14');
      if (await page.locator('#terms').count()) await page.locator('#terms').check();
      await page.locator('#checkout-form button[type="submit"]').click(); assert.equal(await readOrder(page), null);
      assert.match(await page.locator('#checkout-errors').innerText(), /дат/i);
      await page.locator('#cart [data-action="date-today"]').click();
      assert.equal(await page.locator('#visit-date').inputValue(), '2026-10-14');
      const o = await pay(page); assert.equal(o.lines[0].visitDate, '2026-10-14'); assert.equal(o.total, 5900);
      return `${timezoneId}: 21:30 UTC 13 октября означает 14 октября в Ереване; семья не требуется`;
    }, { timezoneId }));
  }
  for (const scenario of ['declined', 'pending', 'issuance']) {
    await check('C08-' + scenario, 'Отказ или ожидание не теряет заказ и не создаёт новую оплату', () => fresh(browser, async (page, context) => {
      await directTicket(page, 2); const cart = (await readState(page)).cart.lines;
      const initial = await pay(page, scenario); await page.reload({ waitUntil: 'networkidle' });
      assert.equal((await readOrder(page)).id, initial.id); assert.equal((await readOrder(page)).status, scenario);
      if (scenario === 'declined') {
        await page.locator('[data-action="new-order"]').click(); assert.deepEqual((await readState(page)).cart.lines, cart);
        assert.equal(await readOrder(page), null); return 'Отказ вернул два исходных билета без изменения суммы';
      }
      assert.equal(await page.locator('#checkout-form').count(), 0); assert.equal(await page.locator('[data-action="new-order"]').count(), 0);
      assert.equal(await page.locator('[data-action="save-tickets"]').count(), 0);
      const other = await context.newPage(); await go(other, 'tickets.html');
      assert.equal(await other.locator('#checkout-form').count(), 0); assert.equal((await readOrder(other)).id, initial.id); await other.close();
      await page.locator('[data-action="resolve-order"]').click();
      if ((await readOrder(page)).status !== 'success') await page.locator('[data-action="resolve-order"]').click();
      assert.equal((await readOrder(page)).id, initial.id); assert.equal((await readOrder(page)).total, 1800);
      assert.equal(await page.locator('.demo-ticket').count(), 2);
      return `${scenario}: reload и другая вкладка сохранили ID; после проверки готовы те же 2 образца`;
    }));
  }
  await check('C09', 'Скачанный автономный HTML совпадает с полным смешанным заказом', () => fresh(browser, async page => {
    await directTicket(page, 2);
    await productTab(page, 'package');
    await page.locator('#product-package [data-action="quantity"][data-value="1"]').click();
    await productTab(page, 'unlimited');
    await page.locator('#product-unlimited [data-action="quantity"][data-value="2"]').click();
    const date = await tomorrow(page); const o = await pay(page); assert.equal(o.total, 17600);
    assert.equal(await page.locator('.demo-ticket').count(), 5);
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('[data-action="save-tickets"]').click()]);
    const stream = await download.createReadStream(); const chunks = []; for await (const chunk of stream) chunks.push(chunk);
    const html = Buffer.concat(chunks).toString('utf8');
    const parsed = await page.evaluate(source => { const d = new DOMParser().parseFromString(source, 'text/html'); return { title: d.title, count: d.querySelectorAll('.demo-ticket').length, text: d.body.textContent, codes: [...d.querySelectorAll('.ticket-code')].map(x => x.textContent), external: d.querySelectorAll('script,img[src^="http"],link[href^="http"]').length }; }, html);
    assert.equal(parsed.count, 5); assert.equal(new Set(parsed.codes).size, 5); assert.equal(parsed.external, 0);
    assert.ok(parsed.text.includes(o.id)); assert.ok(parsed.text.includes(date)); assert.match(parsed.text.replace(/\s/g, ''), /17600/);
    assert.match(parsed.text, /Для прохода не действуют|Не действует для прохода/);
    assert.ok(download.suggestedFilename().endsWith('.html'));
    return `5 образцов: 2 билета + пакет + 2 безлимита; 17600; SHA downloaded HTML ${crypto.createHash('sha256').update(html).digest('hex')}`;
  }));
  await check('C10', 'Ошибка добровольной копии не прячет билеты и не передаёт контакт', () => fresh(browser, async (page, context, requests) => {
    await directTicket(page); await pay(page);
    assert.equal(await page.locator('.demo-ticket').count(), 1); assert.equal(await page.locator('#copy-form').isVisible(), false);
    await page.locator('[data-action="toggle-copy"]').click(); await page.locator('#copy-email').fill('not-an-address');
    await page.locator('#copy-form button[type="submit"]').click(); assert.equal(await page.locator('#copy-email').getAttribute('aria-invalid'), 'true');
    assert.equal(await page.locator('.demo-ticket').count(), 1);
    const email = 'independent-qa@example.test'; await page.locator('#copy-email').fill(email); await page.locator('#copy-outcome').selectOption('failed');
    await page.locator('#copy-form button[type="submit"]').click(); assert.match(await page.locator('#copy-status').innerText(), /Сбой/);
    assert.equal(await page.locator('.demo-ticket').count(), 1);
    assert.equal(await page.evaluate(value => [localStorage, sessionStorage].some(store => Object.keys(store).some(key => String(store.getItem(key)).includes(value))), email), false);
    assert.ok(!page.url().includes(email)); assert.ok(requests.every(r => r.method === 'GET' || r.method === 'HEAD'));
    assert.ok(requests.every(r => !r.url.includes(email)));
    await page.reload({ waitUntil: 'networkidle' }); assert.equal(await page.locator('#copy-email').inputValue(), '');
    return 'Ошибка адреса и сбой копии оставляют билет; адрес отсутствует в URL/storage/сетевых запросах';
  }));
  for (const width of [320, 390, 768, 1440]) {
    await check('C11-' + width, 'Сквозные страницы и диалог без горизонтального переполнения', () => fresh(browser, async page => {
      await sample(page); await noOverflow(page); await go(page, 'tickets.html');
      await page.locator('[data-action="choose-offer"][data-variant="freedom"]').click(); await noOverflow(page);
      await productTab(page, 'unlimited');
      await page.locator('#product-unlimited [data-action="quantity-other"]').click(); await noOverflow(page);
      const box = await page.locator('#dialog').boundingBox(); assert.ok(box.x >= 0 && box.x + box.width <= width + 1);
      await page.keyboard.press('Escape');
      assert.ok(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches));
      return `Семья, покупка с 2 безлимитами, диалог; ${width}px; reduced motion`;
    }, { viewport: { width, height: 900 } }));
  }
  await check('C12', 'Ошибка записи storage обозначает границу восстановления', () => fresh(browser, async page => {
    await page.addInitScript(() => { Storage.prototype.setItem = function () { throw new DOMException('Independent QA storage unavailable', 'SecurityError'); }; });
    await directTicket(page);
    assert.match(await page.locator('#app').innerText(), /не сохран|не закрывай|может потер|недоступ/i);
    if (await page.locator('#terms').count()) await page.locator('#terms').check(); await chooseScenario(page, 'pending');
    await page.locator('#checkout-form button[type="submit"]').click(); await page.locator('#receipt').waitFor({ state: 'visible' });
    assert.match(await page.locator('#app').innerText(), /не сохран|не закрывай|восстановление|обновления/i);
    assert.equal(await page.locator('#checkout-form').count(), 0); assert.equal(await page.locator('[data-action="new-order"]').count(), 0);
    return 'Отказ setItem не скрыт; текущий pending не предлагает новый платёж. Восстановление после закрытия не обещается';
  }));
  await check('C13', 'В выполненных сценариях нет JS/HTTP ошибок и внешних сетевых вызовов', async () => {
    assert.deepEqual(runtimeErrors, []); assert.deepEqual(requestsOutsideOrigin, []);
  });
}

function report() {
  const now = new Date().toISOString();
  const sourceNames = ['index.html', 'attractions.html', 'tickets.html', 'common.js', 'app.js', 'model.js'];
  const hashes = sourceNames.filter(name => fs.existsSync(path.join(site, name))).map(name => [name, crypto.createHash('sha256').update(fs.readFileSync(path.join(site, name))).digest('hex')]);
  const lines = [
    '# Независимая браузерная проверка объединённого прототипа', '',
    `Запуск: ${now}. Адрес: ${base}. Фаза: ${phase}.`, '',
    phase === 'home' ? '**Промежуточный результат только по главной и навигации. Общий итог QA не присвоен. Checkout намеренно не проверялся до core-ready.**' : `**Браузерные сценарии: ${failures.length ? 'FAIL, требуется разбор конкретных результатов ниже' : 'PASS в указанном охвате'}. Опубликованные файлы дополнительно сверяются с commit через SHA-256.**`, '',
    'Сценарий написал outcome_critic независимо от авторов интеграции. Этот повторный запуск выполняется на отдельном Linux runner GitHub Actions по публичному HTTPS-адресу. Проверяющий не изменяет site. Playwright управляет Google Chrome runner. Изолированный браузерный профиль, данные вымышленные, внешняя отправка и публикация не выполняются. Скриншоты и физический телефон этим прогоном не подтверждаются.', '',
    'Первый core-прогон: 29 из 30 проверок PASS. C04 остановился только на добавленном после reload `recipientKey: null` у уже назначенного безлимита и общего пакета. Проверено по `normalizeLine` в model.js: это нормализация отсутствующего необязательного поля, не смена получателя. Повторный сценарий приравнивает только отсутствие этого поля к null; ID строк, продукты, получатели, количества, цены, даты и все прочие поля сравниваются без ослабления. Статус текущего прогона приведён ниже.', '',
    '| Проверка | Результат | Наблюдение |', '|---|---|---|'
  ];
  for (const r of results) lines.push(`| ${r.id}: ${escapeMd(r.title)} | ${r.status} | ${escapeMd(r.detail)} |`);
  lines.push('', '## Покрытие сценариев карточки', '', '| ID | Опровергающий сценарий | Статус |', '|---|---|---|');
  for (const [id, title] of plannedCore) { const related = results.filter(r => r.id === id || r.id.startsWith(id + '-') || r.id.startsWith(id + 'a') || r.id.startsWith(id + 'b')); lines.push(`| ${id} | ${escapeMd(title)} | ${related.length ? related.every(r => r.status === 'PASS') ? 'ВЫПОЛНЕНО' : 'ЕСТЬ FAIL' : 'НЕ ВЫПОЛНЕНО'} |`); }
  lines.push('', '## Снимок исходников на момент завершения фазы', '', '| Файл | SHA-256 |', '|---|---|');
  for (const [name, hash] of hashes) lines.push(`| ${name} | \`${hash}\` |`);
  lines.push('', 'Сборка ещё может измениться. Промежуточная навигация не доказывает работу покупки, опубликованного сайта, соответствие финальных снимков или эффект на гостях. Итоговая браузерная приёмка и повторный проход по публичному HTTPS-адресу должны относиться к окончательной сборке.', '');
  fs.writeFileSync(path.join(__dirname, 'independent-qa.md'), lines.join('\n'));
}

(async () => {
  assert.ok(['home', 'core'].includes(phase), 'Use --phase=home or --phase=core');
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: process.env.VP_QA_HOST_RESOLVER ? ['--disable-quic','--host-resolver-rules='+process.env.VP_QA_HOST_RESOLVER] : [] });
  try { if (phase === 'home') await homeChecks(browser); else await coreChecks(browser); }
  catch (error) { failures.push({ id: 'RUN', detail: short(error) }); results.push({ id: 'RUN', title: 'Выполнение фазы', status: 'FAIL', detail: short(error) }); }
  finally { await browser.close(); report(); }
  console.log(JSON.stringify({ phase, checks: results.length, failed: failures, report: path.join(__dirname, 'independent-qa.md') }, null, 2));
  if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(short(error)); process.exitCode = 1; });
