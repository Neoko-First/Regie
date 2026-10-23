# AGENTS.md — Guide pour les agents IA

Ce dépôt est développé en grande partie par des agents IA (D-053). Ce fichier, avec `docs/REGIE.md`, doit permettre à un humain ou à un agent de reprendre le projet sans contexte préalable (D-056). **Le tenir à jour à chaque PR qui change la structure, la stack ou l'état d'avancement.**

## À lire avant toute tâche

1. [`CLAUDE.md`](CLAUDE.md) : conventions **non négociables** (stack, langue, factorisation, TanStack Query, formulaires, modales, couleurs, auth, Definition of Done).
2. [`docs/REGIE.md`](docs/REGIE.md) : décisions produit (`D-XXX`) et questions ouvertes (`Q-XXX`). Une décision ✅ fait foi ; en cas de doute, poser la question.

## Règles de travail

- Une branche par tâche (`feat/`, `fix/`, `chore/`, `refactor/`), jamais de push direct sur `main`, PR obligatoire.
- Commits Conventional Commits, rédigés en français.
- Code en anglais ; commentaires, JSDoc, documentation et textes UI en français.
- Avant de proposer une PR : `pnpm lint`, `pnpm typecheck`, `pnpm test` et `pnpm build` passent.
- **Relecture humaine obligatoire, sans auto-merge** pour toute PR touchant l'authentification, les permissions, les gates ou le MCP (D-054).

## Pièges connus

- **Next.js 16 diffère de ce que les modèles connaissent** : lire `apps/web/node_modules/next/dist/docs/` avant d'utiliser une API Next (cf. `apps/web/AGENTS.md`).
- **Cache Components est activé** (`cacheComponents: true`) : tout accès dynamique (cookies, en-têtes, données non mises en cache) doit être sous un `<Suspense>`. Les routes visitées restent montées en arrière-plan (`<Activity>`) : un même composant peut exister deux fois dans le DOM.
- **shadcn preset Nova** : `CommandDialog` ne fournit pas le contexte cmdk, envelopper son contenu dans `<Command>`.
- **Prisma 7** : l'URL de connexion vit dans `prisma.config.ts` (plus dans le schéma), le client est généré dans `apps/api/src/generated/prisma` en CommonJS et se connecte via `@prisma/adapter-pg`. `prisma init` installe des « skills » d'agents (`.agents/`, `.claude/`, `.windsurf/`) : ne pas les commiter.
- **Build Nest** : `incremental` est désactivé dans `tsconfig.build.json`, sinon `nest start --watch` peut ne rien émettre après la suppression de `dist/`.
- **Valeurs connues seulement côté client** (thème stocké…) : utiliser `useIsClient()` pour éviter les erreurs d'hydratation.
- **Lire l'URL côté client** (`usePathname`, `useSearchParams`) dans un composant partagé (layout, sidebar) exige un `<Suspense>` autour, sinon le build échoue sur les routes dynamiques.
- **Coquille** : `SidebarInset` porte `min-w-0`, sinon un contenu large (board) élargit toute la page.
- **Ajout du plugin Tailwind typography** : redémarrer le serveur de dev après avoir modifié les `@plugin` de `globals.css`.
- **Composants `components/ui/`** : générés par shadcn, modifiés uniquement pour la traduction française des libellés, la variante `success` du `Button` et la conformité au lint. Après un `shadcn add`, retraduire les libellés anglais.

## Authentification (phase 3)

- **Jetons** : access token JWT (15 min, cookie `regie_at`) + refresh token opaque haché en base (cookie `regie_rt`, limité à `/api/auth`), rotation à chaque usage, réutilisation après 10 s de grâce = révocation de la session. Cookie indicateur `regie_session` (sans secret) lu par `apps/web/proxy.ts`.
- **Toutes les routes de l'API exigent une session** (`AccessTokenGuard` global), sauf `@Public()`. Les requêtes mutantes authentifiées par cookie doivent porter l'`Origin` du front (`OriginGuard`).
- **Pas d'inscription publique** : les comptes de développement viennent du seed (`pnpm --filter @regie/api db:seed`, mot de passe `SEED_USER_PASSWORD`). La création de comptes par un admin viendra plus tard.
- **Tests e2e** (`pnpm --filter @regie/api test:e2e`) : base PostgreSQL réelle, app servie sous `/api` comme derrière le BFF. À enrichir pour toute modification de l'auth.
- **Préchargement serveur** : `lib/server/prefetch.tsx` (`<Prefetch>`) sous un `<Suspense>` ; un Server Component ne peut pas rafraîchir la session, c'est le client qui prend le relais sur 401.

