import {EVENTS, availability, defaultState} from './engine.mjs?vpv=b14dea083c7a7f8f';
import {upcomingSessions} from './schedule.mjs?vpv=64dfbdf9e92c38b1';
import {attachInventory, read, STORAGE} from './store.mjs?vpv=d98d64a94388964b';

const copy = {
  ru: {
    show: 'Если хочется сесть рядом и слушать историю, подойдёт семейный спектакль с живой музыкой.',
    garden: 'Если хочется самим поучаствовать, на прогулке вас ждёт мастерская под открытым небом.',
    both: 'Можно пойти на любое из двух событий. Сравните время и выберите, что вам ближе.',
    age: 'Оба события рассчитаны на гостей от 6 лет. Если идёте все вместе с ребёнком младше шести, эти сеансы вашей семье не подойдут.',
    limit: 'Для девяти и более гостей билеты в один демозаказ оформить нельзя. Уточните в парке условия для вашей компании.',
    mismatch: 'Для выбранного впечатления в это время сеансов нет. Можно посмотреть другое событие с теми же условиями.',
    empty: 'В афише нет подходящего сеанса на выбранные день и время. Можно изменить условия или посмотреть расписание.',
    stock: 'На подходящих сеансах не хватает билетов для всей вашей компании.',
    only: {show:'По вашим условиям подходит спектакль. Выберите сеанс ниже.', garden:'По вашим условиям подходит творческая прогулка. Выберите сеанс ниже.'},
    total: (n, amount) => n + ' ' + (n === 1 ? 'гость' : n <= 4 ? 'гостя' : 'гостей') + ' · итого ' + amount,
    details: 'Об этом событии', soldOut: 'На ближайшие сеансы билетов уже нет.', buy: 'Купить билеты', other: 'Ещё сеансы', times: 'Выберите сеанс',
  },
  hy: {
    show: 'Եթե ուզում եք միասին նստել ու պատմություն լսել, ընտրեք կենդանի երաժշտությամբ ընտանեկան ներկայացումը։',
    garden: 'Եթե ուզում եք ինքներդ մասնակցել, զբոսանքի ընթացքում ձեզ սպասում է բացօթյա ստեղծագործական աշխատարան։',
    both: 'Երկու միջոցառումներն էլ կարող են ձեզ հետաքրքրել։ Համեմատեք ժամերը և ընտրեք ձեր նախընտրածը։',
    age: 'Երկու միջոցառումներն էլ նախատեսված են 6 տարեկան և ավելի մեծ հյուրերի համար։ Եթե ձեզ հետ կա մինչև 6 տարեկան երեխա, ամբողջ ընտանիքով չեք կարող մասնակցել։',
    limit: 'Մեկ ցուցադրական պատվերով առավելագույնը ութ հյուրի տոմս կարող եք գնել։ Ավելի մեծ խմբի պայմանները ճշտեք այգում։',
    mismatch: 'Ընտրված միջոցառումն այս ժամին սեանս չունի։ Նույն պայմաններով կարող եք դիտել մյուս միջոցառումը։',
    empty: 'Ընտրված օրվա և ժամի համար հարմար սեանս չկա։ Կարող եք փոխել պայմանները կամ դիտել ժամանակացույցը։',
    stock: 'Հարմար սեանսներում ամբողջ խմբի համար բավարար տոմսեր չկան։',
    only: {show:'Ձեր պայմաններին համապատասխանում է ներկայացումը։ Ստորև ընտրեք սեանսը։', garden:'Ձեր պայմաններին համապատասխանում է ստեղծագործական զբոսանքը։ Ստորև ընտրեք սեանսը։'},
    total: (n, amount) => n + ' հյուր · ընդհանուր՝ ' + amount,
    details: 'Միջոցառման մասին', soldOut: 'Մոտակա սեանսների տոմսերն ավարտվել են։', buy: 'Գնել տոմսեր', other: 'Այլ սեանսներ', times: 'Ընտրեք սեանսը',
  },
  en: {
    show: 'For a story you can sit back and enjoy together, choose the family show with live music.',
    garden: 'For a chance to take part together, the walk includes an outdoor workshop.',
    both: 'Either experience could suit you. Compare the times and choose your favourite.',
    age: 'Both events are for ages 6 and up. If a younger child is coming, the whole family cannot attend either event together.',
    limit: 'A demo order can include up to eight guests. For a larger group, check arrangements with the park.',
    mismatch: 'There are no performances of your chosen event at that time. The other event has a session that fits.',
    empty: 'There are no sessions for the day and time you chose. Try another time or view the schedule.',
    stock: 'No matching session has enough tickets for your whole group.',
    only: {show:'The family show fits your selection. Choose a session below.', garden:'The creative walk fits your selection. Choose a session below.'},
    total: (n, amount) => n + (n === 1 ? ' guest' : ' guests') + ' · total ' + amount,
    details: 'About this event', soldOut: 'No tickets remain for the upcoming sessions.', buy: 'Buy tickets', other: 'More sessions', times: 'Choose a session',
  }
};
const lang = Object.hasOwn(copy, document.documentElement.lang) ? document.documentElement.lang : 'en';
const t = copy[lang];
const locale = {ru:'ru-RU', hy:'hy-AM', en:'en-GB'}[lang];
const armenianMonths = ['հունվարի','փետրվարի','մարտի','ապրիլի','մայիսի','հունիսի','հուլիսի','օգոստոսի','սեպտեմբերի','հոկտեմբերի','նոյեմբերի','դեկտեմբերի'];
const armenianWeekdays = ['Կիր','Երկ','Երք','Չրք','Հնգ','Ուրբ','Շբթ'];
const dateFormat = new Intl.DateTimeFormat(locale, {weekday:'short', day:'numeric', month:'short', timeZone:'Asia/Yerevan'});
const panel = document.querySelector('[data-discovery]');
const cards = [...document.querySelectorAll('.vp-session-catalog [data-session-card]')];
const homeCards = [...document.querySelectorAll('#park-events [data-session-card]')];
const filterNames = ['day','hour','party','under6'];
const wishes = ['show','garden','both'];
let wish = '';
let inventory = attachInventory(defaultState(), []);

