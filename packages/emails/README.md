# @regie/emails

Emails transactionnels de Régie, écrits avec [react-email](https://react.email) et rendus côté API.

- `src/templates/` : un composant par email (français, styles en ligne).
- `src/theme.ts` : couleurs du design system converties en hexadécimal (les clients mail ne comprennent pas les variables CSS).
- `src/index.ts` : fonctions `render…Email()` qui renvoient `{ subject, html, text }`. L'API n'utilise que ces fonctions.

## Scripts

| Script         | Rôle                                           |
| -------------- | ---------------------------------------------- |
| `pnpm build`   | Compile en ESM + CJS (`dist/`)                 |
| `pnpm preview` | Aperçu des templates sur http://localhost:3030 |
| `pnpm test`    | Tests Vitest (rendu, échappement)              |

Aucune variable d'environnement.
