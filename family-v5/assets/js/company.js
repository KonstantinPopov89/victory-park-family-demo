/* Сведённый прототип, перенос M11 «Рассчитать для нас» из версии A (family-v3, company-model.js) на продукты версии B.
   Из A перенесены: состав компании по людям, выбор покрытия по каждому человеку (разовые катания или личный безлимит),
   взрослый-сопровождающий входит в сумму, без двойного счёта покрытого (A F1), непокрытое безлимитом остаётся отдельной строкой (A F2),
   повторный расчёт не меняет сумму. Не перенесены: вымышленные пакеты, акции и разовые билеты A (тарифы 2027 не утверждены, В1 и В3).
   Цены катаний и безлимита это кассовые наблюдения B, не прайс. Модуль чистый: работает в браузере и в node (аудит). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.VPCO = factory();
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";
  /* правила допуска B (pick.js fit), класс A–D; band = индекс полосы 0..4 */
  function fit(a, b, withAdult) {
    if (b === null || b === undefined) return null;
    if (a.cls === "D") return b >= a.alone ? "alone" : null;
    if (a.alone !== null && b >= a.alone) return "alone";
    if (withAdult && a.adult !== null && a.adult !== undefined && b >= a.adult) return "adult";
    return null;
  }
  /* кто катается на аттракционе: дети по допуску, взрослые на классах A и C, сопровождающий на классе B */
  function riders(a, people, escortOn, noEsc) {
    var r = [], kidsFit = 0, adults = people.filter(function (p) { return p.role === "adult"; });
    people.forEach(function (p) { if (p.role === "child" && fit(a, p.band, adults.length > 0)) { r.push({ id: p.id, as: "self" }); kidsFit++; } });
    if (a.cls === "A" || a.cls === "C") adults.forEach(function (p) { r.push({ id: p.id, as: "self" }); });
    var needEscort = a.cls === "B" && kidsFit > 0;
    if (needEscort && escortOn && adults.length && noEsc.indexOf(a.slug) < 0) r.push({ id: adults[0].id, as: "escort" });
    return { list: r, needEscort: needEscort };
  }
  /* input: {attr:[...], list:[slug], people:[{id,role,band}], off:[slug], unl:9900, escortOn:bool, noEsc:[slug]} */
  function demand(inp) {
    var by = {}, d = [], errors = [];
    inp.attr.forEach(function (a) { by[a.slug] = a; });
    var kids = inp.people.filter(function (p) { return p.role === "child"; }), adults = inp.people.length - kids.length;
    if (kids.length && !adults) errors.push("need_adult");
    inp.list.forEach(function (s) {
      var a = by[s]; if (!a || inp.off.indexOf(s) >= 0) return;
      riders(a, inp.people, inp.escortOn, inp.noEsc || []).list.forEach(function (r) { d.push({ slug: s, pid: r.id, as: r.as, price: a.price, unl: !!a.unl }); });
    });
    return { lines: d, errors: errors };
  }
  /* покрытие по человеку: личный безлимит выгоднее, если его катания внутри безлимита дороже цены безлимита */
  function calculate(inp) {
    var dm = demand(inp), per = {}, unl = inp.unl;
    inp.people.forEach(function (p) { per[p.id] = { pid: p.id, inUnl: 0, outUnl: 0, pass: false }; });
    dm.lines.forEach(function (l) { if (l.unl) per[l.pid].inUnl += l.price; else per[l.pid].outUnl += l.price; });
    var singles = 0, mixed = 0, passes = [];
    Object.keys(per).forEach(function (k) {
      var x = per[k]; singles += x.inUnl + x.outUnl;
      if (x.inUnl > unl) { x.pass = true; passes.push(k); mixed += unl + x.outUnl; } else mixed += x.inUnl + x.outUnl;
    });
    var lines = dm.lines.map(function (l) { return { slug: l.slug, pid: l.pid, as: l.as, price: l.price, covered: per[l.pid].pass && l.unl }; });
    var offers = [{ id: "singles", total: singles, topup: Math.ceil(singles / 100) * 100, passes: [], lines: lines.map(function (l) { return { slug: l.slug, pid: l.pid, as: l.as, price: l.price, covered: false }; }) }];
    if (passes.length) offers.push({ id: "mixed", total: mixed, topup: Math.ceil((mixed - passes.length * unl) / 100) * 100, passes: passes, lines: lines });
    offers.sort(function (a, b) { return a.total - b.total; });
    return { offers: offers, best: offers[0], errors: dm.errors, demand: dm.lines };
  }
  return { fit: fit, riders: riders, demand: demand, calculate: calculate };
});
