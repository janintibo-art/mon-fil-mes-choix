#!/usr/bin/env bash
set -euo pipefail
cd "$HOME/mon_fil_mes_choix"
for cmd in git gh; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERREUR : $cmd absent. Installez-le avec : pkg install git gh"
    exit 1
  fi
done
if ! gh auth status >/dev/null 2>&1; then
  echo 'ERREUR : connectez-vous à GitHub avec gh auth login.'
  exit 1
fi
REPO='janintibo-art/mon-fil-mes-choix'
if [ ! -d .git ]; then git init -b main; fi
git branch -M main
if ! git config user.name >/dev/null; then
  git config user.name "$(gh api user --jq .login)"
fi
if ! git config user.email >/dev/null; then
  login="$(gh api user --jq .login)"
  id="$(gh api user --jq .id)"
  git config user.email "${id}+${login}@users.noreply.github.com"
fi
git add -A
if ! git diff --cached --quiet; then
  git commit -m 'v4 - projet complet avec guide IA et identite visuelle'
fi
if gh repo view "$REPO" >/dev/null 2>&1; then
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "https://github.com/${REPO}.git"
  else
    git remote add origin "https://github.com/${REPO}.git"
  fi
  git push -u origin main
else
  gh repo create "$REPO" --public --description 'Filtre Web personnel Tampermonkey et répertoire documentaire - Mon fil, mes choix' --source=. --remote=origin --push
fi
if gh api "repos/${REPO}/pages" >/dev/null 2>&1; then
  echo 'Pages : déjà activé.'
elif gh api -X POST "repos/${REPO}/pages" -f build_type=workflow >/dev/null 2>&1; then
  echo 'Pages : activé avec GitHub Actions.'
else
  echo 'ATTENTION : activez GitHub Pages dans Settings > Pages > Source : GitHub Actions.'
fi
printf '\nDépôt : https://github.com/%s\n' "$REPO"
printf 'Site attendu après publication : https://janintibo-art.github.io/mon-fil-mes-choix/\n'
printf 'Pour voir la publication : gh run watch -R %s\n' "$REPO"
