import {STORAGE,transact,read,captureOrder,selectResume,BUSY} from './store.mjs?vpv=dc29281d0e4a915d';
import {header as siteHeader,footer as siteFooter,decorate,label} from './chrome.mjs?vpv=3c4d356fd494a573';
import {EVENTS, SESSIONS, SEATS, SCENARIOS, defaultState, availability, total, reduce, restore, tick, canHold, isClosed} from './engine.mjs?vpv=bdfd963ca366b2b7';
import {translate} from './i18n.mjs?vpv=447a9564fe565483';
import {quizCopy} from './quiz-copy.mjs?vpv=8b767c720bc9bcdc';
import {issuedSnapshot, startsNewBooking, mapSnapshotFor} from './journey.mjs?vpv=034ecffd3ba4bf7c';


const root=document.querySelector('#app');
const initialQuery=new URLSearchParams(location.search);
const review=initialQuery.get('review')==='1';
const singleSessionDemo=initialQuery.get('single')==='1';
const sessionsFor=id=>{const list=SESSIONS.filter(s=>s.eventId===id);return singleSessionDemo?list.slice(0,1):list;};
let state=defaultState(), ui={view:'events',qtyKnown:false}, mapOpen=false, mapZoom=1, helpOpen=false, copied=false, mapSnapshot=null, lastIssued=null, responseTimer=null;

const locked=()=>readOnly||['processing','unknown','pending','issued','security'].includes(state.phase);
const t=(key,vars)=>translate(state.lang,key,vars);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=value=>new Intl.NumberFormat(state.lang==='hy'?'hy-AM':state.lang==='ru'?'ru-RU':'en-GB',{maximumFractionDigits:0}).format(value)+' ֏';
const dateText=(session,withTime=true)=>{
 const d=new Date(session.at);
 if(state.lang==='hy'){
  const local=new Date(d.getTime()+4*3600000),months=['հունվարի','փետրվարի','մարտի','ապրիլի','մայիսի','հունիսի','հուլիսի','օգոստոսի','սեպտեմբերի','հոկտեմբերի','նոյեմբերի','դեկտեմբերի'],days=['կիրակի','երկուշաբթի','երեքշաբթի','չորեքշաբթի','հինգշաբթի','ուրբաթ','շաբաթ'];
  const date=local.getUTCDate()+' '+months[local.getUTCMonth()]+' '+local.getUTCFullYear();
  return withTime?date+', '+String(local.getUTCHours()).padStart(2,'0')+':'+String(local.getUTCMinutes()).padStart(2,'0'):days[local.getUTCDay()]+', '+date;
 }
 return new Intl.DateTimeFormat(state.lang==='ru'?'ru-RU':'en-GB',{timeZone:'Asia/Yerevan',day:'numeric',month:'long',year:'numeric',...(withTime?{hour:'2-digit',minute:'2-digit'}:{weekday:'long'})}).format(d);
};
const event=()=>EVENTS.find(e=>e.id===state.eventId);
const session=()=>SESSIONS.find(s=>s.id===state.sessionId);
const seatText=seats=>'ABCDEF'.split('').map(row=>{const group=seats.filter(id=>id[0]===row).map(id=>Number(id.slice(1))).sort((a,b)=>a-b);return group.length>1?t('seatsShort',{row,seats:group.join(', ')}):group.length?t('seat',{row,seat:group[0]}):'';}).filter(Boolean).join(' · ');
const contiguous=seats=>{const cols=seats.map(s=>+s.slice(1)).sort((a,b)=>a-b);return seats.length>0&&seats.every(s=>s[0]===seats[0][0])&&cols.every((n,i)=>i===0||n===cols[i-1]+1);};
const btn=(label,action,value='',cls='',extra='')=>`<button type="button" class="btn ${cls}" data-action="${action}" data-value="${esc(value)}" ${extra}>${esc(label)}</button>`;
const link=(label,action,value='')=>`<button type="button" class="link-button" data-action="${action}" data-value="${esc(value)}">${esc(label)}</button>`;

