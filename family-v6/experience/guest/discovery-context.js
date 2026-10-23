/* Preserve the existing catalogue browsing category. Identity/category only;
   no prices, eligibility, order or operational claims enter the guest model. */
(()=>{'use strict';
 const metadata={"koleso":{"category":"family","unlimitedExample":true},"kobra":{"category":"extreme","unlimitedExample":true},"autodrom":{"category":"family","unlimitedExample":true},"gorki":{"category":"family","unlimitedExample":true},"pendulum":{"category":"extreme","unlimitedExample":true},"orbita":{"category":"extreme","unlimitedExample":true},"lebedi":{"category":"kids","unlimitedExample":true},"pirat":{"category":"extreme","unlimitedExample":true},"arbuz":{"category":"kids","unlimitedExample":true},"bashnya":{"category":"extreme","unlimitedExample":true},"shary":{"category":"family","unlimitedExample":true},"planeta":{"category":"family","unlimitedExample":true},"cep":{"category":"family","unlimitedExample":true},"moto":{"category":"extreme","unlimitedExample":true},"raketa":{"category":"kids","unlimitedExample":true},"avtoralli":{"category":"family","unlimitedExample":true},"mars":{"category":"extreme","unlimitedExample":true},"syurpriz":{"category":"kids","unlimitedExample":true},"zamok":{"category":"family","unlimitedExample":true},"vodnye-lebedi":{"category":"family","unlimitedExample":true},"solnyshko":{"category":"kids","unlimitedExample":true},"begemot":{"category":"kids","unlimitedExample":true},"tornado":{"category":"extreme","unlimitedExample":true},"sloniki":{"category":"kids","unlimitedExample":true},"labirint-detskiy":{"category":"kids","unlimitedExample":true},"svetofor":{"category":"kids","unlimitedExample":true},"batuty":{"category":"kids","unlimitedExample":true},"poezd":{"category":"kids","unlimitedExample":true},"kapik":{"category":"kids","unlimitedExample":true},"labirint":{"category":"family","unlimitedExample":true},"vr-cinema":{"category":"family","unlimitedExample":true},"vr-2":{"category":"extreme","unlimitedExample":false},"dark-vr":{"category":"extreme","unlimitedExample":false},"tir":{"category":"games","unlimitedExample":false},"avtomaty":{"category":"games","unlimitedExample":false}};
 const base=new URL('../../',document.currentScript.src).pathname;
 const p=new URLSearchParams(location.search);
 const category=['family','kids','extreme','games','unl'].includes(p.get('cat'))?p.get('cat'):p.get('filter')==='unl'?'unl':'';
 const language=p.get('lang')||document.documentElement.lang||'ru';
 const copy={ru:{family:'Для всей семьи',kids:'Для малышей',extreme:'Экстрим',games:'Тиры и игры',unl:'Из раздела безлимитов',all:'Все аттракционы'},en:{family:'Family rides',kids:'For little ones',extreme:'Thrill rides',games:'Games',unl:'From unlimited passes',all:'All rides'},hy:{family:'Ամբողջ ընտանիքի համար',kids:'Փոքրիկների համար',extreme:'Էքստրիմ',games:'Խաղեր',unl:'Անսահմանափակ բաժնից',all:'Բոլոր ատրակցիոնները'}}[language]||{};
 function filterRides(rides){if(!category)return rides;return rides.filter(r=>{const m=metadata[r.catalogSlug];return m&&(category==='unl'?m.unlimitedExample:m.category===category)});}
 function contextURL(href){const u=new URL(href,location.href);if(u.origin!==location.origin||!u.pathname.startsWith(base))return href;const tail=u.pathname.slice(base.length);if(!/^(experience\/guest\/(reels|attractions)\.html|(ru|en|hy)\/attractions\/(index\.html)?)$/.test(tail))return href;if(category&&!u.searchParams.has('cat')&&!u.searchParams.has('filter'))u.searchParams.set(category==='unl'?'filter':'cat',category);return u.href;}
 function refresh(){for(const a of document.querySelectorAll('a[href]:not([data-discovery-all])')){const url=contextURL(a.href);if(url!==a.href)a.href=url;}
 if(category)for(const nav of document.querySelectorAll('.picker-switch'))if(!nav.nextElementSibling?.matches('.discovery-context')){const row=document.createElement('div');row.className='discovery-context';const label=document.createElement('span');label.textContent=copy[category]||category;const a=document.createElement('a');a.dataset.discoveryAll='';const u=new URL(location.href);u.searchParams.delete('cat');u.searchParams.delete('filter');a.href=u.href;a.textContent=copy.all||'All rides';row.append(label,a);nav.after(row);}}
 // Presentation state is isolated from likes, skipped cards and checkout state.
 const cueSeen=new Set();let cueAnimation=null,cueTimer=null,interacted=false,navigationGuard=null;
 function stopCue(){interacted=true;clearTimeout(cueTimer);cueAnimation?.cancel();cueAnimation=null;}
 for(const type of ['pointerdown','keydown','wheel'])document.addEventListener(type,stopCue,{capture:true,passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCue();});
 function cue(format,target){
  if(!target||cueSeen.has(format))return;cueSeen.add(format);
  const key='vp.discovery.gesture-seen.v1.'+format;let seen=false;
  try{seen=localStorage.getItem(key)==='1';localStorage.setItem(key,'1');}catch{try{seen=sessionStorage.getItem(key)==='1';sessionStorage.setItem(key,'1');}catch{}}
  if(seen||interacted||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  cueTimer=setTimeout(()=>{
   if(interacted||!target.isConnected||document.hidden)return;
   const frames=format==='feed'?[{transform:'scale(1.06) translateY(0)'},{transform:'scale(1.06) translateY(-16px)',offset:.45},{transform:'scale(1.06) translateY(0)',offset:.8},{transform:'scale(1)'}]:[{transform:'translateX(0) rotate(0)'},{transform:'translateX(13px) rotate(1.5deg)',offset:.3},{transform:'translateX(-10px) rotate(-1deg)',offset:.65},{transform:'translateX(0) rotate(0)'}];
   cueAnimation=target.animate(frames,{duration:1150,easing:'ease-in-out'});
   cueAnimation.finished.then(()=>{cueAnimation=null;}).catch(()=>{});
  },220);
 }
 function languageMenu(){
  const lang=window.VPI18n?.language||document.documentElement.lang||'ru';
  return '<details class="discovery-languages"><summary aria-label="Язык"><span data-i18n-skip>'+({ru:'RU',hy:'ՀԱՅ',en:'EN'}[lang]||'RU')+'</span></summary><nav aria-label="Язык">'+['ru','hy','en'].map(code=>{const u=new URL(location.href);u.searchParams.set('lang',code);return '<a data-locale="'+code+'" lang="'+code+'" href="'+u.href.replace(/&/g,'&amp;')+'"'+(code===lang?' aria-current="page"':'')+'>'+({ru:'RU',hy:'ՀԱՅ',en:'EN'}[code])+'</a>';}).join('')+'</nav></details>';
 }
 function consentHTML(){
  const t=text=>window.VPI18n?.translate(text)||text;
  const consent=window.VPAnalytics?.consent;
  return '<section class="v5-consent discovery-consent" aria-label="'+t('Аналитика демо')+'"><h3>'+t('Аналитика демо')+'</h3><p>'+t('Разрешить сбор событий этого демо? Имена, номера карт и контакты не записываются.')+'</p><div><button type="button" data-v5-consent="yes" aria-pressed="'+(consent==='yes')+'">'+t('Разрешить аналитику')+'</button><button type="button" data-v5-consent="no" aria-pressed="'+(consent==='no')+'">'+t('Без аналитики')+'</button></div></section>';
 }
 function mount(){for(const el of document.querySelectorAll('[data-discovery-language]'))if(!el.firstElementChild)el.innerHTML=languageMenu();}
 document.addEventListener('click',e=>{const lang=e.target.closest('[data-locale]');if(lang&&navigationGuard&&!navigationGuard()){e.preventDefault();e.stopImmediatePropagation();}for(const menu of document.querySelectorAll('.discovery-languages[open]'))if(!menu.contains(e.target))menu.open=false;},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')for(const menu of document.querySelectorAll('.discovery-languages[open]')){menu.open=false;menu.querySelector('summary').focus();}});
 // Shared draft editor: neither dismissal nor count changes write purchase state.
 const familyCopy={
  ru:{title:'Кто идёт?',intro:'Укажите состав компании. Возраст поможет подобрать аттракционы; его можно оставить неизвестным.',adults:'Взрослые',children:'Дети',adult:'Взрослый',child:'Ребёнок',age:'Возраст, лет',unknown:'Не знаю',save:'Сохранить и продолжить',cancel:'Сейчас пропустить',limit:'До 8 человек',demo:'Подбор использует учебные возрастные ориентиры. Реальный допуск уточните у парка.',error:'Укажите целый возраст: 0-17 для ребёнка, 18-120 для взрослого, либо оставьте поле пустым.',saved:'Состав сохранён. Подборка учитывает возраст.',count:'чел.',more:'Добавить',less:'Убрать'},
  en:{title:'Who is coming?',intro:'Add your group. Ages help suggest rides; you can leave them unknown.',adults:'Adults',children:'Children',adult:'Adult',child:'Child',age:'Age, years',unknown:'Unknown',save:'Save and continue',cancel:'Skip for now',limit:'Up to 8 people',demo:'Suggestions use demo age ranges. Confirm actual admission rules with the park.',error:'Enter a whole age: 0-17 for a child, 18-120 for an adult, or leave it blank.',saved:'Group saved. Suggestions now account for age.',count:'people',more:'Add',less:'Remove'},
  hy:{title:'Ովքե՞ր են գալիս',intro:'Նշեք խմբի կազմը։ Տարիքը կօգնի ընտրել ատրակցիոնները։ Կարող եք այն չնշել։',adults:'Մեծահասակներ',children:'Երեխաներ',adult:'Մեծահասակ',child:'Երեխա',age:'Տարիքը',unknown:'Չգիտեմ',save:'Պահպանել և շարունակել',cancel:'Առայժմ բաց թողնել',limit:'Մինչև 8 հոգի',demo:'Առաջարկներն օգտագործում են ցուցադրական տարիքային միջակայքեր։ Իրական մուտքի կանոնները ճշտեք այգում։',error:'Նշեք ամբողջ տարիքը՝ երեխայի համար 0-17, մեծահասակի համար 18-120, կամ թողեք դատարկ։',saved:'Խմբի կազմը պահպանված է։ Ընտրությունը հաշվի է առնում տարիքը։',count:'հոգի',more:'Ավելացնել',less:'Հեռացնել'}
 };
 const familyText=()=>familyCopy[window.VPI18n?.language||document.documentElement.lang]||familyCopy.ru;
 const htmlEscape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function familyLabel(party){const c=familyText();return c.title+(party.length?' · '+party.length:'');}
 function mountFamily(host,party,onSave,onClose){
  const c=familyText();let draft=JSON.parse(JSON.stringify(party));
  const capture=()=>{for(const input of host.querySelectorAll('[data-family-age]')){const p=draft.find(p=>p.id===input.dataset.familyAge);if(p)p.age=input.value===''?null:Number(input.value);}};
  function render(focusRole){
   host.innerHTML='<form class="discovery-family" data-i18n-skip><p class="discovery-family-intro">'+c.intro+'</p><div class="discovery-family-counts">'+['adult','child'].map(role=>{const n=draft.filter(p=>p.role===role).length;return '<div class="discovery-family-count"><span>'+c[role==='adult'?'adults':'children']+'</span><div><button type="button" data-family-count="'+role+'" data-delta="-1" aria-label="'+c.less+' '+c[role]+'"'+(!n?' disabled':'')+'>−</button><output>'+n+'</output><button type="button" data-family-count="'+role+'" data-delta="1" aria-label="'+c.more+' '+c[role]+'"'+(draft.length>=8?' disabled':'')+'>+</button></div></div>';}).join('')+'</div><p class="discovery-family-limit">'+c.limit+'</p><div class="discovery-family-ages">'+draft.map((p,i)=>'<label class="discovery-family-person"><span>'+c[p.role]+' '+(draft.slice(0,i+1).filter(x=>x.role===p.role).length)+'</span><span class="discovery-family-age"><span>'+c.age+'</span><input data-family-age="'+htmlEscape(p.id)+'" type="number" inputmode="numeric" min="'+(p.role==='adult'?18:0)+'" max="'+(p.role==='adult'?120:17)+'" step="1" value="'+(p.age??'')+'" placeholder="'+c.unknown+'" autocomplete="off"></span></label>').join('')+'</div><p class="discovery-family-note">'+c.demo+'</p><p class="discovery-family-error" role="alert"></p><div data-vp-action-group class="discovery-family-actions"><button type="submit" data-vp-cta="primary">'+c.save+'</button><button type="button" data-family-cancel data-vp-cta="secondary">'+c.cancel+'</button></div></form>';
   host.querySelector('form').addEventListener('submit',e=>{e.preventDefault();capture();if(draft.some(p=>p.age!==null&&(!Number.isInteger(p.age)||p.age<(p.role==='adult'?18:0)||p.age>(p.role==='adult'?120:17)))){host.querySelector('[role=alert]').textContent=c.error;return;}onSave(draft);});
   host.querySelector('[data-family-cancel]').addEventListener('click',onClose);
   host.querySelectorAll('[data-family-count]').forEach(b=>b.addEventListener('click',()=>{capture();const role=b.dataset.familyCount;if(b.dataset.delta==='1'){if(draft.length>=8)return;const labels=new Set(draft.map(p=>p.label));let n=1;while(labels.has((role==='adult'?'Взрослый':'Ребёнок')+' '+n))n++;draft.push({id:'party-'+crypto.randomUUID(),role,label:(role==='adult'?'Взрослый':'Ребёнок')+' '+n,age:null,height:null});}else{const i=draft.findLastIndex(p=>p.role===role);if(i>=0)draft.splice(i,1);}render(role);const next=host.querySelector('[data-family-count="'+role+'"][data-delta="1"]');if(!next.disabled)next.focus({preventScroll:true});else host.querySelector('[data-family-count="'+role+'"][data-delta="-1"]').focus({preventScroll:true});}));
  }
  render();
 }
 function recommendation(ride,person){return window.VP3?.ageHint(ride.fictional?ride:window.VP3?.demoForReal?.(ride.id),person)||{status:'unknown',text:''};}
 function familyScore(ride,party){return party.reduce((score,p)=>score+(recommendation(ride,p).status==='suggested'?1:0),0);}
 function ticketsURL(mode,picker){const u=new URL(mode==='real'?'company.html?source=real&mode=exact':'company.html?mode=exact',location.href);u.searchParams.set('picker',picker);u.searchParams.set('lang',window.VPI18n?.language||document.documentElement.lang||'ru');if(p.get('review')==='1')u.searchParams.set('review','1');return u.href;}

 window.VPDiscoveryContext={mountFamily,familyText,familyLabel,recommendation,familyScore,ticketsURL,filterRides,contextURL,category,cue,languageMenu,consentHTML,setNavigationGuard:fn=>{navigationGuard=fn;}};
 document.addEventListener('DOMContentLoaded',mount);
 document.addEventListener('DOMContentLoaded',refresh);document.addEventListener('vp:catalog-rendered',refresh);
 document.addEventListener('click',e=>{const a=e.target.closest('a[href]:not([data-discovery-all])');if(a){const url=contextURL(a.href);if(url!==a.href)a.href=url;}},true);
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh()})}).observe(document.documentElement,{childList:true,subtree:true});
})();
