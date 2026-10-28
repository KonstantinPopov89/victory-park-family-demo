/* This is a local demonstration. No API requests, credentials, or production writes. */
(function(){'use strict';
const M=window.Availability, page=document.body.dataset.page, $=id=>document.getElementById(id);
let state,storageOK=true,corrupt=false,formAction=null,returnFocus=null,formRevision=0,notice='';
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function append(parent,...children){children.filter(Boolean).forEach(c=>parent.append(c));return parent;}
function button(text,fn,cls='button secondary compact',id){const b=el('button',text,cls);b.type='button';if(id)b.id=id;b.addEventListener('click',fn);return b;}
function message(text,error=false){notice=text;const n=$('system-message');n.textContent=text;n.className=error?'error':'success';n.hidden=!text;}
function seedDemo(safe=false){return M.presentationSeed(Date.now(),safe);}
function read(){try{const raw=localStorage.getItem(M.KEY);if(!raw){state=seedDemo();localStorage.setItem(M.KEY,JSON.stringify(state));return;}const parsed=JSON.parse(raw);if(!M.validate(parsed))throw new Error('schema');state=parsed;}catch(e){state=seedDemo(true);storageOK=false;corrupt=true;message('Не удалось прочитать сохранённые данные. Показаны неизвестные статусы. В сценариях можно сбросить учебный пример.',true);}}
read();
function save(action,{demo=false}={}){
 try{
 if(!storageOK&&!demo)throw new Error('Локальное хранилище недоступно. Изменение не сохранено.');
 if(!demo&&(state.simulation.saveError||state.simulation.offline||!navigator.onLine))throw new Error('Не удалось сохранить. Статус и история не изменены. Проверьте связь или выключите учебный сбой в сценариях.');
 // Read latest revision before mutation so a second tab cannot blindly overwrite it.
 const raw=localStorage.getItem(M.KEY),latest=raw?JSON.parse(raw):state;
 if(!M.validate(latest))throw new Error('Сохранённые данные повреждены. Изменение не сохранено.');
 if(!demo&&(latest.revision!==state.revision||latest.clock.realStart!==state.clock.realStart)){state=latest;render();throw new Error('Данные изменились в другой вкладке. Проверьте их и повторите действие.');}
 const next=M.reduce(latest,action,M.now(latest));localStorage.setItem(M.KEY,JSON.stringify(next));
 const check=JSON.parse(localStorage.getItem(M.KEY));if(!M.validate(check)||check.revision!==next.revision)throw new Error('Не удалось подтвердить локальное сохранение.');
 state=check;storageOK=true;corrupt=false;render();message(demo?'Учебный сценарий применён. Откройте панель или гостевой экран.':'Сохранено локально. Гостевой экран этого браузера обновлён. На действующий сайт не отправлено.');return true;
 }catch(e){message(e.message,true);return false;}
}
function sourceName(r){return r.source==='manual'?'Подтверждение дежурного':r.source==='manual-expired'?'Ручной статус просрочен':r.source==='debits'?'Автооценка по списаниям':r.source==='park'?'Решение по всему парку':r.source==='park-unknown'?'Состояние парка не подтверждено':'Работа уточняется';}
function lastDebitText(r,t){const e=r.lastDebit||M.lastDebit(r);return e?'Последнее списание '+M.ageMinutes(e.eventAt,t)+' мин. назад · '+M.clock(e.eventAt):'За сегодня ещё нет подходящего списания';}
function renderOverview(d){const box=$('overview');if(!box)return;box.replaceChildren();const line=el('div',undefined,'park-line');append(line,el('span','',`status-dot ${d.park.status}`),el('h2',d.park.status==='open'?'Парк открыт':d.park.status==='closed'?'Парк временно закрыт':'Состояние парка уточняем'));box.append(line);box.append(el('p',d.park.reason,'small'));
 const answer=el('p',undefined,'big-answer');if(d.counts.open){append(answer,el('strong',String(d.counts.open)),document.createTextNode(' из 11 работают'));}else answer.textContent=d.park.status==='closed'?'Аттракционы недоступны':'Работающих аттракционов не подтверждено';box.append(answer);
 const parts=[];if(d.counts.paused+d.counts.closed)parts.push((d.counts.paused+d.counts.closed)+' недоступны');if(d.counts.unknown)parts.push('по '+d.counts.unknown+' уточняем');box.append(el('p',parts.length?parts.join(' · '):'По всем аттракционам показана оценка работы.','small'));
 if(d.park.checkedAt)box.append(el('p','Парк подтверждён в '+M.clock(d.park.checkedAt)+'. У каждого аттракциона свой срок актуальности.','small'));
 box.append(el('p',page==='admin'?'Автооценка по списаниям. Ручное решение важнее автоматики. Пороги учебные, точность ещё не проверена.':'Работает: автооценка по недавнему списанию или отметка дежурного. Работа может измениться.','mode-note'));
 if(page==='admin')box.append(el('p',(d.limeFresh?'Учебный источник свежий и полный.':'Источник требует проверки.')+' Последнее успешное чтение: '+M.clock(state.sources.lime.lastSuccessfulRead)+'. Срок свежести источника: 5 учебных минут.','small'));
}
function renderQueue(d){const q=$('queue');if(!q)return;q.replaceChildren();const head=el('div',undefined,'section-heading');const heading=el('h2','Нужно проверить · '+(d.queue.length+(d.park.needsCheck?1:0)));heading.id='queue-heading';head.append(heading);q.append(head);
 if(!d.queue.length&&!d.park.needsCheck){q.append(el('p','Неизвестных статусов нет. Следите за сообщениями об остановках.','queue-ok'));return;}
 q.append(el('p','Здесь исключения: давнее списание, сбой данных или истёкшее ручное решение. Проверьте работу у оператора и при необходимости задайте статус.','small'));
 const ul=el('ul',undefined,'queue-list');if(d.park.needsCheck){const li=el('li');append(li,append(el('div'),el('strong','Состояние всего парка'),el('p','Срок подтверждения истёк.','small')),button('Проверить',()=>parkDialog('open'),undefined,'queue-park'));ul.append(li);}
 d.queue.slice(0,3).forEach(r=>{const li=el('li');append(li,append(el('div'),el('strong',r.name),el('p',r.own.source==='manual-expired'?'Истёк срок подтверждения':r.own.source==='debit-expired'?'Давно не было списания':r.own.reason,'small')),button('Проверить',()=>editDialog(r.id),undefined,'queue-'+r.id));ul.append(li);});q.append(ul);
 if(d.queue.length>3)q.append(el('p','Ещё '+(d.queue.length-3)+' в списке ниже. Они отмечены «Уточняем».','small'));
}
function renderWeather(d){const w=$('weather');if(!w)return;w.replaceChildren();w.hidden=false;w.classList.toggle('neutral',!d.weather.showAlert);
 if(!d.weather.fresh){w.append(el('h2','Погодные данные не обновлены'));w.append(el('p','Прежний прогноз не показываем как актуальное предупреждение. Статусы аттракционов не менялись.'));w.append(el('p','Последний учебный прогноз: '+M.clock(d.weather.checkedAt)+'.','small'));return;}
 if(!d.weather.showAlert){w.append(el('h2','Нового погодного предупреждения нет'));w.append(el('p','Это не подтверждает возможность запуска. Решения об остановках остаются в силе.'));w.append(el('p','Учебный прогноз от '+M.clock(d.weather.checkedAt)+'.','small'));return;}
 w.append(el('h2',page==='admin'?'Проверьте работу при ветре':'Возможны ограничения из-за ветра'));
 w.append(el('p',page==='admin'?'Учебный прогноз указывает на возможное ограничение для башни, колеса и НЛО. Проверьте фактические условия и правила каждого аттракциона.':'По прогнозу возможны ограничения для башни, колеса и НЛО. Текущий подтверждённый статус каждого указан ниже.'));
 w.append(el('p','Прогноз, не измерение в парке · источник: учебный пример · '+M.clock(d.weather.checkedAt)+' · до '+M.clock(d.weather.validUntil)+'.','small'));
 if(page==='admin'){
 if(d.weather.needsAction){const actions=el('div',undefined,'actions');append(actions,button('Проверить аттракционы',weatherDialog,'button','weather-check'),button('Оставить без изменений',weatherDismissDialog,'button linklike','weather-dismiss'));w.append(actions);}
 else w.append(el('p','Подсказка обработана дежурным. Изменение погоды само не запускает аттракционы.','small'));
 }
}
function renderRides(d){const list=$('rides');if(!list)return;const openIds=new Set([...list.querySelectorAll('details[open]')].map(n=>n.id));const q=$('search').value,rides=M.search(d.rides,q);list.replaceChildren();$('list-count').textContent=rides.length+' из 11';$('clear-search').hidden=!q;$('result-note').textContent=q?'Результаты поиска. Верхняя сводка относится ко всем 11 аттракционам.':'';$('empty').hidden=rides.length>0;
 rides.forEach(r=>{const li=el('li',undefined,'ride');li.id=r.id;
 const row=el('div',undefined,'ride-summary'),copy=el('div',undefined,'ride-copy'),media=el('div',undefined,'ride-photo');
 const photo=el('img');photo.src=r.photo;photo.alt=r.name;photo.width=112;photo.height=112;photo.loading='lazy';photo.decoding='async';
 const fallback=el('span','Фото временно недоступно','ride-photo-fallback');fallback.hidden=true;
 photo.addEventListener('error',()=>{photo.hidden=true;fallback.hidden=false;});append(media,photo,fallback);append(row,media,copy);li.append(row);
 const top=el('div',undefined,'ride-top'),name=el('a',r.name,'ride-name');name.href=page==='guest'&&r.catalogId?'reels.html?ride='+encodeURIComponent(r.catalogId):'#'+r.id;name.id='ride-link-'+r.id;append(top,name,el('span',M.LABELS[r.status],'status '+r.status));copy.append(top);const guestReason=r.source==='manual-expired'?'Сведения устарели. Уточняем работу.':r.source==='debit-expired'?'Давно не было списаний. Уточняем работу.':r.source==='mapping'?'Сведения об аттракционе уточняются.':r.source==='source-incomplete'?'Получены не все сведения. Уточняем работу.':r.reason;copy.append(el('p',page==='guest'?guestReason:r.reason,'ride-reason'));
 const time=r.checkedAt?' · '+M.clock(r.checkedAt):'';copy.append(el('p',sourceName(r)+(r.source==='manual'?time+' · до '+M.clock(r.expiresAt):''),'ride-meta'));
 const debit=M.lastDebit(r);if(debit)copy.append(el('p',lastDebitText(r,d.now)+(M.day(debit.eventAt)!==M.day(d.now)?' · в предыдущий день':''),'ride-meta'));else if(page==='admin')copy.append(el('p','Нет подходящего списания за сегодня.','ride-meta'));
 if(page==='admin'){
 const bottom=el('div',undefined,'ride-bottom'),details=el('details');details.id='source-'+r.id;details.open=openIds.has(details.id);const sourceSummary=el('summary','Источник и ручной режим');sourceSummary.id='source-summary-'+r.id;append(details,sourceSummary);
 details.append(el('p','Учебный порог этого аттракциона: '+M.threshold(r,state)+' мин. Режим: '+(state.thresholds.mode==='common'?'общий порог':'отдельные пороги')+'.'));
 details.append(el('p','Привязка: '+(r.mapping==='known'?'однозначная, учебная':r.mapping==='ambiguous'?'неоднозначная':'не настроена')+'.'));
 if(debit)details.append(el('p','Время события: '+M.clock(debit.eventAt)+'. Получено: '+M.clock(debit.receivedAt)+'. Давность считается от события.'));
 details.append(el('p','Последнее успешное чтение: '+M.clock(state.sources.lime.lastSuccessfulRead)+'. Полнота: '+(state.sources.lime.complete?'подтверждена в примере':'не подтверждена')+'.'));
 details.append(el('p','Неподходящие записи, повторы и возвраты не освежают последнее списание.'));
 if(r.manual){details.append(el('p','Ручное решение: '+M.LABELS[r.manual.status]+', '+r.manual.author+'. До '+M.clock(r.manual.expiresAt)+'.'));details.append(button('Снять ручной статус',()=>clearDialog(r.id),'button linklike','clear-'+r.id));}
 else if(r.lastManual)details.append(el('p','Последнее ручное решение: '+M.LABELS[r.lastManual.status]+', '+r.lastManual.author+', '+M.clock(r.lastManual.checkedAt)+'. '+r.lastManual.reason+' Ручной режим снят.'));
 append(bottom,details,button('Изменить',()=>editDialog(r.id),undefined,'edit-'+r.id));li.append(bottom);
 }list.append(li);if(page==='admin')$('edit-'+r.id).setAttribute('aria-label','Изменить статус: '+r.name);});
}
function renderShift(d){const box=$('shift');if(!box)return;box.replaceChildren();box.append(el('p',state.shift.active?'Смена принята. Учебная роль: Дежурный.':'Подготовлена передача смены. Новый дежурный должен принять её.','small'));
 box.append(el('p','При начале смены: проверьте парк, очередь неизвестных статусов и активные паузы. При передаче: сообщите причины остановок и сроки следующих проверок.','small'));
 const actions=el('div',undefined,'actions');actions.style.marginTop='14px';append(actions,button(state.shift.active?'Передать смену':'Принять смену',()=>shiftDialog(),undefined,'shift-action'),button(d.park.status==='closed'?'Подтвердить открытие парка':'Закрыть парк',()=>parkDialog(d.park.status==='closed'?'open':'closed'),undefined,'park-action'));box.append(actions);
 box.append(el('p',(d.limeFresh?'Связь с учебным источником Лайма актуальна.':'Учебные данные Лайма не обновлены.')+' Последнее чтение: '+M.clock(state.sources.lime.lastSuccessfulRead)+'. Это не обновляет подтверждения дежурного.','small'));box.lastChild.style.marginTop='14px';
 const list=$('history');list.replaceChildren();$('history-count').textContent=state.history.length?'('+state.history.length+')':'';
 if(!state.history.length)list.append(el('li','Пока нет действий в этой демонстрации.'));
 state.history.slice(0,30).forEach(h=>list.append(append(el('li'),el('time',M.clock(h.at)),document.createTextNode(h.text))));
}
function openDialog(title,description,build,action,submit='Сохранить локально'){
 returnFocus=document.activeElement;formRevision=state.clock.realStart+':'+state.revision;$('dialog-title').textContent=title;$('dialog-description').textContent=description;$('dialog-fields').replaceChildren();$('form-error').hidden=true;$('dialog-submit').textContent=submit;formAction=action;build($('dialog-fields'));$('edit-dialog').showModal();
}
function closeDialog(){$('edit-dialog').close();const target=returnFocus?.id?$(returnFocus.id):returnFocus;if(target&&document.contains(target))target.focus();}
function field(label,type,id,value){const l=el('label',label,'field');let input;
 if(type==='select'){input=el('select');value.forEach(([v,text])=>{const o=el('option',text);o.value=v;input.append(o);});}
 else{input=el(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type;input.value=value||'';input.maxLength=180;}
 input.id=id;input.name=id;l.append(input);return l;
}
function editDialog(id){const r=M.derive(state).rides.find(r=>r.id===id);openDialog(r.name,'Укажите фактическое состояние, которое вы проверили. Срок ниже учебный и не равен времени возобновления работы.',fields=>{
 fields.append(field('Статус','select','status-input',[['open','Работает'],['paused','Пауза'],['closed','Не работает'],['unknown','Уточняем']]));$('status-input').value=r.own.status;
 fields.append(field('Причина для гостя','textarea','reason-input',r.manual?.reason||'Работа проверена дежурным.'));$('reason-input').required=true;
 fields.append(field('Повторная проверка через','select','minutes-input',[['15','15 минут'],['30','30 минут'],['60','60 минут']]));$('minutes-input').value='30';
 fields.append(el('p','После истечения срока появится «Уточняем», даже при новом автосигнале. Автор: Дежурный.','small'));
 },()=>({type:'manual',ids:[id],status:$('status-input').value,reason:$('reason-input').value,minutes:Number($('minutes-input').value)}));}
function clearDialog(id){const r=state.rides.find(r=>r.id===id),test=JSON.parse(JSON.stringify(state));test.rides.find(x=>x.id===id).manual=null;const preview=M.derive(test).rides.find(x=>x.id===id);
 openDialog('Снять ручной статус?','Предпросмотр результата по текущим данным. Снятие не означает открытие аттракциона.',fields=>{fields.append(el('p',r.name,'field'));fields.append(el('p',M.LABELS[preview.status]+'. '+preview.reason,'preview'));fields.append(el('p','После снятия ручного решения действует учебное правило по давности списания. Срок, источник и привязка проверяются заново.','small'));},()=>{const current=JSON.parse(JSON.stringify(state));current.rides.find(x=>x.id===id).manual=null;const result=M.derive(current).rides.find(x=>x.id===id);if(result.status!==preview.status||result.source!==preview.source)throw new Error('Предпросмотр изменился со временем. Закройте форму и проверьте результат заново.');return{type:'clear',id};},'Подтвердить снятие');}
function weatherDialog(){const d=M.derive(state);if(!d.weather.needsAction){render();return;}openDialog('Пауза из-за погоды','Отметьте только те аттракционы, для которых остановка подтверждена. Прогноз сам по себе не является решением.',fields=>{
 const ul=el('ul',undefined,'check-list');d.weather.ids.forEach(id=>{const r=state.rides.find(r=>r.id===id),label=el('label'),input=el('input');input.type='checkbox';input.name='weather-rides';input.value=id;input.checked=true;append(label,input,document.createTextNode(r.name));ul.append(append(el('li'),label));});fields.append(ul);
 fields.append(field('Причина для гостя','textarea','reason-input','Пауза из-за погодных условий подтверждена дежурным. Время запуска неизвестно.'));$('reason-input').required=true;
 fields.append(field('Повторная проверка через','select','minutes-input',[['15','15 минут'],['30','30 минут'],['60','60 минут']]));
 fields.append(el('p','Подтверждаю остановку выбранных аттракционов. Остальные статусы сохранятся.','preview'));
 },()=>{if(!M.derive(state).weather.fresh)throw new Error('Погодная подсказка устарела. Проверьте условия заново.');const ids=[...document.querySelectorAll('[name="weather-rides"]:checked')].map(i=>i.value);if(!ids.length)throw new Error('Выберите хотя бы один аттракцион или отмените действие.');return{type:'manual',ids,status:'paused',reason:$('reason-input').value,minutes:Number($('minutes-input').value),weather:true};},'Подтвердить паузу локально');}
function weatherDismissDialog(){openDialog('Оставить статусы без изменений?','Вы проверили условия и не подтверждаете остановку. Решение попадёт в историю. Погодное предупреждение для гостя останется до окончания его актуальности.',fields=>fields.append(el('p','Ни один аттракцион не будет открыт или закрыт этим действием.','preview')),()=>({type:'weather-dismiss'}),'Подтвердить решение');}
function parkDialog(status){openDialog(status==='closed'?'Подтвердить закрытие парка?':'Подтвердить открытие парка?',status==='closed'?'Гостевой экран покажет недоступность всех аттракционов на время этого решения.':'Открытие входа в парк не обновит статусы аттракционов. Сроки и ручные паузы сохранятся.',fields=>fields.append(el('p','Подтверждение действительно 60 учебных минут. После истечения потребуется проверка.','preview')),()=>({type:'park',status}),'Подтвердить локально');}
function shiftDialog(){openDialog(state.shift.active?'Передача смены':'Начало смены','Статусы, причины и сроки проверок сохраняются. Принятие смены само не подтверждает работу аттракционов.',fields=>{const d=M.derive(state);fields.append(el('p','Проверить: '+d.queue.length+' аттракционов. Пауза или закрытие: '+(d.counts.paused+d.counts.closed)+'.','preview'));fields.append(el('p','Передайте следующему дежурному причины остановок и договорённости с операторами.','small'));},()=>({type:'shift',active:!state.shift.active}),state.shift.active?'Подготовить передачу':'Принять смену');}
function thresholdDialog(){openDialog('Учебные пороги','Эти числа нужны для проверки поведения интерфейса. Они не подобраны по точности и не утверждены для парка.',fields=>{
 fields.append(field('Как применять пороги','select','threshold-mode',[['individual','Отдельно по аттракционам'],['common','Один для всех']]));$('threshold-mode').value=state.thresholds.mode;
 fields.append(field('Общий порог, минут','number','threshold-common',String(state.thresholds.common)));$('threshold-common').min=1;$('threshold-common').max=120;$('threshold-common').required=true;
 const details=el('details');details.open=true;details.append(el('summary','Пороги по аттракционам'));state.rides.forEach(r=>{const f=field(r.name+', минут','number','threshold-'+r.id,String(r.thresholdMinutes));const input=f.querySelector('input');input.min=1;input.max=120;input.required=true;details.append(f);});fields.append(details);
 fields.append(el('p','Когда включён общий порог, отдельные значения сохраняются, но не применяются. Свежесть источника проверяется отдельно: 5 учебных минут.','small'));
 },()=>({type:'thresholds',mode:$('threshold-mode').value,common:Number($('threshold-common').value),values:Object.fromEntries(state.rides.map(r=>[r.id,Number($('threshold-'+r.id).value)]))}),'Применить учебные пороги');}
function renderReview(d){const box=$('review-state');if(!box)return;box.replaceChildren();box.append(el('h2','Автооценка по давности списания'));box.append(el('p',state.clock.running?'Учебное время идёт. Статусы истекают по заданным срокам.':'Учебное время зафиксировано для показа. Кнопки сценариев по-прежнему переводят часы вперёд.','small'));box.append(button(state.clock.running?'Зафиксировать время':'Запустить ход времени',()=>save({type:'clock',running:!state.clock.running,realNow:Date.now()},{demo:true}),'button secondary','clock-toggle'));box.append(el('p','Работают '+d.counts.open+' · уточняем '+d.counts.unknown+' · ручных решений '+state.rides.filter(r=>r.manual).length,'small'));box.append(el('p','Режим порогов: '+(state.thresholds.mode==='common'?'общий, '+state.thresholds.common+' мин.':'по аттракционам')+'. Исходные 15 минут учебные. Они не являются рекомендацией.','small'));box.append(button('Настроить учебные пороги',thresholdDialog,'button secondary','thresholds-open'));box.append(el('p','Ошибка сохранения: '+(state.simulation.saveError?'включена':'выключена')+'. Офлайн: '+(state.simulation.offline?'включён':'выключен')+'.','small'));
}
function initScenarios(){const root=$('scenarios');if(!root)return;
 const groups=[['Время и исходный пример',[
 ['reset','Сбросить демонстрацию','Вернуть исходные учебные статусы, пороги и время.'],
 ['advanceT','Пересечь порог Автодрома','Прибавляет T + 1 минуту и получает успешное чтение без новых событий. «Работает» сменится на «Уточняем».'],
 ['advance6','Источник не обновлялся 6 минут','Стареет источник. Давность каждого списания остаётся своей.'],
 ['advance','Прибавить 31 минуту','Продвигает время и читает источник без новых списаний. Ручные решения истекают, автоматического открытия нет.'],
 ['no-first','Автодром: нет первого списания','Поток свежий и полный, но у Автодрома нет списаний за сегодня. Он останется «Уточняем».'],
 ['next-day','Следующий день без списаний','Парк открыт заново. Вчерашнее списание не подтверждает работу сегодня.']]],
 ['Списания и качество источника',[
 ['lime-read','Автодром: новое списание','Подходящее событие сейчас. При отсутствии ручного ограничения Автодром получит автооценку «Работает».'],
 ['lime-poll','Чтение без новых списаний','Освежает источник, но не время последнего списания.'],
 ['lime-error','Сбой чтения Лайма','Автооценки станут «Уточняем». Ручные статусы сохранятся.'],
 ['lime-restore','Связь восстановлена, чтения нет','Снятие ошибки связи не подтверждает свежесть или полноту данных.'],
 ['lime-incomplete','Неполный поток','Даже недавнего списания недостаточно при неподтверждённой полноте.'],
 ['old-batch','Автодром: пришёл старый пакет','Получено сейчас, событие было 2 часа назад. Последнее списание не станет новым.'],
 ['return','Автодром: возврат','Возврат не является списанием за катание и не освежает его.'],
 ['duplicate','Автодром: повтор записи','Дубликат не меняет время уже полученного события.'],
 ['future','Автодром: время из будущего','Некорректное событие не принимается как списание.'],
 ['unmapped','Автодром: нет привязки','Автооценка недоступна, пока не сопоставлен аттракцион.'],
 ['ambiguous','Автодром: неоднозначная привязка','Нельзя присвоить события одному аттракциону.'],
 ['mapped','Автодром: учебная привязка верна','Возвращает привязку. Прежние события не наследуются: до нового списания останется «Уточняем».']]],
 ['Ручное решение, погода и сохранение',[
 ['conflict','Колесо: списание во время паузы','Действующая ручная пауза важнее недавнего списания.'],
 ['weather-error','Сбой погоды','Убрать устаревшее предупреждение. Статусы не меняются.'],
 ['weather-read','Новый прогноз о ветре','Подсказка сотруднику, требуется его решение.'],
 ['weather-clear','Прогноз улучшился','Предупреждение исчезает. Ручные остановки остаются.'],
 ['save-error','Переключить ошибку сохранения','При ошибке действия дежурного не меняют статусы и историю.'],
 ['offline','Переключить офлайн','Сохранение отключено. Возврат связи не обновляет часы источников.']]],
 ['Общее состояние парка',[
 ['park-close','Подтвердить закрытие парка','Все зависимые аттракционы недоступны.'],
 ['park-open','Подтвердить открытие парка','Подтверждает вход в парк. Списания и ручные решения не обновляются.']]]];
 groups.forEach(([title,items])=>{const section=el('section');section.append(el('h2',title));items.forEach(([kind,label,desc])=>{const row=el('div',undefined,'scenario-row');row.append(el('p',desc));row.append(button(label,()=>{
 if(kind==='reset'){openDialog('Сбросить учебный пример?','Только локальная история и статусы этой демонстрации будут заменены исходным примером.',fields=>fields.append(el('p','Действующий сайт и Лайм не затрагиваются.','preview')),()=>({type:'reset'}),'Сбросить пример');return;}
 if(kind==='park-close'||kind==='park-open'){parkDialog(kind==='park-close'?'closed':'open');return;}
 save({type:'demo',kind},{demo:true});
 },'button secondary','demo-'+kind));section.append(row);});root.append(section);});
}
function render(){const focusId=document.activeElement?.id,d=M.derive(state);$('demo-time').textContent='Учебное время: '+M.date(d.now)+', '+M.clock(d.now)+' · Ереван · '+(state.clock.running?'время идёт':'учебное время зафиксировано');const clockNote=$('demo-clock-note');if(clockNote)clockNote.textContent=state.clock.running?'Учебное время идёт.':'Учебное время зафиксировано.';
 const offline=state.simulation.offline||!navigator.onLine;$('network').hidden=!offline;$('network').textContent='Нет связи: учебное сохранение отключено. Возврат сети не подтверждает работу и не обновляет время источников.';
 renderOverview(d);renderQueue(d);renderWeather(d);renderRides(d);renderShift(d);renderReview(d);if(focusId&&document.activeElement===document.body&&$(focusId))$(focusId).focus({preventScroll:true});}
function reset(){try{const next=seedDemo();localStorage.setItem(M.KEY,JSON.stringify(next));state=next;storageOK=true;corrupt=false;render();message('Учебный пример сброшен.');return true;}catch(e){message('Локальное хранилище недоступно. Сброс не выполнен.',true);return false;}}
$('edit-form').addEventListener('submit',event=>{event.preventDefault();try{if(state.clock.realStart+':'+state.revision!==formRevision)throw new Error('Данные изменились в другой вкладке. Закройте форму и проверьте актуальное состояние.');const action=formAction();const ok=action.type==='reset'?reset():save(action);if(ok)closeDialog();else{$('form-error').textContent=notice;$('form-error').hidden=false;}}catch(e){$('form-error').textContent=e.message;$('form-error').hidden=false;}});
$('dialog-close').addEventListener('click',closeDialog);$('dialog-cancel').addEventListener('click',closeDialog);
if($('search')){$('search').addEventListener('input',()=>renderRides(M.derive(state)));const clear=()=>{$('search').value='';renderRides(M.derive(state));$('search').focus();};$('clear-search').addEventListener('click',clear);$('empty-reset').addEventListener('click',clear);}
window.addEventListener('storage',e=>{if(e.key!==M.KEY&&e.key!==null)return;try{const parsed=JSON.parse(e.newValue);if(!M.validate(parsed))throw new Error('schema');state=parsed;storageOK=true;corrupt=false;render();message('Учебные данные обновлены в другой вкладке.');}catch(error){state=seedDemo(true);storageOK=false;corrupt=true;render();message('Изменённые данные не прошли проверку. Работа объектов не подтверждена.',true);}});
window.addEventListener('online',render);window.addEventListener('offline',render);window.addEventListener('pageshow',render);document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
initScenarios();render();setInterval(render,5000);
})();
