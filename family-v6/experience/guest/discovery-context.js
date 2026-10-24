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
  ru:{title:'Кто идёт?',intro:'Добавьте участников и выберите возраст. Если пока не знаете, можно пропустить.',people:'Количество участников',age:'Возраст, лет',participant:'Участник',unknown:'Не знаю',save:'Сохранить и продолжить',cancel:'Отмена',limit:'До 8 человек',demo:'Возраст помогает с подбором. Ориентиры учебные, рост и условия катания уточняются отдельно.',saved:'Участники сохранены. Подборка учитывает возраст.',count:'чел.',more:'Добавить участника',less:'Убрать последнего участника',remove:'Убрать участника',legacy:'Ранее указано:',empty:'Можно смотреть аттракционы и без участников.',bands:['До 3','3-4','5-9','10-17','18+']},
  en:{title:'Who is coming?',intro:'Add people and choose their age ranges. You can skip an age if you do not know it yet.',people:'Number of people',age:'Age, years',participant:'Person',unknown:'Not sure',save:'Save and continue',cancel:'Cancel',limit:'Up to 8 people',demo:'Ages help suggest rides. Ranges are examples; height and admission rules need a separate check.',saved:'People saved. Suggestions now account for age.',count:'people',more:'Add a person',less:'Remove the last person',remove:'Remove person',legacy:'Previously entered:',empty:'You can browse rides without adding anyone.',bands:['Under 3','3-4','5-9','10-17','18+']},
  hy:{title:'Ովքե՞ր են գալիս',intro:'Ավելացրեք մասնակիցներին և ընտրեք տարիքները։ Եթե դեռ չգիտեք, կարող եք բաց թողնել։',people:'Մասնակիցների քանակը',age:'Տարիքը',participant:'Մասնակից',unknown:'Չգիտեմ',save:'Պահպանել և շարունակել',cancel:'Չեղարկել',limit:'Մինչև 8 հոգի',demo:'Տարիքն օգնում է ընտրել ատրակցիոնները։ Միջակայքերը ցուցադրական են, հասակն ու մուտքի պայմանները ստուգվում են առանձին։',saved:'Մասնակիցները պահպանված են։ Ընտրությունը հաշվի է առնում տարիքը։',count:'հոգի',more:'Ավելացնել մասնակցի',less:'Հեռացնել վերջին մասնակցին',remove:'Հեռացնել մասնակցին',legacy:'Նախկինում նշված՝',empty:'Կարող եք դիտել ատրակցիոններն առանց մասնակիցներ ավելացնելու։',bands:['Մինչև 3','3-4','5-9','10-17','18+']}
 };
 const familyText=()=>familyCopy[window.VPI18n?.language||document.documentElement.lang]||familyCopy.ru;
 const htmlEscape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function familyLabel(party){const c=familyText();return c.title+(party.length?' · '+party.length:'');}
 function mountFamily(host,party,onSave,onClose){
  const c=familyText(),lang=window.VPI18n?.language||document.documentElement.lang||'ru';
  const bands=['under3','age3_4','age5_9','age10_17','adult','unknown'];
  let draft=JSON.parse(JSON.stringify(party));
  const label=(person,index)=>window.VP3.participantLabel(person,index,lang);
  function bandValue(person){
   if(bands.includes(person.ageBand))return person.ageBand;
   if(Number.isInteger(person.age)&&person.age>=0)return person.age<3?'under3':person.age<5?'age3_4':person.age<10?'age5_9':person.age<18?'age10_17':'adult';
   return 'unknown';
  }
  function render(focus){
   const oldScroll=host.querySelector('.discovery-family-scroll')?.scrollTop||0;
   host.innerHTML='<form class="discovery-family" data-i18n-skip><div class="discovery-family-scroll"><p class="discovery-family-intro">'+c.intro+'</p><div class="discovery-family-counts"><div class="discovery-family-count"><span>'+c.people+'</span><div><button type="button" data-family-count data-delta="-1" aria-label="'+c.less+'"'+(!draft.length?' disabled':'')+'>−</button><output aria-live="polite" aria-label="'+c.people+'">'+draft.length+'</output><button type="button" data-family-count data-delta="1" aria-label="'+c.more+'"'+(draft.length>=8?' disabled':'')+'>+</button></div></div></div><p class="discovery-family-limit">'+c.limit+'</p><div class="discovery-family-ages">'+draft.map((person,index)=>{
    const name=label(person,index),selected=bandValue(person),exact=Number.isInteger(person.age)&&!person.ageBand;
    return '<fieldset class="discovery-family-person" data-family-person="'+htmlEscape(person.id)+'"><legend>'+htmlEscape(name)+'</legend><div class="discovery-family-person-head"><span>'+c.age+'</span><button type="button" class="discovery-family-remove" data-family-remove="'+htmlEscape(person.id)+'" aria-label="'+htmlEscape(c.remove+': '+name)+'">×</button></div>'+(exact?'<p class="discovery-family-legacy">'+c.legacy+' '+htmlEscape(window.VP3.ageLabel(person,lang))+'</p>':'')+'<div class="discovery-family-bands" role="radiogroup" aria-label="'+htmlEscape(name+': '+c.age)+'">'+bands.map((id,i)=>'<button type="button" class="discovery-family-band" data-family-band="'+id+'" role="radio" aria-checked="'+(selected===id)+'" tabindex="'+(selected===id?'0':'-1')+'">'+htmlEscape(i<5?c.bands[i]:c.unknown)+'</button>').join('')+'</div></fieldset>';
   }).join('')+(draft.length?'':'<p class="discovery-family-empty">'+c.empty+'</p>')+'</div><p class="discovery-family-note">'+c.demo+'</p></div><div data-vp-action-group class="discovery-family-actions"><button type="submit" data-vp-cta="primary">'+c.save+'</button><button type="button" data-family-cancel data-vp-cta="secondary">'+c.cancel+'</button></div></form>';
   host.querySelector('form').addEventListener('submit',e=>{e.preventDefault();onSave(draft);});
   host.querySelector('[data-family-cancel]').addEventListener('click',onClose);
   host.querySelectorAll('[data-family-count]').forEach(button=>button.addEventListener('click',()=>{
    if(button.dataset.delta==='1'){if(draft.length>=8)return;draft.push({id:'party-'+crypto.randomUUID(),role:'unknown',label:'Участник '+(draft.length+1),age:null,ageBand:null,height:null});}
    else if(draft.length)draft.pop();
    render({count:button.dataset.delta});
   }));
   host.querySelectorAll('[data-family-remove]').forEach(button=>button.addEventListener('click',()=>{
    const index=draft.findIndex(person=>person.id===button.dataset.familyRemove);if(index<0)return;
    draft.splice(index,1);const next=draft[Math.min(index,draft.length-1)];render(next?{person:next.id,band:bandValue(next)}:{count:'1'});
   }));
   host.querySelectorAll('[data-family-band]').forEach(button=>{
    button.addEventListener('click',()=>{
     const row=button.closest('[data-family-person]'),index=draft.findIndex(person=>person.id===row.dataset.familyPerson);
     if(index<0)return;draft[index]=window.VP3.withAgeBand(draft[index],button.dataset.familyBand);
     row.querySelector('.discovery-family-legacy')?.remove();
     row.querySelectorAll('[data-family-band]').forEach(option=>{const selected=option===button;option.setAttribute('aria-checked',String(selected));option.tabIndex=selected?0:-1;});
    });
    button.addEventListener('keydown',event=>{
     const keys=['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'];if(!keys.includes(event.key))return;
     event.preventDefault();const options=[...button.parentElement.querySelectorAll('[data-family-band]')],index=options.indexOf(button);
     const next=event.key==='Home'?0:event.key==='End'?options.length-1:(index+(event.key==='ArrowRight'||event.key==='ArrowDown'?1:-1)+options.length)%options.length;
     options[next].click();options[next].focus({preventScroll:true});
    });
   });
   host.querySelector('.discovery-family-scroll').scrollTop=oldScroll;
   if(focus){let next;
    if(focus.person){const row=[...host.querySelectorAll('[data-family-person]')].find(row=>row.dataset.familyPerson===focus.person);next=[...row?.querySelectorAll('[data-family-band]')||[]].find(button=>button.dataset.familyBand===focus.band);}
    else next=host.querySelector('[data-family-count][data-delta="'+focus.count+'"]');
    if(!next||next.disabled)next=host.querySelector('[data-family-count]:not(:disabled)');next?.focus({preventScroll:true});
   }
  }
  render();
 }
 function recommendation(ride,person){return window.VP3?.ageHint(ride.fictional?ride:window.VP3?.demoForReal?.(ride.id),person)||{status:'unknown',text:''};}
 // Ranking only: a partially matching age range is not proof of admission.
 function familyScore(ride,party){return party.reduce((score,p)=>score+({suggested:1,possible:.5}[recommendation(ride,p).status]||0),0);}
 function ticketsURL(mode,picker){const u=new URL(mode==='real'?'company.html?source=real&mode=exact':'company.html?mode=exact',location.href);u.searchParams.set('picker',picker);u.searchParams.set('lang',window.VPI18n?.language||document.documentElement.lang||'ru');if(p.get('review')==='1')u.searchParams.set('review','1');return u.href;}

 window.VPDiscoveryContext={mountFamily,familyText,familyLabel,recommendation,familyScore,ticketsURL,filterRides,contextURL,category,cue,languageMenu,consentHTML,setNavigationGuard:fn=>{navigationGuard=fn;}};
 document.addEventListener('DOMContentLoaded',mount);
 document.addEventListener('DOMContentLoaded',refresh);document.addEventListener('vp:catalog-rendered',refresh);
 document.addEventListener('click',e=>{const a=e.target.closest('a[href]:not([data-discovery-all])');if(a){const url=contextURL(a.href);if(url!==a.href)a.href=url;}},true);
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh()})}).observe(document.documentElement,{childList:true,subtree:true});
})();
