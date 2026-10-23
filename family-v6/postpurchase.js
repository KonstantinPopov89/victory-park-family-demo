/* Shared demo ticket presentation. No payment, delivery or Wallet issuer integration. */
(function () {
  'use strict';
  const D = document;
  const words = {
    sample: ['Образец', 'Sample', 'Նմուշ'],
    demo: ['Демо-QR не действует для прохода', 'Demo QR is not valid for admission', 'Դեմո QR-ը մուտքի համար վավեր չէ'],
    choose: ['Билеты в покупке', 'Tickets in this purchase', 'Այս գնման տոմսերը'],
    save: ['Сохранить все билеты', 'Save all tickets', 'Պահպանել բոլոր տոմսերը'],
    saveReceipt: ['Сохранить квитанцию', 'Save receipt', 'Պահպանել անդորրագիրը'],
    saveHint: ['Один файл, который открывается без интернета.', 'One file that opens offline.', 'Մեկ ֆայլ, որը բացվում է առանց ինտերնետի։'],
    wallet: ['Макеты Wallet', 'Wallet previews', 'Wallet-ի նախադիտում'],
    apple: ['Посмотреть макет Apple Wallet', 'Preview Apple Wallet card', 'Դիտել Apple Wallet-ի քարտի նմուշը'],
    google: ['Посмотреть макет Google Wallet', 'Preview Google Wallet card', 'Դիտել Google Wallet-ի քարտի նմուշը'],
    walletNote: ['Это макет. Карта не добавляется в Wallet.', 'This is a preview. No card is added to Wallet.', 'Սա նմուշ է։ Քարտը չի ավելացվում Wallet-ին։'],
    enlarge: ['Увеличить QR', 'Enlarge QR', 'Մեծացնել QR-ը'],
    close: ['Закрыть', 'Close', 'Փակել'],
    code: ['Код вручную', 'Manual code', 'Կոդը՝ ձեռքով'],
    copy: ['Скопировать код', 'Copy code', 'Պատճենել կոդը'],
    copied: ['Код скопирован', 'Code copied', 'Կոդը պատճենված է'],
    copyError: ['Не удалось скопировать. Выделите код и скопируйте вручную.', 'Could not copy. Select the code and copy it manually.', 'Չհաջողվեց պատճենել։ Ընտրեք կոդը և պատճենեք ձեռքով։'],
    send: ['Отправить себе', 'Send myself a copy', 'Ուղարկել պատճենը ինձ'],
    contact: ['Email или телефон', 'Email or phone', 'Էլ. փոստ կամ հեռախոս'],
    optional: ['Необязательно. В демо ничего не отправляется, контакт не записывается в заказ.', 'Optional. This demo sends nothing and does not add your contact to the order.', 'Պարտադիր չէ։ Դեմոն ոչինչ չի ուղարկում և ձեր կոնտակտը չի գրանցում պատվերում։'],
    placeholder: ['name@example.com или +374…', 'name@example.com or +374…', 'name@example.com կամ +374…'],
    contactHint: ['Для телефона укажите код страны, например +374 или +7.', 'Include the country code, for example +374 or +7.', 'Հեռախոսի համար նշեք երկրի կոդը, օրինակ՝ +374 կամ +7։'],
    sendDemo: ['Проверить отправку копии', 'Try sending a copy', 'Փորձարկել պատճենի ուղարկումը'],
    emailOK: ['Демо: копия всех готовых билетов подготовлена для email. Письмо не отправлено.', 'Demo: a copy of all ready tickets is prepared for email. No email was sent.', 'Դեմո․ բոլոր պատրաստ տոմսերի պատճենը պատրաստ է էլ. փոստի համար։ Նամակ չի ուղարկվել։'],
    phoneOK: ['Демо: копия всех готовых билетов подготовлена для SMS. Сообщение не отправлено.', 'Demo: a copy of all ready tickets is prepared for SMS. No message was sent.', 'Դեմո․ բոլոր պատրաստ տոմսերի պատճենը պատրաստ է SMS-ի համար։ Հաղորդագրություն չի ուղարկվել։'],
    receiptEmailOK: ['Демо: копия квитанции подготовлена для email. Письмо не отправлено.', 'Demo: the receipt copy is prepared for email. No email was sent.', 'Դեմո․ անդորրագրի պատճենը պատրաստ է էլ. փոստի համար։ Նամակ չի ուղարկվել։'],
    receiptPhoneOK: ['Демо: копия квитанции подготовлена для SMS. Сообщение не отправлено.', 'Demo: the receipt copy is prepared for SMS. No message was sent.', 'Դեմո․ անդորրագրի պատճենը պատրաստ է SMS-ի համար։ Հաղորդագրություն չի ուղարկվել։'],
    contactError: ['Введите email или телефон с кодом страны.', 'Enter an email address or a phone number with country code.', 'Մուտքագրեք էլ. փոստի հասցե կամ հեռախոսահամար՝ երկրի կոդով։'],
    sendError: ['Демо: отправка не удалась. Проверьте контакт и повторите. Билеты остаются доступны.', 'Demo: sending failed. Check your contact and retry. Your tickets remain available.', 'Դեմո․ ուղարկումը չհաջողվեց։ Ստուգեք կոնտակտը և կրկնեք։ Տոմսերը հասանելի են։'],
    receiptSendError: ['Демо: отправка не удалась. Проверьте контакт и повторите. Квитанция остаётся доступна.', 'Demo: sending failed. Check your contact and retry. Your receipt remains available.', 'Դեմո․ ուղարկումը չհաջողվեց։ Ստուգեք կոնտակտը և կրկնեք։ Անդորրագիրը հասանելի է։'],
    demoControls: ['Проверить ошибку отправки', 'Test a delivery error', 'Փորձարկել ուղարկման սխալը'],
    simulate: ['Имитировать ошибку при следующей попытке', 'Simulate an error on the next attempt', 'Հաջորդ փորձի ժամանակ նմանակել սխալ'],
    terms: ['Состав и условия', 'Included items and terms', 'Կազմը և պայմանները'],
    next: ['Что делать дальше', 'What to do next', 'Հաջորդ քայլը'],
    order: ['Покупка', 'Purchase', 'Գնում'],
    fileStarted: ['Файл подготовлен. Откройте загрузки браузера, чтобы сохранить его на устройстве.', 'File prepared. Open your browser downloads to save it on your device.', 'Ֆայլը պատրաստ է։ Բացեք բրաուզերի ներբեռնումները՝ այն սարքում պահպանելու համար։'],
    fileError: ['Не удалось подготовить файл. QR остаётся на экране; можно сохранить его снимок.', 'Could not prepare the file. The QR stays on screen; you can take a screenshot.', 'Չհաջողվեց պատրաստել ֆայլը։ QR-ը մնում է էկրանին․ կարող եք սքրինշոթ անել։'],
    offlineTitle: ['Билеты Victory Park', 'Victory Park tickets', 'Victory Park-ի տոմսեր'],
    offlineReceiptTitle: ['Квитанция Victory Park', 'Victory Park receipt', 'Victory Park-ի անդորրագիր'],
    noQR: ['QR временно недоступен. Сохранённый код указан ниже.', 'QR unavailable. The saved code is shown below.', 'QR-ը հասանելի չէ։ Պահպանված կոդը նշված է ներքևում։'],
    qr: ['QR-код образца', 'Sample QR code', 'Նմուշի QR կոդ'],
    receipt: ['Квитанция', 'Receipt', 'Անդորրագիր'],
    unlimited: ['Личный безлимит', 'Personal unlimited pass', 'Անհատական անսահմանափակ անցագիր'],
    package: ['Общий пакет', 'Shared package', 'Ընդհանուր փաթեթ'],
    ticket: ['Личный билет', 'Personal ticket', 'Անհատական տոմս']
  };
  const cache = new Map();
  const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function language() {
    const l = window.VPI18n?.language || D.documentElement.lang;
    return ['ru','en','hy'].includes(l) ? l : 'ru';
  }
  const t = (key, lang = language()) => (words[key] || [key,key,key])[['ru','en','hy'].indexOf(lang)];
  const tr = x => window.VPI18n ? window.VPI18n.translate(String(x || '')) : String(x || '');
  function payload(item) { return 'VICTORY-PARK-DEMO|' + item.kind + '|' + item.code; }
  function svg(item) {
    const value = payload(item);
    if (cache.has(value)) return cache.get(value);
    if (!window.qrcode) return '<p>' + esc(t('noQR')) + '</p>';
    const qr = window.qrcode(0, 'M');
    qr.addData(value, 'Byte'); qr.make();
    const result = qr.createSvgTag({cellSize:4, margin:16, scalable:true})
      .replace('<svg ', '<svg aria-hidden="true" focusable="false" ');
    if (cache.size > 150) cache.clear();
    cache.set(value, result);
    return result;
  }
  function normalize(items) {
    return (Array.isArray(items) ? items : []).filter(x => x && typeof x.code === 'string' && x.code.trim()).map(x => ({
      code:x.code, title:String(x.title || ''), recipient:String(x.recipient || ''),
      validity:String(x.validity || ''), details:(Array.isArray(x.details) ? x.details : []).map(String),
      instruction:String(x.instruction || ''), kind:['ticket','unlimited','package','receipt'].includes(x.kind) ? x.kind : 'ticket'
    }));
  }
  function card(item, options = {}) {
    const qrTag=options.wallet?'div':'button';
    return `<article class="pp-card${options.wallet ? ' pp-wallet-card' : ''}" data-code="${esc(item.code)}">
      <div class="pp-card-brand"><b>VICTORY PARK</b><span>${esc(t('sample'))}</span></div>
      <div class="pp-card-heading"><span class="pp-kind">${esc(t(item.kind))}</span><h2>${esc(tr(item.title))}</h2>${item.recipient ? `<p>${esc(tr(item.recipient))}</p>` : ''}</div>
      <${qrTag} ${options.wallet?'':'type="button" data-pp-action="large"'} class="pp-qr" aria-label="${esc(t('enlarge'))}">${svg(item)}</${qrTag}>
      <p class="pp-validity">${esc(tr(item.validity))}</p>
      <p class="pp-demo">${esc(t('demo'))}</p>
    </article>`;
  }
  function current(root) {
    const model = JSON.parse(decodeURIComponent(root.dataset.vpReceipt));
    const index = Number(root.querySelector('[data-pp-select]')?.value || 0);
    return {model, index, item:model.items[index] || model.items[0]};
  }
  function render(items, options = {}) {
    window.VPI18n?.refreshUserValues?.();
    items = normalize(items);
    if (!items.length) return '';
    const model = {items, orderId:String(options.orderId || ''), instruction:String(options.instruction || ''), summary:(options.summary||[]).map(String)};
    const first = items[0], receiptOnly = items.every(x => x.kind === 'receipt');
    return `<section class="vp-postpurchase" data-i18n-skip data-vp-receipt="${esc(encodeURIComponent(JSON.stringify(model)))}">
      ${items.length > 1 ? `<label class="pp-selector">${esc(t('choose'))} <span>${items.length}</span><select data-pp-select aria-label="${esc(t('choose'))}">${items.map((x,i) => `<option value="${i}">${i+1}. ${esc(tr(x.title))}${x.recipient ? ' · '+esc(tr(x.recipient)) : ''}</option>`).join('')}</select></label>` : ''}
      <div class="pp-layout"><div data-pp-card>${card(first)}</div><div class="pp-tools">
      <button class="pp-primary" type="button" data-pp-action="save">${esc(t(receiptOnly ? 'saveReceipt' : 'save'))}</button>
      <p class="pp-hint">${esc(t('saveHint'))}</p>
      <p class="pp-status" data-pp-file-status role="status"></p>
      <details class="pp-wallet"><summary>${esc(t('wallet'))}</summary><p class="pp-hint">${esc(t('walletNote'))}</p>
        <button type="button" data-pp-action="apple">${esc(t('apple'))}</button><button type="button" data-pp-action="google">${esc(t('google'))}</button></details>
      <details class="pp-send"><summary>${esc(t('send'))}</summary>
        <form data-pp-form novalidate><label>${esc(t('contact'))}<input data-pp-contact name="contact" type="text" inputmode="text" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="254" placeholder="${esc(t('placeholder'))}"></label>
        <p class="pp-hint">${esc(t('contactHint'))}</p><p class="pp-hint">${esc(t('optional'))}</p>
        <button type="submit" class="pp-secondary">${esc(t('sendDemo'))}</button><p class="pp-status" data-pp-send-status role="status"></p></form>
        <details class="pp-demo-options" data-review-only><summary>${esc(t('demoControls'))}</summary><label><input type="checkbox" data-pp-failure> ${esc(t('simulate'))}</label></details>
      </details>
      <details class="pp-code"><summary>${esc(t('code'))}</summary><code data-pp-manual>${esc(first.code)}</code><button type="button" data-pp-action="copy">${esc(t('copy'))}</button><p class="pp-status" data-pp-copy-status role="status"></p></details>
      </div></div>
      <div class="pp-instructions" data-pp-instruction>${instructions(first,model)}</div>
      <details class="pp-terms"><summary>${esc(t('terms'))}</summary><div data-pp-terms>${terms(first)}</div></details>
      <div class="pp-print" data-pp-print>${printItems(items,model)}</div>
    </section>`;
  }
  function instructions(item,model) {
    const text = item.instruction || model.instruction;
    return text ? `<h3>${esc(t('next'))}</h3><p>${esc(tr(text))}</p>` : '';
  }
  function terms(item) { return `<ul>${item.details.map(x => '<li>'+esc(tr(x))+'</li>').join('')}</ul>`; }
  function printItems(items,options={}) { return (options.summary||[]).map(x=>'<p>'+esc(tr(x))+'</p>').join('')+items.map(item=>'<section class="pp-offline-item">'+card(item,{wallet:true})+'<code>'+esc(item.code)+'</code>'+instructions(item,options)+'<details open><summary>'+esc(t('terms'))+'</summary>'+terms(item)+'</details></section>').join(''); }
  const offlineStyle = `*{box-sizing:border-box}body{margin:0;background:#fffdf5;color:#2f2e7d;font:16px/1.5 system-ui,sans-serif;padding:24px}main{max-width:900px;margin:auto}h1{font-size:26px}h2{font-size:20px;margin:4px 0}h3{font-size:16px}p{margin:8px 0}.pp-offline-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:24px}.pp-offline-item{break-inside:avoid;border:1px solid #d8d4e3;border-radius:16px;padding:18px;background:white}.pp-card{color:#2f2e7d;text-align:center}.pp-card-brand{display:flex;justify-content:space-between;font-size:12px;border-bottom:3px solid #ffd400;padding-bottom:12px}.pp-card-heading{padding:12px 0}.pp-kind{font-size:12px}.pp-qr{display:block;background:white;border:0;width:224px;max-width:100%;padding:0;margin:auto}.pp-qr svg{display:block;width:100%;height:auto}.pp-demo{font-size:12px}.pp-validity{font-size:14px}code{display:block;overflow-wrap:anywhere;font:13px/1.5 monospace;user-select:all}li{margin:8px 0}summary{cursor:pointer;padding:10px 0}@media print{details>*{display:block}details{break-inside:avoid}body{padding:0}}`;
  function fileHTML(items, options={}) {
    window.VPI18n?.refreshUserValues?.();
    items = normalize(items);
    const title=t(items.every(x=>x.kind==='receipt')?'offlineReceiptTitle':'offlineTitle');
    return '<!doctype html><html lang="'+language()+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:"><title>'+esc(title)+'</title><style>'+offlineStyle+'</style></head><body><main><h1>'+esc(title)+'</h1><p>'+esc(t('order'))+' '+esc(options.orderId||'')+'</p><p>'+esc(t('demo'))+'</p>'+(options.instruction?'<p>'+esc(tr(options.instruction))+'</p>':'')+'<div class="pp-offline-grid">'+printItems(items,options)+'</div></main></body></html>';
  }
  function contactType(value) {
    const v = String(value || '').trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'email';
    const n = v.replace(/[\s()\-]/g,'');
    if (/^\+[1-9]\d{6,14}$/.test(n)) return 'phone';
    return null;
  }
  function openDialog(root, type, opener) {
    D.querySelectorAll('.pp-dialog').forEach(el=>el.remove());
    const {item} = current(root), dialog = D.createElement('dialog');
    dialog.className = 'pp-dialog';
    dialog.setAttribute('data-i18n-skip','');
    const title = type === 'large' ? t('enlarge') : t(type);
    dialog.setAttribute('aria-label',title);
    dialog.innerHTML = '<div class="pp-dialog-heading"><h2>'+esc(title)+'</h2><button type="button" data-pp-close>'+esc(t('close'))+'</button></div>'+(type==='large' ? '<div class="pp-large-qr">'+svg(item)+'</div><code>'+esc(item.code)+'</code><p>'+esc(t('demo'))+'</p>' : '<p class="pp-preview-note">'+esc(t('walletNote'))+'</p>'+card(item,{wallet:true})+'<code>'+esc(item.code)+'</code>');
    D.body.append(dialog);
    dialog.addEventListener('click', e => { if(e.target.closest('[data-pp-close]') || e.target===dialog) dialog.close(); });
    dialog.addEventListener('close',()=>{dialog.remove();if(opener?.isConnected)opener.focus();});
    if(typeof dialog.showModal==='function') dialog.showModal(); else {dialog.setAttribute('open','');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');}
    dialog.querySelector('[data-pp-close]').focus();
  }
  D.addEventListener('change', e=>{
    const select = e.target.closest('[data-pp-select]');
    if(!select) return;
    const root=select.closest('.vp-postpurchase'), {item,model}=current(root);
    root.querySelector('[data-pp-card]').innerHTML=card(item);
    root.querySelector('[data-pp-manual]').textContent=item.code;
    root.querySelector('[data-pp-instruction]').innerHTML=instructions(item,model);
    root.querySelector('[data-pp-terms]').innerHTML=terms(item);
    root.querySelector('[data-pp-copy-status]').textContent='';
  });
  D.addEventListener('click', async e=>{
    const button=e.target.closest('[data-pp-action]'), root=button?.closest('.vp-postpurchase');
    if(!root) return;
    const action=button.dataset.ppAction, {model,item}=current(root);
    if(['large','apple','google'].includes(action)) {openDialog(root,action,button);return;}
    if(action==='copy') {
      const status=root.querySelector('[data-pp-copy-status]');
      try {if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(item.code);status.textContent=t('copied');}
      catch {status.textContent=t('copyError');}
    }
    if(action==='save') {
      const status=root.querySelector('[data-pp-file-status]');
      try {
        const html=fileHTML(model.items,model), url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));
        const a=D.createElement('a');a.href=url;a.download=(model.orderId.replace(/[^a-zA-Z0-9_.-]/g,'-')||'victory')+'-tickets.html';
        D.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
        status.textContent=t('fileStarted');
      } catch {status.textContent=t('fileError');}
    }
  });
  D.addEventListener('submit',e=>{
    const form=e.target.closest('[data-pp-form]');
    if(!form)return;
    e.preventDefault();
    const root=form.closest('.vp-postpurchase'), input=form.querySelector('[data-pp-contact]'), status=form.querySelector('[data-pp-send-status]');
    const type=contactType(input.value), receiptOnly=current(root).model.items.every(x=>x.kind==='receipt');
    if(!type){input.setAttribute('aria-invalid','true');status.textContent=t('contactError');input.focus();return;}
    input.removeAttribute('aria-invalid');
    if(root.querySelector('[data-pp-failure]').checked) {
      root.querySelector('[data-pp-failure]').checked=false;
      status.textContent=t(receiptOnly?'receiptSendError':'sendError');return;
    }
    status.textContent=t(receiptOnly ? (type==='email'?'receiptEmailOK':'receiptPhoneOK') : (type==='email'?'emailOK':'phoneOK'));
  });
  D.addEventListener('vp:language',()=>{
    D.querySelectorAll('.pp-dialog').forEach(el=>el.close());
    D.querySelectorAll('.vp-postpurchase').forEach(root=>{
      const {model,index}=current(root), value=root.querySelector('[data-pp-contact]').value;
      const opened=[...root.querySelectorAll('details[open]')].map(el=>el.className);
      const failed=root.querySelector('[data-pp-failure]').checked;
      const holder=D.createElement('div');holder.innerHTML=render(model.items,model);const next=holder.firstElementChild;
      root.replaceWith(next);next.querySelector('[data-pp-contact]').value=value;next.querySelector('[data-pp-failure]').checked=failed;
      for(const klass of opened){const detail=[...next.querySelectorAll('details')].find(el=>el.className===klass);if(detail)detail.open=true;}
      const select=next.querySelector('[data-pp-select]');if(select){select.value=String(index);select.dispatchEvent(new Event('change',{bubbles:true}));}
    });
  });
  // One-use locale handoff. Contacts never enter orders, history, analytics or localStorage.
  const handoffKey='vp.family.v6.receipt.locale-draft.v1';
  function captureView(root=D.querySelector('.vp-postpurchase')) {
    if(!root)return null;
    const {model,item}=current(root);
    return {orderId:model.orderId,code:item?.code,contact:root.querySelector('[data-pp-contact]')?.value||'',opened:[...root.querySelectorAll('details[open]')].filter(x=>!x.closest('.pp-print')).map(x=>x.className)};
  }
  function restoreView(draft,root=D.querySelector('.vp-postpurchase')) {
    if(!draft||!root||current(root).model.orderId!==draft.orderId)return false;
    root.querySelector('[data-pp-contact]').value=String(draft.contact||'').slice(0,254);
    for(const klass of draft.opened||[]){const detail=[...root.querySelectorAll('details')].find(x=>x.className===klass);if(detail)detail.open=true;}
    const select=root.querySelector('[data-pp-select]'),index=current(root).model.items.findIndex(x=>x.code===draft.code);
    if(select&&index>=0){select.value=String(index);select.dispatchEvent(new Event('change',{bubbles:true}));}
    return true;
  }
  function routeKey(url) {return url.pathname+'|'+(url.searchParams.get('lang')||url.pathname.match(/\/(ru|en|hy)\//)?.[1]||'')+'|'+(url.searchParams.get('review')==='1'?'1':'0');}
  function prepareLanguageNavigation(target) {
    const draft=captureView();if(!draft)return;
    let url;try{url=new URL(target,location.href);}catch{return;}
    if(url.origin!==location.origin)return;
    Object.assign(draft,{createdAt:Date.now(),target:routeKey(url)});
    try{sessionStorage.setItem(handoffKey,JSON.stringify(draft));}catch{}
  }
  function restoreDraft() {
    let draft;try{draft=JSON.parse(sessionStorage.getItem(handoffKey)||'null');}catch{return;}
    if(!draft)return;
    const age=Date.now()-draft.createdAt;
    if(age<0||age>60000){try{sessionStorage.removeItem(handoffKey);}catch{}return;}
    if(draft.target!==routeKey(new URL(location.href)))return;
    if(restoreView(draft)){try{sessionStorage.removeItem(handoffKey);}catch{}}
  }
  D.addEventListener('click',e=>{const link=e.target.closest('a[data-lang-link],a[data-vp-lang]');if(link&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&e.button===0)prepareLanguageNavigation(link.href);},true);
  D.addEventListener('vp:catalog-rendered',restoreDraft);
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',restoreDraft);else setTimeout(restoreDraft,0);
  window.VPPostPurchase = Object.freeze({render, fileHTML, payload, contactType, captureView, restoreView, prepareLanguageNavigation, restoreDraft});
}());
