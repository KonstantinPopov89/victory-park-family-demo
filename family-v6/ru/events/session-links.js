// The visible choice and both purchase routes always describe the same session.
(function(){
 'use strict';
 let choices=[...document.querySelectorAll('[data-vp-session-choice]')];
 if(!choices.length)return;
 const links=[...document.querySelectorAll('[data-vp-session-route]')];
 const params=new URLSearchParams(location.search),incoming=params.get('session');
 const knownQty=/^[1-8]$/.test(params.get('qty')||'')?params.get('qty'):null;
 if(params.get('single')==='1'){
  for(const choice of choices.slice(1))choice.remove();
  choices=choices.slice(0,1);
 }
 let selected=choices.find(choice=>choice.dataset.vpSessionChoice===incoming)||choices[0];
 function update(remember){
  for(const choice of choices)choice.setAttribute('aria-pressed',String(choice===selected));
  const session=selected.dataset.vpSessionChoice;
  for(const link of links){const url=new URL(link.href,location.href);url.searchParams.set('session',session);if(knownQty)url.searchParams.set('qty',knownQty);else url.searchParams.delete('qty');for(const key of ['review','single'])if(params.get(key)==='1')url.searchParams.set(key,'1');link.href=url.pathname+url.search;}
  if(remember){const url=new URL(location.href);url.searchParams.set('session',session);history.replaceState(null,'',url.pathname+url.search+url.hash);}
 }
 for(const choice of choices)choice.addEventListener('click',()=>{selected=choice;update(true);});
 window.addEventListener('pageshow',()=>update(false));
 update(false);
})();
