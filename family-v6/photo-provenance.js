/* Shared provenance for every r17 photo. Catalogue identities and terms remain independent. */
(function () {
  'use strict';
  var root = '/victory-park-family-demo/family-v6/assets/photos-r17/';
  var notes = {
    ru: 'Изображения созданы с помощью ИИ для демо и могут отличаться от реальных аттракционов парка.',
    en: 'Images are AI-generated for this demo and may differ from the actual park rides.',
    hy: 'Պատկերները ստեղծված են ԱԲ-ով այս ցուցադրության համար և կարող են տարբերվել այգու իրական ատրակցիոններից։'
  };
  var captions = {ru:'Изображение для демо · ИИ',en:'Demo image · AI',hy:'Ցուցադրական պատկեր · ԱԲ'};
  function language() {
    var query = new URLSearchParams(location.search).get('lang');
    var path = location.pathname.match(/\/(ru|en|hy)(?:\/|$)/);
    var saved = 'ru'; try { saved=localStorage.getItem('vpLang')||'ru'; } catch (_) {}
    var lang = query || (path && path[1]) || saved;
    return notes[lang] ? lang : 'ru';
  }
  function url(slug, size) { return root+slug+'-'+(size||780)+'.webp?vpimg=49'; }
  function slug(photo) { return String(photo||'').match(/photos-r17\/([a-z0-9-]+)-(?:390|780|1440)\.webp/)?.[1]; }
  function srcset(photo) { var name=slug(photo);return name?[390,780,1440].map(function(size){return url(name,size)+' '+size+'w';}).join(', '):''; }
  var portraitRoot = '/victory-park-family-demo/family-v6/assets/photos-portrait/';
  var portraitNames = ['moto','tornado'];
  var focalPoints = {"arbuz":49,"autodrom":29,"avtomaty":54,"avtoralli":33,"bashnya":48,"batuty":35,"begemot":17,"carousel":37,"cep":40,"dark-vr":50,"dino":87,"events":52,"food":53,"gorki":50,"kapik":66,"kobra":52,"koleso":53,"labirint":42,"labirint-detskiy":74,"lebedi":56,"mars":48,"moto":52,"orbita":47,"park-overview":45,"pendulum":41,"pirat":57,"planeta":63,"poezd":25,"raketa":51,"shary":46,"sloniki":63,"solnyshko":51,"svetofor":53,"syurpriz":52,"teacups":51,"tir":50,"tornado":52,"vodnye-lebedi":40,"vr-2":30,"vr-cinema":62,"zamok":38,"zoo":77};
  function discovery(photo) { var name=slug(photo);return portraitNames.includes(name)?portraitRoot+name+'-780.webp?vpimg=49':photo; }
  function discoverySrcset(photo) { var name=slug(photo);return portraitNames.includes(name)?[390,780,1440].map(function(w){return portraitRoot+name+'-'+w+'.webp?vpimg=49 '+w+'w';}).join(', '):srcset(photo); }
  function focal(photo) { var name=slug(photo);return (focalPoints[name]??50)+'% 50%'; }
  window.VPPhoto = Object.freeze({
    provenance:'ai-generated-demo', url:url, slug:slug, srcset:srcset, discovery:discovery, discoverySrcset:discoverySrcset, focal:focal,
    caption:function(){return captions[language()];}, note:function(){return notes[language()];}
  });
  function ready() {
    document.querySelectorAll('[data-vp-photo-provenance]').forEach(function(node){node.textContent=notes[language()];});
    document.querySelectorAll('[data-photo-note]').forEach(function(node){node.textContent=captions[language()];});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
}());

/* A guest can react to the same scene wherever it appears in the prototype. */
(function () {
  'use strict';
  const labels = {
    ru: ['Реакция на фото', 'Нравится', 'Огонь', 'Бриллиант'],
    en: ['React to photo', 'Love it', 'Fire', 'A gem'],
    hy: ['Արձագանքել լուսանկարին', 'Հավանում եմ', 'Կրակ', 'Գոհար']
  };
  const choices = [['heart', '❤️'], ['fire', '🔥'], ['gem', '💎']];
  const prefix = 'vp.family.v6.photo-reaction.';
  const memory = new Map();
  const frames = new Map();
  let sequence = 0, pending = 0;

  function words() {
    const path = location.pathname.match(/\/(ru|en|hy)\//);
    return labels[new URLSearchParams(location.search).get('lang')] ||
      labels[path?.[1]] || labels[document.documentElement.lang] || labels.ru;
  }
  function scene(img) {
    const src = img.dataset.lz || img.getAttribute('src') || img.getAttribute('poster') || '';
    if (img.matches('video[data-home-video]')) return 'hero-visitors';
    return src.match(/\/photos-(?:r\d+|portrait)\/([a-z0-9-]+)-(?:390|780|1440)\.webp(?:[?#]|$)/)?.[1];
  }
  function selected(key) {
    if (memory.has(key)) return memory.get(key);
    try { return localStorage.getItem(prefix + key) || ''; } catch { return ''; }
  }
  function update(group) {
    const key = group.dataset.photoReactions;
    const value = selected(key);
    for (const button of group.querySelectorAll('[data-mood]')) {
      button.setAttribute('aria-pressed', String(button.dataset.mood === value));
    }
    const trigger = group.firstElementChild;
    trigger.textContent = choices.find(choice => choice[0] === value)?.[1] || '☺';
    trigger.classList.toggle('vp-reaction-chosen', Boolean(value));
  }
  function respond(group, mood) {
    const key = group.dataset.photoReactions;
    const next = selected(key) === mood ? '' : mood;
    try {
      if (next) localStorage.setItem(prefix + key, next);
      else localStorage.removeItem(prefix + key);
      memory.delete(key);
    } catch { memory.set(key, next); }
    for (const item of frames.values()) {
      if (item.group.dataset.photoReactions === key) update(item.group);
    }
  }
  function closePalette(group, focus) {
    const palette = group.lastElementChild;
    if (palette.matches(':popover-open')) palette.hidePopover();
    group.firstElementChild.setAttribute('aria-expanded', 'false');
    if (focus) group.firstElementChild.focus({preventScroll: true});
  }
  function makeGroup(img, key) {
    const copy = words();
    const name = img.alt || img.closest('article')?.querySelector('h2,h3')?.textContent;
    const label = name ? copy[0] + ' · ' + name : copy[0];
    const group = document.createElement('div');
    group.className = 'vp-photo-reactions';
    group.dataset.photoReactions = key;
    group.dataset.i18nSkip = '';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', label);
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'vp-reaction-trigger';
    trigger.title = label;
    trigger.setAttribute('aria-label', label);
    const palette = document.createElement('div');
    palette.className = 'vp-reaction-palette';
    palette.id = 'vp-photo-reactions-' + (++sequence);
    trigger.setAttribute('aria-controls', palette.id);
    choices.forEach(([id, icon], index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.mood = id;
      button.textContent = icon;
      button.title = copy[index + 1];
      button.setAttribute('aria-label', copy[index + 1]);
      palette.append(button);
    });
    // A reaction and a swipe/save/open are separate interactions.
    for (const type of ['pointerdown','pointerup','touchstart','touchend','dblclick','keydown','keyup']) {
      group.addEventListener(type, event => event.stopPropagation());
    }
    trigger.addEventListener('click', () => {
      if (palette.matches(':popover-open')) { closePalette(group, false); return; }
      const box = trigger.getBoundingClientRect();
      palette.style.left = Math.max(4, Math.min(box.left, document.documentElement.clientWidth - 148)) + 'px';
      palette.style.top = (box.bottom + 52 <= window.innerHeight ? box.bottom + 3 : Math.max(3, box.top - 46)) + 'px';
      palette.showPopover();
      trigger.setAttribute('aria-expanded', 'true');
      const first = palette.querySelector('[aria-pressed="true"]') || palette.firstElementChild;
      first.focus({preventScroll: true});
    });
    palette.addEventListener('toggle', () => {
      if (palette.hasAttribute('popover')) trigger.setAttribute('aria-expanded', String(palette.matches(':popover-open')));
    });
    group.addEventListener('click', event => {
      event.stopPropagation();
      const button = event.target.closest('[data-mood]');
      if (!button) return;
      respond(group, button.dataset.mood);
      if (group.hasAttribute('data-compact')) closePalette(group, true);
    });
    group.append(trigger, palette);
    update(group);
    return group;
  }
  function attach(img) {
    const key = scene(img);
    const old = frames.get(img);
    if (old && old.group.dataset.photoReactions === key && old.group.isConnected) return;
    if (old) { old.group.remove(); frames.delete(img); }
    if (!key || img.closest('noscript')) return;
    // Keep the controls outside links, disclosure summaries and gallery buttons.
    const interactive = img.closest('a,button,summary,label');
    let host = interactive ? interactive.parentElement : (img.closest('picture') || img).parentElement;
    if (interactive?.matches('summary') && host.matches('details')) host = host.parentElement;
    if (getComputedStyle(host).position === 'static') host.classList.add('vp-reaction-host');
    const group = makeGroup(img, key);
    host.append(group);
    frames.set(img, {host, group});
    sizes.observe(img);
    sizes.observe(host);
  }
  function place() {
    pending = 0;
    for (const [img, {host, group}] of frames) {
      if (!img.isConnected || !group.isConnected) {
        sizes.unobserve(img);
        group.remove();
        frames.delete(img);
        continue;
      }
      const box = img.getBoundingClientRect();
      group.hidden = !box.width || !box.height || img.hidden;
      if (group.hidden) continue;
      const compact = box.width < 154 || box.height < 70;
      const palette = group.lastElementChild;
      if (compact !== group.hasAttribute('data-compact')) {
        if (!compact) closePalette(group, false);
        group.toggleAttribute('data-compact', compact);
        palette.toggleAttribute('popover', compact);
        group.firstElementChild.setAttribute('aria-expanded', 'false');
      }
      const parent = host.getBoundingClientRect();
      const inset = compact ? 2 : 8;
      let y = Math.max(0, box.height - group.offsetHeight - inset);
      if (img.closest('.plans-picture,.home-media,.photo-break,.photo-main,.photo-small,.tile,.experience,.ride-media,.card[data-card]')) y = inset;
      if (img.closest('.r-photo,.sp-photo')) y = Math.max(inset, box.height * 0.43);
      group.style.left = Math.round(box.left - parent.left - host.clientLeft + host.scrollLeft + inset) + 'px';
      group.style.top = Math.round(box.top - parent.top - host.clientTop + host.scrollTop + y) + 'px';
    }
  }
  function schedule() {
    if (!pending) pending = requestAnimationFrame(place);
  }
  function scan(node) {
    if (node.nodeType !== 1) return;
    if (node.matches('img,video[data-home-video]')) attach(node);
    for (const img of node.querySelectorAll('img,video[data-home-video]')) attach(img);
  }
  const sizes = new ResizeObserver(schedule);
  function boot() {
    scan(document.body);
    new MutationObserver(changes => {
      let changed = false;
      for (const change of changes) {
        if (change.target.closest?.('.vp-photo-reactions')) continue;
        if (change.type === 'attributes') {
          if (change.target.matches('img')) attach(change.target);
          changed = true;
        } else {
          for (const node of change.addedNodes) scan(node);
          if (change.addedNodes.length || change.removedNodes.length) changed = true;
        }
      }
      if (changed) schedule();
    }).observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['src','data-lz','hidden','open']});
    window.addEventListener('storage', event => {
      if (event.key === null || event.key.startsWith(prefix)) {
        for (const item of frames.values()) update(item.group);
      }
    });
    window.addEventListener('resize', schedule);
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
