// Conventional Commits obligatoires (feat:, fix:, chore:, refactor:…).
// Les messages sont rédigés en français : on désactive la contrainte de casse du sujet.
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [0],
  },
};
