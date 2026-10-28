/* Compatibility entry for saved links to the former swipe screen. No state writes. */
(async () => {
  'use strict';
  const here = new URL(location.href), query = new URLSearchParams(here.search);
  let language = query.get('lang');
  if (!['ru', 'en', 'hy'].includes(language)) {
    try { language = localStorage.getItem('vpLang'); } catch {}
    if (!['ru', 'en', 'hy'].includes(language)) language = 'ru';
  }
  const text = {
    ru: ['Подбор аттракционов', 'Открыть подбор'],
    en: ['Find your rides', 'Open discovery'],
    hy: ['Ատրակցիոնների ընտրություն', 'Բացել ընտրությունը']
  }[language];
  document.documentElement.lang = language;
  document.title = text[0] + ' · Victory Park';
  document.querySelector('h1').textContent = text[0];
  const entry = document.getElementById('discovery-entry');
  entry.textContent = text[1];
  function target() {
    const next = new URL('reels.html', here);
    next.search = here.search;
    next.hash = here.hash;
    let mode = query.get('mode');
    if (!['real', 'demo'].includes(mode)) {
      try { mode = JSON.parse(localStorage.getItem('vp.family.v6.people.v1') || 'null')?.mode; } catch {}
      if (!['real', 'demo'].includes(mode)) mode = 'demo';
    }
    // Existing real attraction links also used names without a mode parameter.
    if (query.get('ride')) mode = query.get('ride').startsWith('demo-') ? 'demo' : 'real';
    const panel = ['#family', '#list', '#plan'].includes(here.hash) || query.get('view') === 'list';
    if (mode === 'real' && !panel && (query.get('view') === 'catalog' || here.hash === '#catalog')) {
      next.pathname = new URL('../../' + language + '/attractions/', here).pathname;
      if (next.hash === '#catalog') next.hash = '#cat';
    } else {
      next.searchParams.set('entry', 'swipe');
      if (query.get('view') === 'list' || next.hash === '#plan') next.hash = '#list';
      if (query.get('view') === 'catalog' && !panel) next.hash = '#catalog';
    }
    next.searchParams.delete('view');
    next.searchParams.set('mode', mode);
    next.searchParams.set('lang', language);
    return window.VPReleaseURL ? window.VPReleaseURL(next.href) : next.href;
  }
  entry.href = target();
  if (window.VPFamilyStorage && !await window.VPFamilyStorage.wait()) return;
  entry.href = target();
  location.replace(entry.href);
})();
