import { create } from "zustand";

// État UI global de la palette de commandes (CLAUDE.md §7) : elle s'ouvre au clavier (⌘K)
// et depuis le bouton de recherche de la sidebar, deux composants sans lien de parenté.

interface CommandPaletteState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

/**
 * Store de la palette de commandes. Utiliser des sélecteurs ciblés :
 * `useCommandPaletteStore((s) => s.open)`.
 */
export const useCommandPaletteStore = create<CommandPaletteState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((state) => ({ open: !state.open })),
}));
