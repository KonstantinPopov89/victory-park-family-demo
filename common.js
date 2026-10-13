/* Shared navigation for a non-transactional design demo. */
(() => {
'use strict';
const menu=document.getElementById('vp-mobile-nav'),toggle=document.getElementById('vp-menu-toggle');
function closeMenu(focus=false){if(!menu||!toggle)return;menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Открыть меню');if(focus)toggle.focus();}
toggle?.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');});
menu?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu?.hidden)closeMenu(true);});
const info=document.getElementById('vp-about');let returnFocus;
document.querySelectorAll('[data-vp-about]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();returnFocus=el;info.showModal();}));
info?.querySelector('button')?.addEventListener('click',()=>info.close());info?.addEventListener('close',()=>returnFocus?.focus());
if(document.body.dataset.page==='picker'&&window.VP){
 const rid=new URLSearchParams(location.search).get('ride');
 if(VP.realRides.some(r=>r.id===rid)){
  try{const state=VP.sanitizeState(JSON.parse(localStorage.getItem('vp.integrated.v1')||'null'));state.mode='real';localStorage.setItem('vp.integrated.v1',JSON.stringify(state));}catch{}
  document.addEventListener('DOMContentLoaded',()=>{const b=[...document.querySelectorAll('[data-action=ride-details]')].find(b=>b.dataset.ride===rid);b?.click();},{once:true});
 }
}
})();
