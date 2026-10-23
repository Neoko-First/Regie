import { z } from "zod";

// Messages d'erreur Zod en français, configurés une seule fois ici.
// Tous les workspaces doivent importer `z` depuis `@regie/shared` (et non depuis "zod")
// pour être certains que cette configuration est appliquée.
z.config(z.locales.fr());

export { z };
