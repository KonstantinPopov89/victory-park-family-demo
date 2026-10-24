/* New profile schemas never share writable state or receipt keys with old tabs.
 * Migration is a copy, serialized with payments across both generations.
 * The journal makes an interrupted copy retryable; only the final marker is ready.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports){module.exports=api;return;}
 root.VPFamilyStorage=api;
 api.ready=Promise.resolve().then(()=>api.prepare(root.localStorage,root.navigator.locks)).then(()=>({ok:true}),error=>({ok:false,error:String(error.message||error)}));
})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const prefix='vp.family.v6.people.v1';
 const KEYS=Object.freeze({state:prefix,order:prefix+'.order',history:prefix+'.orders',promotion:prefix+'.promotion',company:prefix+'.company',realCompany:prefix+'.company.real',quickDraft:prefix+'.quickDraft',marker:prefix+'.migration',journal:prefix+'.migration.pending'});
 const LEGACY=Object.freeze({state:'vp.family.v5',order:'vp.family.v5.order',history:'vp.family.v5.orders',promotion:'vp.family.v5.promotion',company:'vp.family.v5.company',realCompany:'vp.family.v5.company.real',quickDraft:'vp.family.v6.quickDraft'});
 const LOCK='vp.family.v5.payment', slots=Object.keys(LEGACY), terminal=new Set(['success','declined']);
 const parse=value=>{try{return JSON.parse(value||'null');}catch{return null;}};
 function migrate(storage){
  const marker=parse(storage.getItem(KEYS.marker));
  if(marker?.version===1&&marker.complete===true)return marker;
  if(storage.getItem(KEYS.marker)!==null)throw new Error('Unknown profile migration marker');
  let journal=parse(storage.getItem(KEYS.journal));
  if(journal!==null&&!(journal.version===1&&journal.before&&journal.after&&slots.every(name=>[journal.before[name],journal.after[name]].every(value=>value===null||typeof value==='string'))))throw new Error('Profile migration journal is damaged');
  if(!journal){
   const before={},after={};
   for(const name of slots){before[name]=storage.getItem(KEYS[name]);after[name]=before[name]??storage.getItem(LEGACY[name]);}
   journal={version:1,before,after};
   storage.setItem(KEYS.journal,JSON.stringify(journal));
  }
  // No controller may write the namespace before this transaction is ready.
  for(const name of slots){const actual=storage.getItem(KEYS[name]);if(actual!==journal.before[name]&&actual!==journal.after[name])throw new Error('Profile storage changed during migration');}
  const written=[];let markerAttempted=false;
  try{
   for(const name of slots){const value=journal.after[name];if(value!==null&&storage.getItem(KEYS[name])!==value){storage.setItem(KEYS[name],value);written.push(name);}if(storage.getItem(KEYS[name])!==value)throw new Error('Profile copy could not be verified');}
   const result={version:1,complete:true,legacyOrderId:parse(journal.after.order)?.id||null};
   // Once marker commit starts, a thrown readback cannot prove it was absent.
   // Keep all verified copies; otherwise a committed marker could point at data
   // removed by rollback. The retained journal makes an uncommitted marker retryable.
   markerAttempted=true;
   storage.setItem(KEYS.marker,JSON.stringify(result));
   if(storage.getItem(KEYS.marker)!==JSON.stringify(result))throw new Error('Profile migration marker could not be verified');
   try{storage.removeItem(KEYS.journal);}catch{}
   return result;
  }catch(error){
   if(!markerAttempted)for(const name of written.reverse())try{if(storage.getItem(KEYS[name])===journal.after[name]){if(journal.before[name]===null)storage.removeItem(KEYS[name]);else storage.setItem(KEYS[name],journal.before[name]);}}catch{}
   throw error;
  }
 }
 async function prepare(storage,locks){
  if(!locks?.request)throw new Error('Cross-tab storage protection is unavailable');
  return locks.request(LOCK,()=>migrate(storage));
 }
 // Call under LOCK when recovering or starting a payment. A newer success always
 // wins over an old pending copy of the same id. No state/profile re-import occurs.
 function legacyOrder(storage,validate,lineIds=[]){
  const old=validate(parse(storage.getItem(LEGACY.order)));if(!old)return null;
  const active=validate(parse(storage.getItem(KEYS.order)));
  const history=parse(storage.getItem(KEYS.history));
  const paid=(Array.isArray(history)?history:[]).map(validate).find(o=>o?.id===old.id&&o.status==='success');
  if(paid||active?.id===old.id&&active.status==='success')return null;
  if(active?.id===old.id){
   const rank={issuance:1,partial:2,success:3},currentRank=rank[active.status]||0,oldRank=rank[old.status]||0;
   if(currentRank){
    if(oldRank<currentRank||oldRank===currentRank&&!(old.status==='partial'&&old.issuedCount>active.issuedCount))return null;
    // Issuance may advance in another tab, but an already confirmed payment's
    // dates, prices and rights must not be replaced by that tab's later copy.
    const next={...active,status:old.status};
    if(old.status==='partial')next.issuedCount=old.issuedCount;else delete next.issuedCount;
    return validate(next);
   }
   return oldRank||active.status==='pending'&&old.status==='declined'?old:null;
  }
  if(active&&!terminal.has(active.status))return null;
  return !terminal.has(old.status)||old.status==='success'&&old.lines?.some(line=>lineIds.includes(line.id))?old:null;
 }
 async function wait(){
  const lang=new URLSearchParams(location.search).get('lang')||document.documentElement.lang||'ru';
  const timer=setTimeout(()=>{if(document.getElementById('family-storage-pending'))return;const panel=document.createElement('p');panel.id='family-storage-pending';panel.setAttribute('role','status');panel.setAttribute('data-i18n-skip','');panel.textContent=({ru:'Проверяем сохранённый выбор и покупки. Подождите завершения операции в другой вкладке.',en:'Checking saved choices and purchases. Please wait for the operation in the other tab to finish.',hy:'Ստուգում ենք պահպանված ընտրությունն ու գնումները։ Սպասեք մյուս ներդիրում գործողության ավարտին։'})[lang]||'Проверяем сохранённый выбор и покупки.';panel.style.cssText='position:fixed;inset:auto 16px 16px;z-index:99999;background:#faf9f5;color:#35306c;padding:20px;border:1px solid #d7d4e4;border-radius:16px;font:16px/1.5 system-ui';document.body.append(panel);},600);
  const result=await api.ready;clearTimeout(timer);document.getElementById('family-storage-pending')?.remove();if(result?.ok)return true;
  const copy={ru:['Не удалось открыть сохранённый выбор','Данные прежней версии сохранены. Обновите страницу, чтобы повторить перенос. Если ошибка повторяется, разрешите хранение данных в браузере.','Повторить'],en:['Unable to open your saved selection','Your previous data is safe. Reload to retry the transfer. If the error persists, allow browser storage.','Retry'],hy:['Չհաջողվեց բացել պահպանված ընտրությունը','Նախորդ տվյալները պահպանված են։ Վերբեռնեք էջը՝ փոխանցումը կրկնելու համար։ Եթե սխալը կրկնվում է, թույլատրեք դիտարկիչի տվյալների պահպանումը։','Կրկնել']};
  const text=copy[lang]||copy.ru;
  if(!document.getElementById('family-storage-error')){const panel=document.createElement('section');panel.id='family-storage-error';panel.setAttribute('role','alert');panel.setAttribute('data-i18n-skip','');panel.style.cssText='position:fixed;inset:0;z-index:99999;background:#faf9f5;color:#35306c;padding:24px;display:flex;flex-direction:column;justify-content:center;gap:16px;font:18px/1.5 system-ui';const title=document.createElement('h1'),body=document.createElement('p'),button=document.createElement('button');title.textContent=text[0];body.textContent=text[1];button.textContent=text[2];button.style.cssText='min-height:48px;font:inherit;cursor:pointer';button.onclick=()=>location.reload();panel.append(title,body,button);document.body.append(panel);}
  return false;
 }
 const api={KEYS,LEGACY,LOCK,prepare,migrate,legacyOrder,wait,ready:null};return api;
});
