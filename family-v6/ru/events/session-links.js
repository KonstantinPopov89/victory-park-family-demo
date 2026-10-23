// The visible selector and both purchase routes always describe the same session.
(function(){
 'use strict';
 const select=document.querySelector('[data-vp-session-select]');
 if(!select)return;
 const links=[...document.querySelectorAll('[data-vp-session-route]')];
 const params=new URLSearchParams(location.search),incoming=params.get('session');
 const knownQty=/^[1-8]$/.test(params.get('qty')||'')?params.get('qty'):null;
 if(params.get('single')==='1')for(const option of [...select.options].slice(1))option.remove();
 if(incoming&&[...select.options].some(option=>option.value===incoming))select.value=incoming;
 function update(remember){
  for(const link of links){const url=new URL(link.href,location.href);url.searchParams.set('session',select.value);if(knownQty)url.searchParams.set('qty',knownQty);else url.searchParams.delete('qty');for(const key of ['review','single'])if(params.get(key)==='1')url.searchParams.set(key,'1');link.href=url.pathname+url.search;}
  if(remember){const url=new URL(location.href);url.searchParams.set('session',select.value);history.replaceState(null,'',url.pathname+url.search+url.hash);}
 }
 select.addEventListener('change',()=>update(true));
 window.addEventListener('pageshow',()=>update(false));
 update(false);
})();
