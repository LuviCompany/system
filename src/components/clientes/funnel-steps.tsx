import { formatNumber, formatPercent } from "@/lib/format";
import type { FunnelStep } from "@/modules/clientes/types";

interface FunnelStepsProps {
  steps: FunnelStep[];
}

export function FunnelSteps({ steps }: FunnelStepsProps) {
  const max = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className="space-y-2">
      {steps.map((step, index) => {
        const widthPercent = Math.max((step.value / max) * 100, 4);
        const previous = index > 0 ? steps[index - 1].value : null;
        const conversionRate = previous && previous > 0 ? (step.value / previous) * 100 : null;

        return (
          <div key={step.key} className="flex items-center gap-3">
            <div className="w-28 shrink-0 text-right text-xs font-medium text-ink-500">{step.label}</div>
            <div className="flex-1">
              <div
                className="flex h-9 items-center justify-end rounded-md bg-brand-500/90 pr-3 text-xs font-semibold text-white transition-all"
                style={{ width: `${widthPercent}%`, minWidth: "5.5rem" }}
              >
                {formatNumber(step.value)}
              </div>
            </div>
            <div className="w-16 shrink-0 text-xs text-ink-400">
              {conversionRate !== null ? formatPercent(conversionRate) : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}
