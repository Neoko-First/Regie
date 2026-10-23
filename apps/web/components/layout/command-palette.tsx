"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useCommandPaletteStore } from "@/stores/command-palette-store";
import { NAV_ITEMS } from "./nav-items";
import { THEME_OPTIONS } from "./theme-options";

/** Touche qui ouvre la palette, combinée avec ⌘ (macOS) ou Ctrl. */
const COMMAND_PALETTE_KEY = "k";

/**
 * Palette de commandes (⌘K / Ctrl+K) : navigation rapide et actions globales.
 * Montée une seule fois dans le layout de l'application.
 */
export function CommandPalette() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const open = useCommandPaletteStore((s) => s.open);
  const setOpen = useCommandPaletteStore((s) => s.setOpen);
  const toggle = useCommandPaletteStore((s) => s.toggle);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === COMMAND_PALETTE_KEY && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggle();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  /** Ferme la palette puis exécute l'action choisie. */
  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      {/* Avec le preset Nova, CommandDialog ne fournit pas le contexte cmdk : <Command> est requis */}
      <Command>
        <CommandInput placeholder="Rechercher une page ou une action…" />
        <CommandList>
          <CommandEmpty>Aucun résultat.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {NAV_ITEMS.map(({ href, label, description, icon: Icon }) => (
              <CommandItem
                key={href}
                value={`${label} ${description}`}
                onSelect={() => run(() => router.push(href))}
              >
                <Icon />
                <span>{label}</span>
                <span className="text-muted-foreground ml-auto truncate text-xs">
                  {description}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Thème">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <CommandItem
                key={value}
                value={`Thème ${label}`}
                onSelect={() => run(() => setTheme(value))}
              >
                <Icon />
                <span>Thème {label.toLowerCase()}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
