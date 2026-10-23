import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { UserSummary } from "@regie/shared";
import { toUserSummary, USER_SUMMARY_SELECT } from "../common/user-summary";
import { PrismaService } from "../prisma/prisma.service";

/** Annuaire des utilisateurs (choix d'un assigné, ajout d'un membre). */
@ApiTags("Utilisateurs")
@Controller("users")
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  /** Utilisateurs actifs, triés par nom. Outil interne : visible par toute personne connectée. */
  @Get()
  async list(): Promise<UserSummary[]> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: USER_SUMMARY_SELECT,
      orderBy: { name: "asc" },
    });
    return users.map(toUserSummary);
  }
}
