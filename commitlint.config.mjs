// Conventional Commits obligatoires (feat:, fix:, chore:, refactor:…).
// Les messages sont rédigés en français : on désactive la contrainte de casse du sujet.
// Scope recommandé (monorepo) : feat(web): …, fix(api): …, chore(ci): …
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [0],
    // Avertissement seulement : un commit transverse peut se passer de scope
    "scope-enum": [1, "always", ["web", "api", "shared", "config", "ci", "deps", "docs", "repo"]],
  },
};