const q=(key,vars={})=>{let value=quizCopy[state.lang]?.[key]??quizCopy.ru[key]??key;for(const [k,v] of Object.entries(vars))value=value.replaceAll('{'+k+'}',String(v));return value;};
const guestCount=n=>n+' '+q(n===1?'guestOne':state.lang==='ru'&&n>=2&&n<=4?'guestFew':'guestMany');
function selectionSignature(){return JSON.stringify([state.eventId,state.sessionId,state.qty,state.seats,state.orderId]);}
function save(){if(state.phase==='issued')lastIssued=issuedSnapshot(state);}
function url(push=false){
 const p=new URLSearchParams({lang:state.lang});
 if(state.eventId)p.set('event',state.eventId);
 if(state.sessionId&&ui.view!=='sessions')p.set('session',state.sessionId);
 if(ui.qtyKnown)p.set('qty',state.qty);
 if(['group','map'].includes(ui.view)&&state.sessionId)p.set('view',ui.view);
 if(resumeId)p.set('resume',resumeId);if(review)p.set('review','1');
 if(singleSessionDemo)p.set('single','1');
 history[push?'pushState':'replaceState']({quizView:ui.view},'',location.pathname+'?'+p);
}
function update(action){state=reduce(state,action);}
function finish({push=false,focus=true}={}){save();url(push);render(focus);}
function release(){if(['payment','declined'].includes(state.phase))update({type:'BACK'});}
function prepare(){if(ui.qtyKnown&&state.sessionId&&['select','payment'].includes(state.phase))update({type:'HOLD'});}
function applyLocation(query,{fresh=false}={}){
 if(['ru','hy','en'].includes(query.get('lang')))update({type:'LANG',value:query.get('lang')});
 if(startsNewBooking(state,query,singleSessionDemo?SESSIONS.filter(item=>item.id.endsWith('-1')):SESSIONS)){lastIssued=issuedSnapshot(state);update({type:'NEW'});ui={view:'events',qtyKnown:false};mapSnapshot=null;}
 if(locked())return;
 const quantity=query.get('qty');
 if(quantity&&/^[1-8]$/.test(quantity)){update({type:'QTY',value:Number(quantity)});ui.qtyKnown=true;}
 
 const requested=SESSIONS.find(s=>s.id===query.get('session'));
 const e=EVENTS.find(e=>e.id===(requested?.eventId||query.get('event')));
 if(!e){if(state.eventId&&state.sessionId){ui.view=ui.qtyKnown?'checkout':'group';prepare();return;}ui={view:'events',qtyKnown:ui.qtyKnown};return;}
 if(e.id!==state.eventId){release();update({type:'EVENT',value:e.id});}
 const choices=sessionsFor(e.id), s=choices.find(x=>x.id===requested?.id)||(choices.length===1?choices[0]:null);
 if(s&&s.id!==state.sessionId){release();update({type:'SESSION',value:s.id});}
 ui.view=!s?'sessions':query.get('view')==='group'?'group':query.get('view')==='map'&&ui.qtyKnown?'map':ui.qtyKnown?'checkout':'group';
 if(['group','sessions','map'].includes(ui.view))release(); else prepare();
}


