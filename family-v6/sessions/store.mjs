import {translate} from './i18n.mjs?vpv=e01beda88f59772a';
import {EVENTS,SESSIONS,defaultState,restore,total} from './engine.mjs?vpv=53adea77955e4349';
export const STORAGE='vp.family.v6.sessions.v1';
export const BUSY=['processing','unknown','pending','security'];
export function emptyRecord(){return {version:1,revision:0,state:defaultState(),qtyKnown:false,ui:{view:'events'},mapSnapshot:null,orders:[],orderSeq:0};}
export function normalizedRecord(raw,{recover=false}={}){
 const r=raw?.version===1?structuredClone(raw):emptyRecord();
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
 r.state=checked;r.qtyKnown=r.qtyKnown===true;r.orders=Array.isArray(r.orders)?r.orders.filter(o=>o?.id&&o.snapshot&&restore(o.snapshot).orderId===o.id):[];
 r.orderSeq=Math.max(Number.isSafeInteger(r.orderSeq)?r.orderSeq:0,checked.orderSeq,...r.orders.map(o=>Number(o.id.slice(5))||0));
 r.state.orderSeq=r.orderSeq;r.revision=Number.isSafeInteger(r.revision)?r.revision:0;
 r.ui=r.ui&&typeof r.ui==='object'?r.ui:{view:'events'};return r;
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
let dbPromise;
function database(){
 if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open(STORAGE,1);req.onupgradeneeded=()=>req.result.createObjectStore('booking');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
 return dbPromise;
}
export async function transact(transform,{recover=false}={}){
 const db=await database();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('booking','readwrite'),os=tx.objectStore('booking'),get=os.get('record');let output;
  get.onsuccess=()=>{
   try{
    let raw=get.result;if(!raw){try{raw=JSON.parse(localStorage.getItem(STORAGE));}catch{}}
    const record=normalizedRecord(raw,{recover});output=transform(record)||record;
    output.version=1;output.revision=record.revision+1;os.put(output,'record');
   }catch(error){tx.abort();reject(error);}
  };
  tx.oncomplete=()=>{try{localStorage.setItem(STORAGE,JSON.stringify(output));}catch{}resolve(output);};
  tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Booking storage is unavailable'));
 });
}
export async function read(){const db=await database();return new Promise((resolve,reject)=>{const req=db.transaction('booking').objectStore('booking').get('record');req.onsuccess=()=>{try{resolve(normalizedRecord(req.result));}catch(error){reject(error);}};req.onerror=()=>reject(req.error);});}