## Domaine (phase 4)

- **Le workflow est défini une seule fois** dans `packages/shared/src/domain/workflow.ts` (`TRANSITIONS`, `checkTransition`). L'API l'applique (`ChangeWorkflowService`), l'UI s'en sert pour afficher les boutons. Ne jamais coder une règle de transition ailleurs.
- **Règles des gates** : rôle requis (PO / Lead tech / Recetteur), jamais un agent (`AuthContext.isAgent`), jamais l'auteur de l'évolution. Chaque gate fige une `Revision` immuable et une `GateApproval`.
- **Accès** : toute route d'une évolution passe par `ChangeAccessService.requireAccess` (404 si l'utilisateur n'est pas membre de l'espace) ; les écritures exigent un rôle contributeur (`SpaceAccessService.assertRoles`).
- **Concurrence** : une transition envoie `fromStatus` ; l'API refuse (409) si le statut a changé, et la mise à jour est conditionnée au statut en base.
- **Identifiants** : `SOC-12` = clé d'espace + numéro attribué atomiquement (`Space.changeCounter`).
- **Administrateur de la plateforme** (`User.isPlatformAdmin`) : crée les espaces, a le rôle ADMIN partout, mais aucun rôle métier (il ne valide pas de gate à ce titre).

## Serveur MCP (phase 6)

- **URL** : `http://localhost:3000/api/mcp` (à travers le proxy BFF), transport HTTP « streamable » sans état, réponses JSON.
- **Authentification** : jeton d'agent personnel (`Authorization: Bearer regie_pat_…`), créé par un humain dans « Jetons d'agent » ; stocké haché, révocable. L'agent agit avec les droits de cet humain (`AuthContext.isAgent = true`, `agentName` tracé dans l'historique).
- **Connexion de Claude Code** : `claude mcp add --transport http regie http://localhost:3000/api/mcp --header "Authorization: Bearer <jeton>"` (commande prête à copier à la création du jeton).
- **Outils** (`apps/api/src/mcp/mcp-server.factory.ts`) : `list_spaces`, `list_changes`, `get_change_context`, `propose_change`, `update_change`, `comment_change`, `move_change`, `request_review`. Ils appellent les MÊMES services que l'UI : ajouter un outil = réutiliser un service, jamais dupliquer une règle.
- **Un agent ne valide jamais un gate** : refus dans `checkTransition` (`isAgent`), testé en e2e.
- Les jetons d'agent n'ouvrent PAS l'API REST (sessions navigateur uniquement) : seulement `/mcp`.

## Versions figées volontairement

| Outil       | Version | Raison                                          |
| ----------- | ------- | ----------------------------------------------- |
| TypeScript  | 6.0.x   | `typescript-eslint` ne supporte pas encore TS 7 |
| ESLint      | 9.x     | ESLint 10 exige Node ≥ 22.13                    |
| lint-staged | 16.x    | lint-staged 17 exige Node ≥ 22.22               |
| NestJS      | 11.x    | `nestjs-zod` ne supporte pas encore Nest 12     |
| Prisma      | 7.x     | Prisma 8 est encore en release candidate        |

À réévaluer quand l'écosystème suit, ou quand le poste de dev passe en Node 24.

## Avancement du POC (D-059)

Objectif : un agent crée une évolution via MCP, elle apparaît au board, un humain la fait passer un gate dans l'UI.

| Phase                                                      | Branche                    | État                           |
| ---------------------------------------------------------- | -------------------------- | ------------------------------ |
| 0. Bootstrap monorepo                                      | `chore/bootstrap-monorepo` | ✅                             |
| 1. Coquille web (shadcn, thème, sidebar, briques TanStack) | `feat/web-shell`           | ✅                             |
| 2. Socle API (Nest, Prisma, erreurs, sécurité)             | `feat/api-foundation`      | ✅                             |
| 3. Auth maison, noyau (D-079)                              | `feat/auth`                | ✅ (relecture humaine requise) |
| 4. Domaine : espaces, évolutions, workflow, gates          | `feat/changes-domain`      | ⏳                             |
| 5. UI métier : board, liste, page évolution                | `feat/board-change-page`   | ⏳                             |
| 6. Serveur MCP (module Nest, D-081)                        | `feat/mcp`                 | ⏳                             |
