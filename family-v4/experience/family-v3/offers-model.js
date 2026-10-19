(function (root, factory) {
  'use strict';
  var base = typeof module === 'object' && module.exports ? require('./model.js') : root && root.VP3;
  var api = factory(base);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VPO = api;
}(typeof window !== 'undefined' ? window : null, function (base) {
  'use strict';
  if (!base || !base.products || !base.demoRides) throw new Error('VPO requires the teaching VP3 catalog.');
  function freeze(value) {
    Object.keys(value).forEach(function (key) { if (value[key] && typeof value[key] === 'object' && !Object.isFrozen(value[key])) freeze(value[key]); });
    return Object.freeze(value);
  }
  var has = function (object, key) { return typeof key === 'string' && Object.prototype.hasOwnProperty.call(object, key); };
  var rides = {};
  base.demoRides.forEach(function (ride) { rides[ride.id] = ride; });
  var exclusive = 'В одном заказе выбирается только одно предложение. С другими акциями, бонусами и льготами не суммируется.';
  var ticketOnly = 'Только отдельные билеты. Пакеты и личный безлимит не участвуют.';
  function includedRideNames(productId) {
    return base.products[productId].includedRideIds.map(function (id) { return rides[id].name; }).join(', ');
  }
  function productTerms(productId) {
    var result = base.products[productId].terms.slice();
    return result;
  }
  // Fictional teaching conditions. These are not commercial claims about Victory Park.
  var offers = freeze([
    {
      id: 'weekday20', kind: 'promotion', title: 'В будни на 20% дешевле', benefit: '−20% на отдельные билеты',
      summary: 'Выберите будний день визита. Скидка сразу уменьшит сумму оплаты.',
      when: 'Пн-пт, с 14 октября по 30 ноября 2026', important: 'Пакеты и безлимиты не участвуют.',
      cta: 'Купить со скидкой', status: 'active', start: '2026-10-14', end: '2026-11-30', productIds: ['ticket'], requiresVisitDate: true,
      terms: [
        'Покупка и визит должны быть с 14 октября по 30 ноября 2026 включительно. Визит с понедельника по пятницу; на прошедшую дату оформить нельзя.',
        'Скидка 20% на полную стоимость отдельных билетов. Цена определяется аттракционом; скидка округляется до целого драма.',
        ticketOnly, 'Билет с этой скидкой действует только в выбранный день визита. Допуск к аттракциону проверяется отдельно.', exclusive
      ]
    },
    {
      id: 'package5', kind: 'package', title: '5 билетов на компанию', benefit: '5 билетов за 4 000 ֏',
      summary: 'На любые аттракционы демонстрационного каталога. Можно делить и использовать в разные дни.',
      when: '30 дней с покупки', important: 'Один билет = одно катание одного человека. Выгода зависит от выбранных катаний.',
      cta: 'Выбрать пакет', status: 'active', start: null, end: null, productIds: ['package5'], requiresVisitDate: false,
      terms: productTerms('package5').concat([
        'Цена пакета 4 000 ֏. Например, пять билетов на Американские горки стоят 7 000 ֏, а пять билетов на Детскую карусель 3 000 ֏. Пакет выгоден не для любого выбора.',
        'Это цена самого пакета, отдельная скидка в заказе не начисляется.', exclusive
      ])
    },
    {
      id: 'unlimited', kind: 'package', title: 'Личный безлимит на день', benefit: '5 900 ֏ за день',
      summary: 'Для одного человека: Детский паровозик, Американские горки и Чайные чашки.',
      when: 'Один день первого использования', important: 'Детская и Цепочная карусели не входят. Выгоден не всегда.',
      cta: 'Выбрать безлимит', status: 'active', start: null, end: null, productIds: ['unlimited'], requiresVisitDate: false,
      terms: productTerms('unlimited').concat([
        'Цена личного безлимита 5 900 ֏. Например, пять билетов на Американские горки стоят 7 000 ֏, а четыре билета 5 600 ֏. Выгода зависит от количества и выбранных катаний.',
        'Это цена самого безлимита, отдельная скидка в заказе не начисляется.', exclusive
      ])
    },
    {
      id: 'bonus500', kind: 'bonus', title: '500 ֏ на следующий визит', benefit: '+500 ֏ бонусами',
      summary: 'Оплатите отдельные билеты от 5 000 ֏. Бонус получите отдельно после учебной выдачи заказа.',
      when: 'На следующий визит, срок 30 дней', important: 'Сейчас платите полную стоимость.',
      cta: 'Купить с бонусом', status: 'active', start: null, end: null, productIds: ['ticket'], requiresVisitDate: false,
      terms: [
        'При покупке отдельных билетов на сумму от 5 000 ֏ в одном заказе начисляется 500 бонусов. Один бонус соответствует одному драму.',
        'Текущий платёж не уменьшается. Бонус появляется только после успешной учебной выдачи заказа, один раз на заказ.',
        'Бонус можно потратить на отдельные билеты в следующем визите: со следующего календарного дня после выдачи и в течение 30 дней включительно.',
        'Бонусы не обмениваются на деньги. Пакеты и безлимиты нельзя купить за эти бонусы.', ticketOnly, exclusive
      ]
    },
    {
      id: 'student15', kind: 'benefit', title: 'Студентам на 15% дешевле', benefit: '−15% по студенческому',
      summary: 'Скидка на отдельные билеты. Действующий студенческий нужно показать при получении.',
      when: 'В любой день', important: 'Без документа получить билет со скидкой нельзя.',
      cta: 'Купить со скидкой', status: 'active', start: null, end: null, productIds: ['ticket'], requiresVisitDate: false,
      terms: [
        'Скидка 15% на отдельные билеты для владельца действующего студенческого документа. Все билеты этого заказа предназначены этому студенту.',
        'Перед оформлением подтвердите, что принесёте документ. Это только согласие с условием, а не проверка документа.',
        'Документ показывается при получении билетов. Если не сможете предъявить его, до оформления выберите покупку без скидки. В прототипе оплаты и проверки документов нет.',
        ticketOnly, exclusive
      ]
    },
    {
      id: 'expired-weekend', kind: 'promotion', title: 'Сентябрьские выходные', benefit: 'Предложение завершено',
      summary: 'Этот учебный пример завершился. Воспользоваться им сейчас нельзя.',
      when: 'Завершилось 30 сентября 2026', important: 'Не применяется к новым заказам.',
      cta: null, status: 'expired', start: '2026-09-01', end: '2026-09-30', productIds: ['ticket'], requiresVisitDate: false,
      terms: ['Завершённая акция не применяется к новому заказу. Выберите действующее учебное предложение или покупку по полной цене.']
    },
    {
      id: 'pending-family', kind: 'benefit', title: 'Семейная льгота', benefit: 'Условия уточняются',
      summary: 'Размер выгоды и правила ещё не заданы. Обещать скидку по этому примеру нельзя.',
      when: 'Актуальность не подтверждена', important: 'Не учитывается при оформлении.',
      cta: null, status: 'unknown', start: null, end: null, productIds: [], requiresVisitDate: false,
      terms: ['Нет подтверждённых условий. Нельзя считать эту льготу ни действующей, ни завершённой. Пока можно выбрать другое предложение или полную цену.']
    }
  ].concat(base.packageProducts.filter(function (product) { return product.id !== 'package5'; }).map(function (product) {
    return { id: product.id, kind: 'package', title: product.rides + ' билетов на компанию',
      benefit: product.rides + ' билетов за ' + product.price.toLocaleString('ru-RU') + ' ֏',
      summary: 'На любые аттракционы демонстрационного каталога. Можно делить и использовать в разные дни.',
      when: '30 дней с покупки', important: 'Один билет = одно катание одного человека. Пакет не всегда дешевле отдельных билетов.',
      cta: 'Выбрать пакет', status: 'active', start: null, end: null, productIds: [product.id], requiresVisitDate: false,
      terms: productTerms(product.id).concat(['Это цена самого пакета, отдельная скидка в заказе не начисляется.', exclusive]) };
  })));
    var shortFacts = {
      weekday20: ['Пн-пт, до 30 ноября включительно', 'Покупка и визит в период акции. Пакеты и безлимиты не участвуют.'],
      package5: ['Можно делить между участниками', 'Любые аттракционы. 30 дней с покупки. Пакет не всегда дешевле отдельных билетов.'],
      unlimited: ['Личный, на один день', '3 аттракциона. Детская и Цепочная карусели не входят. Выгода зависит от числа катаний.'],
      bonus500: ['При покупке билетов от 5 000 ֏', 'Сейчас платите полную цену. Бонус действует со следующего дня, 30 дней.'],
      student15: ['В любой день', 'Только билеты для владельца документа. Пакеты и безлимиты не участвуют.']
    };
  function getShortFacts(id) { return base.isPackage(id) ? shortFacts.package5.slice() : has(shortFacts, id) ? shortFacts[id].slice() : []; }
  var offerMap = {};
  offers.forEach(function (offer) { offerMap[offer.id] = offer; });
  freeze(offerMap);
  function getOffer(id) { return has(offerMap, id) ? offerMap[id] : null; }
  function date(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    var parsed = new Date(value + 'T00:00:00.000Z');
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? parsed : null;
  }
  function addDays(value, count) { var result = date(value); result.setUTCDate(result.getUTCDate() + count); return result.toISOString().slice(0, 10); }
  function getToday() {
    var parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Yerevan', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    var values = {}; parts.forEach(function (part) { values[part.type] = part.value; });
    return values.year + '-' + values.month + '-' + values.day;
  }
  function calculate(input, now) {
    if (typeof now === 'undefined') now = getToday();
    var issues = [];
    function issue(code, message) { issues.push({ code: code, message: message }); }
    var validShape = input && typeof input === 'object' && !Array.isArray(input);
    var raw = validShape ? input : {};
    if (!validShape) issue('invalid-order', 'Данные заказа повреждены. Выберите товар заново.');
    var product = has(base.products, raw.productId) ? base.products[raw.productId] : null;
    var quantity = typeof raw.quantity === 'number' && Number.isInteger(raw.quantity) && raw.quantity >= 1 && raw.quantity <= base.MAX_QUANTITY ? raw.quantity : null;
    var offerId = raw.offerId == null || raw.offerId === '' ? null : typeof raw.offerId === 'string' ? raw.offerId : null;
    var selectedOffer = getOffer(offerId);
    var selectedRide = product && product.id === 'ticket' && has(rides, raw.rideId) ? rides[raw.rideId] : null;
    var order = {
      offerId: offerId, productId: product ? product.id : null, rideId: selectedRide ? selectedRide.id : null,
      quantity: quantity, visitDate: typeof raw.visitDate === 'string' && raw.visitDate ? raw.visitDate : null,
      studentAcknowledged: raw.studentAcknowledged === true
    };
    if (!product) issue('invalid-product', 'Выберите известный учебный товар.');
    if (quantity === null) issue('invalid-quantity', 'Количество должно быть целым числом от 1 до ' + base.MAX_QUANTITY + '.');
    if (product && product.id === 'ticket' && !selectedRide) issue('invalid-ride', 'Выберите учебный аттракцион с известной ценой.');
    if (raw.offerId != null && raw.offerId !== '' && (!offerId || !selectedOffer)) issue('unknown-offer', 'Предложение не распознано. Выберите другое или явно уберите его из заказа.');
    var today = date(now);
    if (!today) issue('invalid-current-date', 'Текущая дата не распознана. Оформление недоступно.');
    var unitPrice = product ? product.id === 'ticket' ? selectedRide && selectedRide.price : product.price : null;
    var subtotal = typeof unitPrice === 'number' && Number.isSafeInteger(unitPrice) && quantity !== null ? unitPrice * quantity : null;
    var lines = [];
    if (subtotal !== null) {
      var count = product.id === 'unlimited' ? quantity : 1;
      for (var index = 0; index < count; index++) {
        var lineQuantity = product.id === 'unlimited' ? 1 : quantity;
        lines.push({
          productId: product.id, rideId: selectedRide ? selectedRide.id : null,
          name: selectedRide ? 'Билет: ' + selectedRide.name : product.name,
          quantity: lineQuantity, unitPrice: unitPrice, total: lineQuantity * unitPrice,
          personal: product.personal, unitsPerItem: base.isPackage(product.id) ? product.rides : product.id === 'ticket' ? 1 : null,
          includedRideIds: selectedRide ? [selectedRide.id] : product.includedRideIds.slice(), terms: productTerms(product.id),
          recipientLabel: product.id === 'unlimited' ? 'Получатель ' + (index + 1) + ': назначить перед использованием' : base.isPackage(product.id) ? 'Общий пакет для компании' : selectedOffer && selectedOffer.id === 'student15' ? 'Владелец студенческого документа' : 'Получатель определяется перед использованием'
        });
      }
    }
    if (selectedOffer) {
      if (selectedOffer.status === 'expired') issue('offer-ended', 'Предложение завершилось 30 сентября 2026. Выберите другое или уберите его из заказа.');
      else if (selectedOffer.status === 'unknown') issue('offer-unconfirmed', 'Условия этого предложения не подтверждены. Применить его нельзя.');
      else {
        if (product && !selectedOffer.productIds.includes(product.id)) issue('incompatible-product', selectedOffer.kind === 'package' ? 'Предложение относится только к товару «' + base.products[selectedOffer.productIds[0]].name + '». Измените товар или уберите предложение.' : 'Выбранная выгода действует только на отдельные билеты. Пакеты и безлимиты не участвуют.');
        if (today && selectedOffer.start && now < selectedOffer.start) issue('offer-not-started', 'Покупка по этому предложению доступна с 14 октября 2026.');
        if (today && selectedOffer.end && now > selectedOffer.end) issue('offer-ended', 'Срок предложения закончился. Выберите другое или уберите его из заказа.');
        if (selectedOffer.requiresVisitDate) {
          var visit = date(raw.visitDate);
          if (!visit) issue('visit-date-required', 'Выберите дату визита для скидки в будни.');
          else {
            if (raw.visitDate < selectedOffer.start || raw.visitDate > selectedOffer.end) issue('visit-outside-offer', 'Дата визита должна быть с 14 октября по 30 ноября 2026 включительно.');
            if (today && raw.visitDate < now) issue('visit-in-past', 'Дата визита уже прошла. Выберите будущий будний день или сегодня.');
            if (visit.getUTCDay() === 0 || visit.getUTCDay() === 6) issue('visit-weekend', 'На субботу и воскресенье эта скидка не действует. Выберите будний день или уберите предложение.');
          }
        }
        if (selectedOffer.id === 'bonus500' && subtotal !== null && subtotal < 5000) issue('bonus-threshold', 'Для бонуса нужно отдельных билетов на 5 000 ֏. Сейчас в заказе ' + subtotal.toLocaleString('ru-RU') + ' ֏.');
        if (selectedOffer.id === 'student15' && !order.studentAcknowledged) issue('student-acknowledgement-required', 'Подтвердите, что принесёте действующий студенческий документ. Без него льготные билеты не выдадут.');
      }
    }
    var eligible = issues.length === 0;
    var applied = !!selectedOffer && eligible;
    var discount = applied && selectedOffer.id === 'weekday20' ? Math.round(subtotal * 0.20) : applied && selectedOffer.id === 'student15' ? Math.round(subtotal * 0.15) : 0;
    var bonus = applied && selectedOffer.id === 'bonus500' ? 500 : 0;
    if (applied && selectedOffer.id === 'weekday20') {
      lines.forEach(function (line) {
        line.terms[1] = 'Одно оплаченное катание только в выбранный день визита: ' + order.visitDate + '. Не подтверждает допуск.';
      });
    }
    return {
      order: order, offer: selectedOffer, lines: lines, subtotal: subtotal, discount: discount,
      payable: subtotal === null ? null : subtotal - discount, bonus: bonus,
      bonusValidFrom: bonus ? addDays(now, 1) : null, bonusValidUntil: bonus ? addDays(now, 30) : null,
      applied: applied, eligible: eligible, issues: issues, canCheckout: eligible && subtotal !== null && subtotal > 0
    };
  }
  return freeze({ VERSION: 'offers-demo-1.0', offers: offers, products: base.products, demoRides: base.demoRides, MAX_QUANTITY: base.MAX_QUANTITY, getOffer: getOffer, getShortFacts: getShortFacts, getToday: getToday, calculate: calculate });
}));
