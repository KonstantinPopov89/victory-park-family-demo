import {EVENTS, defaultState, reduce} from './engine.mjs?vpv=b14dea083c7a7f8f';
import {resolveSession} from './schedule.mjs?vpv=64dfbdf9e92c38b1';
import {attachInventory} from './store.mjs?vpv=d98d64a94388964b';

const words = {
  ru: {
    choice: 'Ваш выбор в афише', guests: 'Гостей',
    busy: 'Сначала проверьте результат предыдущего заказа. После этого вы сможете оформить выбранный сеанс.',
    ready: 'Теперь можно перейти к выбранному сеансу.',
    open: 'Перейти к выбранному сеансу',
    invalid: 'Проверьте сеанс и количество гостей', invalidHelp: 'Выберите сеанс в афише. Один заказ может включать от 1 до 8 гостей.',
    programme: 'К афише'
  },
  en: {
    choice: 'Your selection from the programme', guests: 'Guests',
    busy: 'Check the status of your previous order first. You can then book the session you selected.',
    ready: 'You can now book the session you selected.',
    open: 'Continue to the selected session',
    invalid: 'Check the session and group size', invalidHelp: 'Choose a session from the programme. Each order can include 1 to 8 guests.',
    programme: 'Back to the programme'
  },
  hy: {
    choice: 'Ձեր ընտրած սեանսը', guests: 'Հյուրերի քանակը',
    busy: 'Նախ ստուգեք նախորդ պատվերի կարգավիճակը։ Դրանից հետո կարող եք ամրագրել ձեր ընտրած սեանսը։',
    ready: 'Այժմ կարող եք ամրագրել ձեր ընտրած սեանսը։',
    open: 'Անցնել ընտրված սեանսին',
    invalid: 'Ստուգեք սեանսը և հյուրերի քանակը', invalidHelp: 'Ընտրեք սեանսը միջոցառումների ծրագրից։ Մեկ պատվերով կարելի է ձևակերպել 1-ից 8 հյուրի տոմս։',
    programme: 'Դեպի ծրագիր'
  }
};

function selection(id, qty) {
  const session = resolveSession(id);
  if (!session || (qty !== null && !/^[1-8]$/.test(qty))) return null;
  return {session, qty: qty === null ? null : Number(qty)};
}

export function discoveryRequest(query) {
  if (query.get('from') !== 'discovery' || query.get('book') !== '1' || query.has('resume') || query.has('additional')) return null;
  const choice = selection(query.get('session'), query.get('qty'));
  return choice && choice.session.eventId === query.get('event') ? choice : {invalid:true};
}

// A separate order retains the journal and its inventory. A previous party's
// quantity and additional-seat relationship never become this family's choice.
export function discoveryDraft(state, record, choice) {
  let draft = attachInventory(reduce(state, {type:'NEW'}), record.orders);
  draft = reduce(draft, {type:'QTY', value:choice.qty ?? defaultState().qty});
  return reduce(draft, {type:'EVENT', value:choice.session.eventId});
}

// Keep the pending choice in this page's URL. The order identified by resume
// stays authoritative through reload, language changes and cross-tab updates.
export function deferredDiscovery(query) {
  return query.has('resume') ? selection(query.get('pickSession'), query.get('pickQty')) : null;
}
export function retainDiscovery(query, choice) {
  if (!choice) return;
  query.set('pickSession', choice.session.id);
  if (choice.qty !== null) query.set('pickQty', choice.qty);
}

export function discoveryNotice(choice, lang, busy, t, dateText) {
  if (!choice) return '';
  const c = words[lang];
  if (choice.invalid) return `<h1 tabindex="-1">${c.invalid}</h1><p>${c.invalidHelp}</p><a class="btn secondary" href="../${lang}/events/">${c.programme}</a>`;
  const {session, qty} = choice;
  const event = EVENTS.find(item => item.id === session.eventId);
  const query = new URLSearchParams({lang, from:'discovery', book:'1', event:event.id, session:session.id});
  if (qty !== null) query.set('qty', qty);
  const action = busy ? '' : `<a class="btn secondary" data-discovery-continue href="?${query}">${c.open}</a>`;
  return `<section class="notice" data-discovery-choice role="status"><strong>${c.choice}</strong><p>${t(event.titleKey)} · ${dateText(session)}${qty === null ? '' : ' · ' + c.guests + ': ' + qty}</p><p>${busy ? c.busy : c.ready}</p>${action}</section>`;
}
