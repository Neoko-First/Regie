import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Rendu markdown (specs, commentaires), avec tableaux et listes de tâches (GFM).
 * Le HTML brut contenu dans le texte n'est pas interprété (react-markdown l'ignore par défaut) :
 * pas de risque d'injection de script.
 *
 * @param props.children - Texte markdown
 * @param props.className - Classes supplémentaires
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
