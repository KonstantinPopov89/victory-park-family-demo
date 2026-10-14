const test=require('node:test');const assert=require('node:assert/strict');const M=require('../model.js');
const B=M.BASE,m=M.MIN;const seed=()=>M.seed(0);const ride=(s,id='autodrom',t=B)=>M.derive(s,t).rides.find(r=>r.id===id);const action=(s,kind,t=B)=>M.reduce(s,{type:'demo',kind},t);const debit=(id='a',eventAt=B,rideId='autodrom',extra={})=>({id,rideId,eventAt,type:'debit',accepted:true,paymentKind:'money',...extra});const ingest=(s,events,t=B)=>M.reduce(s,{type:'ingest',events},t);
test('seed schema and all 11 counts',()=>{const s=seed();assert.equal(M.validate(s),true);assert.equal(M.derive(s,B).rides.length,11);assert.equal(Object.values(M.derive(s,B).counts).reduce((a,b)=>a+b),11);});
test('fresh eligible debit gives auto estimate',()=>{assert.equal(ride(seed()).status,'open');assert.equal(ride(seed()).source,'debits');});
test('inclusive T boundary and first millisecond beyond with fresh source',()=>{let s=ingest(seed(),[debit('boundary')]);s=action(s,'lime-poll',B+15*m);assert.equal(ride(s,'autodrom',B+15*m).status,'open');assert.equal(ride(s,'autodrom',B+15*m+1).status,'unknown');});
test('poll refreshes source but not event',()=>{const s=action(seed(),'lime-poll',B+14*m);assert.equal(s.sources.lime.lastSuccessfulRead,B+14*m);assert.equal(M.lastDebit(s.rides[0]).eventAt,B-m);assert.equal(ride(s,'autodrom',B+14*m).status,'open');assert.equal(ride(s,'autodrom',B+14*m+1).status,'unknown');});
test('stale source blocks even recent debit',()=>{const s=seed();assert.equal(ride(s,'autodrom',B+4*m).source,'source-stale');});
test('source failure and recovery without reading cannot reopen',()=>{let s=action(seed(),'lime-error');s=action(s,'lime-restore');assert.equal(s.sources.lime.ok,true);assert.equal(ride(s).status,'unknown');s=action(s,'lime-poll');assert.equal(ride(s).status,'open');});
test('partial source prevents auto estimate',()=>assert.equal(ride(action(seed(),'lime-incomplete')).source,'source-incomplete'));
test('no first debit stays unknown despite complete polling',()=>assert.equal(ride(action(seed(),'no-first')).source,'no-debit'));
test('old delivered batch does not refresh last event',()=>{let s=action(seed(),'old-batch');assert.equal(s.sources.lime.receivedAt,B);assert.equal(M.lastDebit(s.rides[0]).eventAt,B-m);s=action(s,'no-first');s=action(s,'old-batch');assert.equal(ride(s).source,'debit-expired');assert.equal(M.lastDebit(s.rides[0]).receivedAt,B);});
test('out of order accepted events select maximum eventAt',()=>{const s=ingest(seed(),[debit('new',B),debit('old',B-4*m)]);assert.equal(M.lastDebit(s.rides[0]).id,'new');});
test('duplicates do not refresh event or received timestamps',()=>{const s=action(seed(),'duplicate');assert.equal(s.rides[0].events.length,1);assert.equal(M.lastDebit(s.rides[0]).eventAt,B-m);assert.equal(M.lastDebit(s.rides[0]).receivedAt,B-m);});
test('future event rejected, no false recency',()=>{const s=action(seed(),'future');assert.equal(s.rides[0].events.length,1);assert.equal(M.lastDebit(s.rides[0]).eventAt,B-m);});
test('refund, topup, technical, sale, denied and reversed excluded',()=>{const events=['refund','topup','technical','sale'].map((type,i)=>debit('excluded'+i,B,'autodrom',{type}));events.push(debit('denied',B,'autodrom',{accepted:false}),debit('reversed',B,'autodrom',{reversed:true}));const s=ingest(seed(),events);assert.equal(s.rides[0].events.length,1);assert.equal(M.lastDebit(s.rides[0]).eventAt,B-m);});
test('money, bonus, entitlement fixtures eligible',()=>{const s=ingest(action(seed(),'no-first'),['money','bonus','entitlement'].map((paymentKind,i)=>debit('pay'+i,B-i,'autodrom',{paymentKind})));assert.equal(s.rides[0].events.length,3);assert.equal(ride(s).status,'open');});
test('explicit reversal removes reference and falls back to older event',()=>{let s=ingest(seed(),[debit('latest')]);s=ingest(s,[{id:'reversal',rideId:'autodrom',type:'reversal',reverses:'latest'}]);assert.equal(M.lastDebit(s.rides[0]).id,'seed-autodrom');});
test('unknown and ambiguous mapping prevent auto estimate',()=>{for(const k of ['unmapped','ambiguous'])assert.equal(ride(action(seed(),k)).source,'mapping');});
test('events on unknown mapping not silently accepted',()=>{let s=action(seed(),'unmapped');s=ingest(s,[debit('unmapped-event')]);assert.equal(M.lastDebit(s.rides[0]),null);});
test('start before first event remains unknown, schedule alone cannot open',()=>{const s=action(seed(),'no-first');assert.equal(ride(s,'autodrom',B).status,'unknown');});
test('schedule boundary blocks auto even with new event',()=>{let s=ingest(seed(),[debit('planet',B,'planet')]);assert.equal(ride(s,'planet').source,'schedule');const t=Date.parse('2026-10-14T18:00:00Z');s=ingest(s,[debit('closing',t)],t);s=M.reduce(s,{type:'park',status:'open'},t);assert.equal(ride(s,'autodrom',t).source,'schedule');});
test('new day excludes yesterday even if T expanded',()=>{let s=action(seed(),'next-day');assert.equal(ride(s,'autodrom',B+24*60*m).source,'no-debit');});
test('manual pause overrides newer debit',()=>{const s=action(seed(),'conflict');assert.equal(ride(s,'wheel').status,'paused');assert.equal(ride(s,'wheel').source,'manual');});
test('expired manual remains unknown even with new debit',()=>{const t=B+31*m;let s=ingest(seed(),[debit('wheel-new',t,'wheel')],t);assert.equal(ride(s,'wheel',t).source,'manual-expired');});
test('explicit clear returns to current debit rule and history retained',()=>{let s=action(seed(),'conflict');s=M.reduce(s,{type:'clear',id:'wheel'},B);assert.equal(ride(s,'wheel').source,'debits');assert.equal(s.history.length,2);});
test('park closure overrides all statuses and expiry does not reopen',()=>{let s=M.reduce(seed(),{type:'park',status:'closed'},B);assert.equal(M.derive(s,B).counts.closed,11);s=ingest(s,[debit('late',B+61*m)],B+61*m);assert.equal(ride(s,'autodrom',B+61*m).source,'park-unknown');});
test('manual open independent from source, until its expiry',()=>{const s=action(seed(),'lime-error');assert.equal(ride(s,'mars').status,'open');assert.equal(ride(s,'mars',B+31*m).status,'unknown');});
test('weather only suggests; improving forecast never clears manual pause',()=>{let s=action(seed(),'weather-read');assert.equal(ride(s,'wheel').status,'paused');s=action(s,'weather-clear');assert.equal(ride(s,'wheel').status,'paused');});
test('stale weather warning omitted',()=>assert.equal(M.derive(seed(),B+19*m).weather.showAlert,false));
test('individual and common thresholds apply without overwriting each other',()=>{const s=seed(),values=Object.fromEntries(s.rides.map(r=>[r.id,1]));let n=M.reduce(s,{type:'thresholds',mode:'common',common:30,values},B);assert.equal(M.threshold(n.rides[0],n),30);n=M.reduce(n,{type:'thresholds',mode:'individual',common:30,values},B);assert.equal(M.threshold(n.rides[0],n),1);});
test('reducers are immutable',()=>{const s=seed(),before=JSON.stringify(s);action(s,'lime-read');assert.equal(JSON.stringify(s),before);});
test('search aliases and ё normalization',()=>{assert.equal(M.search(seed().rides,'ракета')[0].id,'rocket');assert.equal(M.search(seed().rides,'полёт')[0].id,'mars');assert.equal(M.search(seed().rides,'колесо обозрения')[0].id,'wheel');});
test('reject corrupt storage and malformed thresholds',()=>{const s=seed();s.rides[0].events[0].eventAt=B+1;assert.equal(M.validate(s),false);assert.throws(()=>M.reduce(seed(),{type:'thresholds',mode:'common',common:0,values:{}},B));});
test('reversal arriving before debit prevents resurrection',()=>{let s=ingest(seed(),[{id:'early-reversal',rideId:'autodrom',type:'reversal',reverses:'later-debit'}]);s=ingest(s,[debit('later-debit')]);assert.equal(M.lastDebit(s.rides[0]).id,'seed-autodrom');});
test('weather action cannot open an attraction',()=>{assert.throws(()=>M.reduce(seed(),{type:'manual',ids:['wheel'],status:'open',reason:'Погода улучшилась',minutes:15,weather:true},B));});
test('weather batch pause changes only selected attractions',()=>{const s=M.reduce(seed(),{type:'manual',ids:['tower'],status:'paused',reason:'Погодные условия проверены',minutes:15,weather:true},B);assert.equal(ride(s,'tower').status,'paused');assert.equal(ride(s,'ufo').status,'open');});

