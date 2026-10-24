import {EVENTS, SESSIONS, restore} from './engine.mjs?vpv=53adea77955e4349';

// A completed ticket is a separate immutable snapshot, never the editable order.
export function issuedSnapshot(raw, now = Date.now()) {
  const state = restore(raw, now);
  return state.phase === 'issued' ? structuredClone(state) : null;
}

// Only an explicit, valid destination may leave a completed order. Uncertain
// payments remain locked, and reopening the same destination keeps its ticket.
export function startsNewBooking(state, query, sessions = SESSIONS) {
  if (state.phase !== 'issued') return false;
  const requestedSession = sessions.find(item => item.id === query.get('session'));
  if (requestedSession) return requestedSession.id !== state.sessionId;
  if (query.has('session')) return false;
  const requestedEvent = EVENTS.find(item => item.id === query.get('event'));
  return Boolean(requestedEvent && requestedEvent.id !== state.eventId);
}

// Never restore a map draft belonging to another event, session or group size.
export function mapSnapshotFor(raw, current, now = Date.now()) {
  if (!raw || ['processing', 'unknown', 'pending', 'security', 'issued'].includes(current.phase)) return null;
  const snapshot = restore(raw, now);
  if (!['select', 'payment', 'expired'].includes(snapshot.phase)) return null;
  if (snapshot.eventId !== current.eventId || snapshot.sessionId !== current.sessionId || snapshot.qty !== current.qty) return null;
  // Cancelling seats must not undo a language preference changed in the map.
  return structuredClone({...snapshot, lang: current.lang});
}
