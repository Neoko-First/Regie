"use client";

import { CONTRIBUTOR_ROLES, createChangeSchema, hasAnyRole } from "@regie/shared";
import { Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { FormDialog } from "@/components/ui-extended/form-dialog";
import { SelectField, TextareaField, TextField } from "@/components/ui-extended/form-fields";
import { useSpaces } from "@/features/spaces/hooks/use-spaces";
import { useCreateChangeStore } from "@/stores/create-change-store";
import { NATURE_OPTIONS, PRIORITY_OPTIONS } from "../constants";
import { useCreateChange } from "../hooks/use-changes";
import { parseChangeFilters } from "../lib/filters";

/**
 * Modale « Nouvelle évolution ». Création optimiste : la modale se ferme dès la soumission,
 * la carte apparaît aussitôt dans la liste affichée. Montée une fois dans le layout.
 */
export function CreateChangeDialog() {
  const open = useCreateChangeStore((s) => s.open);
  const setOpen = useCreateChangeStore((s) => s.setOpen);
  const { filters } = parseChangeFilters(useSearchParams());
  const spaces = useSpaces().filter((space) => hasAnyRole(space.myRoles, CONTRIBUTOR_ROLES));
  const createChange = useCreateChange(filters);

  // Espace proposé : celui du filtre courant s'il est accessible, sinon le premier
  const defaultSpace =
    spaces.find((space) => space.key === filters.space)?.key ?? spaces[0]?.key ?? "";

  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      title="Nouvelle évolution"
      description="Elle est créée en brouillon ; vous pourrez la compléter avant de la soumettre en revue."
      schema={createChangeSchema}
      defaultValues={{
        spaceKey: defaultSpace,
        title: "",
        nature: "EVOLUTION",
        priority: "MEDIUM",
        proposal: "",
      }}
      submitLabel="Créer l’évolution"
      onSubmit={(values) => createChange.mutate(values)}
    >
      {(form) => (
        <FieldGroup>
          <SelectField
            control={form.control}
            name="spaceKey"
            label="Espace"
            options={spaces.map((space) => ({
              value: space.key,
              label: space.name,
              hint: space.key,
            }))}
          />
          <TextField control={form.control} name="title" label="Titre" autoFocus />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              control={form.control}
              name="nature"
              label="Nature"
              options={NATURE_OPTIONS}
              description="Le comportement attendu est-il déjà décrit ?"
            />
            <SelectField
              control={form.control}
              name="priority"
              label="Priorité"
              options={PRIORITY_OPTIONS}
            />
          </div>
          <TextareaField
            control={form.control}
            name="proposal"
            label="Proposal (facultatif)"
            description="Le pourquoi et le quoi, en markdown."
            rows={6}
          />
        </FieldGroup>
      )}
    </FormDialog>
  );
}

/** Bouton d'ouverture de la modale de création. */
export function NewChangeButton() {
  const setOpen = useCreateChangeStore((s) => s.setOpen);
  return (
    <Button size="sm" onClick={() => setOpen(true)}>
      <Plus /> Nouvelle évolution
    </Button>
  );
}
