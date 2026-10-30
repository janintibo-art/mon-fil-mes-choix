# Mon fil, mes choix — V4 complète

Projet communautaire indépendant pour **personnaliser localement sa navigation**, avec un annuaire de 303 entrées et trois modes de filtrage complémentaires. Les contenus et comptes présentés dans le répertoire constituent une **liste de préférences** : ils ne constituent pas en soi une accusation d’illégalité ou de racisme.

## Contenu

| Chemin | Fonction |
|---|---|
| `site/index.html` | Site public : présentation, liste consultable, moteur de recherche, filtres, liens documentaires, tutoriel Tampermonkey |
| `site/ia.html` | Nouveau guide IA : vérification, préparation de domaines, demandes à copier, installation et dépannages |
| `site/dns.html` | Tutoriel de fonctionnement des applications Android et Windows, limites et téléchargement via Actions |
| `site/liste_v8.json` et `.csv` | 303 entrées, neuf groupes, statuts `requested`, `review`, `consider` |
| `site/domaines_v1.json` | 9 domaines utilisables par les applications DNS ; liste ajustable |
| `site/tampermonkey/mon-fil-mes-choix.user.js` | Userscript de filtrage de cartes et résultats visibles sur les pages web, activable et réversible |
| `site/assets/` | Logo et icône ; ressources PNG |
| `android/` | Prototype Java de filtrage de requêtes DNS via `VpnService` |
| `windows/` | Prototype Python/Tkinter du filtrage `hosts` + icône Windows |
| `.github/workflows/` | Publication GitHub Pages ; compilation GitHub Actions APK/EXE |
| `installer-depot.sh` | Création et push du dépôt GitHub via Termux et GitHub CLI |

## Déploiement initial (le dépôt n’existe pas encore)

1. Télécharger **un seul** `mon_fil_mes_choix_v4.zip` dans le dossier `Téléchargements` du téléphone.
2. Dans Termux, autoriser l'accès aux fichiers (si nécessaire), puis décompresser sous `~/mon_fil_mes_choix`.
3. Installer `git` et `gh`, se connecter à `gh auth login` si ce n’est pas déjà fait.
4. Exécuter `bash ~/mon_fil_mes_choix/installer-depot.sh` (création du dépôt `janintibo-art/mon-fil-mes-choix` et push).
5. Vérifier les **Actions** : `Publier Mon fil, mes choix` et `Construire APK et EXE DNS` ; autoriser **Settings → Pages → Source : GitHub Actions** si requis.

Site visé après publication : `https://janintibo-art.github.io/mon-fil-mes-choix/`.

## Distinction essentielle

- **303 entrées** : noms de comptes et médias avec statuts différents. Leur présence dans la liste ne signifie pas un blocage automatique.
- **9 domaines** : seules ces adresses peuvent être filtrées initialement par le système DNS/hosts (hors ajustement individuel).
- **Tampermonkey** : masque localement certains éléments d’une page selon les règles choisies, sans supprimer de publication ni bloquer le compte sur Facebook/YouTube.
- **L’IA** : sert à vérifier les affiliations avec sources, proposer des domaines officiels et expliquer l’installation. Ne connaît pas tous les comptes et ne peut promettre un blocage mondial ou à distance.

## Limites et sécurité

Les applications sont **expérimentales** : les sources et les fichiers de build sont livrés, pas des exécutables déjà testés sur appareils. Android (UDP/IPv4/53) utilise un service VPN local nécessitant autorisation ; le DNS chiffré, un autre VPN, IPv6/TCP peuvent contourner le prototype. Windows modifie la portion délimitée du fichier `hosts` après consentement UAC ; n’intercepte pas les DNS chiffrés des applications. Conservez la possibilité de désactiver. Android consulte des résolveurs tiers (confidentialité non garantie par le seul fait que le VPN est local).

Le script Tampermonkey fait du filtrage textuel sujet à de faux positifs et peut nécessiter des adaptations lorsque les plateformes changent d’interface. **Ne transmettez jamais de mots de passe, cookies ou codes 2FA à une IA**.

## Téléchargements

- Après la première compilation verte, utiliser les **Artifacts** de `Actions → Construire APK et EXE DNS` pour l’APK et l’EXE.
- Une release peut être générée pour un tag Git `v4`, mais aucun binaire n’est fourni dans cette archive.
- Tous les changements se font dans le dépôt GitHub public ; la liste reste personnelle, éditable et réversible.

## V14 — sélection par groupes dans Android et Windows

- 303 entrées / 9 groupes inclus dans `selection_v14.json` (ressource locale des deux applications).
- Toutes les entrées sont sélectionnées par défaut ; chaque groupe et chaque fiche peuvent être désactivés.
- La sélection est enregistrée localement.
- Seules les **neuf correspondances entre une fiche et un domaine identifié** produisent une règle DNS/hosts initialement. Le fait de cocher un nom sans domaine ne bloque pas automatiquement ses pages sociales ni ses articles.
- Les domaines personnels supplémentaires se gèrent séparément ; dans une ancienne installation, les neuf domaines par défaut passent sous la responsabilité de la sélection par groupes.
- Android applique les choix au VPN DNS en cours via une commande RELOAD ; Windows nécessite de cliquer sur ACTIVER / RÉAPPLIQUER (autorisation administrateur).
- Le guide Tampermonkey inclut une procédure mobile avec illustrations annotées, distinctes de véritables captures d'écran système.
