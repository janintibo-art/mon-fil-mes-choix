// ==UserScript==
// @name         Mon fil, mes choix — Mots-clés personnels (facultatif)
// @namespace    https://github.com/janintibo-art/mon-fil-mes-choix
// @version      1.0.0
// @description  Masquer les cartes de résultats et publications contenant vos expressions choisies, quel que soit le média.
// @match        *://*/*
// @run-at       document-idle
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==
/* Outil local, indépendant et facultatif. Aucune liste prédéfinie, aucune requête réseau.
 * Filtre par texte visible des cartes de résultats, pas le DNS, ni tous les contenus.
 * Ne tente jamais de masquer un article entier, un formulaire ou les contrôles de navigation.
 */
(() => {
  'use strict';
  const KEY='mfm_keywords_v26';
  const ACTIVE='mfm_keywords_active_v26';
  const MARK='data-mfm-keyword-hidden';
  const LIMIT=60;
  const MIN=3;
  const MAX=70;
  const src=String(GM_getValue(KEY,''));
  let active=Boolean(GM_getValue(ACTIVE,true));
  function clean(raw){
    return [...new Set(String(raw).split(/[\n;,]+/u).map(x=>x.trim().replace(/\s+/gu,' ')).filter(x=>x.length>=MIN&&x.length<=MAX))].slice(0,LIMIT);
  }
  let words=clean(src);
  const escapeRx=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  function compile(){return words.map(w=>({term:w,rx:new RegExp('(^|[^\\p{L}\\p{N}])'+escapeRx(w).replace(/\\ /g,'\\s+')+'(?=$|[^\\p{L}\\p{N}])','iu')}));}
  let patterns=compile();
  const CARDS=[
    'article','[role="article"]','[data-testid="tweet"]','[data-testid="post-container"]',
    '.MjjYud','.g','.Ww4FFb','.SoaBEf','.Gx5Zad','.result','.search-result',
    '.feed-shared-update-v2','.post','.story','[data-subreddit-post-id]'
  ].join(',');
  const EXCLUDE='header,footer,nav,main,body,html,form,[contenteditable="true"],textarea,input,button,[role="dialog"],[role="navigation"]';
  const hidden=new Set();
  function restore(){for(const el of hidden){if(el.isConnected){el.style.removeProperty('display');el.removeAttribute(MARK);}}hidden.clear();}
  function match(txt){for(const {term,rx} of patterns)if(rx.test(txt))return term;return null;}
  function validCard(el){
    if(!el||!el.isConnected||el.matches(EXCLUDE)||el.closest('form,[role="dialog"]'))return false;
    const len=(el.innerText||'').length;
    // Cards only; do not remove an entire results page or a huge feed wrapper.
    if(len<8||len>14000)return false;
    if(el.querySelectorAll('article,[role="article"],.MjjYud,.g').length>6)return false;
    return true;
  }
  function scan(){
    if(!active||!patterns.length)return;
    let tested=0;
    for(const el of document.querySelectorAll(CARDS)){
      if(++tested>900)break;
      if(el.hasAttribute(MARK)||!validCard(el))continue;
      const txt=(el.innerText||'').slice(0,14000);
      const term=match(txt);
      if(term){el.style.setProperty('display','none','important');el.setAttribute(MARK,term);hidden.add(el);}
    }
  }
  function configure(){
    const value=prompt('Mots ou expressions à masquer (une expression par ligne).\\nExemple : Le Pen\\n\\nLes sites et médias ne sont pas bloqués : seules certaines cartes contenant ces termes sont masquées.\\nLaissez vide pour retirer tous les mots-clés.',words.join('\\n'));
    if(value===null)return;
    const next=clean(value.replace(/\\n/g,'\n'));
    if(value.trim()&&!next.length){alert('Aucune expression valide : entrez de 3 à 70 caractères.');return;}
    words=next;patterns=compile();GM_setValue(KEY,words.join('\n'));restore();scan();
    alert(words.length+' expression(s) enregistrée(s). Les changements sont locaux et réversibles.');
  }
  GM_registerMenuCommand('✏️ Mes mots-clés à masquer',configure);
  GM_registerMenuCommand('👁 Montrer tout temporairement',()=>{active=false;restore();});
  GM_registerMenuCommand('⏯ Activer / désactiver les mots-clés',()=>{active=!active;GM_setValue(ACTIVE,active);restore();scan();alert(active?'Filtre de mots-clés activé':'Filtre de mots-clés désactivé');});
  GM_registerMenuCommand('ℹ️ Limites du filtrage',()=>alert('Le module masque certains blocs visibles sur des pages compatibles. Il ne peut pas filtrer toutes les applications, vidéos, images, articles ou sites dynamiques. Une mention incidente peut masquer une carte utile.'));
  let pending=false;
  function schedule(){if(pending||!active)return;pending=true;setTimeout(()=>{pending=false;scan();},650);}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  scan();
})();
