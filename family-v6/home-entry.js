/* The public root is a language-aware entrance to the maintained homepage. */
(()=>{'use strict';
 const base=new URL('.',document.currentScript.src).pathname;
 const url=new URL(location.href),languages=['ru','en','hy'];
 let saved='ru';try{saved=localStorage.getItem('vpLang')||'ru';}catch{}
 const explicit=url.searchParams.get('lang');
 const lang=languages.includes(explicit)?explicit:(languages.includes(saved)?saved:'ru');
 const section=document.currentScript.dataset.entry==='404/'?'404/':'';
 url.pathname=base+lang+'/'+section;
 location.replace(window.VPReleaseURL?window.VPReleaseURL(url.href):url.href);
})();
