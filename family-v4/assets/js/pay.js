/* Парк Победы, прототип T34. Путь покупки: SCR-07, варианты покупки (SCR-06, SCR-11, SCR-16), SCR-08a/b/c, SCR-09. Оплата имитирована. */
(function () {
  "use strict";
  var C = window.VPCORE, D = document, VP = window.VP || { str: {} };
  if (!C) return;
  var L = C.lang(), R = C.root(), SCR = C.screen(), q = C.qs();
  var STR = VP.str || {};
  function s(k, v) {
    var e = STR[k] || [k, 0], t = e[0];
    if (v) for (var x in v) t = t.split("{" + x + "}").join(v[x]);
    return { t: t, d: e[1] };
  }
  function h(k, v) {
    var o = s(k, v), t = esc(o.t);
    if (o.d === 1) return '<span class="tr" title="нужен перевод клиента">' + t + "</span>";
    if (o.d === 2) return '<span class="tr" lang="ru" title="нужен перевод клиента">' + t + "</span>";
    return t;
  }
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function amd(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ֏"; }
  function grp(d) { return d.replace(/(\d{4})(?=\d)/g, "$1 "); }
  var ALERT = '<svg aria-hidden="true" focusable="false"><use href="#i-alert"/></svg>';
  function SS() { return C.SS(); }
  function order() { return C.jget(SS(), "vpOrder", null) || findOrder(q.get("order")); }
  function findOrder(id) { if (!id) return null; var all = C.jget(C.LS(), "vpOrders", {}); return all[id] || null; }
  function saveOrder(o) { C.jset(SS(), "vpOrder", o); var all = C.jget(C.LS(), "vpOrders", {}); all[o.id] = o; C.jset(C.LS(), "vpOrders", all); }
  function siteLang() { var l = q.get("lang"); return ["hy", "ru", "en"].indexOf(l) >= 0 ? l : (["hy", "ru", "en"].indexOf(L) >= 0 ? L : "hy"); }
  function go(path) { location.href = R + path; }

  /* ---------- формы покупки ---------- */
  function setupForm(f) {
    var product = f.getAttribute("data-product"), price = +f.getAttribute("data-price") || 0;
    var card = f.querySelector("[data-card]"), cerr = f.querySelector("[data-card-err]");
    var btns = f.querySelectorAll("[data-amount]"), other = f.querySelector("[data-other]"), aerr = f.querySelector("[data-amount-err]");
    var pay = f.querySelector("[data-pay]"), miss = f.querySelector("[data-missing]"), sum = f.querySelector("[data-summary]");
    var qtyOut = f.querySelector("[data-qty-out]");
    var amount = 0, qty = 1, fails = 0, entered = "", bypass = false;
    if (product === "unlimited") { var party = C.jget(C.LS(), "vpParty", null); if (party) { qty = Math.max(1, (party.adults || 0) + ((party.kids || []).length)); } }
    function cardOk() { return !card || /^\d{8,16}$/.test(card.value); }
    function total() {
      if (product === "topup") return amount;
      if (product === "nocard") return amount ? amount + price : 0;
      return qty * price;
    }
    function upd() {
      if (qtyOut) qtyOut.textContent = qty;
      var d = card ? card.value : "", l4 = d.length >= 4 ? d.slice(-4) : "", x = total();
      if (sum) {
        if (product === "topup") {
          sum.querySelector("[data-sum-line]").innerHTML = h("sum_line", { l4: l4, x: x ? amd(x) : "…" });
          sum.querySelector("[data-sum-check]").innerHTML = cardOk() && d ? h("sum_check", { grp: grp(d) }) : "";
        } else if (product === "nocard") {
          sum.innerHTML = amount ? h("nocard_sum", { a: amd(amount), x: amd(x) }) : "";
        } else {
          sum.innerHTML = h("qty_sum", { q: qty, p: amd(price), x: amd(x) }) + (d.length >= 4 ? "<small>" + h("sum_line", { l4: l4, x: amd(x) }) + "</small>" : "");
        }
      }
      var ok = cardOk() && (card ? card.value.length > 0 : true) && x > 0;
      pay.disabled = !ok;
      pay.innerHTML = x ? h("pay_x", { x: amd(x) }) : h("pay_x", { x: "" }).replace(/\s+$/, "");
      if (miss) miss.innerHTML = ok ? "" : (card && !cardOk() || (card && !card.value) ? h("card_short") : h("amount_short"));
    }
    function cardErr(show) {
      if (!card) return;
      if (show) { fails++; card.setAttribute("aria-invalid", "true"); cerr.innerHTML = ALERT + "<span>" + h("card_err") + (fails >= 3 ? "<br>" + h("card_err3") : "") + "</span>"; }
      else { card.removeAttribute("aria-invalid"); cerr.innerHTML = ""; }
    }
    if (card) {
      card.addEventListener("input", function () { var v = card.value.replace(/\D/g, "").slice(0, 16); if (v !== card.value) card.value = v; if (card.getAttribute("aria-invalid") && cardOk()) cardErr(false); upd(); });
      card.addEventListener("blur", function () {
        if (!card.value) return;
        if (!cardOk()) { cardErr(true); C.log("card_error", { reason: "format" }); }
        else { cardErr(false); if (entered !== card.value) { entered = card.value; C.log("card_entered"); } }
        upd();
      });
    }
    function pick(n, src) {
      amount = n;
      for (var i = 0; i < btns.length; i++) btns[i].setAttribute("aria-pressed", String(+btns[i].getAttribute("data-amount") === n));
      if (other) { var isBtn = [].some.call(btns, function (b) { return +b.getAttribute("data-amount") === n; }); other.classList.toggle("on", !isBtn && n > 0); if (isBtn) other.value = ""; }
      if (aerr) aerr.innerHTML = "";
      if (n && src !== "preset") C.log("amount_selected", { amount: n });
      upd();
    }
    [].forEach.call(btns, function (b) { b.addEventListener("click", function () { pick(+b.getAttribute("data-amount")); }); });
    if (other) {
      other.addEventListener("input", function () { other.value = other.value.replace(/\D/g, "").slice(0, 7); });
      other.addEventListener("change", function () {
        var n = +other.value;
        if (!other.value) return;
        if (n >= 100) { pick(n); other.classList.add("on"); }
        else { amount = 0; [].forEach.call(btns, function (b) { b.setAttribute("aria-pressed", "false"); }); aerr.innerHTML = ALERT + "<span>" + h("amount_err") + "</span>"; upd(); }
      });
    }
    var stepB = f.querySelectorAll("[data-qty]");
    [].forEach.call(stepB, function (b) { b.addEventListener("click", function () { qty = Math.min(10, Math.max(1, qty + +b.getAttribute("data-qty"))); upd(); }); });
    // сумма из ссылки (amount, for) и восстановление после возврата
    if (product === "topup") {
      var a = +q.get("amount"), fr = q.get("for"), line = f.querySelector("[data-for-line]");
      var draft = C.jget(SS(), "vpDraft", null), pending = C.get(SS(), "vpPending") === "1";
      if ((q.get("retry") || pending) && draft) { card.value = draft.card || ""; a = draft.amount || a; }
      if (a > 0) {
        if ([1000, 2000, 3000, 5000, 10000].indexOf(a) >= 0) pick(a, "preset"); else { other.value = a; pick(a, "preset"); other.classList.add("on"); }
        if (line) { line.hidden = false; line.innerHTML = h(fr === "dino" ? "for_dino" : fr === "plan" ? "for_plan" : fr === "event" ? "for_event" : "for_any") + (fr === "dino" ? " " + unc() : ""); }
      }
      C.log("topup_view", a > 0 ? { amount_preset: a, "for": fr || "" } : {});
      var nl = f.querySelector("[data-next-line]"); if (nl) nl.innerHTML = h(C.opt("vpPayVar") === "08a" ? "next_08a" : "next_08c");
      D.addEventListener("vp:opt", function () { if (nl) nl.innerHTML = h(C.opt("vpPayVar") === "08a" ? "next_08a" : "next_08c"); });
      if (pending && !q.get("retry")) { C.set(SS(), "vpPending", ""); C.setState("returned"); }
      var rt = f.querySelector("[data-retry]"); if (rt) rt.addEventListener("click", function () { bypass = true; C.setState(""); f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", { cancelable: true })); });
      D.addEventListener("vp:state", function (e) {
        var id = e.detail;
        if (id === "invalid") { card.value = "12345"; fails = 0; cardErr(true); upd(); }
        if (id === "badamount") { other.value = "50"; other.dispatchEvent(new Event("change")); }
        if (id === "sending") { pay.disabled = true; pay.innerHTML = h("sending"); }
      });
    }
    if (product === "nocard") { var bb = f.querySelectorAll("[data-amount]"); }
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (pay.disabled && !bypass) return;
      if (card && !cardOk()) { cardErr(true); card.focus(); return; }
      if (C.opt("vpPayScn") === "offline" && !bypass) { C.setState("offline"); return; }
      bypass = false;
      var x = total(), id = "VP" + Date.now().toString(36).toUpperCase();
      var o = { id: id, amount: x, last4: card ? card.value.slice(-4) : "", product: product, qty: qty, lang: L, utm: C.utm(), ts: new Date().toISOString() };
      saveOrder(o);
      C.jset(SS(), "vpDraft", { card: card ? card.value : "", amount: product === "topup" ? x : 0 });
      C.set(SS(), "vpPending", "1");
      pay.disabled = true; pay.innerHTML = h("sending");
      if (product === "unlimited") C.log("unlimited_buy_start", { qty: qty });
      C.log("pay_start", { amount: x, product: product, order_ref: id, "for": q.get("for") || "" }); // проход 6, FV-15: поле for как в topup_view (D-DATA-01, правка Р-14)
      setTimeout(function () { go(L + "/pay/" + (C.opt("vpPayVar") === "08a" ? "checkout" : "redirect") + "/index.html?order=" + id); }, 250);
    });
    upd();
  }
  function unc() { return '<span class="unc">' + ALERT + "<span>" + h("unc") + "</span></span>"; }

  function fillSum() {
    var o = order(), el = D.querySelectorAll("[data-sum-final]");
    if (!o) { for (var z = 0; z < el.length; z++) el[z].innerHTML = h("sum_line", { l4: "1234", x: amd(10000) }) + ' <span class="demo">пример</span>'; return o; }
    for (var i = 0; i < el.length; i++) el[i].innerHTML = h("sum_line", { l4: o.last4 || "…", x: amd(o.amount) });
    var al = D.querySelectorAll("[data-amt-label]"); for (var j = 0; j < al.length; j++) al[j].textContent = amd(o.amount);
    return o;
  }
  function resultUrl(status, lng) {
    var o = order(); return (lng || L) + "/pay/result/index.html?order=" + (o ? o.id : "") + "&status=" + status;
  }
  function scenarioStatus() { var sc = C.opt("vpPayScn"); return sc === "offline" ? "pending" : sc; }

  var forms = D.querySelectorAll("[data-payform]");
  for (var i = 0; i < forms.length; i++) setupForm(forms[i]);
  if (SCR === "SCR-11") C.log("unlimited_view");

  if (SCR === "SCR-08c") {
    var o = fillSum(); var to = "hy/pay/idram-mock/index.html?order=" + (o ? o.id : "") + "&lang=" + L;
    C.log("pay_redirect", { provider: "idram", order_ref: o ? o.id : "" });
    var b = D.querySelector("[data-go-provider]"); if (b) { b.href = R + to; }
    /* R08 п. 6: ?stay=1 оставляет экран без автоперехода (для замера и показа), как SCR-01 */
    if (!C.qs().has("stay")) setTimeout(function () { location.href = R + to; }, 1600);
  }
  if (SCR === "SCR-08a") {
    fillSum(); C.log("widget_loaded", { provider: "idram", order_ref: (order() || {}).id || "" });
    D.querySelector("[data-provider-pay]").addEventListener("click", function () { go(resultUrl(scenarioStatus())); });
  }
  if (SCR === "SCR-08b") {
    fillSum(); var sl = siteLang();
    D.querySelector("[data-provider-pay]").addEventListener("click", function () { go(resultUrl(D.body.getAttribute("data-state") === "f0a" ? "success" : scenarioStatus(), sl)); });
    D.querySelector("[data-provider-cancel]").addEventListener("click", function (e) { e.preventDefault(); go(resultUrl("cancel", sl)); });
  }
  if (SCR === "SCR-09") {
    var st = q.get("status"); if (["success", "pending", "delay", "fail", "cancel"].indexOf(st) < 0) st = "pending";
    var od = order(); C.set(SS(), "vpPending", "");
    var tr = D.querySelector("[data-training]"); if (tr) tr.hidden = false;
    function fill(stt) {
      C.setState(stt);
      var o = od || { id: "…", amount: 0, last4: "…", product: "topup" };
      var set = function (sel, v) { var e = D.querySelector(sel); if (e) e.textContent = v; };
      set("[data-r-amount]", amd(o.amount)); set("[data-r-card]", "…" + (o.last4 || "…")); set("[data-r-op]", "OP-" + o.id); set("[data-r-order]", o.id);
      set("[data-r-time]", new Date().toLocaleString(L === "en" ? "en-GB" : L === "ru" ? "ru-RU" : "hy-AM"));
      var pr = D.querySelectorAll("[data-prod]"); for (var k = 0; k < pr.length; k++) pr[k].hidden = pr[k].getAttribute("data-prod") !== (o.product || "topup");
    }
    fill(st);
    var u = C.utm(), ex = { status: st === "cancel" ? "fail" : st, reason: st === "cancel" ? "cancelled" : "", order_ref: od ? od.id : "" };
    if ((!u || !u.utm_source) && od && od.utm) { C.jset(SS(), "vpUtm", od.utm); }
    C.log("pay_result", ex);
    D.addEventListener("vp:state", function (e) { if (e.detail && e.detail !== D.body.getAttribute("data-filled")) { D.body.setAttribute("data-filled", e.detail); fill(e.detail); } });
    var cp = D.querySelector("[data-copy-op]");
    if (cp) cp.addEventListener("click", function () {
      var txt = "OP-" + (od ? od.id : ""); var done = function () { D.querySelector("[data-copied]").innerHTML = h("copied") + ": " + esc(txt); };
      try { navigator.clipboard.writeText(txt).then(done, done); } catch (e) { done(); }
      C.log("cta_click", { cta: "save-operation" });
    });
    [].forEach.call(D.querySelectorAll("[data-recheck]"), function (rc) { rc.addEventListener("click", function () { C.log("cta_click", { cta: "recheck" }); setTimeout(function () { fill("success"); C.log("pay_result", { status: "success", order_ref: od ? od.id : "", reason: "recheck" }); }, 900); }); });
  }
})();
