(() => {
  'use strict';
 function releaseURL(url){return window.VPReleaseURL ? window.VPReleaseURL(url) : url;}
  const api = window.VPCatalog;
  if (!api) return;
  const grid = document.getElementById('catalog-grid');
  const dialog = document.getElementById('catalog-dialog');
  const allButton = document.getElementById('catalog-all');
  const savedButton = document.getElementById('catalog-saved');
  const announcer = document.getElementById('catalog-announce');
  let savedOnly = location.hash === '#saved';
  let returnFocus = null, returnScroll = 0, openedRide = null;
  const escape = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const bookmark = '<svg viewBox="0 0 18 22" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 2h12v18l-6-4-6 4z"/></svg>';
  function saveButton(ride, selected) {
    return `<button type="button" class="catalog-save" data-save="${ride.id}" aria-pressed="${selected}" aria-label="${selected ? 'Убрать из сохранённого' : 'Сохранить'}: ${escape(ride.name)}">${bookmark}<span>${selected ? 'Сохранено' : 'Сохранить'}</span></button>`;
  }
  // Cards are already present in the document, including their photos and copy.
  // Enhance the static catalogue without moving its following sections.

  function update() {
    const selected = api.getSaved();
    document.querySelectorAll('[data-catalog-count]').forEach(el => { el.textContent = selected.length; });
    document.querySelectorAll('[data-save]').forEach(button => {
      const saved = selected.includes(button.dataset.save);
      const ride = api.rides.find(item => item.id === button.dataset.save);
      button.setAttribute('aria-pressed', String(saved));
      button.setAttribute('aria-label', `${saved ? 'Убрать из сохранённого' : 'Сохранить'}: ${ride.name}`);
      button.querySelector('span').textContent = saved ? 'Сохранено' : 'Сохранить';
    });
    document.querySelectorAll('[data-card]').forEach(card => { card.hidden = savedOnly && !selected.includes(card.dataset.card); });
    allButton.setAttribute('aria-pressed', String(!savedOnly));
    savedButton.setAttribute('aria-pressed', String(savedOnly));
    document.getElementById('catalog-empty').hidden = !savedOnly || selected.length > 0;
    document.getElementById('catalog-saved-bar').hidden = selected.length === 0;
    document.getElementById('catalog-summary').textContent = savedOnly ? 'Ваш список интересного. Это ещё не заказ.' : 'Настоящие фотографии парка';
    const note = document.getElementById('catalog-storage-note');
    note.textContent = api.getError(); note.hidden = !api.getError();
  }
  function setView(value, push = true) {
    savedOnly = value;
    if (push) { const url = new URL(location.href); url.hash = value ? 'saved' : ''; history.pushState({}, '', url); }
    update();
  }
  function closeDetails() { if (dialog.open) dialog.close(); }
  function openDetails(id, trigger) {
    if (api.rides.some(ride => ride.id === id)) { location.replace(releaseURL(`rides/${encodeURIComponent(id)}.html`)); return; }
    const ride = api.rides.find(item => item.id === id);
    if (!ride) return;
    returnFocus = trigger || grid.querySelector(`[data-details="${id}"]`);
    returnScroll = window.scrollY;
    openedRide = id;
    dialog.innerHTML = `<div class="catalog-dialog-head"><img src="${ride.photo}" width="640" height="420" alt="${escape(ride.name)} в Парке Победы"><button type="button" class="catalog-dialog-close" data-close aria-label="Закрыть подробности">×</button></div><div class="catalog-dialog-content"><p class="catalog-eyebrow">${escape(ride.kind)}</p><h2 id="catalog-dialog-title">${escape(ride.name)}</h2><p class="catalog-dialog-copy">${escape(ride.description)}</p><section class="catalog-dialog-rules" aria-labelledby="catalog-rules-title"><h3 id="catalog-rules-title">Перед катанием</h3><dl><div><dt>Рост и возраст</dt><dd>Уточняются</dd></div><div><dt>Сопровождение взрослым</dt><dd>Уточняется</dd></div><div><dt>Интенсивность</dt><dd>Не подтверждена</dd></div><div><dt>Цена и работа в день визита</dt><dd>Уточняются</dd></div></dl><p class="catalog-dialog-note">Правила парка пока не добавлены в прототип. Сохранить интересное можно сейчас. Перед покупкой и катанием уточните допуск у парка, особенно для ребёнка.</p></section><div class="catalog-dialog-footer">${saveButton(ride, api.getSaved().includes(id))}<a href="index.html#visit">Контакты парка ↗</a></div></div>`;
    document.body.classList.add('catalog-dialog-open');
    dialog.showModal();
    dialog.querySelector('[data-close]').focus({preventScroll:true});
  }
  document.addEventListener('click', event => {
    const save = event.target.closest('[data-save]');
    if (save) {
      const ride = api.rides.find(item => item.id === save.dataset.save);
      const selected = api.toggle(save.dataset.save);
      announcer.textContent = `${ride.name}: ${selected ? 'сохранено' : 'убрано из сохранённого'}.${api.isPersistent() ? '' : ' Список не сохранится при переходе на другую страницу.'}`;
      if (!dialog.open && savedOnly && !selected) savedButton.focus({preventScroll:true});
      return;
    }
    const details = event.target.closest('[data-details]');
    if (details) openDetails(details.dataset.details, details);
    if (event.target.closest('[data-close]')) closeDetails();
    const savedLink = event.target.closest('a[href="#saved"], a[href="attractions.html#saved"]');
    if (savedLink) { event.preventDefault(); setView(true); savedButton.scrollIntoView({block:'start',behavior:'instant'}); savedButton.focus({preventScroll:true}); }
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDetails(); } });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('catalog-dialog-open');
    const target = returnFocus && !returnFocus.closest('[hidden]') ? returnFocus : savedButton;
    target?.focus({preventScroll:true});
    window.scrollTo({top:returnScroll,behavior:'instant'});
    openedRide = null;
  });
  allButton.addEventListener('click', () => setView(false));
  savedButton.addEventListener('click', () => setView(true));
  document.getElementById('catalog-back-all').addEventListener('click', () => { setView(false); allButton.focus({preventScroll:true}); });
  window.addEventListener('hashchange', () => setView(location.hash === '#saved', false));
  window.addEventListener('popstate', () => { if (openedRide) closeDetails(); setView(location.hash === '#saved', false); });
  window.addEventListener('vp:catalog-change', update);
  update();
  document.querySelectorAll('#catalog-grid button:disabled, .catalog-filters button:disabled').forEach(button => { button.disabled = false; });
  const requestedRide = new URLSearchParams(location.search).get('ride');
  if (requestedRide && api.rides.some(ride => ride.id === requestedRide)) openDetails(requestedRide);
})();
