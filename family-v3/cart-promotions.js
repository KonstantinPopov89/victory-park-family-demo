(function (root, factory) {
  'use strict';
  var commonJS = typeof module === 'object' && module.exports;
  var api = factory(commonJS ? require('./model.js') : root && root.VP3, commonJS ? require('./offers-model.js') : root && root.VPO);
  if (commonJS) module.exports = api;
  if (root) root.VPC = api;
}(typeof window !== 'undefined' ? window : null, function (base, offers) {
  'use strict';
  if (!base || !offers) throw new Error('VPC requires VP3 and VPO.');
  var VERSION = 'cart-promotions-2';
  var BASE_KEYS = ['version', 'modelVersion', 'id', 'status', 'total', 'lines', 'createdAt'];
  var EXTRA_KEYS = ['subtotal', 'promotion', 'discount', 'bonus', 'bonusValidFrom', 'bonusValidUntil', 'pricingVersion', 'purchaseDate'];
  var LINE_KEYS = ['id', 'productId', 'rideId', 'personId', 'recipientKey', 'quantity', 'unitPrice', 'name', 'recipientLabel', 'includedRideIds', 'includedNames', 'terms', 'validity', 'unitsPerItem'];
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function has(object, key) { return Object.prototype.hasOwnProperty.call(object, key); }
  function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
  function exactKeys(value, keys) { return object(value) && Object.keys(value).length === keys.length && keys.every(function (key) { return has(value, key); }); }
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var parsed = new Date(value + 'T00:00:00.000Z');
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }
  function addDays(value, count) {
    var date = new Date(value + 'T00:00:00.000Z');
    date.setUTCDate(date.getUTCDate() + count);
    return date.toISOString().slice(0, 10);
  }
  function normalizePromotion(raw) {
    if (raw != null && !object(raw)) return { offerId: '__invalid-offer__', visitDate: null, studentAcknowledged: false };
    raw = object(raw) ? raw : {};
    return {
      offerId: raw.offerId == null || raw.offerId === '' ? null : typeof raw.offerId === 'string' ? raw.offerId : '__invalid-offer__',
      visitDate: raw.visitDate == null || raw.visitDate === '' ? null : typeof raw.visitDate === 'string' ? raw.visitDate : '__invalid-date__',
      studentAcknowledged: raw.studentAcknowledged === true
    };
  }
  function calculate(input, rawPromotion, today) {
    if (typeof today === 'undefined') today = offers.getToday();
    var state = base.sanitizeState(input), assessment = base.assessCart(state);
    state = assessment.state || state;
    return priceAssessment(assessment, assessment.lines || state.cart.lines, rawPromotion, today);
  }
  // A receipt is priced from its already validated, immutable lines. Re-running
  // today's admission rules would reinterpret old purchases with missing ages.
  function priceAssessment(assessment, lines, rawPromotion, today) {
    var promotion = normalizePromotion(rawPromotion), offer = offers.getOffer(promotion.offerId);
    var tickets = lines.filter(function (line) { return line.productId === 'ticket'; });
    var ticketSubtotal = tickets.reduce(function (sum, line) { return sum + line.unitPrice * line.quantity; }, 0);
    var relevant = offer ? lines.find(function (line) { return offer.productIds.includes(line.productId); }) : lines[0];
    var probe = relevant || lines[0] || { productId: 'ticket', rideId: base.demoRides[0].id, quantity: 1 };
    // Reuse the existing offer dates and document rules. Only the spending threshold
    // is basket-wide, so a small individual line must not prevent an earned bonus.
    var check = offers.calculate(Object.assign({}, promotion, { productId: probe.productId, rideId: probe.rideId, quantity: probe.quantity }), today);
    var issues = check.issues.filter(function (issue) { return issue.code !== 'bonus-threshold'; });
    if (offer && offer.status === 'active' && !relevant) {
      issues = issues.filter(function (issue) { return issue.code !== 'incompatible-product'; });
      issues.push({ code: 'incompatible-product', message: offer.kind === 'package' ? 'В заказе нет товара «' + base.products[offer.productIds[0]].name + '». Добавьте его или выберите другое предложение. Остальные билеты сохранятся.' : 'В заказе нет отдельных билетов, к которым применяется эта выгода. Добавьте билеты или выберите другое предложение.' });
    }
    if (offer && offer.id === 'bonus500' && ticketSubtotal !== null && ticketSubtotal < 5000) {
      issues.push({ code: 'bonus-threshold', message: 'Для бонуса нужно отдельных билетов на 5 000 ֏. Сейчас их на ' + ticketSubtotal.toLocaleString('ru-RU') + ' ֏. Пакеты и безлимиты не учитываются.' });
    }
    if (offer && offer.id === 'student15') {
      var namedRecipients = Array.from(new Set(tickets.filter(function (line) { return !!line.personId; }).map(function (line) { return line.personId; })));
      if (namedRecipients.length > 1) issues.push({ code: 'student-multiple-recipients', message: 'Все льготные билеты должны быть для одного владельца студенческого документа. Сейчас билеты назначены разным участникам. Выберите другую акцию или измените получателей.' });
    }
    var eligible = assessment.canCheckout && issues.length === 0;
    var applied = !!offer && eligible;
    var discount = applied && offer.id === 'weekday20' ? Math.round(ticketSubtotal * 0.20) : applied && offer.id === 'student15' ? Math.round(ticketSubtotal * 0.15) : 0;
    var bonus = applied && offer.id === 'bonus500' ? 500 : 0;
    var payable = assessment.total === null ? null : assessment.total - discount;
    return Object.assign({}, assessment, {
      total: payable, subtotal: assessment.total, ticketSubtotal: ticketSubtotal, discount: discount, payable: payable, bonus: bonus,
      bonusValidFrom: bonus ? addDays(today, 1) : null, bonusValidUntil: bonus ? addDays(today, 30) : null,
      offer: offer, promotion: promotion, lines: copy(lines), applied: applied, eligible: eligible, issues: issues,
      canCheckout: eligible && payable !== null && payable > 0
    });
  }
  function snapshotOrder(state, promotion, orderId, status, today) {
    if (typeof today === 'undefined') today = offers.getToday();
    var calculated = calculate(state, promotion, today);
    if (!calculated.canCheckout) return null;
    var order = base.snapshotOrder(state, orderId, status);
    if (!order) return null;
    return Object.assign(order, {
      total: calculated.payable, subtotal: calculated.subtotal, promotion: calculated.promotion,
      discount: calculated.discount, bonus: calculated.bonus, bonusValidFrom: calculated.bonusValidFrom, bonusValidUntil: calculated.bonusValidUntil,
      pricingVersion: VERSION, purchaseDate: today
    });
  }
  function baseOrder(order) {
    var result = {};
    BASE_KEYS.forEach(function (key) { result[key] = order[key]; });
    if (order.status === 'partial') result.issuedCount = order.issuedCount;
    if (has(order, 'pricingVersion')) result.total = order.subtotal;
    return result;
  }
  function validateOrder(order) {
    if (!object(order) || !Array.isArray(order.lines) || !order.lines.every(function (line) { return exactKeys(line, LINE_KEYS); })) return null;
    var enriched = has(order, 'pricingVersion');
    var keys = order.status === 'partial' ? BASE_KEYS.concat(['issuedCount']) : BASE_KEYS;
    if (!exactKeys(order, enriched ? keys.concat(EXTRA_KEYS) : keys)) return null;
    var validated = base.validateOrder(baseOrder(order));
    if (!validated) return null;
    if (!enriched) return validated;
    if (![VERSION, 'cart-promotions-1'].includes(order.pricingVersion) || !validDate(order.purchaseDate) || !exactKeys(order.promotion, ['offerId', 'visitDate', 'studentAcknowledged'])) return null;
    var normalized = normalizePromotion(order.promotion);
    if (Object.keys(normalized).some(function (key) { return normalized[key] !== order.promotion[key]; })) return null;
    // Keep a receipt valid after an offer expires by rechecking the sale date.
    // The baseline validator still owns every item, unit price and original right.
    var calculated = priceAssessment({ total: validated.total, canCheckout: true, errors: [], warnings: [] }, validated.lines, normalized, order.purchaseDate);
    if (!calculated.canCheckout || ['subtotal', 'discount', 'bonus', 'bonusValidFrom', 'bonusValidUntil'].some(function (key) { return order[key] !== calculated[key]; }) || order.total !== calculated.payable) return null;
    return copy(order);
  }
  // The recommendation and checkout use the same validity rule as issued rights.
  function lineValidity(line, rawPromotion) {
    var promotion = normalizePromotion(rawPromotion);
    if (line.productId === 'ticket' && promotion.offerId === 'weekday20') {
      return validDate(promotion.visitDate) ? 'Только ' + promotion.visitDate : 'Уточните дату визита';
    }
    return line.validity || 'Один день первого использования';
  }
  function validitySummary(lines, promotion) {
    var labels = { ticket: 'разовых билетов', package5: 'пакетов', unlimited: 'безлимитов' };
    return Object.keys(labels).filter(function (productId) {
      return lines.some(function (line) { return line.productId === productId; });
    }).map(function (productId) {
      return 'Срок ' + labels[productId] + ': ' + lineValidity({ productId: productId }, promotion) + '.';
    });
  }
  function issuedItems(order) {
    var validated = validateOrder(order);
    if (!validated || !['success', 'partial'].includes(validated.status)) return [];
    var items = base.issuedItems(baseOrder(validated));
    if (!has(validated, 'pricingVersion') || !validated.promotion.offerId) return items;
    var promotion = validated.promotion;
    items.forEach(function (item) {
      if (item.productId !== 'ticket') return;
      if (promotion.offerId === 'weekday20') {
        item.validity = lineValidity(item, promotion);
        item.terms[1] = 'Одно оплаченное катание только в выбранный день визита: ' + promotion.visitDate + '. Не подтверждает допуск.';
        item.price = Math.round(item.price * 0.8);
      }
      if (promotion.offerId === 'student15') {
        var sourceLine = validated.lines.find(function (line) { return line.id === item.lineId; });
        item.recipientLabel = sourceLine.personId ? sourceLine.recipientLabel + ': со студенческим документом' : 'Владелец студенческого документа';
        item.terms.push('Льготный билет для одного владельца действующего студенческого документа. Документ нужно показать при получении.');
        item.price = Math.round(item.price * 0.85);
      }
    });
    return items;
  }
  return Object.freeze({ VERSION: VERSION, normalizePromotion: normalizePromotion, calculate: calculate, snapshotOrder: snapshotOrder, validateOrder: validateOrder, issuedItems: issuedItems, validitySummary: validitySummary });
}));
