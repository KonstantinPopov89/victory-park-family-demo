/* Older promotion links keep their draft, then use the shared family cart. */
(function (root, factory) {
  'use strict';
  var api = factory(typeof module === 'object' && module.exports ? require('./offers-model.js') : root.VPO, typeof module === 'object' && module.exports ? require('../../family-storage.js') : root.VPFamilyStorage);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VPFamilyStorage.wait().then(ok=>{if(ok)api.start(root);});
}(typeof window !== 'undefined' ? window : null, function (M, storageBoundary) {
  'use strict';
  var selectionKeys = ['product', 'ride', 'qty', 'date', 'student'];
  function validSaved(saved) {
    const order=saved?.order;
    return saved?.version===M.VERSION && order && typeof order==='object' && !Array.isArray(order)
      && typeof order.productId==='string' && Object.hasOwn(M.products,order.productId)
      && Number.isInteger(order.quantity) && order.quantity>=1 && order.quantity<=M.MAX_QUANTITY
      && (order.offerId===null || typeof order.offerId==='string' && order.offerId.length<=64)
      && (order.rideId===null || typeof order.rideId==='string' && order.rideId.length<=80)
      && (order.visitDate===null || typeof order.visitDate==='string' && /^\d{4}-\d{2}-\d{2}$/.test(order.visitDate))
      && typeof order.studentAcknowledged==='boolean';
  }
  function selectedOffer(params, saved) {
    if (params.has('offer')) return params.get('offer') === 'none' ? null : params.get('offer');
    return validSaved(saved) ? saved.order.offerId : null;
  }
  function receiptMatches(params, saved) {
    if (!validSaved(saved) || !saved.receipt || !saved.receipt.result || saved.receipt.result.canCheckout !== true || !Array.isArray(saved.receipt.result.lines)) return false;
    if ((selectedOffer(params, saved) || null) !== (saved.order.offerId || null)) return false;
    var values = { product: saved.order.productId, ride: saved.order.rideId || '', qty: String(saved.order.quantity), date: saved.order.visitDate || '', student: saved.order.studentAcknowledged ? '1' : '0' };
    return selectionKeys.every(function (key) { return !params.has(key) || params.get(key) === values[key]; });
  }
  function destination(search, saved, hasMainCart) {
    var params = new URLSearchParams(search), offerId = selectedOffer(params, saved), offer = M.getOffer(offerId);
    if (receiptMatches(params, saved)) {
      var receiptQuery = new URLSearchParams({ offer: saved.order.offerId || 'none', product: saved.order.productId, ride: saved.order.rideId || '', qty: String(saved.order.quantity), date: saved.order.visitDate || '', student: saved.order.studentAcknowledged ? '1' : '0' });
      if (['ru', 'en', 'hy'].includes(params.get('lang'))) receiptQuery.set('lang', params.get('lang'));
      if(params.get('review')==='1')receiptQuery.set('review','1');
      return { receiptQuery: receiptQuery.toString() };
    }
    var view = offer && offer.kind === 'package' ? (offer.id === 'package5' ? 'package' : 'unlimited') : 'single';
    var query = new URLSearchParams({ offer: offerId || 'none', product: view });
    if (['ru', 'en', 'hy'].includes(params.get('lang'))) query.set('lang', params.get('lang'));
    if(params.get('review')==='1')query.set('review','1');
    var explicit = selectionKeys.some(function (key) { return params.has(key); });
    var draft = !explicit && !hasMainCart && validSaved(saved) ? saved.order : null;
    if (explicit || draft) {
      var product = explicit ? params.get('product') || (offer && offer.kind === 'package' ? offer.productIds[0] : 'ticket') : draft.productId;
      query.set('legacyProduct', product);
      query.set('legacyRide', explicit ? params.get('ride') || 'demo-calm' : draft.rideId || '');
      query.set('legacyQty', explicit ? params.get('qty') || '1' : String(draft.quantity));
      if (explicit ? params.has('date') : draft.visitDate) query.set('date', explicit ? params.get('date') : draft.visitDate);
      if (explicit ? params.has('student') : draft.studentAcknowledged) query.set('student', explicit ? params.get('student') : '1');
    }
    return { href: 'tickets.html?' + query.toString() + '#cart' };
  }
  function start(win) {
    var saved = null, hasMainCart = false;
    try { const raw=win.sessionStorage.getItem('vp.promotions.v1');if(typeof raw==='string'&&raw.length<=65536)saved=JSON.parse(raw); } catch (_) {}
    try {
      var state = storageBoundary.parseStrict(win.localStorage.getItem('vp.family.v6.people.v1'));
      hasMainCart = !!(state && state.cart && Array.isArray(state.cart.lines) && state.cart.lines.length);
    } catch (_) {}
    var result = destination(win.location.search, saved, hasMainCart);
    if (result.receiptQuery) {
      const url='offer-checkout.html?' + result.receiptQuery + '#receipt';
      win.history.replaceState(null, '', win.VPReleaseURL ? win.VPReleaseURL(url) : url);
      return;
    }
    win.VPO_REDIRECTING = true;
    win.location.replace(win.VPReleaseURL ? win.VPReleaseURL(result.href) : result.href);
  }
  return { destination: destination, receiptMatches: receiptMatches, start: start };
}));
