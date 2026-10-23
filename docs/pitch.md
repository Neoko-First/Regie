# Régie — Pitch

Oct 21, 2026 · @Alexandre

## Le problème

Aujourd'hui, une évolution produit passe par plusieurs outils qui ne se parlent pas, et personne ne voit d'un coup d'œil où elle en est.

- **Les specs vivent dans Obsidian** : seuls ceux qui ont le vault y accèdent, sans workflow ni validation tracée.
- **Jira est quasiment abandonné** : il n'y a plus d'outil commun de suivi.
- **Aucun lien** entre la spec validée, le code livré dans GitLab et la recette.
- **Les agents IA codent de plus en plus, sans cadre commun** : rien ne garantit qu'ils travaillent sur une spec validée.

## La proposition : Régie

**Régie est une plateforme interne où chaque évolution d'un produit Xotis naît, se valide, se recette et se documente, avec humains et agents IA sur les mêmes objets et les mêmes règles.**

- **Une app web privée** : un compte par membre, des droits par projet (Socle, Media, Studio…), aucun compte git nécessaire.
- **La méthode spec-driven déjà en place** (Spec Kit), dans une interface façon Jira : board, statuts, assignation, commentaires.
- **Des validations humaines intégrées** : un bouton fait passer une évolution d'une étape à la suivante, et chaque validation est tracée.
- **Les agents IA connectés via MCP** : ils rédigent et préparent, les humains valident. Un agent ne peut techniquement pas valider à la place d'un humain.
- **La recette intégrée** : chaque critère d'acceptation devient un scénario, et chaque anomalie reste rattachée à l'évolution concernée.

## Comment ça marche

Une évolution avance d'étape en étape, et trois validations humaines bloquent le passage tant qu'elles ne sont pas données.

&#91;embedded content: cycle d'une évolution · 3 validations humaines\]

Les agents préparent chaque étape, les humains valident, et GitLab indique où le code est déployé. Une anomalie en recette renvoie l'évolution en développement.

## Ce que ça change pour chacun

Chaque profil gagne un accès direct à l'information dont il a besoin, sans passer par un développeur.

| Profil | Aujourd'hui | Avec Régie |
| --- | --- | --- |
| PO / produit | Specs dispersées, validation orale | Rédige et valide dans l'interface, sans git ; chaque validation est tracée |
| Développeurs | Chercher la bonne version de la spec | L'agent récupère la spec validée en un appel ; la branche porte l'identifiant de l'évolution |
| Recette / support | Scénarios et anomalies hors outil | Scénarios issus des critères d'acceptation, anomalies rattachées à l'évolution |
| Direction | Pas de vue d'ensemble | Tableau de bord : avancement par projet, couverture de recette |

## Pourquoi du sur mesure

Aucun outil existant ne relie la spec, la validation humaine, la recette et les agents IA, et le sur mesure reste peu coûteux.

| Option | Ce qui manque |
| --- | --- |
| Jira | Déjà abandonné en interne ; générique, sans lien spec → recette |
| GitLab Planning | Excellent sur le code, faible sur les specs et la recette ; interface pensée pour les développeurs |
| Plane | Bonne interface, mais ni modèle spec-driven ni module de recette |

**Un coût maîtrisé** : le développement est délégué à des agents IA, la stack est celle de MyXotis, et toutes les briques sont open source, sans licence payante, authentification comprise. GitLab garde son rôle sur le code, la CI et les déploiements.

## Le plan

On teste ce week-end, et on ne construit la V0 que si le bilan du test est bon.

&#91;embedded content: plan · 4 phases, 2 points de décision\]

Le test doit prouver une chose dimanche soir : un agent crée une évolution via MCP, et un humain la valide dans l'interface.

**Risques et parades**

- **Code produit par des agents** : relecture humaine obligatoire sur l'authentification, les droits et les validations.
- **Dépendance à une seule personne** : stack identique à MyXotis et document de référence tenu à jour.
- **Un outil de plus, peu adopté** : PO et recette impliqués dès la V0.

## Ce que je demande

Je demande un go pour un test ce week-end, puis environ un jour par semaine si le test est concluant.

1. **Un go pour l'implémentation test du week-end des 24 et 25 octobre**, sans coût de licence ni impact sur MyXotis.
2. **Si le bilan est positif : environ 1 jour par semaine de pilotage** sur temps Xotis (validations, relecture du code sensible, recette de Régie).
3. **L'implication de Lorrain** sur le modèle de specs et d'évolutions.
