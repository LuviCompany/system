"use client";

import { useDroppable } from "@dnd-kit/core";

import { LeadCard } from "@/components/pipeline/lead-card";
import { cn } from "@/lib/utils";
import type { LeadWithRelations } from "@/server/leads/lead.service";

interface KanbanColumnProps {
  stage: string;
  label: string;
  leads: LeadWithRelations[];
  onMoveStage: (leadId: string, stage: string) => void;
  onOpen: (leadId: string) => void;
}

export function KanbanColumn({ stage, label, leads, onMoveStage, onOpen }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-well">
      <div className="flex items-center justify-between px-3 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-600">{label}</h3>
        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-ink-500">{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 overflow-y-auto rounded-b-lg p-2 transition-colors",
          isOver && "bg-brand-500/10",
        )}
        style={{ minHeight: 120 }}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onMoveStage={onMoveStage} onOpen={onOpen} />
        ))}
        {leads.length === 0 && <p className="px-2 py-4 text-center text-xs text-ink-400">Nenhum lead aqui.</p>}
      </div>
    </div>
  );
}
