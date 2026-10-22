import { Injectable, type PipeTransform } from "@nestjs/common";
import { spaceKeySchema } from "@regie/shared";
import { notFound } from "../common/errors/domain-errors";

/**
 * Valide et normalise une clé d'espace reçue dans l'URL (« soc » → « SOC »).
 * Une clé mal formée ne peut correspondre à aucun espace : 404.
 */
@Injectable()
export class SpaceKeyPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const result = spaceKeySchema.safeParse(value);
    if (!result.success) throw notFound("Espace introuvable.");
    return result.data;
  }
}
