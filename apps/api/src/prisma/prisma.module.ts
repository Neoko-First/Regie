import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

/** Module global : `PrismaService` est injectable dans tous les modules métier. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
