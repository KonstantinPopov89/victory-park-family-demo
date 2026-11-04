/* A separate, browser-local teaching ledger. No payment or card integration. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VPTopup = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DB_NAME = 'vp-demo-card-topup-v1';
  const SCENARIOS = ['success', 'declined', 'pending', 'lost_connection', 'credit_pending', 'credit_failed'];
  const clone = value => JSON.parse(JSON.stringify(value));
  const id = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
  const cardId = value => String(value || '').trim().toUpperCase();
  function error(code, message) { const e = new Error(message); e.code = code; throw e; }
  function amount(value) {
    const text = String(value ?? '').trim();
    if (!/^\d+$/.test(text) || !Number.isSafeInteger(Number(text)) || Number(text) < 1 || Number(text) > 100000)
      error('INVALID_AMOUNT', 'Введите целую сумму от 1 до 100 000 AMD.');
    return Number(text);
  }
  function initial() {
    return { version: 1, revision: 0, cards: {
      'DEMO-001': { id: 'DEMO-001', cash: 1000, bonus: 0 },
      'DEMO-002': { id: 'DEMO-002', cash: 2500, bonus: 0 }
    }, draft: { intentId: id('draft'), cardId: '', amount: '5000' }, operations: [], activeId: null, currentId: null };
  }
  // Browser persistence is an input boundary, including IndexedDB. Refuse a
  // damaged ledger without replacing it or issuing another payment attempt.
  function bounded(value, depth = 0, budget = { nodes: 500000, bytes: 16777216 }) {
    if (--budget.nodes < 0 || depth > 16) return false;
    if (value === null || typeof value === 'boolean') return true;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'string') { budget.bytes -= value.length * 2; return value.length <= 8192 && budget.bytes >= 0; }
    if (typeof value !== 'object') return false;
    const keys = Object.keys(value);
    return keys.length <= 10000 && keys.every(key => key.length <= 128 && !['__proto__', 'prototype', 'constructor'].includes(key) && bounded(value[key], depth + 1, budget));
  }
  function validateLedger(value) {
    if (!bounded(value)) return null;
    const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
    const integer = (x, min = 0, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(x) && x >= min && x <= max;
    const identifier = x => typeof x === 'string' && /^[A-Za-z0-9-]{1,100}$/.test(x);
    const date = x => typeof x === 'string' && x.length <= 40 && Number.isFinite(Date.parse(x));
    const balance = x => object(x) && integer(x.cash) && integer(x.bonus);
    const cardNames = ['DEMO-001', 'DEMO-002'];
    if (!object(value) || value.version !== 1 || !integer(value.revision) || !object(value.cards) || Object.keys(value.cards).length !== 2 ||
      !cardNames.every(key => balance(value.cards[key]) && value.cards[key].id === key) || !object(value.draft) ||
      !identifier(value.draft.intentId) || !['', ...cardNames].includes(value.draft.cardId) || typeof value.draft.amount !== 'string' || value.draft.amount.length > 12 ||
      !Array.isArray(value.operations) || value.operations.length > 10000) return null;
    const ids = new Set(), intents = new Set();
    for (const op of value.operations) {
      if (!object(op) || !identifier(op.id) || ids.has(op.id) || !identifier(op.intentId) || intents.has(op.intentId) || op.type !== 'card_topup' ||
        !cardNames.includes(op.cardId) || !integer(op.amount, 1, 100000) || op.fee !== 0 || op.bonus !== 0 || !date(op.createdAt) || !SCENARIOS.includes(op.scenario) ||
        !['declined', 'pending', 'unknown', 'confirmed'].includes(op.payment) || !['not_started', 'failed', 'pending', 'credited'].includes(op.credit) ||
        !integer(op.paymentChecks) || !integer(op.creditChecks) || op.paymentAttempts !== 1 || ![0, 1].includes(op.creditEntries)) return null;
      if (op.credit === 'credited' ? op.payment !== 'confirmed' || op.creditEntries !== 1 || !balance(op.balanceAfter) || !date(op.creditedAt) || Date.parse(op.creditedAt) < Date.parse(op.createdAt) : op.creditEntries !== 0 || op.balanceAfter !== null) return null;
      if (op.payment !== 'confirmed' && op.credit !== 'not_started') return null;
      ids.add(op.id); intents.add(op.intentId);
    }
    if (![null, ...ids].includes(value.currentId) || ![null, ...ids].includes(value.activeId)) return null;
    const outstanding = value.operations.filter(pending);
    if (outstanding.length > 1 || (outstanding[0]?.id || null) !== value.activeId) return null;
    return clone(value);
  }
  function pending(op) { return op && op.payment !== 'declined' && op.credit !== 'credited'; }
  function operation(state, opId) { return state.operations.find(o => o.id === opId); }
  function active(state) { return operation(state, state.activeId); }
  function validCard(state, value) {
    const valueId = cardId(value);
    if (!state.cards[valueId]) error('UNKNOWN_CARD', 'Такой тестовой карты нет. Используйте DEMO-001 или DEMO-002.');
    return valueId;
  }
  function receipt(op) {
    if (!op || op.credit !== 'credited') error('NO_RECEIPT', 'Подтверждение будет доступно после зачисления.');
    return [
      'VICTORY PARK · УЧЕБНОЕ ПОПОЛНЕНИЕ',
      `Операция: ${op.id}`,
      `Тестовая карта: ${op.cardId}`,
      `Дата: ${new Date(op.creditedAt).toLocaleString('ru-RU')}`,
      `Демо-оплата подтверждена: ${op.amount} AMD`,
      `Зачислено деньгами: ${op.amount} AMD`,
      'Комиссия: 0 AMD. Бонусы: 0 AMD. Это тестовые условия.',
      `Баланс сразу после зачисления: ${op.balanceAfter.cash} AMD деньгами, ${op.balanceAfter.bonus} AMD бонусами.`,
      'Это браузерная демонстрация. Деньги не списаны, действующая карта не пополнена.',
      'Подтверждение не является билетом или разрешением на посещение парка.'
    ].join('\n');
  }
  function makeEngine(adapter) {
    return {
      read: () => adapter.read(),
      subscribe: listener => adapter.subscribe?.(listener) || (() => {}),
      async saveDraft(patch) {
        return adapter.update(state => {
          if (pending(active(state))) return { state, blockedBy: state.activeId };
          if (patch.cardId !== undefined) state.draft.cardId = validCard(state, patch.cardId);
          // Keep incomplete typed amounts in the draft, but never start an operation from them.
          if (patch.amount !== undefined) state.draft.amount = String(patch.amount).slice(0, 12);
          return { state };
        });
      },
      async start(input) {
        return adapter.update(state => {
          const same = state.operations.find(o => o.intentId === input.intentId);
          if (same) return { state, operation: same, reused: true };
          if (pending(active(state))) return { state, operation: active(state), reused: true };
          if (state.draft.intentId !== input.intentId) error('STALE_DRAFT', 'Черновик изменился в другой вкладке. Проверьте карту и сумму заново.');
          const selected = validCard(state, input.cardId), sum = amount(input.amount);
          if (state.draft.cardId !== selected || String(state.draft.amount) !== String(input.amount))
            error('STALE_DRAFT', 'Карта или сумма изменились в другой вкладке. Проверьте итог заново.');
          const scenario = SCENARIOS.includes(input.scenario) ? input.scenario : 'success';
          const op = {
            id: id('TOPUP'), intentId: input.intentId, type: 'card_topup', cardId: selected,
            amount: sum, fee: 0, bonus: 0, createdAt: new Date().toISOString(), scenario,
            payment: scenario === 'declined' ? 'declined' : scenario === 'pending' ? 'pending' : scenario === 'lost_connection' ? 'unknown' : 'confirmed',
            credit: scenario === 'declined' || scenario === 'pending' || scenario === 'lost_connection' ? 'not_started' : scenario === 'credit_failed' ? 'failed' : 'pending',
            paymentChecks: 0, creditChecks: 0, paymentAttempts: 1, creditEntries: 0, balanceAfter: null
          };
          state.operations.unshift(op); state.currentId = op.id; state.activeId = pending(op) ? op.id : null;
          return { state, operation: op, reused: false };
        });
      },
      async check(opId) {
        return adapter.update(state => {
          const op = operation(state, opId);
          if (!op) error('UNKNOWN_OPERATION', 'Эта операция не найдена в данном браузере.');
          if (op.payment === 'declined' || op.credit === 'credited') return { state, operation: op, reused: true };
          if (op.payment === 'unknown' || op.payment === 'pending') {
            op.paymentChecks += 1; op.payment = 'confirmed'; op.credit = 'pending';
          } else if (op.credit === 'failed') {
            op.creditChecks += 1;
          } else {
            op.creditChecks += 1;
            if (op.scenario !== 'credit_pending' || op.creditChecks >= 2) {
              // This read/modify/write and the posted marker commit in the SAME IndexedDB transaction.
              state.cards[op.cardId].cash += op.amount;
              op.credit = 'credited'; op.creditEntries = 1; op.creditedAt = new Date().toISOString();
              op.balanceAfter = clone(state.cards[op.cardId]);
              if (state.activeId === op.id) state.activeId = null;
            }
          }
          return { state, operation: op, reused: false };
        });
      },
      async newDraft() {
        return adapter.update(state => {
          if (pending(active(state))) return { state, blockedBy: state.activeId };
          state.draft = { ...state.draft, intentId: id('draft') }; state.currentId = null;
          return { state };
        });
      },
      receipt: async opId => receipt(operation(await adapter.read(), opId)),
      close: () => adapter.close?.()
    };
  }
  function createMemoryStore(seed) {
    let state = seed ? validateLedger(seed) : initial(), queue = Promise.resolve();
    if (!state) error('INVALID_STORAGE', 'Saved ledger is damaged.');
    return makeEngine({
      read: async () => clone(state),
      update(fn) {
        const task = queue.then(() => { const next = clone(state); const result = fn(next); next.revision += 1; if (!validateLedger(next)) error('INVALID_STORAGE', 'Updated ledger is invalid.'); state = next; return clone(result); });
        queue = task.catch(() => {}); return task;
      }
    });
  }
  function createBrowserStore(name = DB_NAME) {
    if (!globalThis.indexedDB) error('NO_STORAGE', 'Для учебного пополнения нужно разрешить хранение данных в браузере.');
    const listeners = new Set();
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(name) : null;
    channel?.addEventListener('message', () => listeners.forEach(fn => fn()));
    const ready = new Promise((resolve, reject) => {
      const request = indexedDB.open(name, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('ledger');
      request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Хранилище занято другой вкладкой. Закройте старую вкладку и повторите.'));
    });
    async function run(fn, write) {
      const db = await ready;
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('ledger', 'readwrite');
        const store = transaction.objectStore('ledger');
        let result, failure;
        const get = store.get('state');
        get.onsuccess = () => {
          try {
            const state = get.result ? validateLedger(get.result) : initial();
            if (!state) error('INVALID_STORAGE', 'Сохранённое учебное пополнение повреждено. Новая оплата не начата.');
            result = fn(state);
            if (write) state.revision += 1;
            if (write || !get.result) { if (!validateLedger(state)) error('INVALID_STORAGE', 'Обновление не прошло проверку. Сохраненная операция остается без изменений.'); store.put(state, 'state'); }
          } catch (e) { failure = e; transaction.abort(); }
        };
        transaction.oncomplete = () => { if (write) channel?.postMessage('updated'); resolve(clone(result)); };
        transaction.onerror = transaction.onabort = () => reject(failure || transaction.error || new Error('Не удалось сохранить операцию. Повторите проверку.'));
      });
    }
    return makeEngine({
      read: () => run(state => state, false),
      update: fn => run(fn, true),
      subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); },
      close: async () => { channel?.close(); (await ready).close(); }
    });
  }
  return { DB_NAME, SCENARIOS, initial, validateLedger, pending, amount, cardId, receipt, createMemoryStore, createBrowserStore };
});
