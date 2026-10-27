/* A finite photo feed. Browsing never implies rejection or admission. */
(async function () {
  'use strict';
  if(!await VPFamilyStorage.wait())return;
  const M = window.VP3, C = window.VPReels, KEY = 'vp.family.v6.people.v1', JOURNAL = 'vp.reels.v1';
  const $ = s => document.querySelector(s), esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const params = new URLSearchParams(location.search), reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let memory = M.emptyState(), storageFailed = false, writeBlocked = false;
  function read(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { storageFailed = true; return fallback; } }
  let raw = read(KEY, memory), state = M.sanitizeState(raw);
  let mode = ['demo','real'].includes(params.get('mode')) ? params.get('mode') : state.mode;
  const initialJournal = read(JOURNAL, {});
  const resetRealFilter = mode==='real' && initialJournal?.modes?.real?.filter && initialJournal.modes.real.filter!=='all';
  let journal = initialJournal && initialJournal.version === 1 && initialJournal.modes && typeof initialJournal.modes === 'object' ? initialJournal : {version:1, modes:{}};
  function progress() {
    const p = journal.modes[mode];
    if (!p || typeof p !== 'object' || Array.isArray(p)) journal.modes[mode] = {};
    const j = journal.modes[mode];
    if (mode==='real' || !['all','calm','exciting'].includes(j.filter)) j.filter = 'all';
    return j;
  }
  let lastRemoved = null;
  let filter = progress().filter, index = 0, rides = [], gesture = null, settling = null, offset = 0, panel = null, focusBack = null, toastTimer = null;
  const stage = $('#r-stage'), track = $('#r-track'), dialog = $('#r-dialog');
  const allRides = () => mode === 'real' ? M.realRides : M.demoRides;
  const selected = () => state.selections[mode];
  const current = () => rides[index];
  const height = () => stage.clientHeight;
  const sharedURL = section => (window.VPI18n?.base||new URL('../../',location.href).pathname)+(window.VPI18n?.language||document.documentElement.lang||'ru')+'/'+section+'/';
  const catalogURL = () => mode==='real'?sharedURL('attractions'):'attractions.html?mode=demo&view=catalog';
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { storageFailed = true; writeBlocked = true; toast('Браузер не сохраняет данные. Ваш выбор доступен до закрытия этой страницы.', true); return false; } }
  function saveProgress() { Object.assign(progress(), {filter, index, rideId:current()?.id || null}); write(JOURNAL, journal); }
  function readState() { raw = writeBlocked ? memory : read(KEY, memory); state = M.sanitizeState(raw); }
  function syncMode() { readState(); commitRaw({...((raw && typeof raw==='object' && !Array.isArray(raw)) ? raw : M.emptyState()), mode}); }
  function commitRaw(next) { const before=state.selections.real.slice();memory = next; raw = next; state = M.sanitizeState(next);
    if(window.VPJourneySync){const result=VPJourneySync('local',{a:{before,after:state.selections.real}},{aState:next});if(result?.ok)readState();else{storageFailed=true;writeBlocked=true;toast('Браузер не сохраняет данные. Ваш выбор доступен до закрытия этой страницы.',true);}}
    else if(write(KEY,next))readState();
  }
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
    if (!save && !panel) toast('Убрано из списка.', true, id);
    else if (!writeBlocked) $('#r-toast').classList.add('is-hidden');
    if (panel === 'list') { renderList(); ($('#r-dialog-body [data-action=restore]') || $('#r-dialog-body [data-action=remove]') || $('#r-dialog [data-action=close]')).focus(); }
    else if (panel === 'details') { renderDetails(); $('#r-dialog-body [data-action=save]').focus(); }
  }
  function setRides(restore = false) {
    if(mode==='real')filter='all';
    const ordered=mode==='real'?allRides().slice().sort((a,b)=>Number(Boolean(b.photo))-Number(Boolean(a.photo))):allRides();
    const source=mode==='real'&&window.VPDiscoveryContext?VPDiscoveryContext.filterRides(ordered):ordered;
    rides = source.filter(r => filter === 'all' || r.intensity === filter).slice().sort((a,b)=>(window.VPDiscoveryContext?.familyScore(b,state.party)||0)-(window.VPDiscoveryContext?.familyScore(a,state.party)||0));
    const p = progress(), byId = rides.findIndex(r => r.id === p.rideId);
    index = restore ? (byId >= 0 ? byId : Math.min(Number.isInteger(p.index) ? Math.max(0,p.index) : 0, rides.length)) : 0;
    const deep = restore && params.get('ride'); if (deep && rides.some(r=>r.id===deep)) index = rides.findIndex(r=>r.id===deep);
  }
  function sourceShort(r) { return r.photo?VPPhoto.caption():'Изображение не указано'; }
  function card(r, slot) {
    const f = C.facts(r);
    const photo=r.photo?'<img src="'+esc(VPPhoto.discovery?.(r.photo)||r.photo)+'" style="object-position:'+esc(VPPhoto.focal?.(r.photo)||'50% 50%')+'!important" srcset="'+esc(VPPhoto.discoverySrcset?.(r.photo)||VPPhoto.srcset(r.photo))+'" sizes="(max-width:760px) 150vh, 1440px" data-photo-origin="ai-generated-demo" alt="'+esc(r.name)+'" draggable="false" decoding="async" '+(!slot ? 'fetchpriority="high"' : 'loading="eager"')+'><span class="r-photo-note">'+sourceShort(r)+'</span><span class="r-photo-fallback" hidden>Фото не загрузилось<br>Выбор всё равно доступен</span>':'<span class="r-photo-fallback">Изображение не указано</span>';
    const facts=r.fictional?'<p class="r-source">Учебные цены и условия, не правила парка.</p>':'<p class="r-source">Цена и условия уточняются у парка.</p>';
    return '<article class="r-card" data-slot="'+slot+'" data-id="'+r.id+'" '+(slot ? 'inert aria-hidden="true"' : 'aria-label="'+esc(r.name)+'"')+'><div class="r-photo'+(r.photo?'':' r-photo-missing')+'">'+photo+'</div><div class="r-content"><h2>'+esc(r.name)+'</h2>'+facts+'<button class="r-details" data-action="details">Условия и семья <span aria-hidden="true">ⓘ</span></button></div></article>';
  }
  function endSummary() { return selected().length?'В вашем списке: '+selected().length+'. '+'Можно перейти к билетам или вернуться к просмотру.':'Можно посмотреть ещё раз или открыть каталог.'; }
  function endCard(slot) {
    const empty = !rides.length;
    return '<article class="r-card r-end" data-slot="'+slot+'" '+(slot ? 'inert aria-hidden="true"' : '')+'><span class="r-end-icon" aria-hidden="true">'+(empty?'○':'✓')+'</span><p class="r-eyebrow">'+(empty?'ПО ЭТОМУ ФИЛЬТРУ':'ВСЁ ПОСМОТРЕЛИ')+'</p><h2>'+(empty?'Пока ничего<br>не нашлось':selected().length?'Ваш день<br>начинается здесь':'Пока ничего не выбрано')+'</h2><p'+(empty?'':' data-end-summary')+'>'+(empty?'Попробуйте все аттракционы.':endSummary())+'</p><div class="r-actions">'+(empty?'<button class="r-save" data-action="reset-filter">Показать все</button>':(selected().length?'<button class="r-save" data-vp-cta="primary" data-action="list">Открыть мой список</button>':'')+'<button class="'+(selected().length?'r-list-btn':'r-save')+'" data-action="restart">Посмотреть ещё раз</button>')+'<a class="r-text" data-vp-cta="secondary" href="'+catalogURL()+'">Открыть каталог ↗</a></div></article>';
  }
  function render() {
    cancelSettle(false); offset = 0;
    $('#r-live').textContent = '';
    track.innerHTML = [-1,0,1].map(slot => { const n = index+slot; return n < 0 || n > rides.length ? '' : n === rides.length ? endCard(slot) : card(rides[n],slot); }).join('');
    track.querySelectorAll('img').forEach(img=> { img.addEventListener('error',()=>{img.hidden=true;img.nextElementSibling.nextElementSibling.hidden=false;}); });
    position(0, false); updateControls(); updateTip();
    window.VPDiscoveryContext?.cue('feed', track.querySelector('[data-slot="0"] .r-photo img'));
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
    $('.picker-switch').querySelectorAll('[data-picker]').forEach(link => {
      link.href = (link.dataset.picker==='reels'?'reels.html':'attractions.html')+'?mode='+mode;
      if(window.VPDiscoveryContext)link.href=VPDiscoveryContext.contextURL(link.href);
      link.innerHTML=(link.querySelector('svg')?.outerHTML||'')+(link.dataset.picker==='reels'?'Фото-лента':'Свайп-подбор');
    });
    $('#r-count').textContent = !rides.length ? '0 / 0' : Math.min(index+1,rides.length)+' / '+rides.length;
    $('#r-mode-label').textContent = mode==='demo'?'Учебный пример':'Аттракционы парка';
    $('#r-list-count').textContent = selected().length;
    const familyButton=document.querySelector('.r-tools [data-action=family]');if(familyButton){familyButton.classList.add('discovery-family-entry');familyButton.setAttribute('data-i18n-skip','');familyButton.innerHTML=esc(window.VPDiscoveryContext.familyLabel(state.party));familyButton.setAttribute('aria-label',window.VPDiscoveryContext.familyLabel(state.party));}
    track.querySelectorAll('[data-end-summary]').forEach(el => { el.textContent = endSummary(); });
    const isSaved = current() && selected().includes(current().id);
    $('#r-save').setAttribute('aria-pressed',String(!!isSaved)); $('#r-save-label').textContent = current() ? (isSaved?'В списке':'Хочу покататься') : (selected().length?'К моему списку':'Посмотреть ещё раз');
    $('#r-save > span').textContent = isSaved?'♥':'♡';
    $('#r-save').setAttribute('aria-label',isSaved?'В списке · убрать':'Хочу покататься');
    $('#r-prev').disabled = index===0; $('#r-next').disabled = index>=rides.length;
  }
  function updateTip() { /* Gesture teaching is a non-interactive visual cue. */ }
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
    const run = {timer:null,direction,finish:null};
    run.finish = () => {
      if(settling!==run)return;
      clearTimeout(run.timer);settling=null;index+=direction;progress().swiped=true;saveProgress();render();
      $('#r-live').textContent=current()?current().name+'. '+(index+1)+' из '+rides.length:'Вы посмотрели все аттракционы';
      performance.mark('reels-settled');performance.measure('reels-settle','reels-release','reels-settled');
    };
    settling=run;
    if(reduced.matches)run.finish();else run.timer=setTimeout(run.finish,230);
  }
  function finishPendingMove() { if(settling)settling.finish(); }
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
    if(!dialog.open)focusBack=document.activeElement;
    finishPendingMove();
    if(type==='details'&&!current())type='list';
    cancelSettle(true);gesture=null;settleBack();
    panel=type; renderPanel(); if(!dialog.open)dialog.showModal();
  }
  function closePanel() {dialog.close();}
  dialog.addEventListener('close',()=>{panel=null; const target=focusBack?.isConnected?focusBack:$('#r-save');target?.focus({preventScroll:true});if(location.hash)history.replaceState(null,'',location.pathname+location.search);});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePanel();}});
  function panelHTML(title, html) {$('#r-dialog-title').textContent=title;$('#r-dialog-body').innerHTML=html;}
  function renderPanel() {if(panel==='details')renderDetails();else if(panel==='family')renderFamily();else if(panel==='list')renderList();else renderHelp();}
  function familyHTML(r) {
    if(!state.party.length)return '<p>Укажите состав компании и возраст для подбора. Можно сделать это позже.</p><button class="r-secondary" data-vp-cta="secondary" data-action="family">Добавить участников</button>';
    return '<ul class="r-family-results">'+state.party.map((p,i)=>{const hint=window.VPDiscoveryContext.recommendation(r,p);return '<li data-status="'+esc(hint.status)+'"><strong>'+esc(VP3.participantLabel(p,i))+' · '+esc(VP3.ageLabel(p))+'</strong><span>'+esc(hint.text)+'</span></li>';}).join('')+'</ul><button class="r-text" data-action="family">Изменить компанию</button>';
  }
  function renderDetails() {
    const r=current();if(!r)return;const f=C.facts(r);
    panelHTML(r.name,'<p class="r-disclaimer">'+esc(f.disclaimer)+'</p><h3>'+esc(f.price)+'</h3><ul class="r-detail-facts">'+f.lines.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul><p class="r-muted">'+esc(VPPhoto.note())+'</p><h3>Ваша компания</h3>'+familyHTML(r)+'<p class="r-muted">Сохранение означает, что вам интересно. Возможность катания зависит от условий аттракциона. Статус работы уточняйте перед визитом.</p><p class="r-muted">'+esc(f.source)+'</p><button class="r-save" data-action="save">'+(selected().includes(r.id)?'♥ В списке · убрать':'♡ Хочу покататься')+'</button>');
  }
  function renderFamily() {
    panelHTML(window.VPDiscoveryContext.familyText().title,'<div id="r-family-editor"></div>');
    window.VPDiscoveryContext.mountFamily($('#r-family-editor'),state.party,party=>{
      readState();const next=window.VPDiscoveryContext.withSavedFamily(structuredClone(raw && typeof raw==='object' && !Array.isArray(raw) ? raw : M.emptyState()),party);next.mode=mode;commitRaw(next);setRides(true);saveProgress();render();closePanel();toast(window.VPDiscoveryContext.familyText().saved);
    },closePanel);
  }
  function ticketLink() {return window.VPDiscoveryContext.ticketsURL(mode,'reels');}
  function renderList() {
    const list=allRides().filter(r=>selected().includes(r.id));
    const undo = lastRemoved ? '<p class="r-undo" role="status">Убрано из списка. <button class="r-text" data-action="restore" data-id="'+esc(lastRemoved)+'">Вернуть</button></p>' : '';
    if(!list.length){panelHTML('Мой список',undo+'<div class="r-empty"><h3>Пока ничего не выбрано</h3><p>Добавьте то, на чём хотите покататься. Ваш список будет здесь.</p><button class="r-save" data-vp-cta="primary" data-action="close">Выбрать аттракционы</button><a class="r-text" data-vp-cta="secondary" href="'+catalogURL()+'">Открыть каталог</a></div>');return;}
    panelHTML('Мой список · '+list.length,undo+'<p>Выберите билеты для этих аттракционов и вашей компании.</p><div class="r-selected">'+list.map(r=>'<article class="r-selected-row">'+(r.photo?'<img src="'+esc(r.photo.replace('-780.webp','-390.webp'))+'" alt="" width="64" height="64" loading="lazy">':'')+'<div><h3>'+esc(r.name)+'</h3></div><button class="r-icon" data-action="remove" data-id="'+r.id+'" aria-label="Убрать '+esc(r.name)+'">×</button></article>').join('')+'</div><p class="r-muted">Далее: кто катается, состав билетов и тестовая оплата. Цены и возрастные ориентиры демонстрационные.</p><div class="r-actions" data-vp-action-group>'+(writeBlocked?'<p role="alert">Чтобы передать выбор к билетам, разрешите браузеру сохранять данные.</p>':'<a class="r-save" data-vp-cta="primary" href="'+ticketLink()+'">Выбрать билеты</a>')+'<button class="r-secondary" data-vp-cta="secondary" data-action="close">Вернуться к подбору</button></div><p class="r-muted">Реальные условия и допуск уточните у парка.</p>');
  }
  function renderHelp() {
    panelHTML('Выбирайте в своём ритме','<ol class="r-help-steps"><li><strong>Листайте вверх</strong><p>Следующий аттракцион. Вниз, чтобы вернуться. Можно нажимать стрелки.</p></li><li><strong>Нравится? Добавьте в список</strong><p>Кнопка «Хочу покататься». Повторное нажатие убирает из списка. Листание ничего не удаляет.</p></li><li><strong>Завершите, когда захотите</strong><p>«Мой список» всегда внизу. Оттуда можно перейти к билетам.</p></li></ol><button class="r-save" data-action="close">Понятно, к просмотру</button>'+(mode==='demo'?'<h3>Что показать</h3><div class="r-filter">'+[['all','Все'],['calm','Спокойнее'],['exciting','С драйвом']].map(([v,t])=>'<button class="r-secondary" data-action="filter" data-value="'+v+'" aria-pressed="'+(filter===v)+'">'+t+'</button>').join('')+'</div>':'')+'<h3>Другой формат</h3><div class="r-actions"><a class="r-text" href="attractions.html?mode='+mode+'">Свайп-подбор ↗</a><a class="r-text" href="'+catalogURL()+'">Каталог ↗</a></div><details class="r-demo-settings"><summary>О прототипе и данных</summary><p>Лента на фото. В учебном режиме цены, возраст, рост и сопровождение вымышлены. Выбор сохраняется только в этом браузере. Реальная оплата не подключена.</p><button class="r-secondary" data-action="mode">'+(mode==='demo'?'Показать реальные аттракционы':'Показать учебные примеры')+'</button></details>'+ (window.VPDiscoveryContext?.consentHTML()||''));
  }
  document.addEventListener('click',e=>{
    const link=e.target.closest('a[href]');
    if(link?.dataset?.picker || link?.dataset?.locale) {
      finishPendingMove();
      syncMode();
      if(writeBlocked) { e.preventDefault(); toast('Не удалось сохранить выбор. Продолжайте на этой странице, чтобы не потерять его.', true); return; }
    }
    if(link && /(?:tickets|company)\.html/.test(link.getAttribute('href'))){syncMode();if(writeBlocked){e.preventDefault();return;}}
    const el=e.target.closest('[data-action]');if(!el)return;
    const a=el.dataset.action;
    if(a==='save'){finishPendingMove();if(current())toggle();else if(selected().length)openPanel('list');else{index=0;saveProgress();render();}}
    else if(['details','list','family','help'].includes(a))openPanel(a);
    else if(a==='close')closePanel();
    else if(a==='next'||a==='prev'){if(!settling)move(a==='next'?1:-1);}
    else if(a==='dismiss'){Object.assign(progress(),{swiped:true,saved:true});saveProgress();updateTip();}
    else if(a==='repeat-tip'){closePanel();}
    else if(a==='remove')toggle(el.dataset.id,false);
    else if(a==='restore')toggle(el.dataset.id,true);
    else if(a==='hide-toast')$('#r-toast').classList.add('is-hidden');
    else if(a==='filter'||a==='reset-filter'){filter=mode==='real'?'all':a==='filter'?el.dataset.value:'all';setRides();saveProgress();if(dialog.open)closePanel();render();}
    else if(a==='restart'){index=0;saveProgress();render();}
    else if(a==='mode'){mode=mode==='demo'?'real':'demo';syncMode();filter=progress().filter;if(mode==='real')write(JOURNAL,journal);setRides(true);const url=new URL(location.href);url.searchParams.set('mode',mode);history.replaceState(null,'',url.pathname+url.search+url.hash);closePanel();render();}
  });
  function onHash(){if(location.hash==='#list'||location.hash==='#plan')openPanel('list');else if(location.hash==='#family')openPanel('family');}
  window.addEventListener('hashchange',onHash);
  document.addEventListener('vp:interests',()=>{const before=state.selections.real.join('|');readState();if(before!==state.selections.real.join('|'))lastRemoved=null;updateControls();if(panel&&panel!=='family')renderPanel();});
  window.addEventListener('storage',e=>{if(e.key===KEY){const previous=state.selections.real.join('|');readState();if(previous!==state.selections.real.join('|'))lastRemoved=null;updateControls();if(panel && panel!=='family')renderPanel();}});
  // A late initial pageshow must not replace an in-progress family draft.
  window.addEventListener('pageshow',()=>{readState();updateControls();if(panel&&panel!=='family')renderPanel();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){gesture=null;cancelSettle(false);position(0,false);}});
  new ResizeObserver(()=>{gesture=null;cancelSettle(false);position(0,false);checkOverflow();}).observe(stage);
  syncMode();setRides(true);if(resetRealFilter)write(JOURNAL,journal);render();onHash();
  if(storageFailed)toast('Браузер не сохраняет данные. Ваш выбор доступен до закрытия этой страницы.',true);
  window.VPDiscoveryContext?.setNavigationGuard(()=>{finishPendingMove();syncMode();return !writeBlocked;});
  performance.mark('reels-ready');
}());
