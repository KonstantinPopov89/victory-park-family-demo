/* Display-only estimates. Daily CBA snapshot is published by GitHub Actions.
 * CBA quotes AMD per one foreign unit. Never change cart/order/payment values. */
(() => {
'use strict';
let rates = {schema_version:1,source:'CBA',quote:'AMD per 1 currency unit',date:'2026-11-12',RUB:4.3552,USD:360.51};
const dataURL = new URL('data/exchange-rates.json',document.currentScript.src);
const cacheKey = 'vp.currency.cba.v1';
const refreshInterval = 60*60*1000;
let lastCheck = 0, inFlight = false;
const lang = new URLSearchParams(location.search).get('lang') || document.documentElement.lang || 'ru';
const locale = lang.startsWith('en') ? 'en-US' : lang.startsWith('hy') ? 'hy-AM' : 'ru-RU';
const rub = new Intl.NumberFormat(locale, {maximumFractionDigits:0});
const usd = new Intl.NumberFormat(locale, {maximumFractionDigits:0});
const copy = lang.startsWith('en') ? {
 hint:date=>`Approximate RUB / USD equivalents. CBA rate, ${date}. Prices are in AMD.`,
 source:'Central Bank of Armenia', note:date=>`RUB / USD amounts are approximate, at the rate of ${date}. Rates are checked daily. Prices are in AMD. `
} : lang.startsWith('hy') ? {
 hint:date=>`Մոտավոր գումարներ RUB / USD-ով։ ՀՀ ԿԲ փոխարժեքը՝ ${date}։ Գները՝ ՀՀ դրամով։`,
 source:'ՀՀ կենտրոնական բանկ', note:date=>`RUB / USD գումարները մոտավոր են՝ ${date}-ի փոխարժեքով։ Փոխարժեքը ստուգվում է ամեն օր։ Գները՝ ՀՀ դրամով։ `
} : {
 hint:date=>`Примерно в рублях и долларах США. Курс ЦБ Армении на ${date}. Цены в драмах.`,
 source:'ЦБ Армении', note:date=>`Суммы в ₽ и $ ориентировочные, по курсу на ${date}. Курс проверяется ежедневно. Цены в драмах. `
};
function valid(value) {
 if(!value || value.schema_version!==1 || value.source!=='CBA' || value.quote!=='AMD per 1 currency unit') return false;
 if(typeof value.date!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) return false;
 const parsed = new Date(value.date+'T00:00:00Z');
 const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Yerevan',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 if(!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10)!==value.date || value.date>today || value.date<'2000-01-01') return false;
 return Number.isFinite(value.RUB) && value.RUB>=0.01 && value.RUB<=1000 && Number.isFinite(value.USD) && value.USD>=50 && value.USD<=3000;
}
function rateDate() { return new Intl.DateTimeFormat(locale,{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date(rates.date+'T00:00:00Z')); }
function hintText(amount) {
 const sign = amount<0 ? '−' : '';
 return '≈ '+sign+rub.format(Math.abs(amount)/rates.RUB)+' ₽ · '+sign+'$'+usd.format(Math.abs(amount)/rates.USD);
}
function updateHints() {
 document.querySelectorAll('.vp-currency-price').forEach(price=>{
  const hint = price.querySelector('.vp-currency-hint');
  if(hint) { hint.textContent=hintText(Number(price.dataset.amd)); hint.title=copy.hint(rateDate()); }
 });
 const label = document.querySelector('[data-vp-currency-note] [data-rate-note]');
 if(label) label.textContent=copy.note(rateDate());
}
function accept(value) {
 if(!valid(value) || value.date<rates.date) return false;
 rates={...value};
 updateHints();
 return true;
}
try { const cached=JSON.parse(localStorage.getItem(cacheKey)||'null'); if(valid(cached)&&cached.date>=rates.date) rates=cached; } catch {}
async function refresh() {
 if(inFlight) return;
 inFlight=true; lastCheck=Date.now();
 const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),8000);
 try {
  const response=await fetch(dataURL,{cache:'no-store',signal:controller.signal,credentials:'omit'});
  if(!response.ok) return;
  const value=await response.json();
  if(accept(value)) { try {localStorage.setItem(cacheKey,JSON.stringify(rates));} catch {} }
 } catch { /* Offline or invalid response: keep the last validated pair and date. */ }
 finally { clearTimeout(timeout); inFlight=false; }
}
// Only formatted AMD amounts in visible text; never form values, attributes,
// native options, scripts, editable content, or the underlying product model.
const excluded = 'script,style,noscript,textarea,select,option,svg,code,pre,[contenteditable],.vp-currency-price,[data-vp-currency-note]';
const pattern = /[-−]?\d+(?:[\s\u00a0\u202f,]\d{3})*(?:[.,]\d{1,2})?[\u0020\u00a0\u202f]*(?:֏|AMD\b)/g;
function decorate(node) {
 if(!node.parentElement || node.parentElement.closest(excluded)) return;
 const value = node.nodeValue;
 if(!value || (!value.includes('֏') && !value.includes('AMD'))) return;
 const matches = [...value.matchAll(pattern)];
 if(!matches.length) return;
 const fragment = document.createDocumentFragment();
 let cursor = 0;
 for(const match of matches) {
  const number = match[0].replace(/֏|AMD/g,'').trim().replace(/[\s\u00a0\u202f]/g,'').replace(/,(?=\d{3}(?:\D|$))/g,'').replace(',','.').replace('−','-');
  const amount = Number(number);
  if(!Number.isFinite(amount)) continue;
  fragment.append(value.slice(cursor,match.index));
  const price = document.createElement('span');
  price.className = 'vp-currency-price';
  price.dataset.amd = String(amount);
  const original = document.createElement('span');
  original.className = 'vp-currency-amd';
  original.textContent = match[0];
  const hint = document.createElement('small');
  hint.className = 'vp-currency-hint';
  hint.textContent = hintText(amount);
  hint.dataset.i18nSkip = '';
  hint.title = copy.hint(rateDate());
  price.append(original,hint);
  fragment.append(price);
  cursor = match.index+match[0].length;
 }
 if(cursor) { fragment.append(value.slice(cursor)); node.replaceWith(fragment); }
}
function scan(root) {
 if(root.nodeType===Node.TEXT_NODE) { decorate(root); return; }
 if(root.nodeType!==Node.ELEMENT_NODE || root.closest(excluded)) return;
 const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 const nodes = [];
 while(walker.nextNode()) nodes.push(walker.currentNode);
 nodes.forEach(decorate);
}
function start() {
 scan(document.body);
 const note = document.createElement('p');
 note.dataset.vpCurrencyNote = '';
 note.dataset.i18nSkip = '';
 note.className = 'vp-currency-note';
 const label=document.createElement('span');label.dataset.rateNote='';label.textContent=copy.note(rateDate());
 note.append(label);
 const link = document.createElement('a');
 link.href = 'https://www.cba.am/en/';
 link.textContent = copy.source;
 note.append(link);
 const footer = document.querySelector('footer');
 (footer || document.body).append(note);
 const pending = new Set();
 let scheduled = false;
 const observer = new MutationObserver(records => {
  for(const record of records) {
   if(record.target.parentElement?.closest(excluded)) continue;
   if(record.type==='characterData') pending.add(record.target);
   else record.addedNodes.forEach(node=>pending.add(node));
  }
  if(scheduled || !pending.size) return;
  scheduled = true;
  requestAnimationFrame(()=>{
   scheduled = false;
   const roots = [...pending]; pending.clear();
   roots.forEach(root=>{if(root.isConnected) scan(root);});
  });
 });
 observer.observe(document.body,{childList:true,subtree:true,characterData:true});
 refresh();
 // An open tab refreshes too; the CBA is contacted only by the daily server job.
 setInterval(refresh,refreshInterval);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden && Date.now()-lastCheck>=refreshInterval) refresh();});
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
