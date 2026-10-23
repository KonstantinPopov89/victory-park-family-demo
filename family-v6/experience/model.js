(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VP = api;
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  // All numbers below describe a fictional teaching model, never Victory Park rules.
  function freeze(value) { Object.freeze(value); Object.keys(value).forEach(function (k) { if (value[k] && typeof value[k] === 'object' && !Object.isFrozen(value[k])) freeze(value[k]); }); return value; }
  var realRides = freeze([
    ['water-swan', 'Плавающий лебедь'], ['wheel-of-happiness', 'Колесо счастья'], ['autodrom', 'Автодром'],
    ['mars-ride', 'Полет на Марс'], ['planet', 'Планета'], ['moto-ufo', 'Мощный НЛО'], ['pendulum', 'Метроном'],
    ['rotating-tower', 'Вращающаяся башня'], ['rocket', 'Космический корабль'], ['VR-cinema', 'Виртуальная реальность'], ['VR-for-2', 'Виртуальное путешествие']
  ].map(function (x) { return { id: x[0], name: x[1], photo: '/victory-park-family-demo/family-v6/assets/photos-r17/' + {"wheel-of-happiness":"koleso","autodrom":"autodrom","pendulum":"pendulum","rotating-tower":"bashnya","planet":"planeta","moto-ufo":"moto","rocket":"raketa","mars-ride":"mars","water-swan":"vodnye-lebedi","VR-cinema":"vr-cinema","VR-for-2":"vr-2"}[x[0]] + '-780.webp', photoProvenance: 'ai-generated-demo', price: null, intensity: null, ageRange: null, ageBasis: null, rules: null, operation: 'unknown', fictional: false }; }));
  function demo(id, name, price, intensity, ages, symbol, min, max, soloMin) {
    return { id: id, name: name, price: price, photo: '/victory-park-family-demo/family-v6/assets/photos-r17/' + {"demo-calm":"poezd","demo-thrill":"gorki","demo-together":"teacups","demo-small":"carousel","demo-unknown":"cep"}[id] + '-780.webp', photoProvenance: 'ai-generated-demo', intensity: intensity, ageRange: ages,
      ageBasis: ages ? 'Учебная редакционная подсказка, не правило допуска и не описание реального парка.' : null,
      symbol: symbol, rules: min === null ? null : { min: min, max: max, soloMin: soloMin, companionMin: 140, companionMax: 210, companionRatio: 1 }, operation: 'open', fictional: true };
  }
  var demoRides = freeze([
    demo('demo-calm', 'Тихая прогулка', 900, 'calm', [4, 12], '○', 90, 210, 120),
    demo('demo-thrill', 'Вираж', 1400, 'exciting', [9, 17], '↗', 130, 200, 140),
    demo('demo-together', 'Вдвоём веселее', 1100, 'calm', [5, 14], '∞', 100, 210, 140),
    demo('demo-small', 'Маленький круг', 600, 'calm', [3, 8], '◒', 80, 125, 80),
    demo('demo-unknown', 'Новый маршрут', 700, 'exciting', null, '?', null, null, null)
  ]);
  var MAX_QUANTITY = 20;
  var products = freeze({
    ticket: { id: 'ticket', name: 'Билет на одно катание', price: null, includedRideIds: demoRides.map(function (r) { return r.id; }), personal: false, dateRequired: false, fictional: true,
      terms: ['Учебный билет на выбранный аттракцион. Цена зависит от аттракциона.', 'Одно оплаченное катание. Учебный срок: один день первого использования. Не подтверждает допуск.', 'В учебной модели необходимое сопровождение включено в право ребёнка; отдельное катание взрослого покупается только по его желанию.'] },
    package5: { id: 'package5', name: 'Общий пакет на 5 катаний', price: 4000, includedRideIds: ['demo-calm', 'demo-thrill', 'demo-together', 'demo-small'], rides: 5, personal: false, dateRequired: false, fictional: true,
      terms: ['Учебный пакет: 5 катаний на четыре перечисленных аттракциона.', 'Общий для участников компании, повторные катания расходуют по одному праву.', 'Новый маршрут не входит. Неиспользованный остаток показан отдельно.', 'Учебный срок: один день первого использования. Приоритетной очереди нет.', 'Необходимое сопровождение включено; личные катания взрослого расходуют отдельные права.'] },
    unlimited: { id: 'unlimited', name: 'Личный безлимит на день', price: 5900, includedRideIds: ['demo-calm', 'demo-thrill', 'demo-together'], personal: true, dateRequired: true, fictional: true,
      terms: ['Учебный личный безлимит на выбранную дату для одного названного участника.', 'Тихая прогулка, Вираж и Вдвоём веселее без ограничения числа катаний в этот день.', 'Маленький круг и Новый маршрут оплачиваются отдельно.', 'Не передаётся другому человеку. Приоритетной очереди нет.', 'Учебная выдача после подтверждённой оплаты: код для обмена в демонстрационной кассе на личный носитель. Это не рабочая интеграция.', 'Необходимое сопровождение включено; сопровождающий не становится покупателем личного безлимита автоматически.'] }
  });
  var rideMap = {}; realRides.concat(demoRides).forEach(function (r) { rideMap[r.id] = r; });
  var ISSUE_TEXT = freeze({ version: 'Версия сохранённого плана не поддерживается.', party: 'Часть сохранённого состава семьи некорректна. Восстановите состав или начните заново.', selection: 'В сохранённом списке есть неизвестный аттракцион.', wish: 'Часть сохранённой программы некорректна. Восстановите желания или начните заново.', cart: 'В сохранённой корзине есть неизвестный товар или неверное количество. Пересоберите корзину.' });
  function unique(a) { return Array.from(new Set(a)); }
  function num(n) { return typeof n === 'number' && Number.isFinite(n); }
  function integer(n, min, max) { return num(n) && Number.isInteger(n) && n >= min && n <= max; }
  function id(s) { return typeof s === 'string' && /^[A-Za-z0-9_-]{1,50}$/.test(s) ? s : null; }
  function cleanLabel(s, fallback) { return typeof s === 'string' && s.trim() ? s.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 40) || fallback : fallback; }
  function validDate(s) {
    if (typeof s !== 'string' || !/^20\d\d-\d\d-\d\d$/.test(s)) return false;
    var d = new Date(s + 'T00:00:00Z'); return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }
  function heightRange(v) { return Array.isArray(v) && v.length === 2 && num(v[0]) && num(v[1]) && v[0] >= 40 && v[1] <= 251 && v[0] < v[1] ? [v[0], v[1]] : null; }
  function normalizePerson(p, i) {
    if (!p || !id(p.id) || !['adult', 'child'].includes(p.role)) return null;
    var exact = num(p.height) && p.height >= 40 && p.height <= 250 ? p.height : null;
    return { id: p.id, label: cleanLabel(p.label, (p.role === 'adult' ? 'Взрослый ' : 'Ребёнок ') + (i + 1)), role: p.role,
      age: p.role === 'child' && integer(p.age, 0, 17) ? p.age : null, height: exact, heightRange: exact === null ? heightRange(p.heightRange) : null,
      preference: ['any', 'calm', 'exciting'].includes(p.preference) ? p.preference : 'any', canAccompany: p.role === 'adult' && p.canAccompany === true };
  }
  function priceFor(line) {
    if (!line || !Object.prototype.hasOwnProperty.call(products, line.productId)) return null;
    if (line.productId === 'ticket') { var r = rideMap[line.rideId]; return r && r.fictional && num(r.price) ? r.price : null; }
    return products[line.productId].price;
  }
  function normalizeLine(l, i, partyIds, issues) {
    if (!l || priceFor(l) === null || !integer(l.quantity, 1, MAX_QUANTITY)) { issues.push('cart'); return null; }
    var personId = l.productId === 'package5' || l.personId == null || l.personId === '' ? null : id(l.personId);
    if (l.productId !== 'package5' && l.personId && (!personId || (partyIds && !partyIds.has(personId)))) { issues.push('cart'); }
    return { id: id(l.id) || 'line-' + (i + 1), productId: l.productId, rideId: l.productId === 'ticket' ? l.rideId : null,
      personId: personId, recipientKey: l.productId === 'unlimited' && !personId ? id(l.recipientKey) : null, quantity: l.quantity, unitPrice: priceFor(l), visitDate: validDate(l.visitDate) ? l.visitDate : '', mode: 'demo' };
  }
  function emptyState() { return { version: 1, mode: 'real', party: [], selections: { real: [], demo: [] }, wishes: [], cart: { lines: [], sourcePlanKey: null, scope: 'plan' }, visitDate: '', order: null, _issues: [] }; }
  function sanitizeState(raw) {
    var out = emptyState(); if (!raw || typeof raw !== 'object') return out;
    var issues = Array.isArray(raw._issues) ? raw._issues.filter(function (s) { return Object.prototype.hasOwnProperty.call(ISSUE_TEXT, s); }) : [];
    if (raw.version != null && raw.version !== 1) issues.push('version');
    out.mode = raw.mode === 'demo' ? 'demo' : 'real';
    var people = Array.isArray(raw.party) ? raw.party : [], seen = new Set();
    if (people.length > 8) issues.push('party');
    people.slice(0, 8).forEach(function (p, i) { var person = normalizePerson(p, i); if (!person || seen.has(person.id)) { issues.push('party'); return; } seen.add(person.id); out.party.push(person); });
    ['real', 'demo'].forEach(function (mode) { var allowed = new Set((mode === 'real' ? realRides : demoRides).map(function (r) { return r.id; })); var input = raw.selections && Array.isArray(raw.selections[mode]) ? raw.selections[mode] : []; input.forEach(function (r) { if (!allowed.has(r)) issues.push('selection'); }); out.selections[mode] = unique(input.filter(function (r) { return allowed.has(r); })); });
    var wishKeys = new Set();
    if (Array.isArray(raw.wishes)) {
      if (raw.wishes.length > 128) issues.push('wish');
      raw.wishes.slice(0, 128).forEach(function (w) {
        if (!w || !seen.has(w.personId) || !Object.prototype.hasOwnProperty.call(rideMap, w.rideId)) { issues.push('wish'); return; }
        var k = w.personId + '/' + w.rideId; if (wishKeys.has(k)) { issues.push('wish'); return; } wishKeys.add(k);
        var count = integer(w.count, 1, 20) ? w.count : null;
        if (w.count !== null && w.count !== undefined && count === null) issues.push('wish');
        out.wishes.push({ personId: w.personId, rideId: w.rideId, count: count });
      });
    }
    var lines = raw.cart && Array.isArray(raw.cart.lines) ? raw.cart.lines : [], lineIds = new Set();
    if (lines.length > 100) issues.push('cart');
    lines.slice(0, 100).forEach(function (l, i) { var line = normalizeLine(l, i, seen, issues); if (line) { if (lineIds.has(line.id)) { issues.push('cart'); line.id = 'restored-line-' + i; } lineIds.add(line.id); out.cart.lines.push(line); } });
    out.cart.sourcePlanKey = raw.cart && typeof raw.cart.sourcePlanKey === 'string' && raw.cart.sourcePlanKey.length < 16000 ? raw.cart.sourcePlanKey : null;
    out.cart.scope = raw.cart && raw.cart.scope === 'direct' ? 'direct' : 'plan';
    out.visitDate = validDate(raw.visitDate) ? raw.visitDate : '';
    out._issues = unique(issues); return out;
  }
  function sampleState() {
    var s = emptyState(); s.mode = 'demo';
    s.party = [
      { id: 'adult-1', label: 'Взрослый 1', role: 'adult', age: null, height: null, heightRange: null, preference: 'any', canAccompany: true },
      { id: 'adult-2', label: 'Взрослый 2', role: 'adult', age: null, height: null, heightRange: null, preference: 'any', canAccompany: true },
      { id: 'child-1', label: 'Ребёнок 1', role: 'child', age: 6, height: null, heightRange: null, preference: 'calm', canAccompany: false },
      { id: 'child-2', label: 'Ребёнок 2', role: 'child', age: 11, height: null, heightRange: null, preference: 'exciting', canAccompany: false }
    ];
    s.selections.demo = ['demo-calm', 'demo-together', 'demo-thrill'];
    s.wishes = [{ personId: 'child-1', rideId: 'demo-calm', count: 5 }, { personId: 'child-2', rideId: 'demo-thrill', count: 6 }, { personId: 'child-2', rideId: 'demo-together', count: 2 }]; return s;
  }
  function bounds(person) {
    if (person && num(person.height) && person.height >= 40 && person.height <= 250) return { low: person.height, high: person.height, exact: true };
    var range = person && heightRange(person.heightRange); return range ? { low: range[0], high: range[1], exact: false } : null;
  }
  function inBounds(b, min, max) {
    if (!b) return 'unknown';
    if (b.exact) return b.low < min || b.low > max ? 'blocked' : 'eligible';
    if (b.high <= min || b.low > max) return 'blocked';
    // The upper endpoint is exclusive. A range straddling inclusive max stays unknown.
    return b.low >= min && b.high <= max ? 'eligible' : 'unknown';
  }
  function eligible(ride, person, party) {
    var result = { status: 'unknown', reasons: [], needsHeight: false, companionIds: [], possibleCompanionIds: [] };
    if (!ride || !ride.rules) { result.reasons.push('Подтверждённых условий нет. Возраст или рост не заменяют правила аттракциона.'); return result; }
    if (!person || !['adult', 'child'].includes(person.role)) { result.reasons.push('Участник не выбран.'); return result; }
    var r = ride.rules, b = bounds(person), status = inBounds(b, r.min, r.max);
    if (status === 'blocked') { result.status = 'blocked'; result.reasons.push('Рост вне учебного диапазона от ' + r.min + ' до ' + r.max + ' см включительно.'); return result; }
    if (status === 'unknown') { result.needsHeight = true; result.reasons.push(b ? 'Диапазон пересекает границу учебного правила. Уточните точный рост.' : 'Рост неизвестен. Для этой учебной проверки нужен рост, возраст его не заменяет.'); return result; }
    var solo = b.low >= r.soloMin;
    if (solo) { result.status = 'eligible'; result.reasons.push('Указанный рост соответствует показанным учебным условиям самостоятельного катания.'); return result; }
    if (!b.exact && b.high > r.soloMin) { result.needsHeight = true; result.reasons.push('Диапазон пересекает порог самостоятельного катания ' + r.soloMin + ' см. Уточните рост.'); return result; }
    (Array.isArray(party) ? party : []).forEach(function (a) {
      if (!a || a.id === person.id || a.role !== 'adult' || a.canAccompany !== true) return;
      var check = inBounds(bounds(a), r.companionMin, r.companionMax);
      if (check === 'eligible') result.companionIds.push(a.id);
      else if (check === 'unknown') result.possibleCompanionIds.push(a.id);
    });
    if (result.companionIds.length) { result.status = 'accompanied'; result.reasons.push('Нужен взрослый 18+ ростом от ' + r.companionMin + ' до ' + r.companionMax + ' см. В учебной модели один взрослый сопровождает одного ребёнка за один заезд.'); }
    else if (result.possibleCompanionIds.length) { result.reasons.push('Нужен сопровождающий. Его рост пока не подтверждён.'); }
    else { result.status = 'blocked'; result.reasons.push('Нужен взрослый, согласный сопровождать и подходящий под учебные условия. Такого участника в составе нет.'); }
    return result;
  }
  function ageHint(ride, person) {
    if (!ride || !ride.fictional || !ride.ageRange) return { status: 'unknown', text: 'Подтверждённой возрастной подсказки нет. Возраст не определяет допуск.' };
    if (!person || person.role !== 'child' || !integer(person.age, 0, 17)) return { status: 'unknown', text: 'Возрастная подсказка задана только для ребёнка с известным возрастом на день визита.' };
    var inside = person.age >= ride.ageRange[0] && person.age <= ride.ageRange[1];
    return { status: inside ? 'suggested' : 'outside', text: (inside ? 'Можно начать знакомство с этого учебного примера' : 'Вне учебного редакционного диапазона от ' + ride.ageRange[0] + ' до ' + ride.ageRange[1] + ' лет') + '. Это подсказка для просмотра, не оценка интересов или допуска.' };
  }
  function heightOptions(person, selectedRides) {
    var list = (selectedRides || []).map(function (r) { return typeof r === 'string' ? rideMap[r] : r; }).filter(function (r) { return r && r.rules; });
    if (!list.length) return [];
    var thresholds = [40, 251]; list.forEach(function (r) { thresholds.push(r.rules.min, r.rules.max, r.rules.soloMin); if (person && person.role === 'adult' && person.canAccompany) thresholds.push(r.rules.companionMin, r.rules.companionMax); });
    thresholds = unique(thresholds).sort(function (a, b) { return a - b; }); if (thresholds.length > 6) return [];
    return thresholds.slice(0, -1).map(function (low, i) { var high = thresholds[i + 1]; return { id: 'height-' + low + '-' + high, label: low === 40 ? 'Ниже ' + high + ' см' : high === 251 ? 'От ' + low + ' см' : 'От ' + low + ' до ' + high + ' см, не включая ' + high, range: [low, high] }; });
  }
  function planKey(input) {
    var s = sanitizeState(input);
    return JSON.stringify({ version: 1, model: 'integrated-demo-1', mode: s.mode, party: s.party.slice().sort(function (a, b) { return a.id.localeCompare(b.id); }), selections: s.selections[s.mode].slice().sort(), wishes: s.wishes.filter(function (w) { return rideMap[w.rideId].fictional === (s.mode === 'demo'); }).slice().sort(function (a, b) { return (a.personId + a.rideId).localeCompare(b.personId + b.rideId); }), visitDate: s.visitDate, issues: s._issues });
  }
  function programFor(s) {
    return s.wishes.filter(function (w) { return rideMap[w.rideId].fictional === (s.mode === 'demo'); }).map(function (w) { var person = s.party.find(function (p) { return p.id === w.personId; }), ride = rideMap[w.rideId]; return { personId: w.personId, rideId: w.rideId, count: w.count, person: person, ride: ride, eligibility: eligible(ride, person, s.party) }; });
  }
  function diagnostics(s, program) {
    var errors = s._issues.map(function (code) { return ISSUE_TEXT[code]; }), warnings = [], uncovered = [], needsCounts = [];
    program.forEach(function (p) {
      if (p.count === null) needsCounts.push({ personId: p.personId, rideId: p.rideId });
      if (p.eligibility.status === 'blocked') { uncovered.push({ personId: p.personId, rideId: p.rideId, count: p.count, reason: 'blocked' }); errors.push(p.person.label + ': ' + p.ride.name + ' не соответствует показанным условиям. ' + p.eligibility.reasons.join(' ')); }
      if (p.eligibility.status === 'unknown') warnings.push(p.person.label + ', ' + p.ride.name + ': условный расчёт покупки; возможность катания нужно уточнить. ' + p.eligibility.reasons.join(' '));
      if (p.person.preference !== 'any' && p.ride.intensity && p.person.preference !== p.ride.intensity) warnings.push(p.person.label + ', ' + p.ride.name + ': отличается от выбранных ощущений. Явное желание сохранено; предпочтение не является запретом.');
      if (!s.selections[s.mode].includes(p.rideId)) warnings.push(p.ride.name + ': желание осталось в программе, хотя аттракцион убран из общего списка. Удалите желание явно, если оно больше не нужно.');
    });
    unique(program.map(function (p) { return p.rideId; })).forEach(function (rideId) {
      var group = program.filter(function (p) { return p.rideId === rideId && p.eligibility.status === 'accompanied'; });
      if (!group.length) return;
      var adults = unique([].concat.apply([], group.map(function (p) { return p.eligibility.companionIds; })));
      if (group.length > adults.length) warnings.push(rideMap[rideId].name + ': ' + group.length + ' участника требуют взрослого, доступно ' + adults.length + '. Для общей посадки сопровождения не хватает; возможны отдельные заезды. Совместная посадка не обещана.');
    });
    return { errors: unique(errors), warnings: unique(warnings), uncovered: uncovered, needsCounts: needsCounts };
  }
  function newLine(productId, personId, rideId, quantity, date) { return { id: [productId, personId || 'shared', rideId || 'all'].join('-'), productId: productId, personId: personId, rideId: rideId, quantity: quantity, unitPrice: priceFor({ productId: productId, rideId: rideId }), visitDate: date || '', mode: 'demo' }; }
  function cartTotal(cart) {
    if (!cart || !Array.isArray(cart.lines)) return null;
    var sum = 0;
    for (var i = 0; i < cart.lines.length; i++) { var line = cart.lines[i], price = priceFor(line); if (price === null || !integer(line.quantity, 1, MAX_QUANTITY)) return null; sum += price * line.quantity; }
    return Number.isSafeInteger(sum) ? sum : null;
  }
  function unitsFor(program) { var units = []; program.forEach(function (p) { for (var i = 0; i < p.count; i++) units.push({ personId: p.personId, rideId: p.rideId, price: p.ride.price }); }); return units; }
  function allocationSummary(allocs) { var map = new Map(); allocs.forEach(function (a) { var key = [a.personId, a.rideId, a.productId, a.lineId].join('/'); if (!map.has(key)) map.set(key, { personId: a.personId, rideId: a.rideId, productId: a.productId, lineId: a.lineId, count: 0 }); map.get(key).count += a.count || 1; }); return Array.from(map.values()); }
  function buildVariant(s, program, passPeople, variantId, title) {
    var lines = [], allocations = [], remaining = [], passSet = new Set(passPeople);
    passPeople.forEach(function (p) { lines.push(newLine('unlimited', p, null, 1, s.visitDate)); });
    unitsFor(program).forEach(function (u) { if (passSet.has(u.personId) && products.unlimited.includedRideIds.includes(u.rideId)) allocations.push(Object.assign({}, u, { productId: 'unlimited', lineId: newLine('unlimited', u.personId, null, 1, '').id, count: 1 })); else remaining.push(u); });
    var pool = remaining.filter(function (u) { return products.package5.includedRideIds.includes(u.rideId); }).sort(function (a, b) { return b.price - a.price || a.personId.localeCompare(b.personId) || a.rideId.localeCompare(b.rideId); });
    var out = remaining.filter(function (u) { return !products.package5.includedRideIds.includes(u.rideId); }), suffix = [0];
    for (var i = pool.length - 1; i >= 0; i--) suffix.unshift(suffix[0] + pool[i].price);
    var bestPackages = 0, bestCost = suffix[0];
    for (var k = 1; k <= Math.ceil(pool.length / 5); k++) { var cost = k * products.package5.price + suffix[Math.min(k * 5, pool.length)]; if (cost < bestCost) { bestCost = cost; bestPackages = k; } }
    var covered = Math.min(bestPackages * 5, pool.length), packageLine = bestPackages ? newLine('package5', null, null, bestPackages, '') : null;
    if (packageLine) lines.push(packageLine);
    pool.slice(0, covered).forEach(function (u) { allocations.push(Object.assign({}, u, { productId: 'package5', lineId: packageLine.id, count: 1 })); });
    var tickets = new Map(); pool.slice(covered).concat(out).forEach(function (u) { var key = u.personId + '/' + u.rideId; if (!tickets.has(key)) tickets.set(key, newLine('ticket', u.personId, u.rideId, 0, '')); var line = tickets.get(key); line.quantity++; allocations.push(Object.assign({}, u, { productId: 'ticket', lineId: line.id, count: 1 })); });
    lines = lines.concat(Array.from(tickets.values()));
    return { id: variantId, title: title, lines: lines, total: cartTotal({ lines: lines }), allocations: allocationSummary(allocations), leftover: { packageRides: bestPackages * 5 - covered }, notes: [], uncovered: [], conditional: program.some(function (p) { return p.eligibility.status === 'unknown'; }) };
  }
  function recommend(input) {
    var s = sanitizeState(input), program = programFor(s), d = diagnostics(s, program);
    var result = { variants: [], errors: d.errors, warnings: d.warnings, needsCounts: d.needsCounts, uncovered: d.uncovered, program: program, planKey: planKey(s) };
    if (s.mode !== 'demo') { result.errors.push('Актуальные цены, продукты и правила реального парка не подтверждены. Реальный заказ рассчитать нельзя.'); return result; }
    if (!program.length) { result.warnings.push('Укажите, кто хочет кататься. Общий список аттракционов сам по себе не создаёт программу на всю семью.'); return result; }
    if (result.errors.length || result.needsCounts.length) return result;
    var riders = unique(program.filter(function (p) { return products.unlimited.includedRideIds.includes(p.rideId); }).map(function (p) { return p.personId; }));
    var best = null;
    for (var mask = 0; mask < Math.pow(2, riders.length); mask++) {
      var passPeople = riders.filter(function (_, i) { return mask & Math.pow(2, i); }), v = buildVariant(s, program, passPeople, 'plan', 'Под выбранный план');
      if (v.total !== null && (!best || v.total < best.total || (v.total === best.total && v.leftover.packageRides < best.leftover.packageRides) || (v.total === best.total && v.leftover.packageRides === best.leftover.packageRides && v.lines.length < best.lines.length))) best = v;
    }
    if (!best) { result.errors.push('Программа превышает учебный предел количества. Уменьшите число катаний или разделите заказ явно.'); return result; }
    best.notes.push('Расчёт для заданного количества катаний. Сравнены только перечисленные учебные продукты; это не рыночная гарантия самой низкой цены.');
    best.notes.push('Остаток общего пакета: ' + best.leftover.packageRides + ' катаний. Покрытие покупки не подтверждает допуск.');
    result.variants.push(best);
    var freedom = buildVariant(s, program, riders, 'freedom', 'Больше свободы катаний');
    var basePasses = best.lines.filter(function (l) { return l.productId === 'unlimited'; }).map(function (l) { return l.personId; });
    var added = riders.filter(function (p) { return !basePasses.includes(p); });
    if (added.length && freedom.total !== null && freedom.total > best.total) {
      freedom.delta = freedom.total - best.total;
      freedom.notes.push('Та же заданная программа плюс личные безлимиты: ' + added.map(function (p) { return s.party.find(function (x) { return x.id === p; }).label; }).join(', ') + '. Доплата за дополнительные повторы на входящих аттракционах: ' + freedom.delta + ' AMD.');
      freedom.notes.push('Безлимит добавлен только участникам, которые явно хотят кататься. Исключения оплачены отдельно; остаток пакета не продублирован.');
      result.variants.push(freedom);
    } else result.warnings.push('Отдельный вариант большей свободы не добавлен: полезного отличия от выбранного заказа в этой модели нет.');
    if (result.variants.some(function (v) { return v.lines.some(function (l) { return l.productId === 'unlimited'; }); }) && !s.visitDate) result.warnings.push('Для личного безлимита выберите дату визита перед оформлением.');
    if (best.conditional) result.warnings.push('Сумма условная: она покрывает заданную программу по учебным ценам, но возможность катания для каждого ещё нужно проверить.');
    return result;
  }
  function assessCart(input) {
    var s = sanitizeState(input), direct = s.cart.scope === 'direct', program = direct ? [] : programFor(s), d = diagnostics(s, program), total = cartTotal(s.cart);
    if (direct) {
      var needsPeople = s.cart.lines.some(function (l) { return l.personId !== null || l.productId === 'unlimited'; });
      d.errors = s._issues.filter(function (code) { return code === 'cart' || code === 'version' || (code === 'party' && needsPeople); }).map(function (code) { return ISSUE_TEXT[code]; });
    }
    var errors = d.errors.slice(), warnings = d.warnings.slice(), lines = s.cart.lines, remaining = lines.map(function (l) { return l.productId === 'package5' ? l.quantity * 5 : l.quantity; }), allocations = [], uncovered = [], passPeople = new Set();
    var stale = !direct && s.cart.sourcePlanKey !== null && s.cart.sourcePlanKey !== planKey(s);
    if (!lines.length) errors.push('Корзина пуста.');
    if (s.mode !== 'demo' && lines.length) errors.push('Эти товары учебные. Их нельзя оформлять как покупку реального парка.');
    if (stale) warnings.push('Семья, программа или дата изменились после сборки корзины. Товары не изменены. Проверьте последствия и пересоберите заказ явно.');
    lines.forEach(function (l) {
      if (l.productId === 'unlimited') {
        if (!l.personId && (!direct || !l.recipientKey)) errors.push('Назначьте получателя каждого личного безлимита или явно выберите прямую покупку с назначением перед первым использованием.');
        if (l.personId && !s.party.some(function (p) { return p.id === l.personId; })) errors.push('Получатель безлимита удалён из семьи. Переназначьте право явно.');
        if (l.quantity !== 1) errors.push('Каждый личный безлимит оформляется отдельной строкой на одного участника.');
        if (l.personId && passPeople.has(l.personId)) errors.push('Для одного участника выбран повторный безлимит. Уберите дубликат.');
        if (l.personId) passPeople.add(l.personId);
        var date = l.visitDate || s.visitDate;
        if (!validDate(date)) errors.push('Выберите дату личного безлимита.');
        else if (date < todayInYerevan()) errors.push('Выберите сегодняшнюю или будущую дату по времени Еревана.');
        else if (s.visitDate && date !== s.visitDate) errors.push('Дата личного безлимита отличается от даты семейного визита.');
      }
      if (l.productId === 'ticket' && l.personId) {
        var person = s.party.find(function (p) { return p.id === l.personId; });
        if (!person) { errors.push('Получатель билета удалён из семьи. Переназначьте или удалите билет явно.'); return; }
        var check = eligible(rideMap[l.rideId], person, s.party);
        if (check.status === 'blocked') errors.push(person.label + ': назначенный билет на ' + rideMap[l.rideId].name + ' не соответствует показанным условиям.');
        else if (check.status === 'unknown') warnings.push('Назначенный билет: возможность катания для ' + person.label + ' нужно уточнить.');
      }
    });
    if (lines.filter(function (l) { return l.productId === 'unlimited'; }).length > MAX_QUANTITY) errors.push('В демо не больше 20 личных безлимитов в заказе.');
    var placeholders = lines.filter(function (l) { return l.productId === 'unlimited' && !l.personId; }).map(function (l) { return l.recipientKey; });
    if (unique(placeholders).length !== placeholders.length) errors.push('У неназначенных прав повторяется получатель. Пересоберите эти строки.');
    if (placeholders.length) warnings.push('Неназначенные личные права: ' + placeholders.length + '. В учебной модели получателя нужно назначить перед первым использованием; это не разрешение кататься.');
    program.forEach(function (p) {
      if (p.count === null || p.eligibility.status === 'blocked') { uncovered.push({ personId: p.personId, rideId: p.rideId, count: p.count, reason: p.count === null ? 'count-unknown' : 'blocked' }); return; }
      var need = p.count;
      // Use personal passes first, then restricted tickets, and the common pool last.
      var pass = lines.find(function (l) { return l.productId === 'unlimited' && l.personId === p.personId && products.unlimited.includedRideIds.includes(p.rideId); });
      if (pass) { allocations.push({ personId: p.personId, rideId: p.rideId, count: need, productId: 'unlimited', lineId: pass.id }); return; }
      ['personal-ticket', 'shared-ticket', 'package5'].forEach(function (kind) {
        lines.forEach(function (l, i) {
          var matches = kind === 'package5' ? l.productId === 'package5' && products.package5.includedRideIds.includes(p.rideId) && (!l.personId || l.personId === p.personId) : l.productId === 'ticket' && l.rideId === p.rideId && (kind === 'personal-ticket' ? l.personId === p.personId : l.personId === null);
          if (!matches || !need || !remaining[i]) return; var use = Math.min(need, remaining[i]); need -= use; remaining[i] -= use; allocations.push({ personId: p.personId, rideId: p.rideId, count: use, productId: l.productId, lineId: l.id });
        });
      });
      if (need) uncovered.push({ personId: p.personId, rideId: p.rideId, count: need, reason: 'not-purchased' });
    });
    var leftover = { packageRides: 0, tickets: 0 };
    lines.forEach(function (l, i) { if (l.productId === 'package5') leftover.packageRides += remaining[i]; else if (l.productId === 'ticket') leftover.tickets += remaining[i]; });
    if (direct) leftover = { packageRides: null, tickets: null, notAssessed: true };
    if (!program.length && lines.length) warnings.push('Прямая покупка: семейная программа и покрытие желаний не проверены. Покупка не подтверждает допуск или готовность сопровождающего. Известные ограничения назначенного билета проверяются отдельно.');
    if (d.needsCounts.length) warnings.push('Количество катаний по части желаний не задано. Полное покрытие не рассчитано.');
    errors = unique(errors); warnings = unique(warnings);
    return { total: total, scope: s.cart.scope, stale: stale, errors: errors, warnings: warnings, uncovered: uncovered, allocations: allocationSummary(allocations), leftover: leftover,
      needsCounts: d.needsCounts, hasProgram: program.length > 0, conditional: !program.length || program.some(function (p) { return p.eligibility.status === 'unknown'; }), complete: program.length > 0 && !errors.length && !uncovered.length && !d.needsCounts.length,
      canCheckout: lines.length > 0 && total !== null && !errors.length && !stale && !uncovered.length && !d.needsCounts.length };
  }

  function todayInYerevan(now, offset) {
    var parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Yerevan', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now || new Date());
    var p = {}; parts.forEach(function (x) { p[x.type] = x.value; });
    var d = new Date(p.year + '-' + p.month + '-' + p.day + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + (offset || 0));
    return d.toISOString().slice(0, 10);
  }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function resizePasses(input, quantity, keepIds) {
    var s = sanitizeState(input), passes = s.cart.lines.filter(function (l) { return l.productId === 'unlimited'; });
    if (!integer(quantity, 0, MAX_QUANTITY)) return { error: 'Введите целое число от 1 до 20. Заказ не изменён.' };
    if (quantity === passes.length) return { state: s };
    if (quantity < passes.length && quantity > 0) {
      if (!Array.isArray(keepIds)) return { needsSelection: true, quantity: quantity, lines: passes };
      if (keepIds.length !== quantity || unique(keepIds).length !== quantity || keepIds.some(function (k) { return !passes.some(function (l) { return l.id === k; }); })) return { error: 'Выберите ровно ' + quantity + ' получателей, чьи права останутся.' };
    }
    if (quantity < passes.length) s.cart.lines = s.cart.lines.filter(function (l) { return l.productId !== 'unlimited' || (quantity > 0 && keepIds.includes(l.id)); });
    else {
      var used = new Set(s.cart.lines.map(function (l) { return l.id; })), n = 1;
      for (var i = passes.length; i < quantity; i++) {
        while (used.has('unassigned-pass-' + n)) n++;
        var key = 'unassigned-pass-' + n++; used.add(key);
        s.cart.lines.push({ id: key, productId: 'unlimited', personId: null, recipientKey: key, rideId: null, quantity: 1, unitPrice: products.unlimited.price, visitDate: s.visitDate, mode: 'demo' });
      }
    }
    s.cart.sourcePlanKey = null;
    return { state: s };
  }
  function assignPass(input, lineId, personId) {
    var s = sanitizeState(input), line = s.cart.lines.find(function (l) { return l.id === lineId && l.productId === 'unlimited'; });
    if (!line) return { error: 'Право не найдено. Заказ не изменён.' };
    if (personId && !s.party.some(function (p) { return p.id === personId; })) return { error: 'Выберите существующего участника.' };
    if (personId && s.cart.lines.some(function (l) { return l.id !== lineId && l.productId === 'unlimited' && l.personId === personId; })) return { error: 'У этого участника уже есть безлимит на выбранный день.' };
    line.personId = personId || null; line.recipientKey = personId ? null : 'recipient-' + line.id;
    // Explicit correction of a missing recipient can clear the cart issue only if all remaining lines are valid.
    s._issues = s._issues.filter(function (x) { return x !== 'cart'; });
    s = sanitizeState(s); s.cart.sourcePlanKey = null; return { state: s };
  }
  function snapshotOrder(input, orderId, createdAt) {
    var s = sanitizeState(input), assessment = assessCart(s);
    if (!assessment.canCheckout || !id(orderId)) return null;
    var lines = s.cart.lines.map(function (l, index) {
      var product = products[l.productId], r = rideMap[l.rideId], p = s.party.find(function (x) { return x.id === l.personId; });
      return Object.assign({}, copy(l), {
        name: l.productId === 'ticket' ? 'Билет: ' + r.name : product.name,
        recipientLabel: p ? p.label : l.productId === 'unlimited' ? 'Получатель ' + (index + 1) + ': назначить перед первым использованием' : l.productId === 'package5' ? 'Общий пакет для компании' : 'Получатель определяется перед использованием',
        includedNames: (l.productId === 'ticket' ? [l.rideId] : product.includedRideIds).map(function (rid) { return rideMap[rid].name; }),
        terms: copy(product.terms),
        validity: l.productId === 'unlimited' ? (l.visitDate || s.visitDate) : 'Один день первого использования',
        visitDate: l.productId === 'unlimited' ? (l.visitDate || s.visitDate) : '',
        unitsPerItem: l.productId === 'package5' ? 5 : l.productId === 'ticket' ? 1 : null
      });
    });
    return { version: 1, modelVersion: 'integrated-demo-1', id: orderId, status: 'pending', total: assessment.total, scope: s.cart.scope, lines: lines, createdAt: createdAt || new Date().toISOString() };
  }
  function validateOrder(o) {
    if (!o || o.version !== 1 || o.modelVersion !== 'integrated-demo-1' || !id(o.id) || !['success','declined','pending','issuance'].includes(o.status) || !Array.isArray(o.lines) || !o.lines.length || o.lines.length > 100 || !integer(o.total, 0, 100000000) || typeof o.createdAt !== 'string' || !Number.isFinite(Date.parse(o.createdAt))) return null;
    var seen = new Set(), passPeople = new Set(), recipients = new Set(), sum = 0;
    for (var i = 0; i < o.lines.length; i++) {
      var l = o.lines[i];
      if (!l || !id(l.id) || seen.has(l.id) || !integer(l.quantity, 1, MAX_QUANTITY) || priceFor(l) === null || l.unitPrice !== priceFor(l) || typeof l.name !== 'string' || l.name.length > 150 || typeof l.recipientLabel !== 'string' || l.recipientLabel.length > 150 || typeof l.validity !== 'string' || !Array.isArray(l.terms) || !l.terms.length || l.terms.length > 10 || l.terms.some(function (t) { return typeof t !== 'string' || t.length > 1000; }) || !Array.isArray(l.includedNames) || l.includedNames.length > 10 || l.includedNames.some(function (n) { return typeof n !== 'string' || n.length > 150; })) return null;
      if (l.productId === 'unlimited') {
        if (l.quantity !== 1 || !validDate(l.visitDate) || (!id(l.personId) && !id(l.recipientKey))) return null;
        if (l.personId && passPeople.has(l.personId)) return null;
        if (!l.personId && recipients.has(l.recipientKey)) return null;
        if (l.personId) passPeople.add(l.personId); else recipients.add(l.recipientKey);
      }
      seen.add(l.id); sum += l.unitPrice * l.quantity;
    }
    return sum === o.total && passPeople.size + recipients.size <= MAX_QUANTITY ? copy(o) : null;
  }
  function issuedItems(order) {
    var o = validateOrder(order); if (!o || o.status !== 'success') return [];
    var items = [];
    o.lines.forEach(function (l) { for (var n = 1; n <= l.quantity; n++) items.push({ code: o.id + '-' + l.id + '-' + n, lineId: l.id, ordinal: n, productId: l.productId, name: l.name, recipientLabel: l.recipientLabel, validity: l.validity, visitDate: l.visitDate, includedNames: copy(l.includedNames), terms: copy(l.terms), remaining: l.unitsPerItem, price: l.unitPrice }); });
    return items;
  }
  return freeze({ MAX_QUANTITY: MAX_QUANTITY, todayInYerevan: todayInYerevan, resizePasses: resizePasses, assignPass: assignPass, snapshotOrder: snapshotOrder, validateOrder: validateOrder, issuedItems: issuedItems, realRides: realRides, demoRides: demoRides, products: products, emptyState: emptyState, sampleState: sampleState, sanitizeState: sanitizeState, eligible: eligible, ageHint: ageHint, heightOptions: heightOptions, planKey: planKey, recommend: recommend, cartTotal: cartTotal, assessCart: assessCart, validDate: validDate });
}));
