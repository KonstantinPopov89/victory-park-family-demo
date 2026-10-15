'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../family-v3/model.js');
const C = require('../family-v3/cart-promotions.js');
const copy = value => JSON.parse(JSON.stringify(value));
const today = '2026-10-15';

function basket() {
  const state = B.emptyState();
  state.mode = 'demo';
  state.party = [{ id: 'adult', label: 'Взрослый', role: 'adult', age: 30, height: 170 }];
  state.cart.lines = [
    { id: 'package', productId: 'package5', rideId: null, personId: null, recipientKey: null, quantity: 2, unitPrice: B.products.package5.price },
    { id: 'ticket', productId: 'ticket', rideId: 'demo-calm', personId: 'adult', recipientKey: null, quantity: 3, unitPrice: B.demoRides.find(r => r.id === 'demo-calm').price }
  ];
  return state;
}

function snapshot(status = 'partial', promotion = null, state = basket()) {
  return C.snapshotOrder(state, promotion, 'DEMO-issuance-test', status, today);
}

test('partial issuance counts issued products, not package ride rights, and survives storage round trip', () => {
  const order = snapshot();
  assert.equal(order.status, 'partial');
  assert.equal(order.issuedCount, 4);
  assert.equal(order.lines.reduce((n, l) => n + l.quantity, 0), 5);
  const restored = C.validateOrder(copy(order));
  assert.deepEqual(restored, order);
  assert.deepEqual(C.issuedItems(restored).map(t => [t.lineId, t.ordinal, t.remaining]), [
    ['package', 1, 5], ['package', 2, 5], ['ticket', 1, 1], ['ticket', 2, 1]
  ]);
});

test('finishing issuance retains already issued tickets and prices with the same codes', () => {
  const partial = snapshot();
  const before = copy(partial);
  const available = C.issuedItems(partial);
  const complete = copy(partial);
  complete.status = 'success';
  delete complete.issuedCount;
  const all = C.issuedItems(complete);
  assert.ok(C.validateOrder(complete));
  assert.equal(all.length, 5);
  assert.deepEqual(all.slice(0, 4), available);
  assert.equal(new Set(all.map(t => t.code)).size, all.length);
  assert.equal(complete.total, partial.total);
  assert.deepEqual(partial, before);
});

test('partial tickets retain promotion-specific price and validity after completion', () => {
  const promotion = { offerId: 'weekday20', visitDate: today, studentAcknowledged: false };
  const partial = snapshot('partial', promotion);
  assert.ok(C.validateOrder(partial));
  assert.equal(partial.total, 10160);
  const available = C.issuedItems(partial);
  const issuedTicket = available.find(t => t.productId === 'ticket');
  assert.equal(issuedTicket.price, 720);
  assert.equal(issuedTicket.validity, 'Только ' + today);
  const complete = { ...copy(partial), status: 'success' };
  delete complete.issuedCount;
  assert.deepEqual(C.issuedItems(complete).slice(0, available.length), available);
});

test('invalid partial counts never issue tickets in either validator', () => {
  const base = B.snapshotOrder(basket(), 'DEMO-base', 'partial');
  const enriched = snapshot();
  for (const [api, original] of [[B, base], [C, enriched]]) {
    for (const issuedCount of [undefined, null, 0, -1, 5, 99, 1.5, '2', NaN, Infinity]) {
      const bad = copy(original);
      if (issuedCount === undefined) delete bad.issuedCount;
      else bad.issuedCount = issuedCount;
      assert.equal(api.validateOrder(bad), null, String(issuedCount));
      assert.deepEqual(api.issuedItems(bad), [], String(issuedCount));
    }
    for (const issuedCount of [1, 2, 3, 4]) {
      const valid = { ...copy(original), issuedCount };
      assert.ok(api.validateOrder(valid));
      assert.equal(api.issuedItems(valid).length, issuedCount);
    }
  }
});

test('single-item partial request falls back to issuance without an issuedCount field', () => {
  const state = basket();
  state.cart.lines = [state.cart.lines[0]];
  state.cart.lines[0].quantity = 1;
  for (const order of [B.snapshotOrder(state, 'DEMO-single', 'partial'), snapshot('partial', null, state)]) {
    assert.equal(order.status, 'issuance');
    assert.equal(Object.hasOwn(order, 'issuedCount'), false);
    assert.ok(C.validateOrder(order));
    assert.deepEqual(C.issuedItems(order), []);
    assert.equal(C.validateOrder({ ...order, status: 'partial', issuedCount: 1 }), null);
  }
});

test('old order shapes remain valid and normal statuses reject issuedCount', () => {
  for (const status of ['success', 'declined', 'pending', 'issuance']) {
    for (const order of [B.snapshotOrder(basket(), 'DEMO-old', status), snapshot(status)]) {
      assert.equal(Object.hasOwn(order, 'issuedCount'), false);
      assert.ok(C.validateOrder(copy(order)), status);
      assert.equal(C.issuedItems(order).length, status === 'success' ? 5 : 0);
      const malformed = { ...order, issuedCount: 1 };
      assert.equal(C.validateOrder(malformed), null);
      if (!Object.hasOwn(order, 'pricingVersion')) assert.equal(B.validateOrder(malformed), null);
    }
  }
});

test('partial support preserves strict promotion schema and rejects forged rights and totals', () => {
  for (const mutation of [
    o => { o.extra = true; },
    o => { o.lines[0].extra = true; },
    o => { o.total -= 1; },
    o => { o.subtotal -= 1; },
    o => { o.lines[0].quantity += 1; },
    o => { o.lines[0].unitsPerItem = 50; },
    o => { o.lines[1].unitPrice = 1; },
    o => { o.lines[1].includedRideIds = ['demo-thrill']; }
  ]) {
    const bad = snapshot();
    mutation(bad);
    assert.equal(C.validateOrder(bad), null);
    assert.deepEqual(C.issuedItems(bad), []);
  }
});
