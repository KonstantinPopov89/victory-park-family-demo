/* Keep navigation from a fresh release away from HTML cached by an older one. */
(()=>{'use strict';
 const release=/* vp-release:start */"21"/* vp-release:end */;
 const base=new URL('.',document.currentScript.src).pathname;
 function releaseURL(input){
  const value=String(input);
  if(!value||value.startsWith('#'))return value;
  let url;try{url=new URL(value,document.baseURI);}catch{return value;}
  if(url.origin!==location.origin||!url.pathname.startsWith(base)||
     !(url.pathname.endsWith('/')||url.pathname.endsWith('.html')))return value;
  url.searchParams.set('vp_release',release);
  // Retain relative hrefs: existing controls intentionally inspect their path.
  if(/^[a-z][a-z0-9+.-]*:/i.test(value)||value.startsWith('//'))return url.href;
  return value.split(/[?#]/,1)[0]+url.search+url.hash;
 }
 window.VPReleaseURL=releaseURL;
 const current=releaseURL(location.href);
 if(current!==location.href)history.replaceState(history.state,'',current);
 function stamp(anchor){
  if(anchor.hasAttribute('download'))return;
  const before=anchor.getAttribute('href');if(before===null)return;
  const after=releaseURL(before);if(after!==before)anchor.setAttribute('href',after);
 }
 function scan(node){
  if(node.nodeType!==1)return;
  if(node.matches('a[href]'))stamp(node);
  node.querySelectorAll('a[href]').forEach(stamp);
 }
 for(const type of ['click','auxclick','contextmenu'])document.addEventListener(type,event=>{
  const anchor=event.target.closest?.('a[href]');if(anchor)stamp(anchor);
 },true);
 new MutationObserver(changes=>{
  for(const change of changes){
   if(change.type==='attributes'){if(change.target.matches('a[href]'))stamp(change.target);}
   else change.addedNodes.forEach(scan);
  }
 }).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});
 scan(document.documentElement);
})();
