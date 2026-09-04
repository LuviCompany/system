"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

export const DrawerContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink-950/70" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-surface shadow-popover focus:outline-none",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className="absolute right-4 top-4 rounded-md p-1 text-ink-400 transition-colors hover:bg-surface-sunken hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DrawerContent.displayName = DialogPrimitive.Content.displayName;

export function DrawerHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1.5 border-b border-border px-6 py-5", className)} {...props} />;
}

export const DrawerTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("text-base font-semibold text-ink-900", className)} {...props} />
));
DrawerTitle.displayName = DialogPrimitive.Title.displayName;

export const DrawerDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-ink-500", className)} {...props} />
));
DrawerDescription.displayName = DialogPrimitive.Description.displayName;

export function DrawerBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-y-auto px-6 py-5", className)} {...props} />;
}

export function DrawerFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex justify-end gap-2 border-t border-border px-6 py-4", className)} {...props} />;
}
