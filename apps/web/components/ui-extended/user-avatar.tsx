import type { UserSummary } from "@regie/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/** Nombre de lettres affichées dans l'avatar. */
const INITIALS_LENGTH = 2;

/**
 * Initiales d'un nom, pour l'avatar.
 *
 * @param name - Nom complet
 * @returns Les initiales en majuscules
 * @example initials("Paula Ordonneau") // "PO"
 */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, INITIALS_LENGTH)
    .toUpperCase();
}

/**
 * Avatar d'un utilisateur (initiales), avec son nom pour les lecteurs d'écran.
 *
 * @param props.user - Utilisateur affiché
 * @param props.className - Taille ou forme (par défaut : petit avatar rond)
 */
export function UserAvatar({ user, className }: { user: UserSummary; className?: string }) {
  return (
    <Avatar className={cn("size-6", className)} title={user.name}>
      <AvatarFallback className="text-[0.65rem]">
        <span aria-hidden>{initials(user.name)}</span>
        <span className="sr-only">{user.name}</span>
      </AvatarFallback>
    </Avatar>
  );
}
