"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "./query-provider";

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
          <Toaster position="bottom-right" richColors={false} closeButton />
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
