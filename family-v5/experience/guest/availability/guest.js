/* Read-only guest presentation of the same validated local demonstration. */
(function(){
'use strict';
const M=window.Availability,$=id=>document.getElementById(id);
if(!M)return;
let state,problem='',filter='all',previous=null;
const rows=new Map();
function node(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function text(n,value){if(n.textContent!==value)n.textContent=value;}
function read(initialize=false){
 try{
  const raw=localStorage.getItem(M.KEY);
  if(raw){const parsed=JSON.parse(raw);if(!M.validate(parsed))throw Error('schema');state=parsed;problem='';return;}
  if(initialize){const s=M.presentationSeed();localStorage.setItem(M.KEY,JSON.stringify(s));state=s;problem='';return;}
  problem='Учебные данные удалены. Работа объектов не подтверждена. В сценариях можно сбросить демонстрацию.';
 }catch(e){problem='Не удалось прочитать учебные данные. Работа объектов не подтверждена. В сценариях можно сбросить демонстрацию.';}
 state=M.presentationSeed(Date.now(),true);
}
function buildRows(){M.RIDES.forEach((r,index)=>{
 const li=node('li',undefined,'guest-ride');li.id=r.id;
 const details=node('details');details.id='details-'+r.id;
 const summary=node('summary');summary.id='ride-summary-'+r.id;summary.setAttribute('aria-expanded','false');
 const photo=node('span',undefined,'guest-photo'),img=node('img');img.src=r.photo;img.alt='';img.width=56;img.height=56;img.loading=index<4?'eager':'lazy';img.decoding='async';
 const fallback=node('span','Нет фото','guest-photo-fallback');fallback.hidden=true;
 img.addEventListener('error',()=>{img.hidden=true;fallback.hidden=false;});photo.append(img,fallback);
 const copy=node('span',undefined,'guest-ride-copy'),name=node('span',r.name,'guest-ride-name'),status=node('span','Уточняем','guest-status unknown');copy.append(name,status);summary.append(photo,copy);
 const info=node('div',undefined,'guest-ride-info'),reason=node('p'),source=node('p',undefined,'guest-detail-source'),time=node('p',undefined,'guest-detail-time'),debit=node('p',undefined,'guest-detail-debit'),link=node('a','Об аттракционе');
 link.href='attractions.html?ride='+encodeURIComponent(r.catalogId);link.id='ride-link-'+r.id;info.append(reason,source,time,debit,link);details.append(summary,info);li.append(details);$('rides').append(li);
 details.addEventListener('toggle',()=>summary.setAttribute('aria-expanded',String(details.open)));
 rows.set(r.id,{li,details,summary,status,reason,source,time,debit});
 });}
function sourceName(r){if(problem)return 'Источник сведений недоступен.';return r.source==='manual'?'Источник: подтверждение дежурного.':r.source==='manual-expired'?'Источник: просроченное подтверждение дежурного.':r.source==='debits'?'Источник: автооценка по списаниям.':r.source==='park'?'Источник: решение по всему парку.':r.source==='park-unknown'?'Состояние парка не подтверждено.':'Источник: данные о списаниях. Работа уточняется.';}
function stamp(t,now){return M.clock(t)+(M.day(t)!==M.day(now)?', '+M.date(t):'');}
function detailTime(r,d){
 if(problem)return 'Время проверки неизвестно: сохранённые сведения недоступны.';
 if(r.source==='manual')return 'Дежурный проверил в '+stamp(r.checkedAt,d.now)+'. Следующая проверка: '+stamp(r.expiresAt,d.now)+'. Это не время запуска.';
 if(r.source==='manual-expired')return 'Последняя проверка дежурного: '+stamp(r.checkedAt,d.now)+'. Срок подтверждения истёк.';
 if(r.source==='park')return 'Состояние парка проверено в '+stamp(r.checkedAt,d.now)+'.';
 return 'Последнее успешное чтение источника: '+stamp(state.sources.lime.lastSuccessfulRead,d.now)+'. Это не проверка работы дежурным.';
}
function announce(value){text($('update-announcement'),value);}
function render(){
 const d=M.derive(state),q=$('search').value,ordered=M.RIDES.map(c=>d.rides.find(r=>r.id===c.id));
 const originalMatches=new Set(M.search(ordered,q).map(r=>r.id)),needle=q.trim().toLocaleLowerCase();
 const matched=ordered.filter(r=>originalMatches.has(r.id)||['en','hy'].some(lang=>(window.VPI18n?VPI18n.translate(M.RIDES.find(c=>c.id===r.id).name,lang):'').toLocaleLowerCase().includes(needle))),visible=matched.filter(r=>filter==='all'||r.status==='open'),visibleIds=new Set(visible.map(r=>r.id));
 text($('overview'),(d.park.status==='open'?'Парк открыт':['closed','paused'].includes(d.park.status)?'Парк временно закрыт':'Работу парка уточняем')+' · '+(d.counts.open?'работают '+d.counts.open+' из 11':['closed','paused'].includes(d.park.status)?'аттракционы недоступны':'работа аттракционов не подтверждена'));
 text($('demo-time'),'Учебное время: '+M.clock(d.now)+' · '+M.date(d.now)+' · Ереван'+(state.clock.running?' · идёт':' · зафиксировано'));
 $('system-message').hidden=!problem; text($('system-message'),problem);$('system-message').className='error';
 const offline=state.simulation.offline||!navigator.onLine;$('network').hidden=!offline;text($('network'),'Нет связи. Учебные сведения могут устареть; возврат сети не подтверждает работу.');
 $('park-notice').hidden=d.park.status==='open';text($('park-notice'),d.park.reason);
 $('source-notice').hidden=!!problem||d.limeFresh;text($('source-notice'),'Актуальные данные о списаниях недоступны. Автооценки уточняем, действующие отметки дежурного сохраняются.');
 const weatherFocused=$('weather').contains(document.activeElement);$('weather').hidden=!d.weather.showAlert;if(weatherFocused&&$('weather').hidden)$('filter-all').focus({preventScroll:true});
 text($('weather-rides'),'Возможные ограничения: '+d.weather.ids.map(id=>M.RIDES.find(r=>r.id===id).name).join(', ')+'. Статус каждого указан в списке.');
 text($('weather-time'),'Учебный прогноз от '+stamp(d.weather.checkedAt,d.now)+', действует до '+stamp(d.weather.validUntil,d.now)+'.');
 text($('filter-all'),'Все '+ordered.length);text($('filter-open'),'Работают '+d.counts.open);
 $('filter-all').setAttribute('aria-pressed',String(filter==='all'));$('filter-open').setAttribute('aria-pressed',String(filter==='open'));
 const active=document.activeElement,focusedRide=[...rows.entries()].find(([,r])=>r.li.contains(active));
 ordered.forEach(r=>{const dom=rows.get(r.id);dom.li.dataset.status=r.status;dom.status.className='guest-status '+r.status;text(dom.status,M.LABELS[r.status]);text(dom.reason,problem?'Сохранённые сведения недоступны. Работа аттракциона не подтверждена.':r.reason);text(dom.source,sourceName(r));text(dom.time,detailTime(r,d));
  const debit=r.lastDebit||M.lastDebit(r);dom.debit.hidden=!debit;text(dom.debit,debit?'Последнее списание: '+stamp(debit.eventAt,d.now)+' ('+M.ageMinutes(debit.eventAt,d.now)+' мин. назад).':'');dom.li.hidden=!visibleIds.has(r.id);
 });
 if(focusedRide&&!visibleIds.has(focusedRide[0])){const oldIndex=M.RIDES.findIndex(r=>r.id===focusedRide[0]);const next=visible.find(r=>M.RIDES.findIndex(c=>c.id===r.id)>oldIndex)||visible[0];(next?rows.get(next.id).summary:$('filter-all')).focus({preventScroll:true});}
 $('clear-search').hidden=!q;$('result-note').hidden=!q; text($('result-note'),'Поиск «'+q+'»: найдено '+visible.length+'. Числа в фильтрах относятся ко всем 11 аттракционам.');
 $('empty').hidden=visible.length>0;$('empty-all').hidden=filter==='all';$('empty-reset').hidden=!q;
 text($('empty-title'),filter==='open'?(q?'Среди работающих не найдено':'Работающих аттракционов не подтверждено'):'Не нашли по этому названию');
 text($('empty-description'),filter==='open'?'Посмотрите все статусы. «Уточняем» не означает, что аттракцион закрыт.':'Попробуйте другое название или сбросьте поиск.');
 if(previous){const changed=ordered.filter(r=>previous.statuses.get(r.id)!==r.status);const disappeared=changed.filter(r=>previous.visible.has(r.id)&&!visibleIds.has(r.id));if(disappeared.length)announce(disappeared.map(r=>r.name+': '+M.LABELS[r.status]).join('. ')+'. Убрано из фильтра «Работают». Показано '+visible.length+'.');else if(changed.length)announce('Статусы обновлены: '+changed.map(r=>r.name+': '+M.LABELS[r.status]).join('. ')+'.');}
 previous={statuses:new Map(ordered.map(r=>[r.id,r.status])),visible:visibleIds};
}
function refresh(){read();render();}
$('filter-all').addEventListener('click',()=>{filter='all';render();announce('Все аттракционы. Показано '+[...rows.values()].filter(r=>!r.li.hidden).length+'.');});
$('filter-open').addEventListener('click',()=>{filter='open';render();announce('Только работающие. Показано '+[...rows.values()].filter(r=>!r.li.hidden).length+'.');});
$('search-toggle').addEventListener('click',()=>{const open=$('search-panel').hidden;$('search-panel').hidden=!open;$('search-toggle').setAttribute('aria-expanded',String(open));if(open)$('search').focus();});
$('search').addEventListener('input',()=>{render();announce($('result-note').textContent);});
$('search').addEventListener('keydown',event=>{if(event.key==='Escape'){if($('search').value){$('search').value='';render();}else{$('search-panel').hidden=true;$('search-toggle').setAttribute('aria-expanded','false');$('search-toggle').focus();}}});
const clear=()=>{$('search').value='';render();$('search-panel').hidden=false;$('search-toggle').setAttribute('aria-expanded','true');$('search').focus();announce('Поиск очищен.');};
$('clear-search').addEventListener('click',clear);$('empty-reset').addEventListener('click',clear);
$('empty-all').addEventListener('click',()=>{filter='all';render();$('filter-all').focus();announce('Поиск среди всех аттракционов. Запрос сохранён.');});
window.addEventListener('storage',e=>{if(e.key===M.KEY||e.key===null)refresh();});
window.addEventListener('pageshow',refresh);window.addEventListener('focus',refresh);window.addEventListener('online',refresh);window.addEventListener('offline',refresh);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
function revealHash(){const row=rows.get(location.hash.slice(1));if(!row)return;filter='all';$('search').value='';render();row.details.open=true;row.li.scrollIntoView();}
window.addEventListener('hashchange',revealHash);
read(true);buildRows();render();if(location.hash)requestAnimationFrame(revealHash);setInterval(refresh,5000);
})();
