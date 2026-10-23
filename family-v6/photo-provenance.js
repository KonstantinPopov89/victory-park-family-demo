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
  var portraitRoot = '/victory-park-family-demo/family-v6/assets/photos-portrait/';
  var portraitNames = ['moto','tornado'];
  var focalPoints = {"koleso":50,"kobra":67.6,"autodrom":18,"gorki":56.4,"pendulum":88.4,"orbita":26,"lebedi":54.8,"pirat":42,"arbuz":50,"bashnya":50,"shary":50,"planeta":42,"cep":74,"raketa":58,"avtoralli":51.6,"mars":50,"syurpriz":46.8,"zamok":50,"vodnye-lebedi":56.4,"solnyshko":50,"begemot":34,"sloniki":70.8,"labirint-detskiy":75.6,"svetofor":56.4,"batuty":37.2,"poezd":85.2,"kapik":40.4,"labirint":50,"vr-cinema":93.2,"vr-2":26,"dark-vr":50,"tir":50,"avtomaty":22.8};
  function discovery(photo) { var name=slug(photo);return portraitNames.includes(name)?portraitRoot+name+'-780.webp':photo; }
  function discoverySrcset(photo) { var name=slug(photo);return portraitNames.includes(name)?[390,780,1440].map(function(w){return portraitRoot+name+'-'+w+'.webp '+w+'w';}).join(', '):srcset(photo); }
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
