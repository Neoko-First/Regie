import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { InboxContent } from "@regie/shared";
import type { AuthContext } from "../auth/auth.types";
import { CurrentAuth } from "../auth/decorators/current-auth.decorator";
import { InboxService } from "./inbox.service";

/** « Ma boîte » de l'utilisateur connecté. */
@ApiTags("Ma boîte")
@Controller("inbox")
export class InboxController {
  constructor(private readonly inbox: InboxService) {}

  /** Gates à valider et évolutions assignées. */
  @Get()
  get(@CurrentAuth() auth: AuthContext): Promise<InboxContent> {
    return this.inbox.get(auth);
  }
}
