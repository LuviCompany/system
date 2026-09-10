"use client";

import { useState } from "react";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SIDEBAR_COLLAPSED_COOKIE } from "@/modules/sidebar/constants";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Grava o cookie direto no cliente (síncrono), mesmo raciocínio de
 * persistThemeCookie em components/theme/use-theme.ts — evita qualquer
 * corrida entre a escrita do cookie e uma navegação/refresh subsequente.
 */
function persistSidebarCollapsedCookie(collapsed: boolean) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=${collapsed ? "1" : "0"}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure}`;
}

interface SidebarProps {
  /** Lido no server (dashboard layout) a partir do cookie — evita flash do estado errado na primeira renderização. */
  defaultCollapsed: boolean;
}

export function Sidebar({ defaultCollapsed }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    persistSidebarCollapsedCookie(next);
  }

  return (
    <aside
      className={
        "hidden h-screen shrink-0 border-r border-chrome-border bg-chrome-bg text-chrome-fg transition-[width] duration-150 lg:block " +
        (collapsed ? "lg:w-[68px]" : "lg:w-60")
      }
    >
      <SidebarNav collapsed={collapsed} onToggleCollapsed={toggle} />
    </aside>
  );
}
