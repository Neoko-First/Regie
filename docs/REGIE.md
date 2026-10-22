# 🎬 Régie — Document de référence

> *De la spec à la recette, toute la production au même endroit.*

| | |
|---|---|
| **Projet** | Régie — plateforme interne Xotis de gestion des specs, changes et recettes |
| **Porteur** | Alexandre |
| **Statut du projet** | Développement du POC |
| **Dernière mise à jour** | 2026-10-22 |
| **Version du document** | 0.19 |

---

## Comment lire et maintenir ce document

Ce document est **la source de vérité des décisions** du projet Régie. Toute décision de fonctionnalité ou d'architecture y est consignée avec un identifiant stable (`D-XXX`) et un statut :

| Statut | Signification |
|---|---|
| ✅ **Actée** | Décidée, on construit dessus |
| 🟡 **Proposée** | Recommandée, en attente de validation (équipe, Lorrain…) |
| ❓ **Ouverte** | Question identifiée, pas encore de position |
| ❌ **Rejetée** | Écartée, on garde la trace et la raison |
| 🔁 **Remplacée** | Annulée par une décision plus récente (indiquer laquelle) |

**Règles de mise à jour**
1. On ne supprime jamais une décision : on change son statut (❌ ou 🔁) et on explique pourquoi.
2. Chaque modification est tracée dans le [journal des modifications](#14-journal-des-modifications).
3. Les ID de décision ne sont jamais réutilisés.

---

## 1. Vision

Créer une plateforme privée, pensée sur mesure pour le flow de travail Xotis, qui couvre **toutes les étapes, de la spec à la recette**. Chaque membre Xotis y a un compte limité à son périmètre. Humains et agents IA y travaillent sur les mêmes objets, avec les mêmes règles.

**Inspiration** : le mélange de Jira (workflow, tickets, commentaires), Spec Kit / OpenSpec (méthode spec-driven) et GitLab (livraison).
**Inspiration UI** : [Plane](https://plane.so), habillé avec le design system Xotis.

### Processus actuel de l'équipe (non définitif)

*Décrit par Alexandre le 2026-10-21. Ce processus n'est pas figé et ne lui convient pas entièrement.*

1. Les **devs et PO legacy** décrivent le fonctionnement des **logiciels actuels** dans un **vault Obsidian** : une base de connaissance volumineuse.
2. À partir de cette base, l'équipe **écrit des specs Spec Kit** pour la nouvelle plateforme.
3. Ces specs sont **implémentées**.

Conséquence pour Régie : il existe deux sortes de « référence » à ne pas confondre, la **connaissance legacy** (comment fonctionnent les anciens logiciels) et les **évolutions** (ce qu'on construit). Voir Q-024 à Q-026.

Précision d'Alexandre : il y a **deux vaults**. Le premier capture l'existant (specs legacy, logiciels PC SOFT). Le second contient les specs du futur, construites en **distillant l'existant** : corriger, ajouter ou supprimer ce qu'il faut, et adapter à une stack complètement différente (PC SOFT → Node/React, monoclient).

### Existant découvert dans le dépôt `specs` (lu le 2026-10-21)

Le dépôt `workspace/specs` (vault Obsidian versionné sur GitLab) structure déjà une bonne partie de ce que Régie vise :

| Dossier | Rôle | Équivalent Régie |
|---|---|---|
| `inbox/` | Besoins bruts du métier, jamais réécrits ; extraits du vault legacy déposés ici | Entrée des demandes / feedbacks |
| `idees/` | Pistes techniques à qualifier | Entrée technique |
| `specs/<NNN>-<slug>/` | **Specs de changement** Spec Kit (spec, plan, tasks, journal, recette, corrections). Meurent après livraison | **Évolutions** (Changes) |
| `domain/<app>/`, `platform/` | **Specs de référence**, maintenues vivantes ; ADR et contrats | **Specs vivantes** / référentiel |
| `_tableau-de-bord.base` | Vues Obsidian : demandes à qualifier, specs à valider | Board / « Ma boîte » |

Points notables :
- Le modèle Spec / Change (D-005) **existe déjà** sous les noms « spec de référence » / « spec de changement ». Natures distinguées : évolution, modification, correction, rattrapage (`platform/conventions-specs.md`).
- **xotis-recette** (spec 007, ADR-0008 à ADR-0010, acceptés le 2026-10-15) : application de recette humaine déjà conçue et dont le **MVP (parcours 1 à 3) est livré** le 2026-10-16. Stack NestJS + Next.js sur une VM du réseau local, comptes locaux + clés d'agent, synchronisation GitLab **par interrogation**, anomalies → issues GitLab, notification Teams. Cf. Q-028 et Q-029.

### Problèmes résolus
- Les specs sont aujourd'hui gérées dans Obsidian, donc inaccessibles aux non-devs et sans workflow.
- Il n'y a pas de traçabilité entre la spec, le code livré et la recette.
- Les agents IA n'ont pas de point d'accès structuré et contrôlé aux specs.
- Il n'y a pas de vision consolidée de l'avancement de l'équipe.

---

## 2. Glossaire

| Terme | Définition |
|---|---|
| **Spec** | Documentation vivante de ce que fait le système **aujourd'hui** sur un périmètre donné (ex. « Authentification »). On la consulte. Elle n'est ni assignée ni soumise à un workflow. |
| **Change** | Unité de travail, l'équivalent d'un ticket. Il porte une évolution du système, de l'idée à la prod. |
| **Proposal** | Partie d'un Change qui décrit le **pourquoi** et le **quoi**, avec le registre d'hypothèses. |
| **Delta** | Différence apportée par un Change à une Spec : exigence AJOUTÉE, MODIFIÉE ou SUPPRIMÉE. |
| **Plan** | Le **comment** technique d'un Change. |
| **Tasks** | Le plan découpé en étapes exécutables. |
| **AC** (critère d'acceptation) | Règle vérifiable au format Given / When / Then, avec un ID stable (`AC-1`, `AC-2`…). |
| **Constitution** | Règles non négociables d'un projet. Elle peut hériter de celle du Socle. |
| **Gate** | Point de validation **humaine** obligatoire dans le cycle de vie d'un Change. |
| **Scénario** | Cas de recette rattaché à un ou plusieurs AC. |
| **Campagne** | Exécution d'un ensemble de scénarios sur un environnement donné. |
| **Anomalie** | Résultat de recette KO, rattaché au Change concerné. |
| **Révision** | Version figée d'un Change ou d'une Spec (`CHG-042@r3`). |
| **Feedback** | Retour d'un utilisateur final remonté depuis un produit Xotis (Admin Xotis, MyXotis…). Matière première pour créer ou enrichir des Changes. |
| **Incident** | Dysfonctionnement d'un produit Xotis en production, géré via un flow dédié (déclarer → investiguer → atténuer → corriger → clore). |
| **Atténuation** | Action rapide qui rétablit le service (rollback, désactivation…) sans supprimer la cause. Distincte du correctif. |
| **Post-mortem** | Analyse sans recherche de coupable d'un incident grave, qui produit des actions sous forme de Changes. |
| **État de livraison** | Environnement où le code d'un Change est déployé, **déduit de GitLab**. |

---

## 3. Registre des décisions

Vue synthétique. Le détail se trouve dans les sections thématiques.

| ID | Décision | Statut | Section |
|---|---|---|---|
| D-001 | Le projet s'appelle **Régie** | ✅ Actée | — |
| D-002 | La plateforme et sa BDD sont la **source de vérité** des specs. **Pas de repo de specs.** | ✅ Actée | §4 |
| D-003 | Les non-devs (PO, recette…) utilisent la plateforme **sans compte git** | ✅ Actée | §7 |
| D-004 | Un **skill sur mesure + MCP** remplace le workflow fichier de Spec Kit | ✅ Actée | §9 |
| D-005 | Modèle **Spec (vivante) / Change (unité de travail)** avec deltas fusionnés à l'archivage | 🟡 Proposée — à valider avec Lorrain | §5 |
| D-006 | Plan et tasks vivent **dans le Change, sur la plateforme** | 🟡 Proposée | §5 |
| D-007 | **Deux axes de statut** séparés : statut du Change (humain) et état de livraison (déduit de GitLab) | 🟡 Proposée | §6 |
| D-008 | Workflow **opinionated** : un seul flux codé, non configurable | 🟡 Proposée | §6 |
| D-009 | Les **gates sont exclusivement humains**, contrôlés côté serveur | 🟡 Proposée | §6, §7 |
| D-010 | Chaque passage de gate **fige une révision** immuable | 🟡 Proposée | §4 |
| D-011 | Export markdown **à sens unique** comme porte de sortie et sauvegarde | 🟡 Proposée | §4 |
| D-012 | ~~Auth via **Auth0**, organisation interne, MFA obligatoire~~ | 🔁 Remplacée par D-027 | §7 |
| D-013 | **RBAC par projet** avec des rôles liés aux gates | 🟡 Proposée | §7 |
| D-014 | Les agents agissent **par délégation** (token OAuth d'un humain), sans accès aux gates | 🟡 Proposée | §7, §9 |
| D-015 | **GitLab = moteur de livraison** (code, MR, CI/CD, environnements). Issues, epics et boards GitLab non utilisés. | 🟡 Proposée | §8 |
| D-016 | Lien Change ↔ code par **convention de nommage** (`CHG-042` / `CHG-042@r3`) | 🟡 Proposée | §8 |
| D-017 | État de livraison alimenté par **webhooks GitLab** (pas de polling) | 🟡 Proposée | §8 |
| D-018 | GitLab isolé derrière un **adapter** (port/adapter) | 🟡 Proposée | §8 |
| D-019 | **Outils MCP métier** plutôt qu'un CRUD générique | 🟡 Proposée | §9 |
| D-020 | Principe **« le skill guide, l'API garantit »** : règles critiques validées côté serveur | 🟡 Proposée | §9 |
| D-021 | Templates et constitutions servis comme **resources MCP** ; points d'entrée de la méthode comme **prompts MCP** | 🟡 Proposée | §9 |
| D-022 | Traçabilité **AC → scénario → campagne → résultat → anomalie** | 🔁 Remplacée par D-064 | §10 |
| D-023 | **Niveaux de cérémonie** selon la taille du travail (correctif / évolution / nouveau module) | 🟡 Proposée | §6 |
| D-024 | Vocabulaire cinéma réservé à **l'identité** ; libellés **fonctionnels** dans l'UI | 🟡 Proposée | §11 |
| D-025 | Préfixe d'ID des Changes : `CHG` | 🟡 Proposée | §8 |
| D-026 | **Développement sur mesure** plutôt qu'extension de Plane ou usage de GitLab Planning | 🟡 Proposée — à confirmer après évaluation GitLab | §13 |
| D-027 | **Serveur d'autorisation OAuth2 auto-hébergé**, **aucune solution d'auth payante** (ni Auth0 ni équivalent SaaS) | ✅ Actée | §7 |
| D-028 | Le serveur d'auth respecte **OAuth 2.1 + OpenID Connect** et les exigences d'autorisation **MCP** | 🟡 Proposée | §7 |
| D-029 | MFA obligatoire : **passkeys (WebAuthn)** + **TOTP** en secours | 🟡 Proposée | §7 |
| D-030 | Les **Specs vivantes ne changent pas pendant la recette** : seul le Change évolue, la fusion a lieu à l'archivage | 🟡 Proposée | §10 |
| D-031 | **Triage obligatoire** de chaque anomalie : 🐛 Implémentation / 📝 Spec / ➕ Hors périmètre, avec une sévérité (bloquante / mineure) | 🔁 Remplacée par D-064 | §10 |
| D-032 | **Transitions retour** : 🐛 → « Renvoyer en développement » ; 📝 → « Renvoyer en revue » (nouvelle révision + Gate 1 sur les deltas modifiés) ; ➕ → nouveau Change lié « découle de » | 🔁 Remplacée par D-064 | §6, §10 |
| D-033 | Cycle de vie d'une anomalie : Ouverte → Qualifiée → En correction → À vérifier → Vérifiée / Rouverte. **Clôture par le recetteur uniquement** | 🔁 Remplacée par D-064 | §10 |
| D-034 | **Recette par tours** : chaque tour est une nouvelle campagne qui rejoue les KO, les bloqués et une non-régression ciblée. Historique conservé | 🔁 Remplacée par D-064 | §10 |
| D-035 | Toute anomalie 🐛 corrigée s'accompagne d'un **test automatisé qui la reproduit** | 🔁 Remplacée par D-064 | §10 |
| D-036 | **Gate 3 « avec réserves »** : les anomalies mineures restantes deviennent des Changes de niveau correctif | 🔁 Remplacée par D-064 | §10 |
| D-037 | Les **feedbacks utilisateurs** déjà collectés par Admin Xotis et MyXotis **remontent dans Régie** pour y être lus, triés et éventuellement transformés en Changes | 🟡 Proposée | §10 bis |
| D-038 | Triage d'un feedback : **Converti** en Change / **Rattaché** à un Change existant / **Classé** (avec motif) | 🟡 Proposée | §10 bis |
| D-039 | **Traçabilité de bout en bout** : un Change garde le lien vers les feedbacks qui l'ont motivé ; à la livraison, ces feedbacks passent en « Traité » | 🟡 Proposée | §10 bis |
| D-040 | Module **Incidents** avec une méthode « Spec Kit-like » : `/declare` → `/investigate` → `/mitigate` → `/remediate` → `/close` (ou escalade) | 🟡 Proposée (idée d'Alexandre) | §10 ter |
| D-041 | **Atténuation et correctif sont deux phases distinctes**, chacune avec son gate humain | 🟡 Proposée | §10 ter |
| D-042 | **Sévérité** (SEV1 à SEV4) obligatoire à la déclaration ; elle pilote notifications et urgence | 🟡 Proposée | §10 ter |
| D-043 | Investigation structurée : **chronologie + registre d'hypothèses + preuves + niveau de confiance** | 🟡 Proposée | §10 ter |
| D-044 | Le correctif d'un incident est un **Change de niveau « correctif urgent »** (procédure accélérée, Gate 3 maintenu) | 🟡 Proposée | §10 ter |
| D-045 | **Corrélation automatique** : affichage des Changes déployés en prod avant le début de l'incident (via webhooks GitLab) | 🟡 Proposée | §10 ter |
| D-046 | **Agents en lecture seule** sur la prod (logs, métriques, déploiements) ; toute action passe par un humain | 🟡 Proposée | §10 ter |
| D-047 | **Post-mortem blameless obligatoire** pour SEV1/SEV2 ; ses actions deviennent des Changes, dont l'ajout d'AC aux specs concernées | 🟡 Proposée | §10 ter |
| D-048 | Un ou plusieurs **feedbacks** peuvent être convertis en incident | 🟡 Proposée | §10 bis, §10 ter |
| D-049 | **Régie remplace Jira**, déjà quasiment plus utilisé ; pas de migration Jira | ✅ Actée | §12 bis |
| D-050 | Specs Obsidian : **reprise manuelle ciblée** des specs utiles, le reste au fil des Changes | ✅ Actée | §12 bis |
| D-051 | Utilisateurs dès la V0 : **devs, Lorrain, PO / produit, recette / support** | ✅ Actée | §12 bis |
| D-052 | Engagement de la hiérarchie obtenu via **pitch + maquettes** avant tout développement | ✅ Actée | §12 bis |
| D-053 | Le **développement de Régie est délégué à des agents IA** ; Alexandre reste affecté à MyXotis et pilote | ✅ Actée | §12 bis |
| D-054 | Autonomie des agents **mixte** : gates humains sur spec et plan ; **relecture humaine obligatoire** des MR touchant auth, permissions et gates ; auto-merge si tests verts ailleurs | ✅ Actée | §12 bis |
| D-055 | **Bootstrap** : les specs de Régie vivent en Spec Kit dans son repo jusqu'à la V0, puis migrent dans Régie (dogfooding). Exception temporaire à D-002 | ✅ Actée | §12 bis |
| D-056 | Bus factor : **AGENTS.md et REGIE.md tenus à jour** en permanence | ✅ Actée | §12 bis |
| D-057 | **Application web** (pas de client lourd), **stack de MyXotis** (NestJS, Prisma, PostgreSQL) et front d'Admin Xotis | 🟡 Proposée | §12 bis |
| D-058 | Calendrier : **pitch + maquettes avant le week-end du 24-25 octobre 2026**, pour obtenir un go sur une **implémentation test ce week-end** | ✅ Actée | §12 bis |
| D-059 | Implémentation test (POC) : **boucle Change** (un agent crée un Change via MCP, un humain le valide dans l'UI, statut visible au board). La **recette intégrée** est l'extension prioritaire si le temps le permet | ✅ Actée | §12 bis |
| D-060 | **~1 jour par semaine** de pilotage humain après le POC, demandé explicitement dans le pitch | ✅ Actée | §12 bis |
| D-061 | Supports du pitch : **doc de pitch d'une page + maquettes cliquables** | ✅ Actée | §12 bis |
| D-062 | **Pas de charte Xotis** : Régie adopte une **charte neutre et efficace** (outil interne, priorité à la lisibilité) | ✅ Actée | §11 |
| D-064 | Les **specs de xotis-recette** (spec 007, ADR-0008 à 0010) servent de **base au module de recette de Régie** ; elles remplacent les propositions D-022 et D-031 à D-036 | ✅ Actée | §10 |
| D-065 | Régie reprend les **quatre natures de travail** de `platform/conventions-specs.md` : **évolution**, **modification** (nouvelle spec qui cite celle qu'elle modifie), **correction** (rattachée à la spec livrée, sans revalidation métier), **rattrapage** | 🟡 Proposée | §5 bis |
| D-066 | Point d'entrée unique **« Signaler »** : Régie pose la question décisive (« le comportement attendu est-il déjà décrit ? ») et oriente vers la bonne nature ; requalification correction → modification arbitrée par le lead technique | 🟡 Proposée | §5 bis |
| D-067 | **Une anomalie de recette et une correction sont le même objet** à deux moments (avant / après livraison) : même fiche, même cycle, rattachée à la spec concernée | 🟡 Proposée | §5 bis |
| D-068 | **Report dans le référentiel** obligatoire à la livraison : Archiv propose la mise à jour de `domain/<app>/`, un humain la valide avant l'archivage | 🟡 Proposée | §5 bis |
| D-069 | Organisation en **deux niveaux métier** : **Espace** (produit ou socle : Socle, Paie, RFE, Media, Studio…, Outils internes) → **Module** (domaine fonctionnel). Specs de changement **et** référentiel suivent cette arborescence | 🟡 Proposée | §5 ter |
| D-070 | Les **couches techniques** (front, back, admin, API) ne sont **pas** un axe de classement : un champ « composants impactés » avec l'ordre de déploiement (repris du front-matter `apps:`) | 🟡 Proposée | §5 ter |
| D-071 | **Identifiants par espace** (ex. `SOC-12`, `PAIE-4`) ; une évolution qui touche plusieurs espaces a un espace principal et des liens « impacte » | 🟡 Proposée | §5 ter |
| D-072 | **Dès maintenant**, sans restructurer le dépôt : ajouter `espace:` et `module:` au front-matter des specs existantes, pour préparer l'import dans Régie | 🟡 Proposée | §5 ter |
| D-073 | Les **espaces** sont les **domaines métier de la plateforme cible** (Socle, Paie, Comptabilité, Facturation…), **pas les logiciels legacy** : classer par logiciel reproduirait les doublons de l'existant. Précise D-069 | 🟡 Proposée | §5 quater |
| D-074 | **Trois couches de connaissance** : **Existant** (capture legacy, par logiciel), **Référentiel** (plateforme cible, par domaine → module), **Specs** (changements, rattachées à un module) | 🟡 Proposée | §5 quater |
| D-075 | Cinquième nature : **Reprise**. Une spec de reprise cite les notes legacy reprises et contient un **tableau des écarts assumés** : garder / corriger / ajouter / abandonner, et adapter à la nouvelle stack | 🟡 Proposée | §5 quater |
| D-076 | **Taille des specs** : une spec = un module × une intention, **validable par le PO en 20 minutes environ** ; un sujet plus gros devient un **chantier** (regroupement de plusieurs specs) | 🟡 Proposée | §5 quater |
| D-077 | **Carte de la reprise** : chaque note legacy a un statut (à traiter, en reprise, reprise, abandonnée volontairement) ; tableau de bord de parité par logiciel legacy et par domaine | 🟡 Proposée | §5 quater |
| D-063 | Les **rôles sont cumulables** : un même utilisateur peut avoir plusieurs rôles sur un même projet (ex. PO + Recetteur) | ✅ Actée | §7 |
| D-078 | **Stack du POC** : monorepo pnpm + Turborepo, Next.js 16, NestJS 11, Prisma 7, PostgreSQL, Zod v4, shadcn/ui ; conventions détaillées dans `CLAUDE.md` du dépôt | ✅ Actée | §12 bis |
| D-079 | **Auth du POC** : auth maison (access token court + refresh token avec rotation, argon2id, politique de mot de passe partagée, sessions). Vérification d'email, reset et MFA viennent ensuite. Remplacement par un serveur OAuth 2.1 (D-028) à reconsidérer pour la V0 | ✅ Actée | §7 |
| D-080 | **Libellé UI « Évolution »** (le modèle de code garde le nom `Change`) et **identifiants par espace** (`SOC-12`), appliquant D-071 | ✅ Actée | §5 ter, §11 |
| D-081 | Le **serveur MCP est un module de l'API Nest** (transport HTTP streamable sur `/mcp`), qui réutilise services, guards et machine à états | ✅ Actée | §9 |
| D-082 | **Pas d'inscription publique** dans le noyau d'auth : comptes créés par le seed en développement, puis par un admin (invitation) ; session = un appareil, révocable | 🟡 Proposée | §7 |
| D-083 | **Workflow codé dans `@regie/shared`** : 11 transitions, rôles par transition (Gate 1 = PO, Gate 2 = Lead tech, Gate 3 = Recetteur), renvois arrière depuis la revue, la conception et la recette. Les **niveaux de cérémonie (D-023) ne sont pas encore appliqués** : toutes les natures suivent le cycle complet | 🟡 Proposée | §6 |
| D-084 | Garde-fou **Q-022 appliqué strictement** : l'auteur d'une évolution ne valide jamais ses gates, même s'il détient le rôle. Si personne d'autre n'a le rôle, il faut l'attribuer à quelqu'un | 🟡 Proposée | §7 |
| D-085 | **Administrateur de la plateforme** : crée les espaces et a le rôle Admin dans tous, sans rôle métier (pas de gate) ; un membre non habilité ne voit pas l'espace (404) | 🟡 Proposée | §7 |

---

## 4. Source de vérité et persistance

- **D-002 ✅** La plateforme et sa BDD sont la seule source de vérité. Il n'y a pas de repo de specs et pas de synchronisation bidirectionnelle avec git.
- **D-010 🟡** Chaque passage de gate crée une **révision immuable**. L'interface propose une vue diff entre révisions.
- **D-011 🟡** Un export markdown à sens unique (bundle, voire repo d'archive en lecture seule) sert de sauvegarde et garantit la réversibilité.

**Ce qu'il faut reconstruire, puisque git ne le fournit plus :**
- historique et diff des specs ;
- lien entre une version de spec et le code qui l'implémente (cf. D-016) ;
- sauvegarde et réversibilité (cf. D-011).

**Risque accepté** : la plateforme devient une dépendance critique. Si elle est indisponible, les agents ne peuvent plus lire les specs.

---

## 5. Modèle de données (conceptuel)

**D-005 🟡** Séparation Spec / Change (inspirée d'OpenSpec, adaptée au *brownfield* Xotis).
**D-006 🟡** Le Change contient l'ensemble du cycle Spec Kit.

```
Projet (Socle, Media, Studio…)
 ├─ Constitution (hérite éventuellement du Socle)
 ├─ Spec ──────────── Révisions
 └─ Change ────────── Révisions, Commentaires, Liens
     ├─ Proposal (pourquoi / quoi, registre d'hypothèses H1, H2…)
     ├─ Deltas → Spec(s) impactée(s)
     │    └─ AC (AC-1, AC-2… en Given/When/Then)
     ├─ Plan
     ├─ Tasks
     └─ Recette
          └─ Scénario (lié à 1..n AC) → Campagne (par env.) → Résultat → Anomalie
```

**Liens entre Changes** : « bloque », « dépend de », « lié à ».
**Archivage** : à l'archivage d'un Change livré, ses deltas sont fusionnés dans les Specs concernées.

---

## 5 bis. Les natures de travail : nouveauté, bug, modification

Régie reprend la règle déjà écrite dans `platform/conventions-specs.md` (§1 bis), pas encore pratiquée faute de spec livrée à reprendre. **Une question décide de tout : le comportement attendu est-il déjà décrit ?**

| Nature | Quand | Ce qui se crée dans Régie | Validation | Exemple |
|---|---|---|---|---|
| **Évolution** | Comportement jamais décrit | Nouvelle spec de changement | Métier (Gate 1) + parcours complet | Nouvelle brique : organismes du dossier de paie |
| **Modification** | Le comportement décrit **change** | Nouvelle spec qui **cite** la spec modifiée et ne décrit que la différence | Métier (Gate 1) + parcours complet | « Rendre le paramétrage société plus intuitif » → modifie la 004 |
| **Correction** | Le code **s'écarte** de ce qui est décrit | Fiche de correction **rattachée à la spec livrée** | Un dev confirme l'écart ; pas de revalidation métier | « Le bouton Enregistrer reste actif sans modification » (écart à la 004) |
| **Rattrapage** | Code construit avant le dépôt de specs, rien n'est décrit | Courte spec de l'attendu, puis la correction s'y rattache | Métier, sauf si l'attendu découle d'une norme | Bug sur un écran développé avant Spec Kit |

**Le piège** : un « bug » dont la cause est la spec elle-même (règle fausse ou incomplète) n'est pas une correction. Il est **requalifié en modification**, sinon on change le métier sans son accord. Le lead technique arbitre.

**Une spec livrée ne se rouvre jamais.** Elle reste la trace de ce qui a été livré ; l'état courant vit dans le référentiel (`domain/<app>/`), mis à jour à chaque livraison.

### Ce que Régie apporte par rapport aux fichiers

- **D-066 🟡** Un bouton unique « Signaler » : la personne décrit le problème, Régie pose la question décisive, propose la nature et la spec concernée (recherche dans le référentiel). Le métier n'a pas à connaître les règles.
- **D-067 🟡** Anomalie de recette (avant livraison, module xotis-recette) et correction (après livraison) = **même fiche**, même cycle de statuts, rattachée à la spec.
- Les liens « modifie » / « modifiée par » et « corrige » sont créés **automatiquement**, au lieu d'être tenus à la main dans le front-matter.
- Vues par application et par nature : « toutes les corrections ouvertes sur MyXotis Paie », « les modifications en attente de validation ».
- **D-068 🟡** À la livraison, l'archivage est bloqué tant que le report dans le référentiel n'est pas validé : c'est l'étape la plus souvent oubliée.

---

## 5 ter. Organisation : espaces et modules

**Constat (2026-10-21)** : le dépôt numérote à la suite des specs du socle, du front, du back, de la RFE et des outils internes ; Media, Studio et les autres produits vont s'ajouter. La liste devient illisible.

- **D-069 🟡** Deux niveaux **métier** :

```
Espace (produit ou socle)      Module (domaine fonctionnel)      Specs
─────────────────────────      ────────────────────────────      ─────────────────────────
Socle                    →     Gestion des droits          →     specs de changement + page de référentiel
                               Organisations et sociétés
                               Mandats
Paie                     →     Paramétrage société
                               Organismes
                               Déclaratif
RFE                      →     Parcours de souscription
Media, Studio, …         →     (à venir)
Outils internes          →     Recette (xotis-recette), Régie
```

  Chaque module a **une** page de référentiel (l'état actuel) et la liste de ses specs de changement (l'historique). Le board se filtre par espace et par module.
- **D-070 🟡** Front, back, admin, API sont des **composants impactés**, pas des rangements : la plupart des évolutions traversent plusieurs couches.
- **D-071 🟡** Identifiants lisibles par espace (`SOC-12`, `PAIE-4`, `OUT-2`) ; les numéros actuels (001 à 009) sont conservés comme alias à l'import.
- **D-072 🟡** Court terme, dans le dépôt actuel : ajouter `espace:` et `module:` au front-matter, sans déplacer de dossiers (les scripts Spec Kit supposent une racine unique).

---

## 5 quater. Proposition d'organisation d'ensemble (Claude, 2026-10-21)

*Réponse à la demande d'Alexandre : « comment toi tu ferais ? ». Proposition à challenger ; tout est en 🟡.*

### Trois couches de connaissance (D-074)

```
EXISTANT (legacy)              RÉFÉRENTIEL (cible)                 SPECS (changements)
« ce que fait l'ancien »       « ce que fait la plateforme »       « ce qu'on change »
─────────────────────          ───────────────────────────         ──────────────────────
par logiciel PC SOFT           par domaine → module                rattachée à 1 module
Studio, Louma, Peplum,         Socle, Paie, Compta,                nature : reprise, évolution,
Media, Facto…                  Facturation…                        modification, correction
écrit par devs et PO legacy    maintenu vivant                     meurt à la livraison
figé une fois capturé          mis à jour à chaque livraison       → report dans le référentiel
        │                               ▲                                   │
        └──── reprise (cite) ───────────┼───────────────────────────────────┘
                                        └──── archivage ─────────────────────
```

### Les espaces = domaines de la plateforme cible (D-073)

La migration converge plusieurs logiciels vers **une** plateforme et **une** API (cf. `knowledge/legacy-pcsoft.md` : règles de calcul dupliquées entre logiciels). Ranger le futur par logiciel legacy recréerait ces doublons. Les logiciels legacy restent un axe de **provenance** (couche Existant), pas de rangement.

### La reprise, une nature à part entière (D-075)

C'est le cœur du travail actuel (« distiller l'existant ») et il n'a pas de forme dédiée aujourd'hui. Une spec de reprise :
- cite les notes de l'Existant qu'elle reprend ;
- contient un **tableau des écarts assumés** : ce qu'on **garde**, **corrige**, **ajoute**, **abandonne**, et ce que la nouvelle stack change (web, monoclient, multi-tenant) ;
- est validée par le métier sur ce tableau en priorité : c'est là que se prennent les vraies décisions.

### Des specs de taille humaine (D-076)

Constat : certaines specs dépassent 100 Ko (spec 005). Un PO ne peut pas valider sérieusement un tel document. Règle proposée : une spec = un module × une intention, validable en 20 minutes environ. Un gros sujet devient un **chantier** qui regroupe plusieurs specs et suit leur avancement.

### La carte de la reprise (D-077)

Chaque note de l'Existant porte un statut : à traiter, en reprise, reprise, abandonnée volontairement. Le tableau de bord montre la **parité** par logiciel legacy et par domaine : c'est l'indicateur de pilotage d'une migration.

---

## 6. Cycle de vie et workflow

**D-008 🟡** Un seul workflow, codé en dur.
**D-007 🟡** Deux axes indépendants.

### Axe 1 : statut du Change (piloté par les humains)

```
Brouillon → En revue ─[Gate 1 · Fonctionnel · PO]→ Conception
→ ─[Gate 2 · Technique · Lead tech]→ En développement → En recette
→ ─[Gate 3 · Recette · Recetteur]→ Recetté → Livré → Archivé
```

**Transitions retour (D-032 🟡)**, déclenchées depuis « En recette » après le triage des anomalies :

```
En recette ──🐛──► En développement ──► En recette (tour suivant)
En recette ──📝──► En revue ──[Gate 1, nouvelle révision]──► … ──► En recette
En recette ──➕──► (le Change continue) + nouveau Change « découle de »
```

### Axe 2 : état de livraison (lecture seule, déduit de GitLab)

`—` → `develop` → `preprod` → `prod`

### Correspondance avec le pipeline d'agents

| Étape | Agent | Gate |
|---|---|---|
| Proposal + deltas + AC | Helix | Gate 1 |
| Plan | Kepler | Gate 2 |
| Tasks + implémentation | Nova / Orion | MR GitLab |
| Scénarios de recette | Pulse | Gate 3 |
| Fusion des deltas | Archiv | Archivage |

### Niveaux de cérémonie (D-023 🟡)

| Niveau | Contenu minimal | Gates |
|---|---|---|
| **Correctif** | Proposal courte + AC | Gate 3 |
| **Évolution** | Change complet | Gates 1, 2, 3 |
| **Nouveau module** | Change complet + plan détaillé + ADR | Gates 1, 2, 3 |

---

## 7. Utilisateurs, rôles et sécurité

- **D-003 ✅** PO, recetteurs et autres non-devs utilisent Régie sans compte git.
- ~~**D-012** Auth0, organisation interne dédiée, MFA obligatoire.~~ 🔁 Remplacée par D-027 (2026-10-21).
- **D-027 ✅** Régie s'appuie sur **un serveur d'autorisation OAuth2 auto-hébergé**. **Contrainte : aucune solution d'auth payante** (Auth0, Okta, Clerk… exclus). Les briques open source gratuites (bibliothèque ou IdP auto-hébergé) sont autorisées.
- **D-028 🟡** Exigences minimales du serveur d'auth :
  - **OAuth 2.1** : Authorization Code + **PKCE obligatoire**, pas de flow implicite ni de password grant ;
  - **OpenID Connect** pour l'identité (`id_token`, `/userinfo`) ;
  - compatibilité **MCP** : métadonnées de découverte (*Authorization Server Metadata*, *Protected Resource Metadata*), audience des tokens limitée au serveur MCP. Prévoir l'enregistrement de clients (dynamique ou pré-enregistré) pour Claude Code et les autres clients MCP ;
  - tokens d'accès courts, refresh tokens avec rotation, révocation ;
  - journal d'audit des connexions et des émissions de tokens.
- **D-029 🟡** MFA obligatoire pour tous les comptes : **passkeys (WebAuthn)** en méthode principale, **TOTP** en secours, codes de récupération.
- Voir **Q-008** pour le mode d'implémentation.
- **D-013 🟡** RBAC **par projet** :

| Rôle | Capacités principales |
|---|---|
| Admin | Gestion des projets, membres, constitutions |
| PO | Rédaction, **Gate 1** |
| Lead tech | **Gate 2** |
| Dev | Plan, tasks, commentaires |
| Recetteur | Scénarios, campagnes, **Gate 3** |
| Lecteur | Consultation |

- **D-063 ✅** Les rôles sont **cumulables**, y compris sur un même projet. Les droits d'un utilisateur sont l'union de ses rôles.
  *Conséquence* : une même personne peut rédiger une évolution et détenir le rôle qui la valide. Le garde-fou « on ne valide pas un gate sur une évolution dont on est l'auteur » devient important (cf. Q-022).
- **D-009 🟡** Les transitions de gate sont **refusées côté serveur** à tout token d'agent.
- **D-014 🟡** Délégation : l'historique affiche l'action sous la forme « Helix, pour le compte d'Alexandre ».
- **Garde-fou proposé** : on ne valide pas un gate sur un Change dont on est l'auteur.

---

## 8. Intégration GitLab

- **D-015 🟡** GitLab garde **repos, MR, revue, CI/CD, environnements et déploiements**. Issues, epics et boards GitLab ne sont pas utilisés pour les projets suivis dans Régie, selon la règle **un seul endroit pour suivre le travail**.
- **D-016 🟡** `CHG-042` dans le nom de branche, `CHG-042@r3` dans la MR (révision implémentée).
- **D-017 🟡** Webhooks : MR mergée, pipeline, deployment → mise à jour de l'état de livraison et de la liste des MR liées.
- **D-018 🟡** Adapter GitLab : Régie reste fonctionnelle si GitLab est indisponible ou change.
- **D-025 🟡** Préfixe `CHG`, plus explicite que `SEQ` pour un dev qui lit un nom de branche.

---

## 9. Agents IA, MCP et skill

- **D-004 ✅** Le skill `regie-spec` + le serveur MCP `regie` remplacent le workflow fichier de Spec Kit.
- **D-020 🟡** **Le skill guide, l'API garantit** : schéma, format des AC, transitions autorisées et immutabilité des Specs validées sont contrôlés côté serveur.
- **D-019 🟡** Outils MCP métier (liste indicative) :
  - `propose_change`, `add_delta`, `add_acceptance_criterion`
  - `write_plan`, `write_tasks`
  - `create_scenario`, `record_result`
  - `request_review`, `comment`
  - `get_change_context` : un seul appel qui renvoie constitution, Specs impactées, Change complet et statut
- **D-021 🟡** Resources MCP : templates et constitutions (versionnés en BDD). Prompts MCP : `/propose`, `/plan`, `/tasks`, `/scenarios`.
- Le skill reste **léger** : méthode, questions à poser, réflexes qualité.
- Intégration au pipeline existant : `implement-feature` lit le Change et vérifie le statut via l'API au lieu de lire des fichiers.

---

## 10. Module Recette

> **D-064 ✅ (2026-10-21)** — Le module de recette de Régie reprend les specs de **xotis-recette** : `specs/007-application-recette-humaine/` et ADR-0008 à ADR-0010 du dépôt `workspace/specs`. Elles font référence : campagnes, points à vérifier déposés par Pulse, verdicts par testeur désigné, retours (🆕 🛠️ ❓ 🧪 ✅ ➖), questions et anomalies, issues GitLab, état de recette lu au passage `preprod → main`. Les propositions ci-dessous (D-022, D-031 à D-036) sont **remplacées** et conservées pour trace ; D-030 reste valable.

- **D-022 🟡** Chaque AC doit être couvert par au moins un scénario.
- Les scénarios sont au format Given / When / Then, ce qui permet de réutiliser **la même phrase** dans la spec, le test automatisé et la recette manuelle.
- Une campagne correspond à un ensemble de scénarios exécutés sur un environnement (preprod…).
- Un résultat est OK, KO ou Bloqué. Un KO crée une anomalie liée au Change.
- Indicateurs : % d'AC couverts, % d'AC passés, anomalies ouvertes.

### Gestion des anomalies

- **D-030 🟡** Pendant la recette, la Spec vivante n'est pas modifiée. Tout se passe sur le Change.
- **D-031 🟡** Chaque anomalie est **triée** (par le PO, avec une qualification éventuellement proposée par Pulse) :

| Type | Définition | Conséquence |
|---|---|---|
| 🐛 Implémentation | Le code ne respecte pas un AC | Change renvoyé en développement |
| 📝 Spec | AC faux, ambigu ou manquant | Change renvoyé en revue → nouvelle révision → Gate 1 rejoué sur les deltas modifiés |
| ➕ Hors périmètre | Demande nouvelle non prévue | Nouveau Change lié « découle de » ; le Change courant n'est pas bloqué |

  Sévérité : **bloquante** ou **mineure**.

- **D-033 🟡** Cycle de vie d'une anomalie :
  ```
  Ouverte → Qualifiée → En correction → À vérifier → Vérifiée ✅
                                                  └──► Rouverte 🔁
  ```
  Seul le **recetteur** peut passer une anomalie en « Vérifiée », après avoir rejoué le scénario.
- **Rattachements** d'une anomalie : scénario, AC, révision du Change, environnement, build déployé (via les webhooks GitLab).
- **Convention** : MR de correction nommée `CHG-042 ANO-007`.
- **D-034 🟡** Recette par **tours** : chaque tour est une nouvelle campagne (KO + bloqués + non-régression ciblée). L'historique des tours est conservé.
- **D-035 🟡** Correction d'une anomalie 🐛 = d'abord un **test automatisé qui reproduit le bug**, puis le correctif.
- **D-036 🟡** Gate 3 **« avec réserves »** : les anomalies mineures restantes sont converties en Changes de niveau correctif.
- **Indicateur qualité** : répartition des anomalies par type. Beaucoup de 📝 signale un problème en amont (qualité des specs, Gate 1).

---

## 10 bis. Feedbacks utilisateurs

**Existant** : Admin Xotis et MyXotis comportent déjà un système de remontée de feedback.

- **D-037 🟡** Ces feedbacks sont transmis à Régie (API ou webhook entrant, cf. Q-012) et arrivent dans une **boîte de réception Feedbacks**, consultable par les rôles habilités.
- **Données conservées** : produit d'origine, client / tenant, auteur, date, version ou environnement du produit, contenu, pièces jointes éventuelles.
- **D-038 🟡** Cycle de vie d'un feedback :
  ```
  Nouveau → Lu → Converti en Change (nouveau CHG lié « motivé par »)
               → Rattaché à un Change existant
               → Classé (motif : doublon, non retenu, déjà prévu…)
  ```
- **D-039 🟡** Un Change affiche les feedbacks qui l'ont motivé (et leur nombre, qui sert d'indicateur de priorité). À la livraison en prod, les feedbacks liés passent en **Traité**.
- **Apport des agents** (piste) : Helix peut regrouper les feedbacks similaires et rédiger un brouillon de proposal à partir d'un ensemble de feedbacks. La décision de convertir reste humaine.
- **Pistes ultérieures** : informer l'utilisateur d'origine que son retour a été pris en compte ; indicateurs « feedbacks reçus / traités » par produit dans le dashboard.

---

## 10 ter. Incidents

**D-040 🟡** Gestion des incidents de production selon une méthode par phases, inspirée de Spec Kit, chacune avec un livrable clair. Elle s'appuie sur les pratiques SRE (atténuer d'abord, sévérité, post-mortem blameless).

### Flow

```
/declare ──► /investigate ──► /mitigate ──► /remediate ──► /close
Déclaré      En investigation  Atténué       En correction   Résolu → Clos
                  │           [Gate humain] [Gate humain]        │
                  │                                              └─► Post-mortem (SEV1/SEV2)
                  └─► Escaladé (possible à toute étape)
```

### Phases

| Phase | Livrable | Acteurs |
|---|---|---|
| **Declare** | Fiche incident : symptômes, produit, impact (clients concernés, volume), heure de début, **sévérité** (D-042), source (alerte, support, feedback) | Humain, aidé d'un agent |
| **Investigate** | Chronologie, **registre d'hypothèses** (H1, H2…), preuves (logs, métriques, déploiements), cause + **niveau de confiance** (D-043) | Agent en lecture seule + humain |
| **Mitigate** | Action d'atténuation décrite → **gate humain** → exécution → vérification du rétablissement (D-041) | Humain |
| **Remediate** | **Change « correctif urgent »** lié à l'incident (D-044), test reproduisant le bug d'abord (cf. D-035) | Pipeline habituel |
| **Close / Escalade** | Clôture après vérification (monitoring stable). Escalade : dossier complet transmis au niveau supérieur ou à un tiers | Humain |
| **Post-mortem** | Analyse blameless, actions converties en Changes (D-047) | Équipe |

### Sévérités (D-042, à affiner, cf. Q-018)

| Niveau | Exemple | Réaction attendue |
|---|---|---|
| SEV1 | Service indisponible pour tous les clients | Immédiate, notification de toute l'équipe concernée |
| SEV2 | Fonction majeure dégradée ou indisponible pour une partie des clients | Rapide |
| SEV3 | Dysfonctionnement avec contournement possible | Planifiée |
| SEV4 | Défaut mineur | Backlog |

### Atouts propres à Régie

- **D-045 🟡** Dès la déclaration, Régie liste **les Changes déployés en prod avant le début de l'incident**, grâce aux webhooks GitLab.
- **D-047 🟡** Boucle d'apprentissage : un incident qui révèle un cas non prévu donne un Change qui **ajoute un AC** à la spec vivante.
- **D-048 🟡** Conversion d'un ou plusieurs feedbacks en incident (ex. plusieurs retours « connexion impossible » en peu de temps).

### Garde-fous

- **D-046 🟡** Les agents ont un accès **en lecture seule** aux sources de prod. Aucune action sur la prod sans gate humain.
- Les données personnelles présentes dans les logs ne sont pas recopiées dans les fiches incident (cf. Q-013).

### Indicateurs (dashboard)

Nombre d'incidents par sévérité et par produit, temps de détection, **temps d'atténuation**, temps de résolution, part des incidents liés à un déploiement récent.

---

## 11. Interface

- **Board** kanban par statut, **Liste** filtrable, **palette de commandes** (⌘K).
- **Page Change** : un en-tête qui présente le frontmatter sous forme de champs éditables (statut, assigné, projet, priorité, révision, liens, état de livraison), puis des onglets *Proposal · Deltas · Plan · Tasks · Recette · Activité*. Les actions de gate sont en haut à droite.
- **Page Spec** : une lecture façon documentation, avec l'historique des Changes qui l'ont modifiée.
- **Lecteur markdown** et **espace commentaires** sur chaque Change.
- **Inbox** : mentions, assignations, gates en attente, recettes KO.
- **Dashboard** : répartition par statut et par projet, débit, lead time, couverture de recette, anomalies.
- **D-024 🟡** Identité cinéma (nom, onboarding, messages), libellés fonctionnels dans l'UI.
- **D-062 ✅** **Charte neutre et efficace**, distincte de la charte Xotis : palette sobre, une seule couleur d'accent, typographie système ou très lisible, densité adaptée à un outil de travail. Les maquettes du 2026-10-21 (charte Xotis) sont à reprendre.
- **Navigation** : jugée peu claire sur les premières maquettes, à retravailler (cf. Q-023).

---

## 12. Hors périmètre (volontairement)

- Sprints, story points, suivi du temps
- Champs personnalisés, workflow configurable
- Synchronisation bidirectionnelle avec git
- Édition collaborative temps réel (V1 : markdown + aperçu)

---

## 12 bis. Organisation et pilotage du projet

*Issu de la session de challenge du 2026-10-21.*

### Contexte
- Ressources : **1 à 2 jours par semaine**, **Alexandre seul**, assisté d'agents IA.
- Statut : **intérêt oral** de la hiérarchie, pas encore d'engagement formel.
- **D-049 ✅** Jira est quasiment abandonné : Régie prend sa place sans migration.
- **D-050 ✅** Obsidian : reprise manuelle des specs utiles uniquement.
- **D-051 ✅** Utilisateurs dès la V0 : devs, Lorrain, PO / produit, recette / support. *Conséquence : la V0 doit servir les gates 1 et 3, pas seulement les devs.*

### Obtenir le go
- **D-052 ✅** Pitch d'une page + maquettes cliquables + demande explicite de temps dédié, **avant d'écrire du code**. Le pitch présente la vision complète ; la V0 construite peut rester réduite (cf. Q-020).

### Construction déléguée aux agents
- **D-053 ✅** Le code de Régie est produit par des agents IA (pipeline Helix → Kepler → Nova / Orion → Pulse / Atlas). Alexandre pilote et reste sur MyXotis.
- **D-054 ✅** Curseur d'autonomie **mixte** :

| Zone | Règle |
|---|---|
| Specs et plans | Gate humain systématique |
| Auth, permissions, gates, MCP | MR relue par un humain, pas d'auto-merge |
| Reste (UI, CRUD, affichage) | Auto-merge autorisé si la CI est verte |

- **D-055 ✅** Bootstrap : les specs de Régie sont rédigées en **Spec Kit dans le repo de Régie** jusqu'à la V0, puis importées dans Régie, qui devient son propre outil de suivi.
- **D-056 ✅** `AGENTS.md` (repo) et `REGIE.md` (ce document) toujours à jour, pour qu'un humain ou un agent puisse reprendre le projet sans Alexandre.
- **D-057 🟡** Application **web**. Stack identique à MyXotis (NestJS, Prisma, PostgreSQL) et front identique à Admin Xotis : reprise facilitée par n'importe quel dev Xotis, et meilleure fiabilité des agents sur une stack courante et déjà documentée.

### Calendrier et POC
- **D-058 ✅** Pitch + maquettes prêts **avant le week-end du 24-25 octobre 2026**. Objectif : obtenir un go pour une implémentation test pendant ce week-end.
- **D-061 ✅** Supports : doc de pitch d'une page + maquettes cliquables (board, page Change, action de gate, recette) aux couleurs du design system Xotis.
- **D-059 ✅** Périmètre du POC :

| Priorité | Ce qui doit marcher dimanche soir |
|---|---|
| **1. Boucle Change** | Un agent crée un Change via MCP → il apparaît au board → un humain le fait passer un gate dans l'UI → le statut est à jour pour tous |
| **2. Recette intégrée** (si le temps le permet) | AC → scénario → résultat KO → anomalie rattachée au Change |

  Hors POC : specs vivantes et deltas, incidents, feedbacks, dashboard, OAuth complet (login simple suffisant pour le POC).
- **D-060 ✅** Après le POC : **~1 jour par semaine** de pilotage (gates, relecture des MR sensibles, recette de Régie), demandé explicitement dans le pitch.

### Points de vigilance relevés
- Déléguer le code ne supprime pas le temps humain : gates, relecture des MR sensibles et recette de Régie restent à la charge d'un humain (cf. Q-021).
- La V0 complète (6 à 9 mois estimés à 1,5 jour par semaine) est en tension avec les moyens disponibles (cf. Q-020).

---

## 13. Roadmap

| Version | Contenu |
|---|---|
| **V0 — Dogfooding** | Auth, projets, Changes, statuts + gates, commentaires, MCP minimal. *Le premier Change de Régie est rédigé dans Régie.* |
| **V1** | Specs vivantes + deltas + archivage, révisions + diff, liens, skill complet, Board et Liste |
| **V2** | Module recette, Inbox et notifications, webhooks GitLab |
| **V3** | Dashboard, export markdown, notifications externes |

---

## 14. Questions ouvertes

| ID | Question | Notes |
|---|---|---|
| Q-001 | Modèle Spec / Change / delta : validation et retour de **Lorrain** | Conditionne D-005 et tout le modèle de données |
| Q-002 | Licence GitLab Xotis (Free / Premium / Ultimate) et hébergement (self-managed / gitlab.com) ? | Impacte D-017 et l'évaluation de D-026 |
| Q-003 | Évaluer GitLab Planning (requirements, test cases, statuts personnalisés) pour objectiver D-026 | Une demi-journée d'essai |
| Q-004 | Canaux de notification externes : email, Teams, Slack ? | V3 |
| Q-005 | Univers de nommage des agents : garder le cosmique ou harmoniser avec le cinéma ? | Non bloquant |
| Q-006 | Plan et tasks : un dev a-t-il besoin d'une copie locale dans sa branche ? | Lié à D-006 |
| ~~Q-007~~ | ~~Stack technique de Régie~~ | ✔️ Résolue (2026-10-22) : cf. D-078 |
| Q-008 | Implémentation du serveur OAuth2 (D-027) : **(A)** bibliothèque certifiée OpenID intégrée à l'app (ex. `oidc-provider`), ou **(B)** IdP open source auto-hébergé (Keycloak, Zitadel…) ? From scratch écarté. | (A) = maîtrise totale et une seule app, mais MFA/passkeys/récupération de compte à coder. (B) = MFA, passkeys, admin et anti-bruteforce prêts à l'emploi, mais un service de plus à opérer. Lié à D-028 |
| Q-010 | Qui trie les anomalies : le PO seul, ou le PO + le lead tech (utile pour distinguer 🐛 de 📝) ? | Lié à D-031 |
| Q-011 | Qui peut valider un Gate 3 « avec réserves » : le recetteur seul, ou avec l'accord du PO ? | Lié à D-036 |
| Q-012 | Fonctionnement actuel des feedbacks Admin Xotis / MyXotis (stockage, format, API existante ?) et mode de transmission vers Régie : push (webhook) ou pull (import) ? | Lié à D-037 |
| Q-013 | Données personnelles des clients dans les feedbacks (RGPD) : qui y a accès dans Régie, durée de conservation, anonymisation ? | Lié à D-037 |
| Q-014 | Position du module Feedbacks dans la roadmap (V2 ou V3) | Lié à D-037 |
| Q-015 | Outils d'observabilité actuels (logs, métriques, erreurs : Sentry, Grafana, autre ?) et disponibilité d'un accès MCP en lecture seule | Conditionne la phase Investigate (D-043, D-046) |
| Q-016 | Qui peut déclarer un incident ? Existe-t-il une astreinte, et qui joue le rôle de responsable d'incident ? | Lié à D-040 |
| Q-017 | Vers qui escalade-t-on (niveau supérieur interne, hébergeur Jotelulu, prestataires tiers…) ? | Lié à D-040 |
| Q-018 | Définition précise des sévérités SEV1–SEV4 et délais de réaction attendus | Lié à D-042 |
| Q-019 | Position du module Incidents dans la roadmap | Lié à D-040 |
| Q-020 | Périmètre réel de la V0 construite : « complète » (souhait initial) ou réduite, sachant que le pitch + maquettes porte la vision complète (D-052) ? | Tension moyens / ambition. Le POC (D-059) est cadré ; la V0 qui suit reste à définir après le week-end |
| Q-022 | Rôles cumulables (D-063) : interdit-on de valider un gate sur une évolution dont on est l'auteur ? Que fait-on si la personne est seule à détenir le rôle sur le projet ? | Garde-fou proposé en §7 |
| Q-023 | Structure de la navigation : point d'entrée par utilisateur (« ma boîte »), place du projet (filtre ou contexte), place de la recette (module ou onglet) | Retours sur les maquettes du 2026-10-21 |
| Q-024 | Place du **vault Obsidian legacy** dans Régie : reste dans Obsidian, importé en lecture comme « connaissance legacy », ou migré et maintenu dans Régie ? Les agents doivent-ils y accéder via MCP ? | Remet en question D-050 (reprise manuelle ciblée) |
| Q-025 | Traçabilité **legacy → évolution** : chaque évolution référence-t-elle les notes legacy qu'elle reprend, pour suivre la couverture fonctionnelle de la migration ? | Piste de tableau de bord « parité » |
| Q-026 | Ce qui ne convient pas dans le processus actuel (Obsidian → Spec Kit → implémentation) | À expliciter avant de figer le modèle de Régie |
| Q-027 | Nom de l'espace « état actuel du produit » (specs vivantes, D-005) : « Specs » prête à confusion avec les évolutions. Pistes : Référentiel, Documentation produit | Lié à Q-023 |
| Q-028 | **Régie et xotis-recette** : les specs de 007 sont reprises (D-064). Reste à décider pour le **code** : Régie étend le dépôt xotis-recette (même stack, comptes, hébergement), l'intègre comme module externe, ou le réimplémente ? | Le MVP de xotis-recette est livré (parcours 1 à 3, 2026-10-16) |
| Q-029 | **Contradictions avec les ADR acceptés** à arbitrer : D-017 (webhooks) vs ADR-0010 (interrogation, VM sans flux entrant) ; D-015 (pas d'issues GitLab) vs ADR-0008 (anomalie → issue GitLab) ; D-027/D-028 (OAuth2) vs ADR-0008 (comptes locaux + clés d'agent) ; D-057 vs ADR-0009 (NestJS + Next.js, un dépôt, VM locale, précédent pour les outils internes) | Les ADR font foi tant qu'aucun nouvel ADR ne les remplace |
| Q-030 | Vocabulaire de Régie : reprendre celui du dépôt (spec de changement / spec de référence, inbox, idées) plutôt que Change / Spec vivante | Lié à Q-027 |
| ~~Q-031~~ | ~~Nature du « mélange » des specs~~ | ✔️ Résolue (2026-10-21) : mélange des produits et des couches (socle, front, back, RFE, puis Media, Studio…). Cf. §5 ter |
| Q-032 | Liste des **espaces** et de leurs **modules** (produits, socle, outils internes) | Conditionne D-069 et la navigation (Q-023) |
| ~~Q-021~~ | ~~Temps de supervision récurrent~~ | ✔️ Résolue (2026-10-21) : ~1 jour par semaine, cf. D-060 |
| ~~Q-009~~ | ~~Motivation du choix D-027~~ | ✔️ Résolue (2026-10-21) : **contrainte de coût**, pas de solution d'auth payante |

---

## 15. Journal des modifications

| Date | Version | Modification |
|---|---|---|
| 2026-10-21 | 0.1 | Création du document. Décisions D-001 à D-026, questions Q-001 à Q-007. |
| 2026-10-21 | 0.2 | D-012 (Auth0) remplacée par D-027 ✅ (serveur OAuth2 propre). Ajout de D-028, D-029, Q-008, Q-009. |
| 2026-10-21 | 0.3 | D-027 précisée : contrainte « aucune auth payante », briques open source autorisées. Q-009 résolue. Q-008 recentrée sur deux options. |
| 2026-10-21 | 0.4 | Gestion des anomalies de recette : D-030 à D-036, transitions retour (§6), Q-010, Q-011. |
| 2026-10-21 | 0.5 | Remontée des feedbacks Admin Xotis / MyXotis : §10 bis, D-037 à D-039, Q-012 à Q-014, terme « Feedback » au glossaire. |
| 2026-10-21 | 0.6 | Module Incidents : §10 ter, D-040 à D-048, Q-015 à Q-019, termes « Incident », « Atténuation », « Post-mortem » au glossaire. |
| 2026-10-21 | 0.7 | Session de challenge (bloc 1, moyens et organisation) : §12 bis, D-049 à D-057, Q-020, Q-021. Q-008 maintenue ouverte. |
| 2026-10-21 | 0.8 | Session de challenge (bloc 2, calendrier et POC) : D-058 à D-061, Q-021 résolue, Q-020 précisée. Document déplacé dans `Documents\lab\regie`. |
| 2026-10-21 | 0.9 | D-062 (charte neutre, pas de charte Xotis) et D-063 (rôles cumulables) actées. Q-022, Q-023. |
| 2026-10-21 | 0.10 | Ajout du processus actuel de l'équipe (vault Obsidian legacy → specs Spec Kit → implémentation, non définitif). Q-024 à Q-027. |
| 2026-10-21 | 0.11 | Lecture du dépôt `workspace/specs` : existant documenté (§1), découverte de xotis-recette (spec 007, ADR-0008 à 0010). Q-028 à Q-030. |
| 2026-10-21 | 0.12 | D-064 actée : les specs de xotis-recette (007) deviennent la base du module de recette. D-022, D-031 à D-036 remplacées. Q-028 précisée. |
| 2026-10-21 | 0.13 | Natures de travail (évolution, modification, correction, rattrapage) : §5 bis, D-065 à D-068, Q-031. |
| 2026-10-21 | 0.14 | Organisation par espaces et modules : §5 ter, D-069 à D-072. Q-031 résolue, Q-032. |
| 2026-10-21 | 0.15 | Proposition d'organisation d'ensemble : §5 quater, D-073 à D-077. |
| 2026-10-22 | 0.16 | Démarrage du développement du POC : D-078 (stack), D-079 (auth du POC), D-080 (libellé « Évolution » + ID par espace), D-081 (MCP dans l'API Nest). Q-007 résolue. |
| 2026-10-22 | 0.17 | Noyau d'auth livré (D-079) : jetons, sessions, verrouillage, CSRF. Ajout de D-082 (pas d'inscription publique). |
| 2026-10-22 | 0.18 | Domaine livré côté API (phase 4) : espaces, membres, évolutions, workflow, gates, révisions, commentaires, historique. Ajout de D-083 à D-085. |
| 2026-10-22 | 0.19 | UI de la boucle Change (phase 5) : Ma boîte (gates à valider, assignations), board et liste filtrables, page évolution (Proposal · Plan · Tasks · Discussion · Historique), actions de gate. Q-023 : point d'entrée « Ma boîte », projet = filtre. |
