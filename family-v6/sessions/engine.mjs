// Local demonstration only. This engine does not reserve inventory or charge money.
export const EVENTS = Object.freeze([
  Object.freeze({ id: 'show', mode: 'seated', titleKey: 'showTitle', descriptionKey: 'showDesc', duration: 50, price: 3500, image: 'events-780.webp' }),
  Object.freeze({ id: 'garden', mode: 'capacity', titleKey: 'gardenTitle', descriptionKey: 'gardenDesc', duration: 60, price: 2500, image: 'koleso-780.webp' }),
]);
export const SESSIONS = Object.freeze([
  Object.freeze({ id: 'show-1', eventId: 'show', at: '2026-10-24T17:00:00+04:00', capacity: 48 }),
  Object.freeze({ id: 'show-2', eventId: 'show', at: '2026-10-24T19:00:00+04:00', capacity: 48 }),
  Object.freeze({ id: 'show-3', eventId: 'show', at: '2026-10-25T17:00:00+04:00', capacity: 48 }),
  Object.freeze({ id: 'garden-1', eventId: 'garden', at: '2026-10-24T12:00:00+04:00', capacity: 24 }),
  Object.freeze({ id: 'garden-2', eventId: 'garden', at: '2026-10-25T12:00:00+04:00', capacity: 24 }),
]);
export const SEATS = Object.freeze('ABCDEF'.split('').flatMap(row => Array.from({ length: 8 }, (_, i) => `${row}${i + 1}`)));
export const HOLD_MS = 8 * 60 * 1000;
export const SCENARIOS = Object.freeze(['normal', 'soldout', 'shortage', 'separated', 'closed', 'declined', 'security', 'unknown', 'pending']);
const PHASES = ['select', 'payment', 'processing', 'declined', 'security', 'unknown', 'pending', 'issued', 'expired'];
const LOCKED = ['processing', 'security', 'unknown', 'pending', 'issued'];
const NORMAL_SOLD = ['A1', 'A2', 'A7', 'A8', 'B3', 'B4', 'C6', 'D2', 'D3', 'E7', 'F7', 'F8'];
const EDIT_ACTIONS = ['EVENT', 'SESSION', 'QTY', 'SEAT', 'AUTO', 'EMAIL', 'HOLD', 'CONTINUE', 'PAY', 'BACK'];
const ACTIONS = ['LANG', ...EDIT_ACTIONS, 'SCENARIO', 'RESOLVE', 'CHECK', 'ISSUE', 'RETRY', 'RENEW', 'NEW', 'RESET', 'EXPIRE', 'RECONCILE_NO_CHARGE'];
const errorKeys = ['needSession', 'notEnough', 'needSeats', 'emailError', 'closedMessage', 'expiredMessage', 'lockedOrder'];

export function defaultState() {
  return { version: 1, lang: 'ru', eventId: null, sessionId: null, qty: 2, seats: [], seatMode: 'auto', phase: 'select', scenario: 'normal', email: '', holdUntil: null, orderId: null, attempts: 0, error: null, log: [], orderSeq: 0 };
}
const eventOf = state => EVENTS.find(event => event.id === state.eventId);
const sessionOf = state => SESSIONS.find(session => session.id === state.sessionId && session.eventId === state.eventId);
const inventoryScenario = state => state.sessionId === `${state.eventId}-1` ? state.scenario : 'normal';
const copy = state => ({ ...state, seats: [...state.seats], log: state.log.map(entry => ({ ...entry })) });
const validEmail = value => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export function isClosed(state) { return Boolean(sessionOf(state)) && inventoryScenario(state) === 'closed'; }

export function availability(state) {
  const session = sessionOf(state);
  if (!session) return { remaining: 0, sold: [], adjacent: [] };
  const seated = eventOf(state)?.mode === 'seated';
  const scenario = inventoryScenario(state);
  let sold = seated ? [...NORMAL_SOLD] : [];
  let remaining = seated ? SEATS.length - sold.length : session.capacity - 6;
  if (scenario === 'soldout') { remaining = 0; sold = seated ? [...SEATS] : []; }
  if (scenario === 'shortage') { remaining = 1; sold = seated ? SEATS.filter(seat => seat !== 'A3') : []; }
  if (scenario === 'separated' && seated) {
    sold = SEATS.filter(seat => Number(seat.slice(1)) % 2 === 0);
    remaining = SEATS.length - sold.length;
  }
  const adjacent = [];
  if (seated) {
    const occupied = new Set(sold);
    for (const row of 'ABCDEF') {
      for (let column = 1; column <= 9 - state.qty; column++) {
        const group = Array.from({ length: state.qty }, (_, offset) => `${row}${column + offset}`);
        if (group.every(seat => !occupied.has(seat))) { adjacent.push(...group); break; }
      }
      if (adjacent.length) break;
    }
  }
  return { remaining, sold, adjacent };
}

