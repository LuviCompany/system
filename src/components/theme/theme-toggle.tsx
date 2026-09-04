"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme/use-theme";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Alterar tema"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-surface-sunken hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              className,
            )}
          >
            {isDark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
          </button>
        </TooltipTrigger>
        <TooltipContent>Alterar tema</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
