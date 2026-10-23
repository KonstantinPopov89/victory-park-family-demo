/* Presentation-only localization. Product IDs, amounts, input values and stored orders stay canonical. */
(() => {
  'use strict';
 function releaseURL(url){return window.VPReleaseURL ? window.VPReleaseURL(url) : url;}
  const scriptURL = document.currentScript.src;
  const base = new URL('.', scriptURL).pathname;
  const languages = ['ru', 'en', 'hy'];
  const pathname = () => '/' + location.pathname.slice(base.length).replace(/^\//, '');
  const interactive = pathname().startsWith('/experience/');
  let saved = 'ru';
  try { saved = localStorage.getItem('vpLang') || 'ru'; } catch {}
  const explicit = new URL(location.href).searchParams.get('lang');
  const localePath = pathname().match(/^\/(ru|en|hy)(?:\/|$)/)?.[1];
  let language = languages.includes(explicit) ? explicit : (localePath || (languages.includes(saved) ? saved : 'ru'));
  const dictionary = window.VP_TRANSLATIONS || {};
  const normalized = s => String(s).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  const entries = Object.keys(dictionary).sort((a,b) => b.length - a.length);
  const escapeRE = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = entries.length ? new RegExp('(?<![\\p{L}])(?:' + entries.map(escapeRE).join('|') + ')(?![\\p{L}])', 'gu') : null;
  const texts = new WeakMap(), attributes = new WeakMap();
  const ignored = 'script,style,noscript,code,pre,textarea,[data-i18n-skip],[data-review-only],.v5-header,.v5-demo,.v5-ticket-tools,.v5-consent,.ticket-code,.order-code';
  const userValues = new Set();
  let observer, toolbar, queued = false, applying = false;
  function refreshUserValues() {
    userValues.clear();
    try {
      const s = JSON.parse(localStorage.getItem('vp.family.v5') || '{}');
      (s.party || []).forEach(p => { if(p.label && !/^(Взрослый|Ребёнок|Гость)( \d+)?$/.test(p.label)) userValues.add(p.label); });
      for(const key of ['vp.family.v5.order','vp.family.v5.orders']) {
        const data = JSON.parse(localStorage.getItem(key)||'null');
        for(const order of (Array.isArray(data)?data:[data]).filter(Boolean)) {
          for(const p of (order.party||[])) if(p.label&&!/^(Взрослый|Ребёнок|Гость)( \d+)?$/.test(p.label)) userValues.add(p.label);
          // Immutable receipts contain recipientLabel, not the current party array.
          for(const line of (order.lines||[])) {const name=line.personId&&line.recipientLabel?.replace(/: со студенческим документом$/, '');if(name&&!/^(Взрослый|Ребёнок|Гость)( \d+)?$/.test(name))userValues.add(name);}
        }
      }
    } catch {}
    document.querySelectorAll('input[type=text],input:not([type])').forEach(input=>{
      if(input.value.trim() && /name|label|recipient/.test([input.name,input.id,input.dataset.field].join(' '))) userValues.add(input.value.trim());
    });
  }
  function translatePlain(text, target=language) {
    if(target==='ru') return String(text);
    text=String(text);
    const formatMoney=value=>value.replace(/(\d[\d ,\u00a0\u202f]*)\s*(AMD|֏)/g,(_,amount,currency)=>new Intl.NumberFormat('ru-RU').format(Number(amount.replace(/[\s,]/g,''))).replace(/ /g,'\u00a0')+'\u00a0֏');
    if(!/[А-Яа-яЁё]/.test(text))return formatMoney(text);
    const value = normalized(text);
    if(userValues.has(value)) return String(text);
    const direct = dictionary[value]?.[target];
    if(direct !== undefined) return (String(text).match(/^\s*/)?.[0]||'') + formatMoney(direct) + (String(text).match(/\s*$/)?.[0]||'');
    let result = String(text);
    const months=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    result=result.replace(/(\d{1,2}) ([а-я]+) (\d{4}) (?:г\.?\s*)?в (\d{1,2}:\d{2})/g,(whole,day,month,year,time)=>{const index=months.indexOf(month);if(index<0)return whole;return new Intl.DateTimeFormat(target==='hy'?'hy-AM':'en-US',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(+year,index,+day)))+(target==='hy'?'՝ ':' at ')+time;});
    result=result.replace(/(\d{1,2}) ([а-я]+) (\d{4}) г\./g,(whole,day,month,year)=>{const index=months.indexOf(month);return index<0?whole:new Intl.DateTimeFormat(target==='hy'?'hy-AM':'en-US',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(+year,index,+day)));});
    const protectedValues=[];
    [...userValues].sort((a,b)=>b.length-a.length).forEach(name=>{
      if(result.includes(name)){const marker='\uE000'+protectedValues.length+'\uE001'; protectedValues.push(name);result=result.split(name).join(marker);}
    });
    if(matcher) result=result.replace(matcher,match=>dictionary[match]?.[target] ?? match);
    result=result.replace(/\uE000(\d+)\uE001/g,(_,index)=>protectedValues[+index]);
    return formatMoney(result);
  }
  function translateTextNode(node) {
    if(!node.parentElement || node.parentElement.closest(ignored)) return;
    const previous=texts.get(node);
    const source=previous && node.data===previous.last ? previous.source : node.data;
    let next=translatePlain(source);
    if(new URLSearchParams(location.search).get('review')!=='1' && node.parentElement.closest('h1,h2,h3,.product,.quick-product,.helper,.quantity-label,.quick-important')){
      next=next.replace(/Tinder/g,{ru:'Выбрать свайпом',hy:'Ընտրել սահեցնելով',en:'Choose by swiping'}[language]);
      next=next.replace(/(^|[^А-Яа-яЁё])учебн(?:ый|ая|ое|ые|ого|ых|ым|ую|ой|ом|ые)\s*/gi,'$1').replace(/ուսումնական\s+/gi,'').replace(/teaching\s+/gi,'');
    }
    texts.set(node,{source,last:next});
    if(node.data!==next)node.data=next;
  }
  function translateElement(el) {
    if(el.closest(ignored))return;
    let stored=attributes.get(el);if(!stored){stored={};attributes.set(el,stored);}
    for(const attr of ['aria-label','aria-description','title','placeholder','alt']) {
      if(!el.hasAttribute(attr))continue;
      const value=el.getAttribute(attr),old=stored[attr];
      const source=old&&old.last===value?old.source:value;
      const next=translatePlain(source);stored[attr]={source,last:next};
      if(value!==next)el.setAttribute(attr,next);
    }
  }
  function languageURL(next) {
    const url=new URL(location.href);url.searchParams.set('lang',next);
    const order=window.VP3UI?.getOrder();if(order)url.searchParams.set('resume',order.id);
    return url;
  }
  function localizeLinks(root=document) {
    root.querySelectorAll('a[href]').forEach(a=>{
      if(languages.includes(a.dataset.locale)){const url=languageURL(a.dataset.locale);if(a.href!==url.href)a.href=url.href;return;}
      const raw=a.getAttribute('href');
      if(!raw || raw.startsWith('#') || /^(tel:|mailto:|blob:|data:)/.test(raw))return;
      let url;try{url=new URL(raw,location.href);}catch{return;}
      if(url.origin!==location.origin)return;
      if(url.pathname.startsWith('/experience/')&&!url.pathname.startsWith(base))url.pathname=base+url.pathname.slice(1);
      if(!url.pathname.startsWith(base))return;
      const path='/'+url.pathname.slice(base.length);
      if(path.startsWith('/experience/'))url.searchParams.set('lang',language);
      else if(interactive && /^\/(ru|en|hy)(?=\/|$)/.test(path))url.pathname=base+path.replace(/^\/(ru|en|hy)/,language);
      else if(interactive && (path==='/' || path==='/index.html'))url.pathname=base+language+'/';
      if(new URLSearchParams(location.search).get('review')==='1')url.searchParams.set('review','1');
      if(a.href!==url.href)a.href=url.href;
    });
  }
  function apply(root=document.body) {
    if(!root || !interactive || applying)return;
    applying=true;
    observer?.disconnect();
    refreshUserValues();
    document.querySelectorAll('dialog').forEach(dialog=>{if(!dialog.querySelector('.locale-dialog-options')){const nav=document.createElement('div');nav.className='locale-options locale-dialog-options';nav.innerHTML=toolbar?.querySelector('.locale-options')?.innerHTML||'';dialog.prepend(nav);}});
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;while((node=walker.nextNode()))translateTextNode(node);
    root.querySelectorAll('*').forEach(translateElement);
    translateElement(root);
    localizeLinks(root);
    document.documentElement.lang=language;
    document.title=translatePlain(document.querySelector('title')?.dataset.ruTitle||document.title);
    if(toolbar)document.querySelectorAll('[data-locale]').forEach(b=>{const selected=b.dataset.locale===language;if(b.tagName==='A'){b.removeAttribute('aria-pressed');if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}else if(b.tagName==='BUTTON'){b.removeAttribute('aria-current');b.setAttribute('aria-pressed',String(selected));}});
    applying=false;
    observer?.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','aria-description','placeholder','title','alt','href','open']});
  }
  function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;apply();});}
  function setLanguage(next) {
    if(!languages.includes(next))return;
    try{localStorage.setItem('vpLang',next);}catch{}
    const url=languageURL(next);
    window.VPPostPurchase?.prepareLanguageNavigation(url);
    location.assign(releaseURL(url.pathname+url.search+url.hash));
  }
  function translateHTML(html) {
    const parsed=new DOMParser().parseFromString(html,'text/html');
    const walker=parsed.createTreeWalker(parsed,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode()))if(!node.parentElement?.closest(ignored))node.data=translatePlain(node.data);
    parsed.querySelectorAll('[aria-label],[title],[alt]').forEach(el=>{for(const attr of ['aria-label','title','alt'])if(el.hasAttribute(attr))el.setAttribute(attr,translatePlain(el.getAttribute(attr)));});
    parsed.documentElement.lang=language;
    return '<!doctype html>\n'+parsed.documentElement.outerHTML;
  }
  function ready() {
    if(!interactive){localizeLinks();return;}
    try{localStorage.setItem('vpLang',language);}catch{}
    const title=document.querySelector('title');if(title)title.dataset.ruTitle=title.textContent;
    toolbar=document.querySelector('.v5-header');
    // Capture before commerce delegates: language changes are allowed even during a pending payment.
    document.addEventListener('click',e=>{const b=e.target.closest('[data-locale]');if(b&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&e.button===0){e.preventDefault();e.stopImmediatePropagation();setLanguage(b.dataset.locale);}},true);
    const measure=()=>document.documentElement.style.setProperty('--locale-toolbar-height','0px');
    new ResizeObserver(measure).observe(toolbar);measure();
    if(document.querySelector('.r-layout'))document.body.classList.add('locale-reels');
    observer=new MutationObserver(schedule);
    apply();
    document.addEventListener('input',e=>{if(e.target instanceof HTMLInputElement && /name|label|recipient/.test([e.target.name,e.target.id,e.target.dataset.field].join(' ')))refreshUserValues();});
    document.addEventListener('click',e=>{if(e.target.closest('a[href]'))localizeLinks();},true);
  }
  window.VPI18n={get language(){return language;},base,pathname,translate:translatePlain,translateHTML,setLanguage,apply,refreshUserValues,untranslated(){const out=[];const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=walk.nextNode()))if(n.parentElement&&!n.parentElement.closest(ignored)&&/[А-Яа-яЁё]/.test(n.data)&&!userValues.has(n.data.trim()))out.push(n.data.trim());return [...new Set(out)].filter(Boolean);}};
  if(interactive)document.documentElement.lang=language;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
