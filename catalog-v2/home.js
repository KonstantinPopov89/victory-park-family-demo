'use strict';
(() => {
  const dialog = document.querySelector('#detail-dialog');
  if (!dialog) return;
  const experiences = {
    wheel: {title: 'Ближе к небу', copy: 'Колесо обозрения: другой ракурс для вашей прогулки и момент, который хочется разделить.', note: 'Доступность аттракциона, часы работы и правила допуска уточните в парке перед поездкой.', ride: 'wheel-of-happiness'},
    boats: {title: 'Маленькое приключение', copy: 'Лодки в форме лебедей, вода и зелень вокруг. Идея для той части дня, когда хочется немного замедлиться.', note: 'Правила допуска детей и сопровождения уточните в парке. Фото не заменяет действующие ограничения.', ride: 'water-swan'},
    cars: {title: 'Ещё один круг!', copy: 'Автодром: выбрать машинку, взять руль и добавить в прогулку немного азарта.', note: 'Ограничения по росту, сопровождению и действующие условия катания уточните перед визитом.', ride: 'autodrom'}
  };
  let opener = null;
  function showDetail(data, eyebrow, button) {
    opener = button;
    document.querySelector('#dialog-eyebrow').textContent = eyebrow;
    document.querySelector('#dialog-title').textContent = data.title;
    document.querySelector('#dialog-copy').textContent = data.copy;
    document.querySelector('#dialog-note').textContent = data.note;
    const link = document.querySelector('#dialog-primary');
    link.href = data.ride ? 'attractions.html?ride=' + encodeURIComponent(data.ride) : 'attractions.html';
    link.textContent = data.ride ? 'Открыть в каталоге ↗' : 'Открыть каталог ↗';
    dialog.showModal();
    document.body.classList.add('dialog-open');
  }
  document.querySelectorAll('[data-experience]').forEach(button => {
    button.addEventListener('click', () => showDetail(experiences[button.dataset.experience], 'Впечатления в парке', button));
  });
  dialog.querySelectorAll('[data-close-dialog], .dialog-close').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    if (opener?.isConnected) opener.focus({preventScroll: true});
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  document.querySelector('[data-about]')?.addEventListener('click', event => showDetail({
    title: 'Как смотреть демо',
    copy: 'Сначала посмотрите настоящие аттракционы и сохраните интересное. Покупку можно проверить отдельно на учебных примерах. Сохранённое доступно в этой версии сайта в том же браузере.',
    note: 'Фотографии показывают настоящий парк. Расчёт покупки работает на отдельном учебном наборе с вымышленными ценами и правилами. Настоящие платежи не принимаются, действительные билеты не выдаются.'
  }, 'Демонстрационный сайт', event.currentTarget));
})();
