// The sample programme repeats on weekends in Yerevan (UTC+4, no clock changes).
// An occurrence's ID identifies its date permanently, including after it leaves the listings.
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const YEREVAN_OFFSET = 4 * HOUR;
const PROGRAMME = [
  {eventId: 'show', slot: 1, weekday: 6, hour: '17', capacity: 48, legacyDate: '2026-10-24'},
  {eventId: 'show', slot: 2, weekday: 6, hour: '19', capacity: 48, legacyDate: '2026-10-24'},
  {eventId: 'show', slot: 3, weekday: 0, hour: '17', capacity: 48, legacyDate: '2026-10-25'},
  {eventId: 'garden', slot: 1, weekday: 6, hour: '12', capacity: 24, legacyDate: '2026-10-24'},
  {eventId: 'garden', slot: 2, weekday: 0, hour: '12', capacity: 24, legacyDate: '2026-10-25'},
];

function occurrence(rule, date, id = rule.eventId + '-' + date + '-' + rule.hour + '00') {
  return {id, eventId: rule.eventId, slot: rule.slot, at: date + 'T' + rule.hour + ':00:00+04:00', capacity: rule.capacity};
}

export function upcomingSessions(now = Date.now()) {
  const today = Math.floor((Number(now) + YEREVAN_OFFSET) / DAY) * DAY;
  const weekday = new Date(today).getUTCDay();
  return PROGRAMME.map(rule => {
    let day = today + ((rule.weekday - weekday + 7) % 7) * DAY;
    if (day + Number(rule.hour) * HOUR - YEREVAN_OFFSET <= now) day += 7 * DAY;
    return occurrence(rule, new Date(day).toISOString().slice(0, 10));
  }).sort((a, b) => a.at.localeCompare(b.at));
}

export function resolveSession(id) {
  const legacy = PROGRAMME.find(rule => rule.eventId + '-' + rule.slot === id);
  if (legacy) return occurrence(legacy, legacy.legacyDate, id);
  const match = /^(show|garden)-(\d{4}-\d{2}-\d{2})-(12|17|19)00$/.exec(id || '');
  if (!match) return null;
  const [, eventId, date, hour] = match;
  const day = new Date(date + 'T00:00:00Z');
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== date) return null;
  const rule = PROGRAMME.find(item => item.eventId === eventId && item.hour === hour && item.weekday === day.getUTCDay());
  return rule ? occurrence(rule, date) : null;
}

// Native forms can be submitted before the calendar script has loaded.
// Resolve their weekday/time aliases once at entry and store the dated ID.
export function resolveBookingSession(id, now = Date.now()) {
  const next = /^next-(show|garden)-([123])$/.exec(id || '');
  if (!next) return resolveSession(id);
  return upcomingSessions(now).find(item => item.eventId === next[1] && item.slot === Number(next[2])) || null;
}
