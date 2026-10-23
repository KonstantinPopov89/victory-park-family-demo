/* Парк Победы, прототип T34, проход 2. Подбор и статусы: SCR-02 (итог), SCR-14, SCR-40, SCR-41, SCR-42, SCR-43 (модули M01–M12). */
(function () {
  "use strict";
  var C = window.VPCORE, D = document, VP = window.VP, W = window;
  if (!C || !VP) return;
  var L = C.lang(), R = C.root(), SCR = C.screen(), q = C.qs(), A = VP.attr, BY = {};
  var REVIEW = q.get("review") === "1";
  A.forEach(function (a) { BY[a.slug] = a; });
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function h(k, v) {
    var e = VP.str[k] || [k, 0], t = e[0];
    if (v) for (var x in v) t = t.split("{" + x + "}").join(v[x]);
    t = esc(t);
    if (e[1] === 1) return '<span class="tr" title="нужен перевод клиента">' + t + "</span>";
    if (e[1] === 2) return '<span class="tr" lang="ru" title="нужен перевод клиента">' + t + "</span>";
    return t;
  }
  /* PR-1-13: русское название на hy/en размечено lang="ru" и пунктиром черновика */
  function nm(a) { var t = esc(a.name); return a.nl ? '<span class="tr" lang="ru" title="нужен перевод клиента">' + t + "</span>" : t; }
  var CICON = function (c) { return '<svg aria-hidden="true" focusable="false"><use href="#i-c-' + c + '"/></svg>'; };
  function noph(a, kind) { return '<span class="noph ' + kind + '" role="img" aria-label="' + esc(VP.str.need_shoot[0]) + '">' + CICON(a.cat) + "<b>" + h(CAT[a.cat]) + "</b><small>" + h("need_shoot") + "</small></span>"; }
  function band(i) { var t = esc(VP.bands[i]); return VP.bandDraft ? '<span class="tr">' + t + "</span>" : t; }
  function amd(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ֏"; }
  var ALERT = '<svg aria-hidden="true" focusable="false"><use href="#i-alert"/></svg>';
  function unc(k) { return '<span class="unc">' + ALERT + "<span>" + h(k || "unc") + "</span></span>"; }
  function url(slug, qq) { return R + L + "/" + (slug ? slug + "/" : "") + "index.html" + (qq || ""); }
  function hhmm(d) { var p = function (n) { return (n < 10 ? "0" : "") + n; }; return p(d.getHours()) + ":" + p(d.getMinutes()); }

  /* ---------- статусы (демо, D-MOD05) ---------- */
  var NOW = new Date(), OFF_T = hhmm(new Date(NOW.getTime() - 47 * 60000));
  function status(slug) {
    if (!REVIEW) return "unk";
    var sc = C.opt("vpStatus");
    if (sc === "season") return "season";
    var du = window.VPDUTY && window.VPDUTY.get(slug); /* перенос M05 из A: ручной статус дежурного главнее демо */
    if (du) return du.st;
    if (sc === "all") return "on"; if (sc === "stale") return "unk"; if (sc === "season") return "season";
    return VP.off.indexOf(slug) >= 0 ? "off" : "on";
  }
  function excNote(slug) {
    if (!REVIEW) return "";
    var du = window.VPDUTY && window.VPDUTY.get(slug);
    if (du && du.src === "manual") return " " + h("duty_note", { r: du.reason, t: VPDUTY.hhmm(du.at), u: VPDUTY.hhmm(du.exp) });
    if (du) return " " + h("duty_exp");
    return status(slug) === "off" ? " " + h("since", { t: OFF_T }) : "";
  }
  var ST = { on: "st_on", off: "st_off", unk: "st_unk", season: "st_season" };
  function stHtml(slug) { var x = status(slug); return '<span class="st ' + x + '"><i></i><span>' + h(ST[x]) + "</span></span>"; }
  function applyStatus() {
    var els = D.querySelectorAll("[data-status]");
    for (var i = 0; i < els.length; i++) { var sl = els[i].getAttribute("data-status"), x = status(sl); els[i].className = "st " + x; els[i].querySelector("span").innerHTML = h(ST[x]); }
    var on = A.filter(function (a) { return status(a.slug) === "on"; }).length;
    var sum = D.querySelectorAll("[data-status-sum]"); for (var j = 0; j < sum.length; j++) sum[j].textContent = REVIEW ? on + "/" + A.length : VP.str.st_unk[0];
    var ns = D.querySelector("[data-now-sum]");
    if (ns) {
      ns.innerHTML = REVIEW ? h("works_of", { n: on, m: A.length, t: hhmm(window.VPDUTY ? new Date(VPDUTY.now()) : NOW) }) : h("st_unk");
      var ex = A.filter(function (a) { return status(a.slug) !== "on"; });
      var exb = D.querySelector("[data-now-exc]");
      exb.innerHTML = ex.length && ex.length < A.length ? "<ul>" + ex.map(function (a) { return '<li><a href="' + url("attractions/" + a.slug) + '">' + nm(a) + "</a>: " + stHtml(a.slug) + excNote(a.slug) + "</li>"; }).join("") + "</ul>" : "";
      var ch = D.querySelector("[data-now-chips]");
      ch.innerHTML = A.map(function (a) { return '<li><a href="' + url("attractions/" + a.slug) + '" data-attr="' + a.slug + '" data-src="now"><span>' + nm(a) + "</span>" + stHtml(a.slug) + "</a></li>"; }).join("");
    }
  }
  D.querySelectorAll("[data-guest-status-heading]").forEach(function (el) { el.hidden = REVIEW; });
  applyStatus();
  D.addEventListener("vp:opt", function (e) { applyStatus(); if (e.detail === "vpStatus" && SCR === "SCR-42") renderPlan(); if (e.detail === "vpPack" && SCR === "SCR-41") deckInit(); if (e.detail === "vpEscort" && SCR === "SCR-42") renderPlan(); });

  D.addEventListener("vp:interests", function(e){
    side();
    if(SCR === "SCR-42") renderPlan();
    if(SCR === "SCR-41"){
      if(e.detail && (e.detail.reason === 'external' || e.detail.reason === 'pageshow')) history_=[];
      [].forEach.call(D.querySelectorAll('[data-heart]'),function(t){var on=inList(t.getAttribute('data-heart'));t.setAttribute('aria-pressed',String(on));t.innerHTML='<svg aria-hidden="true"><use href="#i-heart"/></svg>'+h(on?'in_list_done':'in_list');});
      count();
    }
  });

  /* ---------- список и состав ---------- */
  function list() { return C.list(); }
  function inList(s) { return list().indexOf(s) >= 0; }
  function side() {
    var ul = D.querySelector("[data-dk-list]"); if (!ul) return;
    var chosen = list().map(function (slug) { return BY[slug]; }).filter(Boolean);
    ul.innerHTML = chosen.length ? chosen.map(function (a) { return '<li>' + (a.img ? '<img src="' + R + 'assets/img/' + a.img + '-43-390.webp" width="72" height="54" alt="" loading="lazy">' : '') + '<a href="' + url('attractions/' + a.slug) + '">' + nm(a) + '</a></li>'; }).join('') : '<li class="unified-list-empty">' + h('list_preview_empty') + '</li>';
  }

  function add(s, src) { var l = list(); if (l.indexOf(s) < 0) { l.push(s); C.setList(l); } C.log("deck_add", { slug: s, source: src || "", list_n: l.length }); }
  function remove(s) { var l = list().filter(function (x) { return x !== s; }); C.setList(l); }
  function party() { return C.jget(C.LS(), "vpParty", { adults: 1, kids: [] }); }
  function saveParty(p) { C.jset(C.LS(), "vpParty", p); }
  function fit(a, b, withAdult) {
    if (b === null || b === undefined) return null;
    if (a.cls === "D") return b >= a.alone ? "alone" : null;
    if (a.alone !== null && b >= a.alone) return "alone";
    if (withAdult && a.adult !== null && a.adult !== undefined && b >= a.adult) return "adult";
    return null;
  }
  function flags(a) {
    var f = "";
    if (a.cls === "B") f += '<span class="flag">' + h("only_adult") + "</span>";
    if (a.cls === "D") f += '<span class="flag">' + h("only_kids") + "</span>";
    return f + '<span class="flag d">' + h(a.unl ? "unl_in" : "unl_out") + "</span>";
  }
  var CAT = { extreme: "cat_extreme", family: "cat_family", kids: "cat_kids", games: "cat_games" };
  function catalogueFilter() {
    var params = new URLSearchParams(location.search), value = params.get("cat");
    return Object.prototype.hasOwnProperty.call(CAT, value) || value === "unl" ? value : (params.get("filter") === "unl" ? "unl" : "");
  }

  /* ---------- SCR-14 ---------- */
  if (SCR === "SCR-14") {
    var cat = "";
    var fb = D.querySelectorAll("[data-filter]");
    function filterURL(c) {
      var current = new URL(location.href);
      current.searchParams.delete("cat"); current.searchParams.delete("filter");
      if (c) current.searchParams.set(c === "unl" ? "filter" : "cat", c);
      history.replaceState(history.state, "", current.pathname + current.search + current.hash);
    }
    function filt(c, updateURL) {
      cat = c;
      if (updateURL) filterURL(c);
      [].forEach.call(fb, function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-filter") === c)); });
      var li = D.querySelectorAll("[data-catalog] > li");
      [].forEach.call(li, function (x) { x.hidden = !(!c || (c === "unl" ? x.getAttribute("data-unl") === "1" : x.getAttribute("data-cat") === c)); });
      // Keep language links usable with a normal click or opening in a new tab.
      [].forEach.call(D.querySelectorAll("a[data-vp-lang],a[data-lang-link]"), function (a) {
        var target = new URL(a.href, location.href);
        if (target.origin !== location.origin) return;
        target.search = location.search; target.hash = location.hash;
        a.href = target.href;
      });
      D.dispatchEvent(new CustomEvent("vp:catalog-filter"));
    }
    [].forEach.call(fb, function (b) { b.addEventListener("click", function () { filt(b.getAttribute("data-filter"), true); C.log("cta_click", { cta: "filter-" + (b.getAttribute("data-filter") || "all") }); }); });
    function restoreFilter() { filt(catalogueFilter()); }
    W.addEventListener("popstate", restoreFilter);
    W.addEventListener("pageshow", restoreFilter);
    restoreFilter();
    if (location.hash === "#now") C.log("status_view", { source: "home_link" });
    var ml = D.querySelectorAll("[data-mode-link]");
    [].forEach.call(ml, function (m) { m.addEventListener("click", function () { var to = m.getAttribute("data-mode-link"); C.set(C.LS(), "vpDeckMode", to); C.log("deck_mode_switch", { from: "list", to: to }); m.href += (m.href.indexOf("?") >= 0 ? "&" : "?") + "from=catalog"; }); });
  }

  /* ---------- SCR-43 ---------- */
  if (SCR === "SCR-43") {
    var slug = D.body.getAttribute("data-slug").split("/")[1], ab = D.querySelector("[data-add]");
    var srcp = /\/pick\//.test(D.referrer) ? "deck" : /\/plan\//.test(D.referrer) ? "plan" : /attractions\/index/.test(D.referrer) ? "catalog" : "link";
    C.log("attraction_view", { slug: slug, source: srcp });
    function ab_upd() { if (inList(slug)) { ab.innerHTML = h("to_sum"); ab.setAttribute("data-in", "1"); } else { ab.innerHTML = h("in_list"); ab.removeAttribute("data-in"); } }
    ab.addEventListener("click", function () { if (ab.getAttribute("data-in")) { location.href = url("plan"); } else { add(slug, "attraction"); ab_upd(); } });
    ab_upd();
    D.addEventListener("vp:interests", ab_upd);
    var bk = D.querySelector("[data-back]"); if (bk && !catalogueFilter() && D.referrer && D.referrer.indexOf(location.host) >= 0 && history.length > 1) bk.addEventListener("click", function (e) { e.preventDefault(); history.back(); });
  }

  /* ---------- SCR-40 ---------- */
  if (SCR === "SCR-40") {
    var P = party(), age = q.get("age");
    if (age !== null && age !== "") { P = { adults: 1, kids: [+age] }; saveParty(P); }
    C.log("pick_open", { source: age !== null && age !== "" ? "home_age" : (/\/links\//.test(D.referrer) ? "landing" : /index\.html$|\/(hy|ru|en)\/?$/.test(D.referrer) ? "home_link" : "menu") });
    var kidsBox = D.querySelector("[data-kids]"), res = D.querySelector("[data-result]"), err = D.querySelector("[data-party-err]"), cta = D.querySelector("[data-pick-cta]"), wa = D.querySelector("[data-with-adult]");
    function render() {
      D.querySelector("[data-adults-out]").textContent = P.adults;
      kidsBox.innerHTML = P.kids.map(function (b, i) {
        var chips = VP.bands.map(function (x, j) { return '<button type="button" class="chip" data-test="kid' + i + '-band' + j + '" data-kid="' + i + '" data-band="' + j + '" aria-pressed="' + (b === j) + '">' + band(j) + "</button>"; }).join("");
        return '<div class="kid' + (b === null ? " need" : "") + '" role="group" aria-label="' + esc(VP.str.kid[0].replace("{i}", i + 1)) + '"><div style="display:flex;justify-content:space-between;align-items:center"><b>' + h("kid", { i: i + 1 }) + "</b> <span class=\"src\">" + h("age_now") + '</span><button type="button" class="link" style="border:0;background:none;color:#D80B8C;cursor:pointer" data-rm="' + i + '">' + h("remove") + '</button></div><div class="ages" style="display:flex;flex-wrap:wrap;gap:6px">' + chips + "</div></div>";
      }).join("") || '<p class="src">' + h("add_kid_hint") + "</p>";
      err.innerHTML = "";
      if (P.kids.length && P.adults < 1) { err.innerHTML = ALERT + "<span>" + h("need_adult") + "</span>"; res.innerHTML = ""; cta.hidden = true; return; }
      var aged = P.kids.filter(function (b) { return b !== null; });
      if (!aged.length) { res.innerHTML = P.kids.length ? '<p class="err">' + ALERT + "<span>" + h("kid_no_age") + "</span></p>" : ""; cta.hidden = true; return; }
      var withA = wa.checked, all = [], some = [];
      A.forEach(function (a) {
        var who = P.kids.map(function (b, i) { return fit(a, b, withA) ? i : -1; }).filter(function (i) { return i >= 0; });
        if (!who.length) return;
        (who.length === aged.length ? all : some).push({ a: a, who: who });
      });
      function rows(arr) {
        var byc = {};
        arr.forEach(function (x) { (byc[x.a.cat] = byc[x.a.cat] || []).push(x); });
        return ["kids", "family", "extreme", "games"].filter(function (c) { return byc[c]; }).map(function (c) {
          return '<div class="res-group"><h3 class="disp">' + h(CAT[c]) + "</h3>" + byc[c].map(function (x) {
            var a = x.a;
            return '<a class="res-row" data-test="pick-row" href="' + url("attractions/" + a.slug) + '" data-attr="' + a.slug + '"><span><b>' + nm(a) + '</b><span class="meta">' + flags(a) + " " + stHtml(a.slug) + (x.who.length < aged.length ? " · " + h("for_kids", { k: x.who.map(function (i) { return i + 1; }).join(", ") }) : "") + '</span></span><span class="num" style="font-weight:700">' + amd(a.price) + "</span></a>";
          }).join("") + "</div>";
        }).join("");
      }
      var n = all.length + some.length;
      res.innerHTML = '<h2 class="disp" style="margin-top:16px">' + h("where_can") + " · " + n + "</h2><p>" + h("by_cash") + " " + VP.period + " " + unc() + " <span class=\"demo\">" + h("demo") + "</span></p>" +
        (all.length ? "<h3 class=\"sub\" style=\"margin-top:8px\">" + h("fits_all") + "</h3>" + rows(all) : "") + (some.length ? "<h3 class=\"sub\" style=\"margin-top:16px\">" + h("fits_some") + "</h3>" + rows(some) : "") +
        '<p class="now" style="margin-top:12px"><b>' + h("dino_sep") + "</b> " + unc() + "</p>";
      cta.hidden = false;
      C.log("pick_result", { count: n });
    }
    D.addEventListener("click", function (e) {
      var t = e.target.closest("button"); if (!t) return;
      if (t.hasAttribute("data-adults")) { P.adults = Math.min(6, Math.max(0, P.adults + +t.getAttribute("data-adults"))); changed(); }
      if (t.hasAttribute("data-add-kid")) { P.kids.push(null); changed(); }
      if (t.hasAttribute("data-band")) { P.kids[+t.getAttribute("data-kid")] = +t.getAttribute("data-band"); changed(); }
      if (t.hasAttribute("data-rm")) { P.kids.splice(+t.getAttribute("data-rm"), 1); changed(); }
    });
    wa.addEventListener("change", render);
    function changed() { saveParty(P); C.log("pick_party", { adults: P.adults, children: P.kids.length }); render(); }
    render();
    var dk = D.querySelector('[data-cta="pick-deck"]'); if (dk) dk.href += "?f=pick";
  }

  /* ---------- SCR-41 колода ---------- */
  var deckEl = D.querySelector("[data-deck]"), mode, items, idx = 0, packs, history_ = [];
  function packSize() { return +C.opt("vpPack") || 8; }
  function buildItems() {
    var P = party(), useF = q.get("f") === "pick" && P.kids.some(function (b) { return b !== null; });
    var src = A.filter(function (a) { return !useF || P.kids.some(function (b) { return fit(a, b, true); }); });
    var youngest = Math.min.apply(null, P.kids.filter(function (b) { return b !== null; }).concat([9]));
    var order = youngest <= 2 ? ["kids", "family", "extreme", "games"] : ["family", "extreme", "kids", "games"];
    packs = [];
    order.forEach(function (c) { var arr = src.filter(function (a) { return a.cat === c; }); for (var i = 0; i < arr.length; i += packSize()) packs.push({ cat: c, items: arr.slice(i, i + packSize()) }); });
    items = []; packs.forEach(function (p, pi) { p.items.forEach(function (a, k) { items.push({ a: a, pack: pi, k: k, n: p.items.length }); }); items.push({ end: pi }); });
  }
  function cardHtml(a, eager) {
    var PH = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 390 293'/%3E";
    /* R08 п. 4: карточки ниже первой грузятся по мере прокрутки (data-lz, VPCORE.lazy) */
    var img = a.img ? '<img ' + (eager ? "" : 'data-lz="' + R + "assets/img/" + a.img + '-43-390.webp" ') + 'src="' + (eager ? R + "assets/img/" + a.img + '-43-390.webp' : PH) + '" ' + (eager ? "" : "data-") + 'srcset="' + R + "assets/img/" + a.img + "-43-390.webp 390w, " + R + "assets/img/" + a.img + '-43-780.webp 780w" sizes="(min-width:600px) 560px, 100vw" width="390" height="293" alt="" ' + (eager ? 'fetchpriority="high"' : 'decoding="async"') + ' draggable="false">' : noph(a, "band");
    return '<article class="card" data-card="' + a.slug + '">' + img + '<div class="tx">' + (a.img ? '<p class="photo-note">' + unc("illus_price") + "</p>" : "") +
      '<h2 class="disp">' + nm(a) + '</h2><p class="meta"><span>' + h(CAT[a.cat]) + "</span>" + flags(a) + '</p><p class="meta"><b class="num">' + amd(a.price) + "</b> " + h("by_cash") + (a.img ? "" : " " + unc()) + '</p><p class="meta">' + stHtml(a.slug) + ' <span class="demo">' + h("demo") + "</span></p>" +
      '<p><a class="link" href="' + url("attractions/" + a.slug) + '" data-attr="' + a.slug + '">' + h("more") + " →</a></p></div></article>";
  }
  function endHtml(pi) {
    var nxt = packs[pi + 1], n = list().length;
    if (!nxt) return '<div class="packend"><h2 class="disp">' + h("deck_end") + "</h2><p>" + h("list_n", { n: n }) + '</p><p><a class="btn pri full" href="' + url("plan") + '" data-cta="deck-sum" data-test="deck-sum">' + (n ? h("to_sum") : h("topup")) + '</a></p><p><button class="btn" type="button" data-restart>' + h("restart") + '</button> <a class="link" href="' + url("attractions") + '">' + h("all_prices") + "</a></p></div>";
    return '<div class="packend"><h2 class="disp">' + h("pack_end", { n: n }) + '</h2><p><a class="btn pri full" href="' + url("plan") + '" data-cta="deck-sum" data-test="deck-sum">' + h("to_sum") + '</a></p><p><button class="btn full" type="button" data-test="deck-nextpack" data-nextpack="' + (pi + 1) + '">' + h("next_pack", { c: (VP.str[CAT[nxt.cat]] || [nxt.cat])[0] }) + "</button></p></div>";
  }
  function count() {
    side();
    var it = items[idx], el = D.querySelector("[data-deck-count]");
    if (el) el.textContent = it && it.a ? (it.k + 1) + "/" + it.n : "";
  }
  function setMode(m, log) {
    var prev = mode; mode = m; C.set(C.LS(), "vpDeckMode", m);
    [].forEach.call(D.querySelectorAll("[data-mode]"), function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-mode") === m)); });
    if (log && prev !== m) C.log("deck_mode_switch", { from: prev, to: m });
    render41();
  }
  function onEnd(pi) { C.log("deck_pack_end", { pack: pi + 1, added: list().length }); }
  function render41() {
    if (mode === "feed") {
      deckEl.innerHTML = '<div class="feed" data-feed>' + items.map(function (it, i) {
        if (it.a) {
          var on = inList(it.a.slug);
          return '<section class="slot" data-i="' + i + '">' + cardHtml(it.a, i === 0) + '<div class="side"><button type="button" data-test="deck-heart" data-heart="' + it.a.slug + '" aria-pressed="' + on + '"><svg aria-hidden="true"><use href="#i-heart"/></svg>' + (on ? h("in_list_done") : h("in_list")) + '</button><button type="button" data-fnext="' + i + '"><svg aria-hidden="true"><use href="#i-down"/></svg>' + h("next") + '</button><button type="button" data-fprev="' + i + '"><svg aria-hidden="true" style="transform:rotate(180deg)"><use href="#i-down"/></svg>' + h("back") + "</button></div></section>";
        }
        return '<section class="slot" data-i="' + i + '" data-end="' + it.end + '">' + endHtml(it.end) + "</section>";
      }).join("") + "</div>";
      var feed = deckEl.querySelector("[data-feed]");
      if (C.lazy) {
        var lazyFeed = function () { if (feed.isConnected) C.lazy(feed, feed); };
        if (D.readyState === "complete") lazyFeed();
        else W.addEventListener("load", function () { setTimeout(lazyFeed, 200); }, { once: true });
      }
      if (!C.get(C.LS(), "vpHintFeed")) { var hn = D.createElement("p"); hn.className = "hint"; hn.innerHTML = h("hint_feed"); deckEl.appendChild(hn); var kill = function () { hn.remove(); C.set(C.LS(), "vpHintFeed", "1"); feed.removeEventListener("scroll", kill); }; feed.addEventListener("scroll", kill, { passive: true }); hn.addEventListener("click", kill); }
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && e.intersectionRatio > .6) { var i = +e.target.getAttribute("data-i"); var prev = idx; idx = i; count(); var it = items[i]; if (it.a) C.log("deck_card_view", { slug: it.a.slug, mode: "feed" }); else onEnd(it.end); if (i > prev && items[prev] && items[prev].a && !inList(items[prev].a.slug)) C.log("deck_skip", { slug: items[prev].a.slug, mode: "feed" }); } }); }, { root: feed, threshold: [.6] });
        [].forEach.call(feed.querySelectorAll(".slot"), function (s) { io.observe(s); });
      }
      var tgt = feed.querySelector('[data-i="' + idx + '"]'); if (tgt) feed.scrollTop = tgt.offsetTop;
    } else {
      var it = items[idx];
      deckEl.innerHTML = '<div class="swipe-area">' + (it && it.a ? cardHtml(it.a, true) : endHtml(it ? it.end : packs.length - 1)) + "</div>" +
        (it && it.a ? '<div class="swipe-btns"><button type="button" data-no data-test="deck-no">' + h("skip") + '</button><button type="button" class="undo" data-undo data-test="deck-undo"' + (history_.length ? "" : " disabled") + ">" + h("undo") + '</button><button type="button" class="yes" data-yes data-test="deck-yes">' + h("in_list") + "</button></div>" :
          (history_.length ? '<p style="text-align:center"><button type="button" class="btn" data-undo data-test="deck-undo">' + h("undo") + "</button></p>" : ""));
      if (it && it.a) { C.log("deck_card_view", { slug: it.a.slug, mode: "swipe" }); drag(deckEl.querySelector(".card"), it.a.slug); if (!C.get(C.LS(), "vpHintSwipe")) { var hs = D.createElement("p"); hs.className = "hint"; hs.innerHTML = h("hint_swipe"); deckEl.querySelector(".swipe-area").appendChild(hs); hs.addEventListener("click", function () { hs.remove(); }); setTimeout(function () { hs.remove(); }, 3500); setTimeout(function () { C.set(C.LS(), "vpHintSwipe", "1"); }, 0); } }
      else if (it) onEnd(it.end);
    }
    count();
    preload();
  }
  function preload() {
    var go = function () { for (var k = idx + 1, n = 0; k < items.length && n < 2; k++) { if (items[k].a && items[k].a.img) { var im = new Image(); im.src = R + "assets/img/" + items[k].a.img + "-43-390.webp"; n++; } } };
    if (D.readyState === "complete") go(); else window.addEventListener("load", go, { once: true });
  }
  function decide(yes, slug) {
    var card = deckEl.querySelector(".card"), hint = deckEl.querySelector(".hint"); if (hint) hint.remove();
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    history_.push({ idx: idx, slug: slug, yes: yes, wasSelected: inList(slug) });
    if (yes) add(slug, "swipe"); else C.log("deck_skip", { slug: slug, mode: "swipe" });
    var next = function () { idx = Math.min(items.length - 1, idx + 1); render41(); };
    if (card && !reduce) { card.style.transition = "transform .26s cubic-bezier(.2,.8,.2,1), opacity .26s"; card.style.transform = "translateX(" + (yes ? 130 : -130) + "%) rotate(" + (yes ? 14 : -14) + "deg)"; card.style.opacity = "0"; setTimeout(next, 240); }
    else if (card) { card.style.transition = "opacity .2s"; card.style.opacity = "0"; setTimeout(next, 180); } else next();
  }
  /* сведённая сборка: жест из версии A (family-v3 swipe.js bindDrag): дуга большого пальца может начаться вертикально,
     горизонталь фиксируется при |dx| >= 8 и |dx| > 0,9|dy|; порог 14 % ширины в пределах 44–56 px или флик (32 px и 0,42 px/мс);
     кадр через requestAnimationFrame; при reduced-motion без наклона; кнопки и ссылки на карточке жест не запускают. */
  var GS = { ratio: .14, min: 44, max: 56, flickD: 32, flickV: .42, win: 90 }, RM = W.matchMedia ? W.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  function drag(el, slug) {
    if (!el) return;
    var d = null, fr = 0;
    function paint() { el.style.transform = "translate3d(" + d.dx + "px," + (RM.matches ? 0 : Math.max(-8, Math.min(8, d.dy * .12))) + "px,0) rotate(" + (RM.matches ? 0 : Math.max(-8, Math.min(8, d.dx / 35))) + "deg)"; }
    el.addEventListener("pointerdown", function (e) {
      if (e.isPrimary === false || (e.button !== undefined && e.button !== 0) || e.target.closest("button,a,input,select,summary")) return;
      var t = performance.now(); d = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0, lock: false, th: Math.max(GS.min, Math.min(GS.max, el.clientWidth * GS.ratio)), sm: [{ x: 0, t: t }], last: t };
      el.style.transition = "none";
    });
    el.addEventListener("pointermove", function (e) {
      if (!d || e.pointerId !== d.id) return; var t = performance.now();
      d.dx = e.clientX - d.x; d.dy = e.clientY - d.y; d.last = t; d.sm.push({ x: d.dx, t: t });
      while (d.sm.length > 2 && d.sm[0].t < t - GS.win) d.sm.shift();
      if (!d.lock && Math.abs(d.dx) >= 8 && Math.abs(d.dx) > Math.abs(d.dy) * .9) { d.lock = true; try { el.setPointerCapture(d.id); } catch (x) { } }
      if (d.lock && !fr) fr = requestAnimationFrame(function () { fr = 0; if (d) paint(); });
    });
    function fin(e, cancel) {
      if (!d || e.pointerId !== d.id) return; var g = d; d = null; if (fr) { cancelAnimationFrame(fr); fr = 0; }
      var a = g.sm[0], b = g.sm[g.sm.length - 1], v = performance.now() - g.last > 100 ? 0 : (b.x - a.x) / Math.max(1, b.t - a.t);
      var ok = !cancel && g.lock && (Math.abs(g.dx) >= g.th || (Math.abs(g.dx) >= GS.flickD && Math.abs(v) > GS.flickV && (v > 0) === (g.dx > 0)));
      if (ok) decide(g.dx > 0, slug); else { el.style.transition = "transform .2s ease-out"; el.style.transform = ""; }
    }
    el.addEventListener("pointerup", function (e) { fin(e, false); });
    el.addEventListener("pointercancel", function (e) { fin(e, true); });
    el.addEventListener("lostpointercapture", function (e) { if (e.target === el && d) fin(e, true); });
  }
  function deckInit() {
    buildItems(); idx = 0; history_ = [];
    var m = q.get("mode"); m = m === "swipe" || m === "feed" ? m : (C.get(C.LS(), "vpDeckMode") === "swipe" ? "swipe" : "feed");
    var close = D.querySelector("[data-deck-close]"); if (close && q.get("from") === "catalog") close.href = url("attractions");
    setMode(m, false);
  }
  if (SCR === "SCR-41") {
    deckInit(); side();
    C.log("deck_open", { mode: mode, source: q.get("f") === "pick" ? "pick" : q.get("from") === "catalog" ? "catalog" : "link" });
    D.addEventListener("click", function (e) {
      var t = e.target.closest("button"); if (!t) return;
      if (t.hasAttribute("data-mode")) setMode(t.getAttribute("data-mode"), true);
      if (t.hasAttribute("data-yes")) decide(true, items[idx].a.slug);
      if (t.hasAttribute("data-no")) decide(false, items[idx].a.slug);
      if (t.hasAttribute("data-undo") && history_.length) { var hst = history_.pop(); if (hst.yes && !hst.wasSelected) remove(hst.slug); idx = hst.idx; C.log("deck_undo", { slug: hst.slug }); render41(); }
      if (t.hasAttribute("data-heart")) { var s = t.getAttribute("data-heart"); if (inList(s)) { remove(s); C.log("deck_undo", { slug: s }); t.setAttribute("aria-pressed", "false"); t.lastChild.textContent = ""; t.innerHTML = '<svg aria-hidden="true"><use href="#i-heart"/></svg>' + h("in_list"); } else { add(s, "feed"); t.setAttribute("aria-pressed", "true"); t.innerHTML = '<svg aria-hidden="true"><use href="#i-heart"/></svg>' + h("in_list_done"); } }
      if (t.hasAttribute("data-fnext") || t.hasAttribute("data-fprev")) { var i = +(t.getAttribute("data-fnext") || t.getAttribute("data-fprev")) + (t.hasAttribute("data-fnext") ? 1 : -1); var sl = deckEl.querySelector('[data-i="' + Math.max(0, i) + '"]'); if (sl) sl.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }
      if (t.hasAttribute("data-nextpack")) { var pi = +t.getAttribute("data-nextpack"); for (var k = 0; k < items.length; k++) if (items[k].a && items[k].pack === pi) { idx = k; break; } render41(); }
      if (t.hasAttribute("data-restart")) { idx = 0; history_ = []; render41(); }
    });
    D.addEventListener("keydown", function (e) { if (mode !== "swipe" || !items[idx] || !items[idx].a) return; if (e.key === "ArrowRight") decide(true, items[idx].a.slug); if (e.key === "ArrowLeft") decide(false, items[idx].a.slug); });
  }

  /* ---------- SCR-42 ---------- */
  var planBox = D.querySelector("[data-plan]");
  function renderPlan() {
    var P = party(), l = list().filter(function (s) { return BY[s]; }), state = D.body.getAttribute("data-state") || "";
    var kids = P.kids.map(function (b) { return b === null ? 2 : b; }), people = P.adults + kids.length, escortOn = C.opt("vpEscort") === "example";
    var noEsc = C.jget(C.LS(), "vpNoEscort", []);
    var rows = [], X = 0, escRows = [];
    l.forEach(function (s) {
      var a = BY[s], st = status(s), n = 0, kidsFit = 0;
      kids.forEach(function (b) { var f = fit(a, b, true); if (f) { n++; kidsFit++; } });
      /* R07 п. 3: та же таблица, что и флажок карточки: класс B («только с взрослым») с ребёнком любой полосы даёт строку сопровождающего */
      var needAdult = a.cls === "B" && kidsFit > 0;
      if (a.cls === "A" || a.cls === "C") n += P.adults;
      var off = st === "off", fitsNone = n === 0;
      if (!off && !fitsNone) X += n * a.price;
      if (!off && needAdult && escortOn && noEsc.indexOf(s) < 0) { X += a.price; }
      if (!off && needAdult) escRows.push({ a: a, on: escortOn && noEsc.indexOf(s) < 0 });
      rows.push('<li class="res-row" style="align-items:center"><span><a href="' + url("attractions/" + s) + '"><b>' + nm(a) + '</b></a><span class="meta">' + flags(a) + " · " + n + " × " + amd(a.price) + (off ? " · " + stHtml(s) + " " + h("off_now") : "") + (fitsNone ? ' · <span class="unc">' + ALERT + "<span>" + h("not_fit") + "</span></span>" : "") + '</span></span><button type="button" class="link" style="border:0;background:none;color:#D80B8C;cursor:pointer" data-rmplan="' + s + '">' + h("remove") + "</button></li>");
    });
    X = Math.ceil(X / 100) * 100;
    var hidePrices = state === "noprices";
    var stepper = function (k, v, lab) { return '<div class="stepper"><span style="min-width:110px;font-weight:700">' + h(lab) + '</span><button type="button" data-pstep="' + k + '" data-d="-1" aria-label="−">−</button><output>' + v + '</output><button type="button" data-pstep="' + k + '" data-d="1" aria-label="+">+</button></div>'; };
    var hd = "";
    if (state === "offline") hd += '<p class="state-msg">' + h("offline") + "</p>";
    if (!l.length) {
      hd += '<h2 class="disp" style="margin-top:8px">' + h("plan_empty") + "</h2><p>" + h("plan_empty_t") + "</p>" + stepper("a", P.adults, "adults") + stepper("k", P.kids.length, "children");
      planBox.innerHTML = hd + '<p style="margin-top:12px"><a class="link" href="' + url("pick") + '">' + h("pick_more") + "</a></p>";
      D.querySelector("[data-plan-cta]").innerHTML = '<a class="btn pri full" href="' + url("pay") + '" data-cta="plan-topup" data-test="plan-topup">' + h("topup") + "</a>";
      C.log("plan_view", { items: 0, sum_shown: "нет" }); return;
    }
    hd += '<p class="lead" data-test="plan-summary"><b>' + (hidePrices ? h("prices_hidden") : h("plan_sum", { n: l.length, x: amd(X), p: VP.period })) + "</b> " + unc() + "</p><p class=\"src\">" + h("per_one") + "</p>";
    hd += stepper("a", P.adults, "adults") + stepper("k", P.kids.length, "children");
    hd += '<ul style="list-style:none;padding:0;margin:12px 0">' + rows.join("") + "</ul>";
    /* сведённая сборка: строки сопровождающего одним блоком, одна пометка на блок */
    if (escortOn && escRows.length) hd += '<section class="now escblk"><h2 class="sub">' + h("need_adult") + "</h2>" + escRows.map(function (e) { return '<p class="escrow" data-test="escort-row"><label style="display:flex;gap:8px;align-items:center;min-height:44px"><input type="checkbox" data-esc="' + e.a.slug + '" ' + (e.on ? "checked" : "") + ' style="width:22px;height:22px;flex:none"> <span>' + h("escort", { a: "\u0001", p: amd(e.a.price) }).replace("\u0001", nm(e.a)) + "</span></label></p>"; }).join("") + '<p class="blk-note">' + unc("escort_ex") + "</p></section>";
    else if (escRows.length) hd += '<div class="now escask" data-test="escort-ask"><p><b>' + h("escort_ask") + "</b> (" + escRows.map(function (e) { return "«" + nm(e.a) + "»"; }).join(", ") + ") " + unc("escort_ask_n") + '</p><a class="btn" href="tel:+37495900060" data-intent="call">' + h("call") + "</a></div>";
    if (kids.length) hd += '<p class="now"><b>' + h("dino_sep") + "</b> " + unc() + "</p>";
    /* сведённая сборка: «Рассчитать для нас» (перенос M11 из A, company.js) */
    var CO = window.VPCO && window.VPCO.calculate({ attr: A, list: l, off: A.filter(function (a) { return status(a.slug) === "off"; }).map(function (a) { return a.slug; }), unl: 9900, escortOn: escortOn, noEsc: noEsc,
      people: [].concat(Array.apply(null, Array(P.adults)).map(function (_, i) { return { id: "a" + i, role: "adult" }; }), kids.map(function (b, i) { return { id: "k" + i, role: "child", band: b }; })) });
    var chosen = C.get(C.LS(), "vpOffer") || "";
    if (CO && !hidePrices && CO.offers.length) {
      if (!CO.offers.some(function (o) { return o.id === chosen; })) chosen = CO.best.id;
      hd += '<section class="now offers" data-test="company-offers"><h2 class="sub">' + h("co_h") + "</h2>" + CO.offers.map(function (o) {
        var t = o.id === "singles" ? h("co_singles", { x: amd(o.topup) }) : h("co_mixed", { n: o.passes.length, x: amd(o.topup) }) + "<small>" + o.passes.map(function (pid) { return pid.charAt(0) === "a" ? h("adult_i", { i: +pid.slice(1) + 1 }) : h("kid", { i: +pid.slice(1) + 1 }); }).join(", ") + "</small>";
        return '<label class="offer' + (o.id === chosen ? " on" : "") + '"><input type="radio" name="offer" value="' + o.id + '"' + (o.id === chosen ? " checked" : "") + ' data-offer="' + o.id + '"><span><b>' + t + "</b>" + (o.id === CO.best.id && CO.offers.length > 1 ? ' <span class="demo">' + h("co_best") + "</span>" : "") + "<small>" + h("co_total", { x: amd(o.total) }) + "</small></span></label>";
      }).join("") + '<p class="blk-note">' + unc("co_unc") + "</p></section>";
      var off2 = CO.offers.filter(function (o) { return o.id === chosen; })[0];
      if (off2.id === "mixed") X = off2.topup;
      if (CO.errors.length) hd += '<p class="state-msg">' + h("need_adult") + "</p>";
    }
    planBox.innerHTML = hd;
    var unlLink = CO && chosen === "mixed" && !hidePrices ? '<a class="btn full" style="margin-top:8px" href="' + url("unlimited", "#buy") + '" data-plan-unl>' + h("co_unl_btn", { n: CO.offers.filter(function (o) { return o.id === "mixed"; })[0].passes.length }) + "</a>" : "";
    D.querySelector("[data-plan-cta]").innerHTML = (hidePrices || !X ? '<a class="btn pri full" href="' + url("pay") + '" data-cta="plan-topup" data-test="plan-topup">' + h("topup") + "</a>" : '<a class="btn pri full" href="' + url("pay", "?amount=" + X + "&for=plan") + '" data-test="plan-topup" data-plan-topup="' + X + '">' + h("topup_x", { x: amd(X) }) + "</a>") + unlLink;
    C.log("plan_view", { items: l.length, sum_shown: hidePrices ? "нет" : "да" });
  }
  if (SCR === "SCR-42") {
    renderPlan();
    D.addEventListener("vp:state", renderPlan);
    D.addEventListener("click", function (e) {
      var t = e.target.closest("button,a"); if (!t) return;
      if (t.hasAttribute("data-rmplan")) { remove(t.getAttribute("data-rmplan")); renderPlan(); }
      if (t.hasAttribute("data-pstep")) { var P = party(), d = +t.getAttribute("data-d"); if (t.getAttribute("data-pstep") === "a") P.adults = Math.max(0, Math.min(6, P.adults + d)); else { if (d > 0) P.kids.push(null); else P.kids.pop(); } saveParty(P); C.log("pick_party", { adults: P.adults, children: P.kids.length }); renderPlan(); }
      if (t.hasAttribute("data-plan-topup")) C.log("plan_topup_click", { amount: +t.getAttribute("data-plan-topup") });
      if (t.hasAttribute("data-plan-unl")) C.log("plan_unlimited_click");
    });
    D.addEventListener("change", function (e) { var t = e.target; if (t.hasAttribute("data-offer")) { C.set(C.LS(), "vpOffer", t.value); C.log("company_offer", { offer: t.value }); renderPlan(); } });
    D.addEventListener("change", function (e) { var t = e.target; if (t.hasAttribute("data-esc")) { var n = C.jget(C.LS(), "vpNoEscort", []), s = t.getAttribute("data-esc"); n = n.filter(function (x) { return x !== s; }); if (!t.checked) n.push(s); C.jset(C.LS(), "vpNoEscort", n); renderPlan(); } });
  }
})();
