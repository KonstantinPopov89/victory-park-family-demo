/* Explicit, origin-local erasure of this park's data. Never clear the whole origin. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports){module.exports=api;return;}
 root.VPPrivacy=api;api.install(root);
})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const BASE='/victory-park-family-demo/family-v6/';
 const ERASED='vp.family.v6.privacy.erased';
 const PREFIXES=['vp.family.v6.','vp.family.v5.','vp.family.v3.','vp.pass-clarity.','vp.receipt.','vp.catalog.v2.','vp.integrated.','vp.v5.','vp.discovery.','vp.reels.','vp.swipe.','vp.journey.','vp.promotions.'];
 const EXACT=new Set(['vp.family.v3','vp.family.v5','vpLang','vpList','vpLog','vpSid','vpUtm','vpNewEntry','vpDeckMode','vpDraft','vpDuty','vpEscort','vpHintFeed','vpHintSwipe','vpNoEscort','vpOffer','vpOrder','vpOrders','vpPack','vpParty','vpPayScn','vpPayVar','vpPending','vpShow','vpStatus','victory-availability-pages-v1','__vp']);
 const DATABASES=['vp.family.v6.sessions.v1','vp-demo-card-topup-v6','vp-demo-card-topup-v1'];
 const copy={
  ru:{link:'Данные в этом браузере',title:'Данные Victory Park',body:'Выбор, состав компании, контакты в сеансах, демопокупки и их резервные копии хранятся в этом браузере до удаления вами или браузером. Скачанные файлы и данные на других устройствах удаляются отдельно. Перед удалением сохраните нужные билеты и закройте другие вкладки этого демосайта, включая старые версии.',button:'Удалить данные Victory Park',confirm:'Удалить выбор, контакты и все демопокупки Victory Park из этого браузера? Скачанные файлы сохранятся.',busy:'Удаляем данные…',done:'Данные Victory Park удалены. Можно начать новый демозаказ.',error:'Не удалось подтвердить полное удаление. Закройте другие вкладки Victory Park, разрешите локальное хранение и повторите. Уже удаленные записи не восстанавливаются.',back:'Вернуться на главную'},
  en:{link:'Data in this browser',title:'Victory Park data',body:'Selections, group members, booking contacts, demo purchases and their backups stay in this browser until you or the browser remove them. Downloaded files and data on other devices must be removed separately. Save any tickets you need and close other tabs of this demo, including older versions, before deleting.',button:'Delete Victory Park data',confirm:'Delete selections, contacts and all Victory Park demo purchases from this browser? Downloaded files will remain.',busy:'Deleting data…',done:'Victory Park data has been deleted. You can start a new demo purchase.',error:'Complete deletion could not be confirmed. Close other Victory Park tabs, allow browser storage and retry. Records already removed will not be restored.',back:'Back to home'},
  hy:{link:'Տվյալներն այս դիտարկիչում',title:'Victory Park-ի տվյալներ',body:'Ընտրությունը, խմբի անդամները, ամրագրումների կոնտակտները, ցուցադրական գնումներն ու պահուստային պատճենները մնում են այս դիտարկիչում, մինչև դուք կամ դիտարկիչը ջնջեք դրանք։ Ներբեռնված ֆայլերն ու այլ սարքերի տվյալները ջնջվում են առանձին։ Նախ պահպանեք անհրաժեշտ տոմսերը և փակեք այս ցուցադրական կայքի մյուս ներդիրները, ներառյալ հին տարբերակները։',button:'Ջնջել Victory Park-ի տվյալները',confirm:'Ջնջե՞լ ընտրությունը, կոնտակտները և բոլոր ցուցադրական գնումները այս դիտարկիչից։ Ներբեռնված ֆայլերը կմնան։',busy:'Տվյալները ջնջվում են…',done:'Victory Park-ի տվյալները ջնջված են։ Կարող եք նոր ցուցադրական գնում սկսել։',error:'Ամբողջական ջնջումը չի հաստատվել։ Փակեք Victory Park-ի մյուս ներդիրները, թույլատրեք տվյալների պահպանումը և կրկնեք։ Արդեն ջնջված գրառումները չեն վերականգնվի։',back:'Վերադառնալ գլխավոր էջ'}
 };
 function owned(key){return typeof key==='string'&&key!==ERASED&&(EXACT.has(key)||PREFIXES.some(prefix=>key.startsWith(prefix)));}
 function clearStorage(storage){
  const keys=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(typeof key==='string'&&owned(key))keys.push(key);}
  for(const key of keys)storage.removeItem(key);
  for(let i=0;i<storage.length;i++)if(owned(storage.key(i)))throw new Error('Storage retained park data');
  return keys.length;
 }
 function removeDatabase(idb,name,timeout=4000){return new Promise((resolve,reject)=>{
  let settled=false;const finish=(error)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve(name);};
  const timer=setTimeout(()=>finish(new Error('Close other park tabs')),timeout);
  try{const request=idb.deleteDatabase(name);request.onsuccess=()=>finish();request.onerror=()=>finish(new Error('Database deletion failed'));request.onblocked=()=>finish(new Error('Close other park tabs'));}catch(error){finish(error);}
 });}
 async function erase(env){
  const run=async()=>{
   if(!env.indexedDB)throw new Error('Database access unavailable');
   // This non-personal tombstone also prevents old profile/order re-import.
   env.localStorage.setItem(ERASED,JSON.stringify({version:1,erasedAt:Date.now()}));
   env.notify?.();
   const removed=clearStorage(env.localStorage)+clearStorage(env.sessionStorage);
   await Promise.all(DATABASES.map(name=>removeDatabase(env.indexedDB,name)));
   clearStorage(env.localStorage);clearStorage(env.sessionStorage);
   if(typeof env.indexedDB.databases==='function'&&(await env.indexedDB.databases()).some(db=>DATABASES.includes(db.name)))throw new Error('A park database was reopened; close other tabs and retry');
   return {ok:true,removed,databases:DATABASES.slice()};
  };
  return env.locks?.request?env.locks.request('vp.family.v5.payment',run):run();
 }
 function install(root){
  const doc=root.document;
  const lang=()=>{const q=new URLSearchParams(root.location.search).get('lang'),p=root.location.pathname.match(/\/(ru|en|hy)\//)?.[1];return [q,p,doc.documentElement.lang].find(x=>Object.hasOwn(copy,x))||'ru';};
  const privacyURL=()=>BASE+'privacy.html?lang='+lang();
  root.addEventListener('storage',event=>{
   if(event.key!==ERASED||!event.newValue)return;
   let failed=false;try{clearStorage(root.sessionStorage);}catch{failed=true;}
   if(failed||!root.location.pathname.endsWith('/privacy.html'))root.location.replace(privacyURL()+(failed?'&eraseError=1':''));
  });
  doc.addEventListener('DOMContentLoaded',()=>{
   const words=copy[lang()],page=doc.querySelector('[data-vp-privacy-page]');
   if(page){
    doc.documentElement.lang=lang();doc.title=words.title;
    for(const name of ['title','body','button','back'])page.querySelector('[data-privacy-'+name+']').textContent=words[name];
    page.querySelector('[data-privacy-back]').href=BASE+lang()+'/';
    const button=page.querySelector('[data-privacy-button]'),status=page.querySelector('[data-privacy-status]');
    if(new URLSearchParams(root.location.search).get('eraseError')==='1'){status.textContent=words.error;status.dataset.result='error';}
    button.addEventListener('click',async()=>{
     if(!root.confirm(words.confirm))return;
     button.disabled=true;status.textContent=words.busy;
     try{await erase({localStorage:root.localStorage,sessionStorage:root.sessionStorage,indexedDB:root.indexedDB,locks:root.navigator.locks});status.textContent=words.done;status.dataset.result='success';}
     catch{status.textContent=words.error;status.dataset.result='error';}
     finally{button.disabled=false;}
    });
   }else if(!doc.querySelector('[data-vp-privacy-link]')){
    const foot=doc.createElement('div'),link=doc.createElement('a');foot.className='vp-privacy-control';foot.style.cssText='padding:16px 20px 96px;text-align:center;font:14px/1.5 system-ui';link.href=privacyURL();link.textContent=words.link;link.dataset.vpPrivacyLink='';link.style.cssText='color:#35306c;text-decoration:underline;display:inline-block;padding:12px';foot.append(link);doc.body.append(foot);
   }
  });
 }
 return {ERASED,DATABASES,owned,clearStorage,erase,install};
});
