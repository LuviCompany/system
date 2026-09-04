"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Calendar, Check } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export interface DateRangePreset {
  value: string;
  label: string;
}

const DEFAULT_PRESETS: DateRangePreset[] = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "14d", label: "Últimos 14 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "mtd", label: "Este mês" },
];

interface DateRangePickerProps {
  presets?: DateRangePreset[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function DateRangePicker({
  presets = DEFAULT_PRESETS,
  defaultValue = presets[2]?.value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const selected = presets.find((preset) => preset.value === value) ?? presets[0];

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm font-medium text-ink-800 shadow-sm transition-colors hover:bg-surface-subtle",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
            className,
          )}
        >
          <Calendar className="h-4 w-4 text-ink-500" aria-hidden />
          {selected?.label}
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={6}
          className="z-50 w-52 rounded-md border border-border bg-surface p-1 shadow-popover"
        >
          {presets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => {
                setValue(preset.value);
                onChange?.(preset.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm text-ink-700 transition-colors hover:bg-surface-subtle",
                preset.value === value && "font-medium text-ink-900",
              )}
            >
              {preset.label}
              {preset.value === value && <Check className="h-3.5 w-3.5 text-brand-500" aria-hidden />}
            </button>
          ))}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
