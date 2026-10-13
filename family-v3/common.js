/* Shared navigation, isolated third prototype. */
(() => {
'use strict';
const menu=document.getElementById('vp-mobile-nav'),toggle=document.getElementById('vp-menu-toggle');
function closeMenu(focus=false){if(!menu||!toggle)return;menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Открыть меню');if(focus)toggle.focus();}
toggle?.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');});
menu?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu?.hidden)closeMenu(true);});
document.querySelectorAll('[data-vp-about],[data-about]').forEach(el=>el.addEventListener('click',e=>{const info=document.getElementById('vp-about');if(!info)return;e.preventDefault();info.open=true;info.scrollIntoView({block:'center'});info.querySelector('summary')?.focus({preventScroll:true});}));
})();
