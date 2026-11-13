// Keep disclosure state and keyboard context when a booking view replaces its DOM.
const disclosures=['.booking-mobile-menu','.conditions','.previous-ticket','.review-panel'];
const scopes=['.booking-mobile-header','.v5-header'];

function visible(control){
 if(!control?.isConnected||control.disabled||control.closest('[hidden],[inert]')||!control.getClientRects().length)return false;
 const closed=control.closest('details:not([open])');
 if(closed&&!closed.querySelector('summary')?.contains(control))return false;
 const style=control.ownerDocument.defaultView.getComputedStyle(control);
 return style.visibility!=='hidden'&&style.visibility!=='collapse';
}

export function captureRenderContext(root){
 const active=root.ownerDocument.activeElement;
 const focus=active&&root.contains(active)?{
  id:active.id,
  action:active.dataset.action,
  value:active.dataset.value,
  scope:scopes.find(selector=>active.closest(selector)),
  summary:disclosures.find(selector=>root.querySelector(selector)?.querySelector('summary')===active),
  selection:typeof active.selectionStart==='number'?{
   start:active.selectionStart,end:active.selectionEnd,direction:active.selectionDirection
  }:null
 }:null;
 return {
  focus,
  disclosures:disclosures.flatMap(selector=>{
   const detail=root.querySelector(selector);
   return detail?[{selector,open:detail.open}]:[];
  })
 };
}

export function restoreRenderContext(root,context,{focus=true}={}){
 for(const saved of context.disclosures){
  const detail=root.querySelector(saved.selector);
  if(detail)detail.open=saved.open;
 }
 const saved=context.focus;
 if(!focus||!saved)return;
 let candidates=[];
 if(saved.id)candidates=[...root.querySelectorAll('[id]')].filter(el=>el.id===saved.id);
 else if(saved.action)candidates=[...root.querySelectorAll('[data-action]')].filter(el=>el.dataset.action===saved.action&&el.dataset.value===saved.value);
 else if(saved.summary){const summary=root.querySelector(saved.summary)?.querySelector('summary');if(summary)candidates=[summary];}
 const scoped=saved.scope?candidates.filter(el=>el.closest(saved.scope)):candidates;
 // Responsive headers contain duplicate language controls. Never focus their hidden copy.
 const target=scoped.find(visible)||candidates.find(visible);
 if(!target)return;
 target.focus({preventScroll:true});
 if(saved.selection&&typeof target.setSelectionRange==='function'){
  target.setSelectionRange(saved.selection.start,saved.selection.end,saved.selection.direction);
 }
}
