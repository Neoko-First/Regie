"use client";

import { evaluatePassword, PASSWORD_RULES } from "@regie/shared";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Libellé de force selon le nombre de critères respectés. */
function strengthLabel(score: number): string {
  if (score === PASSWORD_RULES.length) return "Fort";
  if (score >= PASSWORD_RULES.length - 1) return "Correct";
  if (score >= 2) return "Faible";
  return "Très faible";
}

/** Ton de la jauge : la couleur accompagne toujours le libellé, jamais seule. */
function strengthTone(score: number): string {
  if (score === PASSWORD_RULES.length) return "bg-success";
  if (score >= PASSWORD_RULES.length - 1) return "bg-warning";
  return "bg-destructive";
}

/**
 * Indicateur de force du mot de passe en temps réel, avec la liste des critères cochés
 * au fur et à mesure (CLAUDE.md §12.2). Les critères viennent de la politique partagée
 * avec l'API : l'UI ne peut pas diverger du serveur.
 *
 * @param props.password - Mot de passe en cours de saisie
 */
export function PasswordStrength({ password }: { password: string }) {
  const { passed, score } = evaluatePassword(password);

  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1" aria-hidden>
          {PASSWORD_RULES.map((rule, index) => (
            <span
              key={rule.id}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                index < score ? strengthTone(score) : "bg-secondary",
              )}
            />
          ))}
        </div>
        <span className="text-caption text-muted-foreground w-20 text-right">
          {password ? strengthLabel(score) : ""}
        </span>
      </div>
      <ul className="grid gap-1 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const ok = passed.includes(rule.id);
          return (
            <li
              key={rule.id}
              className={cn(
                "text-body-sm flex items-center gap-1.5",
                ok ? "text-success" : "text-muted-foreground",
              )}
            >
              {ok ? <Check className="size-4" aria-hidden /> : <X className="size-4" aria-hidden />}
              <span>
                {rule.label}
                <span className="sr-only">{ok ? " : respecté" : " : manquant"}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
