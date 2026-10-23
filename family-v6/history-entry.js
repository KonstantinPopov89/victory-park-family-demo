// A shared history view, not a shared order model. Reading never activates an order.
(function(){
 'use strict';
 const copy={
  ru:{title:'Мои покупки',note:'Билеты и операции с картой парка в этом браузере. На другом устройстве понадобятся сохранённые файлы.',empty:'Билетов и операций с картой парка здесь пока нет.',testTopup:'Пополнения тестовой карты',testTopupNote:'У тестовой карты отдельная история пополнений. Она хранится в этом браузере.',choose:'Выбрать билеты',a:'Билеты и пакеты катаний',topup:'Пополнение карты',nocard:'Заказ карты парка',unlimited:'Безлимит по каталогу парка','dino-ticket':'Билет в Дино Парк',card:'Карта',success:'Демонстрация завершена',cancel:'Оплата отменена',fail:'Оплата не завершена',declined:'Оплата не завершена',pending:'Результат проверяется. Повторно не оплачивайте.',delay:'Выдача задержана. Повторно не оплачивайте.',issuance:'Выдача задержана. Повторно не оплачивайте.',partial:'Готова часть билетов. Повторно не оплачивайте.',tickets:'Открыть билеты',receipt:'Открыть квитанцию',result:'Посмотреть результат'},
  en:{title:'My purchases',note:'Tickets and park card operations in this browser. On another device, you will need your saved files.',empty:'No tickets or park card operations in this list yet.',testTopup:'Test card top-ups',testTopupNote:'The test card has a separate top-up history, saved in this browser.',choose:'Choose tickets',a:'Ride tickets and packages',topup:'Card top-up',nocard:'Park card order',unlimited:'Park catalogue unlimited pass','dino-ticket':'Dino Park ticket',card:'Card',success:'Demo completed',cancel:'Payment cancelled',fail:'Payment not completed',declined:'Payment not completed',pending:'Result being checked. Do not pay again.',delay:'Issuance delayed. Do not pay again.',issuance:'Issuance delayed. Do not pay again.',partial:'Some tickets are ready. Do not pay again.',tickets:'Open tickets',receipt:'Open receipt',result:'View result'},
  hy:{title:'Իմ գնումները',note:'Այս դիտարկիչում պահված տոմսերն ու այգու քարտի գործարքները։ Մեկ այլ սարքում անհրաժեշտ կլինեն պահպանված ֆայլերը։',empty:'Այս ցուցակում դեռ տոմսեր կամ այգու քարտի գործարքներ չկան։',testTopup:'Փորձնական քարտի լիցքավորումներ',testTopupNote:'Փորձնական քարտն ունի լիցքավորումների առանձին պատմություն, որը պահվում է այս դիտարկիչում։',choose:'Ընտրել տոմսեր',a:'Ատրակցիոնների տոմսեր և փաթեթներ',topup:'Քարտի լիցքավորում',nocard:'Այգու քարտի պատվեր',unlimited:'Այգու կատալոգի անսահմանափակ աբոնեմենտ','dino-ticket':'Դինո Պարկի տոմս',card:'Քարտ',success:'Ցուցադրությունն ավարտված է',cancel:'Վճարումը չեղարկված է',fail:'Վճարումը չի ավարտվել',declined:'Վճարումը չի ավարտվել',pending:'Արդյունքը ստուգվում է։ Կրկին մի վճարեք։',delay:'Տրամադրումը ուշանում է։ Կրկին մի վճարեք։',issuance:'Տրամադրումը ուշանում է։ Կրկին մի վճարեք։',partial:'Տոմսերի մի մասը պատրաստ է։ Կրկին մի վճարեք։',tickets:'Բացել տոմսերը',receipt:'Բացել անդորրագիրը',result:'Դիտել արդյունքը'}
 };
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function read(key,session=false){try{return JSON.parse((session?sessionStorage:localStorage).getItem(key)||'null');}catch{return null;}}
 function language(){const l=window.VPI18n?.language||new URLSearchParams(location.search).get('lang')||document.documentElement.lang;return copy[l]?l:'ru';}
 function validB(o){return !!o&&typeof o.id==='string'&&/^VP[A-Z0-9]{1,40}$/.test(o.id)&&Number.isSafeInteger(o.amount)&&o.amount>0&&o.amount<=100000000&&['topup','nocard','unlimited','dino-ticket'].includes(o.product)&&Number.isInteger(o.qty)&&o.qty>=1&&o.qty<=10&&typeof o.ts==='string'&&Number.isFinite(Date.parse(o.ts))&&typeof o.last4==='string'&&/^(?:\d{4})?$/.test(o.last4);}
 function orders(){
  const rows=[],a=new Map(),b=new Map(),history=read('vp.family.v5.orders');
  for(const raw of [...(Array.isArray(history)?history:[]),read('vp.family.v5.order')]){const o=window.VPC?.validateOrder(raw);if(o)a.set(o.id,o);}
  for(const o of a.values())rows.push({model:'a',id:o.id,title:'a',amount:o.total,status:o.status,time:o.createdAt||o.ts||'',card:''});
  const all=read('vpOrders');if(all&&typeof all==='object'&&!Array.isArray(all))for(const [key,o] of Object.entries(all))if(validB(o)&&key===o.id)b.set(o.id,o);
  // Session-only operations are recoverable too; a saved response remains authoritative.
  const active=read('vpOrder',true);if(validB(active)&&!b.has(active.id))b.set(active.id,active);
  for(const o of b.values())rows.push({model:'b',id:o.id,title:o.product,amount:o.amount,status:['success','pending','delay','fail','cancel'].includes(o.resultStatus)?o.resultStatus:'pending',time:o.resultAt||o.ts,card:o.last4});
  return rows.sort((x,y)=>(Date.parse(y.time)||0)-(Date.parse(x.time)||0)||x.id.localeCompare(y.id));
 }
 function route(row,lang){
  const base=window.VPI18n?.base||new URL('../../',location.href).pathname;
  const url=new URL(base+(row.model==='a'?'experience/guest/quick.html':lang+'/pay/result/index.html'),location.origin);
  url.searchParams.set(row.model==='a'?'resume':'order',row.id);url.searchParams.set('lang',lang);
  if(new URLSearchParams(location.search).get('review')==='1')url.searchParams.set('review','1');
  return url.pathname+url.search;
 }
 let focused=false;
 function showHistory(){
  if(location.hash!=='#purchase-history'){focused=false;return;}
  const app=document.getElementById('app');if(!app)return;
  const lang=language(),c=copy[lang],rows=orders();
  let section=document.getElementById('purchase-history');
  if(!section||!section.hasAttribute('data-unified-history')){const old=section;section=document.createElement('section');section.id='purchase-history';section.className='quick-order purchase-history';section.setAttribute('data-unified-history','');section.setAttribute('data-i18n-skip','');section.setAttribute('aria-labelledby','purchase-history-title');section.tabIndex=-1;if(old)old.remove();app.prepend(section);}
  const content='<h2 id="purchase-history-title">'+c.title+(rows.length?' ('+rows.length+')':'')+'</h2><p class="helper">'+(rows.length?c.note:c.empty)+'</p>'+rows.map(row=>{
   const ready=row.status==='success'||row.status==='partial',receipt=row.model==='b'&&['topup','nocard'].includes(row.title),label=ready?(receipt?c.receipt:c.tickets):c.result;
   const date=Number.isFinite(Date.parse(row.time))?new Intl.DateTimeFormat(lang==='hy'?'hy-AM':lang==='en'?'en-GB':'ru-RU',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Yerevan'}).format(new Date(row.time)):'';
   return '<article class="past-order" style="flex-wrap:wrap" data-history-model="'+row.model+'" data-history-id="'+esc(row.id)+'"><span style="flex:1 1 200px"><strong>'+c[row.title]+'</strong><small>'+esc(row.id)+' · '+new Intl.NumberFormat(lang).format(row.amount)+' ֏'+(row.card?' · '+c.card+' …'+esc(row.card):'')+'</small><small>'+esc(date)+'</small><small>'+esc(c[row.status]||c.pending)+'</small></span><a class="btn btn-outline" data-vp-cta="secondary" href="'+esc(route(row,lang))+'">'+label+'</a></article>';
  }).join('')+(!rows.length?'<a class="btn btn-primary" data-vp-cta="primary" data-history-choose href="quick.html?lang='+lang+'">'+c.choose+'</a>':'')+'<p class="helper">'+c.testTopupNote+'</p><a class="btn btn-outline" data-vp-cta="secondary" data-history-test-topup href="topup.html?lang='+lang+'">'+c.testTopup+'</a>';
  if(section.innerHTML!==content)section.innerHTML=content;
  if(!focused){focused=true;requestAnimationFrame(()=>{if(section.isConnected&&location.hash==='#purchase-history'){section.scrollIntoView({block:'start'});section.focus({preventScroll:true});}});}
 }
 document.addEventListener('vp:catalog-rendered',showHistory);
 document.addEventListener('vp:language',showHistory);
 window.addEventListener('hashchange',showHistory);
 window.addEventListener('pageshow',showHistory);
 window.addEventListener('storage',e=>{if(['vpOrders','vp.family.v5.orders','vp.family.v5.order'].includes(e.key)||e.key===null)showHistory();});
 showHistory();
})();
