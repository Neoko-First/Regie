import { APP_NAME } from "@regie/shared";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
    // Couleurs du fond (--background) en clair et en sombre, cf. app/globals.css
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#16171c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning : next-themes ajoute la classe du thème avant l'hydratation
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