export function total(state) { return (eventOf(state)?.price ?? 0) * state.qty; }

function selectionError(state, requireEmail = true) {
  if (!sessionOf(state)) return 'needSession';
  if (isClosed(state)) return 'closedMessage';
  const stock = availability(state);
  if (stock.remaining < state.qty) return 'notEnough';
  if (eventOf(state)?.mode === 'seated' && (state.seats.length !== state.qty || new Set(state.seats).size !== state.qty || state.seats.some(seat => !SEATS.includes(seat) || stock.sold.includes(seat)))) return 'needSeats';
  if (requireEmail && !validEmail(state.email)) return 'emailError';
  return null;
}

export function canContinue(state) { return state.phase === 'select' && selectionError(state) === null; }
// A quiz answer may reserve the complete group before a contact is entered.
// This does not authorize payment: PAY validates the contact separately.
export function canHold(state) { return state.phase === 'select' && selectionError(state, false) === null; }

function chooseSeats(state) {
  const stock = availability(state);
  state.seats = eventOf(state)?.mode !== 'seated' ? [] : state.seatMode === 'auto' ? stock.adjacent : state.seats.filter(seat => !stock.sold.includes(seat)).slice(0, state.qty);
  return state;
}

function release(state, changed = true) {
  state.phase = 'select'; state.holdUntil = null; state.error = null;
  if (changed) { state.orderId = null; state.attempts = 0; }
  return state;
}

export function tick(state, now = Date.now()) {
  const next = copy(state);
  if (['payment', 'declined'].includes(next.phase) && (!Number.isFinite(next.holdUntil) || now >= next.holdUntil)) {
    next.phase = 'expired'; next.holdUntil = null; next.error = 'expiredMessage';
    next.log = [...next.log, { action: 'EXPIRED', at: now }].slice(-80);
  }
  return next;
}

export function reduce(state, action, now = Date.now()) {
  if (!action || !ACTIONS.includes(action.type) || !Number.isFinite(now)) return copy(state);
  let next = tick(state, now);
  const record = () => { next.log = [...next.log, { action: action.type, at: now }].slice(-80); return next; };
  if (LOCKED.includes(next.phase) && EDIT_ACTIONS.includes(action.type)) { next.error = 'lockedOrder'; return record(); }
  switch (action.type) {
    case 'LANG':
      if (['ru', 'hy', 'en'].includes(action.value)) next.lang = action.value;
      break;
    case 'EVENT':
      if (!EVENTS.some(event => event.id === action.value)) break;
      if (next.eventId === action.value) break;
      release(next); next.eventId = action.value; next.sessionId = null; next.seats = []; next.seatMode = 'auto';
      break;
    case 'SESSION': {
      const session = SESSIONS.find(item => item.id === action.value && item.eventId === next.eventId);
      if (!session || next.sessionId === session.id) break;
      release(next); next.sessionId = session.id; next.seats = []; chooseSeats(next);
      break;
    }
    case 'QTY': {
      const value = Number(action.value);
      if (!Number.isFinite(value)) break;
      const qty = Math.min(8, Math.max(1, Math.trunc(value)));
      if (qty === next.qty) break;
      release(next); next.qty = qty; chooseSeats(next);
      break;
    }
    case 'SEAT': {
      if (!sessionOf(next) || eventOf(next)?.mode !== 'seated' || !SEATS.includes(action.value) || availability(next).sold.includes(action.value)) break;
      const existing = next.seats.includes(action.value);
      if (!existing && next.seats.length >= next.qty) break;
      release(next); next.seatMode = 'manual';
      next.seats = existing ? next.seats.filter(seat => seat !== action.value) : [...next.seats, action.value];
      break;
    }
    case 'AUTO':
      release(next, next.seatMode !== 'auto' || next.seats.join() !== availability(next).adjacent.join());
      next.seatMode = 'auto'; chooseSeats(next);
      break;
    case 'EMAIL':
      if (typeof action.value !== 'string') break;
      next.email = action.value.slice(0, 254); next.error = null;
      break;
    case 'SCENARIO':
      if (next.phase !== 'select' || !SCENARIOS.includes(action.value)) break;
      release(next); next.scenario = action.value; chooseSeats(next);
      break;
    case 'HOLD':
    case 'CONTINUE':
      if (next.phase !== 'select') break;
      next.error = selectionError(next, action.type === 'CONTINUE');
      if (next.error) break;
      if (!next.orderId) { next.orderSeq += 1; next.orderId = `demo-${next.orderSeq}`; }
      next.phase = 'payment'; next.holdUntil = now + HOLD_MS;
      break;
    case 'PAY':
      if (!['payment', 'declined'].includes(next.phase)) break;
      next.error = selectionError(next);
      if (next.error) break;
      next.phase = 'processing'; next.attempts += 1; next.error = null;
      break;
    case 'RESOLVE':
      if (next.phase !== 'processing') break;
      next.phase = next.scenario === 'declined' && next.attempts >= 2 ? 'issued' : ['declined', 'security', 'unknown', 'pending'].includes(next.scenario) ? next.scenario : 'issued';
      next.error = null;
      // A decline after hold expiry still needs a new inventory check before retry.
      next = tick(next, now);
      break;
    case 'CHECK':
      if (next.phase === 'unknown') { next.phase = 'pending'; next.error = null; }
      break;
    case 'RECONCILE_NO_CHARGE':
      if (next.phase === 'unknown') { next.phase = 'declined'; next.error = null; next = tick(next, now); }
      break;
    case 'ISSUE':
      if (next.phase === 'pending') { next.phase = 'issued'; next.error = null; }
      break;
    case 'RETRY':
      if (next.phase === 'declined') { next.phase = 'payment'; next.error = null; }
      break;
    case 'BACK':
      if (['payment', 'declined'].includes(next.phase)) release(next, false);
      break;
    case 'RENEW':
      if (next.phase === 'expired') { release(next); chooseSeats(next); }
      break;
    case 'NEW':
      if (['processing', 'unknown', 'pending', 'security'].includes(next.phase)) { next.error = 'lockedOrder'; break; }
      next = { ...defaultState(), lang: next.lang, email: next.email, qty: next.qty, orderSeq: next.orderSeq, log: next.log };
      break;
    case 'RESET':
      next = { ...defaultState(), lang: next.lang };
      break;
    case 'EXPIRE':
      if (['payment', 'declined'].includes(next.phase)) { next.holdUntil = now - 1; next = tick(next, now); }
      break;
  }
  return record();
}

