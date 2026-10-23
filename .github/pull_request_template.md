<!-- Titre de la PR en Conventional Commits avec scope, ex. « feat(web): ajouter le board » : il devient le message du commit squashé. -->

## Contexte

<!-- Pourquoi ce changement ? Lien vers la décision (D-XXX) ou l'évolution concernée. -->

## Changements

-

## Points d'attention pour la relecture

<!-- Risques, effets de bord, choix à valider. Auth, permissions, gates ou MCP : relecture humaine obligatoire (D-054). -->

## Vérifications

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`
- [ ] Tests e2e de l'API si l'API change (`pnpm --filter @regie/api test:e2e`)
- [ ] Vérifié dans le navigateur si l'interface change
