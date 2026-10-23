import { APP_NAME } from "@regie/shared";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Roboto_Mono } from "next/font/google";
import { Providers } from "@/components/providers/providers";
import "./globals.css";

// Polices du design system : Plus Jakarta Sans pour tout le texte, Roboto Mono pour le code
// et les identifiants. Lora (titres de documents longs) n'est pas utilisée dans une interface.
// Polices variables : toutes les graisses (400 à 800) sont incluses sans les lister.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { template: `%s | ${APP_NAME}`, default: APP_NAME },
  description:
    "Plateforme interne Xotis : chaque évolution produit naît, se valide, se recette et se documente au même endroit.",
  applicationName: APP_NAME,
  // Outil interne : aucune indexation
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    // --background du design system en clair et en sombre (cf. app/globals.css)
    { media: "(prefers-color-scheme: light)", color: "#e7e5e4" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1b18" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning : next-themes ajoute la classe du thème avant l'hydratation
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${jakarta.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
