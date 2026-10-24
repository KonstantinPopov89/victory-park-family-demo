/* Identity-only real-interest store and native projections.
 * Loading is side-effect free. journey-start owns entry/live UI notification.
 * v1 snapshots migrate; v2 canonical state changes only through explicit deltas.
 * Prototype builder aliases do not transfer prices, eligibility or photo rights.
 * Unknown IDs stay in their native namespace and recovery archive. Demo, party,
 * carts and orders are never mapped. sync commits/rolls back its own writes only.
 */
(function (root, factory) {
  'use strict';
  var api = factory(typeof module === 'object' && module.exports ? require('./shared-catalog.js') : root.VPSharedCatalog);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VPJourneyBridge = api;
}(typeof window === 'undefined' ? globalThis : window, function (catalog) {
  'use strict';
  var KEYS = Object.freeze({ a: 'vp.family.v6.people.v1', b: 'vpList', bridge: 'vp.journey.interests.v1' });
  // Identity-only crosswalk; exact source path/line/hash retained in QA provenance.
  var MAP = Object.freeze(catalog.entries.map(function (entry) { return Object.freeze({ a: entry.id, b: entry.slug, proof: entry.proof, sourceLine: entry.sourceLine, scope: 'identity-only' }); }));
  var MAP_VERSION = 'prototype-catalog-35-v2';
  var LEGACY_MAP = ['autodrom', 'pendulum', 'planet'];
  function record(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function ids(v) { return Array.isArray(v) && v.every(function (id) { return typeof id === 'string' && id.length > 0; }); }
  function unique(v) { return Array.from(new Set(v)); }
  function copy(v) { return JSON.parse(JSON.stringify(v)); }
  function aValid(v) { return record(v) && v.version === 3 && record(v.selections) && ids(v.selections.real); }
  function bridgeValid(v) {
    return record(v) && ((v.version === 1 && v.mapVersion === 'exact-id-name-v1') || (v.version === 2 && v.mapVersion === MAP_VERSION)) && ids(v.shared)
      && v.shared.every(function (id) { return MAP.some(function (m) { return m.a === id; }); })
      && record(v.snapshot) && (v.snapshot.a === null || ids(v.snapshot.a)) && (v.snapshot.b === null || ids(v.snapshot.b))
      && record(v.unmappedArchive) && ids(v.unmappedArchive.a) && ids(v.unmappedArchive.b)
      && (v.removed === undefined || ids(v.removed));
  }
  function reconcile(input) {
    input = input || {};
    var a = input.aState == null ? null : input.aState, b = input.bList == null ? null : input.bList;
    var previous = input.bridgeState == null ? null : input.bridgeState;
    if (a !== null && !aValid(a)) throw new TypeError('Invalid A state: native data must remain untouched.');
    if (b !== null && !ids(b)) throw new TypeError('Invalid B list: native data must remain untouched.');
    if (previous !== null && !bridgeValid(previous)) throw new TypeError('Invalid bridge state: preserve it for inspection.');
    ['a','b'].forEach(function(side){var intent=input.intents&&input.intents[side];if(intent&&(!ids(intent.before)||!ids(intent.after)))throw new TypeError('Invalid explicit interest delta.');});
    var aIds = a ? a.selections.real : [], bIds = b || [], warnings = [], shared = [];
    MAP.forEach(function (m) {
      var av = aIds.includes(m.a), bv = bIds.includes(m.b);
      var ai = input.intents && input.intents.a, bi = input.intents && input.intents.b;
      var tracked = previous && previous.version === 1 && LEGACY_MAP.includes(m.a);
      var ac = ai ? ai.before.includes(m.a) !== ai.after.includes(m.a) : tracked && a !== null && previous.snapshot.a !== null && av !== previous.snapshot.a.includes(m.a);
      var bc = bi ? bi.before.includes(m.b) !== bi.after.includes(m.b) : tracked && b !== null && previous.snapshot.b !== null && bv !== previous.snapshot.b.includes(m.b);
      if (ac) av = ai ? ai.after.includes(m.a) : av;
      if (bc) bv = bi ? bi.after.includes(m.b) : bv;
      var chosen;
      if (ac && bc) {
        chosen = av || bv;
        if (av !== bv) warnings.push('Conflicting edits retained interest: ' + m.a);
      } else if (ac) chosen = av;
      else if (bc) chosen = bv;
      else if (previous && previous.version === 2) chosen = previous.shared.includes(m.a);
      else if (previous && previous.removed && previous.removed.includes(m.a)) chosen = false;
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
    if (archive.a.length || archive.b.length) warnings.push('Unknown legacy interests are preserved in their native storage and recovery archive; no identity, tariff or eligibility is inferred.');
    return {
      aState: nextA, bList: nextB,
      bridgeState: { version: 2, mapVersion: MAP_VERSION, shared: shared, unmappedArchive: archive,
        removed: unique((previous && previous.removed || []).concat(previous ? previous.shared.filter(function(id){return !shared.includes(id);}) : [])).filter(function(id){return !shared.includes(id);}),
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
      // Validate persisted inputs before accepting a caller's explicit override.
      if(a !== null && !aValid(a) || b !== null && !ids(b) || bridge !== null && !bridgeValid(bridge))throw new TypeError('Invalid persisted interest data.');
      if(Object.prototype.hasOwnProperty.call(options,'aState')){
        var incoming=copy(options.aState), oldUnknown=a?a.selections.real.filter(function(id){return !MAP.some(function(m){return m.a===id;});}):[];
        if(!aValid(incoming))throw new TypeError('Invalid A state override.');
        var ai=options.intents&&options.intents.a;
        oldUnknown=oldUnknown.filter(function(id){return !(ai&&ai.before.includes(id)&&!ai.after.includes(id));});
        incoming.selections.real=unique(incoming.selections.real.concat(oldUnknown));a=incoming;
      }
      if(Object.prototype.hasOwnProperty.call(options,'bList'))b=options.bList;
      if (a === null && typeof options.createAState === 'function') {
        a = options.createAState();
        if (!aValid(a)) throw new TypeError('createAState must return the existing A model emptyState().');
      }
      result = reconcile({ aState: a, bList: b, bridgeState: bridge, intents: options.intents });
      var values = { a: result.aState, b: result.bList, bridge: result.bridgeState };
      Object.keys(KEYS).forEach(function (side) {
        if (storage.getItem(KEYS[side]) !== before[side]) throw new Error('Storage changed during read; retry synchronization.');
      });
      // Commit authority first so another tab never projects an older list over this edit.
      // On failure restore only our still-matching writes.
      ['bridge', 'a', 'b'].forEach(function (side) {
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
  function setList(storage, side, next, options) {
    options = options || {};
    if (!['a','b'].includes(side) || !ids(next)) return { ok:false, error:'Invalid interest selection.' };
    try {
      var value = storage.getItem(KEYS[side]), native = value === null ? null : JSON.parse(value);
      var before = options.before || (side === 'a' ? native && native.selections.real || [] : native || []);
      var intent = {}; intent[side] = { before:before, after:next };
      var syncOptions={createAState:options.createAState,intents:intent};
      if(side==='a'){native=native||(options.createAState&&options.createAState());if(!aValid(native))throw new TypeError('A state unavailable.');native.selections.real=unique(next);syncOptions.aState=native;}
      else syncOptions.bList=unique(next);
      return sync(storage,syncOptions);
    }catch(error){return {ok:false,error:String(error.message||error)};}
  }
  return Object.freeze({ setList:setList, KEYS: KEYS, MAP: MAP, MAP_VERSION: MAP_VERSION, reconcile: reconcile, sync: sync });
}));
