/* Independent card top-up route. Ticket state is never read or changed here. */
(() => {
  'use strict';
  const app = document.getElementById('topup-app'), announce = document.getElementById('tu-announce');
  const money = value => `${Number(value).toLocaleString('ru-RU')} AMD`;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const mask = value => `DEMO-••${String(value).slice(-1)}`;
  const scenarios = { success: 'Успешная оплата и зачисление', declined: 'Окончательный отказ оплаты', pending: 'Оплата ещё обрабатывается', lost_connection: 'Связь потеряна, исход оплаты неизвестен', credit_pending: 'Оплата получена, зачисление задерживается', credit_failed: 'Оплата получена, ошибка зачисления' };
  let engine, state, stage = 'card', displayedId = null, busy = false, scenario = 'success';
  let amountSave = Promise.resolve();
  const getOp = id => state?.operations.find(op => op.id === id);
  const hashOp = () => new URLSearchParams(location.hash.slice(1)).get('operation');
  function focus(id) { document.getElementById(id)?.focus({ preventScroll: false }); }
  function operationHash(id, replace = false) {
    const url = new URL(location.href); url.hash = id ? `operation=${encodeURIComponent(id)}` : '';
    if (url.href !== location.href) history[replace ? 'replaceState' : 'pushState']({}, '', url);
  }
  function say(text) { announce.textContent = ''; requestAnimationFrame(() => { announce.textContent = text; }); }
  function status(op) {
    if (op.credit === 'credited') return 'Карта пополнена';
    if (op.payment === 'declined') return 'Оплата отклонена';
    if (op.payment === 'unknown') return 'Исход оплаты неизвестен';
    if (op.payment === 'pending') return 'Оплата обрабатывается';
    if (op.credit === 'failed') return 'Оплата получена, зачисление не удалось';
    return 'Оплата получена. Проверяем зачисление';
  }
  function historyView() {
    return `<aside class="tu-panel"><details class="tu-history" ${state.operations.length ? 'open' : ''}><summary>История пополнений${state.operations.length ? ` · ${state.operations.length}` : ''}</summary>${state.operations.length ? `<ul class="tu-history-list">${state.operations.map(op => `<li><button type="button" data-operation="${escape(op.id)}" aria-current="${displayedId === op.id}"><strong>${escape(op.cardId)} · ${money(op.amount)}</strong><span>${status(op)}</span><small>${new Date(op.createdAt).toLocaleString('ru-RU')}</small></button></li>`).join('')}</ul>` : '<p class="tu-muted-empty">Здесь появятся учебные операции, выполненные в этом браузере.</p>'}</details><p class="tu-note">Хранится в этом браузере. На другом устройстве история недоступна.</p><a href="tickets.html" class="tu-link">Билеты и история покупок →</a></aside>`;
  }
  function cardView() {
    const card = state.draft.cardId && state.cards[state.draft.cardId];
    return `<section class="tu-panel" aria-labelledby="tu-step-title"><h2 id="tu-step-title" tabindex="-1">Какую карту пополнить?</h2><p class="tu-hint">Только тестовые номера. Не вводите номер настоящей карты.</p><form id="tu-card-form" novalidate><div class="tu-field"><label for="tu-card-number">Номер тестовой карты</label><input id="tu-card-number" name="demo-card" type="text" value="${escape(card?.id || '')}" placeholder="DEMO-001" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="32" aria-describedby="tu-card-error"><p class="tu-error" id="tu-card-error" role="alert"></p></div><div class="tu-choices"><button type="button" class="btn" data-demo-card="DEMO-001">Использовать демо-карту</button><button type="button" class="btn btn-outline" data-demo-card="DEMO-002">Другая: DEMO-002</button></div>${card ? `<div class="tu-card" id="tu-found-card"><div><strong>${card.id}</strong><small>Тестовая карта найдена</small><small>Деньги: ${money(card.cash)} · бонусы: ${money(card.bonus)}</small></div></div>` : ''}<button class="btn btn-primary tu-wide" type="submit">Продолжить</button></form></section>`;
  }
  function amountView() {
    const draft = state.draft;
    return `<section class="tu-panel" aria-labelledby="tu-step-title"><h2 id="tu-step-title" tabindex="-1">Сколько зачислить?</h2><div class="tu-card"><div><strong>Карта ${mask(draft.cardId)}</strong><small>Тестовая ${draft.cardId}</small></div><button type="button" class="btn btn-text" data-change-card>Изменить</button></div><form id="tu-amount-form" novalidate><div class="tu-field"><label for="tu-amount">Сумма в AMD</label><input id="tu-amount" name="amount" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" value="${escape(draft.amount)}" maxlength="12" aria-describedby="tu-amount-hint tu-amount-error"><p class="tu-hint" id="tu-amount-hint">От 1 до 100 000 AMD. Можно выбрать кнопкой.</p><p class="tu-error" id="tu-amount-error" role="alert"></p></div><div class="tu-choices">${[2000,5000,10000].map(n => `<button type="button" class="btn" data-amount="${n}" aria-pressed="${String(draft.amount) === String(n)}">${money(n)}</button>`).join('')}</div><dl class="tu-totals"><div><dt>Зачислим деньгами</dt><dd id="tu-credit-total"></dd></div><div><dt>Бонусы</dt><dd>0 AMD</dd></div><div><dt>Комиссия</dt><dd>0 AMD</dd></div><div class="tu-pay"><dt>К оплате</dt><dd id="tu-pay-total"></dd></div></dl><p class="tu-hint">Нулевые комиссия и бонусы являются тестовыми условиями.</p><button id="tu-pay-button" class="btn btn-primary tu-wide" type="submit"></button><p class="tu-hint">Это демо-оплата. Банковские реквизиты не нужны, деньги не спишутся.</p><details class="tu-scenarios"><summary>Сценарии для проверки прототипа</summary>${Object.entries(scenarios).map(([value,label]) => `<label><input type="radio" name="scenario" value="${value}" ${scenario === value ? 'checked' : ''}>${label}</label>`).join('')}</details></form></section>`;
  }
  function operationView(op) {
    let body = '', actions = '', tone = '', title = status(op);
    if (op.payment === 'declined') {
      tone = 'error'; body = 'Демо-оплата окончательно отклонена. Зачисления не было. Можно повторить попытку.';
      actions = '<button class="btn btn-primary tu-wide" data-new-draft>Повторить попытку</button>';
    } else if (op.payment === 'pending' || op.payment === 'unknown') {
      body = op.payment === 'unknown' ? 'Связь потеряна после начала демо-оплаты. Пока неизвестно, прошла ли она. Проверим эту же операцию, повторная оплата не нужна.' : 'Результат демо-оплаты ещё не получен. Проверим эту же операцию, повторная оплата не нужна.';
      actions = `<button class="btn btn-primary tu-wide" data-check="${op.id}">Проверить оплату</button>`;
    } else if (op.credit === 'credited') {
      tone = 'success'; body = `На тестовую карту ${op.cardId} зачислено ${money(op.amount)} деньгами. Реальная карта не менялась.`;
      actions = `<dl class="tu-totals"><div><dt>Зачислено деньгами</dt><dd>${money(op.amount)}</dd></div><div><dt>Начислено бонусов</dt><dd>0 AMD</dd></div><div class="tu-pay"><dt>Баланс после операции</dt><dd>${money(op.balanceAfter.cash)}</dd></div><div><dt>Бонусный баланс</dt><dd>${money(op.balanceAfter.bonus)}</dd></div></dl><p class="tu-hint">Баланс получен из учебного учёта на момент этой операции.</p><button class="btn btn-primary tu-wide" data-save="${op.id}">Сохранить подтверждение</button><button class="btn btn-outline tu-wide" data-new-draft>Пополнить ещё</button><a class="tu-link" href="attractions.html">Подобрать аттракционы →</a>`;
    } else if (op.credit === 'failed') {
      tone = 'error'; body = 'Демо-оплата подтверждена, но учебный учёт вернул ошибку зачисления. Карта ещё не пополнена. Не оплачивайте повторно.';
      actions = `<button class="btn btn-primary tu-wide" data-check="${op.id}">Проверить зачисление</button><details class="tu-support"><summary>Как получить помощь</summary><p>В настоящем сервисе здесь была бы поддержка парка. В прототипе обращение не отправляется. Для обсуждения сохраните номер операции и сумму. Автоматический возврат не обещан.</p><p class="tu-note">Номер: ${escape(op.id)}</p><button class="btn btn-outline" type="button" data-save-status="${op.id}">Сохранить сведения для обращения</button></details>`;
    } else {
      body = 'Демо-оплата подтверждена. Деньги ещё не зачислены на тестовую карту. Проверим результат этой же операции.';
      actions = `<button class="btn btn-primary tu-wide" data-check="${op.id}">Проверить зачисление</button>`;
    }
    const unfinished = state.activeId && state.activeId !== op.id ? `<div class="tu-state"><p>Есть другое незавершённое пополнение. Его нужно проверить перед новой оплатой.</p><button class="btn btn-outline tu-wide" data-operation="${state.activeId}">Открыть незавершённую операцию</button></div>` : '';
    return `<section class="tu-panel" aria-labelledby="tu-step-title">${unfinished}<h2 id="tu-step-title" tabindex="-1">${title}</h2><div class="tu-state ${tone}"><p>${body}</p></div><dl class="tu-meta"><div><dt>Тестовая карта</dt><dd>${op.cardId}</dd></div><div><dt>Сумма демо-оплаты</dt><dd>${money(op.amount)}</dd></div><div><dt>Комиссия</dt><dd>0 AMD</dd></div><div class="tu-op-id"><dt>Номер операции</dt><dd>${escape(op.id)}</dd></div></dl>${actions}<p class="tu-note">${op.credit === 'credited' ? 'Карта пополнена только в демонстрации. Это не билет и не разрешение на посещение.' : 'Операция сохранена в этом браузере. Можно вернуться к ней после обновления страницы.'}</p></section>`;
  }
  function render(target) {
    if (!state) return;
    const op = getOp(displayedId);
    document.body.classList.toggle('tu-has-progress', !!op || stage === 'amount');
    app.innerHTML = `<div class="tu-layout">${op ? operationView(op) : stage === 'amount' && state.draft.cardId ? amountView() : cardView()}${historyView()}</div>`;
    if (!op && stage === 'amount') refreshAmount();
    if (target) focus(target);
  }
  function refreshAmount() {
    const input = document.getElementById('tu-amount'); if (!input) return;
    let valid; try { valid = VPTopup.amount(input.value); } catch (_) { valid = null; }
    document.getElementById('tu-credit-total').textContent = valid ? money(valid) : 'Укажите сумму';
    document.getElementById('tu-pay-total').textContent = valid ? money(valid) : 'Укажите сумму';
    document.getElementById('tu-pay-button').textContent = valid ? `Пополнить на ${money(valid)}` : 'Укажите сумму пополнения';
    app.querySelectorAll('[data-amount]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.amount === input.value)));
  }
  function fieldError(fieldId, errorId, message) {
    const input = document.getElementById(fieldId), error = document.getElementById(errorId);
    if (input) { input.setAttribute('aria-invalid', 'true'); input.focus(); }
    if (error) error.textContent = message;
  }
  async function run(action) {
    if (busy) return;
    busy = true; app.setAttribute('aria-busy', 'true');
    try { await action(); }
    catch (error) {
      if (error.code === 'STALE_DRAFT') {
        state = await engine.read(); displayedId = state.activeId; stage = 'amount'; render('tu-step-title');
        const note = document.createElement('p'); note.className = 'tu-error'; note.role = 'alert'; note.textContent = error.message; app.prepend(note);
      } else {
        let note = document.getElementById('tu-action-error');
        if (!note) { note = document.createElement('p'); note.id = 'tu-action-error'; note.className = 'tu-error'; note.setAttribute('role', 'alert'); app.prepend(note); }
        note.textContent = error.message || 'Не удалось сохранить состояние. Проверьте операцию, не запускайте оплату заново.';
      }
    } finally { busy = false; app.removeAttribute('aria-busy'); }
  }
  app.addEventListener('submit', event => {
    event.preventDefault();
    if (event.target.id === 'tu-card-form') run(async () => {
      const input = document.getElementById('tu-card-number');
      const selected = VPTopup.cardId(input.value);
      if (!state.cards[selected]) return fieldError('tu-card-number', 'tu-card-error', 'Такой тестовой карты нет. Используйте DEMO-001 или DEMO-002.');
      const result = await engine.saveDraft({ cardId: selected }); state = result.state;
      if (result.blockedBy) { displayedId = result.blockedBy; operationHash(displayedId); }
      else stage = 'amount';
      render('tu-step-title');
    });
    if (event.target.id === 'tu-amount-form') run(async () => {
      const input = document.getElementById('tu-amount');
      try { VPTopup.amount(input.value); } catch (error) { return fieldError('tu-amount', 'tu-amount-error', error.message); }
      const snapshot = { ...state.draft, amount: input.value, scenario };
      await amountSave;
      const result = await engine.start(snapshot); state = result.state; displayedId = result.operation.id;
      operationHash(displayedId); render('tu-step-title'); say(status(result.operation));
    });
  });
  app.addEventListener('input', event => {
    if (event.target.id !== 'tu-amount') return;
    event.target.removeAttribute('aria-invalid'); document.getElementById('tu-amount-error').textContent = '';
    const value = event.target.value; state.draft.amount = value;
    amountSave = amountSave.then(() => engine.saveDraft({ amount: value })).catch(error => { say(error.message); });
    refreshAmount();
  });
  app.addEventListener('change', event => { if (event.target.name === 'scenario') scenario = event.target.value; });
  app.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.demoCard) run(async () => {
      const result = await engine.saveDraft({ cardId: button.dataset.demoCard }); state = result.state;
      if (result.blockedBy) { displayedId = result.blockedBy; operationHash(displayedId); }
      else stage = 'card';
      render(result.blockedBy ? 'tu-step-title' : 'tu-card-number'); say('Тестовая карта найдена');
    });
    else if (button.hasAttribute('data-change-card')) { stage = 'card'; render('tu-step-title'); }
    else if (button.dataset.amount) {
      const input = document.getElementById('tu-amount'); input.value = button.dataset.amount;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    else if (button.dataset.check) run(async () => {
      const result = await engine.check(button.dataset.check); state = result.state; displayedId = result.operation.id;
      render('tu-step-title'); say(status(result.operation));
    });
    else if (button.dataset.operation) {
      displayedId = button.dataset.operation; operationHash(displayedId); render('tu-step-title');
    }
    else if (button.hasAttribute('data-new-draft')) run(async () => {
      const result = await engine.newDraft(); state = result.state; displayedId = result.blockedBy || null; scenario = 'success';
      stage = 'card'; operationHash(displayedId); render('tu-step-title');
    });
    else if (button.dataset.save) run(async () => {
      download(await engine.receipt(button.dataset.save), `Victory-Park-${button.dataset.save}.txt`); say('Подтверждение сохранено как текстовый файл.');
    });
    else if (button.dataset.saveStatus) {
      const op = getOp(button.dataset.saveStatus);
      download(`УЧЕБНОЕ ОБРАЩЕНИЕ, НЕ ОТПРАВЛЕНО\n${status(op)}\nОперация: ${op.id}\nКарта: ${op.cardId}\nСумма: ${money(op.amount)}\nРеальная оплата не подключена.\n`, `Victory-Park-status-${op.id}.txt`);
      say('Сведения сохранены. Обращение никуда не отправлено.');
    }
  });
  function download(text, name) {
    const link = document.createElement('a'), url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    link.href = url; link.download = name; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
  document.querySelector('[data-tu-return]').addEventListener('click', () => {
    document.getElementById('topup-conditions').open = false; focus('tu-step-title');
  });
  window.addEventListener('popstate', () => { displayedId = getOp(hashOp()) ? hashOp() : state.activeId; render('tu-step-title'); });
  async function refreshExternal() {
    if (busy || !engine) return;
    await amountSave;
    const latest = await engine.read();
    if (latest.revision === state.revision) return;
    state = latest;
    if (state.activeId) displayedId = state.activeId;
    else if (!displayedId && state.currentId) displayedId = state.currentId;
    render();
  }
  window.addEventListener('focus', () => refreshExternal().catch(() => {}));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshExternal().catch(() => {}); });
  (async () => {
    try {
      engine = VPTopup.createBrowserStore(); state = await engine.read();
      displayedId = getOp(hashOp()) ? hashOp() : state.activeId || state.currentId;
      if (displayedId) operationHash(displayedId, true);
      stage = state.draft.cardId ? 'amount' : 'card'; render();
      engine.subscribe(() => refreshExternal().catch(() => {}));
      window.VPTopupUI = { getState: () => engine.read() };
    } catch (_) {
      app.innerHTML = '<section class="tu-panel"><h2>Хранилище недоступно</h2><p>Для безопасного учебного пополнения нужно разрешить хранение данных этого сайта в браузере. Оплата не начиналась. Обновите страницу после изменения настройки.</p><a class="tu-link" href="tickets.html">Вернуться к билетам</a></section>';
    }
  })();
})();
