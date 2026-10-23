# @regie/web

Front de Régie : Next.js 16 (App Router, Cache Components), Tailwind CSS v4, shadcn/ui (Radix, preset Nova).

## Scripts

| Script                         | Rôle                                               |
| ------------------------------ | -------------------------------------------------- |
| `pnpm dev`                     | Serveur de développement sur http://localhost:3000 |
| `pnpm build` / `pnpm start`    | Build et serveur de production                     |
| `pnpm lint` / `pnpm typecheck` | Vérifications                                      |
| `pnpm test`                    | Tests Vitest                                       |

## Variables d'environnement

Copier `.env.example` en `.env.local`.

| Variable  | Rôle                                                       |
| --------- | ---------------------------------------------------------- |
| `API_URL` | URL interne de l'API Nest, lue uniquement par le proxy BFF |

## Organisation

| Dossier                   | Contenu                                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `app/`                    | Routes. `(app)/` = pages avec la sidebar ; `api/[...path]` = proxy BFF vers l'API                               |
| `components/ui/`          | Composants shadcn (générés, modifiés seulement si nécessaire : traductions FR, variante `success`)              |
| `components/ui-extended/` | Briques maison : `FormDialog`, `ConfirmDialog`, `IconButton`, champs de formulaire                              |
| `components/layout/`      | Coquille : sidebar, palette ⌘K, en-tête de page, thème                                                          |
| `features/<domaine>/`     | Code métier par fonctionnalité (composants, hooks, schémas)                                                     |
| `lib/`                    | Points d'entrée uniques : `api-client`, `query-client`, `query-keys`, `optimistic`, `format`, `messages`, `env` |
| `stores/`                 | Stores Zustand (état UI uniquement)                                                                             |

## Thème

Les couleurs sont des tokens CSS dans `app/globals.css` (`:root` pour le clair, `.dark` pour le sombre). Changer la palette = modifier ces valeurs, rien d'autre. Le thème (clair / sombre / système) se choisit dans le pied de la sidebar ou via la palette ⌘K.
