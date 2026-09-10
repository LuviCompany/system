"use client";

import { Bell, ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ROLE_LABELS, initials } from "@/modules/team/roles";
import type { UserRole } from "@/server/auth/session";

interface HeaderProps {
  organizationName: string;
  user: { name: string; email: string; role: UserRole };
  notifications: string[];
}

export function Header({ organizationName, user, notifications }: HeaderProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <MobileSidebar />
        <div>
          <p className="text-sm font-semibold text-ink-900">{organizationName}</p>
          <p className="text-xs text-ink-500">Operação comercial</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Notificações"
              className="relative flex h-9 w-9 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-surface-sunken hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <Bell className="h-4 w-4" aria-hidden />
              {notifications.length > 0 && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-2 py-3 text-sm text-ink-500">Nenhuma notificação por aqui.</div>
            ) : (
              notifications.map((message) => (
                <div key={message} className="px-2 py-3 text-sm text-ink-600">
                  {message}
                </div>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md py-1.5 pl-1.5 pr-2 text-sm transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <Avatar>
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-medium text-ink-900">{user.name}</span>
                <span className="block text-xs text-ink-500">{ROLE_LABELS[user.role]}</span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-ink-400" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push("/perfil")}>
              <UserRound className="h-4 w-4" aria-hidden />
              Meu perfil
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/configuracoes")}>
              <Settings className="h-4 w-4" aria-hidden />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={signingOut} onSelect={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden />
              {signingOut ? "Saindo..." : "Sair"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
