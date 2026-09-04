"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { SidebarNav } from "@/components/layout/sidebar-nav";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Abrir menu de navegação"
          className="flex h-9 w-9 items-center justify-center rounded-md text-ink-600 transition-colors hover:bg-surface-sunken lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink-950/70 lg:hidden" />
        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 w-64 border-r border-chrome-border bg-chrome-bg text-chrome-fg shadow-popover focus:outline-none lg:hidden">
          <DialogPrimitive.Title className="sr-only">Menu de navegação</DialogPrimitive.Title>
          <DialogPrimitive.Close
            aria-label="Fechar menu"
            className="absolute right-3 top-4 rounded-md p-1.5 text-chrome-fg-muted transition-colors hover:bg-chrome-bg-elevated hover:text-chrome-fg"
          >
            <X className="h-4 w-4" aria-hidden />
          </DialogPrimitive.Close>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
