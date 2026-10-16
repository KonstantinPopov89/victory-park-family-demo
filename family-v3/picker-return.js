/* Opt-in routing for a checkout opened from Reels. Ordinary Tinder routes are unchanged. */
(function () {
  'use strict';
  if (new URLSearchParams(location.search).get('picker') !== 'reels') return;
  function update() {
    document.querySelectorAll('a[href]').forEach(function (a) {
      const u = new URL(a.getAttribute('href'), location.href);
      if(u.origin !== location.origin) return;
      const file=u.pathname.split('/').pop();
      if(file==='attractions.html') {
        u.pathname=u.pathname.replace(/attractions\.html$/, 'reels.html');
        u.searchParams.delete('view');
        u.hash=u.hash==='#family'?'#family':'#list';
        a.href=u.pathname+u.search+u.hash;
      } else if(['tickets.html','company.html','offer-checkout.html'].includes(file) && u.searchParams.get('picker')!=='reels') {
        u.searchParams.set('picker','reels'); a.href=u.pathname+u.search+u.hash;
      }
    });
  }
  update(); new MutationObserver(update).observe(document.body,{childList:true,subtree:true});
}());
