import {translate} from './i18n.mjs?vpv=e639e1ea8ee01408';
import {EVENTS,SESSIONS,defaultState,restore,total} from './engine.mjs?vpv=53adea77955e4349';
export const STORAGE='vp.family.v6.sessions.v1';
export const BUSY=['processing','unknown','pending','security'];
export function emptyRecord(){return {version:1,revision:0,state:defaultState(),qtyKnown:false,ui:{view:'events'},mapSnapshot:null,orders:[],orderSeq:0};}
function bounded(value,depth=0,budget={n:100000}){if(--budget.n<0||depth>16)return false;if(value===null||typeof value==='boolean')return true;if(typeof value==='number')return Number.isFinite(value);if(typeof value==='string')return value.length<=8192;if(typeof value!=='object')return false;const keys=Object.keys(value);return keys.length<=2000&&keys.every(k=>k.length<=128&&!['__proto__','prototype','constructor'].includes(k)&&bounded(value[k],depth+1,budget));}
export function validJournalOrder(o){
 if(!o||typeof o!=='object'||typeof o.id!=='string'||!/^demo-[1-9]\d{0,12}$/.test(o.id)||!['form','quiz'].includes(o.variant))return false;
 const s=o.snapshot,event=EVENTS.find(e=>e.id===o.eventId),session=SESSIONS.find(x=>x.id===o.sessionId&&x.eventId===o.eventId);
 if(!s||!event||!session||!Number.isSafeInteger(o.qty)||o.qty<1||o.qty>8||!Number.isSafeInteger(o.amount)||o.amount<=0||o.amount>100000000)return false;
 if(!Number.isFinite(o.createdAt)||!Number.isFinite(o.updatedAt)||o.createdAt<=0||o.updatedAt<o.createdAt||!Number.isFinite(new Date(o.updatedAt).getTime()))return false;
 if(!['select','payment','processing','declined','security','unknown','pending','issued','expired'].includes(o.phase)||s.orderId!==o.id||s.eventId!==o.eventId||s.sessionId!==o.sessionId||s.qty!==o.qty||s.phase!==o.phase||restore(s).orderId!==o.id)return false;
 if(!Array.isArray(o.seats)||!Array.isArray(s.seats)||o.seats.length!==s.seats.length||o.seats.some((seat,i)=>typeof seat!=='string'||!/^([A-F][1-8])$/.test(seat)||seat!==s.seats[i])||new Set(o.seats).size!==o.seats.length)return false;
 if(o.eventId==='garden'&&o.seats.length!==0||o.eventId==='show'&&o.phase!=='expired'&&o.seats.length!==o.qty)return false;
 if(typeof o.sessionAt!=='string'||!Number.isFinite(Date.parse(o.sessionAt))||!o.eventTitle||typeof o.eventTitle!=='object'||!['ru','hy','en'].every(lang=>typeof o.eventTitle[lang]==='string'&&o.eventTitle[lang].length>0&&o.eventTitle[lang].length<=200))return false;
 return o.currency==='AMD'&&Number.isSafeInteger(o.unitPrice)&&o.unitPrice>0&&o.unitPrice*o.qty===o.amount&&typeof o.contact==='string'&&o.contact.length<=254;
}
export function normalizedRecord(raw,{recover=false}={}){
 if(raw!==undefined&&raw!==null&&!bounded(raw))throw new Error('Booking record exceeds safe storage limits');
 if(raw!==undefined&&raw!==null&&(typeof raw!=='object'||Array.isArray(raw)||raw.version!==1))throw new Error('Saved booking version is unsupported; existing records are retained');
 const r=raw==null?emptyRecord():structuredClone(raw);
 if(!Array.isArray(r.orders)||r.orders.some(o=>!validJournalOrder(o)))throw new Error('Saved booking history is damaged; existing records are retained');
 const source=r.state;let checked=restore(source);
 // A malformed active record must not erase an attempted payment. The atomic
 // order journal can recover its exact identity; otherwise stop safely.
 if((source?.orderId&&checked.orderId!==source.orderId)||(BUSY.includes(source?.phase)&&!checked.orderId)||(Number(source?.attempts)>0&&!checked.orderId)){
  const mirror=Array.isArray(r.orders)?r.orders.find(o=>o?.id===source?.orderId&&o.snapshot):null;
  const recovered=mirror?restore(mirror.snapshot):null;
  if(!recovered?.orderId||recovered.orderId!==source?.orderId)throw new Error('Unrecoverable active booking');
  checked=recovered;
 }

 // restore treats interrupted network work as unknown. Live synchronized tabs
 // keep processing until its originating tab resolves, or a real navigation occurs.
 if(!recover&&source?.phase==='processing'&&checked.orderId===source.orderId)checked.phase='processing';
 r.state=checked;r.qtyKnown=r.qtyKnown===true;r.orders=r.orders.slice();
 r.orderSeq=Math.max(Number.isSafeInteger(r.orderSeq)?r.orderSeq:0,checked.orderSeq,...r.orders.map(o=>Number(o.id.slice(5))||0));
 r.state.orderSeq=r.orderSeq;r.revision=Number.isSafeInteger(r.revision)?r.revision:0;
 r.ui={view:['events','sessions','group','checkout','map'].includes(r.ui?.view)?r.ui.view:(!checked.eventId?'events':!checked.sessionId?'sessions':r.qtyKnown?'checkout':'group'),qtyKnown:r.qtyKnown};r.formUi={mapOpen:r.formUi?.mapOpen===true,sessionPicker:r.formUi?.sessionPicker===true};return r;
}
export function captureOrder(record,state,variant,now=Date.now()){
 record.orderSeq=Math.max(record.orderSeq||0,state.orderSeq||0);state.orderSeq=record.orderSeq;
 if(!state.orderId)return;
 const old=record.orders.find(o=>o.id===state.orderId);
 if(old?.phase==='issued')return; // completed snapshots are immutable
 const event=EVENTS.find(e=>e.id===state.eventId),session=SESSIONS.find(s=>s.id===state.sessionId);
 const facts=old?{sessionAt:old.sessionAt,eventTitle:old.eventTitle,unitPrice:old.unitPrice,currency:old.currency}:{sessionAt:session.at,eventTitle:Object.fromEntries(['ru','en','hy'].map(l=>[l,translate(l,event.titleKey)])),unitPrice:event.price,currency:'AMD'};
 const order={...facts,id:state.orderId,variant:old?.variant||variant,createdAt:old?.createdAt||now,updatedAt:now,snapshot:structuredClone(state),eventId:state.eventId,sessionId:state.sessionId,qty:state.qty,seats:[...state.seats],amount:old?.amount??total(state),phase:state.phase,contact:state.email};
 record.orders=record.orders.filter(o=>o.id!==state.orderId).concat(order);
}
export function selectResume(record,id){
 if(!id)return {state:record.state,readonly:false,missing:false};
 if(id===record.state.orderId)return {state:record.state,readonly:false,missing:false};
 const saved=record.orders.find(o=>o.id===id);
 if(!saved)return {state:record.state,readonly:true,missing:true};
 const state=restore(saved.snapshot);state.orderSeq=record.orderSeq;
 // Opening history never replaces a different in-flight order.
 return {state,readonly:true,missing:false};
}
let dbPromise,databaseInvalidated=false;
function database(){
 if(databaseInvalidated)return Promise.reject(new Error('Booking storage was closed. Reload before starting a new booking.'));
 if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open(STORAGE,1);req.onupgradeneeded=()=>req.result.createObjectStore('booking');req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{databaseInvalidated=true;db.close();};resolve(db);};req.onerror=()=>reject(req.error);});
 return dbPromise;
}
export async function transact(transform,{recover=false}={}){
 const db=await database();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('booking','readwrite'),os=tx.objectStore('booking'),get=os.get('record');let output;
  get.onsuccess=()=>{
   try{
    let raw=get.result;if(!raw){let saved=null;try{saved=localStorage.getItem(STORAGE);}catch{}if(saved){if(saved.length>4194304)throw new Error('Booking snapshot exceeds safe storage limits');try{raw=JSON.parse(saved);}catch{throw new Error('Saved booking snapshot is damaged');}}}
    const record=normalizedRecord(raw,{recover});output=transform(record)||record;
    output.version=1;output.revision=record.revision+1;output=normalizedRecord(output);os.put(output,'record');
   }catch(error){tx.abort();reject(error);}
  };
  tx.oncomplete=()=>{try{localStorage.setItem(STORAGE,JSON.stringify(output));}catch{}resolve(output);};
  tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Booking storage is unavailable'));
 });
}
export async function read(){const db=await database();return new Promise((resolve,reject)=>{const req=db.transaction('booking').objectStore('booking').get('record');req.onsuccess=()=>{try{resolve(normalizedRecord(req.result));}catch(error){reject(error);}};req.onerror=()=>reject(req.error);});}
