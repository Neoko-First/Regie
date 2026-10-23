# Régie

> De la spec à la recette, toute la production au même endroit.

Plateforme interne Xotis où chaque évolution d'un produit naît, se valide, se recette et se documente, avec humains et agents IA sur les mêmes objets et les mêmes règles.

- Vision, décisions et questions ouvertes : [`docs/REGIE.md`](docs/REGIE.md)
- Pitch : [`docs/pitch.md`](docs/pitch.md)
- Conventions de code (non négociables) : [`CLAUDE.md`](CLAUDE.md)
- Guide pour les agents IA : [`AGENTS.md`](AGENTS.md)

## Prérequis

- Node.js ≥ 22.12 (24 LTS recommandé, cf. `.nvmrc`)
- pnpm 10 (`corepack enable`)
- Docker (PostgreSQL + Mailpit)

## Démarrage

```bash
pnpm install
pnpm db:up      # PostgreSQL sur le port 5433, Mailpit sur http://localhost:8025
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm dev        # front sur http://localhost:3000, API sur http://localhost:4000
```

## Connecter un agent IA (MCP)

1. Dans Régie : menu utilisateur → **Jetons d'agent** → **Nouveau jeton**.
2. Copier la commande affichée (une seule fois), par exemple pour Claude Code :

```bash
claude mcp add --transport http regie http://localhost:3000/api/mcp --header "Authorization: Bearer <jeton>"
```

L'agent peut proposer, rédiger, commenter et faire avancer des évolutions en votre nom ; il ne peut jamais valider un gate.

## Structure

```
apps/
  web/        # Next.js (front + proxy BFF)
  api/        # NestJS + Prisma (API)
packages/
  shared/     # Schémas Zod, types, constantes, codes d'erreur partagés
  config/     # Configs TypeScript, ESLint, Prettier
docs/         # Document de référence et pitch
```

## Scripts

| Script                                       | Rôle                                            |
| -------------------------------------------- | ----------------------------------------------- |
| `pnpm dev`                                   | Lance tous les workspaces en mode développement |
| `pnpm build`                                 | Build de production                             |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Vérifications (aussi exécutées en CI)           |
| `pnpm format`                                | Formate le dépôt avec Prettier                  |
| `pnpm db:up` / `pnpm db:down`                | Démarre / arrête PostgreSQL et Mailpit          |

Les commits suivent [Conventional Commits](https://www.conventionalcommits.org/fr/) (vérifié par commitlint).
