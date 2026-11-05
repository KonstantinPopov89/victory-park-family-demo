/* Provenance for an untouched automatic homepage preview; no existing draft is inferred automatic. */
(function(){'use strict';
 // Only a newly generated homepage default carries provenance. Existing drafts
 // without this marker, changed carts and every attempted payment are explicit.
 var homeDefaultKey='vp.family.v6.people.v1.homeDefault',stateKey='vp.family.v6.people.v1';
 function cartIdentity(state){return JSON.stringify((state?.cart?.lines||[]).map(function(l){return [l.id,l.productId,l.rideId||null,l.personId||null,l.recipientKey||null,l.quantity,l.unitPrice,!!l.autoCompanion,l.companionFor||[],l.companionReason||null];}));}
 function claimHomeDefault(){try{localStorage.removeItem(homeDefaultKey);}catch{}}
 window.VPHomeDefault=Object.freeze({
  mark:function(state){try{if(state.cart.lines.length===3&&state.cart.lines.every(function(l){return l.productId==='unlimited'&&l.quantity===1&&!l.personId;}))localStorage.setItem(homeDefaultKey,JSON.stringify({version:1,cart:cartIdentity(state)}));}catch{}},
  claim:claimHomeDefault,
  release:function(){
   try{
    var marker=VPFamilyStorage.parseStrict(localStorage.getItem(homeDefaultKey)||'null');if(marker?.version!==1)return false;
    var state=VPFamilyStorage.parseStrict(localStorage.getItem(stateKey)||'null');
    if(!state||cartIdentity(state)!==marker.cart){claimHomeDefault();return false;}
    // A payment snapshot always takes priority, even if an older tab left a marker.
    var order=VPFamilyStorage.parseStrict(localStorage.getItem(stateKey+'.order')||'null');
    if(order&&(!['success','declined'].includes(order.status)||order.lines?.some(function(l){return state.cart.lines.some(function(c){return c.id===l.id;});})))return false;
    var next=Object.assign({},state,{cart:{lines:[]}});VPFamilyStorage.writeState(localStorage,next);
    claimHomeDefault();localStorage.removeItem(stateKey+'.quickDraft');return true;
   }catch{return false;}
  }
 });
}());
