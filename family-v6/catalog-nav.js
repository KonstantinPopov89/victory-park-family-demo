/* Catalogue presentation and URL navigation context; no interests or commerce state changes. */
(()=>{'use strict';
const base=new URL('.',document.currentScript.src).pathname;
const screen=document.body.dataset.screen;
const lang=document.documentElement.lang;
// On a phone, the catalogue leads. Keep the original park introduction in its
// native disclosure, and restore its desktop placement when the viewport grows.
if(screen==='SCR-14'){
 const intro=document.querySelector('.catalog-intro');
 const about=intro?.querySelector('.catalog-about');
 const prose=intro?.querySelector('.catalog-intro-copy > .prose');
 const media=intro?.querySelector('.catalog-intro-media');
 const context=intro?.querySelector('.catalog-context');
 if(about&&prose&&media&&context){
  const mobile=matchMedia('(max-width:700px)');
  const status=document.querySelector('.catalog-status-wrap > .now');
  const statusHost=status?.parentElement;
  const statusDisclosure=document.createElement('details');
  statusDisclosure.className='catalog-mobile-status';
  const statusTitle=document.createElement('summary');
  statusTitle.textContent=status?.querySelector('[data-guest-status-heading]')?.textContent||'';
  statusDisclosure.append(statusTitle);
  const adapt=()=>{
   if(mobile.matches){
    about.querySelector('summary').after(prose);
    about.append(media);
    if(status&&statusTitle.textContent){statusHost.append(statusDisclosure);statusDisclosure.append(status);}
   }else{
    context.before(prose);
    intro.append(media);
    if(status){statusHost.append(status);statusDisclosure.remove();}
   }
  };
  adapt();mobile.addEventListener('change',adapt);
 }
}
const copy={ru:{prototype:'Прототип',review:'Текст требует проверки'},en:{prototype:'Prototype',review:'Text needs review'},hy:{prototype:'Նախատիպ',review:'Տեքստը պետք է ստուգել'}}[lang]||{prototype:'Prototype',review:'Text needs review'};
function filterLinks(){
 if(screen!=='SCR-14'&&screen!=='SCR-43')return;
 const params=new URLSearchParams(location.search),cat=params.get('cat');
 const filter=['family','kids','extreme','games','unl'].includes(cat)?cat:params.get('filter')==='unl'?'unl':'';
 for(const a of document.querySelectorAll('a[href]')){
  if(a.hasAttribute('data-vp-lang')||a.hasAttribute('data-lang-link'))continue;
  let target;try{target=new URL(a.href,location.href)}catch{continue}
  if(target.origin!==location.origin||!target.pathname.startsWith(base))continue;
  const tail=target.pathname.slice(base.length);
  const catalog=/^(ru|en|hy)\/attractions\/(?:index\.html)?$/.test(tail);
  const discovery=/^experience\/guest\/(reels|attractions)\.html$/.test(tail);
  const ride=/^(ru|en|hy)\/attractions\/[^/]+\/(?:index\.html)?$/.test(tail);
  if(!catalog&&!discovery&&!(screen==='SCR-14'&&ride))continue;
  target.searchParams.delete('cat');target.searchParams.delete('filter');
  if(filter)target.searchParams.set(filter==='unl'?'filter':'cat',filter);
  if(a.href!==target.href)a.href=target.href;
 }
}
function tidy(){
 filterLinks();
 for(const el of document.querySelectorAll('.ptab')){if(el.textContent!==copy.prototype)el.textContent=copy.prototype;el.setAttribute('aria-label',copy.prototype);}
 for(const el of document.querySelectorAll('[title="нужен перевод клиента"]')){el.title=copy.review;}
 // The data dictionary has already translated these display strings. Correct inherited language metadata.
 if(lang!=='ru')for(const el of document.querySelectorAll('main .tr[lang="ru"]'))if(!/[А-Яа-яЁё]/.test(el.textContent))el.lang=lang;
}
document.addEventListener('vp:catalog-filter',filterLinks);
tidy();let pending=false;
new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;tidy()})}).observe(document.body,{subtree:true,childList:true});
})();
