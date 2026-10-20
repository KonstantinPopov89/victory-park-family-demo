/* Presentation only. No storage, selection, price or payment writes. */
(()=>{'use strict';
 const lang=document.documentElement.lang;
 const copy={ru:{prototype:'Прототип',more:'Ещё',review:'Текст требует проверки'},en:{prototype:'Prototype',more:'More',review:'Text needs review'},hy:{prototype:'Նախատիպ',more:'Ավելին',review:'Տեքստը պետք է ստուգել'}}[lang]||{prototype:'Prototype',more:'More',review:'Text needs review'};
 const clean=s=>s.replace(/\s*\((?:\s*Q[A-Z]*(?:-[A-Z]+)?-\d+\s*,?)+\)/g,'').replace(/\bQ[A-Z]*(?:-[A-Z]+)?-\d+\b/g,'').replace(/\(\s*\)/g,'');
 function tidy(){
  if(lang==='hy'){
   const names={'[data-mode="feed"]':'Հոսք','[data-mode="swipe"]':'Քարտեր','[data-mode-link="list"]':'Ցուցակ','[data-undo]':'Հետարկել'};
   for(const [selector,label] of Object.entries(names))for(const el of document.querySelectorAll(selector)){if(el.textContent!==label)el.textContent=label;}
  }

  const tab=document.querySelector('.ptab');
  if(tab){let tools=document.querySelector('.picker-tools');if(!tools){tools=document.createElement('details');tools.className='picker-tools';const summary=document.createElement('summary');summary.textContent=copy.more;tools.append(summary);(document.querySelector('.ft>.wrap')||document.body).append(tools);}if(tab.parentElement!==tools)tools.append(tab);if(tab.textContent!==copy.prototype)tab.textContent=copy.prototype;tab.setAttribute('aria-label',copy.prototype);}
  for(const el of document.querySelectorAll('[title="нужен перевод клиента"]'))el.title=copy.review;
  for(const el of document.querySelectorAll('main .unc>span')){const t=clean(el.textContent);if(t!==el.textContent)el.textContent=t;}
  const walker=document.createTreeWalker(document.querySelector('main'),NodeFilter.SHOW_TEXT);let n;while((n=walker.nextNode())){if(n.parentElement.closest('script,style,input,textarea'))continue;const t=clean(n.data);if(t!==n.data)n.data=t;}
 }
 tidy();let pending=false;new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;tidy()})}).observe(document.body,{childList:true,subtree:true});
})();
