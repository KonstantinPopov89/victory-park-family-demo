/* New profile schemas never share writable state or receipt keys with old tabs.
 * Migration is a copy, serialized with payments across both generations.
 * The journal makes an interrupted copy retryable; only the final marker is ready.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports){module.exports=api;return;}
 root.VPFamilyStorage=api;
 api.installBoot(root);
 api.ready=Promise.resolve().then(()=>api.prepare(root.localStorage,root.navigator.locks)).then(()=>({ok:true}),error=>({ok:false,error:String(error.message||error)}));
})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const prefix='vp.family.v6.people.v1';
 const KEYS=Object.freeze({state:prefix,order:prefix+'.order',history:prefix+'.orders',promotion:prefix+'.promotion',company:prefix+'.company',realCompany:prefix+'.company.real',quickDraft:prefix+'.quickDraft',marker:prefix+'.migration',journal:prefix+'.migration.pending'});
 const LEGACY=Object.freeze({state:'vp.family.v5',order:'vp.family.v5.order',history:'vp.family.v5.orders',promotion:'vp.family.v5.promotion',company:'vp.family.v5.company',realCompany:'vp.family.v5.company.real',quickDraft:'vp.family.v6.quickDraft'});
 const LOCK='vp.family.v5.payment', slots=Object.keys(LEGACY), terminal=new Set(['success','declined']);
 const parse=value=>{try{return JSON.parse(value||'null');}catch{return null;}};
 const recoveryKey=prefix+'.recovery',historyBackup=KEYS.history+'.backup',stateBackup=KEYS.state+'.backup';
 const recoveryKeys=new Set([KEYS.history,KEYS.state]);
 const memoryNotices=new Set(),memoryValues=new Map();
 const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
 function notices(storage){let saved=[];try{const raw=parse(storage.getItem(recoveryKey));if(Array.isArray(raw))saved=raw.filter(key=>recoveryKeys.has(key));}catch{}return [...new Set([...saved,...memoryNotices])];}
 function markRecovery(storage,key){memoryNotices.add(key);storage.setItem(recoveryKey,JSON.stringify(notices(storage)));}
 function acknowledgeRecovery(storage,key){memoryNotices.delete(key);try{storage.setItem(recoveryKey,JSON.stringify(notices(storage).filter(item=>item!==key)));}catch{}}
 function archive(storage,key,raw){storage.setItem(key+'.damaged.'+Date.now()+'.'+Math.random().toString(36).slice(2,8),raw);}
 function remember(storage,key,value){const raw=JSON.stringify(value);try{if(storage.getItem(key)!==raw)storage.setItem(key,raw);}catch{}return value;}
 function validatedHistory(raw,validate){
  const value=parse(raw),rows=[];let valid=Array.isArray(value);
  if(Array.isArray(value))for(const item of value){let accepted=null;try{accepted=validate(item);}catch{}if(accepted)rows.push(item);else valid=false;}
  return {rows,valid};
 }
 function readHistory(storage,validate){
  let raw;try{raw=storage.getItem(KEYS.history);}catch{return {rows:memoryValues.get(KEYS.history)||[],damaged:false,saved:false};}
  if(raw===null)return {rows:[],damaged:false,saved:true};
  const current=validatedHistory(raw,validate);if(current.valid)return {rows:current.rows,damaged:false,saved:true};
  const rows=current.rows.slice(),ids=new Set(rows.map(order=>order.id));
  let backup=[];try{backup=validatedHistory(storage.getItem(historyBackup),validate).rows;}catch{}
  // The active slot can still contain the most recent paid receipt if no history copy survived.
  try{const active=parse(storage.getItem(KEYS.order));if(validate(active)?.status==='success')backup.push(active);}catch{}
  for(const order of backup)if(!ids.has(order.id)){rows.push(order);ids.add(order.id);}
  memoryNotices.add(KEYS.history);memoryValues.set(KEYS.history,rows);
  return {rows,damaged:true,saved:false,raw};
 }
 // Mutation helpers run under the existing payment lock. A read never overwrites the journal.
 function recoverHistory(storage,validate){
  const result=readHistory(storage,validate);
  if(result.damaged)try{archive(storage,KEYS.history,result.raw);markRecovery(storage,KEYS.history);storage.setItem(KEYS.history,JSON.stringify(result.rows));result.saved=true;}catch{result.saved=false;}
  if(result.saved)remember(storage,historyBackup,result.rows);
  return result;
 }
 function writeHistory(storage,rows,validate){
  const prior=recoverHistory(storage,validate);if(!prior.saved)throw new Error('History could not be preserved');
  if(!Array.isArray(rows)||rows.some(order=>!validate(order)))throw new Error('Invalid history snapshot');
  storage.setItem(KEYS.history,JSON.stringify(rows));memoryValues.set(KEYS.history,rows);remember(storage,historyBackup,rows);
 }
 function stateEnvelope(value){return object(value)&&value.version===3&&Array.isArray(value.party)&&object(value.selections)&&Array.isArray(value.selections.real)&&Array.isArray(value.selections.demo)&&object(value.cart)&&Array.isArray(value.cart.lines);}
 function recoverState(storage,sanitize){
  let raw;try{raw=storage.getItem(KEYS.state);}catch{return {state:sanitize(null),saved:false};}
  if(raw===null)return {state:sanitize(null),saved:true};
  const value=parse(raw);
  if(stateEnvelope(value)){const state=sanitize(value);remember(storage,stateBackup,state);return {state,saved:true};}
  let backup=null;try{const candidate=parse(storage.getItem(stateBackup));if(stateEnvelope(candidate))backup=candidate;}catch{}
  // Preserve well-formed live parts; only a broken container can be filled from the backup.
  const restored=object(value)?{...value}:{};
  if(backup){for(const key of ['party','riders'])if(!Array.isArray(restored[key]))restored[key]=backup[key];if(!object(restored.selections))restored.selections={};for(const mode of ['real','demo'])if(!Array.isArray(restored.selections[mode]))restored.selections[mode]=backup.selections[mode];if(!object(restored.cart))restored.cart={};if(!Array.isArray(restored.cart.lines))restored.cart.lines=backup.cart.lines;}
  const state=sanitize(restored);memoryNotices.add(KEYS.state);memoryValues.set(KEYS.state,state);
  let saved=false;try{archive(storage,KEYS.state,raw);markRecovery(storage,KEYS.state);storage.setItem(KEYS.state,JSON.stringify(state));remember(storage,stateBackup,state);saved=true;}catch{}
  return {state,saved};
 }
 function writeState(storage,state){
  if(!stateEnvelope(state))throw new Error('Invalid selection envelope');
  const raw=storage.getItem(KEYS.state);if(raw!==null&&!stateEnvelope(parse(raw))){archive(storage,KEYS.state,raw);markRecovery(storage,KEYS.state);}
  storage.setItem(KEYS.state,JSON.stringify(state));remember(storage,stateBackup,state);
 }
 function recoveryHTML(storage,lang){
  const copy={ru:{history:'Часть сохраненной истории была повреждена. Ниже доступны сохранившиеся заказы. Если нужного билета нет, проверьте скачанные файлы. Перед новой покупкой проверьте результат прежней.',state:'Сохраненный выбор был поврежден. Доступные данные сохранены. Проверьте компанию, количество и состав перед покупкой.',ack:'Понятно'},en:{history:'Some saved history was damaged. The surviving orders are available below. If a ticket is missing, check your downloaded files. Review the previous result before buying again.',state:'Your saved selection was damaged. Available data was kept. Review your group, quantities and items before buying.',ack:'Got it'},hy:{history:'Պահպանված պատմության մի մասը վնասվել է։ Ստորև հասանելի են պահպանված պատվերները։ Եթե տոմսը բացակայում է, ստուգեք ներբեռնված ֆայլերը։ Նոր գնումից առաջ ստուգեք նախորդ արդյունքը։',state:'Պահպանված ընտրությունը վնասվել է։ Հասանելի տվյալները պահպանվել են։ Գնումից առաջ ստուգեք խումբը, քանակը և կազմը։',ack:'Հասկացա'}};
  const text=copy[lang]||copy.ru;
  return notices(storage).map(key=>{const kind=key===KEYS.history?'history':'state';return '<div class="notice vp-storage-recovery" role="status" data-i18n-skip data-storage-recovery="'+kind+'"><p>'+text[kind]+'</p><button class="btn btn-outline" type="button" data-vp-recovery-dismiss="'+kind+'">'+text.ack+'</button></div>';}).join('');
 }
 function installBoot(root){
  const doc=root.document;let failed=false,timer;
  const language=()=>new URLSearchParams(root.location.search).get('lang')||doc.documentElement.lang||'ru';
  const copy={ru:['Загружаем выбор','Не удалось загрузить выбор','Проверьте соединение и обновите страницу. Это не повторяет оплату и не удаляет сохраненные заказы.','Обновить страницу','Официальный сайт парка'],en:['Loading your selection','Unable to load your selection','Check your connection and refresh. This does not repeat a payment or clear saved orders.','Refresh the page','Official park website'],hy:['Բեռնում ենք ընտրությունը','Չհաջողվեց բեռնել ընտրությունը','Ստուգեք կապը և թարմացրեք էջը։ Սա չի կրկնում վճարումը և չի ջնջում պահպանված պատվերները։','Թարմացնել էջը','Այգու պաշտոնական կայք']};
  function fail(){failed=true;const box=doc.getElementById('vp-boot-state');if(!box)return;const text=copy[language()]||copy.ru;box.dataset.state='error';box.querySelector('h1').textContent=text[1];box.querySelector('p').textContent=text[2];}
  root.addEventListener('error',event=>{if(event.target?.matches?.('[data-vp-boot-entry]'))fail();},true);
  root.addEventListener('unhandledrejection',()=>{if(doc.getElementById('vp-boot-state'))fail();});
  doc.addEventListener('DOMContentLoaded',()=>{const box=doc.getElementById('vp-boot-state');if(!box)return;const text=copy[language()]||copy.ru;box.querySelector('h1').textContent=text[0];box.querySelector('p').textContent=text[2];box.querySelector('[data-vp-boot-retry]').textContent=text[3];box.querySelector('a:not([data-vp-boot-retry])').textContent=text[4];if(failed)fail();else timer=setTimeout(fail,12000);});
  doc.addEventListener('vp:catalog-rendered',()=>{if(!doc.getElementById('vp-boot-state'))clearTimeout(timer);});
  doc.addEventListener('click',event=>{if(event.target.closest?.('[data-vp-boot-retry]')){event.preventDefault();root.location.reload();}const dismiss=event.target.closest?.('[data-vp-recovery-dismiss]');if(dismiss){acknowledgeRecovery(root.localStorage,dismiss.dataset.vpRecoveryDismiss==='history'?KEYS.history:KEYS.state);doc.dispatchEvent(new Event('vp:storage-recovery'));}});
 }

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
 const api={KEYS,LEGACY,LOCK,prepare,migrate,legacyOrder,wait,readHistory,recoverHistory,writeHistory,recoverState,writeState,recoveryHTML,notices,installBoot,ready:null};return api;
});
