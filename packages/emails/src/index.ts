import { render, toPlainText } from "@react-email/render";
import { createElement, type ReactElement } from "react";
import { PasswordChangedEmail, type PasswordChangedEmailProps } from "./templates/password-changed";
import { PasswordResetEmail, type PasswordResetEmailProps } from "./templates/password-reset";
import { TestEmail, type TestEmailProps } from "./templates/test-email";

// Point d'entrée unique de @regie/emails : chaque fonction renvoie un email prêt à envoyer
// (objet, HTML et version texte). L'API ne manipule jamais les templates directement.

/** Email prêt à être envoyé. */
export interface RenderedEmail {
  subject: string;
  html: string;
  /** Version texte : affichée par les messageries sans HTML, et utile contre le spam */
  text: string;
}

/** Rend un template en HTML et en texte brut. */
async function renderEmail(subject: string, element: ReactElement): Promise<RenderedEmail> {
  const html = await render(element);
  return { subject, html, text: toPlainText(html) };
}

/**
 * Email de réinitialisation du mot de passe.
 *
 * @param props - Nom du destinataire, lien et durée de validité
 * @returns L'email rendu
 * @example await renderPasswordResetEmail({ name: "Paula", resetUrl, expiresInMinutes: 30 })
 */
export function renderPasswordResetEmail(props: PasswordResetEmailProps): Promise<RenderedEmail> {
  return renderEmail(
    "Réinitialisation de votre mot de passe Régie",
    createElement(PasswordResetEmail, props),
  );
}

/**
 * Notification de changement de mot de passe.
 *
 * @param props - Nom du destinataire, date du changement, origine (réinitialisation ou non)
 * @returns L'email rendu
 */
export function renderPasswordChangedEmail(
  props: PasswordChangedEmailProps,
): Promise<RenderedEmail> {
  return renderEmail(
    "Votre mot de passe Régie a été modifié",
    createElement(PasswordChangedEmail, props),
  );
}

/**
 * Email de test de la configuration d'envoi (administration).
 *
 * @param props - Nom du destinataire et moyen d'envoi utilisé
 * @returns L'email rendu
 */
export function renderTestEmail(props: TestEmailProps): Promise<RenderedEmail> {
  return renderEmail("Test d'envoi d'email depuis Régie", createElement(TestEmail, props));
}

export type { PasswordChangedEmailProps, PasswordResetEmailProps, TestEmailProps };
