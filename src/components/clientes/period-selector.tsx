"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PERIOD_PRESET_LABELS, type PeriodPreset } from "@/modules/clientes/constants";

interface PeriodSelectorProps {
  value: PeriodPreset;
}

export function PeriodSelector({ value }: PeriodSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(PERIOD_PRESET_LABELS).map(([key, label]) => (
          <SelectItem key={key} value={key}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
