/* Парк Победы, прототип T34, проход 4. Ядро: метки источника, события (SCR-30), меню (SCR-28), панель прототипа (SCR-35), состояния экранов. Без библиотек. */
(function () {
  "use strict";
  var W = window, D = document, LANGS = ["hy", "ru", "en"], UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
  function st(kind) { try { var s = W[kind]; var k = "__vp"; s.setItem(k, "1"); s.removeItem(k); return s; } catch (e) { return null; } }
  var SS = st("sessionStorage"), LS = st("localStorage"), MEM = {};
  function get(s, k) { try { return s ? s.getItem(k) : (MEM[k] === undefined ? null : MEM[k]); } catch (e) { return null; } }
  function set(s, k, v) { try { if (s) s.setItem(k, v); else MEM[k] = v; } catch (e) { MEM[k] = v; } }
  function jget(s, k, d) { var v = get(s, k); if (!v) return d; try { return JSON.parse(v); } catch (e) { return d; } }
  function jset(s, k, v) { set(s, k, JSON.stringify(v)); }
  function qs() { try { return new URLSearchParams(location.search); } catch (e) { return { get: function () { return null; }, has: function () { return false; } }; } }

  function pickLang() {
    var m = get(LS, "vpLang"); if (LANGS.indexOf(m) >= 0) return m;
    var ls = (navigator.languages && navigator.languages.length) ? navigator.languages : (navigator.language ? [navigator.language] : []);
    for (var i = 0; i < ls.length; i++) { var p = String(ls[i]).slice(0, 2).toLowerCase(); if (LANGS.indexOf(p) >= 0) return p; }
    return ls.length ? "en" : "hy";
  }
  function isoTZ(d) {
    var o = -d.getTimezoneOffset(), sg = o >= 0 ? "+" : "-", p = function (n) { return (n < 10 ? "0" : "") + n; };
    o = Math.abs(o);
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds()) + sg + p(Math.floor(o / 60)) + ":" + p(o % 60);
  }

  var body, screen = "", lang = "", root = "", firstPage = false, utm = null;
  W.__events = jget(SS, "vpLog", []);

  function session() {
    var s = get(SS, "vpSid");
    if (!s) { s = Math.random().toString(36).slice(2, 10); set(SS, "vpSid", s); firstPage = true; }
    return s;
  }
  function readUtm() {
    var q = qs(), u = null;
    UTM.forEach(function (k) { var v = q.get(k); if (v) { u = u || {}; u[k] = v; } });
    var stored = jget(SS, "vpUtm", null);
    var newEntry = get(SS, "vpNewEntry") === "1";
    if (u) {
      UTM.forEach(function (k) { if (!u[k]) u[k] = ""; });
      var changed = !stored || UTM.some(function (k) { return stored[k] !== u[k]; });
      jset(SS, "vpUtm", u); set(SS, "vpNewEntry", "");
      return { u: u, landing: changed || firstPage || newEntry };
    }
    if (!stored || newEntry) {
      var ref = ""; try { ref = D.referrer ? new URL(D.referrer).host : ""; } catch (e) { }
      u = { utm_source: ref && ref !== location.host ? ref : "direct", utm_medium: "", utm_campaign: "", utm_content: "" };
      jset(SS, "vpUtm", u); set(SS, "vpNewEntry", "");
      return { u: u, landing: true };
    }
    return { u: stored, landing: false };
  }

  function log(ev, extra) {
    var o = { event: ev, ts: isoTZ(new Date()), screen: screen, lang: lang };
    var u = utm || jget(SS, "vpUtm", {}) || {};
    UTM.forEach(function (k) { o[k] = u[k] || ""; });
    o.session = session();
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) o[k] = extra[k];
    W.__events.push(o);
    if (W.__events.length > 400) W.__events = W.__events.slice(-400);
    jset(SS, "vpLog", W.__events);
    renderLog();
    return o;
  }

  /* ---------- состояния экрана (переключатель только в режиме показа) ---------- */
  function setState(id) {
    id = id || "";
    body.setAttribute("data-state", id);
    var all = D.querySelectorAll("[data-show-state]");
    for (var i = 0; i < all.length; i++) { var m = all[i].getAttribute("data-show-state").split(" ").indexOf(id) >= 0; all[i].style.display = m ? "block" : "none"; }
    var h = D.querySelectorAll("[data-hide-state]");
    for (var j = 0; j < h.length; j++) { var n = h[j].getAttribute("data-hide-state").split(" ").indexOf(id) >= 0; h[j].style.display = n ? "none" : ""; }
    var sel = D.getElementById("vp-state"); if (sel) sel.value = id;
    try { D.dispatchEvent(new CustomEvent("vp:state", { detail: id })); } catch (e) { }
  }

  /* ---------- мой список ---------- */
  function list() { return jget(LS, "vpList", []); }
  function updBadge() {
    var n = list().length, b = D.querySelectorAll("[data-mylist]");
    for (var i = 0; i < b.length; i++) { b[i].hidden = n < 1; var c = b[i].querySelector("[data-mylist-n]"); if (c) c.textContent = n; }
  }

  D.addEventListener("vp:interests", updBadge);

  /* ---------- меню SCR-28 ---------- */
  var lastFocus = null;
  function menu(open) {
    var m = D.getElementById("menu"); if (!m) return;
    var b = D.querySelector("[data-menu-open]");
    if (open) { lastFocus = D.activeElement; m.classList.add("open"); if (b) b.setAttribute("aria-expanded", "true"); var f = m.querySelector("a,button"); if (f) f.focus(); log("menu_open"); }
    else { m.classList.remove("open"); if (b) b.setAttribute("aria-expanded", "false"); if (lastFocus) lastFocus.focus(); }
  }

  /* ---------- панель прототипа SCR-35 и журнал SCR-30 ---------- */
  var drawer = null;
  var OPTS = {
    vpPayVar: ["Шаг оплаты", [["08c", "SCR-08c → SCR-08b (быстрый вариант, Ф0)"], ["08a", "SCR-08a своя страница (Ф1 при воротах)"]], "08c"],
    vpPayScn: ["Учебный сценарий оплаты", [["success", "оплата прошла"], ["fail", "отказ"], ["cancel", "отмена гостем"], ["pending", "нет статуса (ждём)"], ["delay", "оплачено, зачисление задержалось (A)"], ["offline", "нет связи"]], "success"],
    vpStatus: ["Статусы аттракционов (демо)", [["two", "два временно не работают"], ["all", "все работают"], ["stale", "вечер, данные устарели"], ["season", "межсезонье"]], "two"],
    vpPack: ["Размер пачки колоды", [["8", "8 карточек"], ["12", "12 карточек"]], "8"],
    vpEscort: ["Правило сопровождающего", [["example", "пример правила"], ["none", "нет данных парка"]], "example"]
  };
  function opt(k) { var v = get(LS, k); return v || OPTS[k][2]; }
  function entries() {
    var L = LANGS.indexOf(lang) >= 0 ? lang : "hy", r = root;
    return [
      ["Instagram: ссылка в профиле", r + L + "/links/index.html?utm_source=instagram&utm_medium=bio&utm_campaign=always-on"],
      ["Instagram: профиль, адрес без языка /links", r + "links/index.html?utm_source=instagram&utm_medium=bio&utm_campaign=always-on"],
      ["Facebook: кнопка страницы", r + L + "/links/index.html?utm_source=facebook&utm_medium=page-button&utm_campaign=always-on"],
      ["Facebook: пост о поводе", r + L + "/events/weekly-photo/index.html?utm_source=facebook&utm_medium=social&utm_campaign=weekly-photo&utm_content=post-2027-04-03"],
      ["Instagram Stories: пополнение с суммой", r + L + "/pay/index.html?amount=10000&utm_source=instagram&utm_medium=story&utm_campaign=topup&utm_content=2027-04-02"],
      ["Instagram Stories: повод", r + L + "/events/weekly-photo/index.html?utm_source=instagram&utm_medium=story&utm_campaign=weekly-photo&utm_content=2027-04-02"],
      ["Stories: картинка с прайсом и QR (/q/is1)", r + "q/is1/index.html"],
      ["QR на окне кассы 1 (/q/k1)", r + "q/k1/index.html"],
      ["QR «Пополнить онлайн» у очереди (/q/t-kassa-1)", r + "q/t-kassa-1/index.html"],
      ["QR на стойке 3 (/q/s3)", r + "q/s3/index.html"],
      ["QR на наклейке у аттракциона (/q/a-koleso)", r + "q/a-koleso/index.html"],
      ["Купон партнёра (/q/p-demo)", r + "q/p-demo/index.html"],
      ["Старый адрес /tickets (имитация 301)", r + "tickets/index.html"],
      ["Вход без языка: корень /", r + "index.html"],
      ["Поиск «часы парка» (без метки)", r + L + "/visit/index.html"]
    ];
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function renderLog() {
    if (!drawer) return;
    var box = drawer.querySelector(".evlog"); if (!box) return;
    var h = "";
    for (var i = W.__events.length - 1; i >= 0; i--) {
      var e = W.__events[i], extra = [];
      for (var k in e) if (["event", "ts", "screen", "lang", "session"].indexOf(k) < 0 && UTM.indexOf(k) < 0) extra.push(k + "=" + e[k]);
      h += "<div><b>" + esc(e.event) + "</b> " + esc(e.screen) + " · " + esc(e.lang) + " · " + esc(e.ts.slice(11, 19)) +
        "<br>utm: " + esc([e.utm_source, e.utm_medium, e.utm_campaign, e.utm_content].join(" / ")) + (extra.length ? "<br>" + esc(extra.join(", ")) : "") + "</div>";
    }
    box.innerHTML = h || "<div>Событий пока нет.</div>";
    var c = drawer.querySelector("[data-evcount]"); if (c) c.textContent = W.__events.length;
  }
  function openDrawer() {
    if (!drawer) {
      drawer = D.createElement("aside");
      drawer.className = "pdrawer"; drawer.setAttribute("role", "dialog"); drawer.setAttribute("aria-label", "Панель прототипа"); drawer.lang = "ru"; drawer.setAttribute("data-screen-state", "SCR-35 SCR-30");
      var states = []; try { states = JSON.parse(body.getAttribute("data-states") || "[]"); } catch (e) { }
      var h = '<div class="ph"><b>Панель прототипа · ' + esc(screen) + '</b><button class="ib" type="button" data-pclose>Закрыть</button></div>';
      h += "<h2>Демо-входы (SCR-35)</h2><p>Вход открывает экран приземления с меткой источника; журнал ниже показывает метку в каждом событии.</p><ul>";
      entries().forEach(function (x, i) { h += '<li><a href="' + esc(x[1]) + '" data-entry="' + i + '" data-test="entry-' + i + '">' + esc(x[0]) + "</a></li>"; });
      h += "</ul>";
      h += "<h2>Сценарии показа</h2>";
      Object.keys(OPTS).forEach(function (k) {
        h += '<label style="display:block;margin:8px 0 2px;font-weight:600" for="' + k + '">' + OPTS[k][0] + '</label><select id="' + k + '" data-opt="' + k + '" data-test="opt-' + k + '">';
        OPTS[k][1].forEach(function (o) { h += '<option value="' + o[0] + '"' + (opt(k) === o[0] ? " selected" : "") + ">" + esc(o[1]) + "</option>"; });
        h += "</select>";
      });
      if (states.length) {
        h += '<h2>Состояние экрана</h2><select id="vp-state" data-test="state">';
        states.forEach(function (s) { h += '<option value="' + esc(s.id) + '"' + ((body.getAttribute("data-state") || "") === s.id ? " selected" : "") + ">" + esc(s.label) + "</option>"; });
        h += "</select>";
      }
      h += '<h2>Журнал событий (SCR-30) · <span data-evcount>0</span></h2><p>Те же записи в <code>window.__events</code>. Номер карты в события не пишется.</p><div class="evlog" data-test="evlog"></div>';
      h += '<p style="margin-top:12px"><button class="btn" type="button" data-pclear>Новый визит: очистить журнал и метку</button></p>';
      h += '<p><a href="' + esc(root) + 'map.html">Карта прототипа</a></p>';
      drawer.innerHTML = h;
      body.appendChild(drawer);
      drawer.addEventListener("change", function (e) {
        var t = e.target;
        if (t.getAttribute("data-opt")) { set(LS, t.getAttribute("data-opt"), t.value); try { D.dispatchEvent(new CustomEvent("vp:opt", { detail: t.getAttribute("data-opt") })); } catch (x) { } }
        if (t.id === "vp-state") setState(t.value);
      });
      drawer.addEventListener("click", function (e) {
        var t = e.target.closest("[data-pclose],[data-pclear],[data-entry]"); if (!t) return;
        if (t.hasAttribute("data-pclose")) closeDrawer();
        if (t.hasAttribute("data-pclear")) { W.__events = []; jset(SS, "vpLog", []); set(SS, "vpUtm", ""); set(SS, "vpSid", ""); renderLog(); }
        if (t.hasAttribute("data-entry")) { set(SS, "vpNewEntry", "1"); set(SS, "vpUtm", ""); }
      });
    }
    drawer.hidden = false; renderLog();
    var f = drawer.querySelector("button"); if (f) f.focus();
  }
  function closeDrawer() { if (drawer) drawer.hidden = true; var t = D.querySelector(".ptab"); if (t) t.focus(); }

  /* ---------- входы без языка ---------- */
  function qrGo(target, q) {
    set(SS, "vpNewEntry", "1");
    location.replace("../../" + pickLang() + "/" + (target ? target + "/" : "") + "index.html?" + q);
  }
  function langEntry(target) {
    var q = qs();
    D.addEventListener("click", function (e) { var a = e.target.closest("[data-lang-pick]"); if (a) { set(LS, "vpLang", a.getAttribute("data-lang-pick")); a.href += location.search; } });
    if (q.has("stay")) return;
    set(SS, "vpNewEntry", "1");
    /* PR-1-01: путь от корня прототипа (data-root), а не от текущей папки: /links/ → ../ru/links/ */
    var rt = (D.body && D.body.getAttribute("data-root")) || "";
    location.replace(rt + pickLang() + "/" + target + "index.html" + location.search + location.hash);
  }

  /* ---------- R08 п. 4: ленивые картинки ниже первого экрана (data-lz), запас 200 px ---------- */
  function lzLoad(im) {
    var pic = im.parentNode && im.parentNode.tagName === "PICTURE" ? im.parentNode : null;
    if (pic) { var ss = pic.querySelectorAll("source[data-srcset]"); for (var i = 0; i < ss.length; i++) { ss[i].srcset = ss[i].getAttribute("data-srcset"); ss[i].removeAttribute("data-srcset"); } }
    if (im.getAttribute("data-srcset")) { im.srcset = im.getAttribute("data-srcset"); im.removeAttribute("data-srcset"); }
    im.src = im.getAttribute("data-lz"); im.removeAttribute("data-lz");
  }
  function lazy(box, rootEl) {
    var ims = (box || D).querySelectorAll("img[data-lz]"); if (!ims.length) return;
    if (!("IntersectionObserver" in W)) { for (var i = 0; i < ims.length; i++) lzLoad(ims[i]); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); lzLoad(e.target); } }); }, { root: rootEl || null, rootMargin: "200px 0px" });
    for (var j = 0; j < ims.length; j++) io.observe(ims[j]);
  }

  function init() {
    body = D.body; if (!body) return;
    screen = body.getAttribute("data-screen") || ""; lang = body.getAttribute("data-lang") || ""; root = body.getAttribute("data-root") || "";
    /* R09 п. 1: /q/ (data-screen="QR") только переадресует; событие захода пишет экран приземления с меткой qr */
    if (screen === "SCR-01" || screen === "QR" || screen === "SCR-04" && !lang) return;
    session();
    var r = readUtm(); utm = r.u;
    if (r.landing && screen !== "MAP") { var ref = ""; try { ref = D.referrer ? new URL(D.referrer).host : ""; } catch (e) { } log("landing_view", { referrer_host: ref }); }
    // языковые ссылки: та же страница, метка и параметры сохраняются
    var q = location.search, hsh = location.hash;
    var ll = D.querySelectorAll("a[data-lang-link]");
    for (var i = 0; i < ll.length; i++) { var to = ll[i].getAttribute("data-lang-link"); if (to !== "fa") ll[i].setAttribute("href", ll[i].getAttribute("href") + q + hsh); }
    var kq = D.querySelectorAll("a[data-keepq]");
    for (var j = 0; j < kq.length; j++) kq[j].setAttribute("href", kq[j].getAttribute("href") + q);
    // без хранилища метка идёт в адресе внутренних ссылок
    if (!SS && utm) {
      var p = UTM.map(function (k) { return utm[k] ? k + "=" + encodeURIComponent(utm[k]) : ""; }).filter(Boolean).join("&");
      var as = D.querySelectorAll("a[href]");
      for (var a = 0; a < as.length; a++) { var hr = as[a].getAttribute("href"); if (/^(https?:|tel:|#|mailto:)/.test(hr) || hr.indexOf("utm_") >= 0) continue; as[a].setAttribute("href", hr + (hr.indexOf("?") >= 0 ? "&" : "?") + p); }
    }
    D.addEventListener("click", function (e) {
      var t = e.target.closest("a,button"); if (!t) return;
      if (t.hasAttribute("data-menu-open")) { menu(true); return; }
      if (t.hasAttribute("data-menu-close")) { menu(false); return; }
      if (t.hasAttribute("data-lang-link")) { var to = t.getAttribute("data-lang-link"); set(LS, "vpLang", to); log("lang_select", { from: lang, to: to }); }
      if (t.getAttribute("data-cta")) log("cta_click", { cta: t.getAttribute("data-cta") });
      var it = t.getAttribute("data-intent"); if (it) log("intent_" + it);
      if (t.classList.contains("ptab")) openDrawer();
    });
    D.addEventListener("keydown", function (e) { if (e.key === "Escape") { menu(false); if (drawer && !drawer.hidden) closeDrawer(); } });
    /* сведённая сборка: режим показа скрывает вкладку «ПРОТОТИП» (раздел 7 сравнения), включается страницей show.html */
    if (get(LS, "vpShow") !== "1" || screen === "MAP") { var tab = D.createElement("button"); tab.type = "button"; tab.className = "ptab"; tab.lang = "ru"; tab.textContent = "ПРОТОТИП"; tab.setAttribute("data-test", "proto-panel");
    tab.setAttribute("aria-label", "ПРОТОТИП: панель с демо-входами, сценариями и журналом событий"); body.appendChild(tab); }
    updBadge(); lazy(D);
    var stq = qs().get("state"); setState(stq || "");
  }

  W.VPCORE = { log: log, get: get, set: set, jget: jget, jset: jset, SS: function () { return SS; }, LS: function () { return LS; }, qs: qs, setState: setState, lazy: lazy,
    list: list, setList: function (l) { var before=list(); if(W.VPJourneySync)W.VPJourneySync("local",{b:{before:before,after:l}},{bList:l});else jset(LS, "vpList", l); updBadge(); }, updBadge: updBadge, opt: opt, qrGo: qrGo, langEntry: langEntry, pickLang: pickLang,
    utm: function () { return utm || jget(SS, "vpUtm", {}); }, screen: function () { return screen; }, lang: function () { return lang; }, root: function () { return root; } };
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", init); else init();
})();
