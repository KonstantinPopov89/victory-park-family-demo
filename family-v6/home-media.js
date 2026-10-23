/* Video enhances the hero; its poster and every action work without playback. */
(()=>{'use strict';
 const video=document.querySelector('[data-home-video]'),button=document.querySelector('[data-home-video-toggle]');
 if(!video||!button)return;
 const lang=document.documentElement.lang,copy={ru:['Пауза','Смотреть видео'],en:['Pause','Play video'],hy:['Դադար','Դիտել տեսանյութը']}[lang]||['Pause','Play video'];
 const motion=matchMedia('(prefers-reduced-motion: reduce)');let manuallyPaused=false,loaded=false,inView=true;
 const update=()=>{button.setAttribute('aria-label',copy[video.paused?1:0]);button.setAttribute('aria-pressed',String(!video.paused));button.dataset.playing=String(!video.paused);};
 function load(){if(loaded)return;video.src=video.dataset.src;loaded=true;}
 async function play(){load();try{await video.play();}catch{}update();}
 button.addEventListener('click',()=>{if(video.paused){manuallyPaused=false;play();}else{manuallyPaused=true;video.pause();}});
 video.addEventListener('play',update);video.addEventListener('pause',update);video.addEventListener('error',update);
 const allowed=()=>!motion.matches&&!navigator.connection?.saveData&&!manuallyPaused;
 const visibility=()=>{if(document.hidden||!inView)video.pause();else if(allowed())play();};
 document.addEventListener('visibilitychange',visibility);
 motion.addEventListener('change',()=>{if(motion.matches)video.pause();else visibility();});
 if('IntersectionObserver'in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;visibility();},{threshold:.1}).observe(video);
 update();if(allowed())requestAnimationFrame(()=>play());
})();
