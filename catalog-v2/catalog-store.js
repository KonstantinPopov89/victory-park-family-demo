/* The real catalogue is an informational shortlist, separate from demo orders. */
(() => {
  'use strict';
  const KEY = 'vp.catalog.v2.saved';
  const source = 'https://parkvictory.am/ru/attractions';
  const rows = [
    ['wheel-of-happiness', 'Колесо счастья', 'Колесо обозрения', 'Колесо обозрения с закрытыми кабинками.'],
    ['water-swan', 'Плавающий лебедь', 'На воде', 'Лодки в форме лебедей, вода и зелень вокруг.'],
    ['autodrom', 'Автодром', 'За рулём', 'Машинки с рулём на общей площадке.'],
    ['mars-ride', 'Полет на Марс', 'Кресла на рычагах', 'Открытые кресла на высоких рычагах.'],
    ['planet', 'Планета', 'Самолётики', 'Яркие самолётики вокруг центральной башни.'],
    ['moto-ufo', 'Мощный НЛО', 'Круглая платформа', 'Круглая платформа с креслами на изогнутом рельсе.'],
    ['pendulum', 'Метроном', 'Кресла на подвесе', 'Кресла по кругу на большом подвесе.'],
    ['rotating-tower', 'Вращающаяся башня', 'Высокая башня', 'Круг кресел вокруг высокой башни.'],
    ['rocket', 'Космический корабль', 'Космические корабли', 'Места в разноцветных космических кораблях.'],
    ['VR-cinema', 'Виртуальная реальность', 'VR-очки', 'VR-очки и ряд кресел в помещении.'],
    ['VR-for-2', 'Виртуальное путешествие', 'VR-очки', 'VR-очки и два соседних кресла.']
  ];
  const rides = Object.freeze(rows.map(([id, name, kind, description]) => Object.freeze({
    id, name, kind, description, photo: `assets/${id}.webp`, source,
    rules: null, price: null, ageRange: null, intensity: null, operation: 'unknown'
  })));
  const ids = new Set(rides.map(ride => ride.id));
  let saved = [], persistent = true, error = '';
  function sanitize(value) {
    return Array.isArray(value) ? [...new Set(value.filter(id => typeof id === 'string' && ids.has(id)))] : [];
  }
  function read(value) {
    if (!value) return [];
    try { return sanitize(JSON.parse(value)); }
    catch { error = 'Не удалось прочитать прежний список этой версии. Можно сохранить аттракционы заново.'; return []; }
  }
  try { saved = read(localStorage.getItem(KEY)); }
  catch { persistent = false; error = 'Браузер не разрешает сохранение. Список доступен только на этой странице и пропадёт при обновлении или переходе.'; }
  function announceChange() { window.dispatchEvent(new CustomEvent('vp:catalog-change')); }
  function toggle(id) {
    if (!ids.has(id)) return false;
    if (persistent) {
      try { saved = read(localStorage.getItem(KEY)); }
      catch { persistent = false; }
    }
    const selected = !saved.includes(id);
    saved = selected ? [...saved, id] : saved.filter(item => item !== id);
    if (persistent) {
      try { localStorage.setItem(KEY, JSON.stringify(saved)); error = ''; }
      catch { persistent = false; }
    }
    if (!persistent) error = 'Браузер не разрешает сохранение. Список доступен только на этой странице и пропадёт при обновлении или переходе.';
    announceChange();
    return selected;
  }
  window.addEventListener('storage', event => {
    if (event.key !== KEY || !persistent) return;
    saved = read(event.newValue);
    announceChange();
  });
  window.VPCatalog = Object.freeze({ rides, getSaved: () => saved.slice(), toggle,
    isPersistent: () => persistent, getError: () => error });
})();
