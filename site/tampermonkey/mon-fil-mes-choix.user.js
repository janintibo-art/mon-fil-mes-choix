// ==UserScript==
// @name         Mon fil, mes choix — filtre Web personnel
// @namespace    https://github.com/janintibo-art/mon-fil-mes-choix
// @version      3.8.0
// @updateURL    https://raw.githubusercontent.com/janintibo-art/mon-fil-mes-choix/main/site/tampermonkey/mon-fil-mes-choix.user.js
// @downloadURL  https://raw.githubusercontent.com/janintibo-art/mon-fil-mes-choix/main/site/tampermonkey/mon-fil-mes-choix.user.js
// @description  V32 : correction des fiches, photos et resultats Google.
// @author       Communauté Mon fil, mes choix
// @match        *://*/*
// @run-at       document-idle
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==
/*
 * Filtrage local et réversible, sans envoi de données. Les listes sont des préférences
 * personnelles : elles ne qualifient pas les personnes ou organisations citées.
 * Les 303 entrées sont embarquées : le script fonctionne sans téléchargement de liste.
 */
(() => {
  'use strict';
  const RULES = [{"name":"CNews","group":"Médias et groupes de presse","status":"review","id":1},{"name":"Europe 1","group":"Médias et groupes de presse","status":"review","id":2},{"name":"Le Journal du Dimanche (JDD)","group":"Médias et groupes de presse","status":"review","id":3},{"name":"JDNews","group":"Médias et groupes de presse","status":"review","id":4},{"name":"Frontières","group":"Médias et groupes de presse","status":"requested","id":5},{"name":"L’Infiltré","group":"Médias et groupes de presse","status":"review","id":6},{"name":"Canal+","group":"Médias et groupes de presse","status":"review","id":7},{"name":"CStar","group":"Médias et groupes de presse","status":"review","id":8},{"name":"Europe 2","group":"Médias et groupes de presse","status":"review","id":9},{"name":"RFM","group":"Médias et groupes de presse","status":"review","id":10},{"name":"Télé-Loisirs","group":"Médias et groupes de presse","status":"review","id":11},{"name":"Femme Actuelle","group":"Médias et groupes de presse","status":"review","id":12},{"name":"Voici","group":"Médias et groupes de presse","status":"review","id":13},{"name":"GEO","group":"Médias et groupes de presse","status":"review","id":14},{"name":"Capital","group":"Médias et groupes de presse","status":"review","id":15},{"name":"Ça m’intéresse","group":"Médias et groupes de presse","status":"review","id":16},{"name":"Cuisine Actuelle","group":"Médias et groupes de presse","status":"review","id":17},{"name":"Prima","group":"Médias et groupes de presse","status":"review","id":18},{"name":"Télé 2 semaines","group":"Médias et groupes de presse","status":"review","id":19},{"name":"TV Grandes Chaînes","group":"Médias et groupes de presse","status":"review","id":20},{"name":"Télé Z","group":"Médias et groupes de presse","status":"review","id":21},{"name":"Ici Paris","group":"Médias et groupes de presse","status":"review","id":22},{"name":"France Dimanche","group":"Médias et groupes de presse","status":"review","id":23},{"name":"Gentside","group":"Médias et groupes de presse","status":"review","id":24},{"name":"Oh My Mag","group":"Médias et groupes de presse","status":"review","id":25},{"name":"Rassemblement national","group":"RN et alliés politiques","status":"review","id":26},{"name":"Marine Le Pen","group":"RN et alliés politiques","status":"consider","id":27},{"name":"Jordan Bardella","group":"RN et alliés politiques","status":"consider","id":28},{"name":"Rassemblement National de la Jeunesse","group":"RN et alliés politiques","status":"review","id":29},{"name":"Louis Aliot","group":"RN et alliés politiques","status":"consider","id":30},{"name":"Sébastien Chenu","group":"RN et alliés politiques","status":"consider","id":31},{"name":"Julien Odoul","group":"RN et alliés politiques","status":"consider","id":32},{"name":"Jean-Philippe Tanguy","group":"RN et alliés politiques","status":"consider","id":33},{"name":"Laure Lavalette","group":"RN et alliés politiques","status":"consider","id":34},{"name":"Caroline Parmentier","group":"RN et alliés politiques","status":"consider","id":35},{"name":"Reconquête","group":"Reconquête et autres mouvements","status":"review","id":36},{"name":"Éric Zemmour","group":"Reconquête et autres mouvements","status":"consider","id":37},{"name":"Sarah Knafo","group":"Reconquête et autres mouvements","status":"consider","id":38},{"name":"Identité Libertés","group":"Reconquête et autres mouvements","status":"review","id":39},{"name":"Marion Maréchal","group":"Reconquête et autres mouvements","status":"consider","id":40},{"name":"Les Patriotes","group":"Reconquête et autres mouvements","status":"review","id":41},{"name":"Florian Philippot","group":"Reconquête et autres mouvements","status":"review","id":42},{"name":"Action française","group":"Reconquête et autres mouvements","status":"review","id":43},{"name":"Valeurs actuelles","group":"Médias et groupes de presse","status":"review","id":44},{"name":"Fdesouche","group":"Médias et groupes de presse","status":"review","id":45},{"name":"Boulevard Voltaire","group":"Médias et groupes de presse","status":"review","id":46},{"name":"TV Libertés","group":"Médias et groupes de presse","status":"review","id":47},{"name":"Radio Courtoisie","group":"Médias et groupes de presse","status":"review","id":48},{"name":"Causeur","group":"Médias et groupes de presse","status":"review","id":49},{"name":"Collectif Némésis","group":"Médias et groupes de presse","status":"requested","id":50},{"name":"Alice Cordier","group":"Médias et groupes de presse","status":"requested","id":51},{"name":"Égalité et Réconciliation","group":"Médias et groupes de presse","status":"requested","id":52},{"name":"Franck Allisio","group":"RN et alliés politiques","status":"consider","id":53},{"name":"Maxime Amblard","group":"RN et alliés politiques","status":"consider","id":54},{"name":"Bénédicte Auzanot","group":"RN et alliés politiques","status":"consider","id":55},{"name":"Philippe Ballard","group":"RN et alliés politiques","status":"consider","id":56},{"name":"Anchya Bamana","group":"RN et alliés politiques","status":"consider","id":57},{"name":"Romain Baubry","group":"RN et alliés politiques","status":"consider","id":58},{"name":"José Beaurain","group":"RN et alliés politiques","status":"consider","id":59},{"name":"Christophe Bentz","group":"RN et alliés politiques","status":"consider","id":60},{"name":"Théo Bernhardt","group":"RN et alliés politiques","status":"consider","id":61},{"name":"Guillaume Bigot","group":"RN et alliés politiques","status":"consider","id":62},{"name":"Bruno Bilde","group":"RN et alliés politiques","status":"consider","id":63},{"name":"Emmanuel Blairy","group":"RN et alliés politiques","status":"consider","id":64},{"name":"Sophie Blanc","group":"RN et alliés politiques","status":"consider","id":65},{"name":"Frédéric Boccaletti","group":"RN et alliés politiques","status":"consider","id":66},{"name":"Anthony Boulogne","group":"RN et alliés politiques","status":"consider","id":67},{"name":"Jorys Bovet","group":"RN et alliés politiques","status":"consider","id":68},{"name":"Jérôme Buisson","group":"RN et alliés politiques","status":"consider","id":69},{"name":"Eddy Casterman","group":"RN et alliés politiques","status":"consider","id":70},{"name":"Bernard Chaumeil","group":"RN et alliés politiques","status":"consider","id":71},{"name":"Roger Chudeau","group":"RN et alliés politiques","status":"consider","id":72},{"name":"Bruno Clavet","group":"RN et alliés politiques","status":"consider","id":73},{"name":"Caroline Colombier","group":"RN et alliés politiques","status":"consider","id":74},{"name":"Nathalie Da Conceicao Carvalho","group":"RN et alliés politiques","status":"consider","id":75},{"name":"Catherine Dellong Meng","group":"RN et alliés politiques","status":"consider","id":76},{"name":"Jocelyn Dessigny","group":"RN et alliés politiques","status":"consider","id":77},{"name":"Sandrine Dogor-Such","group":"RN et alliés politiques","status":"consider","id":78},{"name":"Nicolas Dragon","group":"RN et alliés politiques","status":"consider","id":79},{"name":"Alexandre Dufosset","group":"RN et alliés politiques","status":"consider","id":80},{"name":"Gaëtan Dussausaye","group":"RN et alliés politiques","status":"consider","id":81},{"name":"Aurélien Dutremble","group":"RN et alliés politiques","status":"consider","id":82},{"name":"Auguste Evrard","group":"RN et alliés politiques","status":"consider","id":83},{"name":"Frédéric Falcon","group":"RN et alliés politiques","status":"consider","id":84},{"name":"Muriel Fiol","group":"RN et alliés politiques","status":"consider","id":85},{"name":"Marc de Fleurian","group":"RN et alliés politiques","status":"consider","id":86},{"name":"Guillaume Florquin","group":"RN et alliés politiques","status":"consider","id":87},{"name":"Emmanuel Fouquart","group":"RN et alliés politiques","status":"consider","id":88},{"name":"Thierry Frappé","group":"RN et alliés politiques","status":"consider","id":89},{"name":"Julien Gabarron","group":"RN et alliés politiques","status":"consider","id":90},{"name":"Stéphanie Galzy","group":"RN et alliés politiques","status":"consider","id":91},{"name":"Laurence Gardet","group":"RN et alliés politiques","status":"consider","id":92},{"name":"Jonathan Gery","group":"RN et alliés politiques","status":"consider","id":93},{"name":"Benoît Gilhet","group":"RN et alliés politiques","status":"consider","id":94},{"name":"Yoann Gillet","group":"RN et alliés politiques","status":"consider","id":95},{"name":"Christian Girard","group":"RN et alliés politiques","status":"consider","id":96},{"name":"Antoine Golliot","group":"RN et alliés politiques","status":"consider","id":97},{"name":"José Gonzalez","group":"RN et alliés politiques","status":"consider","id":98},{"name":"Florence Goulet","group":"RN et alliés politiques","status":"consider","id":99},{"name":"Géraldine Grangier","group":"RN et alliés politiques","status":"consider","id":100},{"name":"Monique Griseti","group":"RN et alliés politiques","status":"consider","id":101},{"name":"Julien Guibert","group":"RN et alliés politiques","status":"consider","id":102},{"name":"Michel Guiniot","group":"RN et alliés politiques","status":"consider","id":103},{"name":"Jordan Guitton","group":"RN et alliés politiques","status":"consider","id":104},{"name":"Marine Hamelet","group":"RN et alliés politiques","status":"consider","id":105},{"name":"Timothée Houssin","group":"RN et alliés politiques","status":"consider","id":106},{"name":"Sébastien Humbert","group":"RN et alliés politiques","status":"consider","id":107},{"name":"Laurent Jacobelli","group":"RN et alliés politiques","status":"consider","id":108},{"name":"Pascal Jenft","group":"RN et alliés politiques","status":"consider","id":109},{"name":"Alexis Jolly","group":"RN et alliés politiques","status":"consider","id":110},{"name":"Tiffany Joncour","group":"RN et alliés politiques","status":"consider","id":111},{"name":"Édouard Jordan","group":"RN et alliés politiques","status":"consider","id":112},{"name":"Florence Joubert","group":"RN et alliés politiques","status":"consider","id":113},{"name":"Hélène Laporte","group":"RN et alliés politiques","status":"consider","id":114},{"name":"Robert Le Bourgeois","group":"RN et alliés politiques","status":"consider","id":115},{"name":"Julie Lechanteux","group":"RN et alliés politiques","status":"consider","id":116},{"name":"Nadine Lechon","group":"RN et alliés politiques","status":"consider","id":117},{"name":"Gisèle Lelouis","group":"RN et alliés politiques","status":"consider","id":118},{"name":"Hervé de Lépinau","group":"RN et alliés politiques","status":"consider","id":119},{"name":"Katiana Levavasseur","group":"RN et alliés politiques","status":"consider","id":120},{"name":"Julien Limongi","group":"RN et alliés politiques","status":"consider","id":121},{"name":"René Lioret","group":"RN et alliés politiques","status":"consider","id":122},{"name":"Christine Loir","group":"RN et alliés politiques","status":"consider","id":123},{"name":"Marie-France Lorho","group":"RN et alliés politiques","status":"consider","id":124},{"name":"Philippe Lottiaux","group":"RN et alliés politiques","status":"consider","id":125},{"name":"Alexandre Loubet","group":"RN et alliés politiques","status":"consider","id":126},{"name":"David Magnier","group":"RN et alliés politiques","status":"consider","id":127},{"name":"Claire Marais-Beuil","group":"RN et alliés politiques","status":"consider","id":128},{"name":"Matthieu Marchio","group":"RN et alliés politiques","status":"consider","id":129},{"name":"Pascal Markowsky","group":"RN et alliés politiques","status":"consider","id":130},{"name":"Patrice Martin","group":"RN et alliés politiques","status":"consider","id":131},{"name":"Michèle Martinez","group":"RN et alliés politiques","status":"consider","id":132},{"name":"Kévin Mauvieux","group":"RN et alliés politiques","status":"consider","id":133},{"name":"Nicolas Meizonnet","group":"RN et alliés politiques","status":"consider","id":134},{"name":"Joëlle Mélin","group":"RN et alliés politiques","status":"consider","id":135},{"name":"Yaël Ménaché","group":"RN et alliés politiques","status":"consider","id":136},{"name":"Thomas Ménagé","group":"RN et alliés politiques","status":"consider","id":137},{"name":"Pierre Meurin","group":"RN et alliés politiques","status":"consider","id":138},{"name":"Thibaut Monnier","group":"RN et alliés politiques","status":"consider","id":139},{"name":"Serge Muller","group":"RN et alliés politiques","status":"consider","id":140},{"name":"Thierry Perez","group":"RN et alliés politiques","status":"consider","id":141},{"name":"Kévin Pfeffer","group":"RN et alliés politiques","status":"consider","id":142},{"name":"Lisette Pollet","group":"RN et alliés politiques","status":"consider","id":143},{"name":"Stéphane Rambaud","group":"RN et alliés politiques","status":"consider","id":144},{"name":"Angélique Ranc","group":"RN et alliés politiques","status":"consider","id":145},{"name":"Julien Rancoule","group":"RN et alliés politiques","status":"consider","id":146},{"name":"Matthias Renault","group":"RN et alliés politiques","status":"consider","id":147},{"name":"Catherine Rimbert","group":"RN et alliés politiques","status":"consider","id":148},{"name":"Joseph Rivière","group":"RN et alliés politiques","status":"consider","id":149},{"name":"Laurence Robert-Dehault","group":"RN et alliés politiques","status":"consider","id":150},{"name":"Béatrice Roullaud","group":"RN et alliés politiques","status":"consider","id":151},{"name":"Sophie-Laurence Roy","group":"RN et alliés politiques","status":"consider","id":152},{"name":"Anaïs Sabatini","group":"RN et alliés politiques","status":"consider","id":153},{"name":"Alexandre Sabatou","group":"RN et alliés politiques","status":"consider","id":154},{"name":"Emeric Salmon","group":"RN et alliés politiques","status":"consider","id":155},{"name":"Philippe Schreck","group":"RN et alliés politiques","status":"consider","id":156},{"name":"Anne Sicard","group":"RN et alliés politiques","status":"consider","id":157},{"name":"Emmanuel Taché","group":"RN et alliés politiques","status":"consider","id":158},{"name":"Michaël Taverne","group":"RN et alliés politiques","status":"consider","id":159},{"name":"Thierry Tesson","group":"RN et alliés politiques","status":"consider","id":160},{"name":"Lionel Tivoli","group":"RN et alliés politiques","status":"consider","id":161},{"name":"Gabriel Tomatis","group":"RN et alliés politiques","status":"consider","id":162},{"name":"Romain Tonussi","group":"RN et alliés politiques","status":"consider","id":163},{"name":"Cyril Tribuiani","group":"RN et alliés politiques","status":"consider","id":164},{"name":"Antoine Villedieu","group":"RN et alliés politiques","status":"consider","id":165},{"name":"Frédéric-Pierre Vos","group":"RN et alliés politiques","status":"consider","id":166},{"name":"Frédéric Weber","group":"RN et alliés politiques","status":"consider","id":167},{"name":"Mathilde Androuët","group":"RN et alliés politiques","status":"consider","id":168},{"name":"Eléonore Bez","group":"RN et alliés politiques","status":"consider","id":169},{"name":"Manon Bouquin","group":"RN et alliés politiques","status":"consider","id":170},{"name":"Wallerand de Saint Just","group":"RN et alliés politiques","status":"consider","id":171},{"name":"Edwige Diaz","group":"RN et alliés politiques","status":"consider","id":172},{"name":"Thibaut François","group":"RN et alliés politiques","status":"consider","id":173},{"name":"Charles-Henri Gallois","group":"RN et alliés politiques","status":"consider","id":174},{"name":"Jean-Paul Garraud","group":"RN et alliés politiques","status":"consider","id":175},{"name":"Audrey Guibert","group":"RN et alliés politiques","status":"consider","id":176},{"name":"Andréa Kotarac","group":"RN et alliés politiques","status":"consider","id":177},{"name":"Jean-Lin Lacapelle","group":"RN et alliés politiques","status":"consider","id":178},{"name":"Alexandra Masson","group":"RN et alliés politiques","status":"consider","id":179},{"name":"Aleksandar Nikolic","group":"RN et alliés politiques","status":"consider","id":180},{"name":"Philippe Olivier","group":"RN et alliés politiques","status":"consider","id":181},{"name":"Ludovic Pajot","group":"RN et alliés politiques","status":"consider","id":182},{"name":"François Paradol","group":"RN et alliés politiques","status":"consider","id":183},{"name":"Gilles Pennelle","group":"RN et alliés politiques","status":"consider","id":184},{"name":"Julie Rechagneux","group":"RN et alliés politiques","status":"consider","id":185},{"name":"Julien Sanchez","group":"RN et alliés politiques","status":"consider","id":186},{"name":"Christopher Szczurek","group":"RN et alliés politiques","status":"consider","id":187},{"name":"Pierre-Romain Thionnet","group":"RN et alliés politiques","status":"consider","id":188},{"name":"Rody Tolassy","group":"RN et alliés politiques","status":"consider","id":189},{"name":"Matthieu Valet","group":"RN et alliés politiques","status":"consider","id":190},{"name":"Emma Vallain","group":"RN et alliés politiques","status":"consider","id":191},{"name":"Éric Ciotti","group":"RN et alliés politiques","status":"consider","id":192},{"name":"Alexandre Allegret-Pilot","group":"RN et alliés politiques","status":"consider","id":193},{"name":"Charles Alloncle","group":"RN et alliés politiques","status":"consider","id":194},{"name":"Matthieu Bloch","group":"RN et alliés politiques","status":"consider","id":195},{"name":"Pierre-Henri Carbonnel","group":"RN et alliés politiques","status":"consider","id":196},{"name":"Bernard Chaix","group":"RN et alliés politiques","status":"consider","id":197},{"name":"Marc Chavent","group":"RN et alliés politiques","status":"consider","id":198},{"name":"Christelle D’Intorni","group":"RN et alliés politiques","status":"consider","id":199},{"name":"Olivier Fayssat","group":"RN et alliés politiques","status":"consider","id":200},{"name":"Bartolomé Lenoir","group":"RN et alliés politiques","status":"consider","id":201},{"name":"Hanane Mansouri","group":"RN et alliés politiques","status":"consider","id":202},{"name":"Maxime Michelet","group":"RN et alliés politiques","status":"consider","id":203},{"name":"Éric Michoux","group":"RN et alliés politiques","status":"consider","id":204},{"name":"Sophie Ricourt Vaginay","group":"RN et alliés politiques","status":"consider","id":205},{"name":"Vincent Trébuchet","group":"RN et alliés politiques","status":"consider","id":206},{"name":"Antoine Valentin","group":"RN et alliés politiques","status":"consider","id":207},{"name":"Gérault Verny","group":"RN et alliés politiques","status":"consider","id":208},{"name":"Laurence Trochu","group":"RN et alliés politiques","status":"consider","id":209},{"name":"Gilbert Payet","group":"Reconquête et autres mouvements","status":"consider","id":210},{"name":"Samuel Lafont","group":"Reconquête et autres mouvements","status":"consider","id":211},{"name":"Thomas Culerrier","group":"Reconquête et autres mouvements","status":"consider","id":212},{"name":"Hilaire Bouyé","group":"Reconquête et autres mouvements","status":"consider","id":213},{"name":"Éléonore Lhéritier","group":"Reconquête et autres mouvements","status":"consider","id":214},{"name":"Sophie Calvel","group":"Reconquête et autres mouvements","status":"consider","id":215},{"name":"Mondane Langlois","group":"Reconquête et autres mouvements","status":"consider","id":216},{"name":"Diane Ouvry","group":"Reconquête et autres mouvements","status":"consider","id":217},{"name":"Matthieu Louves","group":"Reconquête et autres mouvements","status":"consider","id":218},{"name":"Johanna Humphrey","group":"Reconquête et autres mouvements","status":"consider","id":219},{"name":"Xavier Fourboul","group":"Reconquête et autres mouvements","status":"consider","id":220},{"name":"Pierre-Yves Thomas","group":"Reconquête et autres mouvements","status":"consider","id":221},{"name":"Isabelle Lamarque","group":"Reconquête et autres mouvements","status":"consider","id":222},{"name":"Marie-Pierre Cesari","group":"Reconquête et autres mouvements","status":"consider","id":223},{"name":"Julien Sene","group":"Reconquête et autres mouvements","status":"consider","id":224},{"name":"Olivier Le Coq","group":"Reconquête et autres mouvements","status":"consider","id":225},{"name":"Virginie Bonthoux","group":"Reconquête et autres mouvements","status":"consider","id":226},{"name":"Romain Gresle","group":"Reconquête et autres mouvements","status":"consider","id":227},{"name":"Laurent Chomard","group":"Reconquête et autres mouvements","status":"consider","id":228},{"name":"Elisabeth de Saint Romain","group":"Reconquête et autres mouvements","status":"consider","id":229},{"name":"Stanislas Rigault","group":"Reconquête et autres mouvements","status":"review","id":230},{"name":"Damien Rieu","group":"Reconquête et autres mouvements","status":"review","id":231},{"name":"Jean Messiha","group":"Reconquête et autres mouvements","status":"review","id":232},{"name":"Papacito","group":"Reconquête et autres mouvements","status":"review","id":233},{"name":"Thaïs d’Escufon","group":"Reconquête et autres mouvements","status":"review","id":234},{"name":"Gilbert Collard","group":"Reconquête et autres mouvements","status":"review","id":235},{"name":"Baptiste Marchais","group":"Reconquête et autres mouvements","status":"review","id":236},{"name":"Tanguy David","group":"Reconquête et autres mouvements","status":"review","id":237},{"name":"Pierre-Édouard Stérin","group":"Réseau et initiatives liés à P.-É. Stérin","status":"requested","id":238},{"name":"Arnaud Rérolle","group":"Réseau et initiatives liés à P.-É. Stérin","status":"requested","id":239},{"name":"François Durvye","group":"Réseau et initiatives liés à P.-É. Stérin","status":"requested","id":240},{"name":"Alexandre Pesey","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review","id":241},{"name":"Alban du Rostu","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review","id":242},{"name":"Charles Beigbeder","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review","id":243},{"name":"Alexandre Avril","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review","id":244},{"name":"Philippe de Gestas","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review","id":245},{"name":"Stéphane Ravier","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review","id":246},{"name":"Claire Geronimi","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review","id":247},{"name":"Edward Whalley","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review","id":248},{"name":"Périclès","group":"Réseau et initiatives liés à P.-É. Stérin","status":"requested","id":249},{"name":"Fonds du bien commun","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review","id":250},{"name":"Institut de formation politique (IFP)","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review","id":251},{"name":"Politicae","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review","id":252},{"name":"Observatoire de l’immigration et de la démographie (OID)","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review","id":253},{"name":"L’Incorrect","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review","id":254},{"name":"IREF (Institut de recherches économiques et fiscales)","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review","id":255},{"name":"Contrepoints","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review","id":256},{"name":"Otium Capital","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review","id":257},{"name":"Benyamin Netanyahou","group":"Alliances et soutiens à B. Netanyahou","status":"requested","id":258},{"name":"Meyer Habib","group":"Alliances et soutiens à B. Netanyahou","status":"requested","id":259},{"name":"Donald Trump","group":"Alliances et soutiens à B. Netanyahou","status":"requested","id":260},{"name":"Geert Wilders","group":"Alliances et soutiens à B. Netanyahou","status":"requested","id":261},{"name":"Santiago Abascal","group":"Alliances et soutiens à B. Netanyahou","status":"requested","id":262},{"name":"Viktor Orbán","group":"Alliances et soutiens à B. Netanyahou","status":"requested","id":263},{"name":"Javier Milei","group":"Alliances et soutiens à B. Netanyahou","status":"requested","id":264},{"name":"Itamar Ben-Gvir","group":"Alliances et soutiens à B. Netanyahou","status":"requested","id":265},{"name":"Bezalel Smotrich","group":"Alliances et soutiens à B. Netanyahou","status":"requested","id":266},{"name":"Aryeh Deri","group":"Alliances et soutiens à B. Netanyahou","status":"requested","id":267},{"name":"Amichai Chikli","group":"Alliances et soutiens à B. Netanyahou","status":"requested","id":268},{"name":"Matteo Salvini","group":"Alliances et soutiens à B. Netanyahou","status":"review","id":269},{"name":"Likoud","group":"Alliances et soutiens à B. Netanyahou","status":"requested","id":270},{"name":"Otzma Yehudit (Pouvoir juif)","group":"Alliances et soutiens à B. Netanyahou","status":"requested","id":271},{"name":"Sionisme religieux (Religious Zionism)","group":"Alliances et soutiens à B. Netanyahou","status":"requested","id":272},{"name":"Shas","group":"Alliances et soutiens à B. Netanyahou","status":"requested","id":273},{"name":"Judaïsme unifié de la Torah (United Torah Judaism)","group":"Alliances et soutiens à B. Netanyahou","status":"requested","id":274},{"name":"Mathilda (porte-parole du Collectif Némésis)","group":"Collectif Némésis","status":"review","id":275},{"name":"Léa (porte-parole du Collectif Némésis)","group":"Collectif Némésis","status":"review","id":276},{"name":"Yona (porte-parole du Collectif Némésis)","group":"Collectif Némésis","status":"review","id":277},{"name":"Astrid (porte-parole du Collectif Némésis)","group":"Collectif Némésis","status":"review","id":278},{"name":"Jeunesses identitaires","group":"Mouvements identitaires et GUD","status":"requested","id":279},{"name":"Une Autre Jeunesse","group":"Mouvements identitaires et GUD","status":"review","id":280},{"name":"Génération identitaire","group":"Mouvements identitaires et GUD","status":"consider","id":281},{"name":"Les Identitaires / Bloc identitaire","group":"Mouvements identitaires et GUD","status":"review","id":282},{"name":"GUD / GUD Paris (Groupe Union Défense)","group":"Mouvements identitaires et GUD","status":"requested","id":283},{"name":"Jean-Eudes Gannat","group":"Réseau public de Jean-Eudes Gannat","status":"requested","id":284},{"name":"L’Alvarium","group":"Réseau public de Jean-Eudes Gannat","status":"consider","id":285},{"name":"Mouvement chouan","group":"Réseau public de Jean-Eudes Gannat","status":"consider","id":286},{"name":"Rassemblement des étudiants de droite (RED)","group":"Réseau public de Jean-Eudes Gannat","status":"review","id":287},{"name":"Comité du 9 mai (C9M)","group":"Réseau public de Jean-Eudes Gannat","status":"review","id":288},{"name":"Bordeaux Nationaliste / Bordeaux Nationalistes","group":"Réseau public de Jean-Eudes Gannat","status":"review","id":289},{"name":"Paul-Alexandre Martin","group":"Réseau public de Jean-Eudes Gannat","status":"review","id":290},{"name":"Ligue Ligérienne","group":"Réseau public de Jean-Eudes Gannat","status":"review","id":291},{"name":"Alain Soral","group":"Réseau public et ancien entourage de Soral","status":"requested","id":292},{"name":"Kontre Kulture","group":"Réseau public et ancien entourage de Soral","status":"consider","id":293},{"name":"ERFM / Écoute et Respect","group":"Réseau public et ancien entourage de Soral","status":"consider","id":294},{"name":"Faits & Documents","group":"Réseau public et ancien entourage de Soral","status":"consider","id":295},{"name":"Au Bon Sens","group":"Réseau public et ancien entourage de Soral","status":"review","id":296},{"name":"Pierre de Brague","group":"Réseau public et ancien entourage de Soral","status":"review","id":297},{"name":"Julien Limes","group":"Réseau public et ancien entourage de Soral","status":"review","id":298},{"name":"Dieudonné M’Bala M’Bala","group":"Réseau public et ancien entourage de Soral","status":"review","id":299},{"name":"Philippe Péninque","group":"Réseau public et ancien entourage de Soral","status":"review","id":300},{"name":"Jildaz Mahé O’Chinal","group":"Réseau public et ancien entourage de Soral","status":"review","id":301},{"name":"Frédéric Chatillon","group":"Réseau public et ancien entourage de Soral","status":"review","id":302},{"name":"Vincent Lapierre","group":"Réseau public et ancien entourage de Soral","status":"review","id":303}];
  const GROUPS = [{"name":"Médias et groupes de presse","count":34},{"name":"RN et alliés politiques","count":167},{"name":"Reconquête et autres mouvements","count":36},{"name":"Réseau et initiatives liés à P.-É. Stérin","count":20},{"name":"Alliances et soutiens à B. Netanyahou","count":17},{"name":"Collectif Némésis","count":4},{"name":"Mouvements identitaires et GUD","count":5},{"name":"Réseau public de Jean-Eudes Gannat","count":8},{"name":"Réseau public et ancien entourage de Soral","count":12}];
  const DOMAINS = [{"host":"cnews.fr","label":"CNews","group":"Médias et groupes de presse"},{"host":"europe1.fr","label":"Europe 1","group":"Médias et groupes de presse"},{"host":"lejdd.fr","label":"Le Journal du Dimanche","group":"Médias et groupes de presse"},{"host":"valeursactuelles.com","label":"Valeurs actuelles","group":"Médias et groupes de presse"},{"host":"fdesouche.com","label":"Fdesouche","group":"Médias et groupes de presse"},{"host":"bvoltaire.fr","label":"Boulevard Voltaire","group":"Médias et groupes de presse"},{"host":"tvl.fr","label":"TV Libertés","group":"Médias et groupes de presse"},{"host":"kontrekulture.com","label":"Kontre Kulture","group":"Réseau public et ancien entourage de Soral"},{"host":"causeur.fr","label":"Causeur","group":"Médias et groupes de presse"}];
  const KEY='mfm_filter_web_v2_';
  const newKey=KEY+'groups_v3';
  const host=location.hostname.toLowerCase().replace(/^www\./,'');
  const skip=['localhost','127.0.0.1','janintibo-art.github.io'];
  if(skip.some(s=>host===s||host.endsWith('.'+s)))return;
  // Expressions personnelles facultatives, sauvegardées localement par Tampermonkey.
  const WORDS_KEY='mfm_keywords_v26';
  const WORDS_ACTIVE_KEY='mfm_keywords_active_v26';
  const cleanWords=raw=>[...new Set(String(raw).split(/[\n;,]+/u).map(w=>w.trim().replace(/\s+/gu,' ')).filter(w=>w.length>=3&&w.length<=70))].slice(0,60);
  // V30 : fiches avec variantes, migration sans perte des expressions V29.
  const PROFILES_KEY='mfm_profiles_v30';
  const asProfiles=raw=>{
    if(!Array.isArray(raw))return [];
    const seen=new Set(),out=[];
    for(const item of raw){
      if(!item||typeof item.label!=='string')continue;
      const label=cleanWords(item.label)[0];if(!label)continue;
      const id=label.toLocaleLowerCase('fr');if(seen.has(id))continue;seen.add(id);
      const aliases=cleanWords(Array.isArray(item.aliases)?item.aliases.join('\n'):'')
        .filter(x=>x.toLocaleLowerCase('fr')!==id).slice(0,10);
      out.push({label,aliases});if(out.length>=60)break;
    }
    return out;
  };
  let profiles;
  try{profiles=asProfiles(JSON.parse(GM_getValue(PROFILES_KEY,'null')))}catch{profiles=[]}
  if(!GM_getValue(PROFILES_KEY,''))profiles=cleanWords(GM_getValue(WORDS_KEY,'')).map(label=>({label,aliases:[]}));
  let userWords=profiles.map(p=>p.label);
  function saveProfiles(){
    profiles=asProfiles(profiles);
    userWords=profiles.map(p=>p.label);
    GM_setValue(PROFILES_KEY,JSON.stringify(profiles));
    GM_setValue(WORDS_KEY,userWords.join('\n')); // compatibilité V29
    GM_setValue(WORDS_ACTIVE_KEY,userWordsActive);
    revealOnce=false;apply();
  }
  let userWordsActive=Boolean(GM_getValue(WORDS_ACTIVE_KEY,true));
  let enabled=Boolean(GM_getValue(KEY+'enabled',true));
  let domainsEnabled=Boolean(GM_getValue(KEY+'domains',true));
  let adsEnabled=Boolean(GM_getValue(KEY+'adsEnabled',false));
  let customDomains=String(GM_getValue(KEY+'adCustomDomains','')).split(/\r?\n/).map(x=>x.trim().toLowerCase()).filter(x=>/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(x)).slice(0,500);
  const AD_HOSTS=['doubleclick.net','googlesyndication.com','googleadservices.com','adnxs.com','taboola.com','outbrain.com','criteo.com','adsrvr.org','rubiconproject.com','pubmatic.com'];
  const AD_SELECTORS=[
    'ins.adsbygoogle','[data-ad-slot]','[data-ad-client]','.adsbygoogle',
    'iframe[src*="doubleclick.net"]','iframe[src*="googlesyndication.com"]',
    '[id^="google_ads_iframe"]','[data-testid="placementTracking"]'
  ];
  let adHiddenCount=0;
  function adDomainMatch(domain){return [...AD_HOSTS,...customDomains].some(d=>domain===d||domain.endsWith('.'+d))}
  function adCandidate(el){
    if(!el || el.closest('#mfm-settings-overlay,#mfm-domain-screen,#mfm-ads-overlay,#mfm-invisibility-dashboard,#mfm-invisibility-launcher,form,[contenteditable="true"]'))return false;
    const tag=el.tagName.toLowerCase();
    if(tag==='iframe'){
      try{return adDomainMatch(new URL(el.getAttribute('src')||'',location.href).hostname.toLowerCase())}catch{return false}
    }
    return AD_SELECTORS.some(sel=>el.matches?.(sel));
  }
  function scanAds(){
    if(!adsEnabled||!enabled||revealOnce)return;
    let n=0;
    for(const el of document.querySelectorAll(AD_SELECTORS.join(','))){
      if(++n>800)break;
      if(!adCandidate(el)||hidden.has(el))continue;
      hide(el,'Publicité');adHiddenCount++;
    }
    let m=0;
    for(const a of document.querySelectorAll('a[href]')){
      if(++m>1200)break;
      if(a.closest('#mfm-settings-overlay,#mfm-domain-screen,#mfm-ads-overlay,form,[contenteditable="true"]'))continue;
      try{
        if(adDomainMatch(new URL(a.href,location.href).hostname.toLowerCase())){
          const card=a.closest('article,.ad,.sponsored,[data-ad-slot]');
          if(card && !hidden.has(card)){hide(card,'Publicité');adHiddenCount++}
        }
      }catch{}
    }
  }
  function adsPanel(){
    if(document.getElementById('mfm-ads-overlay'))return;
    style();
    const overlay=document.createElement('div');overlay.id='mfm-ads-overlay';overlay.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(2,8,15,.82);display:flex;align-items:center;justify-content:center;padding:15px';
    const panel=document.createElement('section');panel.className='mfm-dialog';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.style.cssText='width:min(560px,100%);max-height:90vh;overflow:auto';
    const heading=document.createElement('h2');heading.textContent='Publicités et autres domaines';
    const intro=document.createElement('p');intro.textContent='Facultatif : masque des emplacements publicitaires reconnaissables sur les pages compatibles. Ne filtre pas les requêtes réseau et ne remplace pas un bloqueur publicitaire.';
    const row=document.createElement('label');row.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid #385069;border-radius:12px';
    const name=document.createElement('span');name.textContent='Masquer les éléments publicitaires reconnus';
    const check=document.createElement('input');check.type='checkbox';check.checked=adsEnabled;check.addEventListener('change',()=>{adsEnabled=check.checked;GM_setValue(KEY+'adsEnabled',adsEnabled);restore();apply();});row.append(name,check);
    const subtitle=document.createElement('p');subtitle.textContent='Domaines additionnels personnels (un par ligne, max. 500). Ils ne sont utilisés que pour identifier des publicités ou liens dans la page : ils ne bloquent pas les connexions DNS.';
    const ta=document.createElement('textarea');ta.value=customDomains.join('\n');ta.setAttribute('aria-label','Domaines publicitaires supplémentaires');ta.style.cssText='width:100%;min-height:115px;background:#101b2a;color:white;border:1px solid #3d5067;border-radius:12px;padding:12px;font:14px monospace';
    const actions=document.createElement('div');actions.className='mfm-actions';
    actions.append(button('Enregistrer',()=>{
      customDomains=ta.value.split(/\r?\n/).map(x=>x.trim().toLowerCase()).filter(x=>/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(x)).slice(0,500);
      GM_setValue(KEY+'adCustomDomains',customDomains.join('\n'));overlay.remove();restore();apply();
    },'mfm-primary'),button('Fermer',()=>overlay.remove()));
    const note=document.createElement('p');note.className='mfm-note';note.textContent='Exemples de domaines connus inclus : doubleclick.net, googlesyndication.com, taboola.com. La liste est volontairement limitée pour éviter des faux positifs.';
    panel.append(heading,intro,row,subtitle,ta,actions,note);overlay.append(panel);document.body.append(overlay);
    overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});
  }
  let revealOnce=false;
  let revealDomainOnce=false;
  let scheduled=false;
  let working=false;
  let hiddenCount=0;
  const hidden=new Set();
  const savedGroups=(()=>{try{return JSON.parse(String(GM_getValue(newKey,'{}')))}catch{return {}}})();
  const entryExcluded=new Set((()=>{try{return JSON.parse(String(GM_getValue(KEY+"excluded_ids_v19","[]")))}catch{return []}})());
  const activeGroups={};
  for(const {name} of GROUPS)activeGroups[name]=savedGroups[name]!==false;

  // Special aliases only for distinctive complete names. Avoid filtering generic acronyms.
  const ALIASES={
    'Le Journal du Dimanche (JDD)':['Journal du Dimanche','Le JDD'],
    'GUD / GUD Paris (Groupe Union Défense)':['GUD Paris','Groupe Union Défense'],
    'Collectif Némésis':['Collectif Nemesis'],
    'Rassemblement des étudiants de droite (RED)':['Rassemblement des étudiants de droite'],
    'Sionisme religieux (Religious Zionism)':['Religious Zionism'],
    'Otzma Yehudit (Pouvoir juif)':['Otzma Yehudit']
  };
  const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[’‘']/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim();
  let terms=[];
  function refreshTerms(){
    terms=[];
    for(const r of RULES){
      if(!activeGroups[r.group]||entryExcluded.has(r.id))continue;
      for(const name of [r.name,...(ALIASES[r.name]||[])]){
        const term=normalize(name);
        if(term.length>=5 && (term.includes(' ')||term.length>=7||term==='cnews'))
          terms.push({term,name:r.name});
      }
    }
    terms.sort((a,b)=>b.term.length-a.term.length);
  }
  refreshTerms();
  // Short distinctive brands/acronyms must match the original capitalization exactly.
  // This keeps terms such as GEO or RFM without filtering ordinary lowercase words.
  const SHORT_FORMS={
    'RFM':'RFM','GEO':'GEO','CStar':'CStar',
    'Le Journal du Dimanche (JDD)':'JDD',
    'GUD / GUD Paris (Groupe Union Défense)':'GUD',
    'Shas':'Shas'
  };
  const shortMatches=Object.entries(SHORT_FORMS).map(([name,short])=>({
    name,short,group:RULES.find(r=>r.name===name)?.group,
    re:new RegExp('(?:^|[^\\p{L}\\p{N}])'+short+'(?=$|[^\\p{L}\\p{N}])','u')
  }));
  function matchName(txt){
    if(!txt)return '';
    const original=String(txt).slice(0,2300);
    const n=' '+normalize(original)+' ';
    if(userWordsActive){
      for(const profile of profiles){
        for(const word of [profile.label,...profile.aliases]){
          const normalized=normalize(word);
          if(normalized&&n.includes(' '+normalized+' '))return profile.label;
        }
      }
    }
    for(const r of terms){
      if(!n.includes(' '+r.term+' '))continue;
      // Common word: require its original publisher capitalization.
      if(r.name==='Frontières' && !/(?:^|[^\p{L}])Frontières(?![\p{L}])/u.test(original))continue;
      return r.name;
    }
    for(const r of shortMatches) {
      if(r.group && activeGroups[r.group] && !entryExcluded.has(RULES.find(x=>x.name===r.name)?.id) && r.re.test(original))return r.name;
    }
    return '';
  }
  function domainRule(h){
    return DOMAINS.find(d=>activeGroups[d.group] && !entryExcluded.has(RULES.find(r=>r.name===d.label)?.id) && (h===d.host||h.endsWith('.'+d.host)));
  }
  function matchUrl(href){
    try{
      const u=new URL(href,location.href);
      let h=u.hostname.toLowerCase().replace(/^www\./,'');
      // Google may link to a destination through /url?q=...
      if(h==='google.com'||h.endsWith('.google.com')){
        const dest=u.searchParams.get('q')||u.searchParams.get('url');
        if(dest)h=new URL(dest).hostname.toLowerCase().replace(/^www\./,'');
      }
      const d=domainRule(h);return d ? d.label : '';
    }catch{return ''}
  }
  function style(){
    if(document.getElementById('mfm-style'))return;
    const el=document.createElement('style');el.id='mfm-style';
    el.textContent=`
    [data-mfm-hidden="1"]{display:none!important}
    #mfm-domain-screen{position:fixed!important;inset:0!important;z-index:2147483643!important;background:#070e1c!important;color:#fff!important;display:grid!important;place-items:center!important;padding:20px!important;font:16px/1.6 system-ui,sans-serif!important}
    #mfm-domain-screen>div{max-width:580px;background:#132034;border:1px solid #34465d;border-radius:20px;padding:28px;box-shadow:0 20px 70px #0008}
    #mfm-domain-screen button{background:#fb3155;color:#fff;border:0;border-radius:10px;padding:12px;margin:7px 8px 0 0;font-weight:700;cursor:pointer}
    #mfm-settings-overlay{position:fixed!important;inset:0!important;z-index:2147483646!important;display:flex!important;align-items:center!important;justify-content:center!important;background:rgba(0,0,0,.79)!important;padding:14px!important;font:15px/1.5 system-ui,sans-serif!important;color:#eef3f9!important}
    #mfm-settings-overlay *{box-sizing:border-box!important}
    #mfm-settings-overlay .mfm-dialog{width:min(680px,100%);max-height:min(92vh,880px);overflow:auto;background:linear-gradient(155deg,#151c2b,#0b1625);color:#eef3f9;border:1px solid #415067;border-radius:23px;padding:clamp(18px,3vw,28px);box-shadow:0 20px 90px #000b}
    #mfm-settings-overlay .mfm-header{display:flex;justify-content:space-between;gap:15px;align-items:flex-start}
    #mfm-settings-overlay h2{font-size:clamp(22px,4vw,30px)!important;line-height:1.2!important;font-family:system-ui,sans-serif!important;color:#fff!important;margin:4px 0 7px!important}
    #mfm-settings-overlay p{color:#c9d6e5!important;margin:0 0 18px!important;font-size:14px!important}
    #mfm-settings-overlay .mfm-groups{display:grid;gap:9px;margin:15px 0!important}
    #mfm-settings-overlay label{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;background:#162338!important;border:1px solid #304159!important;border-radius:12px!important;padding:13px 15px!important;color:#fff!important;font:600 15px/1.3 system-ui,sans-serif!important;cursor:pointer!important}
    #mfm-settings-overlay label small{display:block;color:#acbbce;font:12px/1.3 system-ui,sans-serif;margin-top:3px}
    #mfm-settings-overlay input[type=checkbox]{height:24px!important;width:24px!important;accent-color:#ff3559!important;flex:0 0 auto!important;cursor:pointer!important}
    #mfm-settings-overlay button{font:700 14px system-ui,sans-serif!important;border-radius:11px!important;min-height:40px!important;padding:9px 14px!important;cursor:pointer!important;border:1px solid #5e6e83!important;background:#1a2a3e!important;color:#fff!important}
    #mfm-settings-overlay button.mfm-primary{border-color:#ff3559!important;background:#ff3559!important;color:#fff!important}
    #mfm-settings-overlay .mfm-actions{display:flex!important;flex-wrap:wrap!important;gap:8px!important;margin-top:20px!important}
    #mfm-settings-overlay .mfm-note{font-size:12px!important;line-height:1.55!important;border-top:1px solid #35445a!important;padding-top:12px!important;margin-top:15px!important}
    `;
    (document.head||document.documentElement).appendChild(el);
  }
  function restore(){
    for(const el of hidden){try{el.removeAttribute('data-mfm-hidden');el.removeAttribute('data-mfm-name')}catch{}}
    hidden.clear();hiddenCount=0;
    document.getElementById('mfm-domain-screen')?.remove();
  }
  function apply(){
    GM_setValue(newKey,JSON.stringify(activeGroups));
    refreshTerms();restore();
    document.querySelectorAll('[data-mfm-scanned]').forEach(e=>e.removeAttribute('data-mfm-scanned'));
    scan(true);
  }
  function openSettings(){
    if(document.getElementById('mfm-settings-overlay'))return;
    style();
    const overlay=document.createElement('div');overlay.id='mfm-settings-overlay';
    const dialog=document.createElement('section');dialog.className='mfm-dialog';
    dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Choisir les groupes à filtrer');
    const header=document.createElement('div');header.className='mfm-header';
    const heading=document.createElement('div');
    heading.innerHTML='<div style="color:#ff93a6;font-size:12px;font-weight:800;letter-spacing:.12em">MON FIL, MES CHOIX</div><h2>Choisir les groupes</h2>';
    const close=button('✕',()=>overlay.remove());close.setAttribute('aria-label','Fermer le panneau');
    header.append(heading,close);
    const intro=document.createElement('p');intro.textContent='Activez ou désactivez chaque groupe. Les choix sont enregistrés sur cet appareil et s’appliquent immédiatement.';
    const summary=document.createElement('p');summary.style.fontWeight='700';
    const list=document.createElement('div');list.className='mfm-groups';
    const inputs=[];
    function updateSummary(){
      const groupsOn=GROUPS.filter(g=>activeGroups[g.name]);
      const n=groupsOn.reduce((s,g)=>s+g.count,0);
      summary.textContent=`${groupsOn.length} groupe(s) actif(s) sur ${GROUPS.length} · ${n} entrée(s) sur ${RULES.length}`;
    }
    for(const g of GROUPS){
      const label=document.createElement('label');
      const names=document.createElement('span');names.textContent=g.name;
      const small=document.createElement('small');small.textContent=`${g.count} entrée(s)`;names.appendChild(small);
      const input=document.createElement('input');input.type='checkbox';input.checked=activeGroups[g.name];
      input.setAttribute('aria-label','Filtrer '+g.name);
      input.addEventListener('change',()=>{activeGroups[g.name]=input.checked;if(input.checked)for(const r of RULES)if(r.group===g.name)entryExcluded.delete(r.id);GM_setValue(KEY+"excluded_ids_v19",JSON.stringify([...entryExcluded]));apply();updateSummary()});
      inputs.push(input);label.append(names,input);list.appendChild(label);
    }
    const actions=document.createElement('div');actions.className='mfm-actions';
    actions.append(button('Tout activer',()=>{for(const g of GROUPS)activeGroups[g.name]=true;entryExcluded.clear();GM_setValue(KEY+"excluded_ids_v19","[]");inputs.forEach(i=>i.checked=true);apply();updateSummary()}),
                   button('Tout désactiver',()=>{for(const g of GROUPS)activeGroups[g.name]=false;inputs.forEach(i=>i.checked=false);apply();updateSummary()}),
                   button('Fermer',()=>overlay.remove(),'mfm-primary'));
    const note=document.createElement('p');note.className='mfm-note';
    note.textContent='Un nom dans cette liste est une préférence de filtrage, pas une accusation. Certains résultats peuvent rester visibles selon le site et son navigateur. Utilisez « Afficher tout » en cas de faux positif.';
    dialog.append(header,intro,summary,list,actions,note);overlay.appendChild(dialog);document.body.appendChild(overlay);
    overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});
    overlay.addEventListener('keydown',e=>{if(e.key==='Escape')overlay.remove()});
    close.focus();updateSummary();
  }
  function openWordsPanel(){
    if(document.getElementById('mfm-settings-overlay'))return;
    style();
    const overlay=document.createElement('div');overlay.id='mfm-settings-overlay';
    const dialog=document.createElement('section');dialog.className='mfm-dialog';
    dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Mes mots-clés');
    const header=document.createElement('div');header.className='mfm-header';
    const heading=document.createElement('div');
    const eyebrow=document.createElement('div');eyebrow.textContent='MON FIL, MES CHOIX';eyebrow.style.color='#ff93a6';
    const title=document.createElement('h2');title.textContent='Mes mots-clés';heading.append(eyebrow,title);
    const close=button('✕',()=>overlay.remove());close.setAttribute('aria-label','Fermer');
    header.append(heading,close);dialog.append(header);
    const help=document.createElement('p');
    help.textContent='Ajoutez les noms ou expressions que vous souhaitez masquer sur les pages compatibles. Une expression par ligne. Tout est enregistré uniquement dans ce navigateur.';
    dialog.append(help);
    const label=document.createElement('label');label.textContent='Expressions à masquer';
    label.style.display='block';label.style.fontWeight='700';label.style.marginBottom='8px';
    const area=document.createElement('textarea');area.value=userWords.join('\n');area.rows=7;
    area.setAttribute('aria-label','Une expression par ligne');area.placeholder='Une expression par ligne';
    Object.assign(area.style,{display:'block',width:'100%',minHeight:'150px',padding:'12px',borderRadius:'10px',background:'#0a1423',color:'#fff',border:'1px solid #52637a',font:'15px/1.5 system-ui',resize:'vertical'});
    dialog.append(label,area);
    const toggleLabel=document.createElement('label');
    Object.assign(toggleLabel.style,{display:'flex',alignItems:'center',gap:'10px',marginTop:'14px',marginBottom:'10px'});
    const toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=userWordsActive;
    toggleLabel.append(toggle,document.createTextNode('Activer le filtrage de mes mots-clés'));dialog.append(toggleLabel);
    const info=document.createElement('p');info.className='mfm-note';
    info.textContent='Jusqu’à 60 expressions (3 à 70 caractères). Le filtre peut aussi masquer des articles critiques. Il ne lit pas le texte contenu dans les images et ne fonctionne pas dans les applications natives.';
    dialog.append(info);
    const actions=document.createElement('div');actions.className='mfm-actions';
    actions.append(button('Enregistrer',()=>{
      const words=cleanWords(area.value);
      profiles=words.map(label=>profiles.find(p=>p.label.toLocaleLowerCase('fr')===label.toLocaleLowerCase('fr'))||{label,aliases:[]});
      userWordsActive=toggle.checked;
      saveProfiles();overlay.remove();
    },'mfm-primary'),button('Annuler',()=>overlay.remove()));
    dialog.append(actions);overlay.appendChild(dialog);document.body.appendChild(overlay);
    overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});
    overlay.addEventListener('keydown',e=>{if(e.key==='Escape')overlay.remove()});
    area.focus();
  }
  function button(text,click,cls=''){
    const b=document.createElement('button');b.type='button';b.textContent=text;
    if(cls)b.className=cls;b.addEventListener('click',click);return b;
  }
  function domainScreen(domain){
    if(!document.body||document.getElementById('mfm-domain-screen')||revealDomainOnce)return;
    const wrap=document.createElement('div');wrap.id='mfm-domain-screen';
    const card=document.createElement('div');
    const title=document.createElement('h2');title.textContent='Site masqué : '+domain.label;
    const p=document.createElement('p');p.textContent='Ce site figure dans l’un de vos groupes activés. Le masquage est local, réversible et ne modifie pas le site d’origine.';
    card.append(title,p,button('Afficher ce site une fois',()=>{revealDomainOnce=true;wrap.remove()}),
      button('Désactiver ce groupe',()=>{activeGroups[domain.group]=false;apply();wrap.remove()}));
    wrap.appendChild(card);document.body.appendChild(wrap);
  }
  function cardSelectors(){
    const result=['article','[role="article"]','[data-testid="tweet"]','[data-testid="post-container"]',
      'ytd-video-renderer','ytd-rich-item-renderer','ytd-compact-video-renderer','ytd-grid-video-renderer',
      'yt-lockup-view-model','ytd-comment-thread-renderer','.post-card','.search-result','.video-card','.news-card','.post-list-item'];
    if(host==='google.com'||host.endsWith('.google.com')||host.startsWith('google.'))
      result.push('#search .MjjYud','#rso .g','#search .g','#search .Ww4FFb');
    if(host==='bing.com'||host.endsWith('.bing.com'))result.push('#b_results li.b_algo');
    if(host==='duckduckgo.com'||host.endsWith('.duckduckgo.com'))result.push('[data-testid="result"]');
    if(host==='x.com'||host==='twitter.com')result.push('[data-testid="cellInnerDiv"]');
    if(host.endsWith('.reddit.com'))result.push('shreddit-post');
    if(host==='facebook.com'||host.endsWith('.facebook.com'))result.push('[data-pagelet*="FeedUnit"]');
    return result.join(',');
  }
  const selectors=cardSelectors();
  function hide(el,match){
    if(!el||hidden.has(el)||el.closest('#mfm-settings-overlay,#mfm-domain-screen,#mfm-ads-overlay,form,[contenteditable="true"]'))return;
    el.setAttribute('data-mfm-hidden','1');el.setAttribute('data-mfm-name',match);
    hidden.add(el);hiddenCount++;
  }
  function candidateText(el){
    const s=(el.innerText||el.textContent||'').slice(0,2300);
    if(s.length>2200)return '';
    return s;
  }
  function googleCardFor(heading){
    let el=heading;
    for(let i=0;i<8 && el?.parentElement;i++,el=el.parentElement){
      if(el.matches?.('.MjjYud,.g,.Ww4FFb,[data-hveid]')){
        if(el.querySelectorAll('h3').length<=2 && candidateText(el).length<2200)return el;
      }
    }
    let a=heading.closest('a');
    return a?.parentElement?.parentElement||a||heading;
  }
  // v31 : Google expose souvent les personnalités dans une fiche latérale,
  // hors des cartes classiques. On ne masque jamais la barre de recherche.
  // v32 : les fiches Google sont souvent hors des conteneurs classiques.
  function scanGooglePanels(){
    if(!(host==='google.com'||host.endsWith('.google.com')||host.startsWith('google.')))return;
    const qs=new URLSearchParams(location.search);
    const field=document.querySelector('input[name="q"],textarea[name="q"]');
    const query=qs.get('q')||field?.value||'';
    const compact=normalize(query).replace(/\s/g,'');
    let chosen=matchName(query);
    if(!chosen && compact.length>=5 && userWordsActive){
      for(const p of profiles){
        if([p.label,...p.aliases].some(w=>normalize(w).replace(/\s/g,'')===compact)){
          chosen=p.label;break;
        }
      }
    }
    if(chosen){
      // #rcnt contient aussi les photos, connaissances et fiches recentes.
      // La barre de recherche et le tableau de bord restent accessibles.
      for(const sel of ['#rcnt','#main','#center_col','#search','#rso','#rhs',
        '.kp-wholepage','#kp-wp-tab-overview','#islmp']){
        for(const el of document.querySelectorAll(sel))hide(el,chosen);
      }
      return;
    }
    for(const sel of ['#rhs','.kp-wholepage','#kp-wp-tab-overview']){
      for(const el of document.querySelectorAll(sel)){
        if(hidden.has(el))continue;
        const found=matchName((el.innerText||el.textContent||'').slice(0,2300));
        if(found)hide(el,found);
      }
    }
  }
  function scan(force=false){
    if(!enabled||revealOnce||!document.body||working)return;
    working=true;
    try{
      if(domainsEnabled&&!revealDomainOnce){const d=domainRule(host);if(d){domainScreen(d);return}}
      style();
      scanAds();
      scanGooglePanels();
      // Search cards and social posts; never hide broad page wrappers or editable forms.
      const cards=document.querySelectorAll(selectors);
      let n=0;
      for(const el of cards){
        if(++n>1800)break;
        if(!force&&el.hasAttribute('data-mfm-scanned'))continue;
        el.setAttribute('data-mfm-scanned','1');
        const txt=candidateText(el);
        if(!txt||el.querySelectorAll('h3').length>3)continue;
        let match=matchName(txt);
        if(!match){
          const links=el.querySelectorAll('a[href]');
          let m=0;for(const a of links){if(++m>12)break;match=matchUrl(a.href);if(match)break}
        }
        if(match)hide(el,match);
      }
      // Google results: titles may not be inside the older .g / .MjjYud wrappers.
      if(host==='google.com'||host.endsWith('.google.com')||host.startsWith('google.')){
        let hcount=0;
        for(const h of document.querySelectorAll('#search h3,#rso h3')){
          if(++hcount>600)break;
          if(h.closest('[data-mfm-hidden="1"],form'))continue;
          const link=h.closest('a');
          const match=matchName(h.innerText||h.textContent)|| (link?matchUrl(link.href):'');
          if(match)hide(googleCardFor(h),match);
        }
      }
      // Fallback for links on other search engines where the full card is unknown.
      let count=0;
      for(const a of document.querySelectorAll('main a[href],#search a[href],#rso a[href],#b_results a[href],[role="main"] a[href]')){
        if(++count>900)break;
        if(a.closest('[data-mfm-hidden="1"],#mfm-settings-overlay,#mfm-domain-screen,#mfm-ads-overlay,form'))continue;
        if(!force&&a.hasAttribute('data-mfm-scanned'))continue;
        a.setAttribute('data-mfm-scanned','1');
        const title=(a.innerText||a.getAttribute('aria-label')||'').slice(0,200);
        let match=matchName(title);
        if(!match)match=matchUrl(a.href);
        if(match)hide(a,match);
      }
    }finally{working=false}
  }
  function schedule(){if(!enabled||revealOnce||scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;scan()},500)}
  // Sauvegarde V30 complète et import des anciens fichiers V1.
  function exportChoices(){
    const excluded=RULES.filter(r=>!activeGroups[r.group]||entryExcluded.has(r.id)).map(r=>r.id).sort((a,b)=>a-b);
    const profile={format:'mon-fil-mes-choix-preferences',version:2,excluded_ids:excluded,
      custom_domains:[...new Set(customDomains)],profiles:asProfiles(profiles),
      keywords_active:userWordsActive,filter_enabled:enabled,domains_enabled:domainsEnabled,ads_enabled:adsEnabled};
    const url=URL.createObjectURL(new Blob([JSON.stringify(profile,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='mes-choix-v30.json';document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
    alert('Sauvegarde complète créée : mes-choix-v30.json. Transférez ce fichier sur votre autre appareil puis choisissez « Récupérer mes choix ».');
  }
  function importChoices(){
    const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
    input.addEventListener('change',async()=>{
      const file=input.files?.[0];if(!file)return;
      try{
        if(file.size>150000)throw Error('Fichier trop volumineux');
        const obj=JSON.parse(await file.text());
        if(obj?.format!=='mon-fil-mes-choix-preferences'||![1,2].includes(obj.version)||!Array.isArray(obj.excluded_ids)||!Array.isArray(obj.custom_domains))throw Error('Sauvegarde incompatible');
        const allowed=new Set(RULES.map(r=>r.id));
        if(obj.excluded_ids.length>RULES.length||obj.excluded_ids.some(id=>!Number.isInteger(id)||!allowed.has(id))||new Set(obj.excluded_ids).size!==obj.excluded_ids.length)throw Error('Choix invalides');
        if(obj.custom_domains.length>500||obj.custom_domains.some(d=>typeof d!=='string'||!/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(d))||new Set(obj.custom_domains).size!==obj.custom_domains.length)throw Error('Domaines invalides');
        if(obj.version===2){
          if(!Array.isArray(obj.profiles)||obj.profiles.length>60||obj.profiles.some(p=>!p||typeof p.label!=='string'||!Array.isArray(p.aliases)||p.aliases.length>10||p.aliases.some(a=>typeof a!=='string')))throw Error('Fiches invalides');
          for(const key of ['keywords_active','filter_enabled','domains_enabled','ads_enabled'])if(typeof obj[key]!=='boolean')throw Error('Option invalide : '+key);
        }
        if(!confirm('Remplacer vos préférences sur cet appareil ?'+(obj.version===1?' (Ancien fichier : les mots-clés actuels seront conservés.)':'')))return;
        entryExcluded.clear();for(const id of obj.excluded_ids)entryExcluded.add(id);
        for(const group of GROUPS)activeGroups[group.name]=true;
        customDomains=obj.custom_domains.slice();
        GM_setValue(KEY+'adCustomDomains',customDomains.join('\n'));
        GM_setValue(KEY+'excluded_ids_v19',JSON.stringify([...entryExcluded]));
        GM_setValue(newKey,JSON.stringify(activeGroups));
        if(obj.version===2){
          profiles=asProfiles(obj.profiles);userWords=profiles.map(p=>p.label);
          userWordsActive=obj.keywords_active;enabled=obj.filter_enabled;
          domainsEnabled=obj.domains_enabled;adsEnabled=obj.ads_enabled;
          GM_setValue(PROFILES_KEY,JSON.stringify(profiles));GM_setValue(WORDS_KEY,userWords.join('\n'));
          GM_setValue(WORDS_ACTIVE_KEY,userWordsActive);GM_setValue(KEY+'enabled',enabled);
          GM_setValue(KEY+'domains',domainsEnabled);GM_setValue(KEY+'adsEnabled',adsEnabled);
        }
        revealOnce=false;revealDomainOnce=false;refreshTerms();restore();apply();
        alert('Préférences importées. Rechargez la page pour mettre le menu à jour.');
      }catch(error){alert('Impossible de récupérer ce fichier : '+error.message)}
    });input.click();
  }
  function menu(){
    GM_registerMenuCommand('👁️ Tableau de bord Invisibilité',openDashboard);
    GM_registerMenuCommand('✍️ Mes mots-clés ('+userWords.length+')',openWordsPanel);
    GM_registerMenuCommand('⚙️ Gérer les groupes ('+GROUPS.length+')',openSettings);
    GM_registerMenuCommand('🚫 Publicités et autres blocages',adsPanel);
    GM_registerMenuCommand('💾 Sauvegarder mes choix',exportChoices);
    GM_registerMenuCommand('📂 Récupérer mes choix',importChoices);
    GM_registerMenuCommand(enabled?'⏸ Désactiver le filtre':'▶ Activer le filtre',()=>{
      enabled=!enabled;GM_setValue(KEY+'enabled',enabled);
      if(!enabled)restore();else {revealOnce=false;apply()}
      alert('Filtre '+(enabled?'activé':'désactivé')+'. Rechargez la page si besoin.');
    });
    GM_registerMenuCommand(domainsEnabled?'🌐 Désactiver les domaines':'🌐 Activer les domaines',()=>{
      domainsEnabled=!domainsEnabled;GM_setValue(KEY+'domains',domainsEnabled);
      restore();scan(true);
    });
    GM_registerMenuCommand('👁 Afficher tout jusqu’au rechargement',()=>{revealOnce=true;revealDomainOnce=true;restore()});
    GM_registerMenuCommand('ℹ Résumé',()=>{
      const active=GROUPS.filter(g=>activeGroups[g.name]);
      alert(`Mon fil, mes choix\n${RULES.length} entrées réparties en ${GROUPS.length} groupes.\n${active.length} groupes actifs (${active.reduce((s,g)=>s+g.count,0)} entrées).\n${hiddenCount} éléments masqués sur cette page.\nAucun compte n’est bloqué côté plateforme.`)
    });
  }
  // Petit raccourci discret, sans notification ni compteur de contenus masqués.
  function openDashboard(){
    if(!document.body)return;
    const existing=document.getElementById('mfm-invisibility-dashboard');
    if(existing){existing.remove();return}
    const root=document.createElement('section');root.id='mfm-invisibility-dashboard';
    root.setAttribute('role','dialog');root.setAttribute('aria-label','Tableau de bord Invisibilité');
    Object.assign(root.style,{position:'fixed',right:'14px',bottom:'66px',zIndex:'2147483644',width:'min(370px,calc(100vw - 28px))',maxHeight:'min(75vh,650px)',overflowY:'auto',background:'#101827',color:'#fff',border:'1px solid #586478',borderRadius:'17px',padding:'18px',boxShadow:'0 15px 50px #0009',font:'14px/1.45 system-ui'});
    const head=document.createElement('div');Object.assign(head.style,{display:'flex',justifyContent:'space-between',alignItems:'center'});
    const title=document.createElement('strong');title.textContent='Mon fil · Invisibilité';title.style.fontSize='17px';
    const close=button('✕',()=>root.remove());close.setAttribute('aria-label','Fermer le tableau de bord');
    head.append(title,close);root.append(head);
    const tip=document.createElement('p');tip.textContent='Ajoutez une fiche puis choisissez « Variantes » pour indiquer surnoms, pseudonymes ou autres orthographes. Ces choix restent locaux.';root.append(tip);
    const status=document.createElement('label');Object.assign(status.style,{display:'flex',alignItems:'center',gap:'9px',margin:'12px 0'});
    const toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=userWordsActive;
    status.append(toggle,document.createTextNode('Masquer mes mots-clés'));root.append(status);
    const list=document.createElement('div');list.setAttribute('aria-live','polite');root.append(list);
    function redraw(){
      list.replaceChildren();
      if(!userWords.length){const empty=document.createElement('p');empty.textContent='Aucun mot-clé ajouté pour le moment.';list.append(empty)}
      profiles.forEach(profile=>{
        const line=document.createElement('div');Object.assign(line.style,{display:'flex',gap:'7px',alignItems:'center',justifyContent:'space-between',padding:'8px',margin:'5px 0',borderRadius:'8px',background:'#243043',flexWrap:'wrap'});
        const name=document.createElement('span');name.textContent=profile.label+(profile.aliases.length?' · '+profile.aliases.length+' variante(s)':'');name.style.overflowWrap='anywhere';
        const edit=button('Variantes',()=>{
          const answer=prompt('Autres noms ou pseudonymes pour « '+profile.label+' » (un par ligne) :',profile.aliases.join('\n'));
          if(answer===null)return;
          profile.aliases=cleanWords(answer).filter(x=>x.toLocaleLowerCase('fr')!==profile.label.toLocaleLowerCase('fr')).slice(0,10);
          saveProfiles();redraw();
        });edit.setAttribute('aria-label','Modifier les variantes de '+profile.label);
        const remove=button('Retirer',()=>{profiles=profiles.filter(p=>p!==profile);saveProfiles();redraw()});remove.setAttribute('aria-label','Retirer '+profile.label);
        line.append(name,edit,remove);list.append(line);
      });
    }
    function saveWords(){saveProfiles()}
    const entry=document.createElement('input');entry.type='text';entry.maxLength=70;entry.placeholder='Ajouter une fiche (nom ou sujet)';entry.setAttribute('aria-label','Nouvelle expression');
    Object.assign(entry.style,{width:'100%',padding:'10px',marginTop:'12px',boxSizing:'border-box',borderRadius:'8px',border:'1px solid #6b8196',background:'#0a1423',color:'#fff'});
    const add=button('Ajouter à ma liste',()=>{
      const values=cleanWords(entry.value);
      if(!values.length){entry.setCustomValidity('Saisissez au moins 3 caractères');entry.reportValidity();return}
      entry.setCustomValidity('');
      for(const label of values){if(!profiles.some(p=>p.label.toLocaleLowerCase('fr')===label.toLocaleLowerCase('fr'))&&profiles.length<60)profiles.push({label,aliases:[]})}
      entry.value='';saveWords();redraw();
    });
    entry.addEventListener('input',()=>entry.setCustomValidity(''));
    entry.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();add.click()}});
    root.append(entry,add);
    toggle.addEventListener('change',()=>{userWordsActive=toggle.checked;saveWords()});
    const line=document.createElement('div');Object.assign(line.style,{display:'flex',gap:'7px',flexWrap:'wrap',marginTop:'13px'});
    line.append(button('Tout réafficher ici',()=>{revealOnce=true;revealDomainOnce=true;restore();root.remove()}),button('Réglages avancés',()=>{root.remove();openWordsPanel()}));root.append(line);
    const note=document.createElement('p');note.style.opacity='.75';note.style.fontSize='12px';note.textContent='Le masquage dépend du site. Il peut aussi cacher une critique contenant le nom choisi. Vos choix restent locaux.';root.append(note);
    redraw();document.body.append(root);entry.focus();
  }
  function addLauncher(){
    if(!document.body||document.getElementById('mfm-invisibility-launcher'))return;
    const launcher=button('◉ Mes choix',openDashboard);launcher.id='mfm-invisibility-launcher';
    launcher.setAttribute('aria-label','Ouvrir le tableau de bord Invisibilité');
    Object.assign(launcher.style,{position:'fixed',right:'14px',bottom:'12px',zIndex:'2147483644',background:'#d82746',color:'#fff',padding:'10px 13px',border:'1px solid #fff5',borderRadius:'30px',font:'bold 13px system-ui',boxShadow:'0 6px 24px #0007'});
    document.body.append(launcher);
  }
  style();menu();scan();addLauncher();
  const observer=new MutationObserver(records=>{
    if(records.every(r=>r.type==='attributes'&&r.attributeName?.startsWith('data-mfm-')))return;
    for(const r of records){
      if(r.type!=='childList')continue;
      const node=r.target.nodeType===1?r.target:r.target.parentElement;
      const card=node?.closest?.(selectors);
      if(card)card.removeAttribute('data-mfm-scanned');
    }
    schedule();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:false});
  setInterval(()=>{if(enabled&&!revealOnce)scan()},8000);
})();
