# Logo de Régie : le « clap validé »

Le clap de cinéma (identité Régie, D-024) marqué d'une coche : de la spec à la recette, chaque évolution est validée (D-092).

| Fichier                   | Usage                                                      |
| ------------------------- | ---------------------------------------------------------- |
| `regie-mark.svg`          | Icône complète, thème clair (documents, présentations)     |
| `regie-mark-dark.svg`     | Icône complète, thème sombre                               |
| `regie-mark-compact.svg`  | Icône compacte, pour les petites tailles (≤ 32 px)         |
| `regie-wordmark.svg`      | Icône, nom et signature, thème clair                       |
| `regie-wordmark-dark.svg` | Icône, nom et signature, thème sombre                      |

## Règles

- **Grille** : 64 × 64, coins de 14, tracés de 4 (complète) ou 5 (compacte), extrémités arrondies.
- **Couleurs** : fond `--primary`, tracés `--primary-foreground` (clair : `#4f46e5` / `#ffffff` ; sombre : `#818cf8` / `#1e1b18`). Pas d'autre couleur.
- **Petites tailles** : en dessous de 32 px, utiliser la version compacte (le clapet incliné et ses rayures deviennent illisibles).
- **Wordmark** : texte en Plus Jakarta Sans ExtraBold. Les SVG du wordmark supposent la police installée (sinon, police système) : pour un rendu garanti hors de l'application, exporter en PNG.

## Dans l'application

- Composants `RegieMark` et `RegieWordmark` : `apps/web/components/brand/regie-logo.tsx` (couleurs par tokens, suivent le thème).
- Favicon (clair / sombre selon le navigateur) : `apps/web/app/icon.svg`.
- Icône PWA maskable : `apps/web/public/icon-maskable.svg` ; icône iOS (PNG généré) : `apps/web/app/apple-icon.tsx`.
- Les tracés sont dupliqués dans ces fichiers statiques (un favicon ou un PNG ne lit pas un composant React) : toute retouche du dessin se reporte partout.
