/* Attraction details: static content first; isolated adapters for each demo version. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const id = document.body.dataset.ride, version = document.body.dataset.version;
  const save = $('ride-save'), note = $('ride-storage'), announce = $('ride-announce');
  const key = version === 'v2' ? 'vp.catalog.v2.saved' : 'vp.integrated.v1';
  let memory = null, transient = false, corrupted = false;
  function load() {
    if (transient) return memory;
    if (version === 'v1' && !window.VP) {
      corrupted = true;
      note.textContent = 'Сохранение временно недоступно. Обновите страницу или откройте каталог.';
      note.hidden = false;
      return null;
    }
    try {
      const raw = localStorage.getItem(key);
      const parsed = JSON.parse(raw || 'null');
      if (version === 'v2') {
        if (parsed !== null && !Array.isArray(parsed)) throw new SyntaxError('Invalid saved list');
        memory = parsed || [];
      } else {
        if (parsed !== null && (!parsed.selections || !Array.isArray(parsed.selections.real) || !Array.isArray(parsed.wishes))) throw new SyntaxError('Invalid plan');
        memory = parsed || window.VP.emptyState();
      }
      corrupted = false;
    } catch (error) {
      if (error instanceof SyntaxError) {
        corrupted = true;
        note.textContent = 'Сохранённый выбор не удалось прочитать. Откройте каталог, чтобы восстановить его. Данные не изменены.';
      } else {
        transient = true;
        memory = version === 'v2' ? [] : window.VP.emptyState();
        note.textContent = 'Браузер не разрешает сохранение. Выбор останется только на этой странице и пропадёт при переходе или обновлении.';
      }
    }
    note.hidden = !corrupted && !transient;
    return memory;
  }
  function selected(value) { return value && (version === 'v2' ? value : value.selections.real).includes(id); }
  function refresh() {
    const value = load(), on = selected(value);
    save.disabled = corrupted;
    save.setAttribute('aria-pressed', String(Boolean(on)));
    save.querySelector('span').textContent = on ? (version === 'v2' ? 'Сохранено' : 'В нашем плане') : (version === 'v2' ? 'Сохранить' : 'В наш план');
  }
  save.addEventListener('click', () => {
    const value = load();
    if (corrupted) return;
    const on = selected(value);
    if (version === 'v2') memory = on ? value.filter(x => x !== id) : [...value, id];
    else {
      value.selections.real = on ? value.selections.real.filter(x => x !== id) : [...value.selections.real, id];
      if (on) value.wishes = value.wishes.filter(x => x.rideId !== id);
      memory = value;
    }
    if (!transient) {
      try { localStorage.setItem(key, JSON.stringify(memory)); }
      catch { transient = true; note.textContent = 'Выбор не сохранён в браузере. Он пропадёт при переходе или обновлении страницы.'; }
    }
    refresh();
    announce.textContent = on ? 'Аттракцион убран из вашего списка.' : 'Аттракцион сохранён в вашем списке.';
  });
  window.addEventListener('storage', event => { if (event.key === key) refresh(); });
  window.addEventListener('pageshow', refresh);
  refresh();

  const back = $('ride-back');
  try {
    const from = new URL(document.referrer);
    const catalogue = new URL('attractions.html', document.baseURI);
    if (from.origin === catalogue.origin && from.pathname === catalogue.pathname && !from.searchParams.has('ride') && history.length > 1) {
      back.addEventListener('click', event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) { event.preventDefault(); history.back(); } });
    }
  } catch {}

  const open = $('photo-open'), dialog = $('photo-dialog'), full = $('photo-full'), stage = $('photo-stage');
  const photos = JSON.parse(document.body.dataset.photos);
  let current = 0, pointerX = null;
  const hero = open.querySelector('img');
  function imageFailure() { open.classList.add('photo-failed'); $('photo-fallback').hidden = false; }
  hero.addEventListener('error', imageFailure);
  if (hero.complete && !hero.naturalWidth) imageFailure();
  function zoom(off = false) {
    const on = off ? false : !stage.classList.contains('zoomed');
    stage.classList.toggle('zoomed', on);
    $('photo-zoom').setAttribute('aria-pressed', String(on));
    $('photo-zoom').setAttribute('aria-label', on ? 'Уменьшить фото' : 'Увеличить фото');
    $('photo-zoom').textContent = on ? '−' : '+';
  }
  function show(index) {
    current = (index + photos.length) % photos.length;
    zoom(true);
    full.hidden = false; $('gallery-error').hidden = true;
    full.src = photos[current].src; full.alt = photos[current].alt;
    $('photo-position').textContent = `${current + 1} / ${photos.length}`;
    $('photo-prev').hidden = $('photo-next').hidden = photos.length < 2;
  }
  open.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault(); show(0); dialog.showModal(); document.body.classList.add('gallery-open'); $('photo-close').focus();
  });
  $('photo-close').addEventListener('click', () => dialog.close());
  $('photo-prev').addEventListener('click', () => show(current - 1));
  $('photo-next').addEventListener('click', () => show(current + 1));
  $('photo-zoom').addEventListener('click', () => zoom());
  full.addEventListener('error', () => { full.hidden = true; $('gallery-error').hidden = false; });
  dialog.addEventListener('close', () => { document.body.classList.remove('gallery-open'); zoom(true); open.focus({preventScroll:true}); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      const controls = [...dialog.querySelectorAll('button:not([disabled])')].filter(button => !button.hidden && button.getClientRects().length);
      const first = controls[0], last = controls[controls.length-1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    if (photos.length > 1 && ['ArrowLeft','ArrowRight'].includes(event.key)) { event.preventDefault(); show(current + (event.key === 'ArrowRight' ? 1 : -1)); }
  });
  stage.addEventListener('pointerdown', event => { pointerX = event.clientX; });
  stage.addEventListener('pointerup', event => { if (photos.length > 1 && pointerX !== null && !stage.classList.contains('zoomed') && Math.abs(event.clientX-pointerX)>55) show(current+(event.clientX<pointerX?1:-1)); pointerX=null; });
})();
