/* Verified park contacts and explicit local-file fallbacks. No social SDK or order URLs. */
(() => {
  'use strict';
  const channels = Object.freeze({
    vk: {name:'VK', url:null},
    max: {name:'MAX', url:null},
    whatsapp: {name:'WhatsApp', url:null},
    telegram: {name:'Telegram', url:null},
    instagram: {name:'Instagram', url:'https://www.instagram.com/victorypark_yerevan/'},
    facebook: {name:'Facebook', url:'https://www.facebook.com/victorypark.monument'},
    tiktok: {name:'TikTok', url:null}
  });
  const words = {
    contacts:['Парк в соцсетях','Follow the park','Հետևեք այգուն'],
    visit:['Открыть страницу парка','Open the park page','Բացել այգու էջը'],
    save:['Сохранить билеты','Save tickets','Պահպանել տոմսերը'],
    receipt:['Сохранить подтверждение','Save confirmation','Պահպանել հաստատումը'],
    note:['Эти кнопки сохраняют файл на устройство. Отправить его в выбранный сервис можно самостоятельно.','These buttons save a file to your device. You can then send it through your chosen service.','Այս կոճակները ֆայլը պահպանում են ձեր սարքում։ Այնուհետև կարող եք ինքներդ ուղարկել այն ընտրված ծառայության միջոցով։']
  };
  const marks = {
    vk:'<path d="M3 6h3.1c.4 4.3 2.2 6.2 3.6 6.6V6h3v3.8c1.5-.2 3-2 3.5-3.8h3c-.5 2.3-2.2 4.2-3.4 5 1.2.7 3.1 2.4 3.8 5h-3.3c-.6-1.7-2-3-3.6-3.2V16h-.5C6.5 16 3.6 12.4 3 6Z"/>',
    max:'<path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.5-1.2A9 9 0 1 0 12 3Zm0 4a5 5 0 1 1-3.9 8.1l-.4 1.3-1-.3.5-1.7A5 5 0 0 1 12 7Z"/>',
    whatsapp:'<path fill="none" stroke="currentColor" stroke-width="1.8" d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.7a8.5 8.5 0 1 1 16.3-3.8Z"/><path d="m8 7 1.5 2.8-1 1c.7 1.4 1.7 2.4 3.3 3.2l1.1-1 2.7 1.4c-.2 1.4-1.1 2.4-2.5 2.1-3.9-.8-7-3.9-7.4-7.1C5.6 8.1 6.7 7.2 8 7Z"/>',
    telegram:'<path d="m21 4-3.3 16-5.3-4-2.8 2.7.5-4.6 8.3-7.5-10.3 6.3L3 11.2 21 4Z"/>',
    instagram:'<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1"/>',
    facebook:'<path d="M14.5 22v-9h3l.5-3.5h-3.5V7.3c0-1 .3-1.8 1.8-1.8H18V2.4a24 24 0 0 0-2.8-.2c-2.8 0-4.7 1.7-4.7 4.8v2.5H7.4V13h3.1v9h4Z"/>',
    tiktok:'<path d="M14 3h3c.4 2.4 1.7 3.8 4 4v3a9 9 0 0 1-4-1.3v7.1a5.8 5.8 0 1 1-6.5-5.7v3a2.8 2.8 0 1 0 3.5 2.7V3Z"/>'
  };
  const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function language() { const lang=window.VPI18n?.language||document.documentElement.lang; return ['ru','en','hy'].includes(lang)?lang:'ru'; }
  function render(lang=language(), options={}) {
    const index=Math.max(0,['ru','en','hy'].indexOf(lang)), t=key=>words[key][index];
    const saved={kind:options.kind==='receipt'?'receipt':'tickets',saveAction:options.saveAction||'postpurchase',operationId:String(options.operationId||'')};
    const action=saved.saveAction==='session'?'data-action="download"':saved.saveAction==='topup'?`data-save="${esc(saved.operationId)}"`:'data-pp-action="save"';
    const save=t(saved.kind==='receipt'?'receipt':'save');
    const item=(key,entry) => {
      const icon=`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${marks[key]}</svg>`;
      const content=`${icon}<span><b>${entry.name}</b><small>${entry.url?t('visit'):save}</small></span>`;
      return entry.url?`<a class="vp-social-action" data-social-channel="${key}" href="${entry.url}" target="_blank" rel="noopener noreferrer">${content}</a>`:`<button class="vp-social-action" type="button" data-social-channel="${key}" ${action}>${content}</button>`;
    };
    const entries=Object.entries(channels);
    return `<section class="vp-social-links" data-i18n-skip data-social-options="${esc(encodeURIComponent(JSON.stringify(saved)))}"><h3>${t('contacts')}</h3><div class="vp-social-grid">${entries.filter(([,entry])=>entry.url).map(([key,entry])=>item(key,entry)).join('')}</div><h3>${save}</h3><p class="vp-social-note">${t('note')}</p><div class="vp-social-grid">${entries.filter(([,entry])=>!entry.url).map(([key,entry])=>item(key,entry)).join('')}</div></section>`;
  }
  document.addEventListener('vp:language',()=>document.querySelectorAll('.vp-social-links').forEach(el=>{el.outerHTML=render(language(),JSON.parse(decodeURIComponent(el.dataset.socialOptions)));}));
  window.VPSocialLinks=Object.freeze({render,channels});
})();
