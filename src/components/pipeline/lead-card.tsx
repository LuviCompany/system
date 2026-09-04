"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { ScoreBadge } from "@/components/leads/score-badge";
import { TagList } from "@/components/leads/tag-list";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { PIPELINE_STAGES } from "@/modules/leads/constants";
import type { LeadWithRelations } from "@/server/leads/lead.service";

interface LeadCardProps {
  lead: LeadWithRelations;
  onMoveStage: (leadId: string, stage: string) => void;
  onOpen: (leadId: string) => void;
}

export function LeadCard({ lead, onMoveStage, onOpen }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { stage: lead.stage },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="space-y-2 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-brand-500/60"
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpen(lead.id)}
          className="text-left text-sm font-semibold text-ink-900 hover:text-brand-500 focus-visible:outline-none focus-visible:underline"
        >
          {lead.company}
        </button>
        <button
          type="button"
          aria-label={`Arrastar lead ${lead.company}`}
          className="shrink-0 cursor-grab touch-none rounded p-1 text-ink-300 hover:bg-surface-sunken hover:text-ink-500 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden>
            <circle cx="2" cy="2" r="1.5" />
            <circle cx="8" cy="2" r="1.5" />
            <circle cx="2" cy="8" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="2" cy="14" r="1.5" />
            <circle cx="8" cy="14" r="1.5" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-ink-500">{lead.segment ?? "Sem segmento"}</p>

      <div className="flex flex-wrap items-center gap-1.5">
        <ScoreBadge score={lead.icpScore} />
        {lead.potentialValue && (
          <span className="text-xs font-medium text-ink-700">{formatCurrency(Number(lead.potentialValue))}</span>
        )}
      </div>

      <TagList tags={lead.tags} />

      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="truncate text-xs text-ink-500">{lead.responsavel?.name ?? "Sem responsável"}</span>
      </div>

      <label className="block">
        <span className="sr-only">Mover lead para outra etapa</span>
        <Select value={lead.stage} onValueChange={(value) => onMoveStage(lead.id, value)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PIPELINE_STAGES.map((stage) => (
              <SelectItem key={stage.value} value={stage.value}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    </div>
  );
}
