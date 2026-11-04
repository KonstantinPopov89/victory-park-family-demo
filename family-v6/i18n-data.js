(()=>{
 const assetVersions=/* vp-asset-versions:start */{"i18n-en.js":"dc9592ba99c4c081","i18n-hy.js":"f18f2a930082face"}/* vp-asset-versions:end */;
 const base=new URL('.',document.currentScript.src).pathname;
 const allowed=['ru','hy','en'],requested=new URLSearchParams(location.search).get('lang');
 let saved='ru';try{saved=localStorage.getItem('vpLang')||'ru';}catch{}
 const language=allowed.includes(requested)?requested:allowed.includes(saved)?saved:'ru';
 if(language==='ru'){window.VP_TRANSLATIONS={};return;}
 document.write('<script src="'+base+'i18n-'+language+'.js?vpv='+assetVersions['i18n-'+language+'.js']+'"><\/script>');
})();
