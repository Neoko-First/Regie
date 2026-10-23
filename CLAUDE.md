# CLAUDE.md — Conventions du projet

> Ce fichier définit les règles **non négociables** du projet. Avant chaque tâche, relis la section concernée.
> En cas de doute ou de conflit entre une demande et ces règles, **pose la question** au lieu de deviner.
> Objectif UX : une interface **ultra fluide**, qui réagit instantanément aux actions de l'utilisateur.

---

## 1. Stack technique

| Couche | Outil |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Front | Next.js (App Router, dernière version stable), TypeScript strict |
| Back | NestJS, TypeScript strict |
| BDD | PostgreSQL + Prisma (côté NestJS **uniquement**) |
| UI | Tailwind CSS + shadcn/ui (+ `lucide-react` pour les icônes) |
| Formulaires | React Hook Form + Zod (`@hookform/resolvers/zod`) via les composants `Field` de shadcn (+ `Controller` de RHF) |
| Validation partagée | Zod (schémas partagés front/back), `nestjs-zod` côté Nest |
| State serveur | TanStack Query (cache, optimistic updates, refetch au focus) |
| State client | Zustand (état **UI** uniquement) |
| Auth | Maison côté Nest : access token + refresh token (modèle OAuth2), `argon2` |
| Emails | Nodemailer (ou Resend) + templates `react-email` |
| Toasts | Sonner (via shadcn) |
| PWA | Serwist (`@serwist/next`) |
| Thème | `next-themes` (light / dark / system) |
| Dates | `date-fns` + locale `fr` |

### Structure du monorepo

```
apps/
  web/        # Next.js
  api/        # NestJS
packages/
  shared/     # Schémas Zod, types, constantes, codes d'erreur partagés front/back
  config/     # Configs ESLint, TS, Prettier partagées
```

**Règle :** un schéma Zod est défini **une seule fois** dans `packages/shared`, puis importé par le formulaire (front) ET par le DTO (back). Les types TS sont dérivés via `z.infer`, jamais réécrits à la main.

---

## 2. Langue et localisation

L'application est **exclusivement française** (pas de lib i18n).

- `<html lang="fr">`, metadata en français.
- Tous les textes UI, toasts, messages d'erreur (front ET API) en français.
- Messages d'erreur Zod en français : configurer la locale fr de Zod une seule fois dans `packages/shared` (ex. Zod v4 : `z.config(z.locales.fr())`), et écrire des messages personnalisés explicites pour les règles métier.
- Dates, nombres et montants formatés via des helpers centralisés (`lib/format.ts`) qui utilisent `Intl` / `date-fns` avec la locale `fr-FR` et le fuseau `Europe/Paris`.

### Dates en français
Toute date affichée à l'utilisateur est en **français**, sans exception.

- **Interdit :** afficher une date ISO brute (`2026-10-22T09:00:00Z`), utiliser `toLocaleDateString()` sans locale, ou appeler `format()` de date-fns directement dans un composant. On passe **toujours** par les helpers de `lib/format.ts`.
- Helpers à fournir (documentés en JSDoc) :

| Helper | Exemple de rendu |
|---|---|
| `formatDate` | 22/10/2026 |
| `formatDateLong` | jeudi 22 octobre 2026 |
| `formatDateTime` | 22/10/2026 à 09:35 |
| `formatTime` | 09:35 (format 24 h) |
| `formatRelative` | il y a 5 minutes, hier à 18:00 (`formatDistanceToNow` / `formatRelative` avec locale `fr`) |
| `formatMonthYear` | octobre 2026 |

- Composants de date shadcn (`Calendar`, date picker) configurés une seule fois dans un wrapper : locale `fr` de `react-day-picker`, semaine commençant le **lundi** (`weekStartsOn: 1`), libellés en français.
- Saisie de date : format `jj/mm/aaaa`. Le schéma Zod parse cette saisie et l'API reçoit une date ISO en UTC. **Stockage en UTC, affichage en `Europe/Paris`.**
- Les noms de jours et de mois restent en minuscules (convention française), sauf en début de phrase.
- **Le code reste en anglais** (variables, fonctions, fichiers, routes). **La documentation et les commentaires sont en français.**

---

## 3. Code factorisé et documenté

Le code doit être **factorisé au maximum**, centralisé, normalisé et documenté. On suit les bonnes pratiques du dev web.

### Centralisation
Aucune logique transverse ne doit être dupliquée. Points d'entrée uniques :

