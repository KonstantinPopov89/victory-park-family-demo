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
})();
