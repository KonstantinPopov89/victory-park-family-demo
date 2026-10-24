/* Live synchronization of real interests only. Commerce and demo selections stay separate. */
(function(){'use strict';
 var pending=false,busy=false,ready=false;
 function run(reason,intents,overrides){
  if(!ready||busy||!window.VPJourneyBridge)return {ok:false,error:'Profile storage is not ready'};busy=true;
  var result;
  try{var options=Object.assign({},overrides||{},{intents:intents});if(window.VP3)options.createAState=VP3.emptyState;result=VPJourneyBridge.sync(localStorage,options);}catch(e){result={ok:false,error:String(e.message||e)};}
  busy=false;
  if(result?.ok&&result.changedKeys.length){queueMicrotask(function(){document.dispatchEvent(new CustomEvent('vp:interests',{detail:{reason:reason||'sync',shared:result.state.shared}}));});}
  return result;
 }
 window.VPJourneySync=run;
 VPFamilyStorage.wait().then(function(ok){if(ok){ready=true;run('entry');}});
 window.addEventListener('storage',function(e){if(!Object.values(VPJourneyBridge.KEYS).includes(e.key)&&e.key!==null)return;if(pending)return;pending=true;setTimeout(function(){pending=false;run('storage');document.dispatchEvent(new CustomEvent('vp:interests',{detail:{reason:'external'}}));},0);});
 window.addEventListener('pageshow',function(){run('pageshow');document.dispatchEvent(new CustomEvent('vp:interests',{detail:{reason:'pageshow'}}));});
 window.addEventListener('pagehide',function(){run('pagehide');});
}());
