const phone = '+374 95 90 00 60';
const phoneHref = 'tel:+37495900060';
const parkMap = 'https://www.google.com/maps/search/?api=1&query=Victory+Park+Yerevan';

const copy = {
  ru: {
    guests: 'Гостей в заказе', admission: 'Вход', arrival: 'Когда прийти', meeting: 'Где встречаемся',
    group: 'Один демобилет на всю компанию. Входите вместе.',
    single: 'Демобилет на одного гостя.',
    legacy: 'Для этого ранее оформленного заказа порядок раздельного входа не указан.',
    early: time => `К ${time} по Еревану, за 15 минут до начала.`,
    show: 'Зал для демонстрационного спектакля пока не подтверждён.',
    garden: 'Точка сбора для демонстрационной прогулки пока не подтверждена.',
    directions: 'Как добраться до парка', parkContact: 'Телефон парка',
    help: 'Помощь по этому заказу', reference: 'Номер для обращения',
    helpText: 'Для вопросов о реальном визите позвоните в парк. Перенос или отмена демозаказа служат примером: заявка в парк не отправляется.',
    copyFailed: 'Выделите номер заказа и скопируйте вручную.'
  },
  hy: {
    guests: 'Այցելուների քանակը', admission: 'Մուտք', arrival: 'Երբ գալ', meeting: 'Որտեղ հանդիպել',
    group: 'Մեկ ցուցադրական տոմս ամբողջ խմբի համար։ Ներս մտեք միասին։',
    single: 'Ցուցադրական տոմս մեկ այցելուի համար։',
    legacy: 'Այս նախկին պատվերում առանձին մուտքի կարգը նշված չէ։',
    early: time => `Եկեք Երևանի ժամանակով ${time}-ին՝ մեկնարկից 15 րոպե առաջ։`,
    show: 'Ցուցադրական ներկայացման դահլիճը դեռ հաստատված չէ։',
    garden: 'Ցուցադրական զբոսանքի հավաքատեղին դեռ հաստատված չէ։',
    directions: 'Ինչպես հասնել այգի', parkContact: 'Այգու հեռախոսահամարը',
    help: 'Օգնություն այս պատվերի համար', reference: 'Հարցման համար նշեք պատվերի համարը',
    helpText: 'Իրական այցի վերաբերյալ հարցերի դեպքում զանգահարեք այգի։ Ցուցադրական պատվերի տեղափոխումն ու չեղարկումը օրինակներ են․ այգուն հայտ չի ուղարկվում։',
    copyFailed: 'Նշեք պատվերի համարը և պատճենեք ձեռքով։'
  },
  en: {
    guests: 'Guests in this order', admission: 'Entry', arrival: 'When to arrive', meeting: 'Meeting point',
    group: 'One demo ticket covers your group. Enter together.',
    single: 'Demo ticket for one guest.',
    legacy: 'This earlier order does not specify whether guests can enter separately.',
    early: time => `Arrive by ${time} Yerevan time, 15 minutes before the start.`,
    show: 'The venue for this demo show has yet to be confirmed.',
    garden: 'The meeting point for this demo walk has yet to be confirmed.',
    directions: 'Directions to the park', parkContact: 'Park phone',
    help: 'Help with this order', reference: 'Order number for enquiries',
    helpText: 'For a real visit, contact the park. Rescheduling and cancellation of a demo order are examples; no request is sent to the park.',
    copyFailed: 'Select and copy the order number manually.'
  }
};

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

export function ticketDetails(ticketState, order, {lang, t, dateText, seatText, money, event, session}) {
  const c = copy[lang];
  const at = order?.sessionAt ?? session?.at;
  const seats = order?.seats ?? ticketState.seats;
  const qty = order?.qty ?? ticketState.qty;
  const eventId = order?.eventId ?? ticketState.eventId;
  const arrivalTime = new Intl.DateTimeFormat(lang, {
    timeZone: 'Asia/Yerevan', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).format(new Date(Date.parse(at) - 15 * 60 * 1000));
  const admission = order?.visitPolicyVersion === 1
    ? (qty === 1 ? c.single : c.group)
    : c.legacy;

  return {
    lang, title: order?.eventTitle?.[lang] ?? t(event.titleKey),
    id: order?.id ?? ticketState.orderId, contact: order?.contact ?? ticketState.email,
    date: dateText({at}), amount: money(order?.amount ?? event.price * qty),
    seat: seats.length ? seatText(seats) : t('capacity'),
    guests: qty, admission, arrival: c.early(arrivalTime), meeting: c[eventId]
  };
}

export function renderTicket(info, t) {
  const c = copy[info.lang];
  const row = (label, value) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`;
  return `<article class="ticket">
    <div class="ticket-top"><p class="small">VICTORY PARK · ${t('demoOnly')}</p><h2>${escapeHtml(info.title)}</h2></div>
    <div class="ticket-body"><dl>
      <dt>${t('date')}</dt><dd>${escapeHtml(info.date)}<br><span class="small">${t('yerevanTime')}</span></dd>
      ${row(c.guests, info.guests)}${row(t('yourSeats'), info.seat)}${row(c.admission, info.admission)}
      ${row(c.arrival, info.arrival)}
      <dt>${c.meeting}</dt><dd>${escapeHtml(info.meeting)}<br><a href="../${info.lang}/visit/">${c.directions}</a></dd>
      ${row(t('amount'), info.amount)}
      <dt>${t('order')}</dt><dd class="order-code">${escapeHtml(info.id)}</dd>
      ${info.contact ? row(t('emailReceipt'), info.contact) : ''}
    </dl><p class="no-email">${t('noEmailSent')}</p></div>
    <div class="invalid">${t('invalidTicket')}</div>
  </article>`;
}

export function ticketText(info, t) {
  const c = copy[info.lang];
  return [
    t('invalidTicket'), 'VICTORY PARK', info.title, info.date + ' · ' + t('yerevanTime'),
    c.guests + ': ' + info.guests, info.seat, info.admission, info.arrival,
    c.meeting + ': ' + info.meeting, c.directions + ': ' + parkMap, c.parkContact + ': ' + phone,
    t('total') + ': ' + info.amount, c.reference + ': ' + info.id,
    t('ticketBody'), t('noEmailSent')
  ].join('\n\n');
}

export function downloadTicketText(info, t) {
  const blob = new Blob(['\uFEFF' + ticketText(info, t)], {type: 'text/plain;charset=utf-8'});
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = info.id + '-DEMO.txt';
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export function helpButton(lang, open, emphasized = false) {
  const cls = emphasized ? 'btn secondary' : 'link-button';
  return `<button type="button" class="${cls}" data-action="help" aria-expanded="${open}" aria-controls="session-order-help">${copy[lang].help}</button>`;
}

export function orderHelp({lang, orderId, opened, copied, t}) {
  const c = copy[lang];
  return `<section id="session-order-help" class="help-box" ${opened ? '' : 'hidden'}>
    <p><strong>${c.reference}</strong><br><span class="order-code">${escapeHtml(orderId)}</span></p>
    <button type="button" class="btn secondary small-btn" data-action="copy">${copied === true ? t('copied') : t('copyOrder')}</button>
    ${copied === 'manual' ? `<p role="status">${c.copyFailed}</p>` : ''}
    <p>${c.helpText}</p><a href="${phoneHref}">${c.parkContact} · ${phone}</a>
  </section>`;
}

export async function copyOrderNumber(orderId) {
  try {
    await navigator.clipboard.writeText(orderId);
    return true;
  } catch {
    return 'manual';
  }
}
