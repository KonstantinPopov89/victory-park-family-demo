/* Presentation and shared-interest controls for the main catalog. */
(()=>{'use strict';
 if(!document.body.hasAttribute('data-catalog-refresh'))return;
 const C=window.VPCORE;if(!C)return;
 const lang=document.documentElement.lang;
 const t={ru:{save:'В список',saved:'В списке',remove:'Убрать из списка',found:'Аттракционов'},en:{save:'Save',saved:'Saved',remove:'Remove from list',found:'Attractions'},hy:{save:'Պահպանել',saved:'Պահպանված է',remove:'Հեռացնել ցանկից',found:'Ատրակցիոններ'}}[lang];
 const rows=[...document.querySelectorAll('[data-catalog]>li')],search=document.querySelector('#catalog-search'),result=document.querySelector('[data-catalog-result]'),empty=document.querySelector('.catalog-empty');
 const saveButtons=[...document.querySelectorAll('[data-catalog-save]')];
 const norm=s=>s.toLocaleLowerCase().replaceAll('ё','е').trim();
 function renderFilter(){
  const p=new URLSearchParams(location.search),cat=p.get('cat')||(p.get('filter')==='unl'?'unl':''),q=norm(search.value);let count=0;
  rows.forEach(row=>{const matchCat=!cat||(cat==='unl'?row.dataset.unl==='1':row.dataset.cat===cat);row.hidden=!(matchCat&&norm(row.dataset.catalogName).includes(q));if(!row.hidden)count++;});
  result.textContent=t.found+': '+count;empty.hidden=!!count;
 }
 function selection(){
  const selected=C.list();
  saveButtons.forEach(b=>{const active=selected.includes(b.dataset.catalogSave),name=b.closest('[data-catalog-name]').dataset.catalogName,pressed=String(active),text=active?t.saved:t.save,label=(active?t.remove:t.save)+': '+name,span=b.querySelector('span');if(b.getAttribute('aria-pressed')!==pressed)b.setAttribute('aria-pressed',pressed);if(span.textContent!==text)span.textContent=text;if(b.getAttribute('aria-label')!==label)b.setAttribute('aria-label',label);});
 }
 saveButtons.forEach(b=>b.addEventListener('click',()=>{const list=C.list(),slug=b.dataset.catalogSave;C.setList(list.includes(slug)?list.filter(x=>x!==slug):[...list,slug]);selection();}));
 document.addEventListener('vp:catalog-filter',renderFilter);search.addEventListener('input',renderFilter);
 document.querySelector('[data-catalog-reset]').addEventListener('click',()=>{search.value='';document.querySelector('[data-filter=""]').click();search.focus();});
 const toggle=document.querySelector('.catalog-search-toggle'),field=document.querySelector('.catalog-search');
 toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));field.classList.toggle('is-open',open);if(open)search.focus();else if(search.value){search.value='';renderFilter();}});
 search.addEventListener('keydown',e=>{if(e.key==='Escape'){search.value='';renderFilter();field.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.focus();}});
 document.addEventListener('vp:interests',selection);window.addEventListener('pageshow',()=>{selection();renderFilter();});window.addEventListener('popstate',renderFilter);
 selection();renderFilter();
 // HTML keeps these controls disabled until this handler and storage are ready.
 Promise.resolve(window.VPJourneyReady).then(ok=>{if(!ok)return;selection();saveButtons.forEach(b=>{b.disabled=false;b.removeAttribute('aria-busy');b.dataset.saveReady='true';});});
})();
