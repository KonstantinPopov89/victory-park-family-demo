(function (root, factory) {
  'use strict';
  var api = factory(typeof module === 'object' && module.exports ? require('./offers-model.js') : root.VPO);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else api.start();
}(typeof window !== 'undefined' ? window : null, function (M) {
  'use strict';
  var kinds = { promotion: 'Скидка', package: 'Пакет', bonus: 'Бонус', benefit: 'Льгота' };
  var filters = { all: 'Все', promotion: 'Скидки', package: 'Пакеты', bonus: 'Бонусы', benefit: 'Льготы' };
  var storageKey = 'vp.promotions.v1';
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(value) { return value == null ? 'Не рассчитано' : value.toLocaleString('ru-RU') + ' ֏'; }
  function humanDate(value) { if (!value) return ''; return new Date(value + 'T12:00:00Z').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Yerevan' }); }
  function addDays(value, count) { var d = new Date(value + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + count); return d.toISOString().slice(0, 10); }
  function stateOf(offer, today) { if (offer.status !== 'active') return offer.status; if (offer.end && today > offer.end) return 'expired'; if (offer.start && today < offer.start) return 'upcoming'; return 'active'; }
  function terms(offer) { return '<ul>' + offer.terms.map(function (term) { return '<li>' + esc(term) + '</li>'; }).join('') + '</ul>'; }
  function prominent(offer) {
    return M.getShortFacts(offer.id);
  }
  function renderCard(offer) {
    var facts = prominent(offer);
    return '<article class="offer-card" data-kind="' + esc(offer.kind) + '" id="offer-' + esc(offer.id) + '"><div class="offer-top"><span class="type">' + esc(kinds[offer.kind]) + '</span><span class="term-short">' + (offer.end ? 'До ' + humanDate(offer.end).replace(' 2026 г.', '') : 'Постоянное предложение') + '</span></div><h2>' + esc(offer.title) + '</h2><p class="benefit">' + esc(offer.benefit) + '</p><p class="summary">' + esc(offer.summary) + '</p><ul class="offer-facts">' + facts.map(function (fact) { return '<li>' + esc(fact) + '</li>'; }).join('') + '<li>С другими предложениями не суммируется.</li></ul><div class="offer-actions"><a class="action" href="offer-checkout.html?offer=' + encodeURIComponent(offer.id) + '" aria-label="' + esc(offer.cta + ': ' + offer.title) + '">' + esc(offer.cta) + '<span aria-hidden="true">→</span></a></div><details class="offer-terms" id="terms-' + esc(offer.id) + '"><summary>Все условия</summary>' + terms(offer) + '</details></article>';
  }
  function renderList(filter, today) {
    filter = filter || 'all'; today = today || M.getToday();
    var active = M.offers.filter(function (o) { return stateOf(o, today) === 'active'; });
    var visible = active.filter(function (o) { return filter === 'all' || o.kind === filter; });
    var other = M.offers.filter(function (o) { return stateOf(o, today) !== 'active'; });
    return '<a class="crumb" href="index.html">Главная / Акции</a><div class="page-heading"><h1>Акции и выгода</h1><p>Выберите, как сэкономить. Сразу видно, кому подходит предложение и сколько вы заплатите.</p></div><div class="filter-bar" role="group" aria-label="Тип предложения">' + Object.keys(filters).map(function (id) { var count = active.filter(function (o) { return id === 'all' || o.kind === id; }).length; return '<button class="filter" id="filter-' + id + '" data-filter="' + id + '" aria-pressed="' + (id === filter) + '">' + filters[id] + '<span class="filter-count">' + count + '</span></button>'; }).join('') + '</div><div id="offer-results"><div class="offer-grid">' + visible.map(renderCard).join('') + '</div>' + (visible.length ? '' : '<div class="no-offers"><h2>Сейчас таких предложений нет</h2><p>Посмотрите другие способы сэкономить или выберите билеты по обычной цене.</p><button class="action secondary" data-filter="all">Все предложения</button> <a class="action" href="offer-checkout.html?offer=none">Билеты по обычной цене</a></div>') + '</div><section class="questions section-space" aria-labelledby="questions-heading"><h2 id="questions-heading">Что ещё важно знать</h2><details><summary>Можно сложить несколько скидок?</summary><p>Нет. В этих учебных примерах выбирается одно предложение на заказ. При покупке видно, что применилось. Заменить или убрать выгоду можно до оформления.</p></details><details><summary>Что выгоднее: пакет, безлимит или отдельные билеты?</summary><p>Зависит от аттракционов и числа катаний. Например, 5 билетов на Американские горки стоят 7 000 ֏, пакет на 5 катаний стоит 4 000 ֏. А 5 билетов на Детскую карусель стоят 3 000 ֏, и пакет уже дороже. Безлимит личный и подходит только для трёх включённых аттракционов.</p></details><details><summary>Покупка билета гарантирует допуск на аттракцион?</summary><p>Нет. Билет даёт право на катание при соблюдении правил допуска. Рост, ограничения и необходимость сопровождения нужно проверить отдельно на странице аттракционов.</p></details>' + (other.length ? '<details id="other-offers"><summary>Завершённые и неподтверждённые предложения</summary><div class="status-list">' + other.map(function (o) { var s = stateOf(o, today); return '<article class="status-card" id="status-' + esc(o.id) + '"><span class="status-tag">' + (s === 'unknown' ? 'Актуальность не подтверждена' : s === 'upcoming' ? 'Ещё не началось' : 'Завершено') + '</span><h3>' + esc(o.title) + '</h3><p>' + (s === 'expired' ? 'Срок закончился ' + humanDate(o.end) + '. Применить к новому заказу нельзя.' : esc(o.summary)) + '</p></article>'; }).join('') + '</div></details>' : '') + '</section><div class="closing"><div><h2>Не нашли подходящее?</h2><p>Можно купить отдельные билеты по обычной цене.</p></div><a class="action secondary" href="offer-checkout.html?offer=none">Выбрать билеты →</a></div>';
  }
  function renderReference() {
    return '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Условия предложений: текстовый список</title><link rel="stylesheet" href="offers.css"><body class="plain-reference"><h1>Акции и выгода</h1><p>Все предложения и цены учебные. Предложения не действуют в парке.</p><p>Текстовый список содержит те же условия. Для интерактивного выбора <a href="offers.html">откройте страницу акций</a>.</p>' + M.offers.map(function (o) { return '<article id="reference-' + esc(o.id) + '"><h2>' + esc(o.title) + '</h2><p>' + esc(kinds[o.kind] + '. ' + o.benefit) + '</p><p>' + esc(o.summary) + '</p><p>' + esc(o.when + '. ' + o.important) + '</p>' + terms(o) + (o.status === 'active' ? '<a href="offer-checkout.html?offer=' + o.id + '">' + esc(o.cta) + '</a>' : '<p>' + (o.status === 'unknown' ? 'Актуальность не подтверждена' : 'Завершено') + '</p>') + '</article>'; }).join('') + '</body></html>';
  }
  function normalizeVisitDate(value) { return value === '' || value == null ? null : value; }
  function normalizeOrder(order) { return Object.assign({}, order, { visitDate: normalizeVisitDate(order.visitDate) }); }
  function ordersMatch(first, second) {
    if (!first || !second || typeof first !== 'object' || typeof second !== 'object' || Array.isArray(first) || Array.isArray(second)) return false;
    var a = normalizeOrder(first), b = normalizeOrder(second);
    var keys = Object.keys(a).sort();
    return JSON.stringify(keys) === JSON.stringify(Object.keys(b).sort()) && keys.every(function (key) { return JSON.stringify(a[key]) === JSON.stringify(b[key]); });
  }
  function switchMessage(productId) {
    return 'Выбран ' + { ticket: 'разовый билет', package5: 'пакет на 5 катаний', unlimited: 'личный безлимит' }[productId] + '. Количество: 1. Предыдущий выбор заменён.';
  }
  // Only call for a deliberate offer choice, never to repair an incoming deep link or a manual product change.
  function chooseOffer(previous, offerId) {
    var order = normalizeOrder(previous), offer = M.getOffer(offerId), switched = false;
    if (order.offerId !== (offerId || null)) order.studentAcknowledged = false;
    order.offerId = offerId || null;
    if (offer && offer.productIds.length && !offer.productIds.includes(order.productId)) {
      order.productId = offer.productIds[0];
      order.quantity = 1;
      order.studentAcknowledged = false;
      switched = true;
    }
    return { order: order, switched: switched, notice: switched ? switchMessage(order.productId) : 'Предложение заменено. Проверьте условия и сумму.' };
  }
  function issueGroup(code) {
    if (/^visit-/.test(code)) return 'date';
    if (code === 'student-acknowledgement-required') return 'student';
    if (code === 'invalid-quantity' || code === 'bonus-threshold') return 'quantity';
    if (code === 'invalid-product' || code === 'incompatible-product' || code === 'invalid-order') return 'product';
    if (code === 'invalid-ride') return 'ride';
    if (code === 'unknown-offer' || /^offer-/.test(code)) return 'offer';
    return 'summary';
  }
  function issueAction(result) {
    var issue = result.issues[0];
    if (!issue) return null;
    var group = issueGroup(issue.code);
    var actions = {
      date: { label: 'Выбрать дату', focusId: 'date-today', scrollId: 'date-field' },
      student: { label: 'Подтвердить льготу', focusId: 'student-ack', scrollId: 'student-field' },
      quantity: { label: 'Изменить количество', focusId: 'quantity-field', scrollId: 'quantity-field' },
      product: { label: 'Выбрать билеты', focusId: 'product-' + (result.offer && result.offer.productIds[0] || 'ticket'), scrollId: 'product-field' },
      ride: { label: 'Выбрать аттракцион', focusId: 'ride', scrollId: 'ride-field' },
      offer: { label: 'Выбрать предложение', focusId: 'selected-offer', scrollId: 'offer-field' },
      summary: { label: 'Проверить условия', focusId: 'order-issues', scrollId: 'order-issues' }
    };
    return Object.assign({ group: group, message: issue.message }, actions[group]);
  }
  function fieldIssue(result, group) {
    var issues = result.issues.filter(function (issue) { return issueGroup(issue.code) === group; });
    return issues.length ? '<p class="field-issue" id="issue-' + group + '">' + issues.map(function (issue) { return esc(issue.message); }).join('<br>') + '</p>' : '';
  }
  function describedIssue(result, group) { return result.issues.some(function (issue) { return issueGroup(issue.code) === group; }) ? ' aria-describedby="issue-' + group + '"' : ''; }
  function start() {
    var app = document.getElementById('offers-app');
    if (!app) return;
    var isList = document.body.dataset.offersPage === 'list';
    var filter = 'all', receipt = null, notice = '';
    var params = new URLSearchParams(location.search);
    var offerId = params.get('offer');
    var initial = M.getOffer(offerId);
    var order = { offerId: offerId === 'none' ? null : offerId, productId: initial && initial.kind === 'package' ? initial.productIds[0] : 'ticket', rideId: 'demo-calm', quantity: 1, visitDate: null, studentAcknowledged: false };
    if (params.has('product')) order.productId = params.get('product');
    if (params.has('ride')) order.rideId = params.get('ride');
    if (params.has('qty')) order.quantity = Number(params.get('qty'));
    if (params.has('date')) order.visitDate = normalizeVisitDate(params.get('date'));
    if (params.has('student')) order.studentAcknowledged = params.get('student') === '1';
    if (!isList && !['product', 'ride', 'qty', 'date', 'student'].some(function (key) { return params.has(key); }) && location.hash !== '#receipt') {
      try {
        var draft = JSON.parse(sessionStorage.getItem(storageKey));
        if (draft && draft.version === M.VERSION && draft.order && M.products[draft.order.productId] && Number.isInteger(draft.order.quantity) && draft.order.quantity >= 1 && draft.order.quantity <= M.MAX_QUANTITY) {
          var requestedOffer = order.offerId;
          if (requestedOffer !== draft.order.offerId) {
            var restoredChoice = chooseOffer(draft.order, requestedOffer);
            order = restoredChoice.order;
            notice = restoredChoice.switched ? restoredChoice.notice : 'Билеты сохранены. ' + restoredChoice.notice;
          } else {
            order = normalizeOrder(draft.order);
            notice = 'Ваш предыдущий выбор сохранён.';
          }
        }
      } catch (_) {}
    }
    if (params.get('switched') === '1' && initial) notice = switchMessage(order.productId);
    function selectionQuery(id, choice) {
      choice = choice || order;
      return new URLSearchParams({ offer: id || 'none', product: choice.productId || '', ride: choice.rideId || '', qty: String(choice.quantity), date: choice.visitDate || '', student: choice.studentAcknowledged ? '1' : '0' }).toString();
    }
    function announce(message) { document.getElementById('announcement').textContent = message; }
    function persist() {
      var url = new URL(location.href);
      url.search = new URLSearchParams({ offer: order.offerId || 'none', product: order.productId || '', ride: order.rideId || '', qty: String(order.quantity), date: order.visitDate || '', student: order.studentAcknowledged ? '1' : '0' }).toString();
      if (receipt) url.hash = 'receipt'; else url.hash = '';
      try { history.replaceState(null, '', url); } catch (_) {}
      try { sessionStorage.setItem(storageKey, JSON.stringify({ version: M.VERSION, order: order, receipt: receipt })); } catch (_) {}
    }
    if (!isList && location.hash === '#receipt') {
      try { var saved = JSON.parse(sessionStorage.getItem(storageKey)); if (saved && saved.version === M.VERSION && saved.receipt && saved.receipt.result && saved.receipt.result.canCheckout && ordersMatch(saved.order, order)) receipt = saved.receipt; } catch (_) {}
      if (!receipt) notice = 'Образец заказа не сохранился. Проверьте выбор и оформите учебный заказ ещё раз.';
    }
    function totals(r) {
      return '<div class="money-row"><span>Полная стоимость</span><strong id="subtotal">' + money(r.subtotal) + '</strong></div><div class="money-row discount"><span>Скидка сейчас</span><strong id="discount">' + (r.discount ? '−' : '') + money(r.discount) + '</strong></div><div class="money-row total"><span>' + (r.canCheckout ? 'К оплате в примере' : 'Без выбранной выгоды') + '</span><strong id="payable">' + money(r.payable) + '</strong></div>' + (r.bonus ? '<div class="bonus-box"><strong>+500 ֏ бонусами отдельно</strong>Текущий платёж не уменьшается.<br>С ' + humanDate(r.bonusValidFrom) + ' по ' + humanDate(r.bonusValidUntil) + '.</div>' : '');
    }
    function productInfo(product) {
      return '<div class="product-info"><p><strong>Что входит:</strong> ' + product.includedRideIds.map(function (id) { return esc(M.demoRides.find(function (r) { return r.id === id; }).name); }).join(', ') + '.</p>' + product.terms.map(function (term) { return '<p>' + esc(term) + '</p>'; }).join('') + '</div>';
    }
    function renderCheckout() {
      var r = M.calculate(order), product = M.products[order.productId], nextAction = issueAction(r);
      var selected = r.offer, ride = M.demoRides.find(function (a) { return a.id === order.rideId; });
      var today = M.getToday(), tomorrow = addDays(today, 1);
      var currentOptions = M.offers.filter(function (o) { return stateOf(o, today) === 'active' || o.id === order.offerId; });
      var invalid = order.offerId && !selected;
      var quantityLabel = order.productId === 'package5' ? 'Количество пакетов' : order.productId === 'unlimited' ? 'Сколько личных безлимитов' : 'Количество билетов';
      document.body.classList.add('has-mobile-checkout');
      app.innerHTML = '<a class="crumb" id="back-to-offers" href="offers.html?' + esc(selectionQuery(order.offerId)) + (selected ? '#offer-' + esc(selected.id) : '') + '">← Все предложения</a><div class="checkout-head"><h1>Ваши билеты</h1><p>Выберите билеты и проверьте сумму. Учебный заказ без оплаты.</p></div>' + (notice ? '<p class="notice" id="selection-notice" role="status">' + esc(notice) + '</p>' : '') + '<div class="checkout-grid"><div><section class="selection-panel" aria-labelledby="selection-heading"><h2 id="selection-heading" tabindex="-1">Ваш выбор</h2><div class="active-offer"><strong>' + esc(selected ? selected.title : invalid ? 'Предложение не распознано' : 'Без предложения, по обычной цене') + '</strong><p>' + esc(selected ? selected.important : invalid ? 'Выберите другое предложение или уберите это из заказа.' : 'Цена зависит от выбранного билета.') + '</p></div><div id="product-field"><div class="product-types" role="group" aria-label="Тип билета"' + describedIssue(r, 'product') + '>' + ['ticket', 'package5', 'unlimited'].map(function (id) { return '<button class="choice" id="product-' + id + '" data-product="' + id + '" aria-pressed="' + (order.productId === id) + '">' + { ticket: 'Разовые билеты', package5: 'Пакет на 5', unlimited: 'Безлимит' }[id] + '</button>'; }).join('') + '</div>' + fieldIssue(r, 'product') + '</div>' + (order.productId === 'ticket' ? '<label class="field" id="ride-field" for="ride"><span class="field-label">Аттракцион</span><select id="ride"' + describedIssue(r, 'ride') + '>' + M.demoRides.map(function (a) { return '<option value="' + a.id + '"' + (order.rideId === a.id ? ' selected' : '') + '>' + esc(a.name) + ' · ' + money(a.price) + '</option>'; }).join('') + '</select>' + fieldIssue(r, 'ride') + '</label>' + (ride ? '<div class="product-preview"><img src="' + esc(ride.photo) + '" width="76" height="62" alt=""><div><strong>' + esc(ride.name) + '</strong><p>Одно катание · ' + money(ride.price) + '</p></div></div>' : '') : '') + '<div class="field" id="quantity-field" tabindex="-1"' + describedIssue(r, 'quantity') + '><span class="field-label" id="quantity-label">' + quantityLabel + '</span><div class="quantity-row" role="group" aria-labelledby="quantity-label">' + [1, 2, 3, 4, 5, 6].map(function (n) { return '<button class="choice" id="qty-' + n + '" data-qty="' + n + '" aria-label="Количество: ' + n + '" aria-pressed="' + (order.quantity === n) + '">' + n + '</button>'; }).join('') + '<select class="more-quantity" id="more-quantity" aria-label="Количество от 7 до 20"><option value="">Ещё</option>' + Array.from({ length: 14 }, function (_, i) { var n = i + 7; return '<option value="' + n + '"' + (order.quantity === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></div>' + fieldIssue(r, 'quantity') + '<span class="help">' + (order.productId === 'package5' ? 'Один пакет = 5 общих катаний. Два пакета = 10 катаний.' : order.productId === 'unlimited' ? 'Каждый безлимит для одного человека. Передавать другому нельзя.' : 'Один билет = одно катание на выбранном аттракционе.') + '</span></div>' + (selected && selected.requiresVisitDate ? '<div class="field" id="date-field"><span class="field-label" id="date-label">Когда придёте?</span><div class="date-row" role="group" aria-labelledby="date-label"><button class="choice" id="date-today"' + describedIssue(r, 'date') + ' data-date="' + today + '" aria-pressed="' + (order.visitDate === today) + '">Сегодня</button><button class="choice" id="date-tomorrow" data-date="' + tomorrow + '" aria-pressed="' + (order.visitDate === tomorrow) + '">Завтра</button></div><label class="field" for="visit-date"><span class="field-label">Или другая дата</span><input id="visit-date"' + describedIssue(r, 'date') + ' type="date" min="' + today + '" max="' + selected.end + '" value="' + esc(order.visitDate || '') + '"></label>' + fieldIssue(r, 'date') + '<span class="help">' + esc(selected.when) + '. Билет будет действовать в выбранный день.</span></div>' : '') + (selected && selected.id === 'student15' ? '<div id="student-field"><label class="ack" for="student-ack"><input id="student-ack" type="checkbox"' + describedIssue(r, 'student') + (order.studentAcknowledged ? ' checked' : '') + '><span>Все билеты для меня. При получении покажу действующий студенческий документ. Без него льготные билеты не выдадут.</span></label>' + fieldIssue(r, 'student') + '</div>' : '') + (product ? '<details class="offer-terms"><summary>Состав и правила билета</summary>' + productInfo(r.lines[0] || product) + '</details>' : '') + '<p class="help">Рост и правила допуска проверяются отдельно. <a href="attractions.html">Посмотреть аттракционы</a>.</p></section><section class="selection-panel" id="offer-field"><h2>Предложение в заказе</h2><label for="selected-offer" class="field-label">Можно выбрать только одно</label><select id="selected-offer"' + describedIssue(r, 'offer') + '><option value="none"' + (!order.offerId ? ' selected' : '') + '>Без предложения, полная цена</option>' + (invalid ? '<option selected value="' + esc(order.offerId) + '">Неизвестное предложение</option>' : '') + currentOptions.map(function (o) { return '<option value="' + o.id + '"' + (order.offerId === o.id ? ' selected' : '') + '>' + esc(o.title) + '</option>'; }).join('') + '</select>' + fieldIssue(r, 'offer') + (selected ? '<details class="offer-terms"><summary>Все условия выбранного предложения</summary>' + terms(selected) + '</details><button class="text-button" id="remove-offer" data-remove>Убрать предложение</button>' : '') + '</section></div><aside class="order-summary" aria-labelledby="total-heading"><h2 id="total-heading">Ваш заказ</h2><p class="small-note">' + esc(product ? (order.productId === 'ticket' && ride ? ride.name : product.name) : 'Товар не выбран') + ' · ' + esc(order.quantity) + ' шт.</p>' + totals(r) + '<p class="order-offer-name">' + esc(selected ? r.applied ? selected.kind === 'package' ? 'Выбран пакет. Отдельная скидка не начисляется.' : 'Применяется: ' + selected.title : 'Пока не применяется: ' + selected.title : 'Без скидок и бонусов.') + '</p>' + (r.issues.length ? '<div class="issue-box" id="order-issues" tabindex="-1"><strong>Нужно уточнить</strong>' + r.issues.map(function (x) { return '<p data-issue="' + x.code + '">' + esc(x.message) + '</p>'; }).join('') + '</div>' : '') + '<button class="action" id="checkout" data-checkout data-ready="' + r.canCheckout + '">' + (r.canCheckout ? 'Оформить учебный заказ' : nextAction.label) + '</button>' + (order.offerId && !r.canCheckout ? '<button class="action secondary" id="continue-without" data-remove>Продолжить без ' + (selected && selected.kind === 'bonus' ? 'бонуса' : 'предложения') + '</button>' : '') + '<p class="small-note">Деньги не списываются. Это образец покупки, не настоящий билет.</p></aside></div><div class="mobile-checkout"><div><p>' + (r.canCheckout ? 'В учебном примере' : 'Выгода пока не применена') + '</p><strong>' + money(r.payable) + '</strong></div><button class="action" id="mobile-checkout" data-checkout data-ready="' + r.canCheckout + '">' + (r.canCheckout ? 'Оформить заказ' : nextAction.label) + '</button></div>';
    }
    function renderReceipt() {
      document.body.classList.remove('has-mobile-checkout');
      var r = receipt.result;
      app.innerHTML = '<div class="receipt"><div class="confirmation" aria-hidden="true">✓</div><h1 tabindex="-1" id="receipt-heading">Учебный заказ собран</h1><p class="receipt-intro">Оплаты не было. Этот образец не является билетом и не даёт права на посещение.</p><section class="receipt-box"><h2>Состав и выбранная выгода</h2>' + r.lines.map(function (line) { return '<p><strong>' + esc(line.name) + ' · ' + line.quantity + ' шт.</strong><br>' + esc(line.recipientLabel) + '</p>'; }).join('') + '<p>' + esc(r.offer ? r.offer.title : 'Без предложения, по полной цене') + '</p>' + (r.offer && r.offer.requiresVisitDate ? '<p><strong>Дата визита: ' + humanDate(r.order.visitDate) + '</strong></p>' : '') + totals(r) + '</section><section class="receipt-box"><h2>Как использовать в учебном примере</h2><p>' + (r.offer && r.offer.id === 'student15' ? 'При получении нужно показать действующий студенческий документ. Все билеты предназначены его владельцу.' : r.bonus ? 'Бонус в этом образце начислен один раз. Его можно использовать на отдельные билеты при следующем визите в указанный срок.' : 'Срок и права сохранены в составе заказа ниже. Перед катанием нужно отдельно проверить допуск.') + '</p>' + r.lines.slice(0, 1).map(function (line) { return '<ul>' + line.terms.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>'; }).join('') + (r.offer ? '<details class="offer-terms"><summary>Условия выбранной выгоды</summary>' + terms(r.offer) + '</details>' : '') + '</section><div class="receipt-actions"><button class="action secondary" id="edit-order">Вернуться к выбору</button><a class="action" href="offers.html">Все предложения</a></div></div>';
    }
    function render(focusId) {
      if (isList) {
        app.innerHTML = renderList(filter);
        if (params.has('product')) app.querySelectorAll('a[href^="offer-checkout.html"]').forEach(function (link) {
          var chosen = new URL(link.href).searchParams.get('offer');
          var cardChoice = chooseOffer(order, chosen === 'none' ? null : chosen);
          var next = new URLSearchParams(selectionQuery(cardChoice.order.offerId, cardChoice.order));
          if (cardChoice.switched) next.set('switched', '1');
          link.href = 'offer-checkout.html?' + next.toString();
        });
      }
      else if (receipt) renderReceipt(); else renderCheckout();
      if (focusId) { var el = document.getElementById(focusId); if (el) el.focus({ preventScroll: true }); }
    }
    function changed(message, focusId) { notice = message || ''; persist(); render(focusId); announce(message || 'Заказ пересчитан. ' + money(M.calculate(order).payable) + '.'); }
    app.addEventListener('click', function (event) {
      var el = event.target.closest('button'); if (!el) return;
      if (el.hasAttribute('data-filter')) { filter = el.dataset.filter; render('filter-' + filter); announce('Показано предложений: ' + app.querySelectorAll('.offer-card').length); }
      if (el.hasAttribute('data-product')) { order.productId = el.dataset.product; changed('Товар изменён. Проверьте применимость выбранного предложения.', el.id); }
      if (el.hasAttribute('data-qty')) { order.quantity = Number(el.dataset.qty); changed('', el.id); }
      if (el.hasAttribute('data-date')) { order.visitDate = el.dataset.date; changed('', el.id); }
      if (el.hasAttribute('data-remove')) { order.offerId = null; order.studentAcknowledged = false; changed('Предложение убрано. Теперь цена без скидки и бонуса.', 'selected-offer'); }
      if (el.hasAttribute('data-checkout')) {
        var r = M.calculate(order);
        if (!r.canCheckout) {
          var action = issueAction(r), control = document.getElementById(action.focusId), field = document.getElementById(action.scrollId);
          if (control) control.focus({ preventScroll: true });
          if (field) { field.classList.add('issue-focus'); field.scrollIntoView({ block: 'center', behavior: 'auto' }); }
          announce(action.message);
          return;
        }
        receipt = { issuedAt: M.getToday(), result: r }; persist(); render(); document.getElementById('receipt-heading').focus(); window.scrollTo(0, 0);
      }
      if (el.id === 'edit-order') { receipt = null; notice = ''; persist(); render('selection-heading'); window.scrollTo(0, 0); }
    });
    app.addEventListener('change', function (event) {
      var el = event.target;
      if (el.id === 'ride') order.rideId = el.value;
      else if (el.id === 'more-quantity') { if (!el.value) return; order.quantity = Number(el.value); }
      else if (el.id === 'visit-date') order.visitDate = normalizeVisitDate(el.value);
      else if (el.id === 'student-ack') order.studentAcknowledged = el.checked;
      else if (el.id === 'selected-offer') {
        var selectedChoice = chooseOffer(order, el.value === 'none' ? null : el.value);
        order = selectedChoice.order;
        changed(selectedChoice.notice, selectedChoice.switched ? 'selection-heading' : el.id);
        if (selectedChoice.switched) document.getElementById('selection-notice').scrollIntoView({ block: 'center', behavior: 'auto' });
        return;
      }
      else return;
      changed('', el.id);
    });
    render();
  }
  return { renderList: renderList, renderReference: renderReference, normalizeVisitDate: normalizeVisitDate, ordersMatch: ordersMatch, chooseOffer: chooseOffer, issueAction: issueAction, start: start };
}));
