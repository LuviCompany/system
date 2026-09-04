"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { LeadForm } from "@/components/leads/lead-form";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { createLeadAction } from "@/server/leads/actions";

interface NewLeadDrawerProps {
  availableTags: { id: string; name: string }[];
  teamMembers: { id: string; name: string }[];
}

export function NewLeadDrawer({ availableTags, teamMembers }: NewLeadDrawerProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" aria-hidden />
          Novo lead
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Novo lead</DrawerTitle>
          <DrawerDescription>Cadastre uma nova empresa prospectada pelo time comercial.</DrawerDescription>
        </DrawerHeader>
        <LeadForm
          availableTags={availableTags}
          teamMembers={teamMembers}
          onSubmit={createLeadAction}
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
