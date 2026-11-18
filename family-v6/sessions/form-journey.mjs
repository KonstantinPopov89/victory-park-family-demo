import {availability, isClosed, reduce, restore, canContinue} from './engine.mjs?vpv=d11e87ba56ace9f9';
export function issuedSnapshot(raw,now=Date.now()) {const state=restore(raw,now);return state.phase==='issued'?structuredClone(state):null;}
export {startsNewBooking} from './journey.mjs?vpv=2cfc2f0a85bf8e96';
export function sessionChoice(state,qtyKnown,now=Date.now()) {
 const stock=availability(state),closed=isClosed(state,now);
 return {...stock,closed,canEnter:!closed&&stock.remaining>=(qtyKnown?state.qty:1)};
}
export function chooseFormSession(state,id,qtyKnown,now=Date.now()) {
 let next=reduce(state,{type:'SESSION',value:id},now);
 // The initial quantity is a suggestion. A known party is never made smaller.
 if(!qtyKnown&&sessionChoice(next,false,now).canEnter&&availability(next).remaining===1)next=reduce(next,{type:'QTY',value:1},now);
 return next;
}
export function payForm(state,now=Date.now()) {
 if(!['select','payment','declined'].includes(state.phase))return state;
 let next=state;
 if(next.phase==='declined')next=reduce(next,{type:'RETRY'},now);
 if(next.phase==='payment'&&!canContinue({...next,phase:'select'},now))next=reduce(next,{type:'BACK'},now);
 if(next.phase==='select')next=reduce(next,{type:'CONTINUE'},now);
 if(next.phase==='payment')next=reduce(next,{type:'PAY'},now);
 return next;
}