| Besoin | Emplacement |
|---|---|
| Appels HTTP côté client | `apps/web/lib/api-client.ts` |
| Clés de cache TanStack | `apps/web/lib/query-keys.ts` |
| Hooks de données par domaine | `apps/web/features/<domaine>/hooks/` (`useProjects`, `useCreateProject`…) |
| Helper de mutation optimiste | `apps/web/lib/optimistic.ts` |
| Formatage (dates, prix, nombres) | `apps/web/lib/format.ts` |
| Schémas Zod, types, constantes, codes d'erreur | `packages/shared` |
| Messages de toast récurrents | `apps/web/lib/messages.ts` |
| Composants modale de formulaire / confirmation | `apps/web/components/ui-extended/` |

- Organisation **par fonctionnalité** (`features/<domaine>/{components,hooks,schemas}`), pas par type de fichier.
- Si un même bloc apparaît une deuxième fois, on l'extrait (hook, composant ou utilitaire). Pas d'abstraction prématurée pour un usage unique.
- Fonctions courtes, une responsabilité chacune, pas de « magic numbers » (constantes nommées).

### Documentation
- **JSDoc en français** sur toute fonction, hook, composant, service ou DTO **exporté** : description, `@param`, `@returns`, `@throws` si pertinent, `@example` pour les utilitaires.
- Commentaires inline pour expliquer le **pourquoi** des parties techniques, pas le *quoi*.
- Un `README.md` par app et par package : rôle, scripts, variables d'environnement.

```ts
/**
 * Formate une date au format français lisible.
 *
 * @param date - Date à formater (objet Date ou chaîne ISO renvoyée par l'API)
 * @param pattern - Motif date-fns (par défaut : "d MMMM yyyy")
 * @returns La date formatée, ex. « 22 octobre 2026 »
 * @example formatDate("2026-10-22T09:00:00Z") // "22 octobre 2026"
 */
export function formatDate(date: Date | string, pattern = "d MMMM yyyy"): string {
  return format(new Date(date), pattern, { locale: fr });
}
```

---

## 4. Next.js — Pages et rendu

- **Chaque page (`page.tsx`) est un Server Component.** Elle :
  1. exporte `metadata` ou `generateMetadata()` (title, description, openGraph, etc.) ;
  2. **précharge** les données côté serveur dans TanStack Query (`prefetchQuery` + `HydrationBoundary`) pour que le client démarre avec un cache déjà rempli ;
  3. délègue l'interactivité à des Client Components enfants (`"use client"` le plus bas possible dans l'arbre).
- Chaque segment de route prévoit : `loading.tsx` (skeletons shadcn), `error.tsx`, et `not-found.tsx` si pertinent.
- Template de titre dans le `layout.tsx` racine : `title: { template: "%s | NomApp", default: "NomApp" }`.
- SEO : `sitemap.ts`, `robots.ts`, `manifest.ts` (PWA) à la racine de `app/`.

---

## 5. Proxy API (BFF)

Le navigateur ne doit **jamais** appeler l'API NestJS directement : son URL n'apparaît pas dans l'onglet Network.

- Route handler catch-all : `app/api/[...path]/route.ts` qui relaie la requête vers `process.env.API_URL` (variable **sans** préfixe `NEXT_PUBLIC_`).
- Le proxy transmet les cookies d'auth (et renvoie les `Set-Cookie` du backend), et ne renvoie pas les en-têtes internes.
- ⚠️ Depuis Next.js 16, `middleware.ts` s'appelle `proxy.ts`. Notre BFF vit dans `app/api/[...path]/route.ts`. `proxy.ts` est réservé aux redirections d'auth (routes protégées).

```ts
// app/api/[...path]/route.ts
// BFF : relaie les appels du navigateur vers l'API Nest.
// L'URL réelle du backend reste côté serveur (pas de NEXT_PUBLIC_).
const API_URL = process.env.API_URL!;

async function forward(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = new URL(req.url);
  const target = `${API_URL}/${path.join("/")}${url.search}`;

  const res = await fetch(target, {
    method: req.method,
    headers: {
      "content-type": req.headers.get("content-type") ?? "application/json",
      cookie: req.headers.get("cookie") ?? "", // transmet la session
    },
    // Le body n'est pas autorisé sur GET/HEAD
    body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.text(),
    cache: "no-store",
  });

  // On ne renvoie que ce qui est utile au client (pas les headers internes)
  const headers = new Headers({ "content-type": res.headers.get("content-type") ?? "application/json" });
  // Les cookies d'auth (access/refresh) posés par Nest doivent arriver au navigateur
  for (const cookie of res.headers.getSetCookie()) headers.append("set-cookie", cookie);

  return new Response(res.body, { status: res.status, headers });
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
```

