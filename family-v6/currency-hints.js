/* Display-only currency estimates. Source: https://www.cba.am/en/ (2026-11-12).
 * CBA quotes AMD per one foreign unit. Never change cart/order/payment values.
 * Update both dated rates together when refreshing this reference snapshot. */
(() => {
'use strict';
const rates = Object.freeze({date:'2026-11-12', RUB:4.3552, USD:360.51});
const lang = new URLSearchParams(location.search).get('lang') || document.documentElement.lang || 'ru';
const locale = lang.startsWith('en') ? 'en-US' : lang.startsWith('hy') ? 'hy-AM' : 'ru-RU';
const rub = new Intl.NumberFormat(locale, {maximumFractionDigits:0});
const usd = new Intl.NumberFormat(locale, {maximumFractionDigits:0});
const copy = lang.startsWith('en') ? {
 hint:'Approximate RUB / USD equivalents. CBA rate, 12 Nov 2026. Prices are in AMD.',
 source:'Central Bank of Armenia', note:'RUB / USD amounts are approximate, at the rate of 12 Nov 2026. Prices are in AMD. '
} : lang.startsWith('hy') ? {
 hint:'Մոտավոր գումարներ RUB / USD-ով։ ՀՀ ԿԲ փոխարժեքը՝ 12.11.2026։ Գները՝ ՀՀ դրամով։',
 source:'ՀՀ կենտրոնական բանկ', note:'RUB / USD գումարները մոտավոր են՝ 12.11.2026-ի փոխարժեքով։ Գները՝ ՀՀ դրամով։ '
} : {
 hint:'Примерно в рублях и долларах США. Курс ЦБ Армении на 12.11.2026. Цены в драмах.',
 source:'ЦБ Армении', note:'Суммы в ₽ и $ ориентировочные, по курсу на 12.11.2026. Цены в драмах. '
};
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
  const sign = amount < 0 ? '−' : '';
  hint.textContent = '≈ '+sign+rub.format(Math.abs(amount)/rates.RUB)+' ₽ · '+sign+'$'+usd.format(Math.abs(amount)/rates.USD);
  hint.dataset.i18nSkip = '';
  hint.title = copy.hint;
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
 note.append(copy.note);
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
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
