import { create } from "zustand";

// État UI de la modale « Nouvelle évolution » : ouverte depuis la page Évolutions
// et depuis la palette de commandes (⌘K), montée une seule fois dans le layout.

interface CreateChangeState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

/** Store de la modale de création d'évolution. */
export const useCreateChangeStore = create<CreateChangeState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
