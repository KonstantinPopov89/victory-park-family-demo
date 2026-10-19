/* Older promotion links keep their draft, then use the shared family cart. */
(function (root, factory) {
  'use strict';
  var api = factory(typeof module === 'object' && module.exports ? require('./offers-model.js') : root.VPO);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else api.start(root);
}(typeof window !== 'undefined' ? window : null, function (M) {
  'use strict';
  var selectionKeys = ['product', 'ride', 'qty', 'date', 'student'];
  function validSaved(saved) {
    return saved && saved.version === M.VERSION && saved.order && M.products[saved.order.productId] && Number.isInteger(saved.order.quantity) && saved.order.quantity >= 1 && saved.order.quantity <= M.MAX_QUANTITY;
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
      return { receiptQuery: receiptQuery.toString() };
    }
    var view = offer && offer.kind === 'package' ? (offer.id === 'package5' ? 'package' : 'unlimited') : 'single';
    var query = new URLSearchParams({ offer: offerId || 'none', product: view });
    if (['ru', 'en', 'hy'].includes(params.get('lang'))) query.set('lang', params.get('lang'));
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
    try { saved = JSON.parse(win.sessionStorage.getItem('vp.promotions.v1')); } catch (_) {}
    try {
      var state = JSON.parse(win.localStorage.getItem('vp.family.v3'));
      hasMainCart = !!(state && state.cart && Array.isArray(state.cart.lines) && state.cart.lines.length);
    } catch (_) {}
    var result = destination(win.location.search, saved, hasMainCart);
    if (result.receiptQuery) {
      win.history.replaceState(null, '', 'offer-checkout.html?' + result.receiptQuery + '#receipt');
      return;
    }
    win.VPO_REDIRECTING = true;
    win.location.replace(result.href);
  }
  return { destination: destination, receiptMatches: receiptMatches, start: start };
}));
