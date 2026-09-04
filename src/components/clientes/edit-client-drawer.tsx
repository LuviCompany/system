"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ClientForm, type ClientFormValues } from "@/components/clientes/client-form";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { updateClientAction } from "@/server/clients/actions";

interface EditClientDrawerProps {
  clientId: string;
  initialValues: Partial<ClientFormValues>;
  teamMembers: { id: string; name: string }[];
  trigger?: React.ReactNode;
}

export function EditClientDrawer({ clientId, initialValues, teamMembers, trigger }: EditClientDrawerProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <Pencil className="h-4 w-4" aria-hidden />
            Editar
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Editar cliente</DrawerTitle>
          <DrawerDescription>Atualize os dados cadastrais desta conta.</DrawerDescription>
        </DrawerHeader>
        <ClientForm
          teamMembers={teamMembers}
          initialValues={initialValues}
          submitLabel="Salvar alterações"
          onSubmit={(input) => updateClientAction(clientId, input)}
          onCancel={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DrawerContent>
    </Drawer>
  );
}
