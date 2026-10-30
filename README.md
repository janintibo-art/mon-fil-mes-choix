# Mon fil, mes choix — V16

Projet indépendant de personnalisation **locale et réversible** de la navigation. Les listes représentent des préférences de filtrage : la présence d’une personne ou organisation ne constitue pas une accusation.

## Ce que contient le projet

| Élément | Fonction |
|---|---|
| `site/index.html` | Accueil, annuaire consultable et liens de téléchargement |
| `site/tampermonkey.html` | Tutoriel avec illustrations, copie du script et options publicitaires |
| `site/dns.html` | Présentation des applications, publicités et domaines personnalisés |
| `site/ia.html` | Ancien lien redirigé vers l’accueil : rubrique IA retirée |
| `site/tampermonkey/mon-fil-mes-choix.user.js` | Filtrage local des résultats et publications, neuf groupes, option publicitaire |
| `site/liste_v8.json` et `.csv` | 303 entrées dans 9 groupes |
| `site/domaines_v1.json` | 9 domaines initiaux validés pour la couche réseau |
| `android/` | APK : filtre DNS local via `VpnService`, gestion des groupes et des domaines |
| `windows/` | EXE : application Python/Tkinter, filtrage via `hosts`, gestion des groupes |
| `.github/workflows/` | GitHub Pages, compilations APK/EXE et GitHub Releases |

## Tampermonkey

1. Installez Tampermonkey dans un navigateur compatible.
2. Ouvrez le guide du site et utilisez **Copier le script** pour l’insérer dans l’éditeur Tampermonkey, puis enregistrez.
3. Le script doit s’appeler **Mon fil, mes choix — filtre Web personnel**, et non « New Userscript ».
4. Dans le menu de l’extension, **Gérer les groupes (9)** permet d’activer/désactiver des groupes parmi les 303 entrées.
5. Le menu **Publicités et autres blocages** permet d’activer facultativement le masquage cosmétique d’emplacements publicitaires connus et d’ajouter jusqu’à 500 domaines personnels. L’option est désactivée au départ. Ces domaines ne créent pas de règles DNS.

Le script ne promet ni la disparition universelle d’un nom, ni la suppression des publicités diffusées dans les lecteurs vidéo. En cas de faux positif, utilisez « Afficher tout » ou désactivez le script.

## Applications Android et Windows

- **303 entrées sélectionnées par défaut**, réparties en 9 groupes, réglables individuellement. Un nom sélectionné sans domaine associé ne crée aucune règle réseau.
- **9 domaines initiaux** utilisés pour le filtrage DNS (Android) ou `hosts` (Windows).
- **Publicités et autres blocages** : import manuel et facultatif des sources **AdAway** et **StevenBlack** (limite de 10 000 domaines par liste), activation/désactivation séparée et ajout de domaines personnalisés.
- **Android** : VPN local dédié aux requêtes DNS, pas un VPN d’anonymisation ; les applications utilisant DoH, DNS privé, IPv6 ou TCP peuvent contourner le filtrage. Un autre VPN peut entrer en conflit. La résolution en amont passe par des fournisseurs DNS tiers.
- **Windows** : règles encadrées dans le fichier `hosts` et restaurables ; droits administrateur nécessaires. Le fichier `hosts` ne bloque pas tout le trafic.

## Publication

Dépôt : `https://github.com/janintibo-art/mon-fil-mes-choix`

Site : `https://janintibo-art.github.io/mon-fil-mes-choix/`

Releases (APK / EXE) : `https://github.com/janintibo-art/mon-fil-mes-choix/releases`

Workflow GitHub Actions : `Construire APK et EXE DNS` et `Publier Mon fil, mes choix`. Les fichiers APK/EXE sont publiés si leurs compilations et l’étape Release réussissent.

## Confidentialité et précautions

Le script n’exige pas d’identifiants de réseaux sociaux et n’envoie pas votre liste à un service de télémétrie. Les téléchargements explicites des listes publicitaires sollicitent leurs hébergeurs. Vérifiez les licences de leurs fournisseurs avant toute redistribution. Les règles peuvent provoquer des faux positifs et le filtrage reste réversible.

## Mise à jour V16

- Ajout dans Tampermonkey d’un masquage publicitaire **cosmétique, facultatif**, indépendant des groupes.
- Possibilité d’ajouter des domaines publicitaires personnels dans ce panneau.
- Guide Tampermonkey et page Applications mis à jour.
- README réécrit ; aucune réintroduction du guide IA dans les menus.