function dateLabel(session) {
  const day = new Date(session.at.slice(0,10) + 'T12:00:00Z');
  if (lang === 'hy') return armenianWeekdays[day.getUTCDay()] + ', ' + day.getUTCDate() + ' ' + armenianMonths[day.getUTCMonth()];
  return dateFormat.format(day);
}

function bookingLink(item, party) {
  const url = new URL('./form.html', import.meta.url);
  url.search = new URLSearchParams({lang, event:item.eventId, session:item.id, book:'1', from:'discovery'});
  if (party) url.searchParams.set('qty', party);
  const revision = new URL(location.href).searchParams.get('vp_release');
  if (revision) url.searchParams.set('vp_release', revision);
  return url.href;
}

function slotLink(item, party, title) {
  const a = document.createElement('a');
  a.className = 'discovery-slot';
  a.href = bookingLink(item, party);
  a.textContent = dateLabel(item) + ' · ' + item.at.slice(11,16);
  a.setAttribute('aria-label', [t.buy, title, a.textContent].join(', '));
  return a;
}

function fitsCapacity(item, party) {
  const state = {...inventory, eventId:item.eventId, sessionId:item.id};
  return availability(state).remaining >= (Number(party) || 1);
}

function filter(name) {
  return panel.querySelector('[name="' + name + '"]');
}

function restoreFilters() {
  const params = new URL(location.href).searchParams;
  wish = wishes.includes(params.get('wish')) ? params.get('wish') : '';
  for (const name of filterNames) {
    const el = filter(name);
    if (name === 'under6') el.checked = params.get(name) === '1';
    else el.value = params.get(name) || '';
  }
  if (filterNames.some(name => name === 'under6' ? filter(name).checked : filter(name).value)) panel.querySelector('details').open = true;
}

function saveFilters() {
  const url = new URL(location.href);
  for (const [key,value] of [['wish',wish],...filterNames.map(name => [name, name === 'under6' ? (filter(name).checked ? '1' : '') : filter(name).value])]) {
    if (value) url.searchParams.set(key,value);
    else url.searchParams.delete(key);
  }
  history.replaceState(history.state, '', url);
}

