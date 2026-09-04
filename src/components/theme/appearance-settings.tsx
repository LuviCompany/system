"use client";

import { Check, Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme/use-theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { THEME_LABELS, THEME_VALUES } from "@/modules/theme/constants";

const THEME_ICONS = { light: Sun, dark: Moon };

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aparência</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 pt-4 sm:max-w-sm">
        {THEME_VALUES.map((value) => {
          const Icon = THEME_ICONS[value];
          const selected = theme === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              aria-pressed={selected}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md border px-4 py-3 text-sm font-medium transition-colors",
                selected
                  ? "border-brand-500 bg-brand-50 text-brand-500"
                  : "border-border bg-surface text-ink-600 hover:bg-surface-subtle",
              )}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" aria-hidden />
                {THEME_LABELS[value]}
              </span>
              {selected && <Check className="h-4 w-4" aria-hidden />}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
