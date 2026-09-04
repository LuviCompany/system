import { LEAD_SOURCE_LABELS, type LeadSourceValue } from "@/modules/leads/constants";

export function LeadSourceBadge({ source }: { source: LeadSourceValue }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-medium text-ink-700">
      {LEAD_SOURCE_LABELS[source]}
    </span>
  );
}
