import { z } from "../zod";

// Politique de mot de passe (CLAUDE.md §12.2), définie UNE SEULE FOIS et appliquée
// dans l'UI (indicateur et validation du formulaire) ET dans l'API (DTO).

/** Longueur minimale d'un mot de passe. */
export const PASSWORD_MIN_LENGTH = 12;

/** Longueur maximale : borne le coût du hachage argon2 (protection contre les abus). */
export const PASSWORD_MAX_LENGTH = 128;

/** Critère de la politique de mot de passe, affiché dans la checklist de l'UI. */
export interface PasswordRule {
  id: "length" | "lowercase" | "uppercase" | "digit" | "special";
  /** Libellé du critère, ex. « 12 caractères minimum » */
  label: string;
  /** Message d'erreur si le critère n'est pas respecté */
  message: string;
  test: (password: string) => boolean;
}

/**
 * Critères du mot de passe, dans l'ordre d'affichage.
 * L'UI les coche au fur et à mesure de la saisie ; le schéma Zod les vérifie tous.
 */
export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: "length",
    label: `${PASSWORD_MIN_LENGTH} caractères minimum`,
    message: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "lowercase",
    label: "Une lettre minuscule",
    message: "Le mot de passe doit contenir au moins une lettre minuscule.",
    test: (password) => /\p{Ll}/u.test(password),
  },
  {
    id: "uppercase",
    label: "Une lettre majuscule",
    message: "Le mot de passe doit contenir au moins une lettre majuscule.",
    test: (password) => /\p{Lu}/u.test(password),
  },
  {
    id: "digit",
    label: "Un chiffre",
    message: "Le mot de passe doit contenir au moins un chiffre.",
    test: (password) => /\d/.test(password),
  },
  {
    id: "special",
    label: "Un caractère spécial",
    message: "Le mot de passe doit contenir au moins un caractère spécial.",
    // Tout ce qui n'est ni lettre ni chiffre (ponctuation, symboles, espaces…)
    test: (password) => /[^\p{L}\d]/u.test(password),
  },
];

/**
 * Schéma d'un nouveau mot de passe : tous les critères de `PASSWORD_RULES`.
 * La règle « différent de l'email » se vérifie au niveau de l'objet, cf. `isPasswordDifferentFromEmail`.
 */
export const passwordSchema = PASSWORD_RULES.reduce(
  (schema, rule) => schema.refine(rule.test, { error: rule.message }),
  z.string().max(PASSWORD_MAX_LENGTH, {
    error: `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX_LENGTH} caractères.`,
  }),
);

/** Message d'erreur quand le mot de passe reprend l'adresse email. */
export const PASSWORD_EQUALS_EMAIL_MESSAGE =
  "Le mot de passe doit être différent de l'adresse email.";

/**
 * Indique si un mot de passe est différent de l'adresse email (comparaison insensible à la casse).
 *
 * @param password - Mot de passe saisi
 * @param email - Adresse email du compte
 * @returns `true` si le mot de passe est acceptable de ce point de vue
 */
export function isPasswordDifferentFromEmail(password: string, email: string): boolean {
  return password.trim().toLowerCase() !== email.trim().toLowerCase();
}

/**
 * Évalue la force d'un mot de passe pour l'indicateur de l'UI : nombre de critères respectés.
 *
 * @param password - Mot de passe saisi
 * @returns Les identifiants des critères respectés et le score (0 à `PASSWORD_RULES.length`)
 */
export function evaluatePassword(password: string): {
  passed: PasswordRule["id"][];
  score: number;
} {
  const passed = PASSWORD_RULES.filter((rule) => rule.test(password)).map((rule) => rule.id);
  return { passed, score: passed.length };
}
