// Données de développement (CLAUDE.md §14). Lancer : pnpm --filter @regie/api db:seed
// Idempotent : peut être relancé sans créer de doublons. Ne jamais exécuter en production.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { emailSchema, passwordSchema } from "@regie/shared";
import { PasswordService } from "../src/auth/password.service";
import { PrismaClient } from "../src/generated/prisma/client";

/** Comptes de développement. Le mot de passe commun vient de SEED_USER_PASSWORD (.env). */
const DEV_USERS = [
  { email: "alexandre@regie.test", name: "Alexandre" },
  { email: "po@regie.test", name: "Paula Ordonneau" },
  { email: "recette@regie.test", name: "Rémi Cettier" },
] as const;

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Le seed de développement ne doit pas être lancé en production.");
  }
  // Le mot de passe de seed respecte la même politique que les vrais comptes
  const password = passwordSchema.parse(process.env.SEED_USER_PASSWORD);
  const passwordHash = await new PasswordService().hash(password);

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    for (const user of DEV_USERS) {
      const email = emailSchema.parse(user.email);
      await prisma.user.upsert({
        where: { email },
        update: { name: user.name, passwordHash, failedLoginCount: 0, lockedUntil: null },
        create: { email, name: user.name, passwordHash },
      });
    }
    console.warn(`Seed terminé : ${DEV_USERS.length} comptes de développement.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
