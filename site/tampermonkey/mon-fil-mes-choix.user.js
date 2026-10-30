// ==UserScript==
// @name         Mon fil, mes choix — filtre Web personnel
// @namespace    https://github.com/janintibo-art/mon-fil-mes-choix
// @version      2.0.0
// @updateURL    https://raw.githubusercontent.com/janintibo-art/mon-fil-mes-choix/main/site/tampermonkey/mon-fil-mes-choix.user.js
// @downloadURL  https://raw.githubusercontent.com/janintibo-art/mon-fil-mes-choix/main/site/tampermonkey/mon-fil-mes-choix.user.js
// @description  Masque localement des résultats, cartes et publications selon une liste personnalisable (réseaux, recherche et sites web).
// @author       Communauté Mon fil, mes choix
// @match        *://*/*
// @run-at       document-idle
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

/*
 * Filtrage LOCAL uniquement : aucune requête réseau, aucun envoi de données.
 * Aucun compte Facebook/X/YouTube n'est bloqué côté serveur.
 * Liste de travail : la présence d'un nom ne constitue pas une accusation.
 * Pour modifier les règles : éditez la variable RULES, puis enregistrez.
 */
(() => {
  'use strict';
  const RULES = [{"name":"CNews","status":"review"},{"name":"Europe 1","status":"review"},{"name":"Le Journal du Dimanche (JDD)","status":"review"},{"name":"JDNews","status":"review"},{"name":"Frontières","status":"requested"},{"name":"L’Infiltré","status":"review"},{"name":"Canal+","status":"review"},{"name":"CStar","status":"review"},{"name":"Europe 2","status":"review"},{"name":"RFM","status":"review"},{"name":"Télé-Loisirs","status":"review"},{"name":"Femme Actuelle","status":"review"},{"name":"Voici","status":"review"},{"name":"GEO","status":"review"},{"name":"Capital","status":"review"},{"name":"Ça m’intéresse","status":"review"},{"name":"Cuisine Actuelle","status":"review"},{"name":"Prima","status":"review"},{"name":"Télé 2 semaines","status":"review"},{"name":"TV Grandes Chaînes","status":"review"},{"name":"Télé Z","status":"review"},{"name":"Ici Paris","status":"review"},{"name":"France Dimanche","status":"review"},{"name":"Gentside","status":"review"},{"name":"Oh My Mag","status":"review"},{"name":"Rassemblement national","status":"review"},{"name":"Marine Le Pen","status":"consider"},{"name":"Jordan Bardella","status":"consider"},{"name":"Rassemblement National de la Jeunesse","status":"review"},{"name":"Louis Aliot","status":"consider"},{"name":"Sébastien Chenu","status":"consider"},{"name":"Julien Odoul","status":"consider"},{"name":"Jean-Philippe Tanguy","status":"consider"},{"name":"Laure Lavalette","status":"consider"},{"name":"Caroline Parmentier","status":"consider"},{"name":"Reconquête","status":"review"},{"name":"Éric Zemmour","status":"consider"},{"name":"Sarah Knafo","status":"consider"},{"name":"Identité Libertés","status":"review"},{"name":"Marion Maréchal","status":"consider"},{"name":"Les Patriotes","status":"review"},{"name":"Florian Philippot","status":"review"},{"name":"Action française","status":"review"},{"name":"Valeurs actuelles","status":"review"},{"name":"Fdesouche","status":"review"},{"name":"Boulevard Voltaire","status":"review"},{"name":"TV Libertés","status":"review"},{"name":"Radio Courtoisie","status":"review"},{"name":"Causeur","status":"review"},{"name":"Collectif Némésis","status":"requested"},{"name":"Alice Cordier","status":"requested"},{"name":"Égalité et Réconciliation","status":"requested"},{"name":"Franck Allisio","status":"consider"},{"name":"Maxime Amblard","status":"consider"},{"name":"Bénédicte Auzanot","status":"consider"},{"name":"Philippe Ballard","status":"consider"},{"name":"Anchya Bamana","status":"consider"},{"name":"Romain Baubry","status":"consider"},{"name":"José Beaurain","status":"consider"},{"name":"Christophe Bentz","status":"consider"},{"name":"Théo Bernhardt","status":"consider"},{"name":"Guillaume Bigot","status":"consider"},{"name":"Bruno Bilde","status":"consider"},{"name":"Emmanuel Blairy","status":"consider"},{"name":"Sophie Blanc","status":"consider"},{"name":"Frédéric Boccaletti","status":"consider"},{"name":"Anthony Boulogne","status":"consider"},{"name":"Jorys Bovet","status":"consider"},{"name":"Jérôme Buisson","status":"consider"},{"name":"Eddy Casterman","status":"consider"},{"name":"Bernard Chaumeil","status":"consider"},{"name":"Roger Chudeau","status":"consider"},{"name":"Bruno Clavet","status":"consider"},{"name":"Caroline Colombier","status":"consider"},{"name":"Nathalie Da Conceicao Carvalho","status":"consider"},{"name":"Catherine Dellong Meng","status":"consider"},{"name":"Jocelyn Dessigny","status":"consider"},{"name":"Sandrine Dogor-Such","status":"consider"},{"name":"Nicolas Dragon","status":"consider"},{"name":"Alexandre Dufosset","status":"consider"},{"name":"Gaëtan Dussausaye","status":"consider"},{"name":"Aurélien Dutremble","status":"consider"},{"name":"Auguste Evrard","status":"consider"},{"name":"Frédéric Falcon","status":"consider"},{"name":"Muriel Fiol","status":"consider"},{"name":"Marc de Fleurian","status":"consider"},{"name":"Guillaume Florquin","status":"consider"},{"name":"Emmanuel Fouquart","status":"consider"},{"name":"Thierry Frappé","status":"consider"},{"name":"Julien Gabarron","status":"consider"},{"name":"Stéphanie Galzy","status":"consider"},{"name":"Laurence Gardet","status":"consider"},{"name":"Jonathan Gery","status":"consider"},{"name":"Benoît Gilhet","status":"consider"},{"name":"Yoann Gillet","status":"consider"},{"name":"Christian Girard","status":"consider"},{"name":"Antoine Golliot","status":"consider"},{"name":"José Gonzalez","status":"consider"},{"name":"Florence Goulet","status":"consider"},{"name":"Géraldine Grangier","status":"consider"},{"name":"Monique Griseti","status":"consider"},{"name":"Julien Guibert","status":"consider"},{"name":"Michel Guiniot","status":"consider"},{"name":"Jordan Guitton","status":"consider"},{"name":"Marine Hamelet","status":"consider"},{"name":"Timothée Houssin","status":"consider"},{"name":"Sébastien Humbert","status":"consider"},{"name":"Laurent Jacobelli","status":"consider"},{"name":"Pascal Jenft","status":"consider"},{"name":"Alexis Jolly","status":"consider"},{"name":"Tiffany Joncour","status":"consider"},{"name":"Édouard Jordan","status":"consider"},{"name":"Florence Joubert","status":"consider"},{"name":"Hélène Laporte","status":"consider"},{"name":"Robert Le Bourgeois","status":"consider"},{"name":"Julie Lechanteux","status":"consider"},{"name":"Nadine Lechon","status":"consider"},{"name":"Gisèle Lelouis","status":"consider"},{"name":"Hervé de Lépinau","status":"consider"},{"name":"Katiana Levavasseur","status":"consider"},{"name":"Julien Limongi","status":"consider"},{"name":"René Lioret","status":"consider"},{"name":"Christine Loir","status":"consider"},{"name":"Marie-France Lorho","status":"consider"},{"name":"Philippe Lottiaux","status":"consider"},{"name":"Alexandre Loubet","status":"consider"},{"name":"David Magnier","status":"consider"},{"name":"Claire Marais-Beuil","status":"consider"},{"name":"Matthieu Marchio","status":"consider"},{"name":"Pascal Markowsky","status":"consider"},{"name":"Patrice Martin","status":"consider"},{"name":"Michèle Martinez","status":"consider"},{"name":"Kévin Mauvieux","status":"consider"},{"name":"Nicolas Meizonnet","status":"consider"},{"name":"Joëlle Mélin","status":"consider"},{"name":"Yaël Ménaché","status":"consider"},{"name":"Thomas Ménagé","status":"consider"},{"name":"Pierre Meurin","status":"consider"},{"name":"Thibaut Monnier","status":"consider"},{"name":"Serge Muller","status":"consider"},{"name":"Thierry Perez","status":"consider"},{"name":"Kévin Pfeffer","status":"consider"},{"name":"Lisette Pollet","status":"consider"},{"name":"Stéphane Rambaud","status":"consider"},{"name":"Angélique Ranc","status":"consider"},{"name":"Julien Rancoule","status":"consider"},{"name":"Matthias Renault","status":"consider"},{"name":"Catherine Rimbert","status":"consider"},{"name":"Joseph Rivière","status":"consider"},{"name":"Laurence Robert-Dehault","status":"consider"},{"name":"Béatrice Roullaud","status":"consider"},{"name":"Sophie-Laurence Roy","status":"consider"},{"name":"Anaïs Sabatini","status":"consider"},{"name":"Alexandre Sabatou","status":"consider"},{"name":"Emeric Salmon","status":"consider"},{"name":"Philippe Schreck","status":"consider"},{"name":"Anne Sicard","status":"consider"},{"name":"Emmanuel Taché","status":"consider"},{"name":"Michaël Taverne","status":"consider"},{"name":"Thierry Tesson","status":"consider"},{"name":"Lionel Tivoli","status":"consider"},{"name":"Gabriel Tomatis","status":"consider"},{"name":"Romain Tonussi","status":"consider"},{"name":"Cyril Tribuiani","status":"consider"},{"name":"Antoine Villedieu","status":"consider"},{"name":"Frédéric-Pierre Vos","status":"consider"},{"name":"Frédéric Weber","status":"consider"},{"name":"Mathilde Androuët","status":"consider"},{"name":"Eléonore Bez","status":"consider"},{"name":"Manon Bouquin","status":"consider"},{"name":"Wallerand de Saint Just","status":"consider"},{"name":"Edwige Diaz","status":"consider"},{"name":"Thibaut François","status":"consider"},{"name":"Charles-Henri Gallois","status":"consider"},{"name":"Jean-Paul Garraud","status":"consider"},{"name":"Audrey Guibert","status":"consider"},{"name":"Andréa Kotarac","status":"consider"},{"name":"Jean-Lin Lacapelle","status":"consider"},{"name":"Alexandra Masson","status":"consider"},{"name":"Aleksandar Nikolic","status":"consider"},{"name":"Philippe Olivier","status":"consider"},{"name":"Ludovic Pajot","status":"consider"},{"name":"François Paradol","status":"consider"},{"name":"Gilles Pennelle","status":"consider"},{"name":"Julie Rechagneux","status":"consider"},{"name":"Julien Sanchez","status":"consider"},{"name":"Christopher Szczurek","status":"consider"},{"name":"Pierre-Romain Thionnet","status":"consider"},{"name":"Rody Tolassy","status":"consider"},{"name":"Matthieu Valet","status":"consider"},{"name":"Emma Vallain","status":"consider"},{"name":"Éric Ciotti","status":"consider"},{"name":"Alexandre Allegret-Pilot","status":"consider"},{"name":"Charles Alloncle","status":"consider"},{"name":"Matthieu Bloch","status":"consider"},{"name":"Pierre-Henri Carbonnel","status":"consider"},{"name":"Bernard Chaix","status":"consider"},{"name":"Marc Chavent","status":"consider"},{"name":"Christelle D’Intorni","status":"consider"},{"name":"Olivier Fayssat","status":"consider"},{"name":"Bartolomé Lenoir","status":"consider"},{"name":"Hanane Mansouri","status":"consider"},{"name":"Maxime Michelet","status":"consider"},{"name":"Éric Michoux","status":"consider"},{"name":"Sophie Ricourt Vaginay","status":"consider"},{"name":"Vincent Trébuchet","status":"consider"},{"name":"Antoine Valentin","status":"consider"},{"name":"Gérault Verny","status":"consider"},{"name":"Laurence Trochu","status":"consider"},{"name":"Gilbert Payet","status":"consider"},{"name":"Samuel Lafont","status":"consider"},{"name":"Thomas Culerrier","status":"consider"},{"name":"Hilaire Bouyé","status":"consider"},{"name":"Éléonore Lhéritier","status":"consider"},{"name":"Sophie Calvel","status":"consider"},{"name":"Mondane Langlois","status":"consider"},{"name":"Diane Ouvry","status":"consider"},{"name":"Matthieu Louves","status":"consider"},{"name":"Johanna Humphrey","status":"consider"},{"name":"Xavier Fourboul","status":"consider"},{"name":"Pierre-Yves Thomas","status":"consider"},{"name":"Isabelle Lamarque","status":"consider"},{"name":"Marie-Pierre Cesari","status":"consider"},{"name":"Julien Sene","status":"consider"},{"name":"Olivier Le Coq","status":"consider"},{"name":"Virginie Bonthoux","status":"consider"},{"name":"Romain Gresle","status":"consider"},{"name":"Laurent Chomard","status":"consider"},{"name":"Elisabeth de Saint Romain","status":"consider"},{"name":"Stanislas Rigault","status":"review"},{"name":"Damien Rieu","status":"review"},{"name":"Jean Messiha","status":"review"},{"name":"Papacito","status":"review"},{"name":"Thaïs d’Escufon","status":"review"},{"name":"Gilbert Collard","status":"review"},{"name":"Baptiste Marchais","status":"review"},{"name":"Tanguy David","status":"review"},{"name":"Pierre-Édouard Stérin","status":"requested"},{"name":"Arnaud Rérolle","status":"requested"},{"name":"François Durvye","status":"requested"},{"name":"Alexandre Pesey","status":"review"},{"name":"Alban du Rostu","status":"review"},{"name":"Charles Beigbeder","status":"review"},{"name":"Alexandre Avril","status":"review"},{"name":"Philippe de Gestas","status":"review"},{"name":"Stéphane Ravier","status":"review"},{"name":"Claire Geronimi","status":"review"},{"name":"Edward Whalley","status":"review"},{"name":"Périclès","status":"requested"},{"name":"Fonds du bien commun","status":"review"},{"name":"Institut de formation politique (IFP)","status":"review"},{"name":"Politicae","status":"review"},{"name":"Observatoire de l’immigration et de la démographie (OID)","status":"review"},{"name":"L’Incorrect","status":"review"},{"name":"IREF (Institut de recherches économiques et fiscales)","status":"review"},{"name":"Contrepoints","status":"review"},{"name":"Otium Capital","status":"review"},{"name":"Benyamin Netanyahou","status":"requested"},{"name":"Meyer Habib","status":"requested"},{"name":"Donald Trump","status":"requested"},{"name":"Geert Wilders","status":"requested"},{"name":"Santiago Abascal","status":"requested"},{"name":"Viktor Orbán","status":"requested"},{"name":"Javier Milei","status":"requested"},{"name":"Itamar Ben-Gvir","status":"requested"},{"name":"Bezalel Smotrich","status":"requested"},{"name":"Aryeh Deri","status":"requested"},{"name":"Amichai Chikli","status":"requested"},{"name":"Matteo Salvini","status":"review"},{"name":"Likoud","status":"requested"},{"name":"Otzma Yehudit (Pouvoir juif)","status":"requested"},{"name":"Sionisme religieux (Religious Zionism)","status":"requested"},{"name":"Shas","status":"requested"},{"name":"Judaïsme unifié de la Torah (United Torah Judaism)","status":"requested"},{"name":"Mathilda (porte-parole du Collectif Némésis)","status":"review"},{"name":"Léa (porte-parole du Collectif Némésis)","status":"review"},{"name":"Yona (porte-parole du Collectif Némésis)","status":"review"},{"name":"Astrid (porte-parole du Collectif Némésis)","status":"review"},{"name":"Jeunesses identitaires","status":"requested"},{"name":"Une Autre Jeunesse","status":"review"},{"name":"Génération identitaire","status":"consider"},{"name":"Les Identitaires / Bloc identitaire","status":"review"},{"name":"GUD / GUD Paris (Groupe Union Défense)","status":"requested"},{"name":"Jean-Eudes Gannat","status":"requested"},{"name":"L’Alvarium","status":"consider"},{"name":"Mouvement chouan","status":"consider"},{"name":"Rassemblement des étudiants de droite (RED)","status":"review"},{"name":"Comité du 9 mai (C9M)","status":"review"},{"name":"Bordeaux Nationaliste / Bordeaux Nationalistes","status":"review"},{"name":"Paul-Alexandre Martin","status":"review"},{"name":"Ligue Ligérienne","status":"review"},{"name":"Alain Soral","status":"requested"},{"name":"Kontre Kulture","status":"consider"},{"name":"ERFM / Écoute et Respect","status":"consider"},{"name":"Faits & Documents","status":"consider"},{"name":"Au Bon Sens","status":"review"},{"name":"Pierre de Brague","status":"review"},{"name":"Julien Limes","status":"review"},{"name":"Dieudonné M’Bala M’Bala","status":"review"},{"name":"Philippe Péninque","status":"review"},{"name":"Jildaz Mahé O’Chinal","status":"review"},{"name":"Frédéric Chatillon","status":"review"},{"name":"Vincent Lapierre","status":"review"}];
  const DOMAINS = [{"host":"cnews.fr","label":"CNews"},{"host":"europe1.fr","label":"Europe 1"},{"host":"lejdd.fr","label":"Le Journal du Dimanche"},{"host":"valeursactuelles.com","label":"Valeurs actuelles"},{"host":"fdesouche.com","label":"Fdesouche"},{"host":"bvoltaire.fr","label":"Boulevard Voltaire"},{"host":"tvl.fr","label":"TV Libertés"},{"host":"kontrekulture.com","label":"Kontre Kulture"},{"host":"causeur.fr","label":"Causeur"}];
  const SKIP_HOSTS = ['localhost', '127.0.0.1', 'janintibo-art.github.io'];
  const host = location.hostname.toLowerCase().replace(/^www\./, '');
  if (SKIP_HOSTS.some(d => host===d || host.endsWith('.'+d))) return;

  const key = 'mfm_filter_web_v2_';
  let enabled = Boolean(GM_getValue(key+'enabled', true));
  let mode = String(GM_getValue(key+'mode', 'all')); // all=303 entrées, requested=demandes explicites
  let domainsEnabled = Boolean(GM_getValue(key+'domains', true));
  let revealOnce = false;
  let domainRevealOnce = false;
  let hiddenCount = 0;
  let scheduled = false;
  let observed = false;
  let scanning = false;
  const seen = new WeakSet();
  const hidden = new Set();
  const MAX_TEXT = 1800;

  function normalize(v) {
    return String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[’‘']/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
  }
  const ALIASES = {
    'GUD / GUD Paris (Groupe Union Défense)': ['GUD Paris','Groupe Union Défense'],
    'Le Journal du Dimanche (JDD)': ['Journal du Dimanche'],
    'Otzma Yehudit (Pouvoir juif)': ['Otzma Yehudit'],
    'Sionisme religieux (Religious Zionism)': ['Religious Zionism'],
    'Collectif Némésis': ['Collectif Nemesis'],
    'Rassemblement des étudiants de droite (RED)': ['Rassemblement des étudiants de droite'],
  };
  function prepare() {
    return RULES.filter(r => (mode==='all' || r.status==='requested'))
      .flatMap(r => [r.name,...(ALIASES[r.name]||[])].map(name=>({name:r.name,term:normalize(name)})))
      // Avoid matching short generic words, common acronyms and first names.
      .filter(r => r.term.length>=5 && (r.term.includes(' ') || r.term.length>=7 || r.term==='cnews'))
      .sort((a,b)=>b.term.length-a.term.length);
  }
  let TERMS = prepare();
  function findName(text) {
    const n=' '+normalize(String(text||'').slice(0,MAX_TEXT))+' ';
    if (n.length<8) return '';
    for (const r of TERMS) {
      if (!n.includes(' '+r.term+' ')) continue;
      // "frontières" is an ordinary French noun: require a capitalized media name.
      if(r.name==='Frontières' && !/(?:^|[^\p{L}])Frontières(?![\p{L}])/u.test(text))continue;
      return r.name;
    }
    // Distinctive all-caps acronym in the original visible content.
    if (mode==='all'||RULES.some(r=>r.status==='requested'&&r.name.startsWith('GUD /')))
      if(/(?:^|[^\p{L}\p{N}])GUD(?![\p{L}\p{N}])/u.test(text))return 'GUD / GUD Paris (Groupe Union Défense)';
    return '';
  }
  function blockedDomain() {
    return DOMAINS.find(d => host===d.host || host.endsWith('.'+d.host));
  }
  function addCSS() {
    if (document.getElementById('mfm-filter-style')) return;
    const css=document.createElement('style');css.id='mfm-filter-style';
    css.textContent='[data-mfm-hidden="1"]{display:none!important}#mfm-screen{position:fixed!important;inset:0!important;z-index:2147483647!important;background:#0a1728!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:24px!important;font:16px/1.6 system-ui,sans-serif!important}#mfm-screen .mfm-box{width:min(550px,100%);background:#132d3b;border:1px solid #52717b;border-radius:22px;padding:34px;box-shadow:0 20px 100px #0007}#mfm-screen button{margin:12px 8px 0 0;padding:12px 15px;border:0;border-radius:9px;cursor:pointer;font:600 14px system-ui;background:#d9efb4;color:#102522}#mfm-screen .mfm-muted{background:transparent;border:1px solid #8aa;color:white}';
    (document.head||document.documentElement).appendChild(css);
  }
  function unhideAll() {
    hidden.forEach(el=>{try{el.removeAttribute('data-mfm-hidden');el.removeAttribute('data-mfm-name')}catch(e){}});
    hidden.clear();hiddenCount=0;
    document.getElementById('mfm-screen')?.remove();
  }
  function menu() {
    GM_registerMenuCommand(enabled?'⏸ Désactiver le filtre':'▶ Activer le filtre', ()=>{
      enabled=!enabled;GM_setValue(key+'enabled',enabled);
      if (!enabled) unhideAll(); else {seenReset();scan(true)}
      alert('Mon fil, mes choix : '+(enabled?'filtre activé. Rechargez la page pour appliquer tous les réglages.':'filtre désactivé.'));
    });
    GM_registerMenuCommand(mode==='all'?'🛡 Mode : liste complète (303) → blocages demandés':'🛡 Mode : blocages demandés → liste complète', ()=>{
      mode=mode==='all'?'requested':'all';GM_setValue(key+'mode',mode);TERMS=prepare();
      unhideAll();seenReset();scan(true);
      alert('Mode '+(mode==='all'?'liste complète':'demandes explicites')+'. Rechargez la page si nécessaire.');
    });
    GM_registerMenuCommand(domainsEnabled?'🌐 Désactiver le masquage des domaines':'🌐 Activer le masquage des domaines',()=>{
      domainsEnabled=!domainsEnabled;GM_setValue(key+'domains',domainsEnabled);
      document.getElementById('mfm-screen')?.remove();scan(true);
      alert('Blocage de domaines '+(domainsEnabled?'activé':'désactivé')+'.');
    });
    GM_registerMenuCommand('👁 Afficher tout sur cette page (jusqu’au rechargement)',()=>{
      revealOnce=true;domainRevealOnce=true;unhideAll();
    });
    GM_registerMenuCommand('ℹ Aide et compteurs',()=>alert('Mon fil, mes choix\n'+RULES.length+' entrées. '+TERMS.length+' règles textuelles utilisables.\n'+DOMAINS.length+' domaines.\n'+hiddenCount+' éléments masqués sur cette page.\nAucun compte n’est bloqué sur les plateformes.'));
  }
  function seenReset() { // Existing WeakSet cannot be cleared; tracked elements are enough for rescan.
    document.querySelectorAll('[data-mfm-scanned]').forEach(e=>e.removeAttribute('data-mfm-scanned'));
  }
  function showBlockedDomain(domain){
    if (!document.body || document.getElementById('mfm-screen')) return;
    const wrap=document.createElement('div');wrap.id='mfm-screen';
    const panel=document.createElement('div');panel.className='mfm-box';
    const title=document.createElement('h1');title.textContent='Site masqué';title.style.cssText='color:#d9efb4;font-size:34px;margin:0 0 8px';
    const p=document.createElement('p');p.textContent='« '+domain.label+' » fait partie de votre liste personnelle de domaines à masquer. Vous pouvez afficher ce site une fois ou désactiver cette protection.';
    const note=document.createElement('p');note.textContent='Ce filtre agit uniquement dans votre navigateur, pas sur Internet ni sur votre compte.';note.style.cssText='color:#bdcbd4;font-size:13px';
    const open=document.createElement('button');open.type='button';open.textContent='Afficher ce site une fois';open.addEventListener('click',()=>{domainRevealOnce=true;wrap.remove();scan(true)});
    const off=document.createElement('button');off.type='button';off.className='mfm-muted';off.textContent='Désactiver le blocage des domaines';off.addEventListener('click',()=>{domainsEnabled=false;GM_setValue(key+'domains',false);wrap.remove();scan(true)});
    panel.append(title,p,note,open,off);wrap.appendChild(panel);document.body.appendChild(wrap);
  }

  function selectors() {
    const s=['article','[role="article"]','[data-testid="tweet"]','[data-testid="post-container"]',
       'ytd-video-renderer','ytd-rich-item-renderer','ytd-compact-video-renderer','ytd-grid-video-renderer',
       'ytd-reel-item-renderer','yt-lockup-view-model','ytd-comment-thread-renderer',
       '.post-card','.search-result','.video-card','.news-card','.post-list-item'];
    if (host.startsWith('www.google.')||host.startsWith('google.')||host.includes('.google.'))
      s.push('#search .MjjYud','#search .g','#rso .g');
    if (host==='bing.com' || host.endsWith('.bing.com')) s.push('#b_results li.b_algo');
    if (host==='duckduckgo.com' || host.endsWith('.duckduckgo.com'))
      s.push('article[data-testid="result"]','[data-testid="result"]');
    if (host==='x.com'||host==='twitter.com') s.push('[data-testid="cellInnerDiv"]');
    if (host.endsWith('.reddit.com')) s.push('shreddit-post','[data-testid="post-container"]');
    if (host.includes('facebook.com')) s.push('[data-pagelet*="FeedUnit"]');
    return [...new Set(s)];
  }
  const cardSelector=selectors().join(',');
  function mask(el,match){
    if (hidden.has(el)) return;
    el.setAttribute('data-mfm-hidden','1');el.setAttribute('data-mfm-name',match);
    hidden.add(el);hiddenCount++;
  }
  function scan(force=false){
    if (!enabled||revealOnce||!document.body||scanning) return;
    scanning=true;
    try {
      if(domainsEnabled && !domainRevealOnce) {
        const domain=blockedDomain(); if(domain) {showBlockedDomain(domain);return}
      }
      addCSS();
      // Never hide forms, editable controls, page-level containers or the tool's own overlay.
      const cards=document.querySelectorAll(cardSelector);
      let checked=0;
      for(const el of cards){
        if(++checked>1400)break;
        if(el.closest('#mfm-screen,[contenteditable="true"],form'))continue;
        if(!force && el.hasAttribute('data-mfm-scanned'))continue;
        const txt=(el.innerText||el.textContent||'').slice(0,MAX_TEXT);
        el.setAttribute('data-mfm-scanned','1');
        // Avoid hiding entire timelines / broad wrappers when they aggregate many items.
        if(txt.length>MAX_TEXT-1)continue;
        const match=findName(txt);
        if(match)mask(el,match);
      }
      // Links whose visible title matches; never remove site navigation containers.
      const links=document.querySelectorAll('main a, #search a, #rso a, #b_results a, [role="main"] a');
      let count=0;
      for(const a of links){
        if(++count>600)break;
        if(a.closest('#mfm-screen,form,[data-mfm-hidden="1"]'))continue;
        if(!force && a.hasAttribute('data-mfm-scanned'))continue;
        a.setAttribute('data-mfm-scanned','1');
        const txt=(a.innerText||a.getAttribute('aria-label')||'').slice(0,200);
        if(txt.length>190 || txt.length<4)continue;
        const match=findName(txt);if(match)mask(a,match);
      }
    } finally {scanning=false}
  }
  function schedule(){if(!enabled||revealOnce||scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;scan()},650)}
  addCSS();menu();scan();
  const ob=new MutationObserver(records=>{
    if(records.every(r => r.type==='attributes' && r.attributeName?.startsWith('data-mfm-')))return;
    schedule();
  });
  ob.observe(document.documentElement,{childList:true,subtree:true,attributes:false});
  setInterval(()=>{if(enabled&&!revealOnce)scan()},8000);
})();
