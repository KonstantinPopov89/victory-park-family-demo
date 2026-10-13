const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
const base=process.argv[2]||'http://127.0.0.1:8780/',stage=process.argv[3]||'local',pages=(process.argv[4]||'index.html,attractions.html,tickets.html').split(',');
const browser=await chromium.launch({headless:true,args:process.env.VP_QA_HOST_RESOLVER?['--disable-quic','--host-resolver-rules='+process.env.VP_QA_HOST_RESOLVER]:[],executablePath:'/usr/bin/google-chrome'}),checks=[],errors=[];
for(const width of [320,390,768,1440]){
 const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});const p=await context.newPage();
 p.on('pageerror',e=>errors.push({width,message:e.message}));p.on('response',r=>{if(r.status()>=400)errors.push({width,status:r.status(),url:r.url()});});
 for(const page of pages){
  await p.goto(new URL(page,base).href,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
  for(const img of await p.locator('img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode()).catch(()=>{});}
  await p.evaluate(()=>scrollTo(0,0));
  const report=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src),h1:document.querySelector('h1')?.textContent,fonts:document.fonts.status,mainVisible:document.querySelector('main').getBoundingClientRect().height>0,navCount:document.querySelectorAll('header.vp-header').length}));
  assert.equal(report.overflow,false,`overflow ${page} ${width}`);assert.deepEqual(report.broken,[]);assert.equal(report.navCount,1);assert.equal(report.mainVisible,true);
  if(width<801){await p.locator('#vp-menu-toggle').click();assert.equal(await p.locator('#vp-mobile-nav').isVisible(),true);await p.keyboard.press('Escape');assert.equal(await p.locator('#vp-mobile-nav').isVisible(),false);assert.equal(await p.evaluate(()=>document.activeElement.id),'vp-menu-toggle');}
  checks.push({page,width,status:'PASS',...report});
  if([390,1440].includes(width))await p.screenshot({path:path.join(__dirname,`${stage}-${page.replace('.html','')}-${width}.png`),fullPage:true});
 }
 await context.close();
}
assert.deepEqual(errors,[]);await browser.close();
fs.writeFileSync(path.join(__dirname,`${stage}-visual.json`),JSON.stringify({status:'PASS',checks,errors,limits:['Chrome emulation, not physical phone or Safari']},null,2));console.log(JSON.stringify({status:'PASS',stage,checks:checks.length,errors}));
})().catch(e=>{console.error(e);process.exit(1)});
