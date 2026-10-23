/* Pure local demonstration model. All times, mappings and thresholds are fixtures. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.Availability=api;})(typeof window==='undefined'?null:window,function(){
'use strict';
const BASE=Date.parse('2026-10-14T11:10:00Z'), MIN=60000, TTL=5*MIN, KEY='victory-availability-pages-v1';
const RIDES=[
 {id:'autodrom',catalogId:'autodrom',photo:'/victory-park-family-demo/family-v6/assets/photos-r17/autodrom-780.webp',name:'Автодром',aliases:'машинки'},
 {id:'vr-travel',catalogId:'VR-for-2',photo:'/victory-park-family-demo/family-v6/assets/photos-r17/vr-2-780.webp',name:'Виртуальное путешествие',aliases:'vr'},
 {id:'vr-reality',catalogId:'VR-cinema',photo:'/victory-park-family-demo/family-v6/assets/photos-r17/vr-cinema-780.webp',name:'Виртуальная реальность',aliases:'vr кинотеатр'},
 {id:'tower',catalogId:'rotating-tower',photo:'/victory-park-family-demo/family-v6/assets/photos-r17/bashnya-780.webp',name:'Вращающаяся башня',aliases:'башня'},
 {id:'wheel',catalogId:'wheel-of-happiness',photo:'/victory-park-family-demo/family-v6/assets/photos-r17/koleso-780.webp',name:'Колесо счастья',aliases:'колесо обозрения'},
 {id:'rocket',catalogId:'rocket',photo:'/victory-park-family-demo/family-v6/assets/photos-r17/raketa-780.webp',name:'Космический корабль',aliases:'ракета'},
 {id:'pendulum',catalogId:'pendulum',photo:'/victory-park-family-demo/family-v6/assets/photos-r17/pendulum-780.webp',name:'Метроном',aliases:'маятник'},
 {id:'ufo',catalogId:'moto-ufo',photo:'/victory-park-family-demo/family-v6/assets/photos-r17/moto-780.webp',name:'Мощный НЛО',aliases:'нло'},
 {id:'swan',catalogId:'water-swan',photo:'/victory-park-family-demo/family-v6/assets/photos-r17/vodnye-lebedi-780.webp',name:'Плавающий лебедь',aliases:'лебеди лодки'},
 {id:'planet',catalogId:'planet',photo:'/victory-park-family-demo/family-v6/assets/photos-r17/planeta-780.webp',name:'Планета',aliases:'планета'},
 {id:'mars',catalogId:'mars-ride',photo:'/victory-park-family-demo/family-v6/assets/photos-r17/mars-780.webp',name:'Полет на Марс',aliases:'полёт марс'}];
const LABELS={open:'Работает',paused:'Пауза',closed:'Не работает',unknown:'Уточняем'};
const copy=o=>JSON.parse(JSON.stringify(o));
const clock=t=>new Intl.DateTimeFormat('ru-RU',{timeZone:'Asia/Yerevan',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(t);
const date=t=>new Intl.DateTimeFormat('ru-RU',{timeZone:'Asia/Yerevan',day:'numeric',month:'long',year:'numeric'}).format(t);
const day=t=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Yerevan',year:'numeric',month:'2-digit',day:'2-digit'}).format(t);
const minuteOfDay=t=>{const a=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Yerevan',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(t).split(':').map(Number);return a[0]*60+a[1];};
const normalize=s=>String(s).toLocaleLowerCase('ru').replaceAll('ё','е').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
const fresh=(at,now,ttl=TTL)=>Number.isFinite(at)&&at<=now&&now-at<ttl;
const threshold=(r,s)=>s.thresholds.mode==='common'?s.thresholds.common:r.thresholdMinutes;
const lastDebit=r=>r.events.length?r.events.reduce((a,b)=>b.eventAt>a.eventAt?b:a):null;
const ageMinutes=(at,t)=>Math.max(0,Math.floor((t-at)/MIN));
function manual(status,reason,at,minutes=30){return{status,reason,checkedAt:at,expiresAt:at+minutes*MIN,author:'Дежурный'};}
function seed(realNow=Date.now(),safe=false){
 const ages=[1,2,4,6,8,18,null,3,12,null,10];
 const rides=RIDES.map((r,i)=>({...r,mapping:'known',thresholdMinutes:15,schedule:{start:r.id==='planet'?960:660,end:r.id==='swan'?1200:1320},events:!safe&&ages[i]!==null?[{id:'seed-'+r.id,eventAt:BASE-ages[i]*MIN,receivedAt:BASE-MIN,paymentKind:'money'}]:[],seenIds:!safe&&ages[i]!==null?['seed-'+r.id]:[],reversedIds:[],manual:safe?null:r.id==='wheel'?manual('paused','Пауза по решению дежурного. Время запуска неизвестно.',BASE-2*MIN):r.id==='pendulum'?manual('closed','Плановые работы. Время запуска неизвестно.',BASE-2*MIN):r.id==='mars'?manual('open','Работа подтверждена дежурным.',BASE-2*MIN):null}));
 rides.forEach(r=>r.lastManual=r.manual?copy(r.manual):null);
 return{version:2,revision:0,mode:'debits',thresholds:{mode:'individual',common:15},clock:{realStart:realNow,offsetMs:0,running:true},rides,park:{manual:safe?null:manual('open','Вход в парк открыт.',BASE-2*MIN,60)},sources:{lime:{ok:!safe,complete:!safe,requiresFreshRead:safe,lastSuccessfulRead:BASE-MIN,receivedAt:BASE-MIN},weather:{ok:!safe,checkedAt:BASE-2*MIN,validUntil:BASE+45*MIN,alert:!safe,dismissed:false,ids:['tower','wheel','ufo']}},shift:{active:true,startedAt:BASE-10*MIN},history:[],simulation:{saveError:false,offline:false}};
}
// A shared, paused starting point for every screen of the owner presentation.
function presentationSeed(realNow=Date.now(),safe=false){const s=seed(realNow,safe);s.clock.running=false;return s;}
function now(s,realNow=Date.now()){return BASE+s.clock.offsetMs+(s.clock.running?Math.max(0,realNow-s.clock.realStart):0);}
function sourceHealthy(s,t){const l=s.sources.lime;return l.ok&&l.complete&&!l.requiresFreshRead&&fresh(l.lastSuccessfulRead,t);}
function ownStatus(ride,s,t){
 const m=ride.manual,latest=lastDebit(ride),T=threshold(ride,s),base={lastDebit:latest,thresholdMinutes:T};
 if(m){if(!fresh(m.checkedAt,t,24*60*MIN)||m.expiresAt<=t)return{...base,status:'unknown',reason:'Срок ручного статуса истёк. Нужна новая проверка.',source:'manual-expired',checkedAt:m.checkedAt,needsCheck:true};return{...base,status:m.status,reason:m.reason,source:'manual',checkedAt:m.checkedAt,expiresAt:m.expiresAt,needsCheck:m.status==='unknown'};}
 const unknown=(reason,source)=>({...base,status:'unknown',reason,source,checkedAt:latest?.eventAt??null,needsCheck:true});
 if(ride.mapping!=='known')return unknown(ride.mapping==='ambiguous'?'Операции нельзя однозначно связать с аттракционом.':'Для аттракциона ещё не настроена связь со списаниями.','mapping');
 const l=s.sources.lime;
 if(!l.ok||l.requiresFreshRead)return unknown('Данные о списаниях временно не поступают.','source-error');
 if(!l.complete)return unknown('Поток списаний неполный. Нужна проверка.','source-incomplete');
 if(!fresh(l.lastSuccessfulRead,t))return unknown('Данные о списаниях давно не обновлялись.','source-stale');
 const localMinute=minuteOfDay(t);if(localMinute<ride.schedule.start||localMinute>=ride.schedule.end)return unknown('Сейчас вне времени работы по расписанию. Уточняем фактическую работу.','schedule');
 if(!latest||day(latest.eventAt)!==day(t))return unknown('За сегодня ещё нет подходящего списания.','no-debit');
 if(latest.eventAt>t)return unknown('Время списания требует проверки.','invalid-time');
 if(t-latest.eventAt>T*MIN)return unknown('После последнего списания прошло больше учебного порога. Работа пока не подтверждена.','debit-expired');
 return{...base,status:'open',reason:'Автооценка по недавнему списанию. Текущая работа может измениться.',source:'debits',checkedAt:latest.eventAt,needsCheck:false};
}
function parkStatus(s,t){const m=s.park.manual;if(m&&fresh(m.checkedAt,t,24*60*MIN)&&m.expiresAt>t)return{...m,source:'manual',needsCheck:false};return{status:'unknown',reason:'Актуальное состояние парка не подтверждено.',checkedAt:m?.checkedAt??null,source:'unknown',needsCheck:true};}
function derive(s,t=now(s)){
 const park=parkStatus(s,t),rides=s.rides.map(r=>{const own=ownStatus(r,s,t);let effective=own;
 if(park.status==='closed'||park.status==='paused')effective={...own,status:'closed',reason:'Парк временно закрыт. '+park.reason,source:'park',checkedAt:park.checkedAt,needsCheck:false,blockedByPark:true};
 else if(park.status==='unknown'&&own.status==='open')effective={...own,status:'unknown',reason:'Состояние парка требует проверки.',source:'park-unknown',checkedAt:own.checkedAt,needsCheck:true};
 // Metadata comes from the catalog mapping, including for saved states from earlier releases.
 const canonical=RIDES.find(item=>item.id===r.id);
 return{...r,...effective,own,catalogId:canonical.catalogId,photo:canonical.photo};});
 const counts=rides.reduce((c,r)=>(c[r.status]++,c),{open:0,paused:0,closed:0,unknown:0});
 const w=s.sources.weather,weatherFresh=w.ok&&fresh(w.checkedAt,t,20*MIN)&&w.validUntil>t;
 return{now:t,park,rides,counts,queue:rides.filter(r=>r.own.needsCheck),weather:{...w,fresh:weatherFresh,showAlert:weatherFresh&&w.alert,needsAction:weatherFresh&&w.alert&&!w.dismissed},limeFresh:sourceHealthy(s,t)};
}
function search(rides,q){const terms=normalize(q).split(' ').filter(Boolean);return rides.filter(r=>terms.every(t=>normalize(r.name+' '+r.aliases).includes(t)));}
function validateUnsafe(s){
 if(!s||s.version!==2||!Number.isInteger(s.revision)||s.revision<0||s.mode!=='debits'||!s.clock||typeof s.clock.running!=='boolean'||!Number.isFinite(s.clock.realStart)||!Number.isFinite(s.clock.offsetMs)||s.clock.offsetMs<0||s.clock.offsetMs>7*24*60*MIN)return false;
 const positive=n=>Number.isInteger(n)&&n>=1&&n<=120;
 if(!s.thresholds||!['common','individual'].includes(s.thresholds.mode)||!positive(s.thresholds.common))return false;
 const validManual=m=>m===null||(m&&['open','paused','closed','unknown'].includes(m.status)&&typeof m.reason==='string'&&m.reason.length<=300&&typeof m.author==='string'&&m.author.length<=80&&Number.isFinite(m.checkedAt)&&Number.isFinite(m.expiresAt)&&m.expiresAt>m.checkedAt);
 const validEvent=e=>e&&typeof e.id==='string'&&e.id.length<160&&Number.isFinite(e.eventAt)&&Number.isFinite(e.receivedAt)&&e.eventAt<=e.receivedAt&&['money','bonus','entitlement'].includes(e.paymentKind);
 if(!Array.isArray(s.rides)||s.rides.length!==RIDES.length||new Set(s.rides.map(r=>r.id)).size!==RIDES.length||!s.rides.every(r=>RIDES.some(c=>c.id===r.id&&c.name===r.name&&c.aliases===r.aliases)&&validManual(r.manual)&&validManual(r.lastManual)&&positive(r.thresholdMinutes)&&['known','unknown','ambiguous'].includes(r.mapping)&&r.schedule&&Number.isInteger(r.schedule.start)&&Number.isInteger(r.schedule.end)&&r.schedule.start>=0&&r.schedule.end<=1440&&r.schedule.start<r.schedule.end&&Array.isArray(r.events)&&r.events.length<=100&&r.events.every(validEvent)&&new Set(r.events.map(e=>e.id)).size===r.events.length&&Array.isArray(r.seenIds)&&r.seenIds.length<=200&&r.seenIds.every(id=>typeof id==='string'&&id.length<160)&&Array.isArray(r.reversedIds)&&r.reversedIds.length<=200&&r.reversedIds.every(id=>typeof id==='string'&&id.length<160)))return false;
 if(!s.park||!validManual(s.park.manual)||!s.sources||!s.sources.lime||!s.sources.weather)return false;
 const l=s.sources.lime,w=s.sources.weather;
 if(typeof l.ok!=='boolean'||typeof l.complete!=='boolean'||typeof l.requiresFreshRead!=='boolean'||!Number.isFinite(l.lastSuccessfulRead)||!Number.isFinite(l.receivedAt)||typeof w.ok!=='boolean'||!Number.isFinite(w.checkedAt)||!Number.isFinite(w.validUntil)||typeof w.alert!=='boolean'||typeof w.dismissed!=='boolean'||!Array.isArray(w.ids)||!w.ids.every(id=>RIDES.some(r=>r.id===id)))return false;
 if(!s.shift||typeof s.shift.active!=='boolean'||!Number.isFinite(s.shift.startedAt)||!Array.isArray(s.history)||s.history.length>200||!s.history.every(h=>h&&Number.isFinite(h.at)&&typeof h.text==='string'&&h.text.length<=1000)||!s.simulation||typeof s.simulation.saveError!=='boolean'||typeof s.simulation.offline!=='boolean')return false;
 return true;
}
function validate(s){try{return validateUnsafe(s);}catch(error){return false;}}
function ingest(s,events,t){let accepted=0,ignored=0;for(const e of events){const r=s.rides.find(x=>x.id===e.rideId);if(!r||typeof e.id!=='string'||e.id.length>=160||r.seenIds.includes(e.id)){ignored++;continue;}
 r.seenIds.push(e.id);r.seenIds=r.seenIds.slice(-200);
 if(e.type==='reversal'&&typeof e.reverses==='string'&&e.reverses.length<160){r.reversedIds.push(e.reverses);r.reversedIds=r.reversedIds.slice(-200);r.events=r.events.filter(x=>x.id!==e.reverses);ignored++;continue;}
 if(r.reversedIds.includes(e.id)||e.type!=='debit'||!e.accepted||e.reversed||!['money','bonus','entitlement'].includes(e.paymentKind)||!Number.isFinite(e.eventAt)||e.eventAt>t||r.mapping!=='known'){ignored++;continue;}
 r.events.push({id:e.id,eventAt:e.eventAt,receivedAt:t,paymentKind:e.paymentKind});r.events=r.events.sort((a,b)=>b.eventAt-a.eventAt).slice(0,100);accepted++;}
 return{accepted,ignored};}
function reduce(input,a,t=now(input)){
 if(!validate(input))throw new Error('Некорректное состояние');
 const s=copy(input);let text='';const selected=ids=>s.rides.filter(r=>ids.includes(r.id));
 const poll=(at=t,events=[])=>{s.sources.lime={ok:true,complete:true,requiresFreshRead:false,lastSuccessfulRead:at,receivedAt:events.length?at:s.sources.lime.receivedAt};return ingest(s,events,at);};
 const debit=(rideId,eventAt=t,extra={})=>({id:'event-'+(s.revision+1)+'-'+rideId,rideId,eventAt,type:'debit',accepted:true,paymentKind:'money',...extra});
 if(a.type==='clock'){
 if(typeof a.running!=='boolean'||!Number.isFinite(a.realNow)||!Number.isFinite(t)||t<BASE)throw new Error('Некорректное учебное время');
 s.clock={running:a.running,offsetMs:t-BASE,realStart:a.realNow};text=a.running?'Запущен ход учебного времени.':'Учебное время зафиксировано.';
 }else if(a.type==='manual'){
 if(!Array.isArray(a.ids)||!a.ids.length||a.ids.some(id=>!RIDES.some(r=>r.id===id))||!['open','paused','closed','unknown'].includes(a.status)||![15,30,60].includes(a.minutes)||typeof a.reason!=='string'||!a.reason.trim()||a.reason.length>180)throw new Error('Проверьте статус, причину и срок.');
 if(a.weather&&(a.status!=='paused'||!derive(s,t).weather.needsAction||a.ids.some(id=>!s.sources.weather.ids.includes(id))))throw new Error('Погодное действие допускает только подтверждённую паузу в актуальной подсказке.');
 selected(a.ids).forEach(r=>{r.manual=manual(a.status,a.reason.trim(),t,a.minutes);r.lastManual=copy(r.manual);});text='Дежурный: '+selected(a.ids).map(r=>r.name).join(', ')+'. '+LABELS[a.status]+'. '+a.reason.trim()+' До '+clock(t+a.minutes*MIN)+'.';if(a.weather)s.sources.weather.dismissed=true;
 }else if(a.type==='clear'){const r=s.rides.find(r=>r.id===a.id);if(!r)throw new Error('Аттракцион не найден');r.manual=null;text='Дежурный снял ручной статус: '+r.name+'. Результат определяется давностью списания и состоянием источника.';
 }else if(a.type==='park'){if(!['open','closed'].includes(a.status))throw new Error('Некорректный статус парка');s.park.manual=manual(a.status,a.status==='closed'?'Закрытие подтверждено дежурным. Время открытия неизвестно.':'Вход в парк открыт.',t,60);text='Дежурный: парк '+(a.status==='open'?'открыт':'временно закрыт')+'. Подтверждение на 60 минут.';
 }else if(a.type==='thresholds'){if(!['common','individual'].includes(a.mode)||!Number.isInteger(a.common)||a.common<1||a.common>120||!a.values||!RIDES.every(r=>Number.isInteger(a.values[r.id])&&a.values[r.id]>=1&&a.values[r.id]<=120))throw new Error('Учебный порог должен быть целым числом от 1 до 120 минут.');s.thresholds={mode:a.mode,common:a.common};s.rides.forEach(r=>r.thresholdMinutes=a.values[r.id]);text='Изменены учебные пороги. Это не утверждённые настройки для парка.';
 }else if(a.type==='ingest'){if(!Array.isArray(a.events)||a.events.length>100)throw new Error('Некорректный пакет');const result=poll(t,a.events);text='Учебное чтение: принято '+result.accepted+', исключено '+result.ignored+'.';
 }else if(a.type==='weather-dismiss'){s.sources.weather.dismissed=true;text='Дежурный проверил погодную подсказку: статусы оставлены без изменений.';
 }else if(a.type==='shift'){s.shift.active=a.active;s.shift.startedAt=t;text=a.active?'Дежурный принял смену. Открытые вопросы остаются в очереди.':'Дежурный подготовил передачу смены. Статусы и сроки сохранены.';
 }else if(a.type==='demo'){
 const k=a.kind;
 if(k==='advance'){s.clock.offsetMs+=31*MIN;poll(t+31*MIN);}
 else if(k==='advanceT'){const delta=(threshold(s.rides[0],s)+1)*MIN;s.clock.offsetMs+=delta;poll(t+delta);}
 else if(k==='advance6')s.clock.offsetMs+=6*MIN;
 else if(k==='lime-error'){s.sources.lime.ok=false;s.sources.lime.requiresFreshRead=true;}
 else if(k==='lime-restore')s.sources.lime.ok=true;
 else if(k==='lime-incomplete')s.sources.lime.complete=false;
 else if(k==='lime-poll')poll();
 else if(k==='lime-read')poll(t,[debit('autodrom')]);
 else if(k==='old-batch')poll(t,[debit('autodrom',t-120*MIN)]);
 else if(k==='return')poll(t,[debit('autodrom',t,{type:'refund'})]);
 else if(k==='duplicate'){const old=lastDebit(s.rides[0]);poll(t,old?[debit('autodrom',old.eventAt,{id:old.id})]:[]);}
 else if(k==='future')poll(t,[debit('autodrom',t+5*MIN)]);
 else if(k==='no-first'){s.rides[0].events=[];poll();}
 else if(k==='unmapped'){s.rides[0].mapping='unknown';s.rides[0].events=[];}
 else if(k==='ambiguous'){s.rides[0].mapping='ambiguous';s.rides[0].events=[];}
 else if(k==='mapped')s.rides[0].mapping='known';
 else if(k==='next-day'){s.clock.offsetMs+=24*60*MIN;poll(t+24*60*MIN);s.park.manual=manual('open','Учебное открытие парка на следующий день.',t+24*60*MIN,60);}
 else if(k==='weather-error')s.sources.weather.ok=false;
 else if(k==='weather-read'){s.sources.weather={...s.sources.weather,ok:true,checkedAt:t,validUntil:t+45*MIN,alert:true,dismissed:false};}
 else if(k==='weather-clear'){s.sources.weather={...s.sources.weather,ok:true,checkedAt:t,validUntil:t+45*MIN,alert:false,dismissed:false};}
 else if(k==='conflict')poll(t,[debit('wheel')]);
 else if(k==='save-error')s.simulation.saveError=!s.simulation.saveError;
 else if(k==='offline')s.simulation.offline=!s.simulation.offline;
 else throw new Error('Неизвестный сценарий');
 text='Демонстрация: '+k+'.';
 }else throw new Error('Неизвестное действие');
 s.revision++;s.history.unshift({at:t,text});s.history=s.history.slice(0,200);if(!validate(s))throw new Error('Изменение нарушает схему');return s;
}
return{BASE,MIN,TTL,KEY,RIDES,LABELS,seed,presentationSeed,now,derive,ownStatus,parkStatus,reduce,validate,search,clock,date,day,fresh,lastDebit,threshold,sourceHealthy,ageMinutes};
});
