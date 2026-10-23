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
  function url(slug, size) { return root+slug+'-'+(size||780)+'.webp'; }
  function slug(photo) { return String(photo||'').match(/photos-r17\/([a-z0-9-]+)-(?:390|780|1440)\.webp/)?.[1]; }
  function srcset(photo) { var name=slug(photo);return name?[390,780,1440].map(function(size){return url(name,size)+' '+size+'w';}).join(', '):''; }
  window.VPPhoto = Object.freeze({
    provenance:'ai-generated-demo', url:url, slug:slug, srcset:srcset,
    caption:function(){return captions[language()];}, note:function(){return notes[language()];}
  });
  function ready() {
    document.querySelectorAll('[data-vp-photo-provenance]').forEach(function(node){node.textContent=notes[language()];});
    document.querySelectorAll('[data-photo-note]').forEach(function(node){node.textContent=captions[language()];});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
}());
