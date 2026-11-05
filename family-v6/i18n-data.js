(()=>{
 const assetVersions=/* vp-asset-versions:start */{"i18n-en.js":"4ebd06df93faa490","i18n-hy.js":"67b5d5937de2b666"}/* vp-asset-versions:end */;
 const base=new URL('.',document.currentScript.src).pathname;
 const allowed=['ru','hy','en'],requested=new URLSearchParams(location.search).get('lang');
 let saved='ru';try{saved=localStorage.getItem('vpLang')||'ru';}catch{}
 const language=allowed.includes(requested)?requested:allowed.includes(saved)?saved:'ru';
 if(language==='ru'){window.VP_TRANSLATIONS={};return;}
 document.write('<script src="'+base+'i18n-'+language+'.js?vpv='+assetVersions['i18n-'+language+'.js']+'"><\/script>');
})();
