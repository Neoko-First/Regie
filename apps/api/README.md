# @regie/api

API de Régie : NestJS 11, Prisma 7 (PostgreSQL, driver adapter `pg`), validation par les schémas Zod partagés (`nestjs-zod`).

Le navigateur n'appelle jamais cette API directement : il passe par le proxy BFF de `apps/web` (`/api/...`).

## Démarrage

```bash
pnpm db:up                                # à la racine : PostgreSQL (5433) + Mailpit
cp apps/api/.env.example apps/api/.env    # puis adapter si besoin
pnpm --filter @regie/api dev              # http://localhost:4000, Swagger sur /docs
```

## Scripts

| Script                         | Rôle                                                  |
| ------------------------------ | ----------------------------------------------------- |
| `pnpm dev`                     | Génère le client Prisma et lance l'API en mode watch  |
| `pnpm build` / `pnpm start`    | Build (`dist/`) et démarrage en production            |
| `pnpm lint` / `pnpm typecheck` | Vérifications                                         |
| `pnpm test`                    | Tests unitaires Jest (`*.spec.ts`)                    |
| `pnpm db:migrate --name <nom>` | Crée et applique une migration nommée (développement) |
| `pnpm db:deploy`               | Applique les migrations (production)                  |
| `pnpm db:studio`               | Explorateur de données Prisma                         |

## Variables d'environnement

Validées au démarrage par Zod (`src/config/env.schema.ts`) : l'API refuse de démarrer si l'une est invalide.

| Variable                  | Rôle                                                                                                                                               | Défaut                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `NODE_ENV`                | `development`, `test` ou `production` (Swagger désactivé en production)                                                                            | `development`                 |
| `PORT`                    | Port d'écoute                                                                                                                                      | `4000`                        |
| `DATABASE_URL`            | Connexion PostgreSQL                                                                                                                               | —                             |
| `WEB_ORIGIN`              | Origine du front (CORS, vérification Origin)                                                                                                       | —                             |
| `JWT_ACCESS_SECRET`       | Clé de signature des access tokens (≥ 32 caractères aléatoires)                                                                                    | —                             |
| `PUBLIC_API_PREFIX`       | Préfixe de l'API vu par le navigateur (chemin du cookie de refresh)                                                                                | `/api`                        |
| `SETTINGS_ENCRYPTION_KEY` | Clé AES-256-GCM des secrets stockés en base (clés Mailjet), 32 octets en base64 : `openssl rand -base64 32`. La perdre oblige à ressaisir les clés | —                             |
| `SMTP_URL`                | SMTP de repli quand Mailjet n'est pas configuré (Mailpit en dev : `smtp://localhost:1025`)                                                         | —                             |
| `SMTP_FROM`               | Expéditeur utilisé avec le SMTP de repli                                                                                                           | `Régie <no-reply@regie.test>` |

Envoi des emails : Mailjet si l'administrateur de la plateforme l'a activé et configuré dans « Administration › Envoi des emails » (clés chiffrées en base, jamais renvoyées par l'API), sinon `SMTP_URL`. En test (`NODE_ENV=test`), les emails sont capturés en mémoire.

## Organisation

| Dossier          | Contenu                                                                   |
| ---------------- | ------------------------------------------------------------------------- |
| `src/config/`    | Validation et accès typé à la configuration (`AppConfigService`)          |
| `src/prisma/`    | `PrismaService` (client unique, module global)                            |
| `src/common/`    | Transverse : `AppException`, filtre d'erreurs global, messages par défaut |
| `src/health/`    | Point de santé `GET /health` (API + base)                                 |
| `src/<domaine>/` | Un module par domaine métier (`module` / `controller` / `service`)        |
| `prisma/`        | Schéma et migrations                                                      |

## Conventions

- **Erreurs** : toute réponse d'erreur suit `{ statusCode, message, code, fieldErrors? }` (type `ApiErrorBody` de `@regie/shared`), messages en français. Lever une `AppException` pour une erreur métier ; les exceptions Nest et Prisma sont traduites automatiquement.
- **Validation** : DTO créés avec `createZodDto(schema)` à partir des schémas de `@regie/shared` ; le `ZodValidationPipe` global les applique.
- **Sécurité** : helmet, CORS limité à `WEB_ORIGIN`, rate limiting global (300 requêtes/min/IP, `@SkipThrottle()` pour exclure une route).
- **Auth** : toute route exige une session, sauf `@Public()`. `@CurrentAuth()` donne l'utilisateur et la session. Les jetons ne transitent que par cookies httpOnly.
- Le client Prisma est généré dans `src/generated/prisma` (non versionné).
