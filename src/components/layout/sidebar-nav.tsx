"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { navSections, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-chrome-border px-5">
        <Logo />
      </div>

      <nav aria-label="Navegação principal" className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {navSections.map((section, index) => (
          <div key={section.label ?? `section-${index}`}>
            {section.label && (
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-chrome-fg-muted">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
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
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-chrome-border px-5 py-4">
        <p className="text-[11px] leading-snug text-chrome-fg-muted">{siteConfig.tagline}</p>
      </div>
    </div>
  );
}
