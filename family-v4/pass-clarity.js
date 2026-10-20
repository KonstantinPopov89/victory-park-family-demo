/* Product explanation and navigation draft only. Cart/order contracts and prices stay native. */
(() => {
  'use strict';
  const base = new URL('.', document.currentScript.src).pathname;
  const copy = {
    ru: {
      title: 'Выберите состав безлимита', intro: 'Три учебных аттракциона или вариант по каталогу парка. Цена зависит от состава и правил получения.',
      a: 'Безлимит на 3 аттракциона', b: 'Безлимит по каталогу парка',
      aTag: 'Учебный пример', bTag: 'Онлайн-вариант',
      aShort: '3 учебных аттракциона. 5 900 ֏ за человека, учебная цена.',
      bShort: '31 позиция каталога. 9 900 ֏ за браслет; онлайн-условия не подтверждены.',
      aStatus: 'Цена и условия вымышлены для демонстрации покупки. Это не действующий тариф парка.',
      bStatus: 'Цена по данным кассы с 29.08.2026. Состав по наблюдениям 02.08-14.10.2026. Действующие и онлайн-условия требуют подтверждения парка и Lime.',
      aRides: ['Детский паровозик', 'Американские горки', 'Чайные чашки'],
      aIncludes: 'Только эти три учебных аттракциона, повторы без ограничения.',
      bIncludes: '31 позиция с пометкой «входит в безлимит». Это не обещание, что все аттракционы открыты или подходят каждому.',
      aExcludes: 'Остальные аттракционы не входят, в том числе Детская карусель и Цепочная карусель.',
      bExcludes: 'Не входят: Дино Парк, тиры, игровые автоматы, VR на двоих и Dark VR.',
      aTime: 'Один день первого использования. Дату при покупке не выбирают. Учебное условие.',
      bTime: 'Дневной браслет. В описании: 5 минут между сканированиями, для VR 30 минут. Эти правила ещё должен подтвердить парк.',
      aUse: 'После демо-оплаты код обменивается в демонстрационной кассе на личный носитель. Передать другому нельзя. Приоритетной очереди нет.',
      bUse: 'В этом онлайн-варианте указывают номер карты и количество браслетов. Браслет получают на кассе по номеру операции. Реальная выдача не подключена.',
      aAdult: 'Если ребёнку требуется сопровождение, взрослому нужен свой безлимит. Один взрослый сопровождает детей по очереди.',
      bAdult: 'Правило оплаты сопровождающего пока не подтверждено. Уточните у парка.',
      compare: '3 или 31: сравнить состав', full: 'Все различия и состав', composition: 'Что входит', exclusions: 'Что не входит', time: 'Срок и использование', companion: 'Сопровождение',
      chooseA: 'Выбрать учебный вариант за 5 900 ֏', chooseB: 'Открыть вариант за 9 900 ֏',
      viewCatalog: 'Состав в каталоге', all31: 'Все 31 позиции каталога', saved: 'Переход к другому варианту не очищает текущий заказ. У каждого варианта своя покупка.',
      demo: 'Оба пути демонстрационные: деньги не списываются, образцы не дают права прохода. Допуск и работу аттракционов проверяют отдельно.',
      home: 'Главная', tickets: 'Билеты', back: 'Назад к выбору', buyB: 'Выбрать браслеты по каталогу', preA: 'В заказе:', preB: 'Вы выбрали:'
    },
    en: {
      title: 'Choose what your pass includes', intro: 'Three demo rides or an option based on the park catalogue. Each has its own coverage and collection rules.',
      a: '3-ride unlimited pass', b: 'Park catalogue pass',
      aTag: 'Teaching example', bTag: 'Online proposal',
      aShort: '3 demo rides. 5,900 ֏ per person, a fictional price.',
      bShort: '31 catalogue entries. 9,900 ֏ per wristband; online terms are unconfirmed.',
      aStatus: 'The price and terms are fictional examples of the purchase flow. This is not a current park tariff.',
      bStatus: 'Price observed in cash-desk data from 29 August 2026. Coverage based on 2 August to 14 October 2026 records. Current and online terms need park and Lime confirmation.',
      aRides: ['Children’s train', 'Roller coaster', 'Teacups'],
      aIncludes: 'Unlimited repeats on these three demo rides only.',
      bIncludes: '31 entries marked as included. This does not mean every ride is open or suitable for every guest.',
      aExcludes: 'All other rides are excluded, including the Children’s carousel and Chain carousel.',
      bExcludes: 'Excluded: Dino Park, shooting galleries, arcade machines, VR for two and Dark VR.',
      aTime: 'The day of first use. No date is selected at checkout. This is a demo rule.',
      bTime: 'A daily wristband. The description specifies 5 minutes between scans, or 30 minutes for VR. The park still needs to confirm these rules.',
      aUse: 'After demo payment, exchange the code at the demo cash desk for a personal pass. Non-transferable. No priority queue.',
      bUse: 'This online proposal asks for a card number and wristband quantity. Collect wristbands at the cash desk using the operation number. Live collection is not connected.',
      aAdult: 'When a child needs accompaniment, the adult needs their own pass. One adult accompanies children in turn.',
      bAdult: 'The accompanying adult’s payment rule is unconfirmed. Ask the park.',
      compare: '3 or 31: compare coverage', full: 'Full comparison and coverage', composition: 'Included', exclusions: 'Excluded', time: 'Validity and use', companion: 'Accompanying adults',
      chooseA: 'Choose the 5,900 ֏ demo option', chooseB: 'Open the 9,900 ֏ option',
      viewCatalog: 'Coverage in the catalogue', all31: 'All 31 catalogue entries', saved: 'Opening the other option keeps your current order. Each option has its own purchase flow.',
      demo: 'Both flows are demonstrations: no money is charged and samples do not grant admission. Ride operation and eligibility are checked separately.',
      home: 'Home', tickets: 'Tickets', back: 'Back to selection', buyB: 'Choose catalogue wristbands', preA: 'In your order:', preB: 'You selected:'
    },
    hy: {
      title: 'Ընտրեք՝ ինչ է ներառում փաթեթը', intro: 'Երեք ուսումնական ատրակցիոն կամ այգու ցանկի տարբերակը։ Դրանց կազմն ու ստացման պայմանները տարբեր են։',
      a: '3 ատրակցիոնի անսահմանափակ փաթեթ', b: 'Այգու ցանկի անսահմանափակ փաթեթ',
      aTag: 'Ուսումնական օրինակ', bTag: 'Առցանց տարբերակ',
      aShort: '3 ուսումնական ատրակցիոն։ Մեկ անձի համար՝ 5 900 ֏, պայմանական գին։',
      bShort: 'Ցանկի 31 ծառայություն։ Մեկ ապարանջանը՝ 9 900 ֏։ Առցանց պայմանները հաստատված չեն։',
      aStatus: 'Գինն ու պայմանները հորինված են՝ գնման ընթացքը ցուցադրելու համար։ Սա այգու գործող սակագինը չէ։',
      bStatus: 'Գինը՝ ըստ 2026 թ. օգոստոսի 29-ից դրամարկղի տվյալների։ Կազմը՝ ըստ 2026 թ. օգոստոսի 2-ից հոկտեմբերի 14-ի տվյալների։ Գործող և առցանց պայմանները պետք է հաստատեն այգին ու Lime-ը։',
      aRides: ['Մանկական գնացք', 'Ամերիկյան բլուրներ', 'Թեյի բաժակներ'],
      aIncludes: 'Միայն այս երեք ուսումնական ատրակցիոնները՝ առանց կրկնությունների սահմանափակման։',
      bIncludes: 'Ցանկի 31 ծառայություն՝ «ներառված է» նշումով։ Սա չի նշանակում, որ բոլոր ատրակցիոններն աշխատում են կամ հարմար են բոլորին։',
      aExcludes: 'Մյուս ատրակցիոնները ներառված չեն, այդ թվում՝ մանկական և շղթայական կարուսելները։',
      bExcludes: 'Չեն ներառվում՝ Դինո Պարկը, հրաձգարանները, խաղային ավտոմատները, VR-ը երկուսի համար և Dark VR-ը։',
      aTime: 'Գործում է առաջին օգտագործման օրը։ Գնելիս ամսաթիվ չեք ընտրում։ Սա ուսումնական պայման է։',
      bTime: 'Մեկ օրվա ապարանջան։ Նկարագրության համաձայն՝ սկանավորումների միջև 5 րոպե է, VR-ի համար՝ 30 րոպե։ Այգին դեռ պետք է հաստատի այս կանոնները։',
      aUse: 'Ցուցադրական վճարումից հետո կոդը ցուցադրական դրամարկղում փոխանակվում է անձնական կրիչի հետ։ Այն ուրիշին փոխանցել չի կարելի։ Հերթի առավելություն չկա։',
      bUse: 'Այս առցանց տարբերակում նշվում են քարտի համարը և ապարանջանների քանակը։ Ապարանջանը ստանում եք դրամարկղում՝ գործարքի համարով։ Իրական տրամադրումը միացված չէ։',
      aAdult: 'Եթե երեխային ուղեկցող է պետք, մեծահասակն իր փաթեթը պետք է ունենա։ Մեկ մեծահասակ երեխաներին ուղեկցում է հերթով։',
      bAdult: 'Ուղեկցողի վճարման կանոնը դեռ հաստատված չէ։ Ճշտեք այգում։',
      compare: '3 թե՞ 31․ համեմատել կազմը', full: 'Ամբողջ համեմատությունն ու կազմը', composition: 'Ինչ է ներառվում', exclusions: 'Ինչ չի ներառվում', time: 'Ժամկետն ու օգտագործումը', companion: 'Ուղեկցում',
      chooseA: 'Ընտրել 5 900 ֏ ուսումնական տարբերակը', chooseB: 'Բացել 9 900 ֏ տարբերակը',
      viewCatalog: 'Կազմը՝ ատրակցիոնների ցանկում', all31: 'Ցանկի բոլոր 31 ծառայությունները', saved: 'Մյուս տարբերակը բացելիս ընթացիկ պատվերը պահպանվում է։ Յուրաքանչյուր տարբերակ ունի իր գնման ընթացքը։',
      demo: 'Երկու ընթացքն էլ ցուցադրական են․ գումար չի գանձվում, իսկ նմուշները մուտքի իրավունք չեն տալիս։ Աշխատանքն ու թույլատրելիությունը ստուգվում են առանձին։',
      home: 'Գլխավոր', tickets: 'Տոմսեր', back: 'Վերադառնալ ընտրությանը', buyB: 'Ընտրել ցանկի ապարանջանները', preA: 'Պատվերում՝', preB: 'Ընտրել եք՝'
    }
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const locale = () => ['ru','en','hy'].includes(document.documentElement.lang) ? document.documentElement.lang : 'ru';
  const url = (kind, lang) => kind === 'a'
    ? base + 'experience/family-v3/quick.html?product=unlimited&lang=' + lang
    : kind === 'b' ? base + lang + '/unlimited/?passReturn=1#buy'
    : base + lang + '/passes/';
  function card(kind, lang, full) {
    const c = copy[lang], a = kind === 'a';
    const rides = a ? c.aRides : (window.VP?.attr || []).filter(r => r.unl).map(r => r.name);
    const list = a ? '<ul>' + rides.map(r => '<li>' + esc(r) + '</li>').join('') + '</ul>'
      : full && rides.length ? '<details class="vp-pass-included"><summary>' + c.all31 + '</summary><ul>' + rides.map(r => '<li>' + esc(r) + '</li>').join('') + '</ul></details>'
      : '<a href="' + base + lang + '/attractions/?filter=unl">' + c.viewCatalog + '</a>';
    return '<article class="vp-pass-card" data-pass-option="' + kind + '"><span class="vp-pass-tag">' + c[kind+'Tag'] + '</span><h3>' + c[kind] + '</h3><strong class="vp-pass-price">' + (a ? '5 900' : '9 900') + ' ֏</strong><p>' + c[kind+'Status'] + '</p><h4>' + c.composition + '</h4><p>' + c[kind+'Includes'] + '</p>' + list + '<h4>' + c.exclusions + '</h4><p>' + c[kind+'Excludes'] + '</p><h4>' + c.time + '</h4><p>' + c[kind+'Time'] + '</p><p>' + c[kind+'Use'] + '</p><h4>' + c.companion + '</h4><p>' + c[kind+'Adult'] + '</p><a class="vp-pass-choose" data-pass-choice="' + kind + '" href="' + url(kind,lang) + '">' + (a ? c.chooseA : c.chooseB) + '</a></article>';
  }
  function markup(kind, lang, stage) {
    const c=copy[lang];
    return '<p class="vp-pass-summary">' + (stage === 'payment' ? '<strong>' + c[kind==='a'?'preA':'preB'] + '</strong> ' : '') + c[kind+'Short'] + '</p><details class="vp-pass-details"><summary>' + c.compare + '</summary><div class="vp-pass-compare">' + card('a',lang,false) + card('b',lang,false) + '</div><p class="vp-pass-saved">' + c.saved + '</p><p class="vp-pass-demo">' + c.demo + '</p><a class="vp-pass-full" href="' + url('compare',lang) + '">' + c.full + ' ↗</a></details>';
  }
  function mount(host, kind, stage, before) {
    if (!host) return;
    const lang=locale(), key=kind+':'+stage+':'+lang;
    let el=[...host.children].find(e=>e.classList.contains('vp-pass-context') && e.dataset.passStage===stage);
    if(!el){el=document.createElement('aside');el.className='vp-pass-context';el.dataset.passStage=stage;el.dataset.i18nSkip='';if(before)host.insertBefore(el,before);else host.append(el);}
    if(el.dataset.passKey!==key){el.dataset.passKey=key;el.dataset.passProduct=kind;el.innerHTML=markup(kind,lang,stage);}
  }
  function name(el, value) {
    if(!el)return;
    el.dataset.i18nSkip='';
    if(el.textContent!==value)el.textContent=value;
  }
  function update() {
    const lang=locale(), c=copy[lang], surface=document.body.dataset.passSurface;
    if(surface==='compare'){
      const host=document.querySelector('[data-pass-comparison]');
      if(host && host.dataset.passLanguage!==lang){host.dataset.i18nSkip='';host.dataset.passLanguage=lang;host.innerHTML='<h1>'+c.title+'</h1><p class="vp-pass-intro">'+c.intro+'</p><div class="vp-pass-compare">'+card('a',lang,true)+card('b',lang,true)+'</div><p class="vp-pass-saved">'+c.saved+'</p><p class="vp-pass-demo">'+c.demo+'</p>';}
      return;
    }
    if(surface==='a'){
      const product=document.getElementById('product-unlimited');
      name(product?.querySelector('h2,h3'),c.a);
      if(product)mount(product,'a','selection',product.querySelector('.quantity-choice,.purchase-people'));
      // Marked draft cart groups only. Paid receipts and historical ticket names are untouched.
      const group=document.querySelector('#cart .cart-group[data-product="unlimited"]');
      name(group?.querySelector('h3'),c.a);
      const cart=document.getElementById('cart');
      if(group)mount(cart,'a','payment',cart.querySelector('#checkout-errors') || cart.querySelector('#review-action'));
      return;
    }
    if(surface==='b-unlimited') {
      name(document.querySelector('main h1'),c.b);
      const title=document.getElementById('unl-h');
      if(title && !title.dataset.passNamed){title.dataset.passNamed='1';title.dataset.i18nSkip='';title.innerHTML=esc(c.b)+' · <span class="num">9 900 ֏</span>';}
      const form=document.querySelector('[data-payform][data-product="unlimited"]');
      name(form?.querySelector('h3'),c.buyB);
      mount(form,'b','payment',form?.querySelector('.consent'));
    }
    if(surface?.startsWith('b-')){
      const host=document.querySelector('[data-pass-entry]');
      if(host)mount(host,'b','selection');
      for(const link of document.querySelectorAll('[data-cta="wtb-unlimited"]')){
        const tile=link.closest('.tile');
        const heading=tile?.querySelector('h3');
        if(heading && !heading.dataset.passNamed){heading.dataset.passNamed='1';heading.innerHTML=esc(c.b)+' · <span class="num">9 900 ֏</span>';}
      }
    }
  }
  const draftKey='vp.pass-clarity.b-draft.v1';
  function rememberForm() {
    const form=document.querySelector('[data-payform][data-product="unlimited"]');
    if(!form)return;
    const qty=Number(form.querySelector('[data-qty-out]')?.textContent), card=form.querySelector('[data-card]')?.value||'';
    if(!Number.isInteger(qty)||qty<1||qty>10)return;
    try{
      sessionStorage.setItem(draftKey,JSON.stringify({qty,card:card.replace(/\D/g,'').slice(0,16)}));
      history.replaceState({...history.state,vpPassClarityReturn:true},'',location.href);
    }catch{}
  }
  function restoreForm() {
    const params=new URLSearchParams(location.search);
    if(params.get('passReturn')!=='1'&&!history.state?.vpPassClarityReturn)return;
    const form=document.querySelector('[data-payform][data-product="unlimited"]');
    if(!form)return;
    let draft;try{draft=JSON.parse(sessionStorage.getItem(draftKey)||'null');}catch{}
    if(draft && Number.isInteger(draft.qty) && draft.qty>=1 && draft.qty<=10){
      const current=Number(form.querySelector('[data-qty-out]')?.textContent);
      if(Number.isInteger(current)&&current>=1&&current<=10){
        const step=form.querySelector('[data-qty="'+(draft.qty>=current?'1':'-1')+'"]');
        for(let i=0;i<Math.abs(draft.qty-current);i++)step?.click();
      }
      const card=form.querySelector('[data-card]');
      if(card && typeof draft.card==='string' && /^\d{0,16}$/.test(draft.card)){
        card.value=draft.card;card.dispatchEvent(new Event('input',{bubbles:true}));
      }
      try{sessionStorage.removeItem(draftKey);}catch{}
    }
    params.delete('passReturn');
    try{const next={...history.state};delete next.vpPassClarityReturn;history.replaceState(next,'',location.pathname+(params.size?'?'+params.toString():'')+location.hash);}catch{}
  }
  document.addEventListener('click',e=>{
    const link=e.target.closest('.vp-pass-context a');
    if(link)rememberForm();
  },true);
  document.addEventListener('submit',e=>{
    if(e.target.matches('[data-payform][data-product="unlimited"]'))try{
      sessionStorage.removeItem(draftKey);const next={...history.state};delete next.vpPassClarityReturn;history.replaceState(next,'',location.href);
    }catch{}
  });
  window.addEventListener('pageshow',e=>{if(e.persisted)restoreForm();});
  let scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;update();});}
  document.addEventListener('vp:catalog-rendered',update);
  document.addEventListener('vp:language',update);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  function start(){restoreForm();update();new MutationObserver(schedule).observe(document.querySelector('main')||document.body,{childList:true,subtree:true});}
})();
