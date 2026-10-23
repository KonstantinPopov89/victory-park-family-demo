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
 window.VPDiscoveryContext={filterRides,contextURL,category,cue,languageMenu,consentHTML,setNavigationGuard:fn=>{navigationGuard=fn;}};
 document.addEventListener('DOMContentLoaded',mount);
 document.addEventListener('DOMContentLoaded',refresh);document.addEventListener('vp:catalog-rendered',refresh);
 document.addEventListener('click',e=>{const a=e.target.closest('a[href]:not([data-discovery-all])');if(a){const url=contextURL(a.href);if(url!==a.href)a.href=url;}},true);
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh()})}).observe(document.documentElement,{childList:true,subtree:true});
})();
