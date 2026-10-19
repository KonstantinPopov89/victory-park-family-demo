/* Interest-only bridge. Loading this file has no storage or DOM side effects.
 * Call sync(storage, {createAState: VP3.emptyState}) after A's model.js and before
 * app.js initializes; call sync(storage) before B's picker initializes or when
 * leaving either route. It does not refresh either already-rendered UI.
 * Native selection removal propagates only after a shared snapshot exists.
 * Unmatched IDs stay in their native list and in an informational archive.
 * Never map assets, similar names, demo rides, prices, cart, people or payments.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VPJourneyBridge = api;
}(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  var KEYS = Object.freeze({ a: 'vp.family.v3', b: 'vpList', bridge: 'vp.journey.interests.v1' });
  // Source proof: assets/js/data-ru.js attr vs experience/family-v3/model.js realRides.
  // Exact IDs are case-sensitive. Asset-name resemblance is deliberately insufficient.
  var MAP = Object.freeze([
    Object.freeze({ a: 'autodrom', b: 'autodrom', proof: 'exact-id-and-name', aName: 'Автодром', bName: 'Автодром' }),
    Object.freeze({ a: 'pendulum', b: 'pendulum', proof: 'exact-id', aName: 'Метроном', bName: 'Пендулум' }),
    Object.freeze({ a: 'planet', b: 'planeta', proof: 'exact-name', aName: 'Планета', bName: 'Планета' })
  ]);
  var MAP_VERSION = 'exact-id-name-v1';
  function record(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function ids(v) { return Array.isArray(v) && v.every(function (id) { return typeof id === 'string' && id.length > 0; }); }
  function unique(v) { return Array.from(new Set(v)); }
  function copy(v) { return JSON.parse(JSON.stringify(v)); }
  function aValid(v) { return record(v) && v.version === 3 && record(v.selections) && ids(v.selections.real); }
  function bridgeValid(v) {
    return record(v) && v.version === 1 && v.mapVersion === MAP_VERSION && ids(v.shared)
      && v.shared.every(function (id) { return MAP.some(function (m) { return m.a === id; }); })
      && record(v.snapshot) && (v.snapshot.a === null || ids(v.snapshot.a)) && (v.snapshot.b === null || ids(v.snapshot.b))
      && record(v.unmappedArchive) && ids(v.unmappedArchive.a) && ids(v.unmappedArchive.b);
  }
  function reconcile(input) {
    input = input || {};
    var a = input.aState == null ? null : input.aState, b = input.bList == null ? null : input.bList;
    var previous = input.bridgeState == null ? null : input.bridgeState;
    if (a !== null && !aValid(a)) throw new TypeError('Invalid A state: native data must remain untouched.');
    if (b !== null && !ids(b)) throw new TypeError('Invalid B list: native data must remain untouched.');
    if (previous !== null && !bridgeValid(previous)) throw new TypeError('Invalid bridge state: preserve it for inspection.');
    var aIds = a ? a.selections.real : [], bIds = b || [], warnings = [], shared = [];
    MAP.forEach(function (m) {
      var av = aIds.includes(m.a), bv = bIds.includes(m.b);
      var ac = previous && a !== null && previous.snapshot.a !== null && av !== previous.snapshot.a.includes(m.a);
      var bc = previous && b !== null && previous.snapshot.b !== null && bv !== previous.snapshot.b.includes(m.b);
      var chosen;
      if (ac && bc) {
        chosen = av || bv;
        if (av !== bv) warnings.push('Conflicting edits retained interest: ' + m.a);
      } else if (ac) chosen = av;
      else if (bc) chosen = bv;
      else chosen = av || bv || !!(previous && previous.shared.includes(m.a));
      if (chosen) shared.push(m.a);
    });
    function projected(source, side) {
      var out = source.filter(function (id) {
        var m = MAP.find(function (entry) { return entry[side] === id; });
        return !m || shared.includes(m.a);
      });
      MAP.forEach(function (m) { if (shared.includes(m.a) && !out.includes(m[side])) out.push(m[side]); });
      return out;
    }
    var nextA = a === null ? null : copy(a);
    if (nextA) nextA.selections.real = projected(aIds, 'a');
    var nextB = projected(bIds, 'b');
    function unknown(source, side) { return source.filter(function (id) { return !MAP.some(function (m) { return m[side] === id; }); }); }
    var archive = {
      a: unique((previous ? previous.unmappedArchive.a : []).concat(unknown(aIds, 'a'))),
      b: unique((previous ? previous.unmappedArchive.b : []).concat(unknown(bIds, 'b')))
    };
    if (archive.a.length || archive.b.length) warnings.push('Unmapped interests remain separate; no tariff or eligibility has been inferred.');
    return {
      aState: nextA, bList: nextB,
      bridgeState: { version: 1, mapVersion: MAP_VERSION, shared: shared, unmappedArchive: archive,
        snapshot: { a: nextA ? nextA.selections.real.filter(function (id) { return MAP.some(function (m) { return m.a === id; }); }) : null,
          b: nextB.filter(function (id) { return MAP.some(function (m) { return m.b === id; }); }) } },
      warnings: warnings
    };
  }
  function sync(storage, options) {
    options = options || {};
    var before = {}, written = [], result;
    try {
      if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function' || typeof storage.removeItem !== 'function') throw new TypeError('Storage unavailable.');
      Object.keys(KEYS).forEach(function (side) { before[side] = storage.getItem(KEYS[side]); });
      function parse(side) { return before[side] === null ? null : JSON.parse(before[side]); }
      var a = parse('a'), b = parse('b'), bridge = parse('bridge');
      // JSON null is corrupted native storage, not a genuinely absent key.
      if (before.a !== null && a === null || before.b !== null && b === null || before.bridge !== null && bridge === null) throw new TypeError('Stored null is not a valid state.');
      if (a === null && typeof options.createAState === 'function') {
        a = options.createAState();
        if (!aValid(a)) throw new TypeError('createAState must return the existing A model emptyState().');
      }
      result = reconcile({ aState: a, bList: b, bridgeState: bridge });
      var values = { a: result.aState, b: result.bList, bridge: result.bridgeState };
      Object.keys(KEYS).forEach(function (side) {
        if (storage.getItem(KEYS[side]) !== before[side]) throw new Error('Storage changed during read; retry synchronization.');
      });
      // Bridge snapshot commits last. On failure restore only our still-matching writes.
      ['a', 'b', 'bridge'].forEach(function (side) {
        if (values[side] === null || (side === 'b' && before.b === null && !values.b.length)) return;
        var raw = JSON.stringify(values[side]);
        if (before[side] !== null && raw === JSON.stringify(JSON.parse(before[side]))) return;
        written.push({ side: side, raw: raw });
        storage.setItem(KEYS[side], raw);
        if (storage.getItem(KEYS[side]) !== raw) throw new Error('Storage write did not persist.');
      });
      return { ok: true, changedKeys: written.map(function (w) { return KEYS[w.side]; }), warnings: result.warnings, state: result.bridgeState };
    } catch (error) {
      var rollbackFailed = [];
      written.reverse().forEach(function (w) {
        try {
          if (storage.getItem(KEYS[w.side]) !== w.raw) return;
          if (before[w.side] === null) storage.removeItem(KEYS[w.side]); else storage.setItem(KEYS[w.side], before[w.side]);
          if (storage.getItem(KEYS[w.side]) !== before[w.side]) rollbackFailed.push(KEYS[w.side]);
        } catch (_) { rollbackFailed.push(KEYS[w.side]); }
      });
      return { ok: false, error: String(error.message || error), rollbackFailed: rollbackFailed, warnings: ['No successful synchronization; keep the original selection available.'] };
    }
  }
  return Object.freeze({ KEYS: KEYS, MAP: MAP, reconcile: reconcile, sync: sync });
}));
