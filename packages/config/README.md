# @regie/config

Configurations partagées par tous les workspaces du monorepo.

| Export                                | Rôle                                                        |
| ------------------------------------- | ----------------------------------------------------------- |
| `@regie/config/tsconfig/base.json`    | TypeScript strict commun                                    |
| `@regie/config/tsconfig/library.json` | Packages compilés par tsup (`packages/*`)                   |
| `@regie/config/tsconfig/nextjs.json`  | `apps/web`                                                  |
| `@regie/config/tsconfig/nestjs.json`  | `apps/api` (CommonJS + décorateurs)                         |
| `@regie/config/eslint/base`           | ESLint flat config (TS, pas de `any`, pas de `console.log`) |
| `@regie/config/prettier`              | Prettier + tri des classes Tailwind                         |

Aucun script : ce package ne fait qu'exposer des fichiers.