function renderProgramme() {
  const day = filter('day').value, hour = filter('hour').value, party = filter('party').value;
  const under6 = filter('under6').checked, oversized = party === '9+';
  const blocked = under6 || oversized;
  const interested = EVENTS.map(event => event.id).filter(id => !wish || wish === 'both' || wish === id);
  const timed = upcomingSessions().filter(item => (!day || item.at.startsWith(day)) && (!hour || item.at.slice(11,16) === hour));
  const eligible = timed.filter(item => fitsCapacity(item, party));
  const matches = blocked ? [] : eligible.filter(item => interested.includes(item.eventId));
  const canCompare = !blocked && !matches.length && eligible.length > 0;
  const matchingEvents = [...new Set(matches.map(item => item.eventId))];
  let status = t[wish] || '';
  if ((!wish || wish === 'both') && matchingEvents.length === 1) status = t.only[matchingEvents[0]];
  if (under6) status = t.age;
  else if (oversized) status = t.limit;
  else if (canCompare) status = t.mismatch;
  else if (!matches.length) status = timed.some(item => interested.includes(item.eventId)) ? t.stock : t.empty;

  const live = panel.querySelector('[data-discovery-status]');
  if (live.textContent !== status) live.textContent = status;
  live.hidden = !status;
  for (const button of panel.querySelectorAll('[data-wish]')) button.setAttribute('aria-pressed', String(button.dataset.wish === wish));
  panel.querySelector('[data-reset-filters]').hidden = !(day || hour || party || under6);
  panel.querySelector('[data-see-both]').hidden = !canCompare;

  for (const article of cards) {
    const event = EVENTS.find(candidate => candidate.id === article.dataset.sessionCard);
    const sessions = matches.filter(item => item.eventId === event.id);
    article.hidden = !sessions.length;
    if (article.hidden) continue;
    const nearest = article.querySelector('.vp-next-session');
    if (nearest) nearest.hidden = true;
    const value = article.querySelector('[data-family-total]');
    value.hidden = !party;
    value.textContent = party ? t.total(Number(party), new Intl.NumberFormat(locale).format(Number(party)*event.price) + ' ֏') : '';
    const links = article.querySelector('[data-session-links]');
    const title = article.querySelector('h2').textContent;
    const previous = links.contains(document.activeElement) ? document.activeElement.href : null;
    links.replaceChildren(...sessions.map(item => slotLink(item, party, title)));
    links.hidden = false;
    if (!links.hasAttribute('aria-label')) links.setAttribute('aria-label', t.times);
    const detail = article.querySelector('a[data-vp-cta]');
    if (detail) {
      detail.textContent = t.details;
      const url = new URL(detail.href);
      if (party) url.searchParams.set('qty',party); else url.searchParams.delete('qty');
      if (day || hour) url.searchParams.set('session',sessions[0].id); else url.searchParams.delete('session');
      detail.href = url.href;
    }
    if (previous) [...links.children].find(a => a.href === previous)?.focus({preventScroll:true});
  }
}

function renderHome() {
  const programme = upcomingSessions();
  for (const article of homeCards) {
    const available = programme.filter(item => item.eventId === article.dataset.sessionCard && fitsCapacity(item, ''));
    const next = article.querySelector('[data-next-booking]');
    const title = article.querySelector('h3').textContent;
    // Existing fallback also works before either module has loaded.
    if (!next) continue;
    article.dataset.discoveryHomeReady = '';
    if (!available.length) {
      next.removeAttribute('href');
      next.setAttribute('aria-disabled', 'true');
      next.textContent = t.soldOut;
      const group = article.querySelector('[data-home-other-sessions]');
      if (group) group.hidden = true;
      const when = article.querySelector('[data-next-date]');
      if (when) { when.textContent = ''; when.removeAttribute('datetime'); }
      continue;
    }
    next.removeAttribute('aria-disabled');
    const first = available[0];
    next.href = bookingLink(first, '');
    const when = dateLabel(first) + ' · ' + first.at.slice(11,16);
    next.textContent = t.buy + ' · ' + first.at.slice(11,16);
    next.setAttribute('aria-label', [t.buy,title,when].join(', '));
    const time = article.querySelector('[data-next-date]');
    if (time) { time.dateTime = first.at; time.textContent = when; }
    let other = article.querySelector('[data-home-other-sessions]');
    if (!other) {
      other = document.createElement('div');
      other.dataset.homeOtherSessions = '';
      other.className = 'discovery-other-times';
      article.append(other);
    }
    const label = document.createElement('span'); label.className = 'discovery-times-title'; label.textContent = t.other;
    other.replaceChildren(label, ...available.slice(1).map(item => slotLink(item, '', title)));
    other.hidden = available.length < 2;
  }
}

function render() {
  if (panel) {
    renderProgramme();
    panel.hidden = false;
  }
  if (homeCards.length) renderHome();
}

async function refresh() {
  render();
  try { inventory = attachInventory(defaultState(), (await read()).orders); } catch { return; }
  render();
}

if (panel) {
  restoreFilters();
  panel.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-wish')) wish = button.dataset.wish;
    else if (button.hasAttribute('data-see-both')) wish = 'both';
    else if (button.hasAttribute('data-reset-filters')) {
      filter('under6').checked = false;
      for (const name of ['day','hour','party']) filter(name).value = '';
    } else return;
    saveFilters(); renderProgramme();
    if (button.hidden) panel.querySelector('[data-wish="' + (wish || 'both') + '"]').focus({preventScroll:true});
  });
  panel.addEventListener('change', event => {
    if (!filterNames.includes(event.target.name)) return;
    saveFilters(); renderProgramme();
  });
}
if (panel || homeCards.length) {
  refresh();
  window.addEventListener('pageshow', event => { if (event.persisted) { if (panel) restoreFilters(); refresh(); } });
  window.addEventListener('popstate', () => { if (panel) restoreFilters(); refresh(); });
  window.addEventListener('storage', event => { if (event.key === STORAGE) refresh(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
}
