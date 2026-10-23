// Données de développement (CLAUDE.md §14). Lancer : pnpm --filter @regie/api db:seed
// Idempotent : peut être relancé sans créer de doublons. Ne jamais exécuter en production.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  type ChangeNature,
  type ChangeStatus,
  emailSchema,
  passwordSchema,
  type SpaceRole,
} from "@regie/shared";
import { PasswordService } from "../src/auth/password.service";
import { PrismaClient } from "../src/generated/prisma/client";

/** Comptes de développement. Le mot de passe commun vient de SEED_USER_PASSWORD (.env). */
const DEV_USERS = [
  { email: "alexandre@regie.test", name: "Alexandre", isPlatformAdmin: true },
  { email: "po@regie.test", name: "Paula Ordonneau", isPlatformAdmin: false },
  { email: "recette@regie.test", name: "Rémi Cettier", isPlatformAdmin: false },
] as const;

type DevEmail = (typeof DEV_USERS)[number]["email"];

/** Espaces (domaines de la plateforme cible, D-073) et rôles de chaque compte. */
const DEV_SPACES: ReadonlyArray<{
  key: string;
  name: string;
  description: string;
  members: Partial<Record<DevEmail, SpaceRole[]>>;
}> = [
  {
    key: "SOC",
    name: "Socle",
    description: "Droits, organisations et sociétés, mandats.",
    members: {
      "alexandre@regie.test": ["ADMIN", "LEAD_TECH", "DEV"],
      "po@regie.test": ["PO"],
      "recette@regie.test": ["TESTER"],
    },
  },
  {
    key: "PAIE",
    name: "Paie",
    description: "Paramétrage société, organismes, déclaratif.",
    members: {
      "alexandre@regie.test": ["ADMIN", "LEAD_TECH", "DEV"],
      "po@regie.test": ["PO"],
      "recette@regie.test": ["TESTER"],
    },
  },
  {
    key: "OUT",
    name: "Outils internes",
    description: "Régie, recette.",
    members: { "alexandre@regie.test": ["ADMIN", "PO", "LEAD_TECH", "DEV"] },
  },
];

/** Évolutions d'exemple, réparties sur le cycle pour remplir le board. */
const DEV_CHANGES: ReadonlyArray<{
  space: string;
  title: string;
  nature: ChangeNature;
  status: ChangeStatus;
  author: DevEmail;
}> = [
  {
    space: "SOC",
    title: "Gestion des droits par rôle sur les organisations",
    nature: "EVOLUTION",
    status: "IN_REVIEW",
    author: "alexandre@regie.test",
  },
  {
    space: "SOC",
    title: "Rendre le paramétrage société plus intuitif",
    nature: "MODIFICATION",
    status: "DRAFT",
    author: "po@regie.test",
  },
  {
    space: "SOC",
    title: "Le bouton Enregistrer reste actif sans modification",
    nature: "CORRECTION",
    status: "IN_DEVELOPMENT",
    author: "recette@regie.test",
  },
  {
    space: "PAIE",
    title: "Organismes du dossier de paie",
    nature: "TAKEOVER",
    status: "DESIGN",
    author: "po@regie.test",
  },
  {
    space: "PAIE",
    title: "Calcul des cotisations mutuelle",
    nature: "TAKEOVER",
    status: "IN_TESTING",
    author: "alexandre@regie.test",
  },
];

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
    const userIds = new Map<string, string>();
    for (const user of DEV_USERS) {
      const email = emailSchema.parse(user.email);
      const saved = await prisma.user.upsert({
        where: { email },
        update: {
          name: user.name,
          passwordHash,
          isPlatformAdmin: user.isPlatformAdmin,
          failedLoginCount: 0,
          lockedUntil: null,
        },
        create: { email, name: user.name, passwordHash, isPlatformAdmin: user.isPlatformAdmin },
      });
      userIds.set(email, saved.id);
    }

    for (const { members, ...space } of DEV_SPACES) {
      const saved = await prisma.space.upsert({
        where: { key: space.key },
        update: space,
        create: space,
      });
      for (const [email, roles] of Object.entries(members)) {
        const userId = userIds.get(email)!;
        await prisma.membership.upsert({
          where: { spaceId_userId: { spaceId: saved.id, userId } },
          update: { roles },
          create: { spaceId: saved.id, userId, roles },
        });
      }
    }

    // Évolutions d'exemple : créées une seule fois (on ne touche pas aux données saisies)
    if ((await prisma.change.count()) === 0) {
      for (const change of DEV_CHANGES) {
        const { id: spaceId, changeCounter } = await prisma.space.update({
          where: { key: change.space },
          data: { changeCounter: { increment: 1 } },
        });
        const authorId = userIds.get(change.author)!;
        await prisma.change.create({
          data: {
            spaceId,
            number: changeCounter,
            title: change.title,
            nature: change.nature,
            status: change.status,
            authorId,
            proposal: `## Pourquoi\n\nExemple généré par le seed.\n\n## Quoi\n\n${change.title}.`,
            activities: { create: { actorId: authorId, type: "CREATED" } },
          },
        });
      }
    }

    console.warn(
      `Seed terminé : ${DEV_USERS.length} comptes, ${DEV_SPACES.length} espaces, ` +
        `${await prisma.change.count()} évolutions.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
