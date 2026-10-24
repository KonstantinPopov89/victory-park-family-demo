// A shared history view, not a shared order model. Reading never activates an order.
(async function(){
 'use strict';
 if(!await VPFamilyStorage.wait())return;
 const copy={
  ru:{title:'Мои покупки',note:'Билеты и операции с картой парка в этом браузере. На другом устройстве понадобятся сохранённые файлы.',empty:'Билетов и операций с картой парка здесь пока нет.',testTopup:'Пополнения тестовой карты',testTopupNote:'У тестовой карты отдельная история пополнений. Она хранится в этом браузере.',choose:'Выбрать билеты',a:'Билеты и пакеты катаний',topup:'Пополнение карты',nocard:'Заказ карты парка',unlimited:'Безлимит по каталогу парка','dino-ticket':'Билет в Дино Парк',card:'Карта',success:'Демонстрация завершена',cancel:'Оплата отменена',fail:'Оплата не завершена',declined:'Оплата не завершена',pending:'Результат проверяется. Повторно не оплачивайте.',delay:'Выдача задержана. Повторно не оплачивайте.',issuance:'Выдача задержана. Повторно не оплачивайте.',partial:'Готова часть билетов. Повторно не оплачивайте.',tickets:'Открыть билеты',receipt:'Открыть квитанцию',result:'Посмотреть результат'},
  en:{title:'My purchases',note:'Tickets and park card operations in this browser. On another device, you will need your saved files.',empty:'No tickets or park card operations in this list yet.',testTopup:'Test card top-ups',testTopupNote:'The test card has a separate top-up history, saved in this browser.',choose:'Choose tickets',a:'Ride tickets and packages',topup:'Card top-up',nocard:'Park card order',unlimited:'Park catalogue unlimited pass','dino-ticket':'Dino Park ticket',card:'Card',success:'Demo completed',cancel:'Payment cancelled',fail:'Payment not completed',declined:'Payment not completed',pending:'Result being checked. Do not pay again.',delay:'Issuance delayed. Do not pay again.',issuance:'Issuance delayed. Do not pay again.',partial:'Some tickets are ready. Do not pay again.',tickets:'Open tickets',receipt:'Open receipt',result:'View result'},
  hy:{title:'Իմ գնումները',note:'Այս դիտարկիչում պահված տոմսերն ու այգու քարտի գործարքները։ Մեկ այլ սարքում անհրաժեշտ կլինեն պահպանված ֆայլերը։',empty:'Այս ցուցակում դեռ տոմսեր կամ այգու քարտի գործարքներ չկան։',testTopup:'Փորձնական քարտի լիցքավորումներ',testTopupNote:'Փորձնական քարտն ունի լիցքավորումների առանձին պատմություն, որը պահվում է այս դիտարկիչում։',choose:'Ընտրել տոմսեր',a:'Ատրակցիոնների տոմսեր և փաթեթներ',topup:'Քարտի լիցքավորում',nocard:'Այգու քարտի պատվեր',unlimited:'Այգու կատալոգի անսահմանափակ աբոնեմենտ','dino-ticket':'Դինո Պարկի տոմս',card:'Քարտ',success:'Ցուցադրությունն ավարտված է',cancel:'Վճարումը չեղարկված է',fail:'Վճարումը չի ավարտվել',declined:'Վճարումը չի ավարտվել',pending:'Արդյունքը ստուգվում է։ Կրկին մի վճարեք։',delay:'Տրամադրումը ուշանում է։ Կրկին մի վճարեք։',issuance:'Տրամադրումը ուշանում է։ Կրկին մի վճարեք։',partial:'Տոմսերի մի մասը պատրաստ է։ Կրկին մի վճարեք։',tickets:'Բացել տոմսերը',receipt:'Բացել անդորրագիրը',result:'Դիտել արդյունքը'}
 };
 const sessionCopy={
  ru:{demo:'Сеанс: демонстрационный заказ',guests:'Гостей',seats:'Места',select:'Выбор не завершён',payment:'Места удерживаются только в демо. Оплата не начата.',processing:'Проверяем оплату. Повторно не оплачивайте.',declined:'Оплата отклонена без списания. Повтор разрешён.',security:'Повторная оплата запрещена. Откройте помощь по заказу.',unknown:'Ответа об оплате пока нет. Повторно не оплачивайте.',pending:'Оплачено в демо. Билет ещё не выпущен.',issued:'Демобилет готов. Не даёт права входа.',expired:'Удержание истекло. Нужно проверить доступность.',ticket:'Открыть демобилет',resume:'Открыть заказ',time:'Время по Еревану'},
  en:{demo:'Session: demo order',guests:'Guests',seats:'Seats',select:'Selection incomplete',payment:'Places held in the demo only. Payment not started.',processing:'Checking payment. Do not pay again.',declined:'Payment declined without charge. Retry permitted.',security:'Another payment attempt is prohibited. Open order support.',unknown:'No payment response yet. Do not pay again.',pending:'Paid in the demo. Ticket not issued yet.',issued:'Demo ticket ready. Not valid for entry.',expired:'Hold expired. Check availability again.',ticket:'Open demo ticket',resume:'Open order',time:'Yerevan time'},
  hy:{demo:'Սեանս. ցուցադրական պատվեր',guests:'Այցելուներ',seats:'Նստատեղեր',select:'Ընտրությունը չի ավարտվել',payment:'Տեղերը պահվում են միայն ցուցադրությունում։ Վճարումը չի սկսվել։',processing:'Ստուգում ենք վճարումը։ Կրկին մի վճարեք։',declined:'Վճարումը մերժվել է առանց գանձման։ Կրկնակի փորձը թույլատրված է։',security:'Կրկնակի վճարումն արգելված է։ Բացեք պատվերի աջակցությունը։',unknown:'Վճարման պատասխանը դեռ չկա։ Կրկին մի վճարեք։',pending:'Վճարված է ցուցադրությունում։ Տոմսը դեռ չի տրամադրվել։',issued:'Ցուցադրական տոմսը պատրաստ է։ Մուտքի իրավունք չի տալիս։',expired:'Տեղերը պահելու ժամկետն ավարտվել է։ Ստուգեք հասանելիությունը։',ticket:'Բացել ցուցադրական տոմսը',resume:'Բացել պատվերը',time:'Երևանի ժամանակով'}
 };
 const sessionKey='vp.family.v6.sessions.v1';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function read(key,session=false){try{return JSON.parse((session?sessionStorage:localStorage).getItem(key)||'null');}catch{return null;}}
 function readSessionStore(){
  return new Promise(resolve=>{
   let settled=false,db=null;
   const finish=value=>{if(settled){db?.close();return;}settled=true;clearTimeout(timer);db?.close();resolve(value);};
   const fallback=()=>finish(read(sessionKey));
   const timer=setTimeout(fallback,2000);
   try{
    if(!window.indexedDB){fallback();return;}
    const request=window.indexedDB.open(sessionKey,1);
    // Visiting history must not create or migrate the booking database.
    request.onupgradeneeded=()=>{request.transaction.abort();};
    request.onerror=fallback;request.onblocked=fallback;
    request.onsuccess=()=>{
     db=request.result;if(settled){db.close();return;}
     if(!db.objectStoreNames.contains('booking')){fallback();return;}
     try{const tx=db.transaction('booking','readonly'),get=tx.objectStore('booking').get('record');let value=null;get.onsuccess=()=>{value=get.result||null;};tx.oncomplete=()=>finish(value);tx.onerror=fallback;tx.onabort=fallback;}catch{fallback();}
    };
   }catch{fallback();}
  });
 }
 function language(){const l=window.VPI18n?.language||new URLSearchParams(location.search).get('lang')||document.documentElement.lang;return copy[l]?l:'ru';}
 function sessionDateText(at,lang){
  const date=new Date(at);
  // Some browsers accept hy-AM but silently format it in their fallback locale.
  // These demo sessions use Yerevan's UTC+4, as the booking screens do.
  if(lang==='hy'){
   const local=new Date(date.getTime()+4*3600000),months=['հունվարի','փետրվարի','մարտի','ապրիլի','մայիսի','հունիսի','հուլիսի','օգոստոսի','սեպտեմբերի','հոկտեմբերի','նոյեմբերի','դեկտեմբերի'];
   return local.getUTCDate()+' '+months[local.getUTCMonth()]+' '+local.getUTCFullYear()+', '+String(local.getUTCHours()).padStart(2,'0')+':'+String(local.getUTCMinutes()).padStart(2,'0');
  }
  return new Intl.DateTimeFormat(lang==='en'?'en-GB':'ru-RU',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Yerevan'}).format(date);
 }
 function validB(o){return !!o&&typeof o.id==='string'&&/^VP[A-Z0-9]{1,40}$/.test(o.id)&&Number.isSafeInteger(o.amount)&&o.amount>0&&o.amount<=100000000&&['topup','nocard','unlimited','dino-ticket'].includes(o.product)&&Number.isInteger(o.qty)&&o.qty>=1&&o.qty<=10&&typeof o.ts==='string'&&Number.isFinite(Date.parse(o.ts))&&typeof o.last4==='string'&&/^(?:\d{4})?$/.test(o.last4);}
 function validSession(o){
  if(!o||typeof o!=='object'||typeof o.id!=='string'||!/^demo-[1-9]\d{0,12}$/.test(o.id)||!['form','quiz'].includes(o.variant))return false;
  const s=o.snapshot,allowed={show:['show-1','show-2','show-3'],garden:['garden-1','garden-2']};
  if(!s||typeof s!=='object'||!Object.hasOwn(allowed,o.eventId)||!allowed[o.eventId].includes(o.sessionId)||!Number.isSafeInteger(o.qty)||o.qty<1||o.qty>8||!Number.isSafeInteger(o.amount)||o.amount<=0||o.amount>100000000)return false;
  if(!Number.isFinite(o.createdAt)||!Number.isFinite(o.updatedAt)||o.createdAt<=0||o.updatedAt<o.createdAt||!Number.isFinite(new Date(o.updatedAt).getTime()))return false;
  if(!['select','payment','processing','declined','security','unknown','pending','issued','expired'].includes(o.phase)||s.orderId!==o.id||s.eventId!==o.eventId||s.sessionId!==o.sessionId||s.qty!==o.qty||s.phase!==o.phase)return false;
  if(!Array.isArray(o.seats)||!Array.isArray(s.seats)||o.seats.length!==s.seats.length||o.seats.some((seat,i)=>typeof seat!=='string'||!/^([A-F][1-8])$/.test(seat)||seat!==s.seats[i])||new Set(o.seats).size!==o.seats.length)return false;
  if(o.eventId==='garden'&&o.seats.length!==0||o.eventId==='show'&&o.seats.length!==o.qty)return false;
  if(typeof o.sessionAt!=='string'||!Number.isFinite(Date.parse(o.sessionAt))||!o.eventTitle||typeof o.eventTitle!=='object'||!['ru','hy','en'].every(lang=>typeof o.eventTitle[lang]==='string'&&o.eventTitle[lang].length>0&&o.eventTitle[lang].length<=200))return false;
  return o.currency==='AMD'&&Number.isSafeInteger(o.unitPrice)&&o.unitPrice>0&&o.unitPrice*o.qty===o.amount;
 }
 function orders(sessionStore){
  const rows=[],a=new Map(),b=new Map(),history=read('vp.family.v6.people.v1.orders');
  for(const raw of [...(Array.isArray(history)?history:[]),read('vp.family.v6.people.v1.order')]){const o=window.VPC?.validateOrder(raw);if(o)a.set(o.id,o);}
  for(const o of a.values())rows.push({model:'a',id:o.id,title:'a',amount:o.total,status:o.status,time:o.createdAt||o.ts||'',card:''});
  const all=read('vpOrders');if(all&&typeof all==='object'&&!Array.isArray(all))for(const [key,o] of Object.entries(all))if(validB(o)&&key===o.id)b.set(o.id,o);
  // Session-only operations are recoverable too; a saved response remains authoritative.
  const active=read('vpOrder',true);if(validB(active)&&!b.has(active.id))b.set(active.id,active);
  for(const o of b.values())rows.push({model:'b',id:o.id,title:o.product,amount:o.amount,status:['success','pending','delay','fail','cancel'].includes(o.resultStatus)?o.resultStatus:'pending',time:o.resultAt||o.ts,card:o.last4});
  const sessions=new Map();
  if(sessionStore?.version===1&&Array.isArray(sessionStore.orders))for(const o of sessionStore.orders){if(validSession(o)&&(!sessions.has(o.id)||sessions.get(o.id).updatedAt<o.updatedAt))sessions.set(o.id,o);}
  for(const o of sessions.values())rows.push({model:'session',id:o.id,amount:o.amount,status:o.phase,time:new Date(o.updatedAt).toISOString(),booking:o});
  return rows.sort((x,y)=>(Date.parse(y.time)||0)-(Date.parse(x.time)||0)||x.id.localeCompare(y.id));
 }
 function route(row,lang){
  const base=window.VPI18n?.base||new URL('../../',location.href).pathname;
  const url=new URL(base+(row.model==='session'?'sessions/'+row.booking.variant+'.html':row.model==='a'?'experience/guest/quick.html':lang+'/pay/result/index.html'),location.origin);
  url.searchParams.set(row.model==='a'||row.model==='session'?'resume':'order',row.id);url.searchParams.set('lang',lang);
  if(new URLSearchParams(location.search).get('review')==='1')url.searchParams.set('review','1');
  return url.pathname+url.search;
 }
 let focused=false,renderSequence=0;
 async function showHistory(){
  const sequence=++renderSequence;
  if(location.hash!=='#purchase-history'){focused=false;return;}
  if(!document.getElementById('app'))return;
  const sessionStore=await readSessionStore();
  if(sequence!==renderSequence||location.hash!=='#purchase-history')return;
  const app=document.getElementById('app');if(!app)return;
  const lang=language(),c=copy[lang],rows=orders(sessionStore);
  let section=document.getElementById('purchase-history');
  if(!section||!section.hasAttribute('data-unified-history')){const old=section;section=document.createElement('section');section.id='purchase-history';section.className='quick-order purchase-history';section.setAttribute('data-unified-history','');section.setAttribute('data-i18n-skip','');section.setAttribute('aria-labelledby','purchase-history-title');section.tabIndex=-1;if(old)old.remove();app.prepend(section);}
  const content='<h2 id="purchase-history-title">'+c.title+(rows.length?' ('+rows.length+')':'')+'</h2><p class="helper">'+(rows.length?c.note:c.empty)+'</p>'+rows.map(row=>{
   if(row.model==='session'){
    const o=row.booking,sc=sessionCopy[lang],sessionDate=sessionDateText(o.sessionAt,lang);
    return '<article class="past-order" style="flex-wrap:wrap" data-history-model="session" data-history-id="'+esc(row.id)+'"><span style="flex:1 1 200px;min-width:0;overflow-wrap:anywhere"><strong>'+esc(o.eventTitle[lang])+'</strong><small>'+esc(sc.demo)+'</small><small>'+esc(sessionDate)+' · '+esc(sc.time)+'</small><small>'+esc(sc.guests)+': '+o.qty+(o.seats.length?' · '+esc(sc.seats)+': '+esc(o.seats.join(', ')):'')+'</small><small>'+esc(row.id)+' · '+new Intl.NumberFormat(lang).format(row.amount)+' ֏</small><small>'+esc(sc[row.status])+'</small></span><a class="btn btn-outline" data-vp-cta="secondary" href="'+esc(route(row,lang))+'">'+esc(row.status==='issued'?sc.ticket:sc.resume)+'</a></article>';
   }
   const ready=row.status==='success'||row.status==='partial',receipt=row.model==='b'&&['topup','nocard'].includes(row.title),label=ready?(receipt?c.receipt:c.tickets):c.result;
   const date=Number.isFinite(Date.parse(row.time))?new Intl.DateTimeFormat(lang==='hy'?'hy-AM':lang==='en'?'en-GB':'ru-RU',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Yerevan'}).format(new Date(row.time)):'';
   return '<article class="past-order" style="flex-wrap:wrap" data-history-model="'+row.model+'" data-history-id="'+esc(row.id)+'"><span style="flex:1 1 200px"><strong>'+c[row.title]+'</strong><small>'+esc(row.id)+' · '+new Intl.NumberFormat(lang).format(row.amount)+' ֏'+(row.card?' · '+c.card+' …'+esc(row.card):'')+'</small><small>'+esc(date)+'</small><small>'+esc(c[row.status]||c.pending)+'</small></span><a class="btn btn-outline" data-vp-cta="secondary" href="'+esc(route(row,lang))+'">'+label+'</a></article>';
  }).join('')+(!rows.length?'<a class="btn btn-primary" data-vp-cta="primary" data-history-choose href="quick.html?lang='+lang+'">'+c.choose+'</a>':'')+'<p class="helper">'+c.testTopupNote+'</p><a class="btn btn-outline" data-vp-cta="secondary" data-history-test-topup href="topup.html?lang='+lang+'">'+c.testTopup+'</a>';
  if(section.innerHTML!==content)section.innerHTML=content;
  if(!focused){focused=true;requestAnimationFrame(()=>{if(section.isConnected&&location.hash==='#purchase-history'){section.scrollIntoView({block:'start'});section.focus({preventScroll:true});}});}
 }
 document.addEventListener('vp:catalog-rendered',showHistory);
 document.addEventListener('vp:language',showHistory);
 document.addEventListener('vp:sessions-updated',showHistory);
 window.addEventListener('hashchange',showHistory);
 window.addEventListener('pageshow',showHistory);
 window.addEventListener('storage',e=>{if(['vpOrders','vp.family.v6.people.v1.orders','vp.family.v6.people.v1.order',sessionKey].includes(e.key)||e.key===null)showHistory();});
 showHistory();
})();
