// Presentation adapter only. Booking, validation and idempotency stay in the existing forms.
const copy={
 ru:{reviewSeats:'Проверить места',reviewOrder:'Проверить заказ',pay:'Оплатить в демо',chooseSeats:'Выбрать места',confirmSeats:'Подтвердить места',fixContact:'Исправить контакт',chooseGroup:'Выбрать количество',guests:'Гостей: {n}',selected:'Мест: {n} из {qty}',noCharge:'Без списания денег',checking:'Обработка оплаты',another:'Другой сеанс',events:'К событиям'},
 en:{reviewSeats:'Review seats',reviewOrder:'Review order',pay:'Pay in demo',chooseSeats:'Choose seats',confirmSeats:'Confirm seats',fixContact:'Correct contact',chooseGroup:'Choose group size',guests:'Guests: {n}',selected:'Seats: {n} of {qty}',noCharge:'No money charged',checking:'Processing payment',another:'Another session',events:'Back to events'},
 hy:{reviewSeats:'Ստուգել տեղերը',reviewOrder:'Ստուգել պատվերը',pay:'Վճարել դեմո ռեժիմում',chooseSeats:'Ընտրել տեղերը',confirmSeats:'Հաստատել տեղերը',fixContact:'Ուղղել կոնտակտը',chooseGroup:'Ընտրել քանակը',guests:'Հյուրեր՝ {n}',selected:'Տեղեր՝ {n} / {qty}',noCharge:'Գումար չի գանձվում',checking:'Վճարումը մշակվում է',another:'Այլ ժամ',events:'Դեպի միջոցառումներ'}
};
export function mobileCopy(lang,key,vars={}){let value=copy[lang]?.[key]??copy.ru[key]??key;for(const[k,v]of Object.entries(vars))value=value.replaceAll('{'+k+'}',v);return value;}
export function createMobileActions(root,getModel){
 const media=matchMedia('(max-width:720px)');
 let model=null,signature='',seenSeats=false,seenOrder=false,reviewAfterRenew=false,resizeObserver=null,frame=0,pendingTarget=null;
 const html=document.documentElement;
 const text=(key,vars)=>mobileCopy(model.lang,key,vars);
 function measure(){
  const dock=root.querySelector('.booking-action-dock');
  const viewport=window.visualViewport;
  const offset=media.matches&&viewport?Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop):0;
  html.style.setProperty('--booking-keyboard-offset',offset+'px');
  html.style.setProperty('--booking-dock-height',media.matches&&dock?Math.ceil(dock.getBoundingClientRect().height)+'px':'0px');
 }
 function visible(selector){
  const el=root.querySelector(selector);if(!el)return false;
  const box=el.getBoundingClientRect(),vv=window.visualViewport,dock=root.querySelector('.booking-action-dock');
  const top=vv?.offsetTop||0,bottom=Math.min(top+(vv?.height||innerHeight),dock?.getBoundingClientRect().top??innerHeight);
  return box.height>0&&box.top>=top-1&&box.bottom<=bottom+1;
 }
 function selectionObserved(){
  if(!model||!media.matches||!['select','payment'].includes(model.phase)||model.map||reviewAfterRenew)return;
  if(visible('#booking-seats-review'))seenSeats=true;
  if(visible('#booking-order-review'))seenOrder=true;
 }
 function action(){
  if(!model||!model.visible)return null;
  if(model.phase==='processing')return {name:'processing',label:text('checking'),disabled:true};
  const results={unknown:['check','checkPayment'],pending:['issue','checkTicket'],declined:['retry','retry'],expired:['renew','renew'],security:['help','help'],issued:['download','saveTicket']};
  if(results[model.phase]){const[name,key]=results[model.phase];return {name,label:model.t(key)};}
  if(model.readOnly)return null;
  if(model.unavailable)return {name:'fallback',label:model.alternate?text('another'):text('events')};
  if(model.group)return {name:'choose-group',label:text('chooseGroup')};
  if(model.map)return {name:'confirm-seats',label:model.complete?text('confirmSeats'):text('selected',{n:model.seats,qty:model.qty}),disabled:!model.complete};
  if(!model.complete)return {name:'choose-seats',label:text('chooseSeats')};
  if(model.error==='emailError')return {name:'fix-contact',label:text('fixContact')};
  if(model.seated&&!seenSeats)return {name:model.kind==='form'?'review-seats':'review-order',label:text(model.kind==='form'?'reviewSeats':'reviewOrder'),target:'#booking-seats-review'};
  if(!seenOrder)return {name:'review-order',label:text('reviewOrder'),target:'#booking-order-review'};
  return {name:'pay',label:text('pay')+' · '+model.amount};
 }
 function update(){
  root.querySelectorAll('[data-booking-inline]').forEach(el=>el.removeAttribute('data-booking-inline'));
  model=getModel();
  if(model.signature!==signature){signature=model.signature;seenSeats=false;seenOrder=false;}
  if(model.phase==='expired'){seenSeats=false;seenOrder=false;reviewAfterRenew=true;}
  if(!model.visible){root.querySelector('.booking-action-dock')?.remove();html.removeAttribute('data-booking-dock');measure();return;}
  let dock=root.querySelector('.booking-action-dock');
  if(!dock){dock=document.createElement('aside');dock.className='booking-action-dock';dock.dataset.bookingDock='';dock.innerHTML='<div class="booking-action-context"></div><button type="button" class="btn" data-vp-cta="primary" data-booking-next></button>';root.append(dock);resizeObserver?.disconnect();resizeObserver=new ResizeObserver(measure);resizeObserver.observe(dock);}
  html.setAttribute('data-booking-dock','');
  let next=action();
  if(!next){dock.remove();html.removeAttribute('data-booking-dock');measure();return;}
  const context=dock.querySelector('.booking-action-context');
  context.textContent=model.context||(text('guests',{n:model.qty})+(model.seated&&model.seatText?' · '+model.seatText:'')+' · '+model.amount);
  const button=dock.querySelector('[data-booking-next]');
  // Measure with the actual context and label before deciding what has been shown.
  button.textContent=next.label;measure();selectionObserved();next=action();
  button.dataset.nextAction=next.name;button.textContent=next.label;button.disabled=Boolean(next.disabled);
  if(['download','check','issue','retry','renew','help'].includes(next.name))root.querySelector('.result>.action-row>[data-action="'+next.name+'"]')?.setAttribute('data-booking-inline','');
  if(next.name==='processing')context.setAttribute('role','status');else context.removeAttribute('role');
  measure();
 }
 function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(update);}
 function focusTarget(selector){
  const target=root.querySelector(selector);if(!target)return;
  if(!target.matches('input,button,[tabindex]'))target.tabIndex=-1;
  target.focus({preventScroll:true});
  const vv=window.visualViewport,top=vv?.offsetTop||0;
  const header=root.querySelector('.booking-mobile-header[data-booking-compact]');
  const inset=(header&&getComputedStyle(header).position==='sticky'?header.getBoundingClientRect().height:0)+18;
  window.scrollTo({top:Math.max(0,window.scrollY+target.getBoundingClientRect().top-top-inset),behavior:'auto'});
  schedule();
 }
 function triggerExisting(name){const target=root.querySelector('[data-action="'+name+'"]');if(target&&!target.disabled)target.click();}
 root.addEventListener('click',event=>{
  const button=event.target.closest('[data-booking-next]');if(!button||button.disabled||!media.matches)return;
  event.preventDefault();const intended=button.dataset.nextAction;update();const next=action();if(!next||next.disabled||intended!==next.name)return;
  switch(next.name){
   case 'review-seats':case 'review-order':reviewAfterRenew=false;focusTarget(next.target);break;
   case 'fix-contact':focusTarget('#email');break;
   case 'choose-group':focusTarget('.group-answers');break;
   case 'choose-seats':triggerExisting('manual');break;
   case 'confirm-seats':triggerExisting('mapDone');break;
   case 'fallback':triggerExisting(model.alternate?'sessions':'catalog');break;
   case 'pay':root.querySelector(model.form)?.requestSubmit();break;
   default:triggerExisting(next.name);
  }
 });
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});
 window.visualViewport?.addEventListener('resize',()=>{measure();schedule();if(document.activeElement?.id==='email')requestAnimationFrame(()=>focusTarget('#email'));},{passive:true});
 window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
 media.addEventListener('change',schedule);
 return {mount(){update();if(pendingTarget){const target=pendingTarget;pendingTarget=null;requestAnimationFrame(()=>focusTarget(target));}schedule();},refresh:schedule,reviewed(){update();return !media.matches||model?.complete&&!model?.map&&(!model?.seated||seenSeats)&&seenOrder;},requestReview(){update();const next=action();if(next?.target){reviewAfterRenew=false;focusTarget(next.target);}else if(next?.name==='fix-contact')focusTarget('#email');else if(next?.name==='choose-seats')triggerExisting('manual');},approveSeats(){update();reviewAfterRenew=false;seenSeats=true;pendingTarget='#booking-order-review';},reviewOrder(){pendingTarget='#booking-order-review';},focusMap(){pendingTarget='.map-scroll';},focusError(){requestAnimationFrame(()=>focusTarget('#email'));},reset(){seenSeats=false;seenOrder=false;}};
}
