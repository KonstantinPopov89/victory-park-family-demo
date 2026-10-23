/* Pure facts and wishlist updates for the separate photo-first Reels experiment. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./model.js'));
  else root.VPReels = factory(root.VP3);
}(typeof globalThis !== 'undefined' ? globalThis : this, function (VP3) {
  'use strict';
  if (!VP3) throw new Error('Reels requires the shared VP3 model.');

  var catalog = VP3.demoRides.concat(VP3.realRides);
  var allowed = {
    demo: new Set(VP3.demoRides.map(function (ride) { return ride.id; })),
    real: new Set(VP3.realRides.map(function (ride) { return ride.id; }))
  };
  var money = function (value) { return new Intl.NumberFormat('ru-RU').format(value) + ' ֏'; };
  var hasPrice = function (value) { return typeof value === 'number' && Number.isFinite(value) && value >= 0; };
  function resolve(ride) {
    return typeof ride === 'string' ? catalog.find(function (item) { return item.id === ride; }) : ride;
  }
  function rulesFor(ride) {
    return ride && ride.fictional && ride.rules && VP3.admissionRules[ride.id] || null;
  }
  function pairPrice(ride, rule) {
    return hasPrice(ride.price) && hasPrice(rule.adultPrice) ? money(ride.price + rule.adultPrice) : null;
  }
  function facts(input) {
    var ride = resolve(input), rule = rulesFor(ride), lines = [], cardLines = [];
    var generated = !!(ride && typeof ride.photo === 'string' && ride.photo.indexOf('/photos-r17/') >= 0);
    var result = {
      price: ride && hasPrice(ride.price) ? money(ride.price) + ' за человека за одно катание' : 'Стоимость уточняется',
      lines: lines,
      cardLines: cardLines,
      source: ride && ride.photo ? 'Изображение для демо · ИИ' : 'Изображение не указано',
      disclaimer: ride && ride.fictional
        ? 'Учебные цены и условия. Лайк не подтверждает допуск; настоящие правила уточните у парка.'
        : 'Действующие условия, стоимость и работу аттракциона уточните у парка. Лайк не подтверждает допуск.'
    };
    if (!rule) {
      lines.push('Возраст и рост: условия допуска уточняются.');
      lines.push('Сопровождение и полная стоимость: уточняются.');
      cardLines.push('Возраст и рост: допуск уточняется', 'Сопровождение и полная цена уточняются');
      return result;
    }
    var height = ride.rules;
    lines.push('Возраст: ' + (rule.maxAge === null ? 'от ' + rule.minAge : rule.minAge + '-' + rule.maxAge) + ' лет.');
    lines.push('Рост: ' + height.min + '-' + height.max + ' см.');
    cardLines.push((rule.maxAge === null ? 'От ' + rule.minAge : rule.minAge + '-' + rule.maxAge) + ' лет · рост ' + height.min + '-' + height.max + ' см');
    var accompaniedByAge = rule.soloAge > rule.minAge;
    var accompaniedByHeight = height.soloMin > height.min;
    if (accompaniedByAge || accompaniedByHeight) {
      var adultMin = Math.max(height.min, height.companionMin);
      var adultMax = Math.min(height.max, height.companionMax);
      lines.push('Ребёнку самостоятельно: с ' + rule.soloAge + ' лет и от ' + height.soloMin + ' см, в пределах указанного возраста и роста.');
      var conditions = [];
      if (accompaniedByAge) conditions.push('до ' + rule.soloAge + ' лет');
      if (accompaniedByHeight) conditions.push('при росте ниже ' + height.soloMin + ' см');
      lines.push('Только со взрослым 18+: ' + conditions.join(' или ') + '. Рост взрослого: ' + adultMin + '-' + adultMax + ' см.');
      if (height.companionRatio === 1) lines.push('Один взрослый сопровождает одного ребёнка за одно совместное катание.');
      var pair = pairPrice(ride, rule);
      lines.push(pair
        ? 'Ребёнок + взрослый: ' + pair + ' за одно совместное катание по двум разовым билетам. Билет взрослого: ' + money(rule.adultPrice) + '.'
        : 'Катание взрослого оплачивается. Полная стоимость совместного катания уточняется.');
      cardLines.push('Ребёнку самостоятельно: с ' + rule.soloAge + ' лет и от ' + height.soloMin + ' см');
      var cardConditions = [];
      if (accompaniedByAge) cardConditions.push('до ' + rule.soloAge + ' лет');
      if (accompaniedByHeight) cardConditions.push('ниже ' + height.soloMin + ' см');
      cardLines.push('В пределах допуска: ребёнку ' + cardConditions.join(' или ') + ' нужен взрослый 18+ (' + adultMin + '-' + adultMax + ' см)');
      cardLines.push(pair ? 'Вдвоём: ' + pair + ' за одно катание по двум разовым билетам' : 'Катание взрослого платное; полная цена уточняется');
    } else {
      lines.push('Самостоятельно в пределах указанного возраста и роста.');
      cardLines.push('Самостоятельно в пределах указанного возраста и роста');
    }
    return result;
  }

  function familyStatus(input, party) {
    var ride = resolve(input), rule = rulesFor(ride);
    return (Array.isArray(party) ? party : []).filter(function (person) { return person && typeof person === 'object'; }).map(function (person) {
      var admission = VP3.admission(ride, person);
      var text = admission.reasons.join(' ');
      if (admission.needsCompanion && admission.status !== 'blocked' && rule) {
        var pair = pairPrice(ride, rule);
        text += pair
          ? ' Ребёнок + взрослый: ' + pair + ' по двум разовым билетам. Уже купленные права учтём при выборе билетов.'
          : ' Полная цена с оплачиваемым сопровождением уточняется.';
      }
      return {
        id: person.id,
        label: typeof person.label === 'string' && person.label.trim() ? person.label : person.role === 'adult' ? 'Взрослый' : 'Ребёнок',
        status: admission.status,
        text: text
      };
    });
  }

  function patchSelection(raw, mode, id, selected) {
    if (mode !== 'real' && mode !== 'demo') throw new RangeError('Unknown selection mode.');
    var source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : VP3.emptyState();
    var selections = source.selections && typeof source.selections === 'object' && !Array.isArray(source.selections) ? source.selections : {};
    var target = Array.isArray(selections[mode]) ? selections[mode] : [];
    target = Array.from(new Set(target.filter(function (value) { return allowed[mode].has(value); })));
    if (allowed[mode].has(id)) {
      if (selected === true && !target.includes(id)) target.push(id);
      else if (selected === false) target = target.filter(function (value) { return value !== id; });
    }
    // Copy only the path being changed. Untouched values retain their exact shape,
    // including fields unknown to VP3, pending orders and historical cart lines.
    return { ...source,
      mode: mode,
      selections: { ...selections, [mode]: target }
    };
  }

  return Object.freeze({ facts: facts, familyStatus: familyStatus, patchSelection: patchSelection });
}));
