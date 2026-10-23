"use client";

import { createSpaceSchema, hasAnyRole } from "@regie/shared";
import { FolderKanban, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FieldGroup } from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormDialog } from "@/components/ui-extended/form-dialog";
import { TextareaField, TextField } from "@/components/ui-extended/form-fields";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { isTempId } from "@/lib/optimistic";
import { cn } from "@/lib/utils";
import { adminSpacePath } from "../constants";
import { useCreateSpace } from "../hooks/use-space-admin";
import { useSpaces } from "../hooks/use-spaces";

/**
 * Bouton et modale « Nouvel espace », réservés à l'administrateur de la plateforme
 * (rien n'est rendu pour les autres). À rendre sous un <Suspense>.
 */
export function CreateSpaceButton() {
  const user = useCurrentUser();
  const createSpace = useCreateSpace();
  const [open, setOpen] = useState(false);
  if (!user.isPlatformAdmin) return null;

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus /> Nouvel espace
      </Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Nouvel espace"
        description="Vous en devenez admin : vous pourrez ensuite y ajouter des membres."
        schema={createSpaceSchema}
        defaultValues={{ key: "", name: "", description: "" }}
        submitLabel="Créer l’espace"
        onSubmit={(values) => createSpace.mutate(values)}
      >
        {(form) => (
          <FieldGroup>
            <TextField control={form.control} name="name" label="Nom" autoFocus />
            <TextField
              control={form.control}
              name="key"
              label="Clé"
              placeholder="Ex. SOC"
              className="font-mono uppercase"
              description="Préfixe des identifiants d’évolution (SOC-12). Elle ne pourra plus changer."
            />
            <TextareaField control={form.control} name="description" label="Description" />
          </FieldGroup>
        )}
      </FormDialog>
    </>
  );
}

/**
 * Espaces que l'utilisateur administre (tous pour l'administrateur de la plateforme),
 * avec l'accès à la gestion de leurs membres. À rendre sous un <Suspense>.
 */
export function AdminSpacesList() {
  const spaces = useSpaces().filter((space) => hasAnyRole(space.myRoles, ["ADMIN"]));

  if (spaces.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderKanban />
          </EmptyMedia>
          <EmptyTitle>Aucun espace à administrer</EmptyTitle>
          <EmptyDescription>
            Vous n’êtes admin d’aucun espace. L’administrateur de la plateforme peut vous nommer
            admin d’un espace.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">Clé</TableHead>
          <TableHead>Nom</TableHead>
          <TableHead className="hidden md:table-cell">Description</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {spaces.map((space) => {
          const pending = isTempId(space.id);
          return (
            <TableRow key={space.id} className={cn(pending && "opacity-60")}>
              <TableCell className="text-code-sm">{space.key}</TableCell>
              <TableCell className="font-medium">{space.name}</TableCell>
              <TableCell className="text-muted-foreground hidden w-full max-w-0 truncate md:table-cell">
                {space.description || "—"}
              </TableCell>
              <TableCell className="text-right">
                {pending ? (
                  <span className="text-caption text-muted-foreground">Création…</span>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link href={adminSpacePath(space.key)}>
                      <Users /> Gérer les membres
                    </Link>
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
