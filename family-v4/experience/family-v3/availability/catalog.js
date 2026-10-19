/* Catalog and status screens share one validated local demonstration state. */
(function(){
'use strict';
const M=window.Availability;
if(!M)return;
const mapping=new Map(M.RIDES.map(r=>[r.catalogId,r.id]));
function read(initialize=false){
 try{
  const raw=localStorage.getItem(M.KEY);
  if(raw){const s=JSON.parse(raw);if(!M.validate(s))throw new Error('schema');return s;}
  if(initialize){const s=M.presentationSeed();localStorage.setItem(M.KEY,JSON.stringify(s));return s;}
 }catch(error){/* Never present inaccessible or invalid data as an open ride. */}
 return M.presentationSeed(Date.now(),true);
}
function detail(r){
 if(r.source==='manual')return r.reason+' Проверено в '+M.clock(r.checkedAt)+', до '+M.clock(r.expiresAt)+'.';
 if(r.source==='manual-expired')return 'Сведения устарели. Уточняем работу.';
 if(r.source==='debits')return 'Автооценка по недавнему списанию. Работа может измениться.';
 if(r.source==='debit-expired')return 'Давно не было списаний. Уточняем работу.';
 if(r.source==='mapping')return 'Сведения об аттракционе уточняются.';
 if(r.source==='source-incomplete')return 'Получены не все сведения. Уточняем работу.';
 return r.reason;
}
function render(state){
 const rides=new Map(M.derive(state).rides.map(r=>[r.id,r]));
 document.querySelectorAll('[data-availability-catalog-id]').forEach(box=>{
  const r=rides.get(mapping.get(box.dataset.availabilityCatalogId));
  if(!r)return;
  box.dataset.status=r.status;
  const link=box.querySelector('.catalog-status'),text=box.querySelector('.catalog-status-detail');
  const label=M.LABELS[r.status],reason=detail(r);
  link.className='catalog-status '+r.status;
  link.href='availability.html#'+r.id;
  link.setAttribute('aria-label',r.name+': '+label+'. Подробнее о работе');
  if(link.textContent!==label)link.textContent=label;
  if(text.textContent!==reason)text.textContent=reason;
 });
}
const refresh=()=>render(read());
render(read(true));
document.addEventListener('vp:catalog-rendered',refresh);
window.addEventListener('storage',e=>{if(e.key===M.KEY||e.key===null)refresh();});
window.addEventListener('pageshow',refresh);
window.addEventListener('focus',refresh);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
setInterval(refresh,5000);
})();
