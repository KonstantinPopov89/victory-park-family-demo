/* Presentation adapter for the inherited demo chrome; no catalogue or commerce state changes. */
(()=>{'use strict';
const lang=document.documentElement.lang;
const copy={ru:{prototype:'Прототип',review:'Текст требует проверки'},en:{prototype:'Prototype',review:'Text needs review'},hy:{prototype:'Նախատիպ',review:'Տեքստը պետք է ստուգել'}}[lang]||{prototype:'Prototype',review:'Text needs review'};
function tidy(){
 for(const el of document.querySelectorAll('.ptab')){if(el.textContent!==copy.prototype)el.textContent=copy.prototype;el.setAttribute('aria-label',copy.prototype);}
 for(const el of document.querySelectorAll('[title="нужен перевод клиента"]')){el.title=copy.review;}
 // The data dictionary has already translated these display strings. Correct inherited language metadata.
 if(lang!=='ru')for(const el of document.querySelectorAll('main .tr[lang="ru"]'))if(!/[А-Яа-яЁё]/.test(el.textContent))el.lang=lang;
}
tidy();let pending=false;
new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;tidy()})}).observe(document.body,{subtree:true,childList:true});
})();
