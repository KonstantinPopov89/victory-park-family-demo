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
  function demo(id, name, price, intensity, ages, symbol, min, max, soloMin) {
    return { id: id, name: name, price: price, photo: null, intensity: intensity, ageRange: ages,
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
      terms: ['Учебный пакет: 5 катаний на четыре перечисленных аттракциона.', 'Общий для участников компании, повторные катания расходуют по одному праву.', 'Новый маршрут не входит. Пять прав на катание общие для всей компании.', 'Учебный срок: один день первого использования. Приоритетной очереди нет.', 'Необходимое сопровождение включено; личные катания взрослого расходуют отдельные права.'] },
    unlimited: { id: 'unlimited', name: 'Личный безлимит на день', price: 5900, includedRideIds: ['demo-calm', 'demo-thrill', 'demo-together'], personal: true, dateRequired: false, fictional: true,
      terms: ['Учебный личный безлимит для одного участника. Срок: один день первого использования; это проектное условие, не правило парка.', 'Тихая прогулка, Вираж и Вдвоём веселее без ограничения числа катаний в этот день.', 'Маленький круг и Новый маршрут оплачиваются отдельно.', 'Не передаётся другому человеку. Приоритетной очереди нет.', 'Учебная выдача после подтверждённой оплаты: код для обмена в демонстрационной кассе на личный носитель. Это не рабочая интеграция.', 'Необходимое сопровождение включено; сопровождающий не становится покупателем личного безлимита автоматически.'] }
  });
  var MODEL_VERSION = 'family-demo-3';
  var VALIDITY = 'Один день первого использования';
  var rideMap = {};
  realRides.concat(demoRides).forEach(function (r) { rideMap[r.id] = r; });
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function unique(values) { return Array.from(new Set(values)); }
  function id(value) { return typeof value === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(value) ? value : null; }
  function integer(value, min, max) { return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max; }
  function label(value, fallback) { return typeof value === 'string' && value.trim() ? value.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 80) || fallback : fallback; }
  function equal(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function priceFor(line) {
    if (!line || !Object.prototype.hasOwnProperty.call(products, line.productId)) return null;
    if (line.productId !== 'ticket') return products[line.productId].price;
    var ride = rideMap[line.rideId]; return ride && ride.fictional ? ride.price : null;
  }
  function emptyState() { return { version: 3, mode: 'demo', party: [], selections: { real: [], demo: [] }, riders: [], ridersConfirmed: false, cart: { lines: [] }, _issues: [] }; }
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
      out.party.push({ id: p.id, label: label(p.label, (p.role === 'adult' ? 'Взрослый ' : 'Ребёнок ') + (i + 1)), role: p.role,
        age: integer(p.age, p.role === 'adult' ? 18 : 0, p.role === 'adult' ? 120 : 17) ? p.age : null,
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
        quantity: integer(line.quantity, 1, MAX_QUANTITY) ? line.quantity : null, unitPrice: priceFor(line) });
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
  function eligible(ride, person) {
    if (typeof ride === 'string') ride = rideMap[ride];
    var out = { status: 'unknown', reasons: [], needsHeight: false, needsCompanion: false };
    if (!ride || !ride.rules) { out.reasons.push('Условия допуска нужно уточнить у парка.'); return out; }
    if (!person || !['adult', 'child'].includes(person.role)) { out.reasons.push('Участник не выбран.'); return out; }
    var height = person.height, r = ride.rules;
    if (typeof height !== 'number' || !Number.isFinite(height) || height < 40 || height > 250) { out.needsHeight = true; out.reasons.push('Рост неизвестен. Возраст не заменяет проверку роста.'); return out; }
    if (height < r.min || height > r.max) { out.status = 'blocked'; out.reasons.push('Рост ' + height + ' см вне учебного диапазона ' + r.min + '-' + r.max + ' см.'); return out; }
    if (height < r.soloMin) { out.needsCompanion = true; out.reasons.push('Нужен сопровождающий взрослый ростом ' + r.companionMin + '-' + r.companionMax + ' см. Возможность сопровождения уточняется перед катанием.'); return out; }
    out.status = 'eligible'; out.reasons.push('Рост соответствует показанным учебным условиям.'); return out;
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
    if (blocked.length) notes.push('По указанному росту недоступно: ' + blocked.join('; ') + '.');
    if (unknown) notes.push('Для части выбранного рост или сопровождение нужно уточнить перед катанием.');
    return notes;
  }
  function recommend(input) {
    var s = sanitizeState(input), result = { offers: [], errors: [], warnings: [] };
    if (s.mode !== 'demo') { result.warnings.push('Правила онлайн-продуктов реального парка не подтверждены. Учебные продукты не продаются для реального списка.'); return result; }
    var selected = s.selections.demo;
    function hasMatch(product) { return !selected.length || selected.some(function (rideId) { return product.includedRideIds.includes(rideId); }); }
    function offer(productId, lines, title, description) {
      var included = products[productId].includedRideIds.slice();
      return { id: productId === 'package5' ? 'package' : 'unlimited', title: title, description: description, lines: lines, total: cartTotal({ lines: lines }), includedRideIds: included, excludedRideIds: selected.filter(function (rideId) { return !included.includes(rideId); }), notes: productNotes(s, included) };
    }
    if (hasMatch(products.package5)) result.offers.push(offer('package5', [newLine('package5', null, null, 1)], 'Общий пакет на 5 катаний', 'Пять общих прав для компании. Кто и сколько раз катается, решите в парке.'));
    if (s.ridersConfirmed && s.riders.length && hasMatch(products.unlimited)) {
      var unusable = s.riders.filter(function (personId) {
        var person = s.party.find(function (p) { return p.id === personId; });
        return products.unlimited.includedRideIds.every(function (rideId) { return eligible(rideMap[rideId], person).status === 'blocked'; });
      });
      if (!unusable.length) {
        var lines = s.riders.map(function (personId) { return newLine('unlimited', personId, null, 1); });
        result.offers.push(offer('unlimited', lines, 'Личные безлимиты', s.riders.length + ' личных прав на один день первого использования. Только выбранным катающимся.'));
      } else result.warnings.push('Безлимит не предложен: по указанному росту один из выбранных участников не проходит ни на один входящий аттракцион. Можно выбрать другой продукт или изменить катающихся.');
    }
    if (!result.offers.length) result.warnings.push('Для сохранённого нет подходящего готового набора. Можно выбрать билет отдельно.');
    return result;
  }
  function assessCart(input) {
    var s = sanitizeState(input), lines = s.cart.lines, total = cartTotal(s.cart), errors = [], warnings = [], passPeople = new Set(), placeholders = new Set();
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
          if (check.status === 'blocked') errors.push(person.label + ': билет на ' + rideMap[line.rideId].name + ' не соответствует указанному росту.');
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
          if (person && products.unlimited.includedRideIds.every(function (rideId) { return eligible(rideMap[rideId], person).status === 'blocked'; })) errors.push(person.label + ': по указанному росту недоступны все входящие в безлимит аттракционы.');
          if (person && s.ridersConfirmed && !s.riders.includes(person.id)) errors.push(person.label + ' больше не выбран как катающийся. Удалите или переназначьте его безлимит.');
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
    return { total: total, errors: unique(errors), warnings: unique(warnings), canCheckout: lines.length > 0 && total !== null && !errors.length, excludedRideIds: excluded, rights: rights };
  }
  function snapshotOrder(input, orderId, status) {
    var s = sanitizeState(input), assessment = assessCart(s);
    if (!assessment.canCheckout || !id(orderId) || (status && !['success', 'declined', 'pending', 'issuance'].includes(status))) return null;
    var lines = s.cart.lines.map(function (line, index) {
      var product = products[line.productId], person = s.party.find(function (p) { return p.id === line.personId; });
      var included = line.productId === 'ticket' ? [line.rideId] : product.includedRideIds.slice();
      return Object.assign({}, copy(line), { name: line.productId === 'ticket' ? 'Билет: ' + rideMap[line.rideId].name : product.name,
        recipientLabel: person ? person.label : line.productId === 'unlimited' ? 'Получатель ' + (index + 1) + ': назначить перед использованием' : line.productId === 'package5' ? 'Общий пакет для компании' : 'Получатель определяется перед использованием',
        includedRideIds: included, includedNames: included.map(function (rideId) { return rideMap[rideId].name; }), terms: copy(product.terms), validity: VALIDITY,
        unitsPerItem: line.productId === 'package5' ? 5 : line.productId === 'ticket' ? 1 : null });
    });
    return { version: 3, modelVersion: MODEL_VERSION, id: orderId, status: status || 'pending', total: assessment.total, lines: lines, createdAt: new Date().toISOString() };
  }
  function validateOrder(order) {
    if (!order || order.version !== 3 || order.modelVersion !== MODEL_VERSION || !id(order.id) || !['success', 'declined', 'pending', 'issuance'].includes(order.status) || !Array.isArray(order.lines) || !order.lines.length || order.lines.length > 100 || !integer(order.total, 1, 100000000) || typeof order.createdAt !== 'string' || !Number.isFinite(Date.parse(order.createdAt))) return null;
    if (Object.prototype.hasOwnProperty.call(order, 'visitDate')) return null;
    var ids = new Set(), recipients = new Set(), placeholders = new Set(), total = 0, passes = 0;
    for (var i = 0; i < order.lines.length; i++) {
      var line = order.lines[i], product = line && Object.prototype.hasOwnProperty.call(products, line.productId) ? products[line.productId] : null;
      if (!product || !id(line.id) || ids.has(line.id) || !integer(line.quantity, 1, MAX_QUANTITY) || priceFor(line) === null || line.unitPrice !== priceFor(line) || Object.prototype.hasOwnProperty.call(line, 'visitDate')) return null;
      var included = line.productId === 'ticket' ? [line.rideId] : product.includedRideIds;
      var expectedName = line.productId === 'ticket' ? 'Билет: ' + rideMap[line.rideId].name : product.name;
      if (line.name !== expectedName || !equal(line.includedRideIds, included) || !equal(line.includedNames, included.map(function (rideId) { return rideMap[rideId].name; })) || !equal(line.terms, product.terms) || line.validity !== VALIDITY || line.unitsPerItem !== (line.productId === 'package5' ? 5 : line.productId === 'ticket' ? 1 : null) || typeof line.recipientLabel !== 'string' || !line.recipientLabel.trim() || line.recipientLabel.length > 150 || /[\u0000-\u001f<>]/.test(line.recipientLabel)) return null;
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
      ids.add(line.id); total += line.unitPrice * line.quantity;
    }
    return total === order.total && passes <= MAX_QUANTITY ? copy(order) : null;
  }
  function issuedItems(order) {
    var valid = validateOrder(order); if (!valid || valid.status !== 'success') return [];
    var result = [];
    valid.lines.forEach(function (line) {
      for (var n = 1; n <= line.quantity; n++) result.push({ code: valid.id + '-' + line.id + '-' + n, lineId: line.id, ordinal: n, productId: line.productId, name: line.name, recipientLabel: line.recipientLabel, validity: line.validity, includedNames: copy(line.includedNames), includedRideIds: copy(line.includedRideIds), terms: copy(line.terms), remaining: line.unitsPerItem, price: line.unitPrice });
    });
    return result;
  }
  return freeze({ MAX_QUANTITY: MAX_QUANTITY, MODEL_VERSION: MODEL_VERSION, realRides: realRides, demoRides: demoRides, products: products, emptyState: emptyState, sanitizeState: sanitizeState, sampleState: sampleState, ageHint: ageHint, eligible: eligible, recommend: recommend, cartTotal: cartTotal, assessCart: assessCart, snapshotOrder: snapshotOrder, validateOrder: validateOrder, issuedItems: issuedItems });
}));
