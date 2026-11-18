import {resolveBookingSession, resolveSession, scheduleAnchor} from './schedule.mjs?vpv=64dfbdf9e92c38b1';
import {attachInventory} from './store.mjs?vpv=d98d64a94388964b';
import {EVENTS, availability, reduce, restore} from './engine.mjs?vpv=b14dea083c7a7f8f';

// A completed ticket is a separate immutable snapshot, never the editable order.
export function issuedSnapshot(raw, now = Date.now()) {
  const state = restore(raw, now);
  return state.phase === 'issued' ? structuredClone(state) : null;
}

export function bookingQuery(query) {
  const result = new URLSearchParams(query);
  const id = result.get('session');
  const session = resolveBookingSession(id, scheduleAnchor(result.get('asof')));
  result.delete('asof');
  if (session && session.id !== id) result.set('session', session.id);
  return result;
}

export function startsNewBooking(state, query) {
  if (state.phase !== 'issued' || query.get('resume')) return false;
  const requested = resolveSession(query.get('session'));
  if (requested) return requested.id !== state.sessionId || query.get('book') === '1';
  if (query.has('session')) return false;
  const event = EVENTS.find(item => item.id === query.get('event'));
  return Boolean(event && (event.id !== state.eventId || query.get('book') === '1'));
}

// Opening a saved ticket always remains read-only. An explicit purchase link starts
// a new order in the active view, anchored to the issued party for nearby seats.
export function existingAdditionalView(record, state, query) {
  const id = query.get('additional');
  if (query.get('book') !== '1' || !id || state.phase === 'issued' || !state.eventId) return null;
  const order = record.orders.find(o => o.id === id && o.phase === 'issued' && o.sessionId === query.get('session'));
  if (!order) return null;
  return state.additionalTo === id ? 'active' : 'archive';
}
export function additionalDraft(record, state, query) {
  if (query.get('book') !== '1' || query.has('resume')) return null;
  const id = query.get('additional') || (state.phase === 'issued' ? state.orderId : null);
  const order = record.orders.find(o => o.id === id && o.phase === 'issued' && o.sessionId === query.get('session'));
  if (!order || (state.phase !== 'issued' && state.eventId)) return null;
  let next = reduce(state, {type:'NEW'});
  next.additionalTo = order.id;
  attachInventory(next, record.orders);
  next = reduce(next, {type:'QTY', value:query.get('qty') || 1});
  next = reduce(next, {type:'EVENT', value:order.eventId});
  return reduce(next, {type:'SESSION', value:order.sessionId});
}

const moreLabel = {ru:'Купить ещё на этот сеанс', hy:'Գնել ևս մեկ տոմս այս սեանսի համար', en:'Buy more tickets for this session'};
export function additionalLink(record, state) {
  if (state.phase !== 'issued' || !record || Date.parse(resolveSession(state.sessionId)?.at) <= Date.now()) return '';
  if (record.state.phase !== 'issued' && record.state.eventId && record.state.additionalTo !== state.orderId) return '';
  if (!availability(attachInventory({...state}, record.orders)).remaining) return '';
  const query = new URLSearchParams({lang:state.lang,event:state.eventId,session:state.sessionId,book:'1',additional:state.orderId});
  return `<a class="btn secondary" data-additional-booking href="?${query}">${moreLabel[state.lang]}</a>`;
}

// Never restore a map draft belonging to another event, session or group size.
export function mapSnapshotFor(raw, current, now = Date.now()) {
  if (!raw || ['processing', 'unknown', 'pending', 'security', 'issued'].includes(current.phase)) return null;
  const snapshot = restore(raw, now);
  if (!['select', 'payment', 'expired'].includes(snapshot.phase)) return null;
  if (snapshot.eventId !== current.eventId || snapshot.sessionId !== current.sessionId || snapshot.qty !== current.qty) return null;
  // Cancelling seats must not undo a language preference changed in the map.
  return {...snapshot, lang: current.lang, ...(current.issuedInventory ? {issuedInventory:current.issuedInventory} : {})};
}