function header(){return siteHeader(state,'quiz',ui.qtyKnown,resumeId);}
function journey(){return '';}
function context({edit=true}={}){const e=event(),s=session();return `<div class="choice-context"><img src="../assets/photos-r17/${e.image}" alt="${t('photoCaption')}"><div><p class="context-name">${t(e.titleKey)}</p><p class="context-date">${s?dateText(s):t('age')+' · '+e.duration+' '+t('minutes')}</p><span class="small muted">${s?t('yerevanTime'):t(e.mode==='seated'?'seated':'capacity')}</span></div>${edit&&s&&sessionsFor(e.id).length>1?link(t('change'),'sessions'):''}</div>`;}
function catalog(){return `<div class="intro-head"><p class="eyebrow">VICTORY PARK · ${t('city')}</p><h1 tabindex="-1">${q('chooseEventTitle')}</h1><p class="lead">${q('chooseEventHint')}</p></div><div class="quiz-events">${EVENTS.map(e=>`<button type="button" class="event-answer" data-action="event" data-value="${e.id}"><img src="../assets/photos-r17/${e.image}" alt=""><span class="event-answer-copy"><span class="small muted">${t('age')} · ${e.duration} ${t('minutes')}</span><strong>${t(e.titleKey)}</strong><span>${t(e.descriptionKey)}</span><span class="event-price">${money(e.price)} <small>${t('perGuest')}</small><i aria-hidden="true">↗</i></span></span></button>`).join('')}</div>`;}
function timeAnswers(choices){return `<div class="time-answers">${choices.map(s=>{const a=availability({...state,sessionId:s.id}),closed=isClosed({...state,sessionId:s.id});const ok=!closed&&a.remaining>=(ui.qtyKnown?state.qty:1);return `<button type="button" class="time-answer" data-action="session" data-value="${s.id}" ${!ok?'disabled':''}><span><strong>${dateText(s,false)}</strong><small>${closed?t('closedMessage'):a.remaining===0?t('soldOut'):!ok?t('notEnoughForGroup',{n:state.qty}):ui.qtyKnown?q('qtyChosen',{n:state.qty}):t('available')}</small></span><b>${new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Yerevan'}).format(new Date(s.at))}</b><i aria-hidden="true">→</i></button>`;}).join('')}</div>`;}
function sessionList(){return `${link('← '+t('backEvents'),'catalog')}${context({edit:false})}<div class="intro-head"><h1 tabindex="-1">${t('sessionTitle')}</h1><p class="lead">${q('chooseTimeHint')}</p></div>${timeAnswers(sessionsFor(state.eventId))}`;}
function unavailable(){const choices=sessionsFor(state.eventId).filter(item=>item.id!==state.sessionId);return `${context({edit:false})}<div class="question-heading"><h1 tabindex="-1">${isClosed(state)?t('closedMessage'):t('soldOut')}</h1><p class="lead">${q('unavailableBeforeGroup')}</p>${ui.qtyKnown?`<p class="group-note">${q('qtyChosen',{n:state.qty})}</p>`:''}</div>${choices.length?timeAnswers(choices):''}<div class="action-row">${btn(t('backEvents'),'catalog','','secondary')}</div>`;}
function group(){const e=event();return `${context()}<div class="question-heading"><p class="eyebrow">${q('forCompany')}</p><h1 tabindex="-1">${q('groupTitle')}</h1><p class="lead">${q('groupHint')}</p><p class="group-note" id="group-rules">${q('groupRules')}</p></div><div class="group-answers" role="group" aria-label="${q('groupTitle')}" aria-describedby="group-rules">${Array.from({length:8},(_,i)=>i+1).map(n=>`<button type="button" class="group-answer" data-action="group" data-value="${n}"><strong>${n}</strong><span>${q(n===1?'guestOne':state.lang==='ru'&&n<=4?'guestFew':'guestMany')}</span><small>${money(n*e.price)}</small><i aria-hidden="true">→</i></button>`).join('')}</div>`;}
function blocked(){
 const a=availability(state),closed=isClosed(state),needsSeats=!closed&&a.remaining>=state.qty&&event().mode==='seated';
 if(needsSeats&&a.adjacent.length){return `<div class="notice seat-choice"><strong>${q('newSeatsTitle')}</strong><p>${q('newSeatsText')}</p><p class="seat-summary">${esc(seatText(a.adjacent))}</p><div class="action-row">${btn(q('acceptSuggested'),'auto','','yellow')}${btn(t('manual'),'manual','','secondary')}</div></div>`;}
 const title=closed?t('closedMessage'):a.remaining===0?t('soldOut'):a.remaining<state.qty?t('notEnough'):t('noAdjacent');
 return `<div class="notice"><strong>${title}</strong><p>${a.remaining<state.qty?t('remaining',{n:a.remaining}):!closed&&a.adjacent.length===0?t('noAdjacentText'):''}</p><div class="action-row">${sessionsFor(state.eventId).length>1?btn(q('sessionFallback'),'sessions','','yellow'):btn(t('backEvents'),'catalog','','yellow')}${needsSeats?btn(t('manual'),'manual','','secondary'):''}</div></div>`;
}
function checkout(){
 const e=event(),available=canHold({...state,phase:'select'})||state.phase==='payment';
 const needsSeats=!available&&!isClosed(state)&&availability(state).remaining>=state.qty&&e.mode==='seated';
 const split=e.mode==='seated'&&state.seats.length===state.qty&&!contiguous(state.seats);
 return `${context()}<div class="checkout-heading"><h1 tabindex="-1">${available?q('readyTitle'):needsSeats?q('chooseSeatsTitle'):q('unavailableTitle')}</h1></div><div class="chosen-group"><div><strong>${guestCount(state.qty)}</strong><span>${e.mode==='seated'&&state.seats.length?esc(seatText(state.seats)):e.mode==='capacity'?t('capacity'):t('emptySelection')}</span></div>${link(q('editGroup'),'editGroup')}</div>${!available?blocked():`<div class="placement-line"><span class="status-dot">${e.mode==='seated'&&!split?t('together'):q('availableTogether')}</span>${e.mode==='seated'?link(t('manual'),'manual'):''}</div>${split?`<p class="notice">${t('splitWarning')}</p>`:''}<div class="quiz-total"><div><span>${q('amountForAll')}</span><small>${state.qty} × ${money(e.price)}</small></div><strong>${money(total(state))}</strong></div><p class="fees-note">${q('noAddedFees')}</p><div class="purchase-terms"><p>${q('exampleRules')} ${q('briefRules')}</p><details><summary>${q('termsLink')}</summary><p>${t('conditionsBody')}</p></details></div><form id="payment-form" class="quiz-payment" novalidate><label for="email">${t('emailLabel')}</label><input id="email" name="email" type="email" inputmode="email" autocomplete="email" maxlength="254" placeholder="name@example.com" value="${esc(state.email)}" aria-describedby="email-help field-error" ${state.error==='emailError'?'aria-invalid="true"':''}><p id="email-help" class="small muted">${t('emailHelp')}</p><p id="field-error" class="error-line" role="alert">${state.error?t(state.error):''}</p><button type="submit" class="btn yellow full" data-action="pay">${t('pay')} · ${money(total(state))}<span aria-hidden="true">→</span></button><p class="payment-note">${q('demoShort')}</p></form><div class="hold-note" data-hold></div>`}`;
}
function seatMap(){const stock=availability(state);return `<div class="seat-map"><div class="map-toolbar"><span class="small muted">${t('seatHelp',{n:state.qty})}</span><div><button data-action="zoomout" type="button" aria-label="${t('zoomOut')}" ${mapZoom===1?'disabled':''}>−</button> <button data-action="zoomin" type="button" aria-label="${t('zoomIn')}" ${mapZoom>=1.5?'disabled':''}>+</button></div></div><div class="map-scroll" tabindex="0" role="group" aria-label="${t('seatMapLabel')}"><div class="map-inner" style="--map-zoom:${mapZoom}"><div class="stage">${t('stage')}</div>${'ABCDEF'.split('').map(row=>`<div class="seat-row"><span class="row-label">${row}</span>${SEATS.filter(id=>id.startsWith(row)).map(id=>`<button type="button" class="seat ${stock.sold.includes(id)?'sold':''}" style="${mapZoom>1?'width:46px;height:48px':''}" data-action="seat" data-value="${id}" aria-label="${esc(t('seat',{row,seat:id.slice(1)}))}${stock.sold.includes(id)?', '+t('occupied'):''}" aria-pressed="${state.seats.includes(id)}" ${stock.sold.includes(id)?'disabled':''}>${stock.sold.includes(id)?'×':id.slice(1)}</button>`).join('')}<span class="row-label">${row}</span></div>`).join('')}</div></div><div class="map-legend"><span><i class="swatch"></i>${t('free')}</span><span><i class="swatch picked"></i>${t('selected')}</span><span><i class="swatch busy"></i>${t('occupied')}</span></div><p class="selection-count" role="status">${t('selectedCount',{selected:state.seats.length,qty:state.qty})}</p>${state.seats.length?`<p class="seat-summary">${esc(seatText(state.seats))}</p>`:''}${state.seats.length===state.qty&&!contiguous(state.seats)?`<p class="notice" style="margin-top:14px">${t('splitWarning')}</p>`:''}</div>`;}
function mapView(){return `${link('← '+q('mapCancel'),'mapCancel')}${context({edit:false})}<div class="question-heading"><h1 tabindex="-1">${t('yourSeats')}</h1><p class="lead">${guestCount(state.qty)} · ${money(total(state))}</p></div>${seatMap()}<div class="map-done">${btn(q('mapDone'),'mapDone','','yellow full',!canHold(state)?'disabled':'')}${btn(t('auto'),'auto','','secondary full')}</div>`;}
function help(){return helpOpen?`<div class="help-box"><p>${t('helpText')}</p><p class="order-code" style="margin-top:12px">${esc(state.orderId)}</p>${btn(copied?t('copied'):t('copyOrder'),'copy','','secondary small-btn')}</div>`:'';}
function ticket(ticketState=state){const frozen=record?.orders.find(o=>o.id===ticketState.orderId);const ticketEvent=EVENTS.find(item=>item.id===ticketState.eventId),ticketSession=SESSIONS.find(item=>item.id===ticketState.sessionId);return `<article class="ticket"><div class="ticket-top"><p class="small">VICTORY PARK · ${t('demoOnly')}</p><h2>${esc(frozen?.eventTitle?.[state.lang]||t(ticketEvent.titleKey))}</h2></div><div class="ticket-body"><dl><dt>${t('date')}</dt><dd>${dateText(frozen?.sessionAt?{at:frozen.sessionAt}:ticketSession)}<br><span class="small">${t('yerevanTime')}</span></dd><dt>${t('guests')}</dt><dd>${ticketState.qty}</dd>${ticketEvent.mode==='seated'?`<dt>${t('yourSeats')}</dt><dd>${esc(seatText(ticketState.seats))}</dd>`:''}<dt>${t('amount')}</dt><dd>${money(frozen?.amount??total(ticketState))}</dd><dt>${t('order')}</dt><dd class="order-code">${esc(ticketState.orderId)}</dd><dt>${t('emailReceipt')}</dt><dd>${esc(ticketState.email)}</dd></dl><p class="no-email">${t('noEmailSent')}</p></div><div class="invalid">${t('invalidTicket')}</div></article>`;}
function previousTicket(){return lastIssued&&state.phase!=='issued'?`<details class="previous-ticket"><summary>${q('previousTicket')}</summary>${ticket(lastIssued)}</details>`:'';}
function result(){const p=state.phase;const key={processing:'processing',unknown:'unknown',declined:'declined',security:'security',pending:'pending',issued:'issued',expired:'expired'}[p];const icon={processing:'…',unknown:'?',declined:'!',security:'!',pending:'✓',issued:'✓',expired:'◷'}[p];let action='';if(p==='unknown')action=btn(t('checkPayment'),'check','','yellow');if(p==='pending')action=btn(t('checkTicket'),'issue','','yellow');if(p==='declined')action=btn(t('retry'),'retry','','yellow');if(p==='expired')action=btn(t('renew'),'renew','','yellow');if(p==='security')action=btn(t('help'),'help','','secondary');if(p==='issued')action=btn(t('saveTicket'),'download','','yellow')+btn(t('printTicket'),'print','','secondary');return `${journey(['issued','pending'].includes(p)?2:1)}<div class="result"><div class="result-icon ${['issued','pending'].includes(p)?'ok':''}" aria-hidden="true">${icon}</div><h1 tabindex="-1">${t(key+'Title')}</h1><p class="lead" ${p==='processing'?'role="status"':''}>${t(p==='expired'?'expiredMessage':key+'Text')}</p>${state.orderId?`<p class="small muted">${t('order')} <span class="order-code">${esc(state.orderId)}</span></p>`:''}${p!=='issued'&&event()&&session()?`<p class="status-context">${esc(t(event().titleKey))}<br>${dateText(session())} · ${t('guests')}: ${state.qty}<br>${money(total(state))}${state.seats.length?' · '+esc(seatText(state.seats)):''}</p>`:''}${p==='issued'?ticket():''}<div class="action-row">${action}${['unknown','pending','declined'].includes(p)?link(t('help'),'help'):''}${p==='issued'?link(t('newBooking'),'catalog'):''}</div>${help()}</div>`;}
function reviewPanel(){return !review?'':`<details class="review-panel" open><summary>${t('review')}</summary><p class="small muted">${t('reviewNote')}</p><div class="review-controls"><label>${t('scenario')}<select id="scenario">${SCENARIOS.map(v=>`<option value="${v}" ${v===state.scenario?'selected':''}>${t(v)}</option>`).join('')}</select></label>${btn(t('applyScenario'),'scenario','','secondary small-btn')}${btn(t('expire'),'expire','','secondary small-btn',!['payment','declined'].includes(state.phase)?'disabled':'')}${btn(t('reset'),'reset','','secondary small-btn')}</div><pre>${esc(JSON.stringify({phase:state.phase,orderId:state.orderId,attempts:state.attempts,actions:state.log.slice(-8)},null,2))}</pre></details>`;}
function render(focus=false){if(mutating){needsRender=true;renderFocus=renderFocus||focus;return;}
 const active=document.activeElement,focusId=active?.id,focusAction=active?.dataset.action,focusValue=active?.dataset.value;
 document.documentElement.lang=state.lang;document.title='Victory Park · '+t('booking');
 let content,shownView=ui.view;
 if(!['select','payment'].includes(state.phase))content=result();
 else if(ui.view==='events')content=catalog();
 else if(ui.view==='sessions')content=sessionList();
 else if(state.sessionId&&(isClosed(state)||availability(state).remaining===0)){content=unavailable();shownView='unavailable';}
 else if(ui.view==='group')content=group();
 else if(ui.view==='map')content=mapView();
 else content=checkout();
 root.innerHTML=header()+`<main id="main" class="wrap quiz-wrap" data-view="${shownView}" data-phase="${state.phase}">${readOnly?`<p class="notice archive-note" role="status">${label(state.lang,resumeMissing?'missing':'archive')}</p>`:''}${resumeMissing?'':content+previousTicket()+reviewPanel()}</main>`+siteFooter(state);decorate(root,readOnly);
 if(focus){document.querySelector('h1')?.focus({preventScroll:true});window.scrollTo({top:0});}
 else if(focusId){document.getElementById(focusId)?.focus({preventScroll:true});}
 else if(focusAction){document.querySelector(`[data-action="${CSS.escape(focusAction)}"][data-value="${CSS.escape(focusValue||'')}"]`)?.focus({preventScroll:true});}
 updateClock();
}
function updateClock(){if(!state.holdUntil)return;const seconds=Math.max(0,Math.ceil((state.holdUntil-Date.now())/1000));const time=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;document.querySelectorAll('[data-hold]').forEach(el=>el.textContent=t('hold',{time}));}
function downloadTicket(){const frozen=record?.orders.find(o=>o.id===state.orderId);const rows=[t('invalidTicket'),'VICTORY PARK',frozen?.eventTitle?.[state.lang]||t(event().titleKey),dateText(frozen?.sessionAt?{at:frozen.sessionAt}:session())+' · '+t('yerevanTime'),`${t('guests')}: ${state.qty}`,state.seats.length?seatText(state.seats):t('capacity'),`${t('total')}: ${money(frozen?.amount??total(state))}`,`${t('order')}: ${state.orderId}`,t('ticketBody'),t('noEmailSent')];const blob=new Blob(['\uFEFF'+rows.join('\n\n')],{type:'text/plain;charset=utf-8'});const href=URL.createObjectURL(blob);const a=document.createElement('a');a.href=href;a.download=state.orderId+'-DEMO.txt';a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);}
function pay(){
 if(!['select','payment','declined'].includes(state.phase))return;
 if(state.phase==='declined')update({type:'RETRY'});
 if(state.phase==='select')prepare();
 if(state.phase==='payment')update({type:'PAY'});
 finish({focus:state.phase==='processing'});
 if(state.error==='emailError')document.querySelector('#email')?.focus();
 if(state.phase==='processing'){
  clearTimeout(responseTimer);
  const id=state.orderId;
  responseTimer=setTimeout(()=>run(()=>{if(state.phase==='processing'&&state.orderId===id){update({type:'RESOLVE'});finish();}}),650);
 }
}
root.addEventListener('input',e=>{if(e.target.id==='email'){const inputValue=e.target.value;run(()=>{update({type:'EMAIL',value:inputValue});save();e.target.removeAttribute('aria-invalid');const err=document.getElementById('field-error');if(err)err.textContent='';});}});
root.addEventListener('submit',e=>{if(e.target.id==='payment-form'){e.preventDefault();const email=root.querySelector('#email')?.value,expected=selectionSignature();run(()=>{if(expected!==selectionSignature()){state.error='lockedOrder';render();return;}if(email!==undefined)update({type:'EMAIL',value:email});pay();});}});
root.addEventListener('click',e=>{
 const button=e.target.closest('[data-action]');if(!button||button.disabled)return;
 const action=button.dataset.action,value=button.dataset.value;
 if(action==='pay')return;
 e.preventDefault();const scenarioValue=document.querySelector('#scenario')?.value;if(action==='copy'){navigator.clipboard.writeText(state.orderId).then(()=>{copied=true;render();}).catch(()=>{});return;}run(()=>{if(readOnly&&!['lang','help','download','print'].includes(action))return;
 switch(action){
 case 'lang':update({type:'LANG',value});finish({focus:false});break;
 case 'catalog':if(locked()&&state.phase!=='issued')break;resumeId=null;const keepQuantity=ui.qtyKnown&&state.phase!=='issued';release();update({type:'NEW'});ui={view:'events',qtyKnown:keepQuantity};mapSnapshot=null;helpOpen=false;finish({push:true});break;
 case 'event':if(locked())break;release();update({type:'EVENT',value});const choices=sessionsFor(value);if(choices.length===1){update({type:'SESSION',value:choices[0].id});ui.view=ui.qtyKnown?'checkout':'group';prepare();}else ui.view='sessions';finish({push:true});break;
 case 'session':if(locked())break;release();update({type:'SESSION',value});ui.view=ui.qtyKnown?'checkout':'group';prepare();finish({push:true});break;
 case 'sessions':if(locked()||sessionsFor(state.eventId).length<2)break;release();ui.view='sessions';finish({push:true});break;
 case 'group':if(locked())break;release();update({type:'QTY',value:Number(value)});ui.qtyKnown=true;ui.view='checkout';prepare();finish({push:true});break;
 case 'editGroup':if(locked())break;release();ui.view='group';finish({push:true});break;
 case 'manual':if(locked())break;mapSnapshot=structuredClone(state);release();ui.view='map';mapOpen=true;finish({push:true});break;
 case 'mapCancel':{if(locked()){finish();break;}const original=mapSnapshotFor(mapSnapshot,state);if(original)state=original;mapSnapshot=null;ui.view='checkout';mapOpen=false;prepare();finish({push:true});break;}
 case 'mapDone':if(!canHold(state))break;ui.view='checkout';mapOpen=false;mapSnapshot=null;prepare();finish({push:true});break;
 case 'auto':update({type:'AUTO'});if(canHold(state)){ui.view='checkout';mapOpen=false;mapSnapshot=null;prepare();}finish({push:true});break;
 case 'seat':update({type:'SEAT',value});finish({focus:false});break;
 case 'zoomin':mapZoom=1.5;render();break;
 case 'zoomout':mapZoom=1;render();break;
 case 'check':update({type:'CHECK'});finish();break;
 case 'issue':update({type:'ISSUE'});finish();break;
 case 'retry':pay();break;
 case 'renew':update({type:'RENEW'});ui.view='checkout';prepare();finish();break;
 case 'help':helpOpen=!helpOpen;render();break;
 
 case 'download':downloadTicket();break;
 case 'print':window.print();break;
 case 'scenario':if(review&&!BUSY.includes(state.phase)){const scenario=scenarioValue;const {lang,eventId,qty,email}=state,quantityKnown=ui.qtyKnown;const orderSeq=state.orderSeq;state=defaultState();state.orderSeq=orderSeq;state.lang=lang;state.qty=qty;state.email=email;update({type:'EVENT',value:eventId||'show'});update({type:'SESSION',value:(eventId||'show')+'-1'});update({type:'SCENARIO',value:scenario});ui={view:quantityKnown?'checkout':'group',qtyKnown:quantityKnown};mapOpen=false;mapSnapshot=null;helpOpen=false;prepare();finish({push:true});}break;
 case 'expire':if(review){update({type:'EXPIRE'});finish();}break;
 case 'reset':if(review&&!BUSY.includes(state.phase)){clearTimeout(responseTimer);state={...defaultState(),lang:state.lang,orderSeq:state.orderSeq};resumeId=null;readOnly=false;ui={view:'events',qtyKnown:false};applyLocation(initialQuery,{fresh:true});mapOpen=false;mapSnapshot=null;lastIssued=null;helpOpen=false;finish();}break;
 }
});});
window.addEventListener('popstate',()=>run(()=>{
 if(!locked()){
  const previous=structuredClone(state),previousView=ui.view,query=new URLSearchParams(location.search);
  if(previousView==='map'&&query.get('view')!=='map'){
   // Leaving an unconfirmed map is cancellation, including after reload. Keep
   // the original hold deadline and the language chosen while editing.
   const original=mapSnapshotFor(mapSnapshot,state);if(original)state=original;
  }else release();
  applyLocation(query,{fresh:true});
  if(previousView==='map'&&ui.view!=='map'&&state.eventId===previous.eventId&&state.sessionId===previous.sessionId)update({type:'LANG',value:previous.lang});
  if(ui.view==='map'&&previousView!=='map')mapSnapshot=mapSnapshotFor(previous,state)||structuredClone(state);
  else if(ui.view!=='map')mapSnapshot=null;
 }
 finish();
}));

let record=null,readOnly=false,resumeMissing=false,resumeId=new URLSearchParams(location.search).get('resume'),mutating=false,needsRender=false,renderFocus=false,queue=Promise.resolve(),storageFailed=false;
function loadRecord(saved){
 record=saved;const view=selectResume(saved,resumeId);state=structuredClone(view.state);readOnly=view.readonly;resumeMissing=view.missing;if(readOnly){const lang=new URLSearchParams(location.search).get('lang');if(['ru','hy','en'].includes(lang))state.lang=lang;}
 lastIssued=issuedSnapshot([...saved.orders].reverse().find(o=>o.phase==='issued')?.snapshot);
 ui={view:saved.ui?.view||(!state.eventId?'events':!state.sessionId?'sessions':saved.qtyKnown?'checkout':'group'),qtyKnown:saved.qtyKnown===true};mapSnapshot=mapSnapshotFor(saved.mapSnapshot,state);
}
function exportRecord(){
 if(readOnly){record.state.lang=state.lang;return record;}
 state.orderSeq=Math.max(state.orderSeq,record.orderSeq||0);captureOrder(record,state,'quiz');record.state=structuredClone(state);record.qtyKnown=ui.qtyKnown;record.ui={...ui};record.mapSnapshot=mapSnapshot;
 return record;
}
function fatal(error){storageFailed=true;root.innerHTML=siteHeader(state,'quiz',ui.qtyKnown,resumeId)+`<main id="main" class="wrap"><p class="notice error" role="alert">${label(state.lang,'storage')}</p></main>`+siteFooter(state);console.error('Session persistence failed',error?.name||'Error');}
function run(work,{recover=false}={}){
 if(storageFailed)return Promise.resolve();
 queue=queue.then(()=>transact(saved=>{loadRecord(saved);mutating=true;needsRender=false;renderFocus=false;try{work();return exportRecord();}finally{mutating=false;}},{recover})).then(saved=>{record=saved;document.dispatchEvent(new CustomEvent('vp:sessions-updated'));if(needsRender)render(renderFocus);}).catch(fatal);
 return queue;
}
function refresh(){queue=queue.then(()=>read()).then(saved=>{loadRecord(saved);render();}).catch(fatal);return queue;}
window.addEventListener('storage',e=>{if(e.key===STORAGE)refresh();});
window.addEventListener('pageshow',e=>{if(e.persisted)run(()=>{render();},{recover:true});});
// Save input and state before leaving for the other interface or another site page.
root.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||a.dataset.action||e.metaKey||e.ctrlKey||a.target==='_blank'||a.getAttribute('href').startsWith('#'))return;e.preventDefault();const href=a.href;queue.then(()=>{if(!storageFailed)location.href=href;});});
setInterval(()=>{if(readOnly||storageFailed)return;const next=tick(state);if(next.phase!==state.phase)run(()=>{state=tick(state);save();render();});else updateClock();},1000);
await run(()=>{if(!resumeId)applyLocation(initialQuery);else if(['ru','hy','en'].includes(initialQuery.get('lang')))update({type:'LANG',value:initialQuery.get('lang')});if(ui.view==='map'){mapOpen=true;mapSnapshot=mapSnapshotFor(mapSnapshot,state)||structuredClone(state);}else mapSnapshot=null;save();url();render();},{recover:true});
