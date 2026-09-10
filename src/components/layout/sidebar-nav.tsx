"use client";

import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { LogoMark } from "@/components/brand/logo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { navSections, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  onNavigate?: () => void;
  /** Modo "rail" (só ícones) — nunca usado pelo drawer mobile, só pela sidebar desktop minimizada. */
  collapsed?: boolean;
  /** Só existe na sidebar desktop (o botão de minimizar/expandir vive na mesma faixa do logo). O drawer mobile não passa isso. */
  onToggleCollapsed?: () => void;
}

function findActiveSectionLabel(pathname: string | null): string | null {
  for (const section of navSections) {
    if (!section.label) continue;
    const hasActiveItem = section.items.some((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`));
    if (hasActiveItem) return section.label;
  }
  return null;
}

function CollapseToggleButton({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Expandir menu" : "Minimizar menu"}
      title={collapsed ? "Expandir menu" : "Minimizar menu"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-chrome-fg-muted transition-colors hover:bg-chrome-bg-elevated hover:text-chrome-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      {collapsed ? <PanelLeftOpen className="h-4 w-4" aria-hidden /> : <PanelLeftClose className="h-4 w-4" aria-hidden />}
    </button>
  );
}

export function SidebarNav({ onNavigate, collapsed = false, onToggleCollapsed }: SidebarNavProps) {
  const pathname = usePathname();
  const activeSectionLabel = findActiveSectionLabel(pathname);

  // Estado do acordeão: por padrão, um grupo está aberto se for o grupo da
  // rota ativa — sem precisar de efeito algum, isso já se ajusta sozinho a
  // cada navegação. `manualOverrides` só guarda os grupos que o usuário
  // abriu/fechou manualmente por cima desse padrão (mais de um grupo pode
  // ficar aberto ao mesmo tempo, de propósito).
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({});

  function isSectionOpen(label: string): boolean {
    return manualOverrides[label] ?? label === activeSectionLabel;
  }

  function toggleSection(label: string) {
    setManualOverrides((prev) => ({ ...prev, [label]: !isSectionOpen(label) }));
  }

  if (collapsed) {
    return (
      <TooltipProvider>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-center border-b border-chrome-border">
            {onToggleCollapsed ? <CollapseToggleButton collapsed onToggle={onToggleCollapsed} /> : <LogoMark />}
          </div>

          <nav aria-label="Navegação principal" className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
            {navSections.map((section, index) => (
              <div key={section.label ?? `section-${index}`} className="space-y-0.5">
                {section.separatorBefore && <hr className="mx-1 mb-4 border-t border-chrome-border" />}
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Tooltip key={item.href} delayDuration={200}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          aria-label={item.label}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-md border-l-2 border-transparent transition-colors",
                            isActive
                              ? "border-brand-500 bg-chrome-bg-elevated text-chrome-fg"
                              : "text-chrome-fg-muted hover:bg-chrome-bg-elevated hover:text-chrome-fg",
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between gap-2 border-b border-chrome-border pl-5 pr-3">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
          <LogoMark />
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-chrome-fg">LUVI</span>
            <span className="block text-[11px] tracking-wide text-chrome-fg-muted">SYSTEM</span>
          </span>
        </Link>
        {onToggleCollapsed && <CollapseToggleButton collapsed={false} onToggle={onToggleCollapsed} />}
      </div>

      <nav aria-label="Navegação principal" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navSections.map((section, index) => {
          if (!section.label) {
            // Item solto (Dashboard) — não é um grupo, não tem acordeão.
            return (
              <div key={`section-${index}`} className="space-y-0.5 pb-3">
                {section.items.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
                ))}
              </div>
            );
          }

          const isOpen = isSectionOpen(section.label);
          return (
            <div key={section.label}>
              {section.separatorBefore && <hr className="mx-3 mb-3 border-t border-chrome-border" />}
              <button
                type="button"
                onClick={() => toggleSection(section.label!)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-chrome-fg-muted transition-colors hover:text-chrome-fg"
              >
                {section.label}
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} aria-hidden />
              </button>
              {isOpen && (
                <div className="space-y-0.5 pb-2 pt-0.5">
                  {section.items.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-chrome-border px-5 py-4">
        <p className="text-[11px] leading-snug text-chrome-fg-muted">{siteConfig.tagline}</p>
      </div>
    </div>
  );
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: { label: string; href: string; icon: (typeof navSections)[number]["items"][number]["icon"] };
  pathname: string | null;
  onNavigate?: () => void;
}) {
  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md border-l-2 border-transparent px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "border-brand-500 bg-chrome-bg-elevated text-chrome-fg"
          : "text-chrome-fg-muted hover:bg-chrome-bg-elevated hover:text-chrome-fg",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {item.label}
    </Link>
  );
}
