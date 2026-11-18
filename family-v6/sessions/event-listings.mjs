import {upcomingSessions, resolveBookingSession, scheduleAnchor} from './schedule.mjs?vpv=64dfbdf9e92c38b1';

const copy = {
  ru: {next: 'Ближайший сеанс', buy: 'Купить билеты', on: 'Купить билеты на', closed: 'Этот сеанс недоступен. Выберите другую дату.'},
  hy: {next: 'Մոտակա սեանսը', buy: 'Գնել տոմսեր', on: 'Գնել տոմսեր՝', closed: 'Այս սեանսը հասանելի չէ։ Ընտրեք այլ ամսաթիվ։'},
  en: {next: 'Next session', buy: 'Buy tickets', on: 'Buy tickets for', closed: 'This session is unavailable. Please choose another date.'},
};
const lang = document.documentElement.lang;
const words = copy[lang] || copy.en;
const format = new Intl.DateTimeFormat(({en:'en-GB', hy:'hy-AM', ru:'ru-RU'})[lang], {
  timeZone: 'Asia/Yerevan', day: 'numeric', month: 'long',
});
// Some mobile Chromium builds omit Armenian from Intl's bundled locales.
const armenianMonths = ['հունվարի','փետրվարի','մարտի','ապրիլի','մայիսի','հունիսի','հուլիսի','օգոստոսի','սեպտեմբերի','հոկտեմբերի','նոյեմբերի','դեկտեմբերի'];
function dateLabel(session) {
  if (lang === 'hy') {
    const month = Number(session.at.slice(5, 7)), day = Number(session.at.slice(8, 10));
    return day + ' ' + armenianMonths[month - 1];
  }
  return format.format(new Date(session.at));
}
const when = session => dateLabel(session) + ', ' + session.at.slice(11, 16);

function updateCard(article, sessions) {
  const next = sessions.find(item => item.eventId === article.dataset.sessionCard);
  if (!next) return;
  const date = article.querySelector('[data-next-date]');
  date.dateTime = next.at;
  date.textContent = words.next + ' · ' + when(next);
  const link = article.querySelector('[data-next-booking]');
  if (link) {
    const url = new URL(link.href);
    url.searchParams.set('session', next.id);
    link.href = url;
  }
}

function setupPicker(form) {
  const choices = form.querySelector('.vp-session-choices');
  const buttons = new Map([...choices.querySelectorAll('input[type=radio]')].map(input => [Number(input.dataset.slot), input]));
  const submit = form.querySelector('[type=submit]');
  const message = form.querySelector('[data-unavailable]');
  const params = new URLSearchParams(location.search);
  const requested = params.get('session');
  const renderedAt = scheduleAnchor(form.elements.asof.value);
  let initialized = false;
  // Quantity and review options may accompany a guest returning from checkout.
  for (const key of ['qty', 'review', 'single']) {
    const value = params.get(key);
    if (!(key === 'qty' ? /^[1-8]$/.test(value || '') : value === '1')) continue;
    const hidden = document.createElement('input');
    hidden.type = 'hidden'; hidden.name = key; hidden.value = value;
    form.append(hidden);
  }
  function label() {
    const selected = choices.querySelector('input:checked');
    const session = selected && resolveBookingSession(selected.value, renderedAt);
    submit.textContent = session ? words.on + ' ' + when(session) : words.buy;
  }
  choices.addEventListener('change', () => {
    message.hidden = true;
    const url = new URL(location.href);
    url.searchParams.set('session', choices.querySelector('input:checked').value);
    history.replaceState(history.state, '', url);
    label();
  });
  return function update(sessions) {
    const previous = choices.querySelector('input:checked');
    // Preserve an early native choice or the exact date the guest last saw.
    const previousChoice = previous && resolveBookingSession(previous.value, renderedAt)?.id;
    const manualChoice = previous && !previous.defaultChecked;
    let items = sessions.filter(item => item.eventId === form.dataset.sessionEvent);
    if (params.get('single') === '1') items = items.slice(0, 1);
    const request = initialized || manualChoice ? previousChoice : requested ? resolveBookingSession(requested, scheduleAnchor(params.get('asof')))?.id : null;
    const wanted = request || (!initialized && !requested && !manualChoice ? items[0]?.id : null);
    for (const input of buttons.values()) {
      input.checked = false;
      input.disabled = true;
      input.closest('label').hidden = true;
    }
    for (const item of items) {
      const input = buttons.get(item.slot);
      const choice = input.closest('label');
      input.disabled = false;
      input.value = item.id;
      input.checked = item.id === wanted;
      choice.hidden = false;
      choice.querySelector('[data-choice-date]').textContent = dateLabel(item);
      choices.append(choice);
    }
    message.hidden = Boolean(choices.querySelector('input:checked'));
    label();
    initialized = true;
  };
}

const pickers = [...document.querySelectorAll('form[data-session-event]')].map(setupPicker);
function refresh() {
  const sessions = upcomingSessions();
  for (const card of document.querySelectorAll('[data-session-card]')) updateCard(card, sessions);
  for (const update of pickers) update(sessions);
}
refresh();
window.addEventListener('pageshow', event => { if (event.persisted) refresh(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
