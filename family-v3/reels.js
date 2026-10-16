/* A finite photo feed. Browsing never implies rejection or admission. */
(function () {
  'use strict';
  const M = window.VP3, C = window.VPReels, KEY = 'vp.family.v3', JOURNAL = 'vp.reels.v1';
  const $ = s => document.querySelector(s), esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const params = new URLSearchParams(location.search), reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let memory = M.emptyState(), storageFailed = false, writeBlocked = false;
  function read(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { storageFailed = true; return fallback; } }
  let raw = read(KEY, memory), state = M.sanitizeState(raw);
  let mode = ['demo','real'].includes(params.get('mode')) ? params.get('mode') : state.mode;
  const initialJournal = read(JOURNAL, {});
  let journal = initialJournal && initialJournal.version === 1 && initialJournal.modes && typeof initialJournal.modes === 'object' ? initialJournal : {version:1, modes:{}};
  function progress() {
    const p = journal.modes[mode];
    if (!p || typeof p !== 'object' || Array.isArray(p)) journal.modes[mode] = {};
    const j = journal.modes[mode];
    if (!['all','calm','exciting'].includes(j.filter)) j.filter = 'all';
    return j;
  }
  let lastRemoved = null;
  let filter = progress().filter, index = 0, rides = [], gesture = null, settling = null, offset = 0, panel = null, focusBack = null, toastTimer = null;
  const stage = $('#r-stage'), track = $('#r-track'), dialog = $('#r-dialog');
  const allRides = () => mode === 'real' ? M.realRides : M.demoRides;
  const selected = () => state.selections[mode];
  const current = () => rides[index];
  const height = () => stage.clientHeight;
  const catalogURL = () => 'attractions.html?mode=' + mode + '&view=catalog';
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { storageFailed = true; writeBlocked = true; toast('Браузер не сохраняет данные. Ваш выбор доступен до закрытия этой страницы.', true); return false; } }
  function saveProgress() { Object.assign(progress(), {filter, index, rideId:current()?.id || null}); write(JOURNAL, journal); }
  function readState() { raw = writeBlocked ? memory : read(KEY, memory); state = M.sanitizeState(raw); }
  function syncMode() { readState(); commitRaw({...((raw && typeof raw==='object' && !Array.isArray(raw)) ? raw : M.emptyState()), mode}); }
  function commitRaw(next) { memory = next; raw = next; state = M.sanitizeState(next); write(KEY, next); }
  function toast(text, persistent = false, undoId = null) {
    clearTimeout(toastTimer); const el = $('#r-toast');
    el.innerHTML = '<span>' + esc(text) + '</span>' + (undoId ? '<button data-action="restore" data-id="'+esc(undoId)+'">Вернуть</button>' : '') + (persistent ? '<button data-action="hide-toast" aria-label="Скрыть сообщение">×</button>' : '');
    el.classList.remove('is-hidden'); if (!persistent) toastTimer = setTimeout(() => el.classList.add('is-hidden'), 2600);
  }
  function toggle(id = current()?.id, force) {
    if (!id) return;
    readState(); const save = force ?? !selected().includes(id);
    commitRaw(C.patchSelection(raw, mode, id, save));
    lastRemoved = save ? null : id;
    if (save) progress().saved = true;
    saveProgress(); updateControls(); updateTip();
    toast(save ? 'Добавлено. Ваш выбор в «Мой список».' : 'Убрано из списка.', !save && !panel, !save && !panel ? id : null);
    if (panel === 'list') { renderList(); ($('#r-dialog-body [data-action=restore]') || $('#r-dialog-body [data-action=remove]') || $('#r-dialog [data-action=close]')).focus(); }
    else if (panel === 'details') { renderDetails(); $('#r-dialog-body [data-action=save]').focus(); }
  }
  function setRides(restore = false) {
    rides = allRides().filter(r => filter === 'all' || r.intensity === filter);
    const p = progress(), byId = rides.findIndex(r => r.id === p.rideId);
    index = restore ? (byId >= 0 ? byId : Math.min(Number.isInteger(p.index) ? Math.max(0,p.index) : 0, rides.length)) : 0;
    const deep = restore && params.get('ride'); if (deep && rides.some(r=>r.id===deep)) index = rides.findIndex(r=>r.id===deep);
  }
  function sourceShort(r) { return r.fictional ? (r.photo.includes('/demo-') ? 'Сгенерированное изображение' : 'Фото парка') : 'Фото парка'; }
  function card(r, slot) {
    const f = C.facts(r);
    return '<article class="r-card" data-slot="'+slot+'" data-id="'+r.id+'" '+(slot ? 'inert aria-hidden="true"' : 'aria-label="'+esc(r.name)+'"')+'><div class="r-photo"><img src="'+esc(r.photo)+'" alt="'+esc(r.name)+'" draggable="false" decoding="async" '+(!slot ? 'fetchpriority="high"' : 'loading="eager"')+'><span class="r-photo-note">'+sourceShort(r)+'</span><span class="r-photo-fallback" hidden>Фото не загрузилось<br>Выбор всё равно доступен</span></div><div class="r-content"><h2>'+esc(r.name)+'</h2><p class="r-price">'+esc(f.price)+'</p><ul class="r-facts">'+(f.cardLines || f.lines).map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul><p class="r-source">'+esc(r.fictional ? 'Учебные цены и условия, не правила парка.' : 'Действующие цены и условия уточняются.')+'</p><button class="r-details" data-action="details">Условия и семья <span aria-hidden="true">↗</span></button></div></article>';
  }
  function endCard(slot) {
    const empty = !rides.length;
    return '<article class="r-card r-end" data-slot="'+slot+'" '+(slot ? 'inert aria-hidden="true"' : '')+'><span class="r-end-icon" aria-hidden="true">'+(empty?'○':'✓')+'</span><p class="r-eyebrow">'+(empty?'ПО ЭТОМУ ФИЛЬТРУ':'ВСЁ ПОСМОТРЕЛИ')+'</p><h2>'+(empty?'Пока ничего<br>не нашлось':'Ваш день<br>начинается здесь')+'</h2><p>'+(empty?'Попробуйте все аттракционы.':'В вашем списке: '+selected().length+'. '+(mode==='demo'?'Можно перейти к билетам или вернуться к просмотру.':'Условия и стоимость можно уточнить у парка.'))+'</p><div class="r-actions">'+(empty?'<button class="r-save" data-action="reset-filter">Показать все</button>':'<button class="r-save" data-action="list">Открыть мой список</button><button class="r-list-btn" data-action="restart">Посмотреть ещё раз</button>')+'<a class="r-text" href="'+catalogURL()+'">Открыть каталог ↗</a></div></article>';
  }
  function render() {
    cancelSettle(false); offset = 0;
    $('#r-live').textContent = '';
    track.innerHTML = [-1,0,1].map(slot => { const n = index+slot; return n < 0 || n > rides.length ? '' : n === rides.length ? endCard(slot) : card(rides[n],slot); }).join('');
    track.querySelectorAll('img').forEach(img=> { img.addEventListener('error',()=>{img.hidden=true;img.nextElementSibling.nextElementSibling.hidden=false;}); });
    position(0, false); updateControls(); updateTip();
    requestAnimationFrame(checkOverflow);
    performance.mark('reels-card-ready');
  }
  function position(y, animate) {
    const duration = animate && !reduced.matches ? 220 : 0;
    track.querySelectorAll('[data-slot]').forEach(el => {
      el.style.transition = duration ? 'transform '+duration+'ms cubic-bezier(.22,.72,.22,1)' : 'none';
      el.style.transform = 'translate3d(0,' + (Number(el.dataset.slot)*height()+y) + 'px,0)';
    });
    offset = y;
  }
  function checkOverflow() {
    const el = track.querySelector('[data-slot="0"]');
    const overflow = el && el.scrollHeight > el.clientHeight + 2;
    stage.classList.toggle('is-overflow', !!overflow); el?.classList.toggle('is-overflow', !!overflow);
  }
  function updateControls() {
    $('#r-count').textContent = !rides.length ? '0 / 0' : Math.min(index+1,rides.length)+' / '+rides.length;
    $('#r-mode-label').textContent = mode==='demo'?'Учебный пример':'Аттракционы парка';
    $('#r-list-count').textContent = selected().length;
    const isSaved = current() && selected().includes(current().id);
    $('#r-save').setAttribute('aria-pressed',String(!!isSaved)); $('#r-save-label').textContent = current() ? (isSaved?'В списке':'Хочу покататься') : 'К моему списку';
    $('#r-save > span').textContent = isSaved?'♥':'♡';
    $('#r-prev').disabled = index===0; $('#r-next').disabled = index>=rides.length;
  }
  function updateTip() {
    const p = progress(), show = !!current() && !(p.swiped && p.saved);
    $('#r-onboarding').classList.toggle('is-hidden', !show);
    $('#r-tip-swipe').hidden = !!p.swiped; $('#r-tip-save').hidden = !!p.saved;
  }
  function cancelSettle(takePosition) {
    let y=offset;
    if(takePosition) { const el=track.querySelector('[data-slot="0"]'); if(el)y=new DOMMatrixReadOnly(getComputedStyle(el).transform).m42; }
    if(settling)clearTimeout(settling.timer); settling=null;
    position(y,false);
  }
  function move(direction, start = null) {
    if(panel || !direction || index+direction<0 || index+direction>rides.length) return settleBack();
    cancelSettle(true); if (gesture) gesture=null;
    const target = -direction*height();
    performance.mark('reels-release');
    position(start ?? offset,false);
    // Force the current position to be committed before a responsive CSS transition.
    void track.offsetHeight;
    position(target,true);
    const finish = () => { settling=null; index+=direction; progress().swiped=true; saveProgress(); render(); $('#r-live').textContent=current()?current().name+'. '+(index+1)+' из '+rides.length:'Вы посмотрели все аттракционы'; performance.mark('reels-settled'); performance.measure('reels-settle','reels-release','reels-settled'); };
    if(reduced.matches) finish(); else settling={timer:setTimeout(finish,230),direction};
  }
  function settleBack() {
    cancelSettle(false); position(0,true);
  }
  // Only deliberate vertical travel commits. Pointer cancellation is always reversible.
  stage.addEventListener('pointerdown', e=>{
    if(e.pointerType==='mouse' && e.button!==0) return;
    if(gesture && gesture.id!==e.pointerId) { gesture=null;settleBack();return; }
    if(panel || e.target.closest('button,a,input,select,textarea') || stage.classList.contains('is-overflow') && !e.target.closest('.r-photo')) return;
    cancelSettle(true);
    gesture={id:e.pointerId,x:e.clientX,y:e.clientY,base:offset,lastY:e.clientY,lastT:e.timeStamp,velocity:0,locked:false};
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', e=>{
    const g=gesture;if(!g||g.id!==e.pointerId)return;
    const dx=e.clientX-g.x,dy=e.clientY-g.y;
    if(!g.locked && Math.abs(dx)>Math.abs(dy)+8) {gesture=null;settleBack();return;}
    if(Math.abs(dy)>8)g.locked=true;
    const dt=e.timeStamp-g.lastT;if(dt>0)g.velocity=(e.clientY-g.lastY)/dt;
    g.lastY=e.clientY;g.lastT=e.timeStamp;
    let y=g.base+dy;if(index===0&&y>0||index===rides.length&&y<0)y*=.22;
    if(g.locked)position(reduced.matches?0:y,false);
  });
  stage.addEventListener('pointerup', e=>{
    const g=gesture;if(!g||g.id!==e.pointerId)return; gesture=null;
    const travel=g.base+e.clientY-g.y, velocity=e.timeStamp-g.lastT>100?0:g.velocity;
    const direction=travel<0?1:-1;
    const commit=g.locked && (Math.abs(travel)>Math.min(96,height()*.16) || Math.abs(travel)>28 && Math.abs(velocity)>.45 && Math.sign(velocity)===Math.sign(travel));
    if(commit)move(direction,reduced.matches?0:offset);else settleBack();
  });
  ['pointercancel','lostpointercapture'].forEach(type=>stage.addEventListener(type,e=>{if(gesture?.id===e.pointerId){gesture=null;settleBack();}}));
  let wheelAmount=0,wheelAt=0;
  stage.addEventListener('wheel',e=>{
    if(e.ctrlKey||panel||stage.classList.contains('is-overflow'))return;
    e.preventDefault();if(settling)return;
    if(performance.now()-wheelAt>180)wheelAmount=0;wheelAt=performance.now();wheelAmount+=e.deltaY;
    if(Math.abs(wheelAmount)>70){move(wheelAmount>0?1:-1);wheelAmount=0;}
  },{passive:false});
  document.addEventListener('keydown',e=>{
    if(panel||e.altKey||e.metaKey||e.ctrlKey||e.target.closest('input,textarea,select'))return;
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!settling)move(e.key==='ArrowDown'?1:-1);}
  });
  function openPanel(type) {
    cancelSettle(true);gesture=null;settleBack();
    if(!dialog.open)focusBack=document.activeElement;
    panel=type; renderPanel(); if(!dialog.open)dialog.showModal();
  }
  function closePanel() {dialog.close();}
  dialog.addEventListener('close',()=>{panel=null; const target=focusBack?.isConnected?focusBack:$('#r-save');target?.focus({preventScroll:true});if(location.hash)history.replaceState(null,'',location.pathname+location.search);});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePanel();}});
  function panelHTML(title, html) {$('#r-dialog-title').textContent=title;$('#r-dialog-body').innerHTML=html;}
  function renderPanel() {if(panel==='details')renderDetails();else if(panel==='family')renderFamily();else if(panel==='list')renderList();else renderHelp();}
  function familyHTML(r) {
    if(!state.party.length)return '<p>Укажите возраст и рост, чтобы проверить условия для вашей семьи. Можно сделать это позже.</p><button class="r-secondary" data-action="family">Добавить семью</button>';
    return '<ul class="r-family-results">'+C.familyStatus(r,state.party).map(p=>'<li data-status="'+esc(p.status)+'"><strong>'+esc(p.label)+'</strong><span>'+esc(p.text)+'</span></li>').join('')+'</ul><button class="r-text" data-action="family">Изменить семью</button>';
  }
  function renderDetails() {
    const r=current();if(!r)return;const f=C.facts(r);
    panelHTML(r.name,'<p class="r-disclaimer">'+esc(f.disclaimer)+'</p><h3>'+esc(f.price)+'</h3><ul class="r-detail-facts">'+f.lines.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul><h3>Ваша семья</h3>'+familyHTML(r)+'<p class="r-muted">Сохранение означает, что вам интересно. Возможность катания зависит от условий аттракциона. Статус работы уточняйте перед визитом.</p><p class="r-muted">'+esc(f.source)+'</p><button class="r-save" data-action="save">'+(selected().includes(r.id)?'♥ В списке · убрать':'♡ Хочу покататься')+'</button>');
  }
  function renderFamily() {
    panelHTML('Ваша семья','<p>Добавьте тех, с кем идёте. Если рост пока неизвестен, оставьте поле пустым.</p><form id="r-family-form"><div id="r-people">'+state.party.map(personRow).join('')+'</div><div class="r-actions"><button type="button" class="r-secondary" data-action="add-child">+ Ребёнок</button><button type="button" class="r-secondary" data-action="add-adult">+ Взрослый</button></div><p id="r-family-error" role="alert"></p><div class="r-actions"><button class="r-save" type="submit">Сохранить семью</button><button class="r-text" type="button" data-action="close">Сейчас пропустить</button></div></form>');
    $('#r-family-form').addEventListener('submit',saveFamily);
  }
  function personRow(p) {
    return '<fieldset class="r-person" data-person="'+esc(p.id)+'" data-role="'+p.role+'"><legend>'+(p.role==='child'?'Ребёнок':'Взрослый')+'</legend><label class="r-field">Имя<input name="label" maxlength="40" value="'+esc(p.label)+'" autocomplete="off"></label><label class="r-field">Возраст, лет<input type="number" name="age" min="'+(p.role==='child'?0:18)+'" max="'+(p.role==='child'?17:120)+'" step="1" inputmode="numeric" value="'+(p.age??'')+'"></label><label class="r-field">Рост, см<input type="number" name="height" min="40" max="250" step="1" inputmode="numeric" value="'+(p.height??'')+'"></label><button type="button" class="r-text" data-action="remove-person">Убрать</button></fieldset>';
  }
  function addPerson(role) {
    if($('#r-people').children.length>=8){$('#r-family-error').textContent='Можно добавить до 8 человек.';return;}
    const p={id:'reels-'+Date.now()+'-'+Math.floor(Math.random()*1000),role,label:role==='child'?'Ребёнок':'Взрослый',age:role==='adult'?18:null,height:null};
    $('#r-people').insertAdjacentHTML('beforeend',personRow(p));$('#r-people').lastElementChild.querySelector('input').focus();
  }
  function saveFamily(e) {
    e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;
    const party=[...form.querySelectorAll('[data-person]')].map(el=>({id:el.dataset.person,role:el.dataset.role,label:el.querySelector('[name=label]').value.trim()||(el.dataset.role==='child'?'Ребёнок':'Взрослый'),age:el.querySelector('[name=age]').value===''?null:Number(el.querySelector('[name=age]').value),height:el.querySelector('[name=height]').value===''?null:Number(el.querySelector('[name=height]').value)}));
    readState();const next=structuredClone(raw && typeof raw==='object' && !Array.isArray(raw) ? raw : M.emptyState());next.party=party;next.mode=mode;commitRaw(next);closePanel();toast('Семья сохранена. Проверка доступна в условиях аттракциона.');
  }
  function ticketLink() {return 'tickets.html?picker=reels'+(mode==='real'?'&from=real':'');}
  function renderList() {
    const list=allRides().filter(r=>selected().includes(r.id));
    const undo = lastRemoved ? '<p class="r-undo" role="status">Убрано из списка. <button class="r-text" data-action="restore" data-id="'+esc(lastRemoved)+'">Вернуть</button></p>' : '';
    if(!list.length){panelHTML('Мой список',undo+'<div class="r-empty"><h3>Пока ничего не выбрано</h3><p>Добавьте то, на чём хотите покататься. Ваш список будет здесь.</p><button class="r-save" data-action="close">Выбрать аттракционы</button><a class="r-text" href="'+catalogURL()+'">Открыть каталог</a></div>');return;}
    panelHTML('Мой список · '+list.length,undo+'<p>Вы хотите покататься</p><div class="r-selected">'+list.map(r=>{const f=C.facts(r);return '<article class="r-selected-row"><img src="'+esc(r.photo)+'" alt="" width="64" height="64"><div><h3>'+esc(r.name)+'</h3><p>'+esc(f.price)+'</p><p class="r-muted">'+esc((f.cardLines || f.lines).join(' '))+'</p></div><button class="r-icon" data-action="remove" data-id="'+r.id+'" aria-label="Убрать '+esc(r.name)+'">×</button></article>';}).join('')+'</div><p class="r-disclaimer">'+(mode==='demo'?'Учебный пример. Цены и условия вымышлены.':'Реальные цены и условия пока не подтверждены. Онлайн-покупка для этих аттракционов недоступна.')+'</p><p class="r-muted">'+(storageFailed?'Выбор доступен до закрытия этой страницы.':'Выбор сохранён в этом браузере.')+' Условия катания проверьте перед покупкой.</p><div class="r-actions"><button class="r-secondary" data-action="close">Продолжить выбирать</button>'+(mode==='demo'?(writeBlocked?'<p class="r-muted">Чтобы передать выбор к билетам, разрешите браузеру сохранять данные.</p>':'<a class="r-save" href="'+ticketLink()+'">К билетам ↗</a>'):'<a class="r-save" href="index.html#visit">Уточнить у парка ↗</a>')+'</div>'+(mode==='demo'&&!writeBlocked?'<div class="r-list-routes"><a class="r-text" href="company.html?picker=reels">Рассчитать для нас</a><a class="r-text" href="company.html?mode=flexible&picker=reels">Выберем на месте</a></div>':''));
  }
  function renderHelp() {
    panelHTML('Выбирайте в своём ритме','<ol class="r-help-steps"><li><strong>Листайте вверх</strong><p>Следующий аттракцион. Вниз, чтобы вернуться. Можно нажимать стрелки.</p></li><li><strong>Нравится? Добавьте в список</strong><p>Кнопка «Хочу покататься». Повторное нажатие убирает из списка. Листание ничего не удаляет.</p></li><li><strong>Завершите, когда захотите</strong><p>«Мой список» всегда внизу. Оттуда можно перейти к билетам.</p></li></ol><button class="r-save" data-action="repeat-tip">Понятно, к просмотру</button><h3>Что показать</h3><div class="r-filter">'+[['all','Все'],['calm','Спокойнее'],['exciting','С драйвом']].map(([v,t])=>'<button class="r-secondary" data-action="filter" data-value="'+v+'" aria-pressed="'+(filter===v)+'">'+t+'</button>').join('')+'</div><h3>Другой формат</h3><div class="r-actions"><a class="r-text" href="attractions.html?mode='+mode+'">Карточки Tinder ↗</a><a class="r-text" href="'+catalogURL()+'">Каталог ↗</a></div><details class="r-demo-settings"><summary>О прототипе и данных</summary><p>Лента на фото. В учебном режиме цены, возраст, рост и сопровождение вымышлены. Выбор сохраняется только в этом браузере. Реальная оплата не подключена.</p><button class="r-secondary" data-action="mode">'+(mode==='demo'?'Показать реальные аттракционы':'Показать учебные примеры')+'</button></details>');
  }
  document.addEventListener('click',e=>{
    const link=e.target.closest('a[href]');if(link && /(?:tickets|company)\.html/.test(link.getAttribute('href')))syncMode();
    const el=e.target.closest('[data-action]');if(!el)return;
    const a=el.dataset.action;
    if(a==='save'){if(current())toggle();else openPanel('list');}
    else if(['details','list','family','help'].includes(a))openPanel(a);
    else if(a==='close')closePanel();
    else if(a==='next'||a==='prev'){if(!settling)move(a==='next'?1:-1);}
    else if(a==='dismiss'){Object.assign(progress(),{swiped:true,saved:true});saveProgress();updateTip();}
    else if(a==='repeat-tip'){Object.assign(progress(),{swiped:false,saved:false});saveProgress();closePanel();updateTip();}
    else if(a==='remove')toggle(el.dataset.id,false);
    else if(a==='restore')toggle(el.dataset.id,true);
    else if(a==='hide-toast')$('#r-toast').classList.add('is-hidden');
    else if(a==='add-child'||a==='add-adult')addPerson(a==='add-child'?'child':'adult');
    else if(a==='remove-person')el.closest('[data-person]').remove();
    else if(a==='filter'||a==='reset-filter'){filter=a==='filter'?el.dataset.value:'all';setRides();saveProgress();if(dialog.open)closePanel();render();}
    else if(a==='restart'){index=0;saveProgress();render();}
    else if(a==='mode'){mode=mode==='demo'?'real':'demo';syncMode();filter=progress().filter;setRides(true);history.replaceState(null,'',location.pathname+'?mode='+mode);closePanel();render();}
  });
  function onHash(){if(location.hash==='#list'||location.hash==='#plan')openPanel('list');else if(location.hash==='#family')openPanel('family');}
  window.addEventListener('hashchange',onHash);
  window.addEventListener('storage',e=>{if(e.key===KEY){readState();updateControls();if(panel && panel!=='family')renderPanel();}});
  window.addEventListener('pageshow',()=>{readState();updateControls();if(panel)renderPanel();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){gesture=null;cancelSettle(false);position(0,false);}});
  new ResizeObserver(()=>{gesture=null;cancelSettle(false);position(0,false);checkOverflow();}).observe(stage);
  syncMode();setRides(true);render();onHash();
  if(storageFailed)toast('Браузер не сохраняет данные. Ваш выбор доступен до закрытия этой страницы.',true);
  performance.mark('reels-ready');
}());
