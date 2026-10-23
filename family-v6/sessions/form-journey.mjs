import {EVENTS, SESSIONS, availability, isClosed, reduce, restore, canContinue} from './engine.mjs?vpv=bdfd963ca366b2b7';
export function issuedSnapshot(raw,now=Date.now()) {const state=restore(raw,now);return state.phase==='issued'?structuredClone(state):null;}
export function startsNewBooking(state,query,sessions=SESSIONS) {
 if(state.phase!=='issued')return false;
 const requested=sessions.find(item=>item.id===query.get('session'));
 if(requested)return requested.id!==state.sessionId;
 if(query.has('session'))return false;
 const event=EVENTS.find(item=>item.id===query.get('event'));
 return Boolean(event&&event.id!==state.eventId);
}
export function sessionChoice(state,qtyKnown) {
 const stock=availability(state),closed=isClosed(state);
 return {...stock,closed,canEnter:!closed&&stock.remaining>=(qtyKnown?state.qty:1)};
}
export function chooseFormSession(state,id,qtyKnown,now=Date.now()) {
 let next=reduce(state,{type:'SESSION',value:id},now);
 // The initial quantity is a suggestion. A known party is never made smaller.
 if(!qtyKnown&&sessionChoice(next,false).canEnter&&availability(next).remaining===1)next=reduce(next,{type:'QTY',value:1},now);
 return next;
}
export function payForm(state,now=Date.now()) {
 if(!['select','payment','declined'].includes(state.phase))return state;
 let next=state;
 if(next.phase==='declined')next=reduce(next,{type:'RETRY'},now);
 if(next.phase==='payment'&&!canContinue({...next,phase:'select'}))next=reduce(next,{type:'BACK'},now);
 if(next.phase==='select')next=reduce(next,{type:'CONTINUE'},now);
 if(next.phase==='payment')next=reduce(next,{type:'PAY'},now);
 return next;
}
