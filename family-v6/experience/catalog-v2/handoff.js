(() => {
  'use strict';
  const catalog=window.VPCatalog, target=document.getElementById('saved-attractions');
  if(!catalog||!target)return;
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render(){
    const selected=new Set(catalog.getSaved());
    const rides=catalog.rides.filter(r=>selected.has(r.id));
    target.innerHTML=rides.length?rides.map(r=>`<article class="saved-ride"><a href="attractions.html?ride=${encodeURIComponent(r.id)}"><img src="${escape(r.photo.replace('-780.webp','-390.webp'))}" alt="${escape(r.name)}" width="120" height="90" loading="lazy"><span><strong>${escape(r.name)}</strong><small>Описание и условия ↗</small></span></a><button type="button" data-remove-saved="${escape(r.id)}" aria-label="Убрать из сохранённого: ${escape(r.name)}">×</button></article>`).join(''):'<div class="saved-empty"><p>Пока ничего не сохранено.</p><p class="helper">Посмотрите фотографии и отметьте то, что хочется попробовать. Для просмотра билетов список не нужен.</p><a class="btn btn-outline" data-vp-cta="secondary" href="attractions.html">Посмотреть аттракционы ↗</a></div>';
    document.getElementById('saved-heading').textContent='Ваши сохранения'+(rides.length?' · '+rides.length:'');
    document.getElementById('saved-warning').textContent=catalog.isPersistent()?'Это список интересного, не заказ и не подтверждение допуска.':'Браузер не сохраняет выбор. При переходе или обновлении страницы он может потеряться.';
  }
  target.addEventListener('click',e=>{const b=e.target.closest('[data-remove-saved]');if(b){catalog.toggle(b.dataset.removeSaved);document.getElementById('saved-heading').setAttribute('tabindex','-1');document.getElementById('saved-heading').focus({preventScroll:true});}});
  window.addEventListener('vp:catalog-change',render);
  const type=new URLSearchParams(location.search).get('type');
  if(['single','package','unlimited'].includes(type))document.getElementById('demo-purchase-link').href='demo-purchase.html?type='+type;
  render();
})();
