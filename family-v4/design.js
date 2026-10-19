const open = document.querySelector('[data-menu-open]');
const menu = document.querySelector('#mobile-menu');
const close = document.querySelector('[data-menu-close]');
function isolateMenu(active){document.querySelectorAll('.nav,main,.footer,.mobile-buy,.demo-strip').forEach(el=>el.inert=active);}
function closeMenu(){isolateMenu(false);menu.hidden=true;document.body.classList.remove('menu-open');open.setAttribute('aria-expanded','false');open.focus();}
open.addEventListener('click',()=>{menu.hidden=false;isolateMenu(true);document.body.classList.add('menu-open');open.setAttribute('aria-expanded','true');close.focus();});
close.addEventListener('click',closeMenu);
menu.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeMenu();}if(e.key==='Tab'){const items=[...menu.querySelectorAll('button,a[href]')];const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{isolateMenu(false);menu.hidden=true;document.body.classList.remove('menu-open');open.setAttribute('aria-expanded','false');}));