---

## 6. Données serveur : TanStack Query (interface ultra fluide)

Toutes les données venant de l'API passent par TanStack Query. **Jamais** de `fetch` dans un `useEffect`, jamais de données serveur copiées dans Zustand ou dans un `useState`.

### 6.1 Clés de cache centralisées (query key factory)
Les clés sont définies **une seule fois**, de façon hiérarchique, pour pouvoir invalider précisément (un élément, une liste filtrée, ou tout un domaine).

```ts
// lib/query-keys.ts
/**
 * Fabrique de clés de cache TanStack Query.
 * Structure hiérarchique : invalider `projects.all` invalide aussi listes et détails.
 */
export const queryKeys = {
  projects: {
    all: ["projects"] as const,
    lists: () => [...queryKeys.projects.all, "list"] as const,
    list: (filters: ProjectFilters) => [...queryKeys.projects.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.projects.all, "detail", id] as const,
  },
} as const;
```

### 6.2 Configuration globale du `QueryClient`
Définie une seule fois dans `lib/query-client.ts` :
- `staleTime` > 0 (ex. 60 s) : les données en cache sont considérées fraîches et affichées **instantanément**, sans requête.
- `refetchOnWindowFocus: true` : quand l'utilisateur revient sur l'onglet, les données périmées sont rechargées **en arrière-plan** (l'UI affiche le cache pendant ce temps : pattern *stale-while-revalidate*).
- `refetchOnReconnect: true` (utile en PWA).
- `gcTime` adapté (durée de conservation en mémoire des données plus utilisées).
- `retry` limité pour les erreurs réseau, **aucun** retry sur les 4xx.
- Gestion d'erreur globale (`QueryCache` / `MutationCache` `onError`) → toast d'erreur normalisé.

### 6.3 Mises à jour optimistes (optimistic updates)
**Principe :** l'UI applique le changement **immédiatement**, comme si le serveur avait déjà répondu OK. La requête part en parallèle. Si elle échoue, on **revient à l'état précédent (rollback)** et on affiche une erreur. Si elle réussit, on resynchronise avec la vérité serveur.

Cycle obligatoire pour **toute mutation** (création, modification, suppression, toggle…) :

| Étape | Callback | Rôle |
|---|---|---|
| 1 | `onMutate` | `cancelQueries` (évite qu'un refetch en cours écrase la mise à jour), sauvegarde un **snapshot** du cache (`getQueryData`), applique le changement avec `setQueryData`, retourne le snapshot comme contexte |
| 2 | `onError` | **Rollback** : remet le snapshot dans le cache + toast d'erreur |
| 3 | `onSuccess` | Toast de succès |
| 4 | `onSettled` | `invalidateQueries` pour resynchroniser avec le serveur (récupère l'id réel, les champs calculés…) |

Ce cycle est **factorisé dans un helper** (`lib/optimistic.ts`), réutilisé par tous les hooks de mutation. Pas de copier-coller du pattern.

```ts
// lib/optimistic.ts
/**
 * Génère les callbacks d'une mutation optimiste standardisée.
 *
 * @param queryKey - Clé du cache à mettre à jour immédiatement
 * @param updater - Applique la modification attendue sur les données en cache
 * @param messages - Textes des toasts de succès et d'erreur
 * @returns Les callbacks onMutate / onError / onSuccess / onSettled à étaler dans useMutation
 */
export function optimisticHandlers<TData, TVariables>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  updater: (old: TData | undefined, variables: TVariables) => TData,
  messages: { success: string; error: string },
) {
  return {
    onMutate: async (variables: TVariables) => {
      // Stoppe les refetch en cours pour qu'ils n'écrasent pas notre mise à jour
      await queryClient.cancelQueries({ queryKey });
      // Snapshot pour pouvoir revenir en arrière en cas d'échec
      const previous = queryClient.getQueryData<TData>(queryKey);
      // Mise à jour immédiate de l'UI, avant la réponse du serveur
      queryClient.setQueryData<TData>(queryKey, (old) => updater(old, variables));
      return { previous };
    },
    onError: (_err: unknown, _vars: TVariables, context?: { previous?: TData }) => {
      // Rollback : on restaure l'état d'avant
      queryClient.setQueryData(queryKey, context?.previous);
      toast.error(messages.error);
    },
    onSuccess: () => toast.success(messages.success),
    // Dans tous les cas, on resynchronise avec la vérité serveur
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  };
}
```

- Création optimiste : l'élément ajouté reçoit un **id temporaire** (`crypto.randomUUID()`) et un état visuel « en cours » discret, remplacé au `onSettled`.
- Les modales de formulaire se ferment **dès la soumission valide** (l'élément est déjà visible dans la liste). En cas d'échec, le toast d'erreur s'affiche et le rollback est appliqué.
- Exception : les actions **critiques ou irréversibles** (suppression définitive, paiement, changement de mot de passe, actions d'auth) **ne sont pas optimistes**. On attend la réponse serveur avec un état de chargement.
- Préchargement au survol (`prefetchQuery` sur `onMouseEnter` des liens vers une page détail) pour une navigation instantanée.

---

## 7. State client : Zustand

- Zustand = état **UI** global uniquement (préférences, sélection multiple, panneau ouvert…).
- Un store par domaine, sélecteurs ciblés pour éviter les re-renders.
- État local d'un composant → `useState`.

---

## 8. UI et design system

### Composants
- **shadcn/ui au maximum.** Ne jamais recréer un composant existant dans shadcn.
- Besoin d'un comportement en plus ? On **étend** le composant (wrapper dans `components/ui-extended/` ou variante `cva`), sans modifier la logique interne de `components/ui/` sauf nécessité documentée.
- Sidebar : composant `Sidebar` de shadcn en **`variant="inset"`**, avec `SidebarProvider`, `SidebarInset` et `SidebarTrigger`.

### Couleurs
- **Uniquement des variables CSS** (tokens définis dans `globals.css`, utilisées via les classes Tailwind sémantiques : `bg-primary`, `text-muted-foreground`, `border-destructive`…).
- **Interdit :** couleurs en dur (`#fff`, `rgb()`, `bg-green-500`, `text-red-600`, valeurs arbitraires `bg-[#...]`, `style={{ color }}`).
- Couleurs d'action logiques :
  - **Vert (`success`)** → validation / écriture (créer, enregistrer).
  - **Rouge (`destructive`)** → danger zone / action impactante (supprimer, révoquer, réinitialiser).
- shadcn ne fournit pas de token vert : ajouter `--success` et `--success-foreground` dans `:root` et `.dark`, les exposer dans le thème Tailwind, puis ajouter une variante `success` au `Button` via `cva`.
- Tout nouveau besoin de couleur = nouveau token, jamais une valeur ponctuelle.

### Icônes
- Toute action a une icône `lucide-react`.
- Bouton icône seul → `aria-label` obligatoire + `Tooltip` shadcn. Si l'action n'est pas évidente, ajouter un label texte visible.

### Accessibilité
- Navigation clavier complète, focus visible, labels associés à chaque champ, contrastes AA.
- Respecter `prefers-reduced-motion`.

---

## 9. Formulaires

- Toujours **React Hook Form + Zod** via les composants shadcn `Field`, `FieldLabel`, `FieldDescription`, `FieldError` et le `Controller` de React Hook Form. (L'ancien composant `Form` de shadcn n'existe plus dans le registre actuel.) Les champs courants sont factorisés dans `components/ui-extended/form-fields.tsx` (`TextField`, `TextareaField`…).
- `defaultValues` toujours renseignées (jamais `undefined`, sinon `isDirty` est faussé).
- **Bouton de validation désactivé** tant que `!formState.isDirty || formState.isSubmitting`.
- **Bouton Annuler** : appelle `form.reset()` pour revenir aux valeurs initiales. Il **ne ferme pas** la modale. Il est lui aussi désactivé si le formulaire n'est pas modifié.
- En édition, n'envoyer au back que les champs modifiés (`formState.dirtyFields`) quand c'est pertinent (PATCH).
- Les erreurs serveur liées à un champ sont remontées via `form.setError()`.
- Ce comportement est encapsulé dans un composant réutilisable (`FormDialog`) : on ne réécrit pas le footer Annuler/Valider dans chaque formulaire.

```tsx
// Pattern de référence (encapsulé dans FormDialog)
const form = useForm<ProjectInput>({
  resolver: zodResolver(projectSchema), // schéma importé de @regie/shared
  defaultValues: project,               // valeurs de base = référence pour isDirty
});

const { isDirty, isSubmitting } = form.formState;

<DialogFooter>
  {/* Annuler = retour aux valeurs initiales, la modale reste ouverte */}
  <Button type="button" variant="outline" disabled={!isDirty || isSubmitting} onClick={() => form.reset()}>
    <RotateCcw /> Annuler
  </Button>
  {/* Grisé tant que rien n'a changé ou qu'une requête est en cours */}
  <Button type="submit" variant="success" disabled={!isDirty || isSubmitting}>
    {isSubmitting ? <Loader2 className="animate-spin" /> : <Check />} Enregistrer
  </Button>
</DialogFooter>
```

---

## 10. Modales

- Toute action d'**ajout / modification / suppression** passe par une modale qui affiche les informations nécessaires.
  - Ajout / modification → `Dialog` (ou `Sheet` si le formulaire est long).
  - Suppression / action irréversible → `AlertDialog`, bouton `variant="destructive"`, rappel clair de ce qui sera supprimé.
- Fermeture via la croix, le clic sur l'overlay ou `Échap` (comportement natif), ou automatiquement après une soumission valide. Aucun autre bouton du footer ne ferme la modale.
- Si le formulaire est modifié et que l'utilisateur ferme la modale : demander confirmation (`AlertDialog` « Abandonner les modifications ? »).
- Le formulaire est réinitialisé à chaque ouverture.

---

## 11. Feedback utilisateur

- **Chaque action produit un feedback**, de préférence un toast Sonner (`<Toaster />` monté dans le layout racine).
  - Succès → `toast.success(...)` ; Erreur → `toast.error(message lisible)`, jamais d'erreur technique brute.
  - Opérations longues non optimistes → `toast.promise()`.
- Les textes récurrents sont centralisés dans `lib/messages.ts`.
- États de chargement : skeletons pour le premier chargement uniquement (ensuite le cache prend le relais), spinner sur les boutons des actions non optimistes.
- États vides : composant dédié avec icône, texte explicatif et CTA.

---

## 12. Authentification

On reproduit le **modèle de jetons standard d'OAuth2** (access token court + refresh token avec rotation), implémenté côté NestJS pour une authentification email / mot de passe.

### 12.1 Jetons et session
- **Access token** JWT à durée courte (≈ 15 min), dans un cookie `httpOnly`, `secure`, `sameSite=lax`.
- **Refresh token** opaque à durée longue (≈ 7 à 30 jours), cookie `httpOnly` restreint au chemin du refresh, **haché en base** (jamais stocké en clair).
- **Rotation** : chaque utilisation du refresh token l'invalide et en émet un nouveau. Si un refresh token déjà utilisé est présenté → détection de vol : toute la famille de sessions est révoquée.
- Le refresh est transparent côté client : `api-client.ts` intercepte un 401, appelle `/auth/refresh` une seule fois (requêtes concurrentes mises en file), puis rejoue la requête.
- Table `Session` (appareil, IP, dernière activité) pour lister et révoquer ses sessions.
- Aucun jeton dans `localStorage` / `sessionStorage`.

### 12.2 Mots de passe
- Les mots de passe sont **hachés** avec **argon2id** (pas chiffrés : un hash est irréversible). Jamais loggés, jamais renvoyés par l'API.
- **Politique de mot de passe fort**, définie **une seule fois** dans `packages/shared` (schéma Zod) et appliquée **dans l'UI ET dans l'API** :
  - 12 caractères minimum ;
  - au moins une minuscule, une majuscule, un chiffre et un caractère spécial ;
  - différent de l'email ;
  - (recommandé) refus des mots de passe connus comme compromis (API Have I Been Pwned en k-anonymity, côté API).
- UI : indicateur de force en temps réel + liste des critères cochés au fur et à mesure, bouton afficher/masquer, champ de confirmation.

### 12.3 Parcours à implémenter
| Parcours | Points clés |
|---|---|
| Inscription | Validation forte, email de vérification envoyé, compte inactif tant que non vérifié |
| Vérification d'email | Lien avec jeton unique, à usage unique, expirant (24 h), possibilité de renvoyer |
| Connexion | Message d'erreur **générique** (« Identifiants incorrects ») pour ne pas révéler si l'email existe |
| Déconnexion | Révocation du refresh token + suppression des cookies |
| Déconnexion de tous les appareils | Révocation de toutes les sessions |
| Mot de passe oublié | Réponse **identique** que l'email existe ou non ; jeton aléatoire haché en base, usage unique, expiration courte (≈ 30 min) |
| Réinitialisation | Nouveau mot de passe validé par la politique, révocation de toutes les sessions, email de notification |
| Changement de mot de passe (connecté) | Demande du mot de passe actuel, révocation des autres sessions, email de notification |
| Changement d'email | Confirmation sur la nouvelle adresse + notification sur l'ancienne |
| Gestion des sessions | Liste des appareils connectés, révocation unitaire |
| Suppression de compte | `AlertDialog` destructive + saisie du mot de passe (RGPD) |

### 12.4 Sécurité
- Rate limiting renforcé sur les routes d'auth (login, forgot-password, verify) via `@nestjs/throttler`.
- Verrouillage temporaire après N échecs de connexion consécutifs.
- Protection CSRF : cookies `sameSite` + vérification de l'en-tête `Origin` sur les requêtes mutantes.
- Routes protégées côté Next dans `proxy.ts` (redirection vers `/connexion` si pas de session), **et** guards côté Nest (la vraie sécurité est toujours côté API).
- Templates d'emails transactionnels en français (`react-email`).

---

## 13. Backend NestJS

- Architecture par module métier : `module / controller / service`, Prisma injecté via un `PrismaService`.
- Validation : DTO générés depuis les schémas Zod partagés (`createZodDto`) + `ZodValidationPipe` global.
- Erreurs : exception filter global → format de réponse uniforme `{ statusCode, message, code, fieldErrors? }`, messages en français, `code` issu d'une enum partagée dans `packages/shared`.
- Sécurité : `helmet`, CORS restreint au front, rate limiting global.
- Autorisation : guards + décorateurs de rôles. Toujours vérifier que l'utilisateur a le droit sur la ressource (pas seulement qu'il est connecté).
- Documentation : Swagger sur `/docs` en dev.
- Variables d'environnement validées au démarrage avec Zod (même chose côté Next).

## 14. Base de données

- Prisma uniquement dans `apps/api`. Toute modif de schéma passe par une migration nommée (`prisma migrate dev --name ...`).
- Champs `createdAt` / `updatedAt` sur toutes les tables. Soft delete (`deletedAt`) pour les données métier importantes.
- Tables d'auth : `User`, `Session` (refresh tokens hachés), `VerificationToken` (vérification email, reset mot de passe : hachés, avec type et expiration).
- Script de seed (`prisma/seed.ts`) pour le développement.
- PostgreSQL lancé via `docker-compose.yml` en local (avec un service Mailpit pour tester les emails).

---

## 15. PWA

- `app/manifest.ts` complet (nom, icônes toutes tailles + maskable, `theme_color` cohérent avec les tokens, `display: standalone`, `lang: "fr"`).
- Service worker via Serwist : cache des assets statiques, page `offline` de secours, **pas** de mise en cache des réponses API authentifiées.
- Prompt de mise à jour (toast « Nouvelle version disponible ») quand un nouveau SW est prêt.

---

## 16. Qualité

- TypeScript `strict`, aucun `any` (utiliser `unknown` + narrowing).
- ESLint + Prettier (+ `prettier-plugin-tailwindcss`), Husky + lint-staged, Conventional Commits.
- Tests : Vitest + Testing Library (front), Jest (Nest), Playwright pour les parcours critiques (**tous les parcours d'auth** inclus).
- Nommage : composants en `PascalCase`, fichiers en `kebab-case`, hooks préfixés `use`.

---

## 17. Definition of Done (à vérifier avant de dire qu'une tâche est finie)

- [ ] La page est un Server Component avec ses metadata, et précharge ses données dans le cache TanStack.
- [ ] `loading.tsx` / `error.tsx` présents si la page charge des données.
- [ ] Données lues via un hook TanStack Query utilisant `queryKeys` (aucune clé écrite en dur).
- [ ] Mutation optimiste via le helper `optimisticHandlers` (sauf action critique), avec rollback.
- [ ] Formulaire : Zod partagé, bouton validé grisé si non modifié, Annuler = reset sans fermer.
- [ ] Action CRUD dans une modale, suppression dans un `AlertDialog` destructive.
- [ ] Toast sur succès ET erreur, textes en français.
- [ ] Aucune couleur en dur, uniquement des tokens.
- [ ] Icônes avec `aria-label` / tooltip si sans texte.
- [ ] Appels client via `/api/...` (proxy), jamais l'URL Nest.
- [ ] Endpoint Nest protégé (auth + droit sur la ressource) et validé par Zod.
- [ ] Aucune logique dupliquée ; fonctions exportées documentées en JSDoc (français).
- [ ] `pnpm lint`, `pnpm typecheck` et les tests passent.
