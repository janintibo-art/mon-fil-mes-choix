// ==UserScript==
// @name         Mon fil, mes choix — filtre Web personnel
// @namespace    https://github.com/janintibo-art/mon-fil-mes-choix
// @version      3.1.0
// @updateURL    https://raw.githubusercontent.com/janintibo-art/mon-fil-mes-choix/main/site/tampermonkey/mon-fil-mes-choix.user.js
// @downloadURL  https://raw.githubusercontent.com/janintibo-art/mon-fil-mes-choix/main/site/tampermonkey/mon-fil-mes-choix.user.js
// @description  303 entrées en 9 groupes + filtre publicitaire facultatif et domaines personnels.
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
  const RULES = [{"name":"CNews","group":"Médias et groupes de presse","status":"review"},{"name":"Europe 1","group":"Médias et groupes de presse","status":"review"},{"name":"Le Journal du Dimanche (JDD)","group":"Médias et groupes de presse","status":"review"},{"name":"JDNews","group":"Médias et groupes de presse","status":"review"},{"name":"Frontières","group":"Médias et groupes de presse","status":"requested"},{"name":"L’Infiltré","group":"Médias et groupes de presse","status":"review"},{"name":"Canal+","group":"Médias et groupes de presse","status":"review"},{"name":"CStar","group":"Médias et groupes de presse","status":"review"},{"name":"Europe 2","group":"Médias et groupes de presse","status":"review"},{"name":"RFM","group":"Médias et groupes de presse","status":"review"},{"name":"Télé-Loisirs","group":"Médias et groupes de presse","status":"review"},{"name":"Femme Actuelle","group":"Médias et groupes de presse","status":"review"},{"name":"Voici","group":"Médias et groupes de presse","status":"review"},{"name":"GEO","group":"Médias et groupes de presse","status":"review"},{"name":"Capital","group":"Médias et groupes de presse","status":"review"},{"name":"Ça m’intéresse","group":"Médias et groupes de presse","status":"review"},{"name":"Cuisine Actuelle","group":"Médias et groupes de presse","status":"review"},{"name":"Prima","group":"Médias et groupes de presse","status":"review"},{"name":"Télé 2 semaines","group":"Médias et groupes de presse","status":"review"},{"name":"TV Grandes Chaînes","group":"Médias et groupes de presse","status":"review"},{"name":"Télé Z","group":"Médias et groupes de presse","status":"review"},{"name":"Ici Paris","group":"Médias et groupes de presse","status":"review"},{"name":"France Dimanche","group":"Médias et groupes de presse","status":"review"},{"name":"Gentside","group":"Médias et groupes de presse","status":"review"},{"name":"Oh My Mag","group":"Médias et groupes de presse","status":"review"},{"name":"Rassemblement national","group":"RN et alliés politiques","status":"review"},{"name":"Marine Le Pen","group":"RN et alliés politiques","status":"consider"},{"name":"Jordan Bardella","group":"RN et alliés politiques","status":"consider"},{"name":"Rassemblement National de la Jeunesse","group":"RN et alliés politiques","status":"review"},{"name":"Louis Aliot","group":"RN et alliés politiques","status":"consider"},{"name":"Sébastien Chenu","group":"RN et alliés politiques","status":"consider"},{"name":"Julien Odoul","group":"RN et alliés politiques","status":"consider"},{"name":"Jean-Philippe Tanguy","group":"RN et alliés politiques","status":"consider"},{"name":"Laure Lavalette","group":"RN et alliés politiques","status":"consider"},{"name":"Caroline Parmentier","group":"RN et alliés politiques","status":"consider"},{"name":"Reconquête","group":"Reconquête et autres mouvements","status":"review"},{"name":"Éric Zemmour","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Sarah Knafo","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Identité Libertés","group":"Reconquête et autres mouvements","status":"review"},{"name":"Marion Maréchal","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Les Patriotes","group":"Reconquête et autres mouvements","status":"review"},{"name":"Florian Philippot","group":"Reconquête et autres mouvements","status":"review"},{"name":"Action française","group":"Reconquête et autres mouvements","status":"review"},{"name":"Valeurs actuelles","group":"Médias et groupes de presse","status":"review"},{"name":"Fdesouche","group":"Médias et groupes de presse","status":"review"},{"name":"Boulevard Voltaire","group":"Médias et groupes de presse","status":"review"},{"name":"TV Libertés","group":"Médias et groupes de presse","status":"review"},{"name":"Radio Courtoisie","group":"Médias et groupes de presse","status":"review"},{"name":"Causeur","group":"Médias et groupes de presse","status":"review"},{"name":"Collectif Némésis","group":"Médias et groupes de presse","status":"requested"},{"name":"Alice Cordier","group":"Médias et groupes de presse","status":"requested"},{"name":"Égalité et Réconciliation","group":"Médias et groupes de presse","status":"requested"},{"name":"Franck Allisio","group":"RN et alliés politiques","status":"consider"},{"name":"Maxime Amblard","group":"RN et alliés politiques","status":"consider"},{"name":"Bénédicte Auzanot","group":"RN et alliés politiques","status":"consider"},{"name":"Philippe Ballard","group":"RN et alliés politiques","status":"consider"},{"name":"Anchya Bamana","group":"RN et alliés politiques","status":"consider"},{"name":"Romain Baubry","group":"RN et alliés politiques","status":"consider"},{"name":"José Beaurain","group":"RN et alliés politiques","status":"consider"},{"name":"Christophe Bentz","group":"RN et alliés politiques","status":"consider"},{"name":"Théo Bernhardt","group":"RN et alliés politiques","status":"consider"},{"name":"Guillaume Bigot","group":"RN et alliés politiques","status":"consider"},{"name":"Bruno Bilde","group":"RN et alliés politiques","status":"consider"},{"name":"Emmanuel Blairy","group":"RN et alliés politiques","status":"consider"},{"name":"Sophie Blanc","group":"RN et alliés politiques","status":"consider"},{"name":"Frédéric Boccaletti","group":"RN et alliés politiques","status":"consider"},{"name":"Anthony Boulogne","group":"RN et alliés politiques","status":"consider"},{"name":"Jorys Bovet","group":"RN et alliés politiques","status":"consider"},{"name":"Jérôme Buisson","group":"RN et alliés politiques","status":"consider"},{"name":"Eddy Casterman","group":"RN et alliés politiques","status":"consider"},{"name":"Bernard Chaumeil","group":"RN et alliés politiques","status":"consider"},{"name":"Roger Chudeau","group":"RN et alliés politiques","status":"consider"},{"name":"Bruno Clavet","group":"RN et alliés politiques","status":"consider"},{"name":"Caroline Colombier","group":"RN et alliés politiques","status":"consider"},{"name":"Nathalie Da Conceicao Carvalho","group":"RN et alliés politiques","status":"consider"},{"name":"Catherine Dellong Meng","group":"RN et alliés politiques","status":"consider"},{"name":"Jocelyn Dessigny","group":"RN et alliés politiques","status":"consider"},{"name":"Sandrine Dogor-Such","group":"RN et alliés politiques","status":"consider"},{"name":"Nicolas Dragon","group":"RN et alliés politiques","status":"consider"},{"name":"Alexandre Dufosset","group":"RN et alliés politiques","status":"consider"},{"name":"Gaëtan Dussausaye","group":"RN et alliés politiques","status":"consider"},{"name":"Aurélien Dutremble","group":"RN et alliés politiques","status":"consider"},{"name":"Auguste Evrard","group":"RN et alliés politiques","status":"consider"},{"name":"Frédéric Falcon","group":"RN et alliés politiques","status":"consider"},{"name":"Muriel Fiol","group":"RN et alliés politiques","status":"consider"},{"name":"Marc de Fleurian","group":"RN et alliés politiques","status":"consider"},{"name":"Guillaume Florquin","group":"RN et alliés politiques","status":"consider"},{"name":"Emmanuel Fouquart","group":"RN et alliés politiques","status":"consider"},{"name":"Thierry Frappé","group":"RN et alliés politiques","status":"consider"},{"name":"Julien Gabarron","group":"RN et alliés politiques","status":"consider"},{"name":"Stéphanie Galzy","group":"RN et alliés politiques","status":"consider"},{"name":"Laurence Gardet","group":"RN et alliés politiques","status":"consider"},{"name":"Jonathan Gery","group":"RN et alliés politiques","status":"consider"},{"name":"Benoît Gilhet","group":"RN et alliés politiques","status":"consider"},{"name":"Yoann Gillet","group":"RN et alliés politiques","status":"consider"},{"name":"Christian Girard","group":"RN et alliés politiques","status":"consider"},{"name":"Antoine Golliot","group":"RN et alliés politiques","status":"consider"},{"name":"José Gonzalez","group":"RN et alliés politiques","status":"consider"},{"name":"Florence Goulet","group":"RN et alliés politiques","status":"consider"},{"name":"Géraldine Grangier","group":"RN et alliés politiques","status":"consider"},{"name":"Monique Griseti","group":"RN et alliés politiques","status":"consider"},{"name":"Julien Guibert","group":"RN et alliés politiques","status":"consider"},{"name":"Michel Guiniot","group":"RN et alliés politiques","status":"consider"},{"name":"Jordan Guitton","group":"RN et alliés politiques","status":"consider"},{"name":"Marine Hamelet","group":"RN et alliés politiques","status":"consider"},{"name":"Timothée Houssin","group":"RN et alliés politiques","status":"consider"},{"name":"Sébastien Humbert","group":"RN et alliés politiques","status":"consider"},{"name":"Laurent Jacobelli","group":"RN et alliés politiques","status":"consider"},{"name":"Pascal Jenft","group":"RN et alliés politiques","status":"consider"},{"name":"Alexis Jolly","group":"RN et alliés politiques","status":"consider"},{"name":"Tiffany Joncour","group":"RN et alliés politiques","status":"consider"},{"name":"Édouard Jordan","group":"RN et alliés politiques","status":"consider"},{"name":"Florence Joubert","group":"RN et alliés politiques","status":"consider"},{"name":"Hélène Laporte","group":"RN et alliés politiques","status":"consider"},{"name":"Robert Le Bourgeois","group":"RN et alliés politiques","status":"consider"},{"name":"Julie Lechanteux","group":"RN et alliés politiques","status":"consider"},{"name":"Nadine Lechon","group":"RN et alliés politiques","status":"consider"},{"name":"Gisèle Lelouis","group":"RN et alliés politiques","status":"consider"},{"name":"Hervé de Lépinau","group":"RN et alliés politiques","status":"consider"},{"name":"Katiana Levavasseur","group":"RN et alliés politiques","status":"consider"},{"name":"Julien Limongi","group":"RN et alliés politiques","status":"consider"},{"name":"René Lioret","group":"RN et alliés politiques","status":"consider"},{"name":"Christine Loir","group":"RN et alliés politiques","status":"consider"},{"name":"Marie-France Lorho","group":"RN et alliés politiques","status":"consider"},{"name":"Philippe Lottiaux","group":"RN et alliés politiques","status":"consider"},{"name":"Alexandre Loubet","group":"RN et alliés politiques","status":"consider"},{"name":"David Magnier","group":"RN et alliés politiques","status":"consider"},{"name":"Claire Marais-Beuil","group":"RN et alliés politiques","status":"consider"},{"name":"Matthieu Marchio","group":"RN et alliés politiques","status":"consider"},{"name":"Pascal Markowsky","group":"RN et alliés politiques","status":"consider"},{"name":"Patrice Martin","group":"RN et alliés politiques","status":"consider"},{"name":"Michèle Martinez","group":"RN et alliés politiques","status":"consider"},{"name":"Kévin Mauvieux","group":"RN et alliés politiques","status":"consider"},{"name":"Nicolas Meizonnet","group":"RN et alliés politiques","status":"consider"},{"name":"Joëlle Mélin","group":"RN et alliés politiques","status":"consider"},{"name":"Yaël Ménaché","group":"RN et alliés politiques","status":"consider"},{"name":"Thomas Ménagé","group":"RN et alliés politiques","status":"consider"},{"name":"Pierre Meurin","group":"RN et alliés politiques","status":"consider"},{"name":"Thibaut Monnier","group":"RN et alliés politiques","status":"consider"},{"name":"Serge Muller","group":"RN et alliés politiques","status":"consider"},{"name":"Thierry Perez","group":"RN et alliés politiques","status":"consider"},{"name":"Kévin Pfeffer","group":"RN et alliés politiques","status":"consider"},{"name":"Lisette Pollet","group":"RN et alliés politiques","status":"consider"},{"name":"Stéphane Rambaud","group":"RN et alliés politiques","status":"consider"},{"name":"Angélique Ranc","group":"RN et alliés politiques","status":"consider"},{"name":"Julien Rancoule","group":"RN et alliés politiques","status":"consider"},{"name":"Matthias Renault","group":"RN et alliés politiques","status":"consider"},{"name":"Catherine Rimbert","group":"RN et alliés politiques","status":"consider"},{"name":"Joseph Rivière","group":"RN et alliés politiques","status":"consider"},{"name":"Laurence Robert-Dehault","group":"RN et alliés politiques","status":"consider"},{"name":"Béatrice Roullaud","group":"RN et alliés politiques","status":"consider"},{"name":"Sophie-Laurence Roy","group":"RN et alliés politiques","status":"consider"},{"name":"Anaïs Sabatini","group":"RN et alliés politiques","status":"consider"},{"name":"Alexandre Sabatou","group":"RN et alliés politiques","status":"consider"},{"name":"Emeric Salmon","group":"RN et alliés politiques","status":"consider"},{"name":"Philippe Schreck","group":"RN et alliés politiques","status":"consider"},{"name":"Anne Sicard","group":"RN et alliés politiques","status":"consider"},{"name":"Emmanuel Taché","group":"RN et alliés politiques","status":"consider"},{"name":"Michaël Taverne","group":"RN et alliés politiques","status":"consider"},{"name":"Thierry Tesson","group":"RN et alliés politiques","status":"consider"},{"name":"Lionel Tivoli","group":"RN et alliés politiques","status":"consider"},{"name":"Gabriel Tomatis","group":"RN et alliés politiques","status":"consider"},{"name":"Romain Tonussi","group":"RN et alliés politiques","status":"consider"},{"name":"Cyril Tribuiani","group":"RN et alliés politiques","status":"consider"},{"name":"Antoine Villedieu","group":"RN et alliés politiques","status":"consider"},{"name":"Frédéric-Pierre Vos","group":"RN et alliés politiques","status":"consider"},{"name":"Frédéric Weber","group":"RN et alliés politiques","status":"consider"},{"name":"Mathilde Androuët","group":"RN et alliés politiques","status":"consider"},{"name":"Eléonore Bez","group":"RN et alliés politiques","status":"consider"},{"name":"Manon Bouquin","group":"RN et alliés politiques","status":"consider"},{"name":"Wallerand de Saint Just","group":"RN et alliés politiques","status":"consider"},{"name":"Edwige Diaz","group":"RN et alliés politiques","status":"consider"},{"name":"Thibaut François","group":"RN et alliés politiques","status":"consider"},{"name":"Charles-Henri Gallois","group":"RN et alliés politiques","status":"consider"},{"name":"Jean-Paul Garraud","group":"RN et alliés politiques","status":"consider"},{"name":"Audrey Guibert","group":"RN et alliés politiques","status":"consider"},{"name":"Andréa Kotarac","group":"RN et alliés politiques","status":"consider"},{"name":"Jean-Lin Lacapelle","group":"RN et alliés politiques","status":"consider"},{"name":"Alexandra Masson","group":"RN et alliés politiques","status":"consider"},{"name":"Aleksandar Nikolic","group":"RN et alliés politiques","status":"consider"},{"name":"Philippe Olivier","group":"RN et alliés politiques","status":"consider"},{"name":"Ludovic Pajot","group":"RN et alliés politiques","status":"consider"},{"name":"François Paradol","group":"RN et alliés politiques","status":"consider"},{"name":"Gilles Pennelle","group":"RN et alliés politiques","status":"consider"},{"name":"Julie Rechagneux","group":"RN et alliés politiques","status":"consider"},{"name":"Julien Sanchez","group":"RN et alliés politiques","status":"consider"},{"name":"Christopher Szczurek","group":"RN et alliés politiques","status":"consider"},{"name":"Pierre-Romain Thionnet","group":"RN et alliés politiques","status":"consider"},{"name":"Rody Tolassy","group":"RN et alliés politiques","status":"consider"},{"name":"Matthieu Valet","group":"RN et alliés politiques","status":"consider"},{"name":"Emma Vallain","group":"RN et alliés politiques","status":"consider"},{"name":"Éric Ciotti","group":"RN et alliés politiques","status":"consider"},{"name":"Alexandre Allegret-Pilot","group":"RN et alliés politiques","status":"consider"},{"name":"Charles Alloncle","group":"RN et alliés politiques","status":"consider"},{"name":"Matthieu Bloch","group":"RN et alliés politiques","status":"consider"},{"name":"Pierre-Henri Carbonnel","group":"RN et alliés politiques","status":"consider"},{"name":"Bernard Chaix","group":"RN et alliés politiques","status":"consider"},{"name":"Marc Chavent","group":"RN et alliés politiques","status":"consider"},{"name":"Christelle D’Intorni","group":"RN et alliés politiques","status":"consider"},{"name":"Olivier Fayssat","group":"RN et alliés politiques","status":"consider"},{"name":"Bartolomé Lenoir","group":"RN et alliés politiques","status":"consider"},{"name":"Hanane Mansouri","group":"RN et alliés politiques","status":"consider"},{"name":"Maxime Michelet","group":"RN et alliés politiques","status":"consider"},{"name":"Éric Michoux","group":"RN et alliés politiques","status":"consider"},{"name":"Sophie Ricourt Vaginay","group":"RN et alliés politiques","status":"consider"},{"name":"Vincent Trébuchet","group":"RN et alliés politiques","status":"consider"},{"name":"Antoine Valentin","group":"RN et alliés politiques","status":"consider"},{"name":"Gérault Verny","group":"RN et alliés politiques","status":"consider"},{"name":"Laurence Trochu","group":"RN et alliés politiques","status":"consider"},{"name":"Gilbert Payet","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Samuel Lafont","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Thomas Culerrier","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Hilaire Bouyé","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Éléonore Lhéritier","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Sophie Calvel","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Mondane Langlois","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Diane Ouvry","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Matthieu Louves","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Johanna Humphrey","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Xavier Fourboul","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Pierre-Yves Thomas","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Isabelle Lamarque","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Marie-Pierre Cesari","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Julien Sene","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Olivier Le Coq","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Virginie Bonthoux","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Romain Gresle","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Laurent Chomard","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Elisabeth de Saint Romain","group":"Reconquête et autres mouvements","status":"consider"},{"name":"Stanislas Rigault","group":"Reconquête et autres mouvements","status":"review"},{"name":"Damien Rieu","group":"Reconquête et autres mouvements","status":"review"},{"name":"Jean Messiha","group":"Reconquête et autres mouvements","status":"review"},{"name":"Papacito","group":"Reconquête et autres mouvements","status":"review"},{"name":"Thaïs d’Escufon","group":"Reconquête et autres mouvements","status":"review"},{"name":"Gilbert Collard","group":"Reconquête et autres mouvements","status":"review"},{"name":"Baptiste Marchais","group":"Reconquête et autres mouvements","status":"review"},{"name":"Tanguy David","group":"Reconquête et autres mouvements","status":"review"},{"name":"Pierre-Édouard Stérin","group":"Réseau et initiatives liés à P.-É. Stérin","status":"requested"},{"name":"Arnaud Rérolle","group":"Réseau et initiatives liés à P.-É. Stérin","status":"requested"},{"name":"François Durvye","group":"Réseau et initiatives liés à P.-É. Stérin","status":"requested"},{"name":"Alexandre Pesey","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review"},{"name":"Alban du Rostu","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review"},{"name":"Charles Beigbeder","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review"},{"name":"Alexandre Avril","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review"},{"name":"Philippe de Gestas","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review"},{"name":"Stéphane Ravier","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review"},{"name":"Claire Geronimi","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review"},{"name":"Edward Whalley","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review"},{"name":"Périclès","group":"Réseau et initiatives liés à P.-É. Stérin","status":"requested"},{"name":"Fonds du bien commun","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review"},{"name":"Institut de formation politique (IFP)","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review"},{"name":"Politicae","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review"},{"name":"Observatoire de l’immigration et de la démographie (OID)","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review"},{"name":"L’Incorrect","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review"},{"name":"IREF (Institut de recherches économiques et fiscales)","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review"},{"name":"Contrepoints","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review"},{"name":"Otium Capital","group":"Réseau et initiatives liés à P.-É. Stérin","status":"review"},{"name":"Benyamin Netanyahou","group":"Alliances et soutiens à B. Netanyahou","status":"requested"},{"name":"Meyer Habib","group":"Alliances et soutiens à B. Netanyahou","status":"requested"},{"name":"Donald Trump","group":"Alliances et soutiens à B. Netanyahou","status":"requested"},{"name":"Geert Wilders","group":"Alliances et soutiens à B. Netanyahou","status":"requested"},{"name":"Santiago Abascal","group":"Alliances et soutiens à B. Netanyahou","status":"requested"},{"name":"Viktor Orbán","group":"Alliances et soutiens à B. Netanyahou","status":"requested"},{"name":"Javier Milei","group":"Alliances et soutiens à B. Netanyahou","status":"requested"},{"name":"Itamar Ben-Gvir","group":"Alliances et soutiens à B. Netanyahou","status":"requested"},{"name":"Bezalel Smotrich","group":"Alliances et soutiens à B. Netanyahou","status":"requested"},{"name":"Aryeh Deri","group":"Alliances et soutiens à B. Netanyahou","status":"requested"},{"name":"Amichai Chikli","group":"Alliances et soutiens à B. Netanyahou","status":"requested"},{"name":"Matteo Salvini","group":"Alliances et soutiens à B. Netanyahou","status":"review"},{"name":"Likoud","group":"Alliances et soutiens à B. Netanyahou","status":"requested"},{"name":"Otzma Yehudit (Pouvoir juif)","group":"Alliances et soutiens à B. Netanyahou","status":"requested"},{"name":"Sionisme religieux (Religious Zionism)","group":"Alliances et soutiens à B. Netanyahou","status":"requested"},{"name":"Shas","group":"Alliances et soutiens à B. Netanyahou","status":"requested"},{"name":"Judaïsme unifié de la Torah (United Torah Judaism)","group":"Alliances et soutiens à B. Netanyahou","status":"requested"},{"name":"Mathilda (porte-parole du Collectif Némésis)","group":"Collectif Némésis","status":"review"},{"name":"Léa (porte-parole du Collectif Némésis)","group":"Collectif Némésis","status":"review"},{"name":"Yona (porte-parole du Collectif Némésis)","group":"Collectif Némésis","status":"review"},{"name":"Astrid (porte-parole du Collectif Némésis)","group":"Collectif Némésis","status":"review"},{"name":"Jeunesses identitaires","group":"Mouvements identitaires et GUD","status":"requested"},{"name":"Une Autre Jeunesse","group":"Mouvements identitaires et GUD","status":"review"},{"name":"Génération identitaire","group":"Mouvements identitaires et GUD","status":"consider"},{"name":"Les Identitaires / Bloc identitaire","group":"Mouvements identitaires et GUD","status":"review"},{"name":"GUD / GUD Paris (Groupe Union Défense)","group":"Mouvements identitaires et GUD","status":"requested"},{"name":"Jean-Eudes Gannat","group":"Réseau public de Jean-Eudes Gannat","status":"requested"},{"name":"L’Alvarium","group":"Réseau public de Jean-Eudes Gannat","status":"consider"},{"name":"Mouvement chouan","group":"Réseau public de Jean-Eudes Gannat","status":"consider"},{"name":"Rassemblement des étudiants de droite (RED)","group":"Réseau public de Jean-Eudes Gannat","status":"review"},{"name":"Comité du 9 mai (C9M)","group":"Réseau public de Jean-Eudes Gannat","status":"review"},{"name":"Bordeaux Nationaliste / Bordeaux Nationalistes","group":"Réseau public de Jean-Eudes Gannat","status":"review"},{"name":"Paul-Alexandre Martin","group":"Réseau public de Jean-Eudes Gannat","status":"review"},{"name":"Ligue Ligérienne","group":"Réseau public de Jean-Eudes Gannat","status":"review"},{"name":"Alain Soral","group":"Réseau public et ancien entourage de Soral","status":"requested"},{"name":"Kontre Kulture","group":"Réseau public et ancien entourage de Soral","status":"consider"},{"name":"ERFM / Écoute et Respect","group":"Réseau public et ancien entourage de Soral","status":"consider"},{"name":"Faits & Documents","group":"Réseau public et ancien entourage de Soral","status":"consider"},{"name":"Au Bon Sens","group":"Réseau public et ancien entourage de Soral","status":"review"},{"name":"Pierre de Brague","group":"Réseau public et ancien entourage de Soral","status":"review"},{"name":"Julien Limes","group":"Réseau public et ancien entourage de Soral","status":"review"},{"name":"Dieudonné M’Bala M’Bala","group":"Réseau public et ancien entourage de Soral","status":"review"},{"name":"Philippe Péninque","group":"Réseau public et ancien entourage de Soral","status":"review"},{"name":"Jildaz Mahé O’Chinal","group":"Réseau public et ancien entourage de Soral","status":"review"},{"name":"Frédéric Chatillon","group":"Réseau public et ancien entourage de Soral","status":"review"},{"name":"Vincent Lapierre","group":"Réseau public et ancien entourage de Soral","status":"review"}];
  const GROUPS = [{"name":"Médias et groupes de presse","count":34},{"name":"RN et alliés politiques","count":167},{"name":"Reconquête et autres mouvements","count":36},{"name":"Réseau et initiatives liés à P.-É. Stérin","count":20},{"name":"Alliances et soutiens à B. Netanyahou","count":17},{"name":"Collectif Némésis","count":4},{"name":"Mouvements identitaires et GUD","count":5},{"name":"Réseau public de Jean-Eudes Gannat","count":8},{"name":"Réseau public et ancien entourage de Soral","count":12}];
  const DOMAINS = [{"host":"cnews.fr","label":"CNews","group":"Médias et groupes de presse"},{"host":"europe1.fr","label":"Europe 1","group":"Médias et groupes de presse"},{"host":"lejdd.fr","label":"Le Journal du Dimanche","group":"Médias et groupes de presse"},{"host":"valeursactuelles.com","label":"Valeurs actuelles","group":"Médias et groupes de presse"},{"host":"fdesouche.com","label":"Fdesouche","group":"Médias et groupes de presse"},{"host":"bvoltaire.fr","label":"Boulevard Voltaire","group":"Médias et groupes de presse"},{"host":"tvl.fr","label":"TV Libertés","group":"Médias et groupes de presse"},{"host":"kontrekulture.com","label":"Kontre Kulture","group":"Réseau public et ancien entourage de Soral"},{"host":"causeur.fr","label":"Causeur","group":"Médias et groupes de presse"}];
  const KEY='mfm_filter_web_v2_';
  const newKey=KEY+'groups_v3';
  const host=location.hostname.toLowerCase().replace(/^www\./,'');
  const skip=['localhost','127.0.0.1','janintibo-art.github.io'];
  if(skip.some(s=>host===s||host.endsWith('.'+s)))return;
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
    if(!el || el.closest('#mfm-settings-overlay,#mfm-domain-screen,#mfm-ads-overlay,form,[contenteditable="true"]'))return false;
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
      if(!activeGroups[r.group])continue;
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
    for(const r of terms){
      if(!n.includes(' '+r.term+' '))continue;
      // Common word: require its original publisher capitalization.
      if(r.name==='Frontières' && !/(?:^|[^\p{L}])Frontières(?![\p{L}])/u.test(original))continue;
      return r.name;
    }
    for(const r of shortMatches) {
      if(r.group && activeGroups[r.group] && r.re.test(original))return r.name;
    }
    return '';
  }
  function domainRule(h){
    return DOMAINS.find(d=>activeGroups[d.group] && (h===d.host||h.endsWith('.'+d.host)));
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
      input.addEventListener('change',()=>{activeGroups[g.name]=input.checked;apply();updateSummary()});
      inputs.push(input);label.append(names,input);list.appendChild(label);
    }
    const actions=document.createElement('div');actions.className='mfm-actions';
    actions.append(button('Tout activer',()=>{for(const g of GROUPS)activeGroups[g.name]=true;inputs.forEach(i=>i.checked=true);apply();updateSummary()}),
                   button('Tout désactiver',()=>{for(const g of GROUPS)activeGroups[g.name]=false;inputs.forEach(i=>i.checked=false);apply();updateSummary()}),
                   button('Fermer',()=>overlay.remove(),'mfm-primary'));
    const note=document.createElement('p');note.className='mfm-note';
    note.textContent='Un nom dans cette liste est une préférence de filtrage, pas une accusation. Certains résultats peuvent rester visibles selon le site et son navigateur. Utilisez « Afficher tout » en cas de faux positif.';
    dialog.append(header,intro,summary,list,actions,note);overlay.appendChild(dialog);document.body.appendChild(overlay);
    overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});
    overlay.addEventListener('keydown',e=>{if(e.key==='Escape')overlay.remove()});
    close.focus();updateSummary();
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
  function scan(force=false){
    if(!enabled||revealOnce||!document.body||working)return;
    working=true;
    try{
      if(domainsEnabled&&!revealDomainOnce){const d=domainRule(host);if(d){domainScreen(d);return}}
      style();
      scanAds();
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
  function menu(){
    GM_registerMenuCommand('⚙️ Gérer les groupes ('+GROUPS.length+')',openSettings);
    GM_registerMenuCommand('🚫 Publicités et autres blocages',adsPanel);
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
  style();menu();scan();
  const observer=new MutationObserver(records=>{
    if(records.every(r=>r.type==='attributes'&&r.attributeName?.startsWith('data-mfm-')))return;
    schedule();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:false});
  setInterval(()=>{if(enabled&&!revealOnce)scan()},8000);
})();
