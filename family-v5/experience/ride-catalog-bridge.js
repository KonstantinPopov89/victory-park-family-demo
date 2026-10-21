/* Keep the catalogue position and its own selection model on a details round trip. */
(() => {
  'use strict';
  const version = document.body.dataset.rideVersion;
  const returnKey = `vp.rides.return.${version}`;
  const stateKey = version === 'v2' ? 'vp.catalog.v2.saved' : 'vp.integrated.v1';
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-ride-link]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const peers = [...document.querySelectorAll('a[data-ride-link]')].filter(a=>a.dataset.rideLink===link.dataset.rideLink);
    try { sessionStorage.setItem(returnKey, JSON.stringify({url:location.href,y:window.scrollY,id:link.dataset.rideLink,linkIndex:peers.indexOf(link)})); } catch {}
  });
  function restore(event) {
    try {
      if (event?.persisted) window.dispatchEvent(new StorageEvent('storage',{key:stateKey,newValue:localStorage.getItem(stateKey)}));
      const raw = sessionStorage.getItem(returnKey);
      if (!raw) return;
      const value = JSON.parse(raw);
      if (value.url !== location.href) return;
      sessionStorage.removeItem(returnKey);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const peers = [...document.querySelectorAll('a[data-ride-link]')].filter(a=>a.dataset.rideLink===value.id);
        const target = peers[value.linkIndex] || peers[0];
        if (target && target.getClientRects().length) {
          target.focus({preventScroll:true});
          window.scrollTo({top:value.y,behavior:'instant'});
        } else {
          const fallback = ['catalog-back-all','catalog-saved','catalog-all'].map(id=>document.getElementById(id)).find(el=>el && el.getClientRects().length);
          fallback?.focus({preventScroll:true});
          fallback?.scrollIntoView({block:'center',behavior:'instant'});
        }
      }));
    } catch {}
  }
  window.addEventListener('pageshow',restore);
})();
