/* Сведённый прототип, перенос M05 из версии A (family-v3, availability/model.js, правило ручного статуса):
   ручной статус дежурного главнее демо-статуса, имеет срок; истёкший статус превращается в «не уточнено»;
   история действий. Хранение только в этом браузере (localStorage vpDuty), вкладки синхронизируются.
   Не перенесено из A: давность списаний Lime, пороги, погода, смена (до ответа парка В5 это не нужно для показа). */
(function () {
  "use strict";
  var C = window.VPCORE, D = document, W = window;
  if (!C) return;
  var KEY = "vpDuty", MIN = 60000;
  function load() { var s = C.jget(C.LS(), KEY, null); return s && s.v === 1 ? s : { v: 1, off: 0, m: {}, hist: [] }; }
  function save(s) { C.jset(C.LS(), KEY, s); }
  function now(s) { return Date.now() + (s || load()).off; }
  /* правило A ownStatus: есть ручной и не истёк -> он; истёк -> unk с причиной; нет -> null (демо-статус B) */
  function get(slug) {
    var s = load(), m = s.m[slug], t = now(s);
    if (!m) return null;
    if (m.exp <= t) return { st: "unk", reason: "expired", at: m.at, exp: m.exp, src: "manual-expired" };
    return { st: m.st, reason: m.reason, at: m.at, exp: m.exp, src: "manual" };
  }
  function hhmm(t) { var d = new Date(t), p = function (n) { return (n < 10 ? "0" : "") + n; }; return p(d.getHours()) + ":" + p(d.getMinutes()); }
  W.VPDUTY = { get: get, now: now, hhmm: hhmm, KEY: KEY };
  W.addEventListener("storage", function (e) { if (e.key === KEY) D.dispatchEvent(new CustomEvent("vp:opt", { detail: "vpDuty" })); });

  if (C.screen() !== "SCR-44") return;
  var L = C.lang(), A = (W.VP && W.VP.attr) || [];
  var TX = {
    on: ["Работает", "Open", "Աշխատում է"], off: ["Не работает", "Closed", "Չի աշխատում"], unk: ["Уточняем", "Checking", "Ճշտում ենք"],
    none: ["без ручного статуса", "no manual status", "առանց ձեռքով կարգավիճակի"], until: ["до {t}", "until {t}", "մինչև {t}"],
    expired: ["срок ручного статуса истёк, нужна новая проверка", "manual status expired, needs a new check", "ձեռքով կարգավիճակի ժամկետն անցել է"],
    clear: ["Снять", "Clear", "Հանել"], h_set: ["{t} · {a}: {s}, {r}, до {u}", "{t} · {a}: {s}, {r}, until {u}", "{t} · {a}: {s}, {r}, մինչև {u}"],
    h_clear: ["{t} · {a}: ручной статус снят", "{t} · {a}: manual status cleared", "{t} · {a}: ձեռքով կարգավիճակը հանված է"],
    h_time: ["{t} · учебное время +30 мин", "{t} · demo time +30 min", "{t} · ուսումնական ժամ +30 ր"],
    h_reset: ["{t} · демо сброшено", "{t} · demo reset", "{t} · դեմոն զրոյացված է"], empty: ["Действий пока нет", "No actions yet", "Գործողություններ դեռ չկան"],
    def_reason: ["проверено дежурным", "checked by the duty manager", "ստուգված է հերթապահի կողմից"]
  };
  var LI = { ru: 0, en: 1, hy: 2 }[L] || 0;
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function t(k, v) { var s = TX[k][LI]; if (v) for (var x in v) s = s.split("{" + x + "}").join(v[x]); return s; }
  function th(k, v) { var s = esc(t(k, v)); return LI ? '<span class="tr" title="нужен перевод клиента">' + s + "</span>" : s; }
  function nm(a) { return a.name; }
  var listEl = D.querySelector("[data-duty-list]"), histEl = D.querySelector("[data-duty-hist]"), clockEl = D.querySelector("[data-duty-clock]");
  var reasonEl = D.querySelector("[data-duty-reason]"), minEl = D.querySelector("[data-duty-min]"), findEl = D.querySelector("[data-duty-find]");
  function badge(st) { return '<span class="st ' + st + '"><i></i><span>' + th(st) + "</span></span>"; }
  function render() {
    var s = load(), q = (findEl && findEl.value || "").trim().toLowerCase();
    clockEl.textContent = hhmm(now(s));
    listEl.innerHTML = A.filter(function (a) { return !q || a.name.toLowerCase().indexOf(q) >= 0; }).map(function (a) {
      var g = get(a.slug), cur = g ? badge(g.st) + " <small>" + (g.src === "manual-expired" ? th("expired") : esc(g.reason) + ", " + th("until", { t: hhmm(g.exp) })) + "</small>" : "<small>" + th("none") + "</small>";
      return '<li class="duty-row" data-slug="' + a.slug + '"><div class="duty-nm"><b>' + esc(nm(a)) + "</b> " + cur + '</div><div class="duty-btns" role="group" aria-label="' + esc(nm(a)) + '">' +
        ["on", "off", "unk"].map(function (st) { return '<button type="button" class="chip" data-duty-set="' + st + '" aria-pressed="' + String(!!(g && g.src === "manual" && g.st === st)) + '">' + th(st) + "</button>"; }).join("") +
        (s.m[a.slug] ? '<button type="button" class="chip" data-duty-clear>' + th("clear") + "</button>" : "") + "</div></li>";
    }).join("");
    histEl.innerHTML = s.hist.length ? s.hist.slice().reverse().map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") : "<li>" + th("empty") + "</li>";
  }
  function byslug(sl) { for (var i = 0; i < A.length; i++) if (A[i].slug === sl) return A[i]; return null; }
  D.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var s = load(), tt = now(s), row = b.closest("[data-slug]"), a = row && byslug(row.getAttribute("data-slug"));
    if (b.hasAttribute("data-duty-set") && a) {
      var st = b.getAttribute("data-duty-set"), mins = parseInt(minEl.value, 10) || 30, r = (reasonEl.value || "").trim().slice(0, 120) || t("def_reason");
      s.m[a.slug] = { st: st, reason: r, at: tt, exp: tt + mins * MIN };
      s.hist.push(t("h_set", { t: hhmm(tt), a: nm(a), s: t(st), r: r, u: hhmm(tt + mins * MIN) }));
      C.log("duty_set", { slug: a.slug, status: st, minutes: mins });
    } else if (b.hasAttribute("data-duty-clear") && a) {
      delete s.m[a.slug]; s.hist.push(t("h_clear", { t: hhmm(tt), a: nm(a) }));
    } else if (b.hasAttribute("data-duty-time")) {
      s.off += 30 * MIN; s.hist.push(t("h_time", { t: hhmm(tt + 30 * MIN) }));
    } else if (b.hasAttribute("data-duty-reset")) {
      s = { v: 1, off: 0, m: {}, hist: [t("h_reset", { t: hhmm(Date.now()) })] };
    } else return;
    if (s.hist.length > 50) s.hist = s.hist.slice(-50);
    save(s); render();
  });
  if (findEl) findEl.addEventListener("input", render);
  W.addEventListener("storage", function (e) { if (e.key === KEY) render(); });
  render();
})();
