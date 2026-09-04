"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ClientForm } from "@/components/clientes/client-form";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { createClientAction } from "@/server/clients/actions";

interface NewClientDrawerProps {
  teamMembers: { id: string; name: string }[];
}

export function NewClientDrawer({ teamMembers }: NewClientDrawerProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" aria-hidden />
          Novo cliente
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Novo cliente</DrawerTitle>
          <DrawerDescription>Cadastre uma conta gerida pela Luvi (mídia paga e/ou social media).</DrawerDescription>
        </DrawerHeader>
        <ClientForm
          teamMembers={teamMembers}
          onSubmit={createClientAction}
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
