# @regie/shared

Code partagé entre `apps/web` (Next.js) et `apps/api` (NestJS).

## Contenu

- **`z`** : Zod v4 configuré avec la locale française. Toujours importer `z` d'ici, jamais de `"zod"` directement.
- **`ErrorCode`, `ApiErrorBody`** : format uniforme des erreurs API.
- **Constantes** : nom de l'app, fuseau, locale.

Règle : un schéma Zod est défini **une seule fois** ici, puis importé par le formulaire (front) et par le DTO (back). Les types sont dérivés via `z.infer`.

## Scripts

| Script                         | Rôle                                     |
| ------------------------------ | ---------------------------------------- |
| `pnpm build`                   | Compile en ESM + CJS (`dist/`) avec tsup |
| `pnpm dev`                     | Compilation en mode watch                |
| `pnpm test`                    | Tests Vitest                             |
| `pnpm typecheck` / `pnpm lint` | Vérifications                            |

Aucune variable d'environnement.
