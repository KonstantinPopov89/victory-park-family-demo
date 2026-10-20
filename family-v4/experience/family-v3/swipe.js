/* Victory Park: local swipe prototype. No account, network writes or payment. */
(() => {
'use strict';
const KEY = 'vp.family.v3', JOURNEY = 'vp.swipe.v1';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const icons = {
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  x:'<path d="m6 6 12 12M18 6 6 18"/>',
  undo:'<path d="M3 10h11a6 6 0 0 1 0 12M3 10l5-5M3 10l5 5" transform="translate(0 -2)"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  cards:'<rect x="6" y="3" width="13" height="18" rx="3"/><path d="M3 7v10"/>',
  people:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4M17 4a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v3"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor"/><circle cx="15" cy="17" r="3" fill="currentColor"/>',
  back:'<path d="M20 12H4m6-6-6 6 6 6"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.info}</svg>`;
const btn = (action, text, cls='', extra='') => `<button type="button" class="sp-btn ${cls}" data-sp="${action}" ${extra}>${text}</button>`;
const all = [...VP3.demoRides, ...VP3.realRides];
const lookup = id => all.find(r => r.id === id);
let storageOK=true, state, journal, view='swipe', filter='all', forced=null, drag=null, modalKind=null, modalRide=null, ageOpen=null, returnFocus=null;
try { state=VP3.sanitizeState(JSON.parse(localStorage.getItem(KEY)||'null')); } catch { state=VP3.emptyState();storageOK=false; }
let realBaseline=state.selections.real.slice();
try { const test='vp.swipe.storage-test';localStorage.setItem(test,'1');localStorage.removeItem(test); } catch {storageOK=false;}
function cleanJournal(raw) {
  const out={version:1,onboard:raw?.onboard===true,modes:{}};
  for(const mode of ['real','demo']) {
    const allowed=(mode==='demo'?VP3.demoRides:VP3.realRides).map(r=>r.id), part=raw?.modes?.[mode];
    const decisions={};for(const [id,value] of Object.entries(part?.decisions||{})) if(allowed.includes(id)&&['yes','no'].includes(value))decisions[id]=value;
    const history=(Array.isArray(part?.history)?part.history:[]).filter(h=>h&&allowed.includes(h.id)&&typeof h.selected==='boolean'&&(h.previous===null||['yes','no'].includes(h.previous))).slice(-50);
    out.modes[mode]={decisions,history};
  }return out;
}
try{journal=cleanJournal(JSON.parse(localStorage.getItem(JOURNEY)||'null'));}catch{journal=cleanJournal(null);storageOK=false;}
const params=new URLSearchParams(location.search);
if(['real','demo'].includes(params.get('mode'))) state.mode=params.get('mode');
const linked=lookup(params.get('ride'));if(linked){state.mode=linked.fictional?'demo':'real';forced=linked.id;}
if(location.hash==='#plan')view='list';
if(params.get('view')==='catalog')view='catalog';
let showOnboard=!journal.onboard, search='', settling=null, dragFrame=0;
const gestureSettings={distanceRatio:.14,minDistance:44,maxDistance:56,flickDistance:32,flickSpeed:.42,velocityWindow:90};
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const selected = () => state.selections[state.mode];
const part = () => journal.modes[state.mode];
const rides = () => state.mode==='demo'?VP3.demoRides:VP3.realRides;
const pluralCards=n=>n%10===1&&n%100!==11?'карточка':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'карточки':'карточек';
const money=n=>new Intl.NumberFormat('ru-RU').format(n)+' ֏';
const age=p=>p.role==='adult'?'18+':p.age===null?'возраст не указан':p.age===0?'до года':p.age+' лет';
const joinNames=values=>values.length<2?values.join(''):values.slice(0,-1).join(', ')+' и '+values.at(-1);
function familySummary(){
 const adults=state.party.filter(p=>p.role==='adult').length,children=state.party.filter(p=>p.role==='child'),parts=[];
 if(adults)parts.push(adults+' '+(adults===1?'взрослый':'взрослых'));
 if(children.length){const ages=children.slice(0,3).map(p=>p.age===null?'возраст не указан':p.age===0?'до года':String(p.age));const allNumbers=children.slice(0,3).every(p=>p.age!==null&&p.age>0);parts.push((children.length===1?'ребёнок ':'дети ')+joinNames(ages)+(allNumbers?' лет':'')+(children.length>3?' · ещё '+(children.length-3):''));}
 return parts.join(' · ')||'Для себя или семьи';
}
const childChecks=r=>state.party.filter(p=>p.role==='child').map(p=>({p,a:VP3.admission(r,p)}));
const childLabel=p=>p.age===null?esc(p.label):p.age===0?'Ребёнок до года':'Ребёнок '+p.age+' лет';
function hasAdultRights(r){return state.cart.lines.some(l=>l.quantity>0&&(l.productId==='package5'&&VP3.products.package5.includedRideIds.includes(r.id)||state.party.some(p=>p.id===l.personId&&p.role==='adult')&&(l.productId==='ticket'&&l.rideId===r.id||l.productId==='unlimited'&&VP3.products.unlimited.includedRideIds.includes(r.id))));}
function cardPrice(r){
 if(r.price===null)return '';
 if(!VP3.admissionRules[r.id])return `<p class="sp-price">${money(r.price)}<small>базовое катание</small></p>`;
 const checks=childChecks(r),accompanied=checks.some(x=>x.a.needsCompanion&&x.a.status!=='blocked'),unknown=checks.some(x=>x.a.status!=='blocked'&&(x.a.priceNeedsHeight||x.p.age===null));
 const amount=accompanied?r.price+(VP3.admissionRules[r.id]?.adultPrice??r.price):r.price;
 return `<p class="sp-price">${unknown&&!accompanied?'От ':''}${money(amount)}<small>${accompanied?(hasAdultRights(r)?'новая пара без учёта прав':'ребёнок + взрослый'):unknown?'сопровождение уточним':'за одного'}</small></p>`;
}
const generated=r=>Boolean(r.photo?.startsWith('assets/demo-'));
const sourceLabel=r=>r.fictional?(generated(r)?'Учебный пример · изображение сгенерировано':'Учебные условия · фото парка'):r.photo?'Фото парка · действующие условия уточняются':'Изображение не указано';
const meta={
 'demo-water-swan':{tag:'По воде, не спеша',text:'Небольшое водное путешествие и спокойный ритм.'},
 'demo-wheel-of-happiness':{tag:'Посмотреть на всё сверху',text:'Поднимайтесь над парком и делитесь впечатлениями.'},
 'demo-autodrom':{tag:'Кто за рулём?',text:'Повороты, манёвры и весёлая поездка за рулём.'},
 'demo-mars-ride':{tag:'Космическое настроение',text:'Попробуйте приключение с ощущением полёта.'},
 'demo-planet':{tag:'В своей орбите',text:'Кружение и новые впечатления на каждом повороте.'},
 'demo-moto-ufo':{tag:'Чуть больше драйва',text:'Фантастическое приключение для любителей движения.'},
 'demo-pendulum':{tag:'Выше и смелее',text:'Раскачивание, высота и приятное волнение.'},
 'demo-rotating-tower':{tag:'Новый взгляд на парк',text:'Кружение на высоте для тех, кто любит поострее.'},
 'demo-rocket':{tag:'Готовы к путешествию?',text:'Выбирайте приключение с космическим настроением.'},
 'demo-vr-cinema':{tag:'В другой мир',text:'Переключитесь с прогулки на виртуальные впечатления.'},
 'demo-calm':{tag:'Маленькое путешествие',text:'Неспешная поездка и время рассмотреть всё вокруг.'},
 'demo-thrill':{tag:'За порцией адреналина',text:'Разгон, повороты и тот самый восторг на спуске.'},
 'demo-together':{tag:'Кружимся и смеёмся',text:'Выбирайте чашку и отправляйтесь в весёлый круговорот.'},
 'demo-small':{tag:'Первое приключение',text:'Знакомая карусель для маленьких исследователей.'},
 'demo-unknown':{tag:'Навстречу ветру',text:'Круг за кругом, с ощущением полёта над землёй.'},
};
function persist(){try{const u=new URL(location.href);u.searchParams.set('mode',state.mode);if(view==='catalog')u.searchParams.set('view','catalog');else u.searchParams.delete('view');if(view==='list')u.hash='plan';else if(u.hash==='#plan')u.hash='';if(!forced)u.searchParams.delete('ride');history.replaceState({...history.state,vpSwipeMode:state.mode,vpSwipeView:view},'',u.pathname+u.search+u.hash);}catch{}try{if(window.VPJourneySync){const result=VPJourneySync('local',{a:{before:realBaseline,after:state.selections.real}},{aState:state});if(!result?.ok)throw new Error('Interest storage unavailable');}else localStorage.setItem(KEY,JSON.stringify(state));state.selections.real=VP3.sanitizeState(JSON.parse(localStorage.getItem(KEY))).selections.real;realBaseline=state.selections.real.slice();localStorage.setItem(JOURNEY,JSON.stringify(journal));}catch{storageOK=false;}}
function announce(text){$('#sp-status').textContent='';requestAnimationFrame(()=>{$('#sp-status').textContent=text;});}
function familyMatch(r){return state.party.filter(p=>p.role==='child'&&VP3.ageHint(r,p).status==='suggested');}
function candidates(){return rides().filter(r=>filter==='all'||r.intensity===filter).slice().sort((a,b)=>familyMatch(b).length-familyMatch(a).length);}
function pending(){const list=candidates().filter(r=>!part().decisions[r.id]&&!selected().includes(r.id));const r=lookup(forced);return r&&rides().includes(r)?[r,...list.filter(x=>x.id!==r.id)]:list;}
function summary(r){if(!r.rules)return 'Условия допуска уточняются';const a=VP3.admissionRules[r.id];return `${a?'Возраст '+a.minAge+(a.maxAge===null?'+':'-'+a.maxAge)+' лет · ':''}Рост ${r.rules.min}-${r.rules.max} см`;}
function accompanimentRule(r){const a=VP3.admissionRules[r.id];if(!a||!r.rules)return '';const parts=[];if(a.soloAge>a.minAge)parts.push('до '+a.soloAge+' лет');if(r.rules.soloMin>r.rules.min)parts.push('ниже '+r.rules.soloMin+' см');return parts.length?'Взрослый 18+ нужен '+parts.join(' или ')+'. Его катание оплачивается.':'';}
function admissionNote(r){
 if(!r.fictional)return '<p class="sp-admission">Допуск и стоимость уточняются у парка.</p>';
 if(!VP3.admissionRules[r.id])return '<p class="sp-admission">Условия и полная цена с сопровождением уточняются.</p>';
 const checks=childChecks(r),accompanied=checks.filter(x=>x.a.needsCompanion&&x.a.status!=='blocked'),blocked=checks.filter(x=>x.a.status==='blocked'),unknown=checks.filter(x=>x.a.status!=='blocked'&&(x.a.priceNeedsHeight||x.p.age===null));
 return `${accompanied.length?`<p class="sp-admission"><strong>${joinNames(accompanied.map(x=>childLabel(x.p)))}: только со взрослым 18+</strong><span>Одно совместное катание.${hasAdultRights(r)?' Права в заказе учтём при покупке.':''}</span></p>`:''}${blocked.length?`<p class="sp-admission sp-admission-blocked">Не подходит по учебным условиям: ${joinNames(blocked.map(x=>childLabel(x.p)))}.</p>`:''}${unknown.length?`<p class="sp-admission">${joinNames(unknown.map(x=>childLabel(x.p)))}: ${unknown.some(x=>x.p.age===null)?'уточните возраст':'уточните рост'} для сопровождения и полной цены.</p>`:''}${!checks.length&&accompanimentRule(r)?'<p class="sp-admission">Для ребёнка может понадобиться платное сопровождение. Условия ниже.</p>':''}`;
}
function availability(r){return r.fictional?'':`<div class="sp-availability" data-availability-catalog-id="${esc(r.id)}"><small>Учебный статус работы</small><a class="catalog-status unknown" href="availability.html">Уточняем</a><p class="catalog-status-detail">Проверяем сведения.</p></div>`;}
function familyChanged(){state=VP3.reconcileCompanions(state).state;persist();}

function image(r,cls='',priority=false,eager=false){const stem=r.photo?.replace('.webp','');return r.photo?`<img class="${cls}" src="${esc(r.photo)}" ${generated(r)?`srcset="${stem}-thumb.webp 160w, ${stem}-small.webp 400w, ${stem}.webp 720w" sizes="${cls==='sp-thumb'?'64px':'(max-width: 640px) 100vw, 460px'}"`:''} alt="${esc(generated(r)?'Учебная иллюстрация: '+r.name:r.name)}" width="560" height="350" ${priority?'fetchpriority="high" loading="eager"':eager?'fetchpriority="low" loading="eager"':'loading="lazy"'} draggable="false">`:`<span class="${cls} sp-image-fallback" role="img" aria-label="Изображение не указано">Изображение не указано</span>`;}
function card(r,preview=false){
 const m=meta[r.id],fits=familyMatch(r);
 return `<article class="sp-card${preview?' sp-card-next':''}" ${preview?'data-next-card aria-hidden="true" inert':'data-swipe-card'} data-ride="${r.id}" aria-label="${esc(r.name)}">
 <div class="sp-photo">${image(r,'',!preview,preview)}<span class="sp-tag">${esc(m?.tag||'Аттракцион парка')}</span><span class="sp-stamp sp-stamp-no" aria-hidden="true">Не нравится</span><span class="sp-stamp sp-stamp-yes" aria-hidden="true">В мой список ${icon('heart')}</span></div>
 <div class="sp-card-body"><div class="sp-card-title"><h2>${esc(r.name)}</h2>${cardPrice(r)}</div>${admissionNote(r)}
 <p class="sp-description">${esc(m?.text||'Посмотрите детали и сохраните, если хочется попробовать.')}</p>
 <div class="sp-facts"><span>${r.intensity==='calm'?'Спокойно':r.intensity==='exciting'?'Острые ощущения':'Ощущения уточняются'}</span><span>${r.ageRange?`Ориентир ${r.ageRange[0]}-${r.ageRange[1]} лет`:'Возраст уточняется'}</span></div>
 <div class="sp-conditions"><p>${esc(summary(r))}${accompanimentRule(r)?`<small>${esc(accompanimentRule(r))}</small>`:''}${fits.length?`<small>В возрастном ориентире: ${fits.map(p=>esc(p.label)).join(', ')}</small>`:''}</p>${preview?`<span class="sp-btn sp-text">${icon('info')}<span>Условия</span></span>`:btn('details',icon('info')+'<span>Условия</span>','sp-text',`data-ride="${r.id}" aria-label="Условия: ${esc(r.name)}"`)}</div>
 ${availability(r)}<p class="sp-source">${esc(sourceLabel(r))}</p></div></article>`;
}
function plan(){const items=selected().map(lookup).filter(Boolean);return `<div class="sp-plan-head"><div><p class="sp-eyebrow">Выбрано вами</p><h2>Хочу покататься <span>${items.length}</span></h2></div>${view==='list'?btn('swipe',icon('back')+'К карточкам','sp-text'):''}</div>${items.length?`<ul class="sp-plan-items">${items.map(r=>`<li>${image(r,'sp-thumb')}<div><button class="sp-plan-name" data-sp="details" data-ride="${r.id}">${esc(r.name)}</button><p>${esc(summary(r))}</p>${admissionNote(r)}${availability(r)}</div>${btn('remove',icon('x'),'sp-icon',`data-ride="${r.id}" aria-label="Убрать ${esc(r.name)} из списка"`)}</li>`).join('')}</ul><div class="sp-plan-end"><p>Решите, как хотите кататься. Лайки остаются списком интересов.</p><a class="sp-primary sp-company-link" href="company.html">Рассчитать для нас ${icon('arrow')}</a><a class="sp-btn sp-flexible-link" href="company.html?mode=flexible">Выберем на месте</a><a class="sp-primary sp-ticket-link" href="${ticketLink()}">${state.mode==='real'?'Уточнить у парка':'Выбрать билеты'} ${icon('arrow')}</a><small>Список сохранится. Лайк не подтверждает допуск.</small></div>`:`<div class="sp-plan-empty"><span class="sp-empty-heart">${icon('heart')}</span><h3>Здесь будет ваш день</h3><p>Сохраняйте то, что хочется попробовать. Всё выбранное останется под рукой.</p>${view==='list'?btn('swipe','Выбрать аттракционы','sp-primary'):''}</div>`}`;}
function mobileHeader(list){
 return `<div class="sp-mobile-header">${btn('catalog',icon('back'),'sp-mobile-exit','aria-label="Открыть каталог"')}<div class="sp-mobile-heading"><h1>Аттракционы</h1><button type="button" class="sp-demo-label" data-vp-about>Учебный пример</button></div>${btn('list',icon('heart')+'<span>Мой список</span><b>'+selected().length+'</b>','sp-mobile-list','aria-label="Мой список: '+selected().length+'"')}</div>
 <nav class="picker-switch" aria-label="Формат выбора"><a href="reels.html?mode=${state.mode}" data-picker="reels"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="3" width="12" height="18" rx="3"/><path d="m10 9 4 3-4 3Z"/></svg>Reels</a><a href="attractions.html?mode=${state.mode}" data-picker="tinder" aria-current="page"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="3" width="13" height="18" rx="3"/><path d="M3 7v10"/></svg>Tinder</a></nav>
 <div class="sp-mobile-tools">${btn('settings',icon('settings')+'<span>Параметры</span>','sp-mobile-settings','id="sp-settings" aria-label="Параметры: фильтры и семья"')}<div class="sp-mobile-hint" data-onboarding="${showOnboard}">${showOnboard?'<p><span>← Не нравится</span><span>Нравится →</span></p>':`<p>${list.length?'Ещё '+list.length+' '+pluralCards(list.length):'Выбор за вами'}</p>`}${btn('family',esc(familySummary()),'sp-mobile-family','id="sp-mobile-family" aria-label="Изменить семью: '+esc(familySummary())+'"')}</div>${btn('help',icon('info'),'sp-mobile-help','aria-label="Как выбирать"')}</div>`;
}
function ticketLink(){return state.mode==='real'?'index.html#visit':'quick.html?product=single'+(selected()[0]?'&ride='+encodeURIComponent(selected()[0]):'');}
function ticketContinue(){return `<div class="sp-ticket-continue">${btn('list','Выбрано: '+selected().length,'sp-text')}<a class="sp-primary" href="${ticketLink()}">${state.mode==='real'?'Уточнить у парка':'Выбрать билеты'} ${icon('arrow')}</a></div>`;}
function render(){
 cancelGesture();
 if(settling){const current=settling;settling=null;current.animation?.cancel();}
 $('#sp-root').removeAttribute('aria-busy');
 const activeId=document.activeElement?.id, activeData=document.activeElement?.dataset?.sp?{...document.activeElement.dataset}:null;
 const list=pending(),r=list[0],done=Object.keys(part().decisions).length, no=Object.values(part().decisions).filter(v=>v==='no').length;
 $('#sp-root').innerHTML=`${mobileHeader(list)}<div class="sp-intro"><div><p class="sp-eyebrow">Victory Park · Ереван</p><h1>На чём прокатимся?</h1><p class="sp-intro-copy">Выбирайте сердцем. Сохраняйте одним движением.</p></div><div class="sp-top-actions">${btn('help',icon('info')+'Как выбирать','sp-text','id="sp-help"')}${btn('list',icon('heart')+`<span>Мой список <b>${selected().length}</b></span>`,'sp-list-button','id="sp-show-list"')}</div></div>
 <div class="sp-notices">${!storageOK?'<p class="sp-warning" role="alert">Выбор доступен в этой вкладке, но браузер не даёт его сохранить. При переходе к билетам или обновлении он может потеряться.</p>':''}${state._issues?.length?'<p class="sp-warning">Часть прежних данных повреждена. Проверьте семью и список.</p>':''}</div>
 <div class="sp-toolbar"><div class="sp-views" aria-label="Способ выбора">${btn('swipe',icon('cards')+'Карточки',view==='swipe'?'is-active':'',`id="sp-view-swipe" aria-pressed="${view==='swipe'}"`)}${btn('catalog',icon('grid')+'Каталог',view==='catalog'?'is-active':'',`id="sp-view-catalog" aria-pressed="${view==='catalog'}"`)}</div>${btn('family',icon('people')+`<span>${esc(familySummary())}</span>`,'sp-family-button','id="sp-family"')}</div>
 <div class="sp-layout ${view==='list'?'is-list':''}"><section class="sp-selection" ${view==='list'?'hidden':''} aria-label="Выбор аттракционов">
 <div class="sp-filter-row" aria-label="Впечатления">${[['all','Все'],['calm','Спокойно'],['exciting','Поострее']].map(([id,label])=>btn('filter',label,filter===id?'is-active':'',`data-filter="${id}" aria-pressed="${filter===id}"`)).join('')}</div>
 ${view==='swipe'?`${showOnboard?`<div class="sp-onboard"><div><strong>Два движения. Ваш выбор.</strong><p><span>← Не нравится</span><span>Нравится →</span></p><small>Можно нажимать кнопки. Любое решение легко отменить.</small></div>${btn('dismiss',icon('x'),'sp-icon','aria-label="Скрыть подсказку"')}</div>`:''}<div class="sp-deck" id="sp-deck">${r?`${list[1]?card(list[1],true):''}${card(r)}`:`<div class="sp-finished"><span class="sp-finished-icon">${icon(selected().length?'check':'cards')}</span><p class="sp-eyebrow">${selected().length?'Выбор за вами':'Можно попробовать иначе'}</p><h2>${selected().length?'Всё интересное<br>уже в списке':'Пока ничего<br>не приглянулось'}</h2><p>${filter!=='all'?'В этой категории карточки закончились. Посмотрите остальные впечатления.':selected().length?'Вернитесь к любимым или посмотрите то, что пропустили.':'Пересмотрите пропущенное или загляните в каталог.'}</p>${selected().length?btn('list',`Посмотреть список · ${selected().length}`,'sp-primary'):btn('catalog','Открыть каталог','sp-primary')}${filter!=='all'?btn('filter','Показать все', 'sp-text','data-filter="all"'):''}${no?btn('review-no',`Пересмотреть пропущенные · ${no}`,'sp-text'):''}</div>`}</div>
 <div class="sp-action-dock"><div class="sp-decision-row">${btn('no',icon('x')+'<span>Не нравится</span>','sp-decision sp-no',`id="sp-no" ${!r?'disabled':''}`)}${btn('undo',icon('undo')+'<span>Вернуть</span>','sp-undo',`id="sp-undo" ${!part().history.length?'disabled':''} aria-label="Отменить последнее решение"`)}${btn('yes',icon('heart')+'<span>Нравится</span>','sp-decision sp-yes',`id="sp-yes" ${!r?'disabled':''}`)}</div>${selected().length?ticketContinue():''}</div><div class="sp-progress"><span>${r?`Ещё ${list.length} ${pluralCards(list.length)}`:'Карточки просмотрены'}</span>${no?btn('review-no',`Пропущено ${no}`,'sp-text'):''}<span class="sp-keyboard-hint">← → выбор · Backspace отмена</span></div>`:
 `<label class="sp-search-label" for="sp-search">Знаете, что ищете?</label><input id="sp-search" class="sp-search" type="search" placeholder="Название аттракциона" value="${esc(search)}" autocomplete="off"><div class="sp-catalog">${candidates().filter(r=>r.name.toLocaleLowerCase('ru').includes(search.toLocaleLowerCase('ru'))).map(r=>`<article class="sp-catalog-card">${image(r)}<div><h2>${esc(r.name)}</h2><p>${r.price!==null?money(r.price)+' за катание · ':''}${r.intensity==='calm'?'Спокойно':r.intensity==='exciting'?'Острые ощущения':'Ощущения уточняются'}</p><p>${r.ageRange?'Ориентир '+r.ageRange[0]+'-'+r.ageRange[1]+' лет':'Возраст уточняется'}<br>${esc(summary(r))}</p><small>${esc(sourceLabel(r))}</small>${admissionNote(r)}${availability(r)}<div class="sp-catalog-actions">${btn('toggle',icon(selected().includes(r.id)?'check':'heart')+(selected().includes(r.id)?'В списке':'Нравится'),selected().includes(r.id)?'is-selected':'',`data-ride="${r.id}" aria-pressed="${selected().includes(r.id)}"`)}${btn('details','Условия','sp-text',`data-ride="${r.id}"`)}</div>${btn('open-card','Открыть карточку →','sp-text',`data-ride="${r.id}"`)}</div></article>`).join('')||'<p class="sp-empty-filter">Ничего не нашлось. Попробуйте другое название или выберите «Все».</p>'}</div>`}
 </section><aside class="sp-plan" id="sp-plan" aria-label="Хочу покататься" tabindex="-1">${plan()}</aside></div>
 <p class="sp-bottom-note">Выбор останется в этом браузере. Возраст помогает сориентироваться, условия допуска проверяются отдельно.</p>`;
 document.body.dataset.spView=view;document.body.dataset.mode=state.mode;document.body.classList.toggle('sp-has-selection',selected().length>0);
 if(view==='catalog'&&selected().length)$('#sp-root').insertAdjacentHTML('beforeend',`<div class="sp-action-dock sp-catalog-dock">${ticketContinue()}</div>`);
 const cartCount=state.cart.lines.reduce((n,l)=>n+l.quantity,0);document.querySelectorAll('#cart-count,[data-mobile-cart-count]').forEach(el=>el.textContent=cartCount?' ('+cartCount+')':'');
 if(activeId&&document.getElementById(activeId))document.getElementById(activeId).focus({preventScroll:true});else if(activeData){[...document.querySelectorAll('#sp-root [data-sp]')].find(n=>Object.entries(activeData).every(([k,v])=>n.dataset[k]===v))?.focus({preventScroll:true});}
 if(r){const next=list[1];if(next?.photo){const im=new Image();im.src=generated(next)?next.photo.replace('.webp','-small.webp'):next.photo;}}
 document.dispatchEvent(new CustomEvent('vp:catalog-rendered'));
 bindDrag();
}
// Animate the actual top card. Rebuild the UI only after its compositor animation,
// so storage and template work cannot interrupt the hand-off between cards.
function decide(yes){
 if(view!=='swipe')return;
 if(settling)render();
 const r=pending()[0],card=$('[data-swipe-card]');if(!r)return;
 cancelGesture(false);
 part().history.push({id:r.id,selected:selected().includes(r.id),previous:part().decisions[r.id]||null});part().history=part().history.slice(-50);
 part().decisions[r.id]=yes?'yes':'no';
 state.selections[state.mode]=yes?[...new Set([...selected(),r.id])]:selected().filter(id=>id!==r.id);
 journal.onboard=true;showOnboard=false;forced=null;
 const message=`${r.name}: ${yes?'добавлено в список':'пропущено'}. В списке ${selected().length}. ${pending()[0]?'Следующая карточка: '+pending()[0].name:'Карточки закончились.'}`;
 if(!card||reduced.matches||!card.animate){persist();render();announce(message);return;}
 const run={animation:null};settling=run;card.classList.add('is-settling');$('#sp-root').setAttribute('aria-busy','true');
 const from=card.style.transform||'translate3d(0px,0px,0px) rotate(0deg)';
 const distance=(card.offsetWidth+80)*(yes?1:-1);
 run.animation=card.animate([{transform:from,opacity:1},{transform:`translate3d(${distance}px,0,0) rotate(${yes?8:-8}deg)`,opacity:.65}],{duration:200,easing:'cubic-bezier(.2,.75,.3,1)',fill:'forwards'});
 // Persist the decision on the next task; the exit animation is already running.
 setTimeout(persist,0);
 run.animation.finished.then(()=>{if(settling!==run)return;settling=null;render();announce(message);}).catch(()=>{});
}
function undo(){if(settling){render();}const h=part().history.pop();if(!h)return;state.selections[state.mode]=h.selected?[...new Set([...selected(),h.id])]:selected().filter(id=>id!==h.id);if(h.previous)part().decisions[h.id]=h.previous;else delete part().decisions[h.id];forced=h.id;filter='all';persist();render();announce('Решение отменено. '+lookup(h.id).name);}
function paintDrag(d){
 d.card.style.transform=`translate3d(${d.dx}px,${reduced.matches?0:Math.max(-8,Math.min(8,d.dy*.12))}px,0) rotate(${reduced.matches?0:Math.max(-8,Math.min(8,d.dx/35))}deg)`;
 d.card.style.setProperty('--yes',Math.min(1,Math.max(0,d.dx/d.threshold)));
 d.card.style.setProperty('--no',Math.min(1,Math.max(0,-d.dx/d.threshold)));
}
function cancelGesture(reset=true){
 const d=drag;drag=null;if(dragFrame){cancelAnimationFrame(dragFrame);dragFrame=0;}if(!d)return;
 d.card.classList.remove('is-dragging');
 if(d.card.hasPointerCapture(d.id))d.card.releasePointerCapture(d.id);
 if(reset){d.card.style.transform='';d.card.style.setProperty('--yes','0');d.card.style.setProperty('--no','0');}
}
function bindDrag(){
 const card=$('[data-swipe-card]');if(!card)return;
 card.addEventListener('pointerdown',e=>{
  if(e.isPrimary===false){cancelGesture();return;}
  if(settling||e.button!==0||e.target.closest('button,a,input,select,summary'))return;
  const t=performance.now();drag={id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,dy:0,locked:false,card,threshold:Math.max(gestureSettings.minDistance,Math.min(gestureSettings.maxDistance,card.clientWidth*gestureSettings.distanceRatio)),samples:[{x:0,t}],lastMove:t};
 });
 card.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;const d=drag,t=performance.now();
  d.dx=e.clientX-d.x;d.dy=e.clientY-d.y;d.lastMove=t;
  d.samples.push({x:d.dx,t});while(d.samples.length>2&&d.samples[0].t<t-gestureSettings.velocityWindow)d.samples.shift();
  if(!d.locked){
   // A thumb arc can start vertically. Keep waiting for horizontal intent;
   // native scrolling in the text area cancels through pointercancel instead.
   if(Math.abs(d.dx)>=8&&Math.abs(d.dx)>Math.abs(d.dy)*.9){d.locked=true;card.setPointerCapture(e.pointerId);card.classList.add('is-dragging');}
  }
  if(!d.locked)return;
  if(!dragFrame)dragFrame=requestAnimationFrame(()=>{dragFrame=0;if(d===drag)paintDrag(d);});
 });
 const finish=(e,cancel)=>{
  if(!drag||e.pointerId!==drag.id)return;const d=drag;
  if(d.locked)paintDrag(d);
  const first=d.samples[0],last=d.samples.at(-1),speed=performance.now()-d.lastMove>100?0:(last.x-first.x)/Math.max(1,last.t-first.t);
  const commit=!cancel&&d.locked&&(Math.abs(d.dx)>=d.threshold||(Math.abs(d.dx)>=gestureSettings.flickDistance&&Math.abs(speed)>gestureSettings.flickSpeed&&Math.sign(speed)===Math.sign(d.dx)));
  cancelGesture(!commit);if(commit)decide(d.dx>0);
 };
 card.addEventListener('pointerup',e=>finish(e,false));
 card.addEventListener('pointercancel',e=>finish(e,true));
 card.addEventListener('lostpointercapture',e=>{if(e.target===card&&drag)finish(e,true);});
}
function openModal(kind,id){cancelGesture();modalKind=kind;modalRide=id;returnFocus={id:document.activeElement?.id,data:{...document.activeElement?.dataset}};$('#sp-dialog').dataset.kind=kind;renderModal();if(!$('#sp-dialog').open)$('#sp-dialog').showModal();}
function renderModal(){const d=$('#sp-dialog-body'),scrollTop=d.querySelector('.sp-family-scroll')?.scrollTop||0,focused=document.activeElement?.id,focusedData=document.activeElement?.dataset?.sp?{...document.activeElement.dataset}:null;
 if(modalKind==='details'){const r=lookup(modalRide);d.innerHTML=`<p class="sp-eyebrow">${r.fictional?'Учебные условия':'Аттракцион парка'}</p><h2 id="sp-dialog-title">${esc(r.name)}</h2><p>${esc(meta[r.id]?.text||'Условия уточняются у парка.')}</p><div class="sp-rule-box"><h3>Рост и сопровождение</h3><p>${r.rules?esc(summary(r)+'. '+accompanimentRule(r)):'Подтверждённых правил пока нет. Уточните их у парка до катания.'}</p><p>Возрастной ориентир не заменяет ростовой допуск. Работу аттракциона проверяют в день посещения.</p></div>${state.party.length?`<h3>Для вашей семьи</h3><div class="sp-eligibility">${state.party.map(p=>{const result=VP3.admission(r,p);return `<div><strong>${esc(p.label)} · ${esc(age(p))}</strong><p>${esc(VP3.ageHint(r,p).text)}</p><label for="sp-height-${p.id}">Рост, см <input id="sp-height-${p.id}" data-height="${p.id}" type="text" inputmode="decimal" value="${p.height??''}" placeholder="Не знаю" autocomplete="off"></label><p id="sp-height-error-${p.id}" class="sp-field-note">${esc(result.reasons.join(' '))}</p></div>`;}).join('')}</div>`:''}<p class="sp-small">${r.fictional?'Числа вымышлены для демонстрации интерфейса. Это не условия Victory Park.':'Неизвестность не означает, что катание разрешено.'}</p>`;}
 else if(modalKind==='settings'){d.innerHTML=`<p class="sp-eyebrow">Выбирайте под себя</p><h2 id="sp-dialog-title">Параметры</h2><h3>Какие впечатления?</h3><div class="sp-sheet-filters">${[['all','Все'],['calm','Спокойно'],['exciting','Поострее']].map(([id,label])=>btn('filter',label,filter===id?'is-active':'',`data-filter="${id}" aria-pressed="${filter===id}"`)).join('')}</div><h3>Кто идёт в парк?</h3><p>${state.party.length?esc(familySummary()):'Можно начать без заполнения. Состав семьи поможет с возрастными ориентирами.'}</p>${btn('family',icon('people')+(state.party.length?'Изменить семью':'Для себя или семьи'),'sp-sheet-family','id="sp-sheet-family"')}<p class="sp-small">Лайк сохраняет желание. Рост и сопровождение проверяются в условиях аттракциона.</p>${Object.values(part().decisions).includes('no')?btn('review-no','Пересмотреть пропущенные','sp-sheet-review'):''}${btn('close','К карточкам','sp-primary')}`;}
 else if(modalKind==='family'){d.innerHTML=`<header class="sp-family-heading"><p class="sp-eyebrow">Подборка для вас</p><h2 id="sp-dialog-title">Кто идёт в парк?</h2><p>Укажите детей и их возраст. Можно пропустить.</p></header><div class="sp-family-scroll"><div class="sp-party">${state.party.map(p=>`<section class="sp-person"><div><strong>${esc(p.label)}</strong>${btn('remove-person',icon('x'),'sp-icon',`data-person="${p.id}" aria-label="Убрать ${esc(p.label)}"`)}</div>${p.role==='adult'?'<span class="sp-age-label">18+</span>':`${btn('age',esc(age(p))+' · Изменить','sp-age-label',`id="sp-age-${p.id}" data-person="${p.id}" aria-expanded="${ageOpen===p.id}"`)}${ageOpen===p.id?`<div class="sp-age-grid" aria-label="Возраст ребёнка">${Array.from({length:18},(_,n)=>btn('set-age',n===0?'До года':String(n),'',`data-person="${p.id}" data-age="${n}" aria-label="${n===0?'До года':n+' лет'}" aria-pressed="${p.age===n}"`)).join('')}${btn('set-age','Не знаю','',`data-person="${p.id}" data-age="unknown"`)}</div>`:''}`}</section>`).join('')}</div><div class="sp-add-people">${btn('add-adult','+ Взрослый','',state.party.length>=8?'disabled':'')}${btn('add-child','+ Ребёнок','',state.party.length>=8?'disabled':'')}</div><p class="sp-small">Возраст помогает выбрать интересное. Рост и сопровождение проверяются в условиях аттракциона.</p></div><footer class="sp-family-done">${btn('close','Готово, к аттракционам','sp-primary')}</footer>`;}
 else {d.innerHTML=`<p class="sp-eyebrow">Выбирать легко</p><h2 id="sp-dialog-title">Соберите свой день</h2><div class="sp-help-demo" aria-hidden="true"><span>←</span><span>${icon('cards')}</span><span>→</span></div><div class="sp-help-steps"><p><strong>Влево: не нравится.</strong> Пропускайте то, что сейчас не хочется.</p><p><strong>Вправо: нравится.</strong> Аттракцион попадёт в «Мой список».</p><p><strong>Передумали?</strong> Нажмите «Вернуть». Можно пользоваться кнопками вместо свайпов.</p></div><p>После первого сохранения можно перейти к билетам. Не обязательно смотреть все карточки; список доступен отдельно.</p>${btn('close','Понятно, начинаем','sp-primary')}`;}
 if(modalKind==='family')d.querySelector('.sp-family-scroll').scrollTop=scrollTop;
 if(focused&&document.getElementById(focused))document.getElementById(focused).focus({preventScroll:true});else if(focusedData){[...d.querySelectorAll('[data-sp]')].find(n=>Object.entries(focusedData).every(([k,v])=>n.dataset[k]===v))?.focus({preventScroll:true});}
}
function switchView(next){view=next;persist();render();if(next==='list'){$('#sp-plan').focus({preventScroll:true});$('#sp-plan').scrollIntoView({block:'start',behavior:reduced.matches?'instant':'smooth'});}else window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});}
document.addEventListener('click',e=>{
 if(e.target.closest('a[data-picker]')) {
  persist();
  if(!storageOK) {e.preventDefault();render();announce('Не удалось сохранить выбор. Продолжайте на этой странице, чтобы не потерять его.');}
  return;
 }
 const b=e.target.closest('[data-sp]');if(!b||b.disabled)return;const a=b.dataset.sp,id=b.dataset.ride,pid=b.dataset.person;
 if(a==='yes'||a==='no'){decide(a==='yes');return;}if(a==='undo'){undo();return;}
 if(['swipe','catalog','list'].includes(a)){switchView(a);return;}
 if(a==='settings'){openModal('settings');return;}if(a==='help'){openModal('help');return;}if(a==='family'){openModal('family');return;}if(a==='details'){openModal('details',id);return;}
 if(a==='close'){$('#sp-dialog').close();return;}
 if(a==='dismiss'){showOnboard=false;journal.onboard=true;persist();render();return;}
 if(a==='filter'){filter=b.dataset.filter;forced=null;render();if($('#sp-dialog').open)renderModal();return;}
 if(a==='open-card'){forced=id;filter='all';switchView('swipe');return;}
 if(a==='review-no'){if($('#sp-dialog').open)$('#sp-dialog').close();for(const [rid,v] of Object.entries(part().decisions))if(v==='no')delete part().decisions[rid];part().history=[];forced=null;filter='all';persist();switchView('swipe');announce('Пропущенные карточки снова доступны.');return;}
 if(a==='toggle'||a==='remove'){const isSelected=selected().includes(id);state.selections[state.mode]=isSelected?selected().filter(x=>x!==id):[...selected(),id];if(isSelected)delete part().decisions[id];else {part().decisions[id]='yes';journal.onboard=true;showOnboard=false;}part().history=[];persist();render();announce(isSelected?'Убрано из списка.':'Добавлено в список.');return;}
 if(a==='mode'){state.mode=state.mode==='demo'?'real':'demo';filter='all';forced=null;persist();switchView('swipe');return;}
 if(a==='age'){ageOpen=ageOpen===pid?null:pid;renderModal();return;}
 if(a==='set-age'){const p=state.party.find(p=>p.id===pid);if(p)p.age=b.dataset.age==='unknown'?null:Number(b.dataset.age);ageOpen=null;familyChanged();render();renderModal();$('#sp-age-'+pid)?.focus({preventScroll:true});return;}
 if(a==='add-adult'||a==='add-child'){if(state.party.length>=8)return;const role=a==='add-child'?'child':'adult';const used=state.party.filter(p=>p.role===role).map(p=>p.label);let n=1;const label=role==='adult'?'Взрослый':'Ребёнок';while(used.includes(label+' '+n))n++;const p={id:'sp-'+crypto.randomUUID(),role,label:label+' '+n,age:null,height:null};state.party.push(p);if(role==='child')ageOpen=p.id;familyChanged();render();renderModal();requestAnimationFrame(()=>{
  const ageButton=$('#sp-age-'+p.id);
  ageButton?.closest('.sp-person')?.scrollIntoView({block:'nearest'});
  // At the participant limit the Add trigger is disabled after rendering.
  if(state.party.length>=8&&modalKind==='family'&&$('#sp-dialog').open){
   const target=ageButton||$('#sp-dialog-body .sp-family-done [data-sp="close"]');
   target?.focus({preventScroll:true});target?.scrollIntoView({block:'nearest'});
  }
 });return;}
 if(a==='remove-person'){state.party=state.party.filter(p=>p.id!==pid);state.riders=state.riders.filter(id=>id!==pid);state.cart.lines=state.cart.lines.filter(l=>l.personId!==pid);if(state.companionId===pid){state.companionId=null;state.companionAutoSelected=false;}if(!state.riders.length)state.ridersConfirmed=false;familyChanged();render();renderModal();announce('Участник и его личные билеты удалены.');return;}
});
document.addEventListener('input',e=>{if(e.target.id==='sp-search'){search=e.target.value;const start=e.target.selectionStart,end=e.target.selectionEnd;render();$('#sp-search').setSelectionRange(start,end);}});
document.addEventListener('change',e=>{if(!e.target.matches('[data-height]'))return;const input=e.target,p=state.party.find(p=>p.id===input.dataset.height);if(!p)return;const raw=input.value.trim().replace(',','.'),n=Number(raw),error=$('#sp-height-error-'+p.id);if(raw!==''&&(!/^\d+(\.\d{1,2})?$/.test(raw)||n<40||n>250)){input.setAttribute('aria-invalid','true');error.textContent='Укажите рост от 40 до 250 см или оставьте пустым.';return;}input.removeAttribute('aria-invalid');p.height=raw===''?null:n;familyChanged();render();error.textContent=VP3.admission(lookup(modalRide),p).reasons.join(' ');announce('Рост сохранён.');});
document.addEventListener('keydown',e=>{if($('#sp-dialog').open&&e.key==='Tab'){const controls=[...$('#sp-dialog').querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(n=>n.getClientRects().length);const first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}return;}if($('#sp-dialog').open||view!=='swipe'||e.altKey||e.ctrlKey||e.metaKey||e.repeat||e.target.closest('input,textarea,select,a,summary'))return;if(e.key==='ArrowRight'){e.preventDefault();decide(true);}else if(e.key==='ArrowLeft'){e.preventDefault();decide(false);}else if(e.key==='Backspace'){e.preventDefault();undo();}});
$('#sp-dialog').addEventListener('click',e=>{if(e.target===$('#sp-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('#sp-dialog').addEventListener('close',()=>{
 modalKind=null;modalRide=null;
 let target=returnFocus?.id?document.getElementById(returnFocus.id):null;
 if(!target&&returnFocus?.data?.sp)target=[...document.querySelectorAll('#sp-root [data-sp]')].find(n=>n.getClientRects().length&&Object.entries(returnFocus.data).every(([k,v])=>n.dataset[k]===v));
 if(!target?.getClientRects().length)target=[...document.querySelectorAll('#sp-settings,#sp-help')].find(n=>n.getClientRects().length);
 target?.focus({preventScroll:true});
});
document.addEventListener('vp:interests',()=>{try{
 const latest=VP3.sanitizeState(JSON.parse(localStorage.getItem(KEY)||'null'));
 if(JSON.stringify(latest.selections.real)===JSON.stringify(state.selections.real))return;
 state.selections.real=latest.selections.real;realBaseline=state.selections.real.slice();journal.modes.real.history=[];
 Object.keys(journal.modes.real.decisions).forEach(id=>{if(journal.modes.real.decisions[id]==='yes'&&!state.selections.real.includes(id))delete journal.modes.real.decisions[id];});
 render();if($('#sp-dialog').open)renderModal();
 }catch{}});
window.addEventListener('storage',e=>{if(e.key===KEY){try{state=VP3.sanitizeState(JSON.parse(e.newValue||'null'));realBaseline=state.selections.real.slice();part().history=[];forced=null;render();if($('#sp-dialog').open)renderModal();announce('Выбор обновлён в другой вкладке.');}catch{}}if(e.key===JOURNEY){try{journal=cleanJournal(JSON.parse(e.newValue||'null'));showOnboard=!journal.onboard;render();}catch{}}});
window.addEventListener('pageshow',e=>{if(e.persisted){try{state=VP3.sanitizeState(JSON.parse(localStorage.getItem(KEY)||'null'));realBaseline=state.selections.real.slice();journal=cleanJournal(JSON.parse(localStorage.getItem(JOURNEY)||'null'));showOnboard=!journal.onboard;if(['real','demo'].includes(history.state?.vpSwipeMode))state.mode=history.state.vpSwipeMode;if(['swipe','catalog','list'].includes(history.state?.vpSwipeView))view=history.state.vpSwipeView;render();}catch{}}});
document.addEventListener('error',e=>{if(e.target.tagName==='IMG'&&e.target.closest('#sp-root')){const fallback=document.createElement('div');fallback.className='sp-image-fallback';fallback.setAttribute('role','img');fallback.setAttribute('aria-label',e.target.alt+'; изображение недоступно');fallback.textContent='Изображение пока недоступно';e.target.replaceWith(fallback);}},true);
persist();render();if(location.hash==='#family')openModal('family');if(linked)announce('Открыта карточка '+linked.name);
window.addEventListener('pagehide',()=>{cancelGesture();persist();});
window.VPSwipe={getState:()=>clone(state),getJourney:()=>clone(journal),getCurrent:()=>pending()[0]?.id||null};
})();
