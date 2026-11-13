/* Visual feedback only. Native clicks, scrolling and gesture ownership stay intact. */
(() => {
  'use strict';
  const controls = 'button,summary,[role="button"],[data-vp-cta],a.button,a.btn';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const timers = new WeakMap();
  let press = null;
  function clear() {
    if (press) press.element.removeAttribute('data-vp-pressed');
    press = null;
  }
  function control(target) {
    const element = target instanceof Element ? target.closest(controls) : null;
    if (!element || element.matches(':disabled,[aria-disabled="true"],[aria-busy="true"]') || element.closest('[inert]')) return null;
    return element;
  }
  document.addEventListener('pointerdown', event => {
    clear();
    if (!event.isPrimary || event.button !== 0) return;
    const element = control(event.target);
    if (!element) return;
    press = {element, id: event.pointerId, x: event.clientX, y: event.clientY};
    element.setAttribute('data-vp-pressed', '');
  }, {capture: true, passive: true});
  document.addEventListener('pointermove', event => {
    if (press && press.id === event.pointerId && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 10) clear();
  }, {capture: true, passive: true});
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture', 'scroll']) document.addEventListener(name, clear, {capture: true, passive: true});
  document.addEventListener('keydown', event => {
    if (event.repeat || ![' ', 'Enter'].includes(event.key)) return;
    const element = control(event.target);
    if (!element) return;
    clear(); press = {element}; element.setAttribute('data-vp-pressed', '');
  }, true);
  document.addEventListener('keyup', clear, true);
  document.addEventListener('focusout', event => { if (press?.element.contains(event.target)) clear(); }, true);
  window.addEventListener('blur', clear);
  window.addEventListener('pagehide', clear);
  document.addEventListener('visibilitychange', clear);
  reduced.addEventListener('change', clear);

  function changed(element, kind = 'choice') {
    if (!element || reduced.matches) return;
    const previous = timers.get(element);
    if (previous) { clearTimeout(previous.timer); element.classList.remove(previous.name); }
    const name = kind === 'total' ? 'vp-motion-total' : 'vp-motion-confirm';
    element.classList.add(name);
    const timer = setTimeout(() => { element.classList.remove(name); timers.delete(element); }, 320);
    timers.set(element, {timer, name});
  }
  window.VPMotion = Object.freeze({changed});
  // A native disclosure opens immediately. Only its content gets a short entrance.
  document.addEventListener('click', event => {
    const summary = event.target instanceof Element ? event.target.closest('summary') : null;
    const details = summary?.parentElement;
    if (!details || details.tagName !== 'DETAILS' || details.open || reduced.matches) return;
    details.classList.add('vp-motion-disclosure');
    setTimeout(() => details.classList.remove('vp-motion-disclosure'), 220);
  });
})();
