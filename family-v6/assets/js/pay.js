/* Парк Победы, прототип T34. Путь покупки: SCR-07, варианты покупки (SCR-06, SCR-11, SCR-16), SCR-08a/b/c, SCR-09. Оплата имитирована. */
(function () {
  "use strict";
 function releaseURL(url){return window.VPReleaseURL ? window.VPReleaseURL(url) : url;}
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
  function order() {
    var requested = q.get("order"), current = C.jget(SS(), "vpOrder", null);
    // A link to an older order must not display the latest order in this tab.
    return requested ? (current && current.id === requested ? current : findOrder(requested)) : current;
  }
  function findOrder(id) { if (!id) return null; var all = C.jget(C.LS(), "vpOrders", {}); return all[id] || null; }
  function saveOrder(o, activate) { var active=C.jget(SS(), "vpOrder", null); if(activate||!active||active.id===o.id)C.jset(SS(), "vpOrder", o); var all = C.jget(C.LS(), "vpOrders", {}); all[o.id] = o; C.jset(C.LS(), "vpOrders", all); }
  function unfinished(o) { return !!o && (["pending","delay"].indexOf(o.resultStatus)>=0 || !o.resultStatus && C.get(SS(),"vpPending")==="1"); }
  function literal(ru,en,hy){return L==='hy'?hy:L==='en'?en:ru;}
  function siteLang() { var l = q.get("lang"); return ["hy", "ru", "en"].indexOf(l) >= 0 ? l : (["hy", "ru", "en"].indexOf(L) >= 0 ? L : "hy"); }
  function go(path) { var url=new URL(R+path,location.href);if(q.get('review')==='1')url.searchParams.set('review','1');location.href=releaseURL(url.href); }

  /* ---------- формы покупки ---------- */
  function setupForm(f) {
    var product = f.getAttribute("data-product"), price = +f.getAttribute("data-price") || 0;
    var card = f.querySelector("[data-card]"), cerr = f.querySelector("[data-card-err]");
    var btns = f.querySelectorAll("[data-amount]"), other = f.querySelector("[data-other]"), aerr = f.querySelector("[data-amount-err]");
    var pay = f.querySelector("[data-pay]"), miss = f.querySelector("[data-missing]"), sum = f.querySelector("[data-summary]");
    var qtyOut = f.querySelector("[data-qty-out]");
    var qtyChoices = f.querySelectorAll("[data-qty-set]"), qtyManual = f.querySelector("[data-qty-manual]");
    var qtyField = f.querySelector("[data-qty-field]"), qtyInput = f.querySelector("[data-qty-input]"), qtyError = f.querySelector("[data-qty-error]");
    var qtyIsValid = true, manualQuantity = false;
    var drafts=C.jget(SS(),"vp.family.v6.purchaseDrafts",{}), saved=drafts[product];
    var amount = 0, qty = product === "unlimited" ? 3 : 1, fails = 0, entered = "", bypass = false, initializing=true;
    if(saved && Number.isInteger(saved.qty) && saved.qty>=1 && saved.qty<=10)qty=saved.qty;
    else if(q.has('qty') && /^\d+$/.test(q.get('qty')) && +q.get('qty')>=1 && +q.get('qty')<=10)qty=+q.get('qty');
    if(saved && card && typeof saved.card==='string')card.value=saved.card.replace(/\D/g,'').slice(0,16);
    function rememberDraft(){if(initializing)return;var all=C.jget(SS(),"vp.family.v6.purchaseDrafts",{});all[product]={qty:qty,amount:amount,card:card?card.value:''};C.jset(SS(),"vp.family.v6.purchaseDrafts",all);}
    function cardOk() { return !card || /^\d{8,16}$/.test(card.value); }
    function total() {
      if (product === "topup") return amount;
      if (product === "nocard") return amount ? amount + price : 0;
      return qtyIsValid ? qty * price : 0;
    }
    function upd() {
      rememberDraft();
      if (qtyOut) qtyOut.textContent = qty;
      [].forEach.call(qtyChoices, function (b) { b.setAttribute("aria-pressed", String(!manualQuantity && +b.getAttribute("data-qty-set") === qty)); });
      if (qtyManual) { qtyManual.setAttribute("aria-expanded", String(manualQuantity)); qtyManual.setAttribute("aria-pressed", String(manualQuantity)); }
      if (qtyField) qtyField.hidden = !manualQuantity;
      if (qtyInput) { qtyInput.setAttribute("aria-invalid", String(!qtyIsValid)); if (!manualQuantity) qtyInput.value = qty; }
      if (qtyError) qtyError.hidden = qtyIsValid;
      var d = card ? card.value : "", l4 = d.length >= 4 ? d.slice(-4) : "", x = total();
      if (sum) {
        if (product === "topup") {
          sum.querySelector("[data-sum-line]").innerHTML = !l4&&!x ? h("sum_empty") : h("sum_line", {l4:l4||"····",x:x?amd(x):s("amount_short").t});
          sum.querySelector("[data-sum-check]").innerHTML = cardOk() && d ? h("sum_check", { grp: grp(d) }) : "";
        } else if (product === "nocard") {
          sum.innerHTML = amount ? h("nocard_sum", { a: amd(amount), x: amd(x) }) : "";
        } else {
          sum.innerHTML = qtyIsValid ? h("qty_sum", { q: qty, p: amd(price), x: amd(x) }) + (d.length >= 4 ? "<small>" + h("sum_line", { l4: l4, x: amd(x) }) + "</small>" : "") : esc(literal("Укажите количество от 1 до 10", "Choose a quantity from 1 to 10", "Նշեք քանակը՝ 1-ից 10"));
        }
      }
      var ok = qtyIsValid && cardOk() && (card ? card.value.length > 0 : true) && x > 0;
      pay.disabled = !ok;
      pay.innerHTML = x ? h("pay_x", { x: amd(x) }) : h("pay_x", { x: "" }).replace(/\s+$/, "");
      if (miss) miss.innerHTML = ok ? "" : (!qtyIsValid ? esc(literal("Укажите количество от 1 до 10", "Choose a quantity from 1 to 10", "Նշեք քանակը՝ 1-ից 10")) : card && !cardOk() || (card && !card.value) ? h("card_short") : h("amount_short"));
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
    // Presets are the primary quantity control. Manual entry is voluntary.
    manualQuantity = !!qtyInput && qty > 4;
    if (qtyInput) qtyInput.value = qty;
    [].forEach.call(qtyChoices, function (b) { b.addEventListener("click", function () {
      qty = +b.getAttribute("data-qty-set"); qtyIsValid = true; manualQuantity = false; upd();
    }); });
    if (qtyManual) qtyManual.addEventListener("click", function () {
      if (!manualQuantity && qtyInput) qtyInput.value = qty;
      manualQuantity = true; upd();
      if (qtyInput) { qtyInput.focus(); qtyInput.select(); }
    });
    if (qtyInput) qtyInput.addEventListener("input", function () {
      var raw = qtyInput.value.trim(), value = Number(raw);
      qtyIsValid = /^\d+$/.test(raw) && Number.isInteger(value) && value >= 1 && value <= 10;
      if (qtyIsValid) qty = value;
      upd();
    });
    // сумма из ссылки (amount, for) и восстановление после возврата
    if (product === "topup") {
      var a = q.has("amount")?+q.get("amount"):(saved&&Number.isFinite(saved.amount)?saved.amount:0), fr = q.get("for"), line = f.querySelector("[data-for-line]");
      var draft = C.jget(SS(), "vpDraft", null), pending = C.get(SS(), "vpPending") === "1";
      if ((q.get("retry") || pending) && draft) { card.value = draft.card || ""; a = draft.amount || a; }
      if (a > 0) {
        if ([1000, 2000, 3000, 5000, 10000].indexOf(a) >= 0) pick(a, "preset"); else { other.value = a; pick(a, "preset"); other.classList.add("on"); }
        if (line) { line.hidden = false; line.innerHTML = h(fr === "dino" ? "for_dino" : fr === "plan" ? "for_plan" : fr === "event" ? "for_event" : "for_any") + (fr === "dino" ? " " + unc() : ""); }
      }
      C.log("topup_view", a > 0 ? { amount_preset: a, "for": fr || "" } : {});
      var nl = f.querySelector("[data-next-line]"); if (nl) nl.innerHTML = h(C.opt("vpPayVar") === "08a" ? "next_08a" : "next_08c");
      D.addEventListener("vp:opt", function () { if (nl) nl.innerHTML = h(C.opt("vpPayVar") === "08a" ? "next_08a" : "next_08c"); });
      if (pending && !q.get("retry")) { C.setState("returned"); }
      var rt = f.querySelector("[data-retry]"); if (rt) rt.addEventListener("click", function () { bypass = true; C.setState(""); f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", { cancelable: true })); });
      D.addEventListener("vp:state", function (e) {
        var id = e.detail;
        if (id === "invalid") { card.value = "12345"; fails = 0; cardErr(true); upd(); }
        if (id === "badamount") { other.value = "50"; other.dispatchEvent(new Event("change")); }
        if (id === "sending") { pay.disabled = true; pay.innerHTML = h("sending"); }
      });
    }
    if (product === "nocard" && saved && Number.isFinite(saved.amount) && saved.amount>0)pick(saved.amount,"preset");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!qtyIsValid || (pay.disabled && !bypass)) return;
      if (card && !cardOk()) { cardErr(true); card.focus(); return; }
      if (C.opt("vpPayScn") === "offline" && !bypass) { C.setState("offline"); return; }
      bypass = false;
      var previous=C.jget(SS(),"vpOrder",null);
      if(unfinished(previous)){
        var notice=f.querySelector('[data-pending-order]');if(!notice){notice=D.createElement('p');notice.setAttribute('data-pending-order','');notice.setAttribute('role','status');f.appendChild(notice);}
        notice.textContent=literal('Предыдущая операция ещё проверяется. Откройте её результат, не оплачивайте повторно.','The previous operation is still being checked. Open its result; do not pay again.','Նախորդ գործարքը դեռ ստուգվում է։ Բացեք արդյունքը, կրկին մի վճարեք։');
        var link=D.createElement('a');link.dataset.vpCta='primary';link.textContent=literal('Проверить заказ','Check order','Ստուգել պատվերը');var pendingUrl=new URL(R+L+'/pay/result/index.html',location.href);pendingUrl.searchParams.set('order',previous.id);if(q.get('review')==='1')pendingUrl.searchParams.set('review','1');link.href=pendingUrl.href;notice.appendChild(link);return;
      }
      var x = total(), id = "VP" + Date.now().toString(36).toUpperCase()+Math.random().toString(36).slice(2,6).toUpperCase();
      var o = { id: id, amount: x, last4: card ? card.value.slice(-4) : "", product: product, qty: qty, lang: L, utm: C.utm(), ts: new Date().toISOString() };
      saveOrder(o,true);
      C.jset(SS(), "vpDraft", { card: card ? card.value : "", amount: product === "topup" ? x : 0 });
      C.set(SS(), "vpPending", "1");
      pay.disabled = true; pay.innerHTML = h("sending");
      if (product === "unlimited") C.log("unlimited_buy_start", { qty: qty });
      C.log("pay_start", { amount: x, product: product, order_ref: id, "for": q.get("for") || "" }); // проход 6, FV-15: поле for как в topup_view (D-DATA-01, правка Р-14)
      setTimeout(function () { go(L + "/pay/" + (C.opt("vpPayVar") === "08a" ? "checkout" : "redirect") + "/index.html?order=" + id); }, 250);
    });
    initializing=false;upd();
  }
  function unc() { return '<span class="unc">' + ALERT + "<span>" + h("unc") + "</span></span>"; }

  function validStoredOrder(o) {
    return !!o && typeof o.id === "string" && /^VP[A-Z0-9]{1,40}$/.test(o.id)
      && Number.isSafeInteger(o.amount) && o.amount > 0 && o.amount <= 100000000
      && ["topup", "nocard", "unlimited", "dino-ticket"].indexOf(o.product) >= 0
      && Number.isInteger(o.qty) && o.qty >= 1 && o.qty <= 10
      && typeof o.ts === "string" && Number.isFinite(Date.parse(o.ts))
      && typeof o.last4 === "string" && /^(?:\d{4})?$/.test(o.last4);
  }
  function paymentTitle(o) {
    return o.product === "unlimited" ? literal("Безлимит по каталогу парка", "Park catalogue unlimited pass", "Այգու կատալոգի անսահմանափակ աբոնեմենտ")
      : o.product === "dino-ticket" ? literal("Билеты в Дино Парк", "Dino Park tickets", "Դինո Պարկի տոմսեր")
      : o.product === "nocard" ? literal("Заказ карты парка", "Park card order", "Այգու քարտի պատվեր")
      : literal("Пополнение карты", "Card top-up", "Քարտի լիցքավորում");
  }
  function paymentReady() {
    var o = order(), box = D.querySelector(".paybox");
    if (validStoredOrder(o) && !o.resultStatus && !o.resultAt) return true;
    if (!box) return false;
    var known = validStoredOrder(o), heading = known
      ? literal("Заказ уже сохранён", "Your order is already saved", "Ձեր պատվերն արդեն պահպանված է")
      : literal("Заказ не выбран", "No order selected", "Պատվեր ընտրված չէ");
    var message = known
      ? literal("Откройте сохранённый результат, чтобы посмотреть статус и билеты. Повторная оплата не нужна.", "Open the saved result to see its status and tickets. You do not need to pay again.", "Բացեք պահպանված արդյունքը՝ կարգավիճակն ու տոմսերը տեսնելու համար։ Կրկին վճարելու կարիք չկա։")
      : literal("Сначала выберите билеты или укажите сумму пополнения. Затем здесь появится ваш заказ.", "Choose tickets or enter a top-up amount first. Your order will then appear here.", "Նախ ընտրեք տոմսերը կամ նշեք լիցքավորման գումարը։ Այնուհետև այստեղ կհայտնվի ձեր պատվերը։");
    var first = known ? L+"/pay/result/index.html?order="+encodeURIComponent(o.id) : L+"/tickets/";
    box.classList.add('payment-context-empty');
    box.innerHTML = '<h2 data-payment-empty-heading>' + esc(heading) + '</h2><p>' + esc(message) + '</p><div class="payment-empty-actions" data-vp-action-group>'
      + '<a data-payment-recover data-vp-cta="primary" href="' + esc(releaseURL(R+first)) + '">' + esc(known ? literal("Открыть результат", "View result", "Բացել արդյունքը") : literal("Выбрать билеты", "Choose tickets", "Ընտրել տոմսերը")) + '</a>'
      + (known ? '' : '<a data-payment-topup data-vp-cta="secondary" href="' + esc(releaseURL(R+L+'/pay/')) + '">' + esc(literal("Пополнить карту", "Top up card", "Լիցքավորել քարտը")) + '</a>') + '</div>';
    return false;
  }
  function fillSum() {
    var o = order(), el = D.querySelectorAll("[data-sum-final]");
    if (!validStoredOrder(o)) o = null;
    if (!o) { for (var z = 0; z < el.length; z++) el[z].innerHTML = h("sum_empty"); return o; }
    for (var i = 0; i < el.length; i++) el[i].innerHTML = h("sum_line", { l4: o.last4 || "…", x: amd(o.amount) });
    var title = D.querySelector("[data-payment-title]"); if (title) title.textContent = paymentTitle(o);
    var al = D.querySelectorAll("[data-amt-label]"); for (var j = 0; j < al.length; j++) al[j].textContent = amd(o.amount);
    return o;
  }
  function resultUrl(status, lng) {
    var o = order();
    if (o && ["success", "pending", "delay", "fail", "cancel"].indexOf(status) >= 0) {
      o.resultStatus = status;
      if (!o.resultAt) o.resultAt = new Date().toISOString();
      saveOrder(o);
    }
    return (lng || L) + "/pay/result/index.html?order=" + (o ? o.id : "") + "&status=" + status;
  }
  function scenarioStatus() { var sc = C.opt("vpPayScn"); return sc === "offline" ? "pending" : sc; }

  var forms = D.querySelectorAll("[data-payform]");
  for (var i = 0; i < forms.length; i++) setupForm(forms[i]);
  if (SCR === "SCR-11") C.log("unlimited_view");

  if (SCR === "SCR-08c" && paymentReady()) {
    var o = fillSum(); var to = L+"/pay/idram-mock/index.html?order=" + (o ? o.id : "") + "&lang=" + L+(q.get("review")==="1"?"&review=1":"");
    C.log("pay_redirect", { provider: "idram", order_ref: o ? o.id : "" });
    var b = D.querySelector("[data-go-provider]"); if (b) { b.href = R + to; }
    /* R08 п. 6: ?stay=1 оставляет экран без автоперехода (для замера и показа), как SCR-01 */
    if (!C.qs().has("stay")) setTimeout(function () { if (paymentReady()) location.href = releaseURL(R + to); }, 1600);
  }
  if (SCR === "SCR-08a" && paymentReady()) {
    fillSum(); C.log("widget_loaded", { provider: "idram", order_ref: (order() || {}).id || "" });
    D.querySelector("[data-provider-pay]").addEventListener("click", function () { if (paymentReady()) go(resultUrl(scenarioStatus())); });
  }
  if (SCR === "SCR-08b" && paymentReady()) {
    fillSum(); var sl = siteLang();
    D.querySelector("[data-provider-pay]").addEventListener("click", function () { if (paymentReady()) go(resultUrl(D.body.getAttribute("data-state") === "f0a" ? "success" : scenarioStatus(), sl)); });
    D.querySelector("[data-provider-cancel]").addEventListener("click", function (e) { e.preventDefault(); if (paymentReady()) go(resultUrl("cancel", sl)); });
  }
  if (SCR === "SCR-09") {
    var od = order(), fillingResult = false;
    var resultStates = ["success", "pending", "delay", "fail", "cancel"];
    function resultText(ru, en, hy) { return L === "hy" ? hy : L === "en" ? en : ru; }
    if (!validStoredOrder(od)) od = null;
    // The URL is navigation context. Only a stored demo response can issue a ready QR.
    var st = od ? (resultStates.indexOf(od.resultStatus) >= 0 ? od.resultStatus : "pending") : "missing";
    var resultActive=C.jget(SS(),"vpOrder",null);if(od&&resultActive&&resultActive.id===od.id&&!unfinished(od))C.set(SS(), "vpPending", "");
    var tr = D.querySelector("[data-training]"); if (tr) tr.hidden = false;
    function readyItems(o) {
      var personal = o.product === "unlimited" || o.product === "dino-ticket", items = [];
      var instruction = o.product === "unlimited"
        ? resultText("Учебный обмен: покажите код на кассе для получения личного браслета. Реальная выдача не подключена.", "Demo exchange: show the code at the cash desk for a personal wristband. Actual issuance is not connected.", "Ուսումնական փոխանակում․ կոդը ցույց տվեք դրամարկղում՝ անձնական ապարանջան ստանալու համար։ Իրական տրամադրումը միացված չէ։")
        : o.product === "dino-ticket"
        ? resultText("Учебный билет Дино Парка. Реальная проверка на входе не подключена.", "Demo Dino Park ticket. Actual entrance validation is not connected.", "Դինո Պարկի ուսումնական տոմս։ Մուտքի իրական ստուգումը միացված չէ։")
        : o.product === "nocard"
        ? resultText("Учебная квитанция заказа карты. В демонстрационном сценарии покажите номер заказа на кассе. QR не заменяет карту парка.", "Demo receipt for a park card order. In this scenario, show the order number at the cash desk. This QR does not replace a park card.", "Այգու քարտի պատվերի ուսումնական անդորրագիր։ Այս սցենարում պատվերի համարը ցույց տվեք դրամարկղում։ QR-ը չի փոխարինում այգու քարտին։")
        : resultText("Учебная квитанция пополнения. Для катания используется существующая карта парка. QR не является билетом или заменой карты.", "Demo top-up receipt. Rides use the existing park card. This QR is neither a ticket nor a replacement card.", "Լիցքավորման ուսումնական անդորրագիր։ Ատրակցիոնների համար օգտագործվում է այգու գործող քարտը։ QR-ը տոմս կամ քարտի փոխարինում չէ։");
      var title = o.product === "unlimited"
        ? resultText("Безлимит по каталогу парка", "Park catalogue unlimited pass", "Այգու կատալոգի անսահմանափակ աբոնեմենտ")
        : o.product === "dino-ticket"
        ? resultText("Билет в Дино Парк", "Dino Park ticket", "Դինո Պարկի տոմս")
        : o.product === "nocard"
        ? resultText("Заказ карты парка", "Park card order", "Այգու քարտի պատվեր")
        : resultText("Квитанция пополнения", "Top-up receipt", "Լիցքավորման անդորրագիր");
      var validity = o.product === "unlimited"
        ? resultText("Исторический демопример дневного браслета. Действующие условия парка не подтверждены.", "Historical demo of a day wristband. Current park terms are unconfirmed.", "Օրվա ապարանջանի պատմական ցուցադրական օրինակ։ Այգու գործող պայմանները հաստատված չեն։")
        : personal
        ? resultText("Срок и условия посещения требуют подтверждения парка.", "Visit validity and conditions require park confirmation.", "Այցի ժամկետն ու պայմանները պահանջում են այգու հաստատումը։")
        : resultText("Квитанция операции. Не даёт права прохода.", "Operation receipt. Does not grant admission.", "Գործարքի անդորրագիր։ Մուտքի իրավունք չի տալիս։");
      var details = [resultText("Учебная покупка. Деньги не списывались.", "Demo purchase. No money was charged.", "Ուսումնական գնում։ Գումար չի գանձվել։")];
      if (o.product === "unlimited") {
        details.push(resultText("В этом демопримере включён 31 аттракцион. Дино Парк, тиры, автоматы, VR на двоих и Dark VR исключены. Действующий состав не подтверждён.", "This demo includes 31 attractions. Dino Park, shooting galleries, arcade machines, VR for two and Dark VR are excluded. The current list is unconfirmed.", "Այս ցուցադրական օրինակում ներառված է 31 ատրակցիոն։ Դինո Պարկը, հրաձգարանները, խաղային ավտոմատները, երկուսի համար VR-ը և Dark VR-ը ներառված չեն։ Գործող ցանկը հաստատված չէ։"));
        details.push(resultText("Исторический пример интервалов: 5/30 минут. Допуск, сопровождение, активация и онлайн-выдача требуют подтверждения парка.", "Historical interval example: 5/30 minutes. Admission, accompaniment, activation and online issuance require park confirmation.", "Ընդմիջումների պատմական օրինակ՝ 5/30 րոպե։ Մուտքը, ուղեկցումը, ակտիվացումը և առցանց տրամադրումը պահանջում են այգու հաստատումը։"));
      }
      for (var n = 1; n <= (personal ? o.qty : 1); n++) {
        items.push({
          code: personal ? "OP-" + o.id + "-" + (o.product === "unlimited" ? "PASS" : "DINO") + "-" + n : "OP-" + o.id,
          title: title,
          recipient: personal ? resultText("Получатель ", "Holder ", "Ստացող ") + n : resultText("Операция ", "Operation ", "Գործարք ") + o.id,
          validity: validity, details: details.slice(), instruction: instruction,
          kind: personal ? (o.product === "unlimited" ? "unlimited" : "ticket") : "receipt"
        });
      }
      return items;
    }
    function fill(stt) {
      if (fillingResult) return;
      fillingResult = true;
      if (!od) stt = "missing";
      else if (resultStates.indexOf(stt) < 0) stt = "pending";
      D.body.classList.toggle("has-receipt", stt === "success" && !!od);
      D.body.setAttribute("data-filled", stt);
      C.setState(stt);
      var holder = D.querySelector("[data-postpurchase-b]"), receiptView=window.VPPostPurchase?.captureView();
      if (!od) { if (holder) holder.innerHTML = ""; fillingResult = false; return; }
      var o = od;
      o.resultStatus = stt;
      if (!o.resultAt) o.resultAt = o.ts;
      saveOrder(o);
      var active=C.jget(SS(),"vpOrder",null);if(active&&active.id===o.id)C.set(SS(),"vpPending",unfinished(o)?"1":"");
      var set = function (sel, v) { [].forEach.call(D.querySelectorAll(sel), function (e) { e.textContent = v; }); };
      set("[data-r-amount]", amd(o.amount)); set("[data-r-card]", "…" + (o.last4 || "…")); set("[data-r-op]", "OP-" + o.id); set("[data-r-order]", o.id);
      set("[data-r-time]", new Date(Number.isFinite(Date.parse(o.resultAt)) ? o.resultAt : o.ts).toLocaleString(L === "en" ? "en-GB" : L === "ru" ? "ru-RU" : "hy-AM", { timeZone: "Asia/Yerevan" }));
      var pr = D.querySelectorAll("[data-prod]"); for (var k = 0; k < pr.length; k++) pr[k].hidden = pr[k].getAttribute("data-prod") !== (o.product || "topup");
      if (holder) {
        holder.innerHTML = stt === "success" && window.VPPostPurchase
          ? window.VPPostPurchase.render(readyItems(o), { social:true, orderId: o.id, summary:[resultText("Сумма заказа: ","Order total: ","Պատվերի գումարը՝ ")+amd(o.amount)] })
          : "";
      }
      window.VPPostPurchase?.restoreView(receiptView);window.VPPostPurchase?.restoreDraft();
      fillingResult = false;
    }
    fill(st);
    var u = C.utm(), ex = { status: st === "cancel" ? "fail" : st, reason: st === "cancel" ? "cancelled" : "", order_ref: od ? od.id : "" };
    if ((!u || !u.utm_source) && od && od.utm) { C.jset(SS(), "vpUtm", od.utm); }
    C.log("pay_result", ex);
    D.addEventListener("vp:state", function (e) { if (!fillingResult && e.detail && e.detail !== D.body.getAttribute("data-filled")) fill(e.detail); });
    var cp = D.querySelector("[data-copy-op]");
    if (cp) cp.addEventListener("click", function () {
      if (!od) return;
      var txt = "OP-" + od.id, feedback = D.querySelector("[data-copied]");
      var done = function () { feedback.textContent = resultText("Скопировано: ", "Copied: ", "Պատճենված է՝ ") + txt; };
      var failed = function () { feedback.textContent = resultText("Не удалось скопировать. Выделите код вручную: ", "Could not copy. Select the code manually: ", "Չհաջողվեց պատճենել։ Կոդը ընտրեք ձեռքով՝ ") + txt; };
      try { navigator.clipboard.writeText(txt).then(done, failed); } catch (e) { failed(); }
      C.log("cta_click", { cta: "save-operation" });
    });
    [].forEach.call(D.querySelectorAll("[data-recheck]"), function (rc) { rc.addEventListener("click", function () {
      if (!od || rc.disabled) return;
      C.log("cta_click", { cta: "recheck" }); rc.disabled = true;
      setTimeout(function () { fill("success"); rc.disabled = false; C.log("pay_result", { status: "success", order_ref: od.id, reason: "recheck" }); }, 900);
    }); });
  }
})();
