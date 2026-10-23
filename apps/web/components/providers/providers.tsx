"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "./query-provider";

/** Durée d'affichage d'un toast de confirmation (design system). */
const TOAST_DURATION_MS = 5000;

/**
 * Regroupe les providers client montés une seule fois dans le layout racine :
 * thème (light / dark / system), cache TanStack Query, tooltips et toasts.
 *
 * @param props.children - Arbre de l'application
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryProvider>
        <TooltipProvider>
          {children}
          {/* 5 s par défaut (design system) ; les erreurs restent affichées, cf. lib/notify.ts */}
          <Toaster position="bottom-right" closeButton duration={TOAST_DURATION_MS} />
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