export function restore(raw, now = Date.now()) {
  let value;
  try { value = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return defaultState(); }
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1) return defaultState();
  if (!['ru', 'hy', 'en'].includes(value.lang) || !PHASES.includes(value.phase) || !SCENARIOS.includes(value.scenario) || !['auto', 'manual'].includes(value.seatMode)) return defaultState();
  if (!Number.isInteger(value.qty) || value.qty < 1 || value.qty > 8 || !Array.isArray(value.seats) || value.seats.length > value.qty || new Set(value.seats).size !== value.seats.length || value.seats.some(seat => !SEATS.includes(seat))) return defaultState();
  if (!(value.eventId === null || EVENTS.some(event => event.id === value.eventId)) || !(value.sessionId === null || sessionOf(value))) return defaultState();
  if ((!value.eventId || !value.sessionId || eventOf(value)?.mode === 'capacity') && value.seats.length) return defaultState();
  if (typeof value.email !== 'string' || value.email.length > 254 || !Number.isInteger(value.attempts) || value.attempts < 0 || !Number.isSafeInteger(value.orderSeq) || value.orderSeq < 0) return defaultState();
  if (!(value.holdUntil === null || Number.isFinite(value.holdUntil))) return defaultState();
  if (!(value.orderId === null || /^demo-[1-9]\d*$/.test(value.orderId) && Number(value.orderId.slice(5)) <= value.orderSeq)) return defaultState();
  // A hold can exist before contact entry. Expiry must preserve this unfinished
  // entry too; attempted/charged orders still need a valid contact on restore.
  if (value.phase !== 'select' && (!value.orderId || selectionError(value, !['payment', 'expired'].includes(value.phase)))) return defaultState();
  if (['payment', 'processing', 'declined', 'unknown', 'security', 'pending', 'issued'].includes(value.phase) && !Number.isFinite(value.holdUntil)) return defaultState();
  if (['processing', 'declined', 'unknown', 'security', 'pending', 'issued'].includes(value.phase) && value.attempts < 1) return defaultState();
  if (value.phase === 'select' && value.holdUntil !== null) return defaultState();
  const next = Object.fromEntries(Object.keys(defaultState()).map(key => [key, value[key]]));
  next.error = errorKeys.includes(value.error) ? value.error : null;
  next.log = Array.isArray(value.log) ? value.log.filter(entry => entry && typeof entry === 'object' && (ACTIONS.includes(entry.action) || ['EXPIRED', 'RESTORE_UNKNOWN'].includes(entry.action)) && Number.isFinite(entry.at)).slice(-80).map(entry => ({ action: entry.action, at: entry.at })) : [];
  // Reload loses the asynchronous response. Reconcile the existing order instead of
  // hanging in processing or assuming it is safe to charge the customer again.
  if (next.phase === 'processing') {
    next.phase = 'unknown'; next.error = null;
    next.log = [...next.log, { action: 'RESTORE_UNKNOWN', at: now }].slice(-80);
  }
  return tick(copy(next), now);
}
