"use client";

import "./globals.css";

/**
 * Erreur dans le layout racine lui-même : dernier filet de sécurité.
 * Les providers (thème, toasts) ne sont pas disponibles ici, d'où un rendu minimal.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="fr">
      <body className="bg-background text-foreground flex min-h-svh flex-col items-center justify-center gap-4 p-6 font-sans">
        <h1 className="text-lg font-semibold">Régie a rencontré un problème</h1>
        <p className="text-muted-foreground text-sm">Rechargez la page pour continuer.</p>
        <button
          type="button"
          onClick={reset}
          className="border-border hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
