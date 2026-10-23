import { toast } from "sonner";

// Toasts d'erreur centralisés (design system, composant Toast) : un succès disparaît seul
// après 5 s (réglage du <Toaster />), une erreur reste affichée jusqu'à sa fermeture,
// pour que l'utilisateur ait le temps de la lire.

/**
 * Affiche une erreur lisible, qui reste visible jusqu'à ce que l'utilisateur la ferme.
 *
 * @param message - Ce qui s'est passé et comment corriger (jamais une erreur technique brute)
 * @example notifyError("Impossible de joindre le serveur. Vérifiez votre connexion.")
 */
export function notifyError(message: string): void {
  toast.error(message, { duration: Number.POSITIVE_INFINITY });
}
