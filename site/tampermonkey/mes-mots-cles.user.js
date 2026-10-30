// ==UserScript==
// @name         Mon fil, mes choix — Invisibilité personnelle (facultatif)
// @namespace    https://github.com/janintibo-art/mon-fil-mes-choix
// @version      1.1.0
// @description  Masquer discrètement les cartes contenant vos mots-clés, avec pause et exceptions par site.
// @updateURL    https://raw.githubusercontent.com/janintibo-art/mon-fil-mes-choix/main/site/tampermonkey/mes-mots-cles.user.js
// @downloadURL  https://raw.githubusercontent.com/janintibo-art/mon-fil-mes-choix/main/site/tampermonkey/mes-mots-cles.user.js
// @match        *://*/*
// @run-at       document-idle
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==
/* Module indépendant, gratuit et local. Les mots-clés sont choisis par l'utilisateur.
 * Seules des cartes visibles sont masquées ; aucun contenu n'est effacé du site.
 * Limites : texte présent dans le DOM, sélecteurs de cartes compatibles, pas les images seules.
 */
(() => {
  'use strict';
  const WORDS_KEY='mfm_keywords_v26';
  const ACTIVE_KEY='mfm_keywords_active_v26';
  const EXCEPT_KEY='mfm_keywords_exceptions_v27';
  const MARK='data-mfm-invisible-v27';
  const STYLE_KEY='data-mfm-invisibility-style';
  const MAX_WORDS=60;
  const MAX_NODES=1200;
  const CARDS=[
    'article','[role="article"]','[data-testid="tweet"]','[data-testid="post-container"]',
    '.MjjYud','.g','.Ww4FFb','.SoaBEf','.Gx5Zad','.result','.search-result',
    '.feed-shared-update-v2','.post','.story','[data-subreddit-post-id]'
  ].join(',');
  const UNSAFE='html,body,main,header,footer,nav,form,aside,[role="dialog"],[role="navigation"],textarea,input,button,[contenteditable="true"]';
  const hidden=new Map();
  const hostname=location.hostname.toLowerCase();
  const cleanWords = raw => [...new Set(String(raw).split(/[\n;,]+/u).map(v=>v.trim().replace(/\s+/gu,' ')).filter(v=>v.length>=3&&v.length<=70))].slice(0,MAX_WORDS);
  const cleanHosts = raw => [...new Set(String(raw).split(/[\n;,\s]+/u).map(v=>v.trim().toLowerCase().replace(/^https?:\/\//u,'').replace(/\/.*$/u,'')).filter(v=>/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/u.test(v)))].slice(0,100);
  let words=cleanWords(GM_getValue(WORDS_KEY,''));
  let active=Boolean(GM_getValue(ACTIVE_KEY,true));
  let exceptions=cleanHosts(GM_getValue(EXCEPT_KEY,''));
  let paused=false;
  const excluded = () => exceptions.some(h=>hostname===h||hostname.endsWith('.'+h));
  const escapeRx=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const buildPatterns=()=>words.map(w=>new RegExp('(^|[^\\p{L}\\p{N}])'+escapeRx(w).replace(/ /g,'\\s+')+'(?=$|[^\\p{L}\\p{N}])','iu'));
  let patterns=buildPatterns();
  const stylesheet=document.createElement('style');
  stylesheet.setAttribute(STYLE_KEY,'');
  stylesheet.textContent=`[${MARK}]{display:none!important}`;
  (document.head||document.documentElement).appendChild(stylesheet);
  function restore(){
    for(const el of hidden.keys())el.removeAttribute(MARK);
    hidden.clear();
  }
  function cardText(el){
    // innerText excludes hidden text and is readable; only short, self-contained cards qualify.
    return (el.innerText||'').slice(0,14000);
  }
  function eligible(el){
    if(!el.isConnected||el.matches(UNSAFE)||el.closest('form,[role="dialog"],[contenteditable="true"]'))return false;
    if(el.querySelectorAll('article,[role="article"],.MjjYud,.g').length>5)return false;
    const value=cardText(el);
    if(value.length<8||value.length>14000)return false;
    // Don't hide an entire page, a content column or a wrapper around multiple articles.
    if(el.clientHeight>Math.max(1800,window.innerHeight*2.5))return false;
    return true;
  }
  function scan(){
    if(!active||paused||excluded()||!patterns.length)return;
    let count=0;
    for(const el of document.querySelectorAll(CARDS)){
      if(++count>MAX_NODES)break;
      if(hidden.has(el)||!eligible(el))continue;
      const matched=patterns.some(rx=>rx.test(cardText(el)));
      if(matched){el.setAttribute(MARK,'');hidden.set(el,true);}
    }
    for(const el of hidden.keys())if(!el.isConnected)hidden.delete(el);
  }
  function rescan(){restore();schedule(true);}
  function editWords(){
    const raw=prompt('MODE INVISIBILITÉ — Mots ou expressions à masquer (une par ligne).\nExemple : Le Pen\n\nUne carte mentionnant ces termes peut disparaître, même si elle critique la personne.\nLaissez vide pour tout retirer.',words.join('\n'));
    if(raw===null)return;
    const next=cleanWords(raw.replace(/\\n/gu,'\n'));
    if(raw.trim()&&!next.length){alert('Saisissez des expressions de 3 à 70 caractères.');return;}
    words=next;patterns=buildPatterns();GM_setValue(WORDS_KEY,words.join('\n'));rescan();
    alert(words.length+' expression(s) enregistrée(s).');
  }
  function editExceptions(){
    const raw=prompt('Sites sur lesquels NE RIEN MASQUER (un domaine par ligne).\nExemple : exemple.org\nLes sous-domaines sont inclus.',exceptions.join('\n'));
    if(raw===null)return;
    exceptions=cleanHosts(raw);GM_setValue(EXCEPT_KEY,exceptions.join('\n'));rescan();
    alert(exceptions.length+' site(s) ou domaine(s) autorisé(s).');
  }
  GM_registerMenuCommand('✏️ Mes mots-clés invisibles',editWords);
  GM_registerMenuCommand('⏯ Activer / désactiver durablement',()=>{
    active=!active;GM_setValue(ACTIVE_KEY,active);paused=false;rescan();
    alert(active?'Invisibilité activée':'Invisibilité désactivée : tout est réaffiché.');
  });
  GM_registerMenuCommand('👁 Tout réafficher sur cet onglet',()=>{paused=true;restore();});
  GM_registerMenuCommand('▶ Reprendre sur cet onglet',()=>{paused=false;schedule(true);});
  GM_registerMenuCommand('✅ Exceptions : sites à préserver',editExceptions);
  GM_registerMenuCommand('ℹ️ Ce qui peut ou non disparaître',()=>alert('Masquage local de cartes reconnues par leur texte visible, sans notification à chaque masquage. Les images seules, vidéos sans titre, applications hors navigateur et contenus non compatibles ne peuvent pas être garantis. Une simple mention du mot-clé peut aussi masquer un contenu utile.'));
  let pending=false;
  function schedule(immediate=false){
    if(pending||!active||paused||excluded())return;
    pending=true;
    setTimeout(()=>{pending=false;scan();},immediate?0:500);
  }
  // Observe new cards only, not our attribute updates, to avoid feedback loops.
  new MutationObserver(records=>{
    if(records.some(r=>r.addedNodes.length||r.removedNodes.length))schedule();
  }).observe(document.documentElement,{childList:true,subtree:true});
  scan();
})();
