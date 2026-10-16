/* Shared navigation, isolated third prototype. */
(() => {
'use strict';
// One shared entry keeps the standalone top-up reachable from every guest menu.
document.querySelectorAll('.vp-desktop-nav,.vp-mobile-nav,.vp-footer-links').forEach(nav=>{
 if(nav.querySelector('a[href="topup.html"]'))return;
 const tickets=nav.querySelector('a[href^="tickets.html"],a[href^="quick.html"]');if(!tickets)return;
 const link=document.createElement('a');link.href='topup.html';link.textContent='Пополнить карту';
 if(location.pathname.endsWith('/topup.html'))link.setAttribute('aria-current','page');
 tickets.after(link);
});
document.querySelectorAll('.vp-mobile-nav,.vp-footer-links').forEach(nav=>{
 if(nav.querySelector('a[href="index.html#park-info"]'))return;
 const link=document.createElement('a');link.href='index.html#park-info';link.textContent='Часы и правила';nav.append(link);
});
function openParkInfo(){if(location.hash==='#park-info'){const info=document.getElementById('park-info');if(info)info.open=true;}}
openParkInfo();window.addEventListener('hashchange',openParkInfo);
const menu=document.getElementById('vp-mobile-nav'),toggle=document.getElementById('vp-menu-toggle');
function closeMenu(focus=false){if(!menu||!toggle)return;menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Открыть меню');if(focus)toggle.focus();}
toggle?.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');});
menu?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu?.hidden)closeMenu(true);});
document.querySelectorAll('[data-vp-about],[data-about]').forEach(el=>el.addEventListener('click',e=>{const info=document.getElementById('vp-about');if(!info)return;e.preventDefault();info.open=true;info.scrollIntoView({block:'center'});info.querySelector('summary')?.focus({preventScroll:true});}));
})();
