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

| Phase                                                      | Branche                    | État |
| ---------------------------------------------------------- | -------------------------- | ---- |
| 0. Bootstrap monorepo                                      | `chore/bootstrap-monorepo` | ✅   |
| 1. Coquille web (shadcn, thème, sidebar, briques TanStack) | `feat/web-shell`           | ⏳   |
| 2. Socle API (Nest, Prisma, erreurs, sécurité)             | `feat/api-foundation`      | ⏳   |
| 3. Auth maison, noyau (D-079)                              | `feat/auth`                | ⏳   |
| 4. Domaine : espaces, évolutions, workflow, gates          | `feat/changes-domain`      | ⏳   |
| 5. UI métier : board, liste, page évolution                | `feat/board-change-page`   | ⏳   |
| 6. Serveur MCP (module Nest, D-081)                        | `feat/mcp`                 | ⏳   |
