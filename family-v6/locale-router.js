/* Locale navigation keeps the path, query and section. Commercial state belongs to the existing engines. */
(() => {
  'use strict';
 function releaseURL(url){return window.VPReleaseURL ? window.VPReleaseURL(url) : url;}
  const base=new URL('.',document.currentScript.src).pathname;
  const path='/'+location.pathname.slice(base.length).replace(/^\//,'');
  const languages=['ru','en','hy'];
  const locale=path.match(/^\/(ru|en|hy)(?=\/|$)/)?.[1];
  const isHome=document.documentElement.hasAttribute('data-vp-home');
  let remembered='ru';try{remembered=localStorage.getItem('vpLang')||'ru';}catch{}
  if(isHome&&(path==='/'||path==='/index.html')&&languages.includes(remembered)&&remembered!=='ru'){
    location.replace(releaseURL(base+remembered+'/'+location.search+location.hash));return;
  }
  if(locale)try{localStorage.setItem('vpLang',locale);}catch{}
  function update(a){
    const target=a.dataset.vpLang||a.dataset.langLink;if(!languages.includes(target))return;
    const tail=isHome?'/':path.replace(/^\/(ru|en|hy)(?=\/|$)/,'');
    a.href=base+target+(tail.startsWith('/')?tail:'/'+tail)+location.search+location.hash;
    if(target===(locale||'ru'))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  }
  function ready(){document.querySelectorAll('[data-vp-lang],[data-lang-link]').forEach(update);}
  document.addEventListener('click',e=>{
    const a=e.target.closest('[data-vp-lang],[data-lang-link]');if(!a)return;
    update(a);const target=a.dataset.vpLang||a.dataset.langLink;
    if(languages.includes(target))try{localStorage.setItem('vpLang',target);}catch{}
  },true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
