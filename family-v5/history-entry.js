// Make the home history link useful for both first visits and existing orders.
(function(){
 if(location.hash!=='#purchase-history')return;
 let first=true;
 function showHistory(){
  const app=document.getElementById('app');if(!app||document.querySelector('#result-heading'))return;
  let history=document.getElementById('purchase-history');
  if(!history){history=document.createElement('section');history.id='purchase-history';history.className='quick-order';history.innerHTML='<h2>Мои покупки</h2><p>Здесь пока нет покупок. После демо-оплаты ваши заказы появятся в этом браузере.</p><a class="btn btn-primary" href="quick.html">Выбрать билеты</a>';app.prepend(history);}
  if(history.tagName==='DETAILS')history.open=true;
  if(first){first=false;history.setAttribute('tabindex','-1');requestAnimationFrame(()=>{history.scrollIntoView({block:'start'});history.focus({preventScroll:true});});}
 }
 document.addEventListener('vp:catalog-rendered',showHistory);showHistory();
})();
