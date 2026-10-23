import { APP_NAME } from "@regie/shared";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { EMAIL_COLORS, EMAIL_FONT_FAMILY, EMAIL_RADIUS } from "../theme";

/** Propriétés de la mise en page commune des emails. */
export interface EmailLayoutProps {
  /** Texte d'aperçu affiché par la messagerie à côté de l'objet */
  preview: string;
  title: string;
  children: ReactNode;
}

/**
 * Mise en page commune : nom de l'application, carte de contenu, pied de page.
 * Styles en ligne (seuls compris par tous les clients mail).
 */
export function EmailLayout({ preview, title, children }: EmailLayoutProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: EMAIL_COLORS.background,
          fontFamily: EMAIL_FONT_FAMILY,
          margin: 0,
          padding: "32px 16px",
        }}
      >
        <Container style={{ maxWidth: "560px", margin: "0 auto" }}>
          <Text
            style={{
              color: EMAIL_COLORS.foreground,
              fontSize: "18px",
              fontWeight: 800,
              margin: "0 0 16px",
            }}
          >
            {APP_NAME}
          </Text>
          <Section
            style={{
              backgroundColor: EMAIL_COLORS.card,
              border: `1px solid ${EMAIL_COLORS.border}`,
              borderRadius: EMAIL_RADIUS.card,
              padding: "24px",
            }}
          >
            <Heading
              as="h1"
              style={{
                color: EMAIL_COLORS.foreground,
                fontSize: "22px",
                lineHeight: "28px",
                fontWeight: 600,
                margin: "0 0 16px",
              }}
            >
              {title}
            </Heading>
            {children}
          </Section>
          <Text
            style={{ color: EMAIL_COLORS.mutedForeground, fontSize: "12px", margin: "16px 0 0" }}
          >
            Cet email a été envoyé automatiquement par {APP_NAME}, la plateforme interne Xotis.
            Merci de ne pas y répondre.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

/** Paragraphe de texte courant. */
export function EmailText({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        color: EMAIL_COLORS.foreground,
        fontSize: "16px",
        lineHeight: "26px",
        margin: "0 0 16px",
      }}
    >
      {children}
    </Text>
  );
}

/** Texte secondaire (précisions, délais). */
export function EmailNote({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        color: EMAIL_COLORS.mutedForeground,
        fontSize: "14px",
        lineHeight: "20px",
        margin: "16px 0 0",
      }}
    >
      {children}
    </Text>
  );
}

/** Bouton d'action principal (un seul par email), suivi du lien en clair. */
export function EmailAction({ href, label }: { href: string; label: string }) {
  return (
    <>
      <Button
        href={href}
        style={{
          backgroundColor: EMAIL_COLORS.primary,
          color: EMAIL_COLORS.primaryForeground,
          borderRadius: EMAIL_RADIUS.button,
          fontSize: "14px",
          fontWeight: 600,
          padding: "12px 20px",
          textDecoration: "none",
        }}
      >
        {label}
      </Button>
      <Hr style={{ borderColor: EMAIL_COLORS.border, margin: "24px 0 16px" }} />
      {/* Le lien en clair, pour les messageries qui bloquent les boutons */}
      <Text
        style={{
          color: EMAIL_COLORS.mutedForeground,
          fontSize: "12px",
          lineHeight: "18px",
          margin: 0,
        }}
      >
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur : {href}
      </Text>
    </>
  );
}