test('changed mapping does not inherit old signal when remapped',()=>{for(const k of ['unmapped','ambiguous']){let s=action(seed(),k);s=action(s,'mapped');assert.equal(ride(s).source,'no-debit');s=ingest(s,[debit('new-after-mapping')]);assert.equal(ride(s).status,'open');}});


test('presentation clock retains all four starting states over real elapsed time',()=>{
 const s=seed();assert.equal(s.clock.running,true);s.clock.running=false;
 assert.equal(M.now(s,0),B);assert.equal(M.now(s,6*60*m),B);
 assert.deepEqual(M.derive(s,M.now(s,6*60*m)).counts,{open:7,paused:1,closed:1,unknown:2});
 assert.equal(M.validate(s),true);
});
test('clock start and pause preserve current simulated time',()=>{
 let s=seed();s.clock.running=false;s.clock.offsetMs=2*m;
 s=M.reduce(s,{type:'clock',running:true,realNow:1000},M.now(s,1000));
 assert.equal(M.now(s,1000),B+2*m);assert.equal(M.now(s,1000+3*m),B+5*m);
 s=M.reduce(s,{type:'clock',running:false,realNow:1000+3*m},M.now(s,1000+3*m));
 assert.equal(M.now(s,1000+100*m),B+5*m);
 assert.throws(()=>M.reduce(s,{type:'clock',running:true,realNow:NaN},B));
});
test('time advance expires statuses in both presentation and running modes',()=>{
 for(const running of [false,true]){
  let s=seed();s.clock.running=running;s=action(s,'advanceT');
  assert.equal(ride(s,'autodrom',M.now(s,0)).status,'unknown');
  s=action(s,'advance',M.now(s,0));
  assert.equal(ride(s,'wheel',M.now(s,0)).source,'manual-expired');
 }
});
