/* Shared display facts for the catalogue and ride details. No commerce writes. */
(function () {
  'use strict';
  const root = new URL('.', document.currentScript.src);
  const language = ['ru', 'en', 'hy'].includes(document.documentElement.lang) ? document.documentElement.lang : 'ru';
  const text = {
    ru: { demo: 'Демо', status: { open: 'работает', paused: 'пауза', closed: 'не работает', unknown: 'уточняем' }, age: 'Ориентир в демо: ', years: ' лет', ageUnknown: 'Возрастной ориентир уточняется', restrictions: 'Рост и сопровождение уточняются', statusDetails: 'Учебный статус. Реальную работу уточните у парка.', priceUnknown: 'Уточняется', ticketsSelected: 'К билетам на выбранные аттракционы', ticketsEmpty: 'К выбору билетов', noSource: 'Учебные статусы недоступны. Реальную работу уточните у парка.' },
    en: { demo: 'Demo', status: { open: 'operating', paused: 'paused', closed: 'closed', unknown: 'unknown' }, age: 'Demo age guide: ', years: ' years', ageUnknown: 'Age guide unconfirmed', restrictions: 'Height and accompaniment rules unconfirmed', statusDetails: 'Demo status. Check actual operation with the park.', priceUnknown: 'Unconfirmed', ticketsSelected: 'Tickets for your selected rides', ticketsEmpty: 'Choose tickets', noSource: 'Demo statuses are unavailable. Check actual operation with the park.' },
    hy: { demo: 'Դեմո', status: { open: 'աշխատում է', paused: 'դադար', closed: 'չի աշխատում', unknown: 'ճշտվում է' }, age: 'Դեմո տարիքային ուղեցույց՝ ', years: ' տարեկան', ageUnknown: 'Տարիքային ուղեցույցը ճշտվում է', restrictions: 'Հասակի և ուղեկցման կանոնները ճշտվում են', statusDetails: 'Ցուցադրական կարգավիճակ։ Իրական աշխատանքը ճշտեք այգում։', priceUnknown: 'Ճշտվում է', ticketsSelected: 'Ընտրված ատրակցիոնների տոմսերին', ticketsEmpty: 'Ընտրել տոմսեր', noSource: 'Ցուցադրական կարգավիճակներն անհասանելի են։ Իրական աշխատանքը ճշտեք այգում։' }
  }[language];
  const money = new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : language === 'hy' ? 'hy-AM' : 'en-GB');
  const rides = new Map((window.VPSharedCatalog?.rides || []).map(ride => [ride.catalogSlug, ride]));
  function setText(node, value) { if (node.textContent !== value) node.textContent = value; }
  function releaseURL(value) { return window.VPReleaseURL ? window.VPReleaseURL(value) : value; }
  function readStatuses() {
    const model = window.Availability;
    if (!model) return { rides: [], unavailable: true };
    try {
      const raw = localStorage.getItem(model.KEY);
      let state;
      if (raw === null) {
        state = model.presentationSeed();
        localStorage.setItem(model.KEY, JSON.stringify(state));
      } else {
        state = JSON.parse(raw);
        if (!model.validate(state)) throw Error('Invalid demo status state');
      }
      return { rides: model.derive(state).rides, unavailable: false };
    } catch (_) {
      // A damaged or inaccessible record must never be replaced with an open ride.
      return { rides: [], unavailable: true };
    }
  }
  function chosenSlugs() {
    try {
      const list = window.VPCORE?.list();
      return Array.isArray(list) ? [...new Set(list)].filter(slug => rides.has(slug)) : [];
    } catch (_) { return []; }
  }
  function refreshActions() {
    const selected = chosenSlugs();
    const url = new URL(selected.length ? 'experience/guest/company.html' : 'experience/guest/quick.html', root);
    url.searchParams.set('lang', language);
    if (selected.length) { url.searchParams.set('source', 'real'); url.searchParams.set('mode', 'exact'); }
    if (new URLSearchParams(location.search).get('review') === '1') url.searchParams.set('review', '1');
    document.querySelectorAll('[data-catalog-tickets]').forEach(link => {
      const destination = releaseURL(url.pathname + url.search);
      if (link.getAttribute('href') !== destination) link.setAttribute('href', destination);
      link.setAttribute('aria-label', selected.length ? text.ticketsSelected : text.ticketsEmpty);
    });
    document.querySelectorAll('[data-catalog-selected-count]').forEach(node => setText(node, String(selected.length)));
  }
  function refresh() {
    const statusData = readStatuses();
    const statuses = new Map(statusData.rides.map(ride => [ride.catalogId, ride]));
    document.querySelectorAll('[data-ride-status]').forEach(node => {
      const ride = rides.get(node.dataset.rideStatus);
      const current = ride && statuses.get(ride.id);
      const status = current?.status in text.status ? current.status : 'unknown';
      node.dataset.statusValue = status;
      setText(node, text.demo + ': ' + text.status[status]);
      node.title = text.statusDetails;
      if (node.tagName === 'A') {
        const url = new URL('experience/guest/availability.html', root);
        url.searchParams.set('lang', language);
        if (ride) url.hash = ride.id;
        node.setAttribute('href', releaseURL(url.pathname + url.search + url.hash));
        node.setAttribute('aria-label', (ride?.names?.[language] || ride?.name || '') + ': ' + text.demo + ', ' + text.status[status] + '. ' + text.statusDetails);
      }
    });
    document.querySelectorAll('[data-ride-age]').forEach(node => {
      const ride = rides.get(node.dataset.rideAge);
      const demo = ride && window.VP3?.demoForReal(ride.id);
      const range = demo?.ageRange;
      setText(node, Array.isArray(range) ? text.age + (range[1] >= 99 ? range[0] + '+' : range[0] + '-' + range[1]) + text.years : text.ageUnknown);
    });
    document.querySelectorAll('[data-ride-price]').forEach(node => {
      const ride = rides.get(node.dataset.ridePrice);
      const price = ride && window.VP3?.demoForReal(ride.id)?.price;
      setText(node, Number.isFinite(price) ? money.format(price) + '\u00a0֏' : text.priceUnknown);
    });
    document.querySelectorAll('[data-ride-restrictions]').forEach(node => setText(node, text.restrictions));
    document.querySelectorAll('[data-catalog-facts-warning]').forEach(node => { node.hidden = !statusData.unavailable; setText(node, text.noSource); });
    refreshActions();
  }
  function start() {
    refresh();
    document.addEventListener('vp:interests', refreshActions);
    document.addEventListener('vp:catalog-rendered', refresh);
    ['pageshow', 'focus'].forEach(event => window.addEventListener(event, refresh));
    window.addEventListener('storage', event => {
      if (event.key === null || event.key === window.Availability?.KEY) refresh();
      else if (Object.values(window.VPJourneyBridge?.KEYS || {}).includes(event.key)) refreshActions();
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
    window.VPFamilyStorage?.wait().then(refreshActions);
    setInterval(refresh, 5000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}());
