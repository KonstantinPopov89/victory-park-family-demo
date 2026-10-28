/* Purchase links return to the single discovery screen without changing selections. */
(function () {
  'use strict';
  if (!['reels', 'swipe'].includes(new URLSearchParams(location.search).get('picker'))) return;
  function update() {
    document.querySelectorAll('a[href]').forEach(function (a) {
      const u = new URL(a.getAttribute('href'), location.href);
      if(u.origin !== location.origin) return;
      const file=u.pathname.split('/').pop();
      if(file==='attractions.html' || file==='reels.html') {
        u.pathname=u.pathname.replace(/attractions\.html$/, 'reels.html');
        u.searchParams.delete('view');
        u.hash=u.hash==='#family'?'#family':u.hash==='#plan'||u.hash==='#list'?'#list':u.hash;
        a.href=u.pathname+u.search+u.hash;
      } else if(['tickets.html','quick.html','company.html','offer-checkout.html'].includes(file) && u.searchParams.get('picker')!=='reels') {
        u.searchParams.set('picker','reels'); a.href=u.pathname+u.search+u.hash;
      }
    });
  }
  update(); new MutationObserver(update).observe(document.body,{childList:true,subtree:true});
}());
