(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VP3 = api;
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  // All numbers below describe a fictional teaching model, never Victory Park rules.
  function freeze(value) { Object.freeze(value); Object.keys(value).forEach(function (k) { if (value[k] && typeof value[k] === 'object' && !Object.isFrozen(value[k])) freeze(value[k]); }); return value; }
  var realRides = freeze([
    ['water-swan', 'Плавающий лебедь'], ['wheel-of-happiness', 'Колесо счастья'], ['autodrom', 'Автодром'],
    ['mars-ride', 'Полет на Марс'], ['planet', 'Планета'], ['moto-ufo', 'Мощный НЛО'], ['pendulum', 'Метроном'],
    ['rotating-tower', 'Вращающаяся башня'], ['rocket', 'Космический корабль'], ['VR-cinema', 'Виртуальная реальность'], ['VR-for-2', 'Виртуальное путешествие']
  ].map(function (x) { return { id: x[0], name: x[1], photo: 'assets/' + x[0] + '.webp', price: null, intensity: null, ageRange: null, ageBasis: null, rules: null, operation: 'unknown', fictional: false }; }));
  function demo(id, name, price, intensity, ages, symbol, min, max, soloMin, photo) {
    return { id: id, name: name, price: price, photo: photo, intensity: intensity, ageRange: ages,
      ageBasis: ages ? 'Учебная редакционная подсказка, не правило допуска и не описание реального парка.' : null,
      symbol: symbol, rules: min === null ? null : { min: min, max: max, soloMin: soloMin, companionMin: 140, companionMax: 210, companionRatio: 1 }, operation: 'open', fictional: true };
  }
  var demoRides = freeze([
    demo('demo-calm', 'Детский паровозик', 900, 'calm', [4, 12], '○', 90, 210, 120, 'assets/demo-train.webp'),
    demo('demo-thrill', 'Американские горки', 1400, 'exciting', [9, 17], '↗', 130, 200, 140, 'assets/demo-coaster.webp'),
    demo('demo-together', 'Чайные чашки', 1100, 'calm', [5, 14], '∞', 100, 210, 140, 'assets/demo-teacups.webp'),
    demo('demo-small', 'Детская карусель', 600, 'calm', [3, 8], '◒', 80, 125, 80, 'assets/demo-carousel.webp'),
    demo('demo-unknown', 'Цепочная карусель', 700, 'exciting', null, '?', null, null, null, 'assets/demo-swings.webp'),
    // Park names and photos illustrate the picker; every condition and price is fictional.
    demo('demo-water-swan', 'Плавающий лебедь', 1000, 'calm', [4, 12], '○', 90, 210, 130, 'assets/water-swan.webp'),
    demo('demo-wheel-of-happiness', 'Колесо счастья', 1200, 'calm', [4, 17], '○', 90, 210, 130, 'assets/wheel-of-happiness.webp'),
    demo('demo-autodrom', 'Автодром', 1400, 'exciting', [8, 17], '↗', 110, 200, 140, 'assets/autodrom.webp'),
    demo('demo-mars-ride', 'Полет на Марс', 1700, 'exciting', [10, 17], '↗', 130, 200, 150, 'assets/mars-ride.webp'),
    demo('demo-planet', 'Планета', 1500, 'exciting', [9, 17], '↗', 120, 200, 140, 'assets/planet.webp'),
    demo('demo-moto-ufo', 'Мощный НЛО', 1500, 'exciting', [9, 17], '↗', 120, 200, 140, 'assets/moto-ufo.webp'),
    demo('demo-pendulum', 'Метроном', 1800, 'exciting', [12, 17], '↗', 140, 200, 140, 'assets/pendulum.webp'),
    demo('demo-rotating-tower', 'Вращающаяся башня', 1300, 'exciting', [7, 17], '↗', 110, 200, 140, 'assets/rotating-tower.webp'),
    demo('demo-rocket', 'Космический корабль', 1500, 'exciting', [9, 17], '↗', 120, 200, 140, 'assets/rocket.webp'),
    demo('demo-vr-cinema', 'Виртуальная реальность', 1100, 'exciting', [7, 17], '↗', 100, 210, 120, 'assets/VR-cinema.webp')
  ]);
  var legacyDemoRides = demoRides.slice(0, 5);
  var MAX_QUANTITY = 20;
  var products = freeze({
    ticket: { id: 'ticket', name: 'Билет на одно катание', price: null, includedRideIds: legacyDemoRides.map(function (r) { return r.id; }), personal: false, dateRequired: false, fictional: true,
      terms: ['Учебный билет на выбранный аттракцион. Цена зависит от аттракциона.', 'Одно оплаченное катание. Учебный срок: один день первого использования. Не подтверждает допуск.', 'В учебной модели необходимое сопровождение включено в право ребёнка; отдельное катание взрослого покупается только по его желанию.'] },
    package5: { id: 'package5', name: 'Общий пакет на 5 катаний', price: 4000, includedRideIds: ['demo-calm', 'demo-thrill', 'demo-together', 'demo-small'], rides: 5, personal: false, dateRequired: false, fictional: true,
      terms: ['Учебный пакет: 5 катаний на четыре перечисленных аттракциона.', 'Общий для участников компании, повторные катания расходуют по одному праву.', 'Цепочная карусель не входит. Пять прав на катание общие для всей компании.', 'Учебный срок: один день первого использования. Приоритетной очереди нет.', 'Необходимое сопровождение включено; личные катания взрослого расходуют отдельные права.'] },
    unlimited: { id: 'unlimited', name: 'Личный безлимит на день', price: 5900, includedRideIds: ['demo-calm', 'demo-thrill', 'demo-together'], personal: true, dateRequired: false, fictional: true,
      terms: ['Учебный личный безлимит для одного участника. Срок: один день первого использования; это проектное условие, не правило парка.', 'Детский паровозик, Американские горки и Чайные чашки без ограничения числа катаний в этот день.', 'Детская карусель и Цепочная карусель оплачиваются отдельно.', 'Не передаётся другому человеку. Приоритетной очереди нет.', 'Учебная выдача после подтверждённой оплаты: код для обмена в демонстрационной кассе на личный носитель. Это не рабочая интеграция.', 'Необходимое сопровождение включено; сопровождающий не становится покупателем личного безлимита автоматически.'] }
  });
  // Keep the exact 3.1 commercial terms for orders issued before paid accompaniment.
  var legacy31Products = products;
  var nextProducts = copy(products);
  nextProducts.ticket.terms[2] = 'Если ребёнку нужен сопровождающий, взрослому также нужно оплаченное право на это катание. Учебная взрослая цена равна цене детского билета.';
  nextProducts.package5.terms[4] = 'Совместное катание ребёнка и взрослого расходует два из пяти общих прав. Это не пять совместных катаний.';
  nextProducts.unlimited.terms[5] = 'Если ребёнку нужно сопровождение на входящем аттракционе, взрослому нужен свой безлимит. Один взрослый сопровождает детей по очереди; его безлимит учитывается один раз в заказе.';
  products = freeze(nextProducts);
  // Orders issued in 3.2 retain their five-ride catalog and paid accompaniment terms.
  var legacy32Products = products;
  var expandedProducts = copy(products);
  expandedProducts.ticket.includedRideIds = demoRides.map(function (ride) { return ride.id; });
  products = freeze(expandedProducts);
  var MODEL_VERSION = 'family-demo-3.3';
  // Explicit fictional admission examples. Editorial ageRange is deliberately separate.
  var admissionRules = freeze({
    'demo-calm': { minAge: 3, maxAge: null, soloAge: 8, adultPrice: 900 },
    'demo-thrill': { minAge: 8, maxAge: null, soloAge: 12, adultPrice: 1400 },
    'demo-together': { minAge: 4, maxAge: null, soloAge: 8, adultPrice: 1100 },
    'demo-small': { minAge: 3, maxAge: 8, soloAge: 3, adultPrice: 600 },
    'demo-water-swan': { minAge: 3, maxAge: null, soloAge: 8, adultPrice: 1000 },
    'demo-wheel-of-happiness': { minAge: 3, maxAge: null, soloAge: 10, adultPrice: 1200 },
    'demo-autodrom': { minAge: 6, maxAge: null, soloAge: 12, adultPrice: 1400 },
    'demo-mars-ride': { minAge: 10, maxAge: null, soloAge: 14, adultPrice: 1700 },
    'demo-planet': { minAge: 8, maxAge: null, soloAge: 12, adultPrice: 1500 },
    'demo-moto-ufo': { minAge: 8, maxAge: null, soloAge: 12, adultPrice: 1500 },
    'demo-pendulum': { minAge: 12, maxAge: null, soloAge: 12, adultPrice: 1800 },
    'demo-rotating-tower': { minAge: 6, maxAge: null, soloAge: 10, adultPrice: 1300 },
    'demo-rocket': { minAge: 8, maxAge: null, soloAge: 12, adultPrice: 1500 },
    'demo-vr-cinema': { minAge: 6, maxAge: null, soloAge: 10, adultPrice: 1100 }
  });
  var VALIDITY = 'Один день первого использования';
  // Exact original catalog. Existing orders keep the names and rights they were issued with.
  var legacyOrderCatalog = freeze({
  "rides": {
    "demo-calm": {
      "name": "Тихая прогулка",
      "price": 900
    },
    "demo-thrill": {
      "name": "Вираж",
      "price": 1400
    },
    "demo-together": {
      "name": "Вдвоём веселее",
      "price": 1100
    },
    "demo-small": {
      "name": "Маленький круг",
      "price": 600
    },
    "demo-unknown": {
      "name": "Новый маршрут",
      "price": 700
    }
  },
  "products": {
    "ticket": {
      "name": "Билет на одно катание",
      "price": null,
      "includedRideIds": [
        "demo-calm",
        "demo-thrill",
        "demo-together",
        "demo-small",
        "demo-unknown"
      ],
      "terms": [
        "Учебный билет на выбранный аттракцион. Цена зависит от аттракциона.",
        "Одно оплаченное катание. Учебный срок: один день первого использования. Не подтверждает допуск.",
        "В учебной модели необходимое сопровождение включено в право ребёнка; отдельное катание взрослого покупается только по его желанию."
      ]
    },
    "package5": {
      "name": "Общий пакет на 5 катаний",
      "price": 4000,
      "includedRideIds": [
        "demo-calm",
        "demo-thrill",
        "demo-together",
        "demo-small"
      ],
      "terms": [
        "Учебный пакет: 5 катаний на четыре перечисленных аттракциона.",
        "Общий для участников компании, повторные катания расходуют по одному праву.",
        "Новый маршрут не входит. Пять прав на катание общие для всей компании.",
        "Учебный срок: один день первого использования. Приоритетной очереди нет.",
        "Необходимое сопровождение включено; личные катания взрослого расходуют отдельные права."
      ]
    },
    "unlimited": {
      "name": "Личный безлимит на день",
      "price": 5900,
      "includedRideIds": [
        "demo-calm",
        "demo-thrill",
        "demo-together"
      ],
      "terms": [
        "Учебный личный безлимит для одного участника. Срок: один день первого использования; это проектное условие, не правило парка.",
        "Тихая прогулка, Вираж и Вдвоём веселее без ограничения числа катаний в этот день.",
        "Маленький круг и Новый маршрут оплачиваются отдельно.",
        "Не передаётся другому человеку. Приоритетной очереди нет.",
        "Учебная выдача после подтверждённой оплаты: код для обмена в демонстрационной кассе на личный носитель. Это не рабочая интеграция.",
        "Необходимое сопровождение включено; сопровождающий не становится покупателем личного безлимита автоматически."
      ]
    }
  }
} );
  var currentOrderCatalog = freeze({
    rides: demoRides.reduce(function (out, ride) { out[ride.id] = { name: ride.name, price: ride.price }; return out; }, {}),
    products: products
  });
  var legacyNamedRides = legacyDemoRides.reduce(function (out, ride) { out[ride.id] = { name: ride.name, price: ride.price }; return out; }, {});
  var orderCatalogs = freeze({
    'family-demo-3': legacyOrderCatalog,
    'family-demo-3.1': { rides: legacyNamedRides, products: legacy31Products },
    'family-demo-3.2': { rides: legacyNamedRides, products: legacy32Products },
    'family-demo-3.3': currentOrderCatalog
  });
  var rideMap = {};
  realRides.concat(demoRides).forEach(function (r) { rideMap[r.id] = r; });
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function unique(values) { return Array.from(new Set(values)); }
  function id(value) { return typeof value === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(value) ? value : null; }
  function integer(value, min, max) { return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max; }
  function label(value, fallback) { return typeof value === 'string' && value.trim() ? value.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 80) || fallback : fallback; }
  function equal(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function priceFor(line, catalog) {
    var productCatalog = catalog ? catalog.products : products;
    if (!line || !Object.prototype.hasOwnProperty.call(productCatalog, line.productId)) return null;
    if (line.productId !== 'ticket') return productCatalog[line.productId].price;
    if (catalog) return Object.prototype.hasOwnProperty.call(catalog.rides, line.rideId) ? catalog.rides[line.rideId].price : null;
    var ride = rideMap[line.rideId]; return ride && ride.fictional ? ride.price : null;
  }
  function emptyState() { return { version: 3, mode: 'demo', party: [], selections: { real: [], demo: [] }, riders: [], ridersConfirmed: false, companionId: null, companionAutoSelected: false, cart: { lines: [] }, _issues: [] }; }
  function sanitizeState(raw) {
    var out = emptyState(); if (!raw || typeof raw !== 'object') return out;
    var issues = Array.isArray(raw._issues) ? raw._issues.filter(function (x) { return ['version', 'party', 'selection', 'cart'].includes(x); }) : [];
    if (raw.version != null && raw.version !== 3) issues.push('version');
    out.mode = raw.mode === 'real' ? 'real' : 'demo';
    var people = Array.isArray(raw.party) ? raw.party : [], seen = new Set();
    if (people.length > 8) issues.push('party');
    people.slice(0, 8).forEach(function (p, i) {
      if (!p || !id(p.id) || seen.has(p.id) || !['adult', 'child'].includes(p.role)) { issues.push('party'); return; }
      seen.add(p.id);
      if (p.role === 'adult' && p.age != null && !integer(p.age, 18, 120)) issues.push('party');
      out.party.push({ id: p.id, label: label(p.label, (p.role === 'adult' ? 'Взрослый ' : 'Ребёнок ') + (i + 1)), role: p.role,
        age: p.role === 'adult' ? (p.age == null ? 18 : integer(p.age, 0, 120) ? p.age : -1) : integer(p.age, 0, 17) ? p.age : null,
        height: typeof p.height === 'number' && Number.isFinite(p.height) && p.height >= 40 && p.height <= 250 ? p.height : null });
    });
    ['real', 'demo'].forEach(function (mode) {
      var allowed = (mode === 'real' ? realRides : demoRides).map(function (r) { return r.id; });
      var selected = raw.selections && Array.isArray(raw.selections[mode]) ? raw.selections[mode] : [];
      if (selected.some(function (x) { return !allowed.includes(x); })) issues.push('selection');
      out.selections[mode] = unique(selected.filter(function (x) { return allowed.includes(x); }));
    });
    out.riders = unique((Array.isArray(raw.riders) ? raw.riders : []).filter(function (x) { return seen.has(x); }));
    out.ridersConfirmed = raw.ridersConfirmed === true;
    out.companionId = id(raw.companionId) || null;
    out.companionAutoSelected = !!out.companionId && raw.companionAutoSelected === true;
    var lines = raw.cart && Array.isArray(raw.cart.lines) ? raw.cart.lines : [], lineIds = new Set();
    if (lines.length > 100) issues.push('cart');
    lines.slice(0, 100).forEach(function (line, i) {
      if (!line || typeof line !== 'object') { issues.push('cart'); return; }
      var lineId = id(line.id) || 'line-' + (i + 1);
      if (lineIds.has(lineId)) { issues.push('cart'); lineId = 'restored-line-' + i; }
      lineIds.add(lineId);
      var productId = Object.prototype.hasOwnProperty.call(products, line.productId) ? line.productId : 'invalid';
      if ((line.personId && !id(line.personId)) || (line.recipientKey && !id(line.recipientKey))) issues.push('cart');
      out.cart.lines.push({ id: lineId, productId: productId, rideId: productId === 'ticket' ? (id(line.rideId) || null) : null,
        personId: productId === 'package5' ? null : (id(line.personId) || null),
        recipientKey: productId === 'unlimited' && !id(line.personId) ? (id(line.recipientKey) || null) : null,
        quantity: integer(line.quantity, 1, MAX_QUANTITY) ? line.quantity : null, unitPrice: priceFor(line),
        autoCompanion: line.autoCompanion === true,
        companionFor: unique((Array.isArray(line.companionFor) ? line.companionFor : []).filter(function (value) { return id(value); })),
        companionReason: line.autoCompanion === true ? label(line.companionReason, 'Сопровождение ребёнка') : null });
    });
    out._issues = unique(issues); return out;
  }
  function sampleState() {
    var s = emptyState();
    s.party = [{ id: 'adult-1', label: 'Взрослый 1', role: 'adult', age: 38, height: null }, { id: 'adult-2', label: 'Взрослый 2', role: 'adult', age: 36, height: null }, { id: 'child-1', label: 'Ребёнок 1', role: 'child', age: 6, height: null }, { id: 'child-2', label: 'Ребёнок 2', role: 'child', age: 11, height: null }];
    s.selections.demo = ['demo-calm', 'demo-thrill', 'demo-together'];
    return s;
  }
  function ageHint(ride, person) {
    if (typeof ride === 'string') ride = rideMap[ride];
    if (!ride || !ride.fictional || !ride.ageRange) return { status: 'unknown', text: 'Возрастная рекомендация не подтверждена.' };
    if (!person || person.role !== 'child' || !integer(person.age, 0, 17)) return { status: 'unknown', text: 'Учебный возрастной ориентир: ' + ride.ageRange[0] + '-' + ride.ageRange[1] + ' лет. Это не правило допуска.' };
    var inside = person.age >= ride.ageRange[0] && person.age <= ride.ageRange[1];
    return { status: inside ? 'suggested' : 'outside', text: (inside ? 'В возрастном ориентире' : 'Вне возрастного ориентира') + ' ' + ride.ageRange[0] + '-' + ride.ageRange[1] + ' лет. Возраст не подтверждает допуск.' };
  }
  function admission(ride, person) {
    if (typeof ride === 'string') ride = rideMap[ride];
    var out = { status: 'unknown', reasons: [], needsHeight: false, needsCompanion: false, companionKnown: false, priceNeedsHeight: false };
    if (!ride || !ride.fictional || !ride.rules || !admissionRules[ride.id]) { out.reasons.push('Условия допуска нужно уточнить у парка.'); return out; }
    if (!person || !['adult', 'child'].includes(person.role)) { out.reasons.push('Участник не выбран.'); return out; }
    var age = person.role === 'adult' && person.age == null ? 18 : person.age, rule = admissionRules[ride.id], r = ride.rules;
    if (!integer(age, person.role === 'adult' ? 18 : 0, person.role === 'adult' ? 120 : 17)) { out.reasons.push('Укажите возраст кнопкой.'); return out; }
    if (age < rule.minAge || (rule.maxAge !== null && age > rule.maxAge)) { out.status = 'blocked'; out.companionKnown = true; out.reasons.push('Возраст вне учебных условий: ' + rule.minAge + (rule.maxAge === null ? '+' : '-' + rule.maxAge) + ' лет.'); return out; }
    var hasHeight = typeof person.height === 'number' && Number.isFinite(person.height) && person.height >= 40 && person.height <= 250;
    if (hasHeight && (person.height < r.min || person.height > r.max)) { out.status = 'blocked'; out.companionKnown = true; out.reasons.push('Рост ' + person.height + ' см вне учебного диапазона ' + r.min + '-' + r.max + ' см.'); return out; }
    var byAge = person.role === 'child' && age < rule.soloAge;
    var byHeight = person.role === 'child' && hasHeight && person.height < r.soloMin;
    out.needsHeight = !hasHeight;
    out.needsCompanion = byAge || byHeight;
    out.companionKnown = person.role === 'adult' || byAge || hasHeight || r.soloMin <= r.min;
    out.priceNeedsHeight = !out.companionKnown;
    out.status = out.needsCompanion ? 'accompanied' : hasHeight ? 'solo' : 'unknown';
    if (out.needsCompanion) out.reasons.push('Только со взрослым 18+.');
    if (!hasHeight) out.reasons.push('Рост ' + r.min + '-' + r.max + ' см нужно проверить; возраст не подтверждает допуск.');
    if (out.priceNeedsHeight) out.reasons.push('При росте ниже ' + r.soloMin + ' см нужен оплаченный сопровождающий. Уточните рост для полной суммы.');
    if (hasHeight && !out.needsCompanion) out.reasons.push('Возраст и рост соответствуют показанным учебным условиям.');
    return out;
  }
  function eligible(ride, person) {
    var result = admission(ride, person);
    return Object.assign({}, result, { status: result.status === 'solo' ? 'eligible' : result.status === 'blocked' ? 'blocked' : 'unknown' });
  }
  function reconcileCompanions(input) {
    var s = sanitizeState(input), manual = s.cart.lines.filter(function (line) { return !line.autoCompanion; });
    var initialAdults = s.party.filter(function (p) { return p.role === 'adult' && integer(p.age, 18, 120); });
    var initialAdult = (!s.companionAutoSelected || initialAdults.length === 1 ? initialAdults.find(function (p) { return p.id === s.companionId; }) : null) || (initialAdults.length === 1 ? initialAdults[0] : null);
    var prepaidAdultPass = initialAdult && manual.some(function (line) { return line.productId === 'unlimited' && line.personId === initialAdult.id && line.quantity === 1; });
    var issues = [], additions = [], notes = [], passChildren = [], ticketNeeds = {}, needsByRide = {}, coverage = { packageRightsUsed: 0, ticketRightsUsed: 0, possiblePackageRights: 0, possibleTicketRights: 0, passUsed: false };
    function autoId(prefix) { var value = prefix, suffix = 1; while (manual.concat(additions).some(function (line) { return line.id === value; })) value = prefix + '-' + suffix++; return value; }
    function issue(code, message, personId, rideId) { if (!issues.some(function (x) { return x.code === code && x.personId === (personId || null) && x.rideId === (rideId || null); })) issues.push({ code: code, message: message, personId: personId || null, rideId: rideId || null }); }
    function need(person, rideId, count) { if (!needsByRide[rideId]) needsByRide[rideId] = []; needsByRide[rideId].push(person.id); if (count) ticketNeeds[rideId] = (ticketNeeds[rideId] || 0) + count; }
    manual.forEach(function (line) {
      if (!['ticket', 'unlimited'].includes(line.productId) || !integer(line.quantity, 1, MAX_QUANTITY)) return;
      var person = s.party.find(function (p) { return p.id === line.personId; });
      if (!person) { issue('recipient-required', 'Выберите, кому предназначен ' + (line.productId === 'ticket' ? 'билет' : 'безлимит') + '.', null, line.rideId); return; }
      if (person.role !== 'child') return;
      if (!integer(person.age, 0, 17)) { issue('child-age-required', person.label + ': выберите возраст для расчёта сопровождения.', person.id); return; }
      var ids = line.productId === 'ticket' ? [line.rideId] : products.unlimited.includedRideIds, accompanied = [], undecided = [];
      ids.forEach(function (rideId) {
        var check = admission(rideId, person);
        if (check.needsHeight) notes.push(person.label + ': возраст не заменяет проверку роста перед катанием.');
        if (check.status === 'blocked') return;
        if (check.needsCompanion) accompanied.push(rideId);
        else if (check.priceNeedsHeight) {
          if (prepaidAdultPass && products.unlimited.includedRideIds.includes(rideId)) { accompanied.push(rideId); notes.push('Возможное сопровождение покрыто уже выбранным взрослым безлимитом; рост нужно проверить перед катанием.'); }
          else undecided.push(rideId);
        }
        else if (!check.companionKnown) issue('rules-unknown', person.label + ': условия сопровождения для этого аттракциона не подтверждены. Выберите другой учебный пример.', person.id, rideId);
      });
      if (line.productId === 'unlimited' && accompanied.length) {
        passChildren.push(person.id); accompanied.forEach(function (rideId) { need(person, rideId, 0); });
      } else {
        undecided.forEach(function (rideId) { issue('height-required', person.label + ': уточните рост для полной суммы с сопровождением.', person.id, rideId); });
        if (line.productId === 'ticket') accompanied.forEach(function (rideId) { need(person, rideId, line.quantity); });
      }
    });
    var required = Object.keys(needsByRide).length > 0;
    var adults = s.party.filter(function (p) { return p.role === 'adult' && integer(p.age, 18, 120); });
    // A sole adult is a convenience default, not a deliberate choice. If the
    // family later contains several adults, ask once instead of retaining it.
    if (s.companionAutoSelected && adults.length !== 1) { s.companionId = null; s.companionAutoSelected = false; }
    var adult = adults.find(function (p) { return p.id === s.companionId; });
    if (!adult && adults.length === 1) { adult = adults[0]; s.companionId = adult.id; s.companionAutoSelected = true; }
    if (!adult && s.companionId) { s.companionId = null; s.companionAutoSelected = false; }
    if (required && !adult) issue('companion-required', adults.length ? 'Выберите одного сопровождающего 18+ на весь заказ.' : 'Добавьте сопровождающего 18+ для детских катаний.');
    if (required && adult) {
      Object.keys(needsByRide).forEach(function (rideId) {
        var ride = rideMap[rideId], r = ride.rules, check = admission(ride, adult);
        if (check.status === 'blocked' || (typeof adult.height === 'number' && (adult.height < r.companionMin || adult.height > r.companionMax))) issue('companion-unavailable', adult.label + ': не подходит для сопровождения на «' + ride.name + '» по указанным данным. Выберите другого взрослого.', adult.id, rideId);
        else if (adult.height === null) notes.push(adult.label + ': перед катанием проверьте рост сопровождающего ' + r.companionMin + '-' + Math.min(r.companionMax, r.max) + ' см.');
      });
      var adultPass = manual.some(function (line) { return line.productId === 'unlimited' && line.personId === adult.id && line.quantity === 1; });
      if (passChildren.length && !adultPass) {
        var pass = newLine('unlimited', adult.id, null, 1);
        pass.id = autoId('auto-companion-pass');
        pass.autoCompanion = true; pass.companionFor = unique(passChildren);
        pass.companionReason = 'Безлимит сопровождающего: дети катаются с одним взрослым по очереди.';
        additions.push(pass); adultPass = true;
      }
      // An adult pass required by one child also settles the possible paid
      // accompaniment of another child. Do not ask for height when it cannot
      // change this order's price; admission still needs checking before riding.
      if (adultPass) {
        issues = issues.filter(function (item) {
          if (item.code !== 'height-required' || !products.unlimited.includedRideIds.includes(item.rideId)) return true;
          var r = rideMap[item.rideId].rules;
          if (admission(item.rideId, adult).status === 'blocked' || (typeof adult.height === 'number' && (adult.height < r.companionMin || adult.height > r.companionMax))) return true;
          notes.push('Возможное сопровождение других детей покрыто тем же взрослым безлимитом; рост нужно проверить перед катанием.');
          return false;
        });
      }
      var packagePool = manual.reduce(function (n, line) { return n + (line.productId === 'package5' && integer(line.quantity, 1, MAX_QUANTITY) ? line.quantity * 5 : 0); }, 0);
      Object.keys(ticketNeeds).forEach(function (rideId) {
        var requiredRights = ticketNeeds[rideId];
        if (adultPass && products.unlimited.includedRideIds.includes(rideId)) { coverage.passUsed = true; return; }
        var existing = manual.reduce(function (n, line) { return n + (line.productId === 'ticket' && line.personId === adult.id && line.rideId === rideId && integer(line.quantity, 1, MAX_QUANTITY) ? line.quantity : 0); }, 0);
        var used = Math.min(requiredRights, existing); coverage.ticketRightsUsed += used; requiredRights -= used;
        if (products.package5.includedRideIds.includes(rideId)) { used = Math.min(requiredRights, packagePool); coverage.packageRightsUsed += used; requiredRights -= used; packagePool -= used; }
        if (requiredRights > MAX_QUANTITY) { issue('too-many-companion-rights', 'Для одного учебного аттракциона не больше 20 прав сопровождения.', adult.id, rideId); return; }
        if (requiredRights) {
          var ticket = newLine('ticket', adult.id, rideId, requiredRights);
          ticket.id = autoId('auto-companion-' + rideId);
          ticket.autoCompanion = true; ticket.companionFor = unique(needsByRide[rideId]); ticket.companionReason = 'Взрослое право на каждое совместное катание.';
          additions.push(ticket);
        }
      });
      if (passChildren.length) notes.push('Один взрослый безлимит на семью. Дети катаются с сопровождающим по очереди.');
      if (coverage.passUsed) notes.push('Сопровождение разовых катаний покрыто безлимитом выбранного взрослого.');
      if (coverage.ticketRightsUsed) notes.push('Уже выбранные взрослые билеты учтены в сопровождении: ' + coverage.ticketRightsUsed + '.');
      if (coverage.packageRightsUsed) notes.push('На сопровождение выбранных детских билетов пойдёт ' + coverage.packageRightsUsed + ' из общих прав пакета. Эти права нельзя использовать повторно.');
    }
    // Resolve price-only height questions against rights already in this order.
    // Reserve known accompaniment first, then possible accompaniment; a shared
    // package or a single adult ticket must not be counted twice.
    var possibleCovered = false;
    if (adult && issues.some(function (item) { return item.code === 'height-required'; })) {
      var resolvedPass = manual.concat(additions).some(function (line) { return line.productId === 'unlimited' && line.personId === adult.id && line.quantity === 1; });
      var availableTickets = {};
      manual.forEach(function (line) { if (line.productId === 'ticket' && line.personId === adult.id && integer(line.quantity, 1, MAX_QUANTITY)) availableTickets[line.rideId] = (availableTickets[line.rideId] || 0) + line.quantity; });
      Object.keys(availableTickets).forEach(function (rideId) { if (!(resolvedPass && products.unlimited.includedRideIds.includes(rideId))) availableTickets[rideId] = Math.max(0, availableTickets[rideId] - (ticketNeeds[rideId] || 0)); });
      var remainingPackage = manual.reduce(function (n, line) { return n + (line.productId === 'package5' && integer(line.quantity, 1, MAX_QUANTITY) ? line.quantity * 5 : 0); }, 0) - coverage.packageRightsUsed;
      issues = issues.filter(function (item) {
        if (item.code !== 'height-required') return true;
        var ride = rideMap[item.rideId], r = ride.rules;
        if (admission(ride, adult).status === 'blocked' || (typeof adult.height === 'number' && (adult.height < r.companionMin || adult.height > r.companionMax))) return true;
        if (resolvedPass && products.unlimited.includedRideIds.includes(item.rideId)) { possibleCovered = true; return false; }
        // A child's unlimited still requires an adult unlimited, not a few tickets.
        if (manual.some(function (line) { return line.productId === 'unlimited' && line.personId === item.personId; })) return true;
        var needed = manual.reduce(function (n, line) { return n + (line.productId === 'ticket' && line.personId === item.personId && line.rideId === item.rideId && integer(line.quantity, 1, MAX_QUANTITY) ? line.quantity : 0); }, 0);
        var prepaidTickets = availableTickets[item.rideId] || 0, prepaidPackage = products.package5.includedRideIds.includes(item.rideId) ? remainingPackage : 0;
        if (!needed || prepaidTickets + prepaidPackage < needed) return true;
        var ticketUse = Math.min(needed, prepaidTickets), packageUse = needed - ticketUse;
        availableTickets[item.rideId] = prepaidTickets - ticketUse; remainingPackage -= packageUse;
        coverage.possibleTicketRights += ticketUse; coverage.possiblePackageRights += packageUse;
        possibleCovered = true;
        return false;
      });
      if (coverage.possiblePackageRights) notes.push('До ' + coverage.possiblePackageRights + ' общих прав пакета может понадобиться для сопровождения после проверки роста. Они уже входят в сумму заказа.');
      if (coverage.possibleTicketRights) notes.push('До ' + coverage.possibleTicketRights + ' уже выбранных взрослых билетов может понадобиться для сопровождения после проверки роста. Доплаты не потребуется.');
      if (possibleCovered) notes.push('Возможное сопровождение покрыто выбранными правами. Рост и допуск нужно проверить перед катанием.');
    }
    s.cart.lines = manual.concat(additions);
    return { state: s, issues: issues, additions: additions, requiredAdultId: (required || possibleCovered) && adult ? adult.id : null, conditional: issues.length > 0, coverage: coverage, notes: unique(notes) };
  }
  function newLine(productId, personId, rideId, quantity, recipientKey) {
    return { id: [productId, personId || recipientKey || 'shared', rideId || 'all'].join('-'), productId: productId, personId: personId || null, rideId: rideId || null, recipientKey: recipientKey || null, quantity: quantity, unitPrice: priceFor({ productId: productId, rideId: rideId }) };
  }
  function cartTotal(cart) {
    if (!cart || !Array.isArray(cart.lines)) return null;
    var total = 0;
    for (var i = 0; i < cart.lines.length; i++) {
      var line = cart.lines[i], price = priceFor(line);
      if (price === null || !integer(line.quantity, 1, MAX_QUANTITY)) return null;
      total += price * line.quantity;
    }
    return Number.isSafeInteger(total) ? total : null;
  }
  function productNotes(s, included) {
    var notes = ['Сумма за перечисленные товары. Покрытие будущих катаний и допуск не обещаны.'];
    var selected = s.selections.demo, blocked = [], unknown = false;
    s.riders.forEach(function (personId) {
      var person = s.party.find(function (p) { return p.id === personId; });
      selected.filter(function (rideId) { return included.includes(rideId); }).forEach(function (rideId) {
        var check = eligible(rideMap[rideId], person);
        if (check.status === 'blocked') blocked.push(person.label + ': ' + rideMap[rideId].name);
        if (check.status === 'unknown') unknown = true;
      });
    });
    if (blocked.length) notes.push('По учебным условиям допуска недоступно: ' + blocked.join('; ') + '.');
    if (unknown) notes.push('Для части выбранного рост или сопровождение нужно уточнить перед катанием.');
    return notes;
  }
  // Quote price separately from the unresolved identity of a companion.
  // Candidate adults are evaluated in copies; no guessed recipient enters the cart.
  function quoteCart(input) {
    var original = sanitizeState(input), resolved = reconcileCompanions(original), s = resolved.state;
    var needsChoice = resolved.issues.some(function (x) { return x.code === 'companion-required'; });
    var adults = s.party.filter(function (p) { return p.role === 'adult' && integer(p.age, 18, 120); });
    function uncertain(issues) {
      return issues.some(function (x) { return ['height-required', 'child-age-required', 'recipient-required', 'rules-unknown', 'too-many-companion-rights'].includes(x.code); });
    }
    function option(person, synthetic) {
      var draft = copy(s);
      if (synthetic) draft.party.push(person);
      draft.companionId = person.id; draft.companionAutoSelected = false;
      var result = reconcileCompanions(draft);
      return { personId: synthetic ? null : person.id, label: person.label, total: cartTotal(result.state.cart), conditional: uncertain(result.issues),
        available: !result.issues.some(function (x) { return x.code === 'companion-unavailable' || x.code === 'companion-required'; }), calculation: result };
    }
    var options = needsChoice ? adults.map(function (p) { return option(p, false); }) : [];
    if (needsChoice && !adults.length) options.push(option({ id: 'quote-companion', label: 'Сопровождающий 18+', role: 'adult', age: 18, height: null }, true));
    var available = options.filter(function (x) { return x.available; });
    var totals = (needsChoice ? available.map(function (x) { return x.total; }) : [cartTotal(s.cart)]).filter(function (n) { return n !== null; });
    var min = totals.length ? Math.min.apply(Math, totals) : cartTotal(s.cart);
    var max = totals.length ? Math.max.apply(Math, totals) : null;
    var priceUnknown = needsChoice ? !available.length || available.some(function (x) { return x.conditional; }) : uncertain(resolved.issues);
    var preview = needsChoice && available.length ? available[0].calculation : resolved;
    var companionLines = preview.state.cart.lines.filter(function (l) { return l.autoCompanion; });
    var companionCount = preview.requiredAdultId || needsChoice ? 1 : 0;
    var companionTotals = needsChoice && available.length ? available.map(function (x) { return cartTotal({ lines: x.calculation.state.cart.lines.filter(function (l) { return l.autoCompanion; }) }); }) : [cartTotal({ lines: companionLines })];
    var companionTotal = companionTotals.every(function (n) { return n === companionTotals[0]; }) ? companionTotals[0] : null;
    var companionProduct = preview.state.cart.lines.some(function (l) { return l.productId === 'unlimited' && l.personId === preview.requiredAdultId; }) || preview.coverage.passUsed ? 'unlimited' : companionCount ? 'ticket' : null;
    var notes = resolved.notes.slice();
    if (needsChoice) notes.push(min === max && !priceUnknown ? 'Полная сумма с одним сопровождающим известна. Выберите взрослого перед оплатой.' : 'Итог зависит от сопровождающего или недостающих данных. Выберите взрослого и проверьте сумму.');
    return { total: min, minTotal: min, maxTotal: priceUnknown ? null : max, conditional: priceUnknown || min === null || min !== max,
      needsCompanionChoice: needsChoice, companionCount: companionCount, companionProduct: companionProduct,
      companionTotal: companionTotal, notes: unique(notes), issues: resolved.issues,
      companionOptions: options.map(function (x) { return { personId: x.personId, label: x.label, total: x.total, conditional: x.conditional, available: x.available }; }) };
  }
  function recommend(input) {
    var s = sanitizeState(input), result = { offers: [], errors: [], warnings: [] };
    if (s.mode !== 'demo') { result.warnings.push('Правила онлайн-продуктов реального парка не подтверждены. Учебные продукты не продаются для реального списка.'); return result; }
    var selected = s.selections.demo, currentQuote = quoteCart(s);
    function hasMatch(product) { return !selected.length || selected.some(function (rideId) { return product.includedRideIds.includes(rideId); }); }
    function offer(productId, lines, title, description, config) {
      config = config || {};
      var included = config.rideId ? [config.rideId] : products[productId].includedRideIds.slice();
      var candidate = copy(s); candidate.cart.lines = lines;
      var calculation = reconcileCompanions(candidate), quote = quoteCart(candidate);
      var added = config.mode === 'add' && !currentQuote.conditional && !quote.conditional ? quote.total - currentQuote.total : null;
      return Object.assign({ id: config.rideId ? 'single:' + config.rideId : productId === 'package5' ? 'package' : 'unlimited', productId: productId,
        mode: config.mode || 'replace', rideId: config.rideId || null, title: title, description: description,
        lines: calculation.state.cart.lines, addedTotal: config.alreadyAdded ? 0 : added, alreadyAdded: !!config.alreadyAdded,
        unavailable: !!config.unavailable, items: config.items || [], excludedPeople: config.excludedPeople || [],
        includedRideIds: included, excludedRideIds: selected.filter(function (rideId) { return !included.includes(rideId); }) }, quote,
        { notes: unique(productNotes(s, included).concat(calculation.notes, quote.notes, config.notes || [])) });
    }
    if (s.ridersConfirmed && s.riders.length) selected.forEach(function (rideId) {
      var ride = rideMap[rideId], excluded = [], items = [], lines = s.cart.lines.filter(function (line) { return !line.autoCompanion; }).map(copy);
      var missing = 0;
      s.riders.forEach(function (personId) {
        var person = s.party.find(function (p) { return p.id === personId; }), check = admission(ride, person);
        if (check.status === 'blocked') { excluded.push({ personId: person.id, label: person.label, reasons: check.reasons }); return; }
        var covered = lines.some(function (l) { return l.personId === person.id && ((l.productId === 'ticket' && l.rideId === rideId && integer(l.quantity, 1, MAX_QUANTITY)) || (l.productId === 'unlimited' && l.quantity === 1 && products.unlimited.includedRideIds.includes(rideId))); });
        items.push({ personId: person.id, label: person.label, role: person.role, quantity: 1, needsCompanion: check.needsCompanion, admissionStatus: check.status, coveredInOrder: covered });
        if (!covered) {
          var line = newLine('ticket', person.id, rideId, 1), baseId = line.id, suffix = 1;
          while (lines.some(function (l) { return l.id === line.id; })) line.id = baseId + '-' + suffix++;
          lines.push(line); missing++;
        }
      });
      var notes = excluded.length ? ['Не включены: ' + excluded.map(function (p) { return p.label + ': ' + p.reasons.join(' '); }).join('; ')] : [];
      if (!items.length) notes.push('Никому из выбранных катающихся этот аттракцион не подходит по указанным данным.');
      result.offers.push(offer('ticket', lines, ride.name, 'По одному катанию для перечисленных участников. Сопровождение учтено.',
        { mode: 'add', rideId: rideId, items: items, excludedPeople: excluded, alreadyAdded: items.length > 0 && missing === 0, unavailable: !items.length, notes: notes }));
    });
    if (hasMatch(products.package5)) result.offers.push(offer('package5', [newLine('package5', null, null, 1)], 'Общий пакет на 5 катаний', 'Пять общих прав для компании. Кто и сколько раз катается, решите в парке.'));
    if (s.ridersConfirmed && s.riders.length && hasMatch(products.unlimited)) {
      var unusable = s.riders.filter(function (personId) {
        var person = s.party.find(function (p) { return p.id === personId; });
        return products.unlimited.includedRideIds.every(function (rideId) { return eligible(rideMap[rideId], person).status === 'blocked'; });
      });
      if (!unusable.length) {
        var lines = s.riders.map(function (personId) { return newLine('unlimited', personId, null, 1); });
        result.offers.push(offer('unlimited', lines, 'Личные безлимиты', s.riders.length + ' личных прав на один день первого использования. Только выбранным катающимся.'));
      } else result.warnings.push('Безлимит не предложен: по указанным возрасту и росту один из выбранных участников не проходит ни на один входящий аттракцион. Можно выбрать другой продукт или изменить катающихся.');
    }
    if (!result.offers.length) result.warnings.push('Для сохранённого нет подходящего готового набора. Можно выбрать билет отдельно.');
    return result;
  }
  function assessCart(input) {
    var resolved = reconcileCompanions(input), s = resolved.state, lines = s.cart.lines, total = cartTotal(s.cart), errors = resolved.issues.map(function (issue) { return issue.message; }), warnings = resolved.notes.slice(), passPeople = new Set(), placeholders = new Set();
    var rights = { tickets: 0, packageRides: 0, personalPasses: 0 }, included = [];
    if (!lines.length) errors.push('Заказ пуст.');
    if (s.mode !== 'demo' && lines.length) errors.push('Учебные товары нельзя оформить как покупку реального парка.');
    if (s._issues.some(function (x) { return ['version', 'party', 'cart'].includes(x); })) errors.push('Сохранённые данные повреждены. Проверьте состав семьи и пересоберите заказ.');
    lines.forEach(function (line) {
      if (!Object.prototype.hasOwnProperty.call(products, line.productId) || priceFor(line) === null || !integer(line.quantity, 1, MAX_QUANTITY)) { errors.push('В заказе есть неизвестный товар или неверное количество.'); return; }
      var person = line.personId ? s.party.find(function (p) { return p.id === line.personId; }) : null;
      if (line.personId && !person) errors.push('Получатель удалён из семьи. Удалите или переназначьте его товар.');
      var rideIds = line.productId === 'ticket' ? [line.rideId] : products[line.productId].includedRideIds;
      included = included.concat(rideIds);
      if (line.productId === 'package5') rights.packageRides += line.quantity * 5;
      if (line.productId === 'ticket') {
        rights.tickets += line.quantity;
        if (person) {
          var check = eligible(rideMap[line.rideId], person);
          if (check.status === 'blocked') errors.push(person.label + ': билет на ' + rideMap[line.rideId].name + ' не соответствует указанным возрасту или росту.');
          else if (check.status === 'unknown') warnings.push(person.label + ': допуск по назначенному билету нужно уточнить.');
        }
      }
      if (line.productId === 'unlimited') {
        rights.personalPasses++;
        if (line.quantity !== 1) errors.push('Каждый личный безлимит должен быть отдельной строкой на одного получателя.');
        if (!line.personId && !line.recipientKey) errors.push('Укажите получателя безлимита или явно выберите назначение перед использованием.');
        if (line.personId) {
          if (passPeople.has(line.personId)) errors.push('Одному участнику добавлены повторные безлимиты.');
          passPeople.add(line.personId);
          if (person && products.unlimited.includedRideIds.every(function (rideId) { return eligible(rideMap[rideId], person).status === 'blocked'; })) errors.push(person.label + ': по указанным возрасту и росту недоступны все входящие в безлимит аттракционы.');
          // A direct personal purchase remains intentional even when the recommendation filter changes.
        } else {
          if (placeholders.has(line.recipientKey)) errors.push('У неназначенных безлимитов повторяется получатель.');
          placeholders.add(line.recipientKey);
        }
      }
    });
    if (rights.personalPasses > MAX_QUANTITY) errors.push('В учебном заказе не больше 20 личных безлимитов.');
    if (placeholders.size) warnings.push('Получатели неназначенных личных прав определяются перед первым использованием.');
    var excluded = s.selections.demo.filter(function (rideId) { return !included.includes(rideId); });
    if (excluded.length) warnings.push('В заказ не входит из сохранённого: ' + excluded.map(function (rideId) { return rideMap[rideId].name; }).join(', ') + '.');
    productNotes(s, unique(included)).slice(1).forEach(function (note) { warnings.push(note); });
    return { state: s, lines: copy(lines), total: total, errors: unique(errors), warnings: unique(warnings), canCheckout: lines.length > 0 && total !== null && !errors.length, excludedRideIds: excluded, rights: rights, companionIssues: resolved.issues, issues: resolved.issues, conditional: resolved.conditional, additions: resolved.additions, requiredAdultId: resolved.requiredAdultId, coverage: resolved.coverage, notes: resolved.notes };
  }
  function snapshotOrder(input, orderId, status) {
    var assessment = assessCart(input), s = assessment.state;
    if (!assessment.canCheckout || !id(orderId) || (status && !['success', 'declined', 'pending', 'issuance', 'partial'].includes(status))) return null;
    var lines = s.cart.lines.map(function (line, index) {
      var product = products[line.productId], person = s.party.find(function (p) { return p.id === line.personId; });
      var included = line.productId === 'ticket' ? [line.rideId] : product.includedRideIds.slice();
      var storedLine = copy(line); delete storedLine.autoCompanion; delete storedLine.companionFor; delete storedLine.companionReason;
      return Object.assign({}, storedLine, { name: line.productId === 'ticket' ? 'Билет: ' + rideMap[line.rideId].name : product.name,
        recipientLabel: person ? person.label : line.productId === 'unlimited' ? 'Получатель ' + (index + 1) + ': назначить перед использованием' : line.productId === 'package5' ? 'Общий пакет для компании' : 'Получатель определяется перед использованием',
        includedRideIds: included, includedNames: included.map(function (rideId) { return rideMap[rideId].name; }), terms: copy(product.terms), validity: VALIDITY,
        unitsPerItem: line.productId === 'package5' ? 5 : line.productId === 'ticket' ? 1 : null });
    });
    var totalItems = lines.reduce(function (sum, line) { return sum + line.quantity; }, 0);
    var order = { version: 3, modelVersion: MODEL_VERSION, id: orderId, status: status === 'partial' && totalItems === 1 ? 'issuance' : status || 'pending', total: assessment.total, lines: lines, createdAt: new Date().toISOString() };
    if (order.status === 'partial') order.issuedCount = totalItems - 1;
    return order;
  }
  function validateOrder(order) {
    if (!order || order.version !== 3 || typeof order.modelVersion !== 'string' || !Object.prototype.hasOwnProperty.call(orderCatalogs, order.modelVersion) || !id(order.id) || !['success', 'declined', 'pending', 'issuance', 'partial'].includes(order.status) || !Array.isArray(order.lines) || !order.lines.length || order.lines.length > 100 || !integer(order.total, 1, 100000000) || typeof order.createdAt !== 'string' || !Number.isFinite(Date.parse(order.createdAt))) return null;
    if (Object.prototype.hasOwnProperty.call(order, 'visitDate')) return null;
    if (order.status !== 'partial' && Object.prototype.hasOwnProperty.call(order, 'issuedCount')) return null;
    var catalog = orderCatalogs[order.modelVersion];
    var ids = new Set(), recipients = new Set(), placeholders = new Set(), total = 0, passes = 0, totalItems = 0;
    for (var i = 0; i < order.lines.length; i++) {
      var line = order.lines[i], product = line && typeof line.productId === 'string' && Object.prototype.hasOwnProperty.call(catalog.products, line.productId) ? catalog.products[line.productId] : null;
      if (!product || !id(line.id) || ids.has(line.id) || !integer(line.quantity, 1, MAX_QUANTITY) || priceFor(line, catalog) === null || line.unitPrice !== priceFor(line, catalog) || Object.prototype.hasOwnProperty.call(line, 'visitDate')) return null;
      var included = line.productId === 'ticket' ? [line.rideId] : product.includedRideIds;
      var expectedName = line.productId === 'ticket' ? 'Билет: ' + catalog.rides[line.rideId].name : product.name;
      if (line.name !== expectedName || !equal(line.includedRideIds, included) || !equal(line.includedNames, included.map(function (rideId) { return catalog.rides[rideId].name; })) || !equal(line.terms, product.terms) || line.validity !== VALIDITY || line.unitsPerItem !== (line.productId === 'package5' ? 5 : line.productId === 'ticket' ? 1 : null) || typeof line.recipientLabel !== 'string' || !line.recipientLabel.trim() || line.recipientLabel.length > 150 || /[\u0000-\u001f<>]/.test(line.recipientLabel)) return null;
      if (line.personId !== null && !id(line.personId)) return null;
      if (line.productId === 'package5' && (line.personId !== null || line.rideId !== null || line.recipientKey !== null)) return null;
      if (line.productId === 'unlimited') {
        passes++;
        if (line.quantity !== 1 || line.rideId !== null || (!line.personId && !id(line.recipientKey)) || (line.personId && line.recipientKey !== null)) return null;
        if (line.personId && recipients.has(line.personId)) return null;
        if (!line.personId && placeholders.has(line.recipientKey)) return null;
        if (line.personId) recipients.add(line.personId); else placeholders.add(line.recipientKey);
      }
      if (line.productId === 'ticket' && line.recipientKey !== null) return null;
      ids.add(line.id); total += line.unitPrice * line.quantity; totalItems += line.quantity;
    }
    if (order.status === 'partial' && (!Object.prototype.hasOwnProperty.call(order, 'issuedCount') || !integer(order.issuedCount, 1, totalItems - 1))) return null;
    return total === order.total && passes <= MAX_QUANTITY ? copy(order) : null;
  }
  function issuedItems(order) {
    var valid = validateOrder(order); if (!valid || !['success', 'partial'].includes(valid.status)) return [];
    var result = [];
    valid.lines.forEach(function (line) {
      for (var n = 1; n <= line.quantity; n++) result.push({ code: valid.id + '-' + line.id + '-' + n, lineId: line.id, ordinal: n, productId: line.productId, name: line.name, recipientLabel: line.recipientLabel, validity: line.validity, includedNames: copy(line.includedNames), includedRideIds: copy(line.includedRideIds), terms: copy(line.terms), remaining: line.unitsPerItem, price: line.unitPrice });
    });
    return valid.status === 'partial' ? result.slice(0, valid.issuedCount) : result;
  }
  return freeze({ MAX_QUANTITY: MAX_QUANTITY, MODEL_VERSION: MODEL_VERSION, realRides: realRides, demoRides: demoRides, products: products, emptyState: emptyState, sanitizeState: sanitizeState, sampleState: sampleState, ageHint: ageHint, admissionRules: admissionRules, admission: admission, eligible: eligible, reconcileCompanions: reconcileCompanions, quoteCart: quoteCart, recommend: recommend, cartTotal: cartTotal, assessCart: assessCart, snapshotOrder: snapshotOrder, validateOrder: validateOrder, issuedItems: issuedItems });
}));
