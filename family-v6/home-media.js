/* Video enhances the hero; a failed request must not strand its play button. */
(()=>{'use strict';
 const video=document.querySelector('[data-home-video]'),button=document.querySelector('[data-home-video-toggle]');
 if(!video||!button)return;
 const media=video.closest('.home-media');
 const copy={
  ru:{pause:'Пауза',play:'Смотреть видео',retry:'Повторить загрузку видео',error:'Видео не загрузилось'},
  en:{pause:'Pause',play:'Play video',retry:'Retry video',error:'Video could not load'},
  hy:{pause:'Դադար',play:'Դիտել տեսանյութը',retry:'Կրկին բեռնել տեսանյութը',error:'Տեսանյութը չբեռնվեց'}
 }[document.documentElement.lang]||{pause:'Pause',play:'Play video',retry:'Retry video',error:'Video could not load'};
 const poster=document.createElement('img');
 poster.className='home-media-poster';poster.alt='';poster.src=video.poster;poster.hidden=true;
 const status=document.createElement('span');
 status.className='home-media-status';status.setAttribute('role','status');status.hidden=true;
 media.insertBefore(poster,button);media.append(status);
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let manuallyPaused=false,loaded=false,inView=true,failed=false,attempt=0;
 function update(){
  const playing=!video.paused&&!failed;
  button.setAttribute('aria-label',failed?copy.retry:playing?copy.pause:copy.play);
  button.setAttribute('title',failed?copy.retry:playing?copy.pause:copy.play);
  button.setAttribute('aria-pressed',String(playing));button.dataset.playing=String(playing);
 }
 function fail(){
  failed=true;++attempt;video.pause();
  poster.hidden=false;video.style.visibility='hidden';video.setAttribute('aria-hidden','true');
  status.textContent=copy.error;status.hidden=false;update();
 }
 function pause(){++attempt;video.pause();update();}
 async function play(userInitiated=false){
  if(failed&&!userInitiated)return;
  if(!video.paused&&!failed)return;
  const retry=failed||Boolean(video.error),token=++attempt;
  failed=false;status.hidden=true;
  if(!loaded){video.src=video.dataset.src;loaded=true;}
  // play() alone retains a terminal media error. Explicit retry must rerun resource selection.
  else if(retry)video.load();
  try{await video.play();}
  catch(error){
   if(token!==attempt)return;
   // A visibility pause cancels a pending play; autoplay refusal can be retried by a gesture.
   if(error.name!=='AbortError'&&error.name!=='NotAllowedError')fail();
  }
  if(token===attempt)update();
 }
 button.addEventListener('click',()=>{
  if(!video.paused&&!failed){manuallyPaused=true;pause();}
  else{manuallyPaused=false;play(true);}
 });
 video.addEventListener('playing',()=>{
  failed=false;poster.hidden=true;status.hidden=true;video.style.visibility='';video.removeAttribute('aria-hidden');update();
 });
 video.addEventListener('play',update);video.addEventListener('pause',update);video.addEventListener('error',fail);
 const allowed=()=>!motion.matches&&!navigator.connection?.saveData&&!manuallyPaused&&!failed;
 const visibility=()=>{if(document.hidden||!inView)pause();else if(allowed())play();};
 document.addEventListener('visibilitychange',visibility);
 motion.addEventListener('change',()=>{if(motion.matches)pause();else visibility();});
 if('IntersectionObserver'in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;visibility();},{threshold:.1}).observe(video);
 update();if(allowed())requestAnimationFrame(()=>{if(!document.hidden&&inView&&allowed())play();});
})();
