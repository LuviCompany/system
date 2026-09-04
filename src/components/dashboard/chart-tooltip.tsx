"use client";

interface TooltipPayloadEntry {
  name?: string;
  value?: number | string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipPayloadEntry[];
  labelFormatter?: (label: string | number) => string;
  valueFormatter?: (value: number | string) => string;
}

export function ChartTooltip({ active, label, payload, labelFormatter, valueFormatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 shadow-popover">
      {label !== undefined && (
        <p className="mb-1.5 text-xs font-medium text-ink-500">{labelFormatter ? labelFormatter(label) : label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={`${entry.name}-${index}`} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden />
            <span className="text-ink-600">{entry.name}</span>
            <span className="font-mono font-medium text-ink-900">
              {valueFormatter && entry.value !== undefined ? valueFormatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
